"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  addDays,
  addWeeks,
  subWeeks,
  isSameWeek,
  eachDayOfInterval,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Reservation } from "@/types";
import { useReservations } from "@/hooks/useReservations"; // React Query Hook
import { getKSTStartOfWeek, formatToDbDate, timeToMinutes } from "@/utils/date";
import { getReservationColor } from "@/utils/colors"; // 색상 유틸
import ReservationModal from "./ReservationModal";

interface WeeklyTimetableProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onReservationClick: (res: Reservation) => void;
}

export default function WeeklyTimetable({
  currentDate,
  onDateChange,
  onReservationClick,
}: WeeklyTimetableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    time: string;
  } | null>(null);

  // 1. 날짜 범위 계산 (React Query 키로 사용됨)
  const { startDay, endDay, weekDays } = useMemo(() => {
    const start = getKSTStartOfWeek(currentDate);
    const end = addDays(start, 6);
    const days = eachDayOfInterval({ start, end });
    return { startDay: start, endDay: end, weekDays: days };
  }, [currentDate]);

  // 2. React Query로 데이터 가져오기 (로딩/캐싱 자동 처리)
  const { data: reservations = [], isLoading } = useReservations(
    startDay,
    endDay
  );

  const timeSlots = Array.from({ length: 15 }, (_, i) => i + 9); // 09:00 ~ 23:00

  const handlePrevWeek = () => onDateChange(subWeeks(currentDate, 1));
  const handleNextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  // 특정 시간 슬롯에 해당하는 예약 찾기
  const getReservation = (targetDate: Date, hour: number, minute: number) => {
    const dateStr = formatToDbDate(targetDate);
    const currentSlotMinutes = hour * 60 + minute;

    return reservations.find((r) => {
      if (r.date !== dateStr) return false;
      const startMinutes = timeToMinutes(r.start_time);
      const endMinutes = timeToMinutes(r.end_time);
      return (
        currentSlotMinutes >= startMinutes && currentSlotMinutes < endMinutes
      );
    });
  };

  const handleEmptySlotClick = (day: Date, hour: number, minute: number) => {
    const timeStr = `${String(hour).padStart(2, "0")}:${
      minute === 0 ? "00" : "30"
    }`;
    setSelectedSlot({ date: day, time: timeStr });
    setIsCreateModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-gray-200 rounded-xl shadow-lg border border-gray-800 overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* 헤더 (네비게이션) */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#252525] flex-shrink-0 z-30 relative">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-base md:text-lg">
            {format(startDay, "M월")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevWeek}
            className="p-1 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className={`text-xs px-3 py-1 rounded-md transition font-medium ${
              isSameWeek(currentDate, new Date())
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            이번 주
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-y-none custom-scrollbar relative">
        {/* 요일 헤더 */}
        <div className="sticky top-0 z-20 grid grid-cols-8 border-b border-gray-800 bg-[#252525] shadow-sm">
          <div className="p-2 md:p-3 text-center text-[10px] md:text-xs font-semibold text-gray-500 border-r border-gray-800 flex items-center justify-center">
            시간
          </div>
          {weekDays.map((day) => {
            const isToday = formatToDbDate(day) === formatToDbDate(new Date());
            return (
              <div
                key={day.toString()}
                className={`p-2 md:p-3 text-center border-r border-gray-800 last:border-r-0 ${
                  isToday ? "bg-blue-900/20" : ""
                }`}
              >
                <div
                  className={`text-[10px] md:text-xs font-bold ${
                    isToday ? "text-blue-400" : "text-gray-400"
                  }`}
                >
                  {format(day, "E", { locale: ko })}
                </div>
                <div
                  className={`text-xs md:text-sm mt-0.5 md:mt-1 ${
                    isToday ? "font-bold text-blue-400" : "text-gray-200"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* 그리드 바디 */}
        <div className="grid grid-cols-8">
          {/* 시간축 */}
          <div className="flex flex-col border-r border-gray-800 bg-[#252525]">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="h-14 md:h-20 flex items-start justify-center pt-1 md:pt-2 text-[10px] md:text-xs text-gray-500 border-b border-gray-800"
              >
                <span>{time}:00</span>
              </div>
            ))}
          </div>

          {/* 각 요일별 시간표 */}
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="flex flex-col border-r border-gray-800 last:border-r-0"
            >
              {timeSlots.map((time) => {
                // 30분 단위 슬롯 2개 생성
                return [0, 30].map((minute) => {
                  const res = getReservation(day, time, minute);

                  // 예약 없음: 빈 슬롯 렌더링
                  if (!res) {
                    return (
                      <div
                        key={`${time}-${minute}`}
                        className="h-7 md:h-10 border-b border-gray-800 border-dashed border-gray-800/50 flex"
                      >
                        <button
                          className="flex-1 hover:bg-gray-800/50 transition-colors relative group w-full text-left"
                          onClick={() =>
                            handleEmptySlotClick(day, time, minute)
                          }
                        >
                          <span className="hidden group-hover:block absolute top-0.5 left-0.5 text-blue-400 text-[10px] font-bold">
                            +
                          </span>
                        </button>
                      </div>
                    );
                  }

                  // 예약 있음: 색상 및 병합 로직 적용
                  const colors = getReservationColor(res.id);
                  const currentSlotMinutes = time * 60 + minute;
                  const startMinutes = timeToMinutes(res.start_time);

                  // [핵심] 예약의 시작 시간인 경우에만 텍스트 표시
                  const isStartSlot = currentSlotMinutes === startMinutes;

                  return (
                    <div
                      key={`${time}-${minute}`}
                      className={`h-7 md:h-10 border-gray-800 relative p-0.5 md:p-1 flex flex-col justify-center
                        ${colors.bg} 
                        ${
                          isStartSlot
                            ? `border-l-2 md:border-l-4 ${colors.border}`
                            : `border-l-2 md:border-l-4 ${colors.border} border-t-0`
                        }
                      `}
                    >
                      <button
                        onClick={() => onReservationClick(res)}
                        className="w-full h-full text-left overflow-hidden outline-none"
                      >
                        {isStartSlot && (
                          <>
                            <div
                              className={`font-bold text-[10px] md:text-[11px] leading-tight truncate ${colors.title}`}
                            >
                              {res.purpose}
                            </div>
                            <div
                              className={`hidden md:block text-[9px] leading-tight truncate mt-0.5 ${colors.text}`}
                            >
                              {res.user_name}
                            </div>
                          </>
                        )}
                      </button>
                    </div>
                  );
                });
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedSlot && (
        <ReservationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          selectedDate={selectedSlot.date}
          startTime={selectedSlot.time}
          // React Query Mutation이 성공하면 자동으로 리렌더링되므로 onSuccess는 비워둬도 됨 (Modal 닫기만 처리)
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
