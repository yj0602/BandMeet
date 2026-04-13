"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Check, User, PlusCircle } from "lucide-react";
import { timeToMinutes } from "@/utils/date";
import { Fragment } from "react"
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import GuideHelpButton from "@/components/common/GuideHelpButton";

type Props = {
  ensembleId: string;
};

export default function ReservationEnsembleSelect({ ensembleId }: Props) {
    const router = useRouter();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [userName, setUserName] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [ensembleData, setEnsembleData] = useState<{
        id: string;
        title: string;
        dates: string[];
        startTime: string;
        endTime: string;
    } | null>(null);

    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [newSessionName, setNewSessionName] = useState("");
    const addSessionRef = useRef<HTMLDivElement | null>(null);

    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null);
    const [sessions, setSessions] = useState<string[]>([
        "보컬",
        "기타",
        "베이스",
        "드럼",
        "키보드",
    ]);
    const [showShareGuide, setShowShareGuide] = useState(false);

    useEffect(() => {
        // 마운트 시 URL에서 roomId를 추출하여 상태에 저장합니다.
        const searchParams = new URLSearchParams(window.location.search);
        const id = searchParams.get("id");
        setRoomId(id);
    }, []);

    useEffect(() => {
        // 방 정보 불러오기 (DB)
        const fetchInitialData = async () => {
            if (!roomId) return;
            const savedUser = localStorage.getItem("ensembleUser");

            try {
                // 방 정보 및 상태 조회 (status 추가)
                const { data: roomData, error: roomError } = await supabase
                    .from("ensemble_rooms")
                    .select("*")
                    .eq("id", roomId)
                    .single();

                if (roomError) throw roomError;

                if (roomData) {
                    // 방이 이미 확정되었다면 결과 페이지로 튕겨내기
                    if (roomData.status === 'confirmed') {
                        alert("이미 최종 확정된 합주입니다.");
                        router.replace(`/ensembleCreate/result?id=${roomId}`);
                        return;
                    }

                    setEnsembleData({
                        id: roomData.id,
                        title: roomData.title,
                        dates: roomData.target_dates,
                        startTime: roomData.start_time_limit,
                        endTime: roomData.end_time_limit,
                    });
                }
                // 로그인 정보가 있다면 기존 응답 불러오기
                if (savedUser) {
                    setUserName(savedUser);
                    setIsLoggedIn(true);

                    const { data: existingResponse } = await supabase
                        .from("ensemble_availability")
                        .select("*")
                        .eq("room_id", roomId)
                        .eq("user_name", savedUser.trim())
                        .maybeSingle();

                    if (existingResponse) {
                        // 세션 복구
                        setSelectedSessions(new Set(existingResponse.selected_sessions));
                        
                        // 시간 셀(Grid Key) 복구 
                        const restoredCells = new Set<string>();
                        existingResponse.available_slots.forEach((slot: string) => {
                            // DB에 "2026-02-10 14:00"으로 저장되어 있다면
                            // 1번에서 바꾼 cellKey 형식인 "2026-02-10-14:00"으로 변환만 하면 됩니다.
                            const [date, time] = slot.split(" ");
                            const cellKey = `${date}-${time}`; 
                            restoredCells.add(cellKey);
                        });
                        setSelectedCells(restoredCells);
                    }
                }
            } catch (err) {
            console.error("데이터 로딩 실패:", err);
            }
        };
        fetchInitialData();
    }, [roomId, router]); // 의존성 추가

    // 드래그 이벤트
    useEffect(() => {
        if (!isDragging) return;
        const stopDrag = () => {
            setIsDragging(false);
            setDragMode(null);
        };
        window.addEventListener("pointerup", stopDrag);
        window.addEventListener("pointercancel", stopDrag);
        window.addEventListener("blur", stopDrag);
        return () => {
            window.removeEventListener("pointerup", stopDrag);
            window.removeEventListener("pointercancel", stopDrag);
            window.removeEventListener("blur", stopDrag);
        };
    }, [isDragging]);
    // 세션 추가 취소 (바깥 영역 클릭 감지)
    useEffect(() => {
        if (!isAddingSession) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
            addSessionRef.current &&
            !addSessionRef.current.contains(e.target as Node)
            ) {
            setIsAddingSession(false);
            setNewSessionName("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isAddingSession]);

    useEffect(() => {
        if (!roomId) return;

        const roomChannel = supabase
            .channel(`room-status-page2-${roomId}`)
            .on('postgres_changes', {
                event: '*', 
                schema: 'public',
                table: 'ensemble_rooms',
                filter: `id=eq.${roomId}`
            }, (payload) => {
                const isConfirmed = 
                    payload.eventType === 'DELETE' || 
                    (payload.new && payload.new.status === 'confirmed');

                if (isConfirmed) {
                    alert("방장이 일정을 최종 확정하여 조율이 종료되었습니다. 메인으로 이동합니다.");
                    router.replace("/");
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(roomChannel);
        };
    }, [roomId, router]);

    // Page 1에서 정한 날짜들로 days 배열 구성
    const days = useMemo(() => {
        if (!ensembleData?.dates) return [];
        const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
        
        return ensembleData.dates.map((d: string) => {
            const date = new Date(d);
            const month = d.split('-')[1].replace(/^0/, ''); // '02' -> '2'
            const day = d.split('-')[2].replace(/^0/, '');   // '03' -> '3'
            
            return {
                dateDisplay: `${month}/${day}`, // '2/3' 형태
                weekDay: dayNames[date.getDay()] // '화'
            };
        });
    }, [ensembleData]);

    // Page 1에서 정한 시간 범위(startTime ~ endTime)로 30분 단위 times 생성
    const times = useMemo(() => {
        if (!ensembleData) return [];
        
        const startTotal = timeToMinutes(ensembleData.startTime);
        const endTotal = timeToMinutes(ensembleData.endTime);
        const result: string[] = [];

        // 시작 시간부터 종료 시간 직전까지 30분씩 증가
        for (let m = startTotal; m < endTotal; m += 30) {
            const h = Math.floor(m / 60);
            const min = m % 60;
            result.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
        }
        return result;
    }, [ensembleData]);

    // 로그인 처리 함수
    const handleUserLogin = () => {
        const trimmedName = userName.trim();
        if (trimmedName) {
            // 로컬 스토리지에 유저 이름 저장
            localStorage.setItem("ensembleUser", trimmedName);
            setIsLoggedIn(true);
        }
    };
    // 로그아웃 처리
    const handleLogout = () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem("ensembleUser"); // 저장된 이름 삭제
            setUserName(""); // 상태 초기화
            setIsLoggedIn(false); // 로그인 상태 해제
            setSelectedSessions(new Set()); // 선택했던 세션 초기화 (선택 사항)
            setSelectedCells(new Set()); // 선택했던 시간 초기화 (선택 사항)
        }
    };
    const handleShareLink = () => {
        const invitationLink = window.location.href; // 현재 페이지 주소 전체
        navigator.clipboard.writeText(invitationLink)
        .then(() => {
            // 복사가 성공했을 때만 안내 창을 띄웁니다.
            setShowShareGuide(true); 
            // 5초 뒤에 자동으로 닫히게 설정 (선택 사항)
            setTimeout(() => setShowShareGuide(false), 5000);
        })
        .catch((err) => {
            console.error("복사 실패:", err);
            alert("링크 복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.");
        });
    };

    // 시간 셀 드래그 (데스크탑+모바일 모두 가능하게)
    const handleCellPointerDown = (key: string) => {
        if (!isLoggedIn) return;
        setIsDragging(true);
        setSelectedCells(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
                setDragMode("remove");
            } else {
                next.add(key);
                setDragMode("add");
            }
            return next;
        });
    };
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !dragMode) return;
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        const key = target?.dataset?.cellkey;

        if (key) {
            setSelectedCells(prev => {
                const next = new Set(prev);
                if (dragMode === "add") next.add(key);
                else next.delete(key);
                return next;
            });
        }
    };
    const handleCellPointerUp = () => {
        setIsDragging(false);
        setDragMode(null);
    };
    
    // 세션 중복 선택 가능
    const toggleSession = (session: string) => {
        setSelectedSessions(prev => {
            const next = new Set(prev);
            if (next.has(session)) next.delete(session);
            else next.add(session);
            return next;
        });
    };
    // 세션 추가 버튼 
    const handleAddSession = () => {
        const trimmed = newSessionName.trim();
        if (!trimmed) return;

        // 기본 세션 이름이랑 겹치는지 중복 체크 (대소문자 무시)
        const exists = sessions.some(
            (s) => s.toLowerCase() === trimmed.toLowerCase()
        );

        if (exists) {
            alert("이미 존재하는 세션입니다");
            return;
        }

        setSessions(prev => [...prev, trimmed]);
        setSelectedSessions(prev => new Set(prev).add(trimmed));

        setNewSessionName("");
        setIsAddingSession(false);
    };

    // 데이터가 로딩 중일 때 처리
    if (!ensembleData) {
        return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-gray-500">정보를 불러오는 중...</div>;
    }
    const handleConfirmSelection = async () => {
        // 유효성 검사
        if (!isLoggedIn || selectedSessions.size === 0 || selectedCells.size === 0) {
            alert("이름, 세션, 시간을 모두 선택해주세요!");
            return;
        }
        if (!roomId || !ensembleData) return;

        // 날짜 형식 표준화 
        const standardizedSlots = Array.from(selectedCells).map(cellKey => {
            const lastIndex = cellKey.lastIndexOf("-");
            const date = cellKey.substring(0, lastIndex); // "2026-02-03"
            const time = cellKey.substring(lastIndex + 1); // "14:00"
            return `${date} ${time}`; // DB 저장 형식: "2026-02-03 14:00"
        });

        //  DB 저장 
        try {
            const { error } = await supabase
                .from("ensemble_availability")
                .upsert(
                    {
                        room_id: roomId,
                        user_name: userName.trim(),
                        selected_sessions: Array.from(selectedSessions),
                        available_slots: standardizedSlots,
                        updated_at: new Date().toISOString(), // 수정 시간 기록
                    },
                    { onConflict: 'room_id,user_name' } // 이름과 방 번호가 같으면 덮어쓰기
                );

            if (error) throw error;

            router.push(`/ensembleCreate/result?id=${roomId}`);
            
        } catch (err) {
            console.error("데이터 저장 실패:", err);
            alert("일정 제출에 실패했습니다. 다시 시도해주세요.");
        }
    };


  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center p-6 text-[#c9d1d9] font-sans">
      {/* ===== 헤더 (page1과 동일 톤) ===== */}
      <header className="w-full max-w-2xl flex justify-between items-center mb-12 border-b border-[#30363d] pb-4">
        <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2 font-bold text-xl text-[#f0f6fc]">
          <span className="text-[#58a6ff] text-xl">📅</span>
            BandMeet
            </div>
        </Link>
        {/* 로그인 영역 */}
        <div className="flex items-center gap-3 relative">
            <div className="flex items-center gap-2">
                {/* ✨ 링크 공유 버튼: 로그인 여부와 상관없이 항상 보임 */}
                <GuideHelpButton />
                <button
                onClick={handleShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#58a6ff] hover:bg-[#58a6ff]/10 border border-[#30363d] rounded-lg transition-colors"
                >
                <span className="text-[14px]">🔗</span>
                링크 공유
                </button>

                {/* ✨ 로그인 상태일 때만 추가로 보여주는 영역 */}
                {isLoggedIn && (
                <>
                    {/* 로그아웃 버튼 */}
                    <button
                    onClick={handleLogout}
                    className="px-2 py-1.5 text-[10px] font-medium text-gray-500 hover:text-red-400 transition-colors border border-gray-800 rounded-lg"
                    >
                    로그아웃
                    </button>
                    
                    {/* 유저 이름 */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-gray-700 text-xs text-gray-300">
                    {userName}님
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                    </div>
                </>
                )}
            </div>

            {/* "링크를 복사해서 친구들에게 보내라" 안내 메시지 창 */}
            {showShareGuide && (
                <div className="absolute top-14 right-0 z-[100] w-64 p-4 bg-[#1c2128] border border-[#58a6ff] rounded-xl shadow-2xl ring-1 ring-[#58a6ff]/30 animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[#58a6ff]">
                            <Check className="w-4 h-4" />
                            <span className="text-xs font-bold">링크 복사 완료!</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                            클립보드에 주소가 저장되었습니다. <br />
                            친구들에게 전달해 보세요!
                        </p>
                        <button 
                            onClick={() => setShowShareGuide(false)}
                            className="mt-1 text-[10px] text-gray-500 hover:text-white underline text-left"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
      </header>

      <main className="w-full max-w-2xl">
        {/* 합주 제목 동적 표시 */}
        <div className="mb-10 text-center">
            <div className="inline-block w-full max-w-md text-3xl font-extrabold text-center bg-[#161b22] py-4 rounded-2xl text-[#f0f6fc]">
                {ensembleData.title}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* ===== 왼쪽: 시간 선택 카드 ===== */}
          <section className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 text-center text-[#f0f6fc]">
              가능한 시간 선택
            </h3>

            <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-3 md:p-3 shadow-xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto w-full max-h-[600px] custom-scrollbar">
                    <div 
                        className="grid text-xs border-b border-gray-800 bg-[#161b22] shrink-0"
                        style={{ 
                            gridTemplateColumns: `60px repeat(${days.length}, 1fr)`,
                            minWidth: `${60 + (days.length * 50)}px`,
                            width: "100%" 
                        }}
                    >
                        {/* [행 1] 날짜 헤더 영역 */}
                        <div className="sticky top-0 z-40 bg-[#161b22] border-b border-gray-800" />
                        {days.map((d, idx) => (
                            <div 
                                key={`header-${idx}`} 
                                className="sticky top-0 z-40 bg-[#161b22] flex flex-col items-center py-3 select-none"
                            >
                                <span className="text-[10px] font-light text-gray-500 mb-0.5">{d.weekDay}</span>
                                <span className="text-[12px] font-medium text-[#484f58]">{d.dateDisplay}</span>
                            </div>
                        ))}
                    

                        {/* [행 2부터] 시간 및 그리드 셀 영역 */}
                        {times.map((t) => {
                            const isHour = t.endsWith(":00");
                            return (
                                <Fragment key={`row-${t}`}> 
                                {/* 시간 라벨 */}
                                <div className={`
                                    pr-2 flex items-start justify-end text-gray-500 
                                    ${isHour ? "text-[10px] mt-[-6px]" : "invisible"}
                                `}>
                                    {t}
                                </div>

                                {/* 해당 시간대의 날짜별 셀들 */}
                                {days.map((d, idx) => {
                                    // d.dateDisplay(2/3) 대신 ensembleData에 들어있는 원본 날짜(2026-02-03)를 씁니다.
                                    const fullDate = ensembleData.dates[idx]; 
                                    const cellKey = `${fullDate}-${t}`; // "2026-02-03-14:00" 형태 (안전)
                                    const selected = selectedCells.has(cellKey);
                                    return (
                                    <div
                                        key={cellKey}
                                        data-cellkey={cellKey}
                                        onPointerDown={(e) => {
                                        if (!isLoggedIn) return;
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                        handleCellPointerDown(cellKey);
                                        }}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={(e) => {
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                        handleCellPointerUp();
                                        }}
                                        onDragStart={(e) => e.preventDefault()}
                                        onContextMenu={(e) => e.preventDefault()}
                                        style={{ touchAction: "none", userSelect: "none" }}
                                        className={`
                                        h-6 border-l border-gray-800/60
                                        ${isHour ? "border-t border-gray-600/50" : "border-t border-gray-800/20"}
                                        ${!isLoggedIn ? "bg-gray-800/20 cursor-not-allowed" 
                                            : selected ? "bg-blue-500 border-blue-400" 
                                            : "bg-[#0d1117] hover:bg-gray-700/50 cursor-pointer"}
                                        `}
                                    />
                                    );
                                })}
                                </Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
          </section>

          {/* ===== 오른쪽: 로그인 / 세션 선택 ===== */}
          <section>
            {!isLoggedIn ? (
              <>
                <h3 className="text-lg font-semibold mb-6 text-center text-[#f0f6fc]">
                  아이디
                </h3>

                <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                        <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm font-bold text-gray-400">
                      예약자 이름
                    </span>
                  </div>

                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && userName.trim()) {
                            e.preventDefault();
                            handleUserLogin();
                        }
                    }}
                    placeholder="이름"
                    className="w-full p-3 rounded-xl border border-[#30363d]
                               bg-[#0d1117] text-[#f0f6fc]
                               focus:ring-2 focus:ring-[#58a6ff] outline-none"
                  />

                  <button
                    onClick={handleUserLogin}
                    disabled={!userName.trim()}
                    className={`
                        w-full py-2.5 rounded-xl font-bold
                        transition flex justify-center items-center gap-2
                        shadow-lg shadow-blue-900/20
                        ${
                        !userName.trim()
                            ? "bg-blue-900/50 text-blue-200/50 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }
                    `}
                    >
                    로그인
                    </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-6 text-center text-[#f0f6fc]">
                    세션 선택
                </h3>

                <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 space-y-4">
                    
                    {/* 세션 버튼 목록 */}
                    <div className="flex flex-wrap gap-2">
                        {sessions.map(session => {
                            const selected = selectedSessions.has(session);

                            return (
                                <button
                                key={session}
                                onClick={() => toggleSession(session)}
                                className={`
                                    flex items-center gap-2
                                    px-5 py-2.5
                                    rounded-full
                                    text-sm font-bold
                                    transition-all duration-200
                                    border
                                    ${
                                    selected
                                        ? "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb] shadow-[0_0_15px_rgba(31,111,235,0.1)]"
                                        : "bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-[#8b949e] hover:text-[#c9d1d9]"
                                    }
                                `}
                                >
                                {/* 이모지 부분의 크기와 간격 조정 */}
                                <span className={`transition-transform duration-200 ${selected ? "scale-110" : "grayscale opacity-70"}`}>
                                    {get_instrument_icon([session])}
                                </span>
                                {session}
                                </button>
                            );
                        })}

                        {/* + 버튼 */}
                        {isLoggedIn && (
                            <button
                                onClick={() => setIsAddingSession(true)}
                                className="px-4 py-2.5 rounded-full font-bold border border-dashed border-[#30363d] text-[#484f58] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-all"
                            >
                                <PlusCircle className="w-4 h-4" /> {/* Lucide 아이콘을 쓰면 더 예쁩니다 */}
                            </button>
                        )}
                    </div>

                    {/* 새 세션 입력 */}
                    {isAddingSession && (
                        <div
                            ref={addSessionRef}
                            className="
                                mt-3
                                w-full
                                flex items-center gap-2
                                bg-[#0d1117]
                                border border-[#30363d]
                                rounded-xl
                                px-3 py-2
                                overflow-hidden
                            "
                        >
                            <input
                                autoFocus
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSession();
                                    }
                                }}
                                placeholder="세션 입력"
                                className="
                                    min-w-0
                                    flex-1
                                    bg-transparent
                                    outline-none
                                    text-sm
                                    text-[#f0f6fc]
                                    placeholder-[#8b949e]
                                    truncate
                                "
                            />
                            <button
                                onClick={handleAddSession}
                                className="
                                    shrink-0
                                    px-4 py-1.5
                                    rounded-lg
                                    bg-blue-600
                                    hover:bg-blue-500
                                    text-white
                                    text-sm font-bold
                                    transition
                                "
                            >
                            추가
                            </button>
                        </div>
                    )}
                </div>
              </>
            )}
          </section>
        </div>

        {/* ===== 하단 버튼 영역===== */}
        <div className="mt-12 flex justify-end gap-3">
            {/* ✨ 취소 버튼 추가 */}
            <button
                onClick={() => {
                if (confirm("입력한 내용이 저장되지 않습니다. 취소하시겠습니까?")) {
                    router.push("/"); // 혹은 원하는 경로로 이동
                }
                }}
                className="px-6 py-3 rounded-xl font-bold border border-[#30363d] text-gray-400 hover:bg-[#30363d] hover:text-white transition"
            >
                취소
            </button>

            <button
                onClick={handleConfirmSelection}
                disabled={
                    !isLoggedIn ||
                    selectedSessions.size === 0 ||
                    selectedCells.size === 0
                }
                className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-bold
                    transition shadow-lg shadow-blue-900/20
                    ${
                    !isLoggedIn || selectedSessions.size === 0 || selectedCells.size === 0
                        ? "bg-blue-900/50 text-blue-200/50 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }
                `}
                >
                <Check className="w-5 h-5" />
                확정
                </button>
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
