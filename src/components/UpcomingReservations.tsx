"use client";

import React from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { ko } from "date-fns/locale";
import { Reservation } from "@/types";
import { Clock } from "lucide-react";
import { useUpcomingReservations } from "@/hooks/useReservations"; // Hook import

interface Props {
  onItemClick: (reservation: Reservation) => void;
  // refreshKey 삭제됨
}

export default function UpcomingReservations({ onItemClick }: Props) {
  // React Query Hook 사용
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
              <div className="font-medium text-gray-200 text-sm truncate">
                {res.purpose}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                {res.user_name}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
