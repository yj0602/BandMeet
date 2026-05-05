"use client";

import { Fragment, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Clock, Calendar as CalendarIcon, Check, User, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { timeToMinutes } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import GuideHelpButton from "@/components/common/GuideHelpButton";

export default function ReservationEnsembleResult() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get("id"); // URL에서 ?id=... 값을 가져옴

    const [ensembleData, setEnsembleData] = useState<any>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const [excludedUsers, setExcludedUsers] = useState<Set<string>>(new Set());
    const [visibleHeatmapWeekStart, setVisibleHeatmapWeekStart] = useState<string | null>(null);

    const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAllData = async () => {
        if (!roomId) return;
        
        try {
            const [roomRes, responsesRes] = await Promise.all([
                supabase.from("ensemble_rooms").select("*").eq("id", roomId).single(),
                supabase.from("ensemble_availability").select("*").eq("room_id", roomId)
            ]);
            if (roomRes.error || !roomRes.data) {
                // 방이 삭제되었거나 존재하지 않는 경우 처리
                alert("존재하지 않거나 이미 확정이 완료되어 종료된 조율 방입니다.");
                router.replace("/");
                return;
            }
            if (roomRes.data) {
                if (roomRes.data.status === 'confirmed') {
                    alert("이미 최종 확정이 완료된 합주입니다. 메인 화면에서 확인해주세요.");
                    router.replace("/");
                    return;
                }
                setEnsembleData({
                    title: roomRes.data.title,
                    location: roomRes.data.location,
                    dates: roomRes.data.target_dates,
                    startTime: roomRes.data.start_time_limit,
                    endTime: roomRes.data.end_time_limit
                });
            }

            if (responsesRes.data) {
                const mappedResponses = responsesRes.data.map(r => ({
                    userName: r.user_name,
                    sessions: r.selected_sessions,
                    availableSlots: r.available_slots
                }));
                setResponses(mappedResponses);
            }
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    // useEffect 내부에서 초기 로드 및 실시간 구독 설정
    useEffect(() => {
        setUserName(localStorage.getItem("ensembleUser") || "방문자");
        
        // 초기 데이터 로드
        fetchAllData();

        // 참여자 응답 감시
        const availabilityChannel = supabase
            .channel(`availability-updates-${roomId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'ensemble_availability', 
                filter: `room_id=eq.${roomId}` 
            }, () => fetchAllData())
            .subscribe();

        // 방 상태 및 삭제 감시
        const roomChannel = supabase
            .channel(`room-status-${roomId}`)
            .on('postgres_changes', {
                event: '*', // UPDATE 또는 DELETE 감지
                schema: 'public',
                table: 'ensemble_rooms',
                filter: `id=eq.${roomId}`
            }, (payload) => {
                // 방이 삭제되었거나(DELETE), 상태가 'confirmed'로 변경되었다면(UPDATE)
                if (payload.eventType === 'DELETE' || (payload.new && payload.new.status === 'confirmed')) {
                    router.replace("/");
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(availabilityChannel);
            supabase.removeChannel(roomChannel);
        };
    }, [roomId]);

    // 멤버 클릭 시 토글 함수
    const toggleUser = (userName: string) => {
      setExcludedUsers((prev) => {
        const next = new Set(prev);
        if (next.has(userName)) {
          next.delete(userName); // 다시 포함 (활성화)
        } else {
          next.add(userName); // 제외 (비활성화)
        }
        return next;
      });
    };

    // 컴포넌트 내부 상단에 추가
    const commonTimes = useMemo(() => {
        // 제외되지 않은(활성화된) 멤버들만 골라냅니다.
        const activeResponses = responses.filter(r => !excludedUsers.has(r.userName));

        // 활성화된 멤버가 없으면 빈 목록 반환
        if (activeResponses.length === 0) return [];
        
        // activeResponses의 데이터로만 교집합 계산
        const allAvailable = activeResponses.map(r => r.availableSlots);
        
        const intersection = allAvailable[0].filter((slot: string) =>
            allAvailable.every(slots => slots.includes(slot))
        );

        intersection.sort();

        // 연속된 30분 단위 슬롯들을 하나의 덩어리로 묶기 (예: 14:00, 14:30 -> 14:00~15:00)
        const segments: string[] = [];
        if (intersection.length === 0) return [];

        let start = intersection[0];
        let prev = intersection[0];

        for (let i = 1; i <= intersection.length; i++) {
            const current = intersection[i];
            const isLast = i === intersection.length;

            // 연속 여부 확인 로직
            let continuous = false;
            if (!isLast) {
                const [d1, t1] = prev.split(" ");
                const [d2, t2] = current.split(" ");
                if (d1 === d2) { // 같은 날짜여야 함
                    const diff = timeToMinutes(t2) - timeToMinutes(t1);
                    if (diff === 30) continuous = true;
                }
            }

            if (!continuous) {
                // 연속이 끊기면 지금까지의 범위를 저장
                const [startDate, startTime] = start.split(" ");
                const [, endTimeStr] = prev.split(" ");
                
                // 종료 시간은 마지막 슬롯 + 30분
                const endMins = timeToMinutes(endTimeStr) + 30;
                const endH = Math.floor(endMins / 60);
                const endM = endMins % 60;
                const endDisplay = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                segments.push(`${startDate} | ${startTime} ~ ${endDisplay}`);
                
                if (!isLast) start = current;
            }
            prev = current;
        }

        return segments;
    }, [responses, excludedUsers]);

    const activeResponses = useMemo(() => {
        return responses.filter(r => !excludedUsers.has(r.userName));
    }, [responses, excludedUsers]);

    const heatmapTimes = useMemo(() => {
        if (!ensembleData) return [];

        const startTotal = timeToMinutes(ensembleData.startTime);
        const endTotal = timeToMinutes(ensembleData.endTime);
        const result: string[] = [];

        for (let m = startTotal; m < endTotal; m += 30) {
            const h = Math.floor(m / 60);
            const min = m % 60;
            result.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
        }

        return result;
    }, [ensembleData]);

    const heatmapCounts = useMemo(() => {
        const counts = new Map<string, { count: number; names: string[] }>();

        activeResponses.forEach((response) => {
            response.availableSlots.forEach((slot: string) => {
                const current = counts.get(slot) ?? { count: 0, names: [] };
                current.count += 1;
                current.names.push(response.userName);
                counts.set(slot, current);
            });
        });

        return counts;
    }, [activeResponses]);

    const parseDbDate = (dateStr: string) => new Date(`${dateStr}T00:00:00`);

    const formatDbDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const getWeekStart = (dateStr: string) => {
        const date = parseDbDate(dateStr);
        date.setDate(date.getDate() - date.getDay());
        return formatDbDate(date);
    };

    const addDaysToDbDate = (dateStr: string, daysToAdd: number) => {
        const date = parseDbDate(dateStr);
        date.setDate(date.getDate() + daysToAdd);
        return formatDbDate(date);
    };

    useEffect(() => {
        if (!ensembleData?.dates?.length) return;
        setVisibleHeatmapWeekStart(getWeekStart([...ensembleData.dates].sort()[0]));
    }, [ensembleData]);

    const targetDateSet = useMemo(() => {
        return new Set(ensembleData?.dates ?? []);
    }, [ensembleData]);

    const heatmapWeekBounds = useMemo(() => {
        if (!ensembleData?.dates?.length) return null;
        const sortedDates = [...ensembleData.dates].sort();
        return {
            first: getWeekStart(sortedDates[0]),
            last: getWeekStart(sortedDates[sortedDates.length - 1]),
        };
    }, [ensembleData]);

    const visibleHeatmapDays = useMemo(() => {
        if (!visibleHeatmapWeekStart) return [];
        const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

        return Array.from({ length: 7 }, (_, idx) => {
            const fullDate = addDaysToDbDate(visibleHeatmapWeekStart, idx);
            const [, month, day] = fullDate.split("-");

            return {
                fullDate,
                dateDisplay: `${Number(month)}/${Number(day)}`,
                weekDay: dayNames[idx],
                isTargetDate: targetDateSet.has(fullDate),
            };
        });
    }, [targetDateSet, visibleHeatmapWeekStart]);

    const heatmapWeekLabel = useMemo(() => {
        if (!visibleHeatmapDays.length) return "";
        return `${visibleHeatmapDays[0].dateDisplay} - ${visibleHeatmapDays[6].dateDisplay}`;
    }, [visibleHeatmapDays]);

    const handleMoveHeatmapWeek = (direction: -1 | 1) => {
        if (!visibleHeatmapWeekStart) return;
        setVisibleHeatmapWeekStart(addDaysToDbDate(visibleHeatmapWeekStart, direction * 7));
    };

    const getAvailabilityColor = (count: number, total: number) => {
        if (total === 0 || count === 0) return "#0d1117";

        const ratio = count / total;
        const opacity = 0.16 + ratio * 0.74;
        return `rgba(47, 129, 247, ${opacity})`;
    };

    // ✨ 개별 시간대 토글 함수
    const toggleTimeSelection = (timeRange: string) => {
        setSelectedTimes(prev => {
            const next = new Set(prev);
            if (next.has(timeRange)) next.delete(timeRange);
            else next.add(timeRange);
            return next;
        });
    };

    // 돌아가기 함수 추가
    const handleGoBack = () => {
      router.push(`/ensembleCreate/select?id=${roomId}`);
    };

    // 최종 일괄 확정 처리 함수
    const handleFinalConfirm = async () => {
        if (selectedTimes.size === 0) {
            alert("확정할 시간대를 최소 하나 이상 선택해주세요.");
            return;
        }

        if (!window.confirm(`${selectedTimes.size}개의 합주 일정을 확정하시겠습니까?`)) return;

        setIsSubmitting(true);
        // 제외된 멤버를 필터링하여 참여자 데이터 생성
        const participantData = responses
            .filter(r => !excludedUsers.has(r.userName)) // 제외된 유저 필터링
            .map(r => ({
                name: r.userName,
                sessions: r.sessions
            }));

        try {
            // 1. 선택된 모든 시간대를 각각 ensemble 테이블에 insert
            const insertPromises = Array.from(selectedTimes).map(timeRange => {
                const [datePart, timePart] = timeRange.split(" | ");
                const [startTime, endTime] = timePart.split(" ~ ");
                
                return supabase.from("ensemble").insert([{
                    room_id: roomId,
                    title: ensembleData.title,
                    date: datePart.trim(),
                    start_time: startTime.trim(),
                    end_time: endTime.trim(),
                    location: ensembleData.location,
                    participants: participantData 
                }]);
            });

            const results = await Promise.all(insertPromises);
            const hasError = results.some(res => res.error);
            if (hasError) {
              console.error("저장 에러 상세:", results.map(r => r.error));
              throw new Error("일정 저장에 실패했습니다.");
            }

            await queryClient.invalidateQueries({ queryKey: ["reservations"], exact: false });
            await queryClient.refetchQueries({ queryKey: ["reservations"], type: "active", exact: false });

            // 조율 방 상태를 'confirmed'로 업데이트 (중복 확정 방지)
            const { error: updateError } = await supabase
                .from("ensemble_rooms")
                .update({ status: 'confirmed' })
                .eq("id", roomId);

            if (updateError) throw updateError;
            
            // 저장이 완벽히 끝난 것을 확인한 후, 조율 데이터를 청소합니다.
            // 방을 지우면 Cascade 설정에 의해 availability 데이터도 같이 지워집니다.
            const { error: deleteError } = await supabase
                .from("ensemble_rooms")
                .delete()
                .eq("id", roomId);

            if (deleteError) {
                console.warn("데이터 청소 중 오류 발생:", deleteError);
                // 저장은 성공했으므로 여기서 throw를 하지는 않습니다.
            }

            alert(`${selectedTimes.size}개의 합주가 모두 확정되었습니다!`);
            router.replace("/"); 
            
        } catch (err: any) {
            console.error("확정 저장 실패:", err);
            alert(`오류 발생: ${err.message}`);
            
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-gray-500 text-center">데이터를 집계 중입니다...</div>;
    if (!ensembleData) return <div className="p-10 text-gray-500 text-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center p-6 text-[#c9d1d9] font-sans">
      {/* 상단 헤더 (Page 1, 2와 동일) */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12 border-b border-[#30363d] pb-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-bold text-xl text-[#f0f6fc]">
          <span className="text-[#58a6ff] text-xl">📅</span>
              BandMeet
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-gray-700 text-xs text-gray-300">
            {userName}님
          </div>
          <GuideHelpButton />
          <div className="h-9 w-9 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl bg-[#0d1117] rounded-3xl">
        {/* 합주 제목 표시 */}
        <div className="mb-10 text-center">
          <div className="w-full max-w-md mx-auto text-3xl font-extrabold text-center bg-[#161b22] py-4 rounded-2xl text-[#f0f6fc]">
             {ensembleData?.title}
          </div>
          <p className="mt-3 text-gray-500 text-sm">📍 {ensembleData?.location || "장소 미정"}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 왼쪽: 참여 멤버 목록 섹션 */}
          <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl h-fit">
            <div className="flex items-center gap-2 mb-4 text-[#58a6ff]">
              <Users className="w-5 h-5" />
              <h2 className="font-bold text-lg">참여 멤버 ({responses.length})</h2>
            </div>
            <p className="text-[11px] text-gray-500 mb-4">이름을 클릭하여 특정 세션을 제외할 수 있습니다.</p>
            
            <div className="space-y-3">
              {responses.length === 0 ? (
                <p className="text-gray-500 text-sm italic">아직 응답한 멤버가 없습니다.</p>
              ) : (
                responses.map((res, idx) => {
                  const isExcluded = excludedUsers.has(res.userName); // ✨ 제외 여부 확인
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleUser(res.userName)} // ✨ 클릭 시 토글
                      className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer group ${
                        isExcluded 
                          ? "bg-[#0d1117] border-gray-800 opacity-60 hover:opacity-100 hover:border-gray-600" 
                          : "bg-[#1c2128] border-[#30363d] hover:border-[#58a6ff] shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isExcluded ? "border-gray-700 bg-transparent" : "border-[#58a6ff] bg-[#58a6ff]"
                        }`}>
                          {!isExcluded && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`font-medium ${isExcluded ? "text-gray-500" : "text-[#f0f6fc]"}`}>
                          {res.userName}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {res.sessions.map((s: string) => (
                          <span 
                            key={s} 
                            className="inline-flex items-center gap-1.5 text-[11px] bg-blue-900/30 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-800/50"
                          >
                            {/* 이모지 부분 */}
                            <span className="text-[12px] leading-none">
                              {get_instrument_icon([s])}
                            </span>
                            {/* 세션 이름 부분 */}
                            <span className="font-medium">
                              {s}
                            </span>
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl h-fit">
            <div className="flex items-center gap-2 mb-4 text-[#58a6ff]">
              <CalendarIcon className="w-5 h-5" />
              <h2 className="font-bold text-lg">결과 보기</h2>
            </div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleMoveHeatmapWeek(-1)}
                disabled={!heatmapWeekBounds || !visibleHeatmapWeekStart || visibleHeatmapWeekStart <= heatmapWeekBounds.first}
                className="h-8 w-8 rounded-lg border border-[#30363d] bg-[#0d1117] text-[#8b949e] flex items-center justify-center transition hover:border-[#58a6ff] hover:text-[#58a6ff] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#30363d] disabled:hover:text-[#8b949e]"
                aria-label="이전 주"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1 text-center">
                <div className="text-sm font-bold text-[#f0f6fc]">{heatmapWeekLabel}</div>
                <div className="text-[11px] text-gray-500">{activeResponses.length}/{responses.length}명 기준</div>
              </div>
              <button
                type="button"
                onClick={() => handleMoveHeatmapWeek(1)}
                disabled={!heatmapWeekBounds || !visibleHeatmapWeekStart || visibleHeatmapWeekStart >= heatmapWeekBounds.last}
                className="h-8 w-8 rounded-lg border border-[#30363d] bg-[#0d1117] text-[#8b949e] flex items-center justify-center transition hover:border-[#58a6ff] hover:text-[#58a6ff] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#30363d] disabled:hover:text-[#8b949e]"
                aria-label="다음 주"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {activeResponses.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-2xl">
                <p className="text-gray-500 font-medium">표시할 멤버가 없습니다.</p>
                <p className="text-xs text-gray-600 mt-2 font-light">참여 멤버를 다시 포함해보세요.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto custom-scrollbar">
                  <div
                    className="grid text-xs"
                    style={{
                      gridTemplateColumns: `48px repeat(7, minmax(42px, 1fr))`,
                      minWidth: "342px",
                    }}
                  >
                    <div className="sticky left-0 z-10 bg-[#161b22] border-b border-gray-800" />
                    {visibleHeatmapDays.map((day) => {
                      return (
                        <div
                          key={day.fullDate}
                          className={`border-b border-gray-800 pb-2 text-center text-[11px] text-gray-400 ${day.isTargetDate ? "" : "opacity-35"}`}
                        >
                          <div>{day.weekDay}</div>
                          <div>{day.dateDisplay}</div>
                        </div>
                      );
                    })}

                    {heatmapTimes.map((time) => {
                      const isHour = time.endsWith(":00");

                      return (
                        <Fragment key={time}>
                          <div
                            className={`sticky left-0 z-10 bg-[#161b22] h-5 pr-2 flex items-center justify-end text-[10px] text-gray-500 ${
                              "border-t border-gray-800/20"
                            }`}
                          >
                            {isHour ? time : ""}
                          </div>

                          {visibleHeatmapDays.map((day) => {
                            const slot = `${day.fullDate} ${time}`;
                            const availability = heatmapCounts.get(slot);
                            const count = day.isTargetDate ? availability?.count ?? 0 : 0;
                            const backgroundColor = day.isTargetDate
                              ? getAvailabilityColor(count, activeResponses.length)
                              : "rgba(13, 17, 23, 0.45)";

                            return (
                              <div
                                key={slot}
                                title={`${day.fullDate} ${time} · ${count}/${activeResponses.length}명${
                                  availability?.names.length ? `: ${availability.names.join(", ")}` : ""
                                }`}
                                className={`h-5 border-l border-gray-800/60 transition-colors ${day.isTargetDate ? "" : "opacity-35"} ${
                                  isHour ? "border-t-2 border-gray-500/80" : "border-t border-gray-800/20"
                                }`}
                                style={{ backgroundColor }}
                              />
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
                  <span>1/{activeResponses.length} 가능</span>
                  <div className="flex h-5 flex-1 overflow-hidden rounded border border-gray-800">
                    {Array.from({ length: activeResponses.length }, (_, idx) => {
                      const count = idx + 1;
                      return (
                      <div
                        key={count}
                        className="flex-1 border-l border-[#161b22] first:border-l-0"
                        title={`${count}/${activeResponses.length}명 가능`}
                        style={{ backgroundColor: getAvailabilityColor(count, activeResponses.length) }}
                      />
                    )})}
                  </div>
                  <span>{activeResponses.length}/{activeResponses.length} 가능</span>
                </div>
              </>
            )}
          </section>

          {/* 오른쪽: 결과 요약 및 확정 리스트 (임시) */}
          <section className="md:col-span-2 space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6 text-[#58a6ff]">
                <Clock className="w-5 h-5" />
                <h2 className="font-bold text-lg">가능한 시간 목록</h2>
              </div>
              
              {/* 모두 가능한 시간 목록 UI */}
              <div className="space-y-3">
                  {commonTimes.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-2xl">
                          <p className="text-gray-500 font-medium">모두 가능한 시간이 없습니다.</p>
                          <p className="text-xs text-gray-600 mt-2 font-light">인원을 조정하거나 시간을 다시 선택해보세요.</p>
                      </div>
                  ) : (
                      commonTimes.map((timeRange, idx) => {
                          const isSelected = selectedTimes.has(timeRange);
                          return (
                            <button
                                key={idx}
                                onClick={() => toggleTimeSelection(timeRange)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${
                                    isSelected 
                                    ? "bg-[#1f6feb]/20 border-[#1f6feb] shadow-[0_0_15px_rgba(31,111,235,0.1)]" 
                                    : "bg-[#0d1117] border-gray-800 hover:border-gray-600"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isSelected ? "bg-[#1f6feb] text-white" : "bg-gray-800 text-gray-500"}`}>
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-sm md:text-base font-bold ${isSelected ? "text-white" : "text-[#c9d1d9]"}`}>
                                        {timeRange}
                                    </span>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? "bg-[#1f6feb] border-[#1f6feb]" : "border-gray-700"
                                }`}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                            </button>
                          );
                      })
                  )}
              </div>
            </div>


            <div className="flex flex-col gap-3">
              {/* ✨ 수정하기 버튼 추가 */}
              <button 
                onClick={handleGoBack}
                className="w-full py-3 flex items-center justify-center gap-2 font-semibold rounded-2xl border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white transition-all group"
              >
                <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                내 시간 수정하기 (이전 단계)
              </button>

              {/* 최종 확정 버튼 */}
              <button 
                onClick={handleFinalConfirm}
                disabled={selectedTimes.size === 0 || isSubmitting}
                className={`w-full py-4 flex items-center justify-center gap-3 font-extrabold rounded-2xl transition-all shadow-xl ${
                  selectedTimes.size > 0 && !isSubmitting
                  ? "bg-[#238636] hover:bg-[#2ea043] text-white scale-[1.02]"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  "확정 처리 중..."
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    {selectedTimes.size}개의 일정 최종 확정하기
                  </>
                )}
              </button>
              
              <p className="text-center text-[11px] text-gray-500">
                  확정 버튼을 누르면 메인 캘린더에 일괄 등록되며, 이 조율 방은 닫힙니다.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function get_instrument_icon(sessions?: string[]) {
  if (!sessions || sessions.length === 0) return "🎵";
  
  const session = sessions[0].toLowerCase();

  if (session.includes("보컬") || session.includes("vocal") || session.includes("🎤")) return "🎤";
  if (session.includes("기타") || session.includes("guitar") || session.includes("🎸")) return "🎸";
  if (session.includes("베이스") || session.includes("bass")) return "🎸"; 
  if (session.includes("드럼") || session.includes("drum") || session.includes("🥁")) return "🥁";
  
  // ✨ "키보드" 및 관련 용어 추가
  if (
    session.includes("건반") || 
    session.includes("피아노") || 
    session.includes("piano") || 
    session.includes("key") ||
    session.includes("키보드")
  ) return "🎹";
  
  return "🎵";
}
