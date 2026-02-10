"use client";

import React, { useMemo } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, User } from "lucide-react";
import { Reservation } from "@/types";
import { useAllUpcomingReservations } from "@/hooks/useReservations";
import { getReservationColor } from "@/utils/colors";

interface Props {
  onItemClick: (reservation: Reservation) => void;
}

export default function ReservationListView({ onItemClick }: Props) {
  const { data: reservations = [], isLoading } = useAllUpcomingReservations();

  // 날짜별 그룹핑 로직
  const groupedReservations = useMemo(() => {
    const groups: Record<string, Reservation[]> = {};

    reservations.forEach((res) => {
      if (!groups[res.date]) {
        groups[res.date] = [];
      }
      groups[res.date].push(res);
    });

    return groups;
  }, [reservations]);

  // 날짜 헤더 표시 포맷 (예: 2월 4일 (수))
  const getHeaderDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const base = format(date, "M월 d일 (E)", { locale: ko });
    if (isToday(date)) return `${base} — 오늘`;
    if (isTomorrow(date)) return `${base} — 내일`;
    return base;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const dateKeys = Object.keys(groupedReservations);

  if (dateKeys.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 flex-col gap-2">
        <p>예정된 예약이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-20">
      <div className="max-w-5xl mx-auto space-y-8 px-3 md:px-6 py-4">
        {dateKeys.map((dateStr) => (
          <div
            key={dateStr}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* 날짜 헤더 */}
            <h3 className="text-lg md:text-xl font-bold text-gray-100 mb-2 md:mb-4 flex items-center gap-2 sticky top-0 bg-[#121212]/95 backdrop-blur-sm pb-3 z-10 border-b border-gray-800 -mx-3 px-3 md:-mx-6 md:px-6">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              {getHeaderDate(dateStr)}
            </h3>

            {/* 카드 그리드 (PC: 2~3열, 모바일: 1열) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {groupedReservations[dateStr].map((res) => {
                const colors = getReservationColor(res.id);
                return (
                  <button
                    key={res.id}
                    onClick={() => onItemClick(res)}
                    className={`
                      relative flex flex-col items-start text-left p-4 rounded-xl border transition-all duration-200
                      ${colors.bg} ${colors.border} 
                      hover:brightness-110 hover:shadow-lg active:scale-[0.98]
                    `}
                  >
                    <div className="flex justify-between items-start w-full mb-2">
                      <div className="flex items-center gap-1.5 text-gray-300 bg-black/20 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono font-medium">
                          {res.start_time.slice(0, 5)} ~{" "}
                          {res.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    <h4
                      className={`text-base font-bold mb-1 leading-tight ${colors.title} line-clamp-1`}
                    >
                      {res.purpose}
                    </h4>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
