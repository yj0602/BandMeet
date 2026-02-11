"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from 'react';
import { timeToMinutes } from "@/utils/date";
import { Clock, Check, MapPin} from "lucide-react";
import Link from "next/link";
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
import { supabase } from "@/utils/supabase";

export default function ReservationEnsembleCreate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id");
  const [ensembleTitle, setEnsembleTitle] = useState("");

  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null);

  const [location, setLocation] = useState("미케닉스 동아리방");

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now);
    
    if (!roomId) return;

    const fetchRoomData = async () => {
      const { data, error } = await supabase
        .from("ensemble_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (data && !error) {
        setEnsembleTitle(data.title);
        setLocation(data.location || "");
        setSelectedDates(new Set(data.target_dates)); // 기존 날짜 복구
        setStartTime(data.start_time_limit);
        setEndTime(data.end_time_limit);
        
        // 달력 월(Month) 위치 조정 (선택된 첫 날짜 기준)
        if (data.target_dates.length > 0) {
          setCurrentMonth(new Date(data.target_dates[0]));
        }
      }
    };

    fetchRoomData();
  }, [roomId]);

  // 1. 드래그 시작
  const handlePointerDown = (dateStr: string, e: React.PointerEvent) => {
    setIsDragging(true);
    // 포인터 캡처를 설정해야 드래그 중 영역을 벗어나도 이벤트를 추적합니다.
    e.currentTarget.setPointerCapture(e.pointerId);

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
  // 2. 드래그 중 (모바일 핵심: 좌표 계산)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragMode) return;
    // 현재 터치/마우스 위치의 요소를 찾음
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    const dateStr = target?.dataset?.date; // 날짜를 식별하기 위해 dataset 사용

    if (dateStr) {
      setSelectedDates(prev => {
        const next = new Set(prev);
        if (dragMode === "add") next.add(dateStr);
        else next.delete(dateStr);
        return next;
      });
    }
  };
  // 3. 드래그 끝
  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    setDragMode(null);
  };
  // 드래그 중 화면 밖에서 손을 떼도 안전하게 종료되도록 전역 이벤트 등록
  useEffect(() => {
    if (!isDragging) return;

    const stopDrag = () => {
      setIsDragging(false);
      setDragMode(null);
    };

    // 마우스를 떼거나, 터치가 취소되거나, 브라우저가 포커스를 잃을 때 실행
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    window.addEventListener("blur", stopDrag);

    return () => {
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      window.removeEventListener("blur", stopDrag);
    };
  }, [isDragging]);
  
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

  const handleCreateEnsemble = async() => {
    // DB 컬럼명에 맞춘 데이터 구성
    const payload = {
      title: ensembleTitle,
      location: location,
      target_dates: Array.from(selectedDates).sort(),
      start_time_limit: startTime, // DB의 start_time_limit 컬럼
      end_time_limit: endTime,     // DB의 end_time_limit 컬럼
      updated_at: new Date().toISOString(), // 업데이트 시간 기록
      status: 'open'
    };
    try {
      if (roomId) {
        // 수정 모드: 제목과 장소만 업데이트됨 (날짜/시간은 UI에서 막았으므로 기존값 유지)
        const { error } = await supabase
          .from('ensemble_rooms')
          .update(payload)
          .eq('id', roomId);
        if (error) throw error;
        router.push(`/ensembleCreate/select?id=${roomId}`);
        return;
      } else {
        // 생성 모드: 기존 insert 로직
        const { data, error } = await supabase
          .from('ensemble_rooms')
          .insert([payload])
          .select('id');
        if (error) throw error;
        
        if (data && data[0]) {
          router.push(`/ensembleCreate/select?id=${data[0].id}`);
        } else {
          alert("데이터 저장 후 정보를 가져오지 못했습니다.");
        }
      }
    } catch (error) {
      console.error("방 생성 실패:", error);
      alert("서버 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };
  // 취소 버튼 함수 추가
  const handleCancel = () => {
    router.push("/");
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
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-bold text-xl text-[#f0f6fc]">
            <span className="text-[#58a6ff] text-xl">📅</span>
            BandMeet
          </div>
        </Link>
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
          <section className="space-y-10">
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
              >
                {dates.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const selected = selectedDates.has(dateStr);
                  const isCurrentMonth = isSameMonth(date, currentMonth);

                  return (
                    <button
                      key={dateStr}
                      data-date={dateStr} // 좌표 계산을 위한 데이터 속성
                      // 수정 모드일 때 모든 마우스/터치 이벤트 비활성화
                      onPointerDown={(e) => !roomId && handlePointerDown(dateStr, e)}
                      onPointerMove={(e) => !roomId && handlePointerMove(e)}
                      onPointerUp={(e) => !roomId && handlePointerUp(e)}
                      disabled={!!roomId}
                      onDragStart={(e) => e.preventDefault()} // 브라우저 기본 드래그 방지
                      onContextMenu={(e) => e.preventDefault()} // 모바일 롱클릭 메뉴 방지
                      style={{ 
                        touchAction: "none", // 모바일 스크롤 방지
                        userSelect: "none", 
                        WebkitUserSelect: "none" 
                      }}
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
              <p className="mt-4 text-[11px] text-gray-500 text-center font-light tracking-tight">
                선택 또는 드래그하여 날짜를 선택하세요
              </p>
            </div>
          </section>

          {/* 시간 범위 선택 */}
          <section>
            <h3 className="text-lg font-semibold mb-6 text-center text-[#f0f6fc]">장소 / 시간 범위</h3>
            <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-8 relative space-y-8">
               {/* 장소 입력 */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-purple-500/10 rounded-md">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <label className="text-xs font-bold text-gray-400 uppercase">장소 입력</label>
                </div>
                <input
                  type="text"
                  placeholder="예: 미케닉스 동아리방"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#30363d]
                            bg-[#0d1117] text-[#f0f6fc]
                            placeholder-[#8b949e]
                            focus:ring-2 focus:ring-[#58a6ff] outline-none"
                />
              </div>
              {/* 시작 시간 선택 */}
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
                  disabled={!!roomId}
                  className={`w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:ring-2 focus:ring-[#58a6ff] outline-none
                    ${!!roomId ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  disabled={!!roomId}
                  className={`w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:ring-2 focus:ring-[#58a6ff] outline-none
                    ${!!roomId ? "opacity-50 cursor-not-allowed" : ""}`}
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
                onClick={handleCancel}
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