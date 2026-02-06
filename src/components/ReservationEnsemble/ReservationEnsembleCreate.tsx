"use client";

import { useState, useMemo, useEffect } from 'react';
import { timeToMinutes } from "@/utils/date";
import { Clock, Check} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths, 
  subMonths,
  isSameMonth,
  format
} from "date-fns";

export default function ReservationEnsembleCreate() {
  const [ensembleTitle, setEnsembleTitle] = useState("");

  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // hydration 에러->첫 렌더를 동일하게
  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  // 마우스 이벤트
  const handleMouseDown = (dateStr: string) => {
    setIsDragging(true);
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
        setDragMode("remove");
      } else {
        next.add(dateStr);
        setDragMode("add");
      }
      return next;
    });
  };
  const handleMouseEnter = (dateStr: string) => {
    if (!isDragging || !dragMode) return;

    setSelectedDates(prev => {
      const next = new Set(prev);
      if (dragMode === "add") next.add(dateStr);
      else next.delete(dateStr);
      return next;
    });
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };
  
  // 시간 범위 옵션
  const timeOptions = useMemo(() => {
    const times = [];
    for (let h = 9; h < 24; h++) {
      times.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== 24) times.push(`${String(h).padStart(2, "0")}:30`);
    }
    return times.filter((t) => t !== "24:00" && t !== "24:30");
  }, []);
  
  // 시간 범위 유효성 검사
  const isTimeRangeValid =
    startTime !== "" &&
    endTime !== "" &&
    timeToMinutes(startTime) < timeToMinutes(endTime);

  const handleCreateEnsemble = () => {
    const payload = {
      title: ensembleTitle,
      dates: Array.from(selectedDates).sort(),
      startTime,
      endTime,
    };
    // TODO: 나중에 API 연결
    // createEnsembleMutation.mutate(payload);
    sessionStorage.setItem(
      "ensembleDraft",
      JSON.stringify(payload)
    );
  };
  
  // 날짜
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dates = useMemo(() => {
    if (!currentMonth) return [];
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  if (!currentMonth) {
    return <div className="text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center p-6 text-[#c9d1d9] font-sans">
      
      {/* 상단 헤더: 보더 라인 추가 */}
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

      {/* 메인 입력 섹션: 배경을 더 짙은 다크로 */}
      <main className="w-full max-w-2xl bg-[#0d1117] rounded-3xl">
        
        {/* 제목 입력: 배경색과 포커스 효과 변경 */}
        <div className="mb-10 text-center">
          <input
            type="text"
            placeholder="합주 제목 입력"
            className="w-full max-w-md text-3xl font-extrabold text-center border-none focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#161b22] py-4 rounded-2xl placeholder-[#484f58] text-[#f0f6fc]"
            value={ensembleTitle}
            onChange={(e) => setEnsembleTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* 날짜 범위 선택 */}
          <section>
            <h3 className="text-lg font-semibold mb-6 text-center text-[#f0f6fc]">날짜 범위 선택</h3>
            <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="font-bold text-[#58a6ff]">
                  {format(currentMonth, "yyyy년 M월")}
                </span>
                <div className="flex gap-4 text-[#8b949e]">
                  <button
                    className="hover:text-white"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    〈
                  </button>
                  <button
                    className="hover:text-white"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    〉
                  </button>
                </div>
              </div>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-2 text-center">
                {days.map((day) => (
                  <div
                    key={day}
                    className="text-[10px] text-gray-500 font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div
                className="grid grid-cols-7 gap-2 text-center text-xs"
                onMouseLeave={handleMouseUp}
              >
                {dates.map((date) => {
                  const dateStr = date.toISOString().slice(0, 10);
                  const selected = selectedDates.has(dateStr);
                  const isCurrentMonth = isSameMonth(date, currentMonth);

                  return (
                    <button
                      key={dateStr}
                      onMouseDown={() => handleMouseDown(dateStr)}
                      onMouseEnter={() => handleMouseEnter(dateStr)}
                      onMouseUp={handleMouseUp}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg transition text-sm
                        ${
                          selected
                            ? "bg-[#1f6feb] text-white font-bold"
                            : isCurrentMonth
                              ? "hover:bg-[#30363d] text-[#c9d1d9]"
                              : "text-gray-600"
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 시간 범위 선택 */}
          <section>
            <h3 className="text-lg font-semibold mb-6 text-center text-[#f0f6fc]">시간 범위 선택</h3>
            <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-8 relative space-y-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-blue-500/10 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    시작 시간
                  </label>
                </div>

                <select
                  className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:ring-2 focus:ring-[#58a6ff] outline-none"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-gray-500/10 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    종료 시간
                  </label>
                </div>

                <select
                  className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:ring-2 focus:ring-[#58a6ff] outline-none"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* 하단 버튼: 취소 / 합주 생성 */}
            <div className="mt-12 flex gap-3">
              {/* 취소 버튼 */}
              <button
                type="button"
                onClick={() => {
                  // TODO: 뒤로 가기 - 추신:common/BackToMainButton.tsx쓰면 뭐든 메인으로 보내주는거 만들어뒀음
                  // router.back() 같은 걸 나중에 연결
                }}
                className="flex-1 py-3 bg-[#252525] hover:bg-[#2a2a2a] 
                          text-gray-400 hover:text-gray-200 
                          border border-[#30363d] 
                          rounded-xl font-bold transition"
              >
                취소
              </button>

              {/* 합주 생성 버튼 */}
              <button
                type="button"
                onClick={handleCreateEnsemble}
                disabled={!ensembleTitle || selectedDates.size === 0 || !isTimeRangeValid}
                className={`flex-[2] py-3 rounded-xl font-bold
                  transition flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20
                  ${
                    !ensembleTitle || selectedDates.size === 0 || !isTimeRangeValid
                      ? "bg-blue-900/50 text-blue-200/50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
              >
                <Check className="w-5 h-5" />
                합주 생성
              </button>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}