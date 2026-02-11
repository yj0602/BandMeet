"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Clock, Calendar as CalendarIcon, Check, User, PlusCircle } from "lucide-react";
import { timeToMinutes } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import Link from "next/link";

export default function ReservationEnsembleResult() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get("id"); // URL에서 ?id=... 값을 가져옴

    const [ensembleData, setEnsembleData] = useState<any>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");

    const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // 유저 정보 가져오기 (헤더용)
        setUserName(localStorage.getItem("ensembleUser") || "방문자");
        const fetchAllData = async () => {
            if (!roomId) return;
            try {
                // 방 정보와 참여자 응답 데이터를 동시에 불러오기
                const [roomRes, responsesRes] = await Promise.all([
                    supabase.from("ensemble_rooms").select("*").eq("id", roomId).single(),
                    supabase.from("ensemble_availability").select("*").eq("room_id", roomId)
                ]);

                if (roomRes.data) {
                    // 이미 확정된 방이면 안내 후 메인으로 튕겨내기
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
                    // DB 컬럼명을 코드에서 사용하는 이름(sessions, availableSlots)으로 매핑
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
        fetchAllData();
    }, [roomId]);

    // 컴포넌트 내부 상단에 추가
    const commonTimes = useMemo(() => {
        if (responses.length === 0) return [];

        // 모든 멤버가 선택한 시간(availableSlots)의 교집합 찾기
        const allAvailable = responses.map(r => r.availableSlots);
        
        // 첫 번째 멤버의 시간을 기준으로 다른 모든 멤버도 가지고 있는 시간만 필터링
        const intersection = allAvailable[0].filter((slot: string) =>
            allAvailable.every(slots => slots.includes(slot))
        );

        // 시간 순서대로 정렬 (YYYY-MM-DD HH:mm 형태이므로 문자열 정렬 가능)
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
    }, [responses]);

    // ✨ 개별 시간대 토글 함수
    const toggleTimeSelection = (timeRange: string) => {
        setSelectedTimes(prev => {
            const next = new Set(prev);
            if (next.has(timeRange)) next.delete(timeRange);
            else next.add(timeRange);
            return next;
        });
    };

    // ✨ 최종 일괄 확정 처리 함수
    const handleFinalConfirm = async () => {
        if (selectedTimes.size === 0) {
            alert("확정할 시간대를 최소 하나 이상 선택해주세요.");
            return;
        }

        if (!window.confirm(`${selectedTimes.size}개의 합주 일정을 확정하시겠습니까?`)) return;

        setIsSubmitting(true);
        const participantData = responses.map(r => ({
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
            if (hasError) throw new Error("일부 일정 저장에 실패했습니다.");

            // 2. 조율 방 상태를 'confirmed'로 업데이트 (중복 확정 방지)
            const { error: updateError } = await supabase
                .from("ensemble_rooms")
                .update({ status: 'confirmed' })
                .eq("id", roomId);

            if (updateError) throw updateError;

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
      <header className="w-full max-w-2xl flex justify-between items-center mb-12 border-b border-[#30363d] pb-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-bold text-xl text-[#f0f6fc]">
            <span className="text-[#58a6ff]">👥</span>
              BandMeet
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-gray-700 text-xs text-gray-300">
            {userName}님
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl bg-[#0d1117] rounded-3xl">
        {/* 합주 제목 표시 */}
        <div className="mb-10 text-center">
          <div className="w-full max-w-md mx-auto text-3xl font-extrabold text-center bg-[#161b22] py-4 rounded-2xl text-[#f0f6fc]">
             {ensembleData?.title}
          </div>
          <p className="mt-3 text-gray-500 text-sm">📍 {ensembleData?.location || "장소 미정"}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 왼쪽: 참여 멤버 목록 */}
          <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl h-fit">
            <div className="flex items-center gap-2 mb-4 text-[#58a6ff]">
              <Users className="w-5 h-5" />
              <h2 className="font-bold text-lg">참여 멤버 ({responses.length})</h2>
            </div>
            <div className="space-y-3">
              {responses.length === 0 ? (
                <p className="text-gray-500 text-sm italic">아직 응답한 멤버가 없습니다.</p>
              ) : (
                responses.map((res, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-[#0d1117] rounded-xl border border-gray-800">
                    <span className="font-medium text-[#f0f6fc]">{res.userName}</span>
                    <div className="flex gap-1">
                      {res.sessions.map((s: string) => (
                        <span key={s} className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 오른쪽: 결과 요약 및 확정 리스트 (임시) */}
          <section className="md:col-span-2 space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6 text-[#58a6ff]">
                <Clock className="w-5 h-5" />
                <h2 className="font-bold text-lg">모두 가능한 시간 목록</h2>
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
          </section>
        </div>
      </main>
    </div>
  );
}