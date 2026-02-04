"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Plus } from "lucide-react"; // Plus 아이콘 추가
import WeeklyTimetable from "@/components/WeeklyTimetable";
import MiniCalendar from "@/components/MiniCalendar";
import UpcomingReservations from "@/components/UpcomingReservations";
import ReservationDetailModal from "@/components/ReservationDetailModal";
import ReservationModal from "@/components/ReservationModal"; // 추가
import { Reservation } from "@/types";

export default function Home() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // [NEW] 플로팅 버튼용 모달 상태
  const [isFabModalOpen, setIsFabModalOpen] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const handleReservationClick = (res: Reservation) => {
    setSelectedReservation(res);
    setIsDetailModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  if (!currentDate) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121212] text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[#121212] text-gray-200">
      <header className="flex items-center justify-between px-4 py-2 md:px-6 md:py-4 bg-[#1a1a1a] border-b border-gray-800 flex-shrink-0 relative z-40">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <span className="md:hidden">📅 예약 시스템</span>
          <span className="hidden md:inline">📅 동아리방 예약 시스템</span>
        </h1>
        <button
          className="md:hidden p-2 text-gray-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/80 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`
            w-80 border-r border-gray-800 bg-[#1a1a1a] flex flex-col p-5 gap-6 z-50
            fixed md:relative inset-y-0 left-0 transition-transform duration-300 ease-in-out
            ${
              isMobileMenuOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }
            md:flex 
          `}
        >
          <div className="md:hidden flex justify-end">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div>
            <MiniCalendar
              selectedDate={currentDate}
              onSelectDate={(date) => {
                setCurrentDate(date);
                setIsMobileMenuOpen(false);
              }}
            />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <UpcomingReservations onItemClick={handleReservationClick} />
          </div>
        </aside>

        <section className="flex-1 p-3 md:p-6 overflow-hidden bg-[#121212] w-full relative">
          <WeeklyTimetable
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onReservationClick={handleReservationClick}
          />

          {/* [NEW] 플로팅 액션 버튼 (FAB) */}
          <button
            onClick={() => setIsFabModalOpen(true)}
            className="absolute bottom-6 right-6 md:bottom-10 md:right-10 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
            aria-label="예약 추가"
          >
            <Plus className="w-8 h-8" />
          </button>
        </section>
      </main>

      {/* 상세 모달 */}
      {selectedReservation && (
        <ReservationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          reservation={selectedReservation}
          onDeleteSuccess={() => setIsDetailModalOpen(false)}
        />
      )}

      {/* [NEW] FAB 클릭 시 뜨는 예약 생성 모달 */}
      <ReservationModal
        isOpen={isFabModalOpen}
        onClose={() => setIsFabModalOpen(false)}
        selectedDate={new Date()} // 기본값: 오늘
        startTime="09:00" // 기본값: 9시
        onSuccess={() => setIsFabModalOpen(false)}
      />
    </div>
  );
}
