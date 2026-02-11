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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from "lucide-react";
import { Reservation } from "@/types";
import { useReservations } from "@/hooks/useReservations";
import { getKSTStartOfWeek, formatToDbDate, timeToMinutes } from "@/utils/date";
import { getReservationColor } from "@/utils/colors";

interface WeeklyTimetableProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onReservationClick: (res: Reservation) => void;
}

const calculateLayout = (dailyReservations: Reservation[]) => {
  const sorted = [...dailyReservations].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );

  const clusters: Reservation[][] = [];
  let currentCluster: Reservation[] = [];
  let clusterEnd = 0;

  sorted.forEach((res) => {
    const start = timeToMinutes(res.start_time);
    const end = timeToMinutes(res.end_time);

    if (currentCluster.length > 0 && start >= clusterEnd) {
      clusters.push([...currentCluster]);
      currentCluster = [];
    }
    currentCluster.push(res);
    clusterEnd = Math.max(clusterEnd, end);
  });
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const layoutedEvents: (Reservation & { _width: string; _left: string })[] = [];

  clusters.forEach((cluster) => {
    const columns: Reservation[][] = [];

    cluster.forEach((res) => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastEvent = columns[i][columns[i].length - 1];
        if (timeToMinutes(res.start_time) >= timeToMinutes(lastEvent.end_time)) {
          columns[i].push(res);
          (res as any)._col = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([res]);
        (res as any)._col = columns.length - 1;
      }
    });

    const colsCount = columns.length;
    cluster.forEach((res) => {
      const col = (res as any)._col;
      layoutedEvents.push({
        ...res,
        // 겹치는 일정 사이에 약간의 틈(1.5px)을 주어 네온 테두리가 돋보이게 함
        _width: `calc(${100 / colsCount}% - 1.5px)`,
        _left: `calc(${(100 / colsCount) * col}% + 0.5px)`,
      });
    });
  });

  return layoutedEvents;
};

export default function WeeklyTimetable({
  currentDate,
  onDateChange,
  onReservationClick,
}: WeeklyTimetableProps) {
  const { startDay, endDay, weekDays } = useMemo(() => {
    const start = getKSTStartOfWeek(currentDate);
    const end = addDays(start, 6);
    const days = eachDayOfInterval({ start, end });
    return { startDay: start, endDay: end, weekDays: days };
  }, [currentDate]);

  const { data: reservations = [], isLoading } = useReservations(startDay, endDay);

  const timeSlots = Array.from({ length: 15 }, (_, i) => i + 9); // 09:00 ~ 23:00
  const TOTAL_MINUTES = 15 * 60; // 900분

  const handlePrevWeek = () => onDateChange(subWeeks(currentDate, 1));
  const handleNextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-gray-200 rounded-xl shadow-lg border border-gray-800 overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* 헤더 (네비게이션) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#252525] flex-shrink-0 z-30 relative">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-base md:text-lg">{format(startDay, "M월")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handlePrevWeek} className="p-1.5 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className={`text-xs px-3 py-1.5 rounded-md transition font-semibold ${
              isSameWeek(currentDate, new Date())
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            이번 주
          </button>
          <button onClick={handleNextWeek} className="p-1.5 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto overscroll-none custom-scrollbar relative">
        <div className="min-w-[700px] md:min-w-full h-full flex flex-col">
          
          {/* 요일 헤더 */}
          <div className="sticky top-0 z-20 grid grid-cols-8 border-b border-gray-800 bg-[#2a2a2a] shadow-md">
            <div className="p-2 md:p-3 text-center text-[10px] md:text-xs font-semibold text-gray-500 border-r border-gray-800 flex items-center justify-center">
              시간
            </div>
            {weekDays.map((day) => {
              const isToday = formatToDbDate(day) === formatToDbDate(new Date());
              return (
                <div key={day.toString()} className={`p-2 md:p-3 text-center border-r border-gray-800 last:border-r-0 ${isToday ? "bg-blue-900/10" : ""}`}>
                  <div className={`text-[10px] md:text-xs font-bold ${isToday ? "text-blue-400" : "text-gray-400"}`}>
                    {format(day, "E", { locale: ko })}
                  </div>
                  <div className={`text-xs md:text-sm mt-0.5 md:mt-1 ${isToday ? "font-bold text-blue-400" : "text-gray-200"}`}>
                    {format(day, "d")}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-8 relative flex-1 bg-[#1c1c1c]">
            {/* 시간축 */}
            <div className="flex flex-col border-r border-gray-800 bg-[#252525]">
              {timeSlots.map((time) => (
                <div key={time} className="h-14 md:h-20 flex items-start justify-center pt-2 text-[10px] md:text-xs text-gray-500 border-b border-gray-800">
                  <span>{time}:00</span>
                </div>
              ))}
            </div>

            {/* 각 요일별 칸 */}
            {weekDays.map((day) => {
              const dailyRes = reservations.filter((r) => r.date === formatToDbDate(day));
              const layoutedEvents = calculateLayout(dailyRes);

              return (
                <div key={day.toString()} className="relative border-r border-gray-800 last:border-r-0 flex flex-col">
                  
                  {/* 뒷배경 점선 격자 */}
                  {timeSlots.map((time) => (
                    <div key={time} className="h-14 md:h-20 border-b border-gray-800/40 border-dashed flex flex-col">
                      <div className="flex-1 border-b border-gray-800/20 border-dotted" />
                      <div className="flex-1" />
                    </div>
                  ))}

                  {/* 💡 방해되는 CSS 모두 제거하고 원래 느낌 복구 */}
                  {layoutedEvents.map((res) => {
                    const topPercent = ((timeToMinutes(res.start_time) - 9 * 60) / TOTAL_MINUTES) * 100;
                    const heightPercent = ((timeToMinutes(res.end_time) - timeToMinutes(res.start_time)) / TOTAL_MINUTES) * 100;
                    const colors = getReservationColor(res.id);

                    return (
                      <div
                        key={res.id}
                        // 상하 여백만 살짝 주어 블록 간 분리감 확보
                        className="absolute py-[1px] md:py-[2px] z-10 hover:z-20"
                        style={{
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                          left: res._left,
                          width: res._width,
                        }}
                      >
                        <button
                          onClick={() => onReservationClick(res)}
                          // ✨ 핵심 복구 포인트: 순정 투명도 배경 + 왼쪽 쨍한 선 + 우측만 살짝 라운딩 ✨
                          className={`w-full h-full text-left overflow-hidden flex flex-col p-1.5 md:p-2 outline-none transition-all hover:brightness-110
                            ${colors.bg} 
                            border-l-2 md:border-l-4 ${colors.border}
                            rounded-r-md
                          `}
                        >
                          <div className={`font-bold text-[10px] md:text-xs leading-tight truncate ${colors.title}`}>
                            {res.purpose}
                          </div>
                          
                          <div className="text-[9px] md:text-[10px] text-gray-300 mt-0.5 truncate opacity-90">
                            {res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)}
                          </div>

                          {res.kind === "personal" && res.name && (
                            <div className="flex items-center gap-1 mt-auto pt-1">
                              <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-300" />
                              <span className="text-[9px] md:text-[10px] text-gray-300 truncate">
                                {res.name}
                              </span>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}