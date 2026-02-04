"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReservations } from "@/hooks/useReservations";
import { formatToDbDate } from "@/utils/date";

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  // refreshKey 삭제됨
}

export default function MiniCalendar({
  selectedDate,
  onSelectDate,
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 1. 현재 달력에 보여질 날짜 범위 계산
  const { start, end, days } = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return {
      start,
      end,
      days: eachDayOfInterval({ start, end }),
    };
  }, [currentMonth]);

  // 2. 해당 범위의 예약 데이터 가져오기 (React Query)
  const { data: reservations = [] } = useReservations(start, end);

  // 3. 예약이 있는 날짜들을 Set으로 변환 (빠른 조회를 위해)
  const reservedDates = useMemo(() => {
    return new Set(reservations.map((r) => r.date));
  }, [reservations]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="bg-[#252525] px-4 py-3 rounded-xl border border-gray-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-200 pl-1">
          {format(currentMonth, "yyyy년 M월")}
        </span>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-700 rounded text-gray-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-700 rounded text-gray-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2 text-center">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div key={day} className="text-[10px] text-gray-500 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 gap-x-1">
        {days.map((day) => {
          const dateStr = formatToDbDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const hasEvent = reservedDates.has(dateStr); // 점 표시 여부

          return (
            <button
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={`
                h-8 w-8 rounded-full flex items-center justify-center transition relative
                ${!isCurrentMonth ? "text-gray-700" : "text-gray-300"}
                ${
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow-md"
                    : "hover:bg-gray-700"
                }
                ${isToday && !isSelected ? "text-blue-400 font-bold" : ""}
              `}
            >
              {hasEvent && (
                <div className="absolute top-[4px] w-1 h-1 bg-green-500 rounded-full"></div>
              )}
              <span className="text-xs z-10 pt-1">{format(day, "d")}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-1 border-t-2 border-gray-800/50 text-center">
        <p className="text-[11px] text-gray-500">
          날짜를 눌러 원하는 일자로 이동하세요
        </p>
      </div>
    </div>
  );
}
