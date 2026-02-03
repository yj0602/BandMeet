"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  format,
  addDays,
  startOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { supabase } from "@/app/utils/supabase";
import { Reservation } from "@/types";
import ReservationModal from "./ReservationModal";

interface WeeklyTimetableProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onReservationChange: () => void;
  onReservationClick: (res: Reservation) => void;
}

export default function WeeklyTimetable({
  currentDate,
  onDateChange,
  onReservationChange,
  onReservationClick,
}: WeeklyTimetableProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    time: string;
  } | null>(null);

  const { startDay, endDay, weekDays } = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = addDays(start, 6);
    const days = eachDayOfInterval({ start, end });
    return { startDay: start, endDay: end, weekDays: days };
  }, [currentDate]);

  const timeSlots = Array.from({ length: 15 }, (_, i) => i + 9);

  const handlePrevWeek = () => onDateChange(subWeeks(currentDate, 1));
  const handleNextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .gte("date", format(startDay, "yyyy-MM-dd"))
        .lte("date", format(endDay, "yyyy-MM-dd"));

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  }, [startDay, endDay]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const getReservation = (targetDate: Date, hour: number, minute: number) => {
    const dateStr = format(targetDate, "yyyy-MM-dd");
    const currentSlotMinutes = hour * 60 + minute;

    return reservations.find((r) => {
      if (r.date !== dateStr) return false;
      const [startH, startM] = r.start_time.split(":").map(Number);
      const [endH, endM] = r.end_time.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
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

  const handleChangeSuccess = () => {
    fetchReservations();
    onReservationChange();
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-gray-200 rounded-xl shadow-lg border border-gray-800 overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* 네비게이션 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#252525] flex-shrink-0 z-30 relative">
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

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* 요일 헤더 */}
        <div className="sticky top-0 z-20 grid grid-cols-8 border-b border-gray-800 bg-[#252525] shadow-sm">
          <div className="p-2 md:p-3 text-center text-[10px] md:text-xs font-semibold text-gray-500 border-r border-gray-800 flex items-center justify-center">
            시간
          </div>
          {weekDays.map((day) => {
            const isToday =
              format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
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
          <div className="flex flex-col border-r border-gray-800 bg-[#252525]">
            {timeSlots.map((time) => (
              // [중요] 모바일: h-12(48px), PC: h-20(80px) 유지
              <div
                key={time}
                className="h-12 md:h-20 flex items-start justify-center pt-1 md:pt-2 text-[10px] md:text-xs text-gray-500 border-b border-gray-800"
              >
                <span>{time}:00</span>
              </div>
            ))}
          </div>

          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="flex flex-col border-r border-gray-800 last:border-r-0"
            >
              {timeSlots.map((time) => {
                const resTop = getReservation(day, time, 0);
                const resBottom = getReservation(day, time, 30);

                const renderBookedSlot = (res: Reservation) => (
                  <button
                    onClick={() => onReservationClick(res)}
                    className="flex-1 w-full text-left bg-blue-900/40 border-l-2 md:border-l-4 border-blue-500 p-0.5 md:p-1 overflow-hidden flex flex-col justify-center hover:bg-blue-900/60 transition"
                  >
                    {/* 목적: 항상 보임 */}
                    <div className="font-bold text-blue-300 text-[10px] md:text-[11px] leading-tight truncate">
                      {res.purpose}
                    </div>
                    {/* [중요] 이름: 모바일(hidden), PC(block) -> PC에서는 기존처럼 보임 */}
                    <div className="hidden md:block text-blue-400/70 text-[9px] leading-tight truncate mt-0.5">
                      {res.user_name}
                    </div>
                  </button>
                );

                const renderEmptySlot = (minute: number) => (
                  <button
                    className="flex-1 hover:bg-gray-800/50 transition-colors relative group w-full text-left"
                    onClick={() => handleEmptySlotClick(day, time, minute)}
                  >
                    <span className="hidden group-hover:block absolute top-0.5 left-0.5 md:top-1 md:left-1 text-blue-400 text-[10px] font-bold">
                      +
                    </span>
                  </button>
                );

                return (
                  // [중요] 부모 컨테이너도 h-12 md:h-20
                  <div
                    key={`${day}-${time}`}
                    className="h-12 md:h-20 flex flex-col border-b border-gray-800 relative"
                  >
                    {resTop ? renderBookedSlot(resTop) : renderEmptySlot(0)}
                    <div
                      className={`w-full border-t ${
                        resTop && resTop === resBottom
                          ? "border-blue-900/40"
                          : "border-dashed border-gray-800"
                      }`}
                    />
                    {resBottom ? (
                      resTop?.id !== resBottom.id ? (
                        renderBookedSlot(resBottom)
                      ) : (
                        <button
                          onClick={() => onReservationClick(resBottom)}
                          className="flex-1 w-full text-left bg-blue-900/40 border-l-2 md:border-l-4 border-blue-500 p-0.5 hover:bg-blue-900/60 transition"
                        />
                      )
                    ) : (
                      renderEmptySlot(30)
                    )}
                  </div>
                );
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
          existingReservations={reservations.filter(
            (r) => r.date === format(selectedSlot.date, "yyyy-MM-dd")
          )}
          onSuccess={handleChangeSuccess}
        />
      )}
    </div>
  );
}
