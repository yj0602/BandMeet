"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Check, User } from "lucide-react";

export default function ReservationEnsembleSelect() {
    const [userName, setUserName] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [newSessionName, setNewSessionName] = useState("");
    const addSessionRef = useRef<HTMLDivElement | null>(null);

    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null);

    const days = ["월", "화", "수", "목", "금", "토"];
    const times = useMemo(() => {
    const result: string[] = [];
        for (let h = 9; h < 18; h++) {
            result.push(`${String(h).padStart(2, "0")}:00`);
            result.push(`${String(h).padStart(2, "0")}:30`);
        }
        return result;
    }, []);

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

    // 기본 세션 종류
    const [sessions, setSessions] = useState<string[]>([
        "보컬",
        "기타",
        "베이스",
        "드럼",
        "키보드",
    ]);
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


  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center p-6 text-[#c9d1d9] font-sans">
      {/* ===== 헤더 (page1과 동일 톤) ===== */}
      <header className="w-full max-w-2xl flex justify-between items-center mb-12 border-b border-[#30363d] pb-4">
        <div className="flex items-center gap-2 font-bold text-xl text-[#f0f6fc]">
          <span className="text-[#58a6ff]">👥</span>
          BandMeet
        </div>
        {/* 로그인 영역*/}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // TODO: 로그인 로직 연결
            }}
            className="flex items-center gap-1.5 rounded-full border border-gray-700
                      bg-[#1a1a1a] px-3 py-1.5 text-xs text-gray-300
                      hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span>로그인</span>
          </button>

          <div className="h-9 w-9 rounded-full bg-gray-700 border border-gray-600" />
        </div>
      </header>

      <main className="w-full max-w-2xl">
        {/* 합주 제목 */}
        <div className="mb-10 text-center">
            <div
                className="
                inline-block w-full max-w-md
                text-3xl font-extrabold text-center
                bg-[#161b22] py-4 rounded-2xl
                text-[#f0f6fc]
                "
            >
                합주 제목
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* ===== 왼쪽: 시간 선택 카드 ===== */}
          <section className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 text-center text-[#f0f6fc]">
              가능한 시간 선택
            </h3>

            <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-4 md:p-6 shadow-xl overflow-x-auto">
              <div className="grid grid-cols-[60px_repeat(6,1fr)] min-w-[300px]">
                <div />
                {days.map((d) => (
                  <div key={d} className="text-center mb-2 text-xs text-gray-400 font-bold">
                    {d}
                  </div>
                ))}

                {times.map((t) => {
                    const isHour = t.endsWith(":00");
                    return (
                        <div key={t} className="contents">
                            {/* 시간 라벨: 정시에만 표시하거나 작게 표시 */}
                            <div className={`text-[11px] pr-2 flex items-start justify-end text-gray-400 font-medium ${isHour ? "mt-[-8px]" : "invisible"}`}>
                                {t}
                            </div>
                            {days.map((d) => {
                                const key = `${d}-${t}`;
                                const selected = selectedCells.has(key);
                                return (
                                    <div
                                        key={key}
                                        data-cellkey={key}
                                        onPointerDown={(e) => {
                                            if (!isLoggedIn) return;
                                            e.currentTarget.setPointerCapture(e.pointerId);
                                            handleCellPointerDown(key);
                                        }}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={(e) => {
                                            e.currentTarget.releasePointerCapture(e.pointerId);
                                            handleCellPointerUp();
                                        }}
                                        onDragStart={(e) => e.preventDefault()}
                                        onContextMenu={(e) => e.preventDefault()}
                                        style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
                                        className={`
                                            /* 1. 높이를 h-6(24px)으로 키워 시원하게 만듦 */
                                            h-6 transition-all duration-75 border-l border-gray-800/60
                                            
                                            /* 2. 가로/세로 구분선: 선택되어도 미세하게 보이도록 색상 조정 */
                                            ${isHour ? "border-t border-gray-600/50" : "border-t border-gray-800/30"}
                                            ${t === "17:30" ? "border-b border-gray-600/50" : ""}
                                            
                                            /* 오른쪽 끝 경계선 처리 */
                                            ${d === "토" ? "border-r border-gray-800/60" : ""}

                                            /* 3. 상태별 색상 로직 */
                                            ${!isLoggedIn 
                                                ? "bg-gray-800/20 cursor-not-allowed" 
                                                : selected 
                                                    ? "bg-blue-500 border-t-blue-400/50 border-l-blue-400/50" // 선택 시 칸끼리 구분되도록 밝은 테두리 추가
                                                    : "bg-[#0d1117] hover:bg-gray-700 cursor-pointer"
                                            }
                                        `}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
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
                        setIsLoggedIn(true);
                        }
                    }}
                    placeholder="이름"
                    className="w-full p-3 rounded-xl border border-[#30363d]
                               bg-[#0d1117] text-[#f0f6fc]
                               focus:ring-2 focus:ring-[#58a6ff] outline-none"
                  />

                  <button
                    onClick={() => {
                        if (userName.trim()) setIsLoggedIn(true);
                    }}
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
                                        px-5 py-2
                                        rounded-full
                                        text-sm font-bold
                                        transition
                                        border
                                        ${
                                            selected
                                            ? "bg-[#1f6feb] text-white border-[#1f6feb]"
                                            : "bg-[#0d1117] text-[#c9d1d9] border-[#30363d] hover:bg-[#30363d]"
                                        }
                                    `}
                                >
                                    {session}
                                </button>
                            );
                        })}

                        {/* + 버튼 */}
                        {isLoggedIn && (
                            <button
                                onClick={() => setIsAddingSession(true)}
                                className="px-4 py-2 rounded-xl font-bold border border-dashed border-[#30363d]
                                            text-[#58a6ff] hover:bg-[#30363d] transition"
                            >
                            + 
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

        {/* ===== 하단 확정 버튼 ===== */}
        <div className="mt-12 flex justify-end">
          <button
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
