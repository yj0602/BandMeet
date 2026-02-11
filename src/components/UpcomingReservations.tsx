"use client";

import React from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { ko } from "date-fns/locale";
import { Reservation } from "@/types";
import { Clock, User } from "lucide-react";
import { useUpcomingReservations } from "@/hooks/useReservations";
import { differenceInCalendarDays, startOfDay } from "date-fns";

interface Props {
  onItemClick: (reservation: Reservation) => void;
}

const getDDay = (dateStr: string) => {
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(dateStr));
  const diff = differenceInCalendarDays(target, today);

  if (diff === 0) return "D-0";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
};

const getDDayClass = (dateStr: string) => {
  const diff = differenceInCalendarDays(
    startOfDay(new Date(dateStr)),
    startOfDay(new Date())
  );

  if (diff === 0) return "text-blue-400";
  if (diff <= 3) return "text-orange-400";
  return "text-gray-500";
};

export default function UpcomingReservations({ onItemClick }: Props) {
  const { data: reservations = [], isLoading } = useUpcomingReservations();

  const getFriendlyDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "오늘";
    if (isTomorrow(date)) return "내일";
    return format(date, "M.dd (E)", { locale: ko });
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <h2 className="text-sm font-bold text-gray-400 mb-3 px-1 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        다가오는 예약
      </h2>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
        {isLoading ? (
          <div className="text-center text-xs text-gray-600 py-4">
            로딩 중...
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center text-xs text-gray-600 py-4 border border-dashed border-gray-800 rounded-lg">
            예정된 일정이 없습니다.
          </div>
        ) : (
          reservations.map((res) => (
            <div
              key={res.id}
              onClick={() => onItemClick(res)}
              className="bg-[#252525] rounded-lg p-3 border border-gray-800 shadow-sm hover:border-gray-600 hover:bg-[#2a2a2a] transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isToday(new Date(res.date))
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {getFriendlyDate(res.date)}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {res.start_time.slice(0, 5)} ~ {res.end_time.slice(0, 5)}
                </span>
              </div>

              <div className="flex justify-between items-end mt-1">
                <div className="flex-1">
                  <div className="font-medium text-gray-200 text-sm truncate">
                    {res.purpose}
                  </div>
                  {/* 개인 일정일 경우 예약자 이름 표시 */}
                  {res.kind === "personal" && res.name && (
                    <div className="flex items-center gap-1 mt-1">
                      <User className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{res.name}</span>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-mono ml-2 ${getDDayClass(res.date)}`}>
                  {getDDay(res.date)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}