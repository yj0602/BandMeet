"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import MiniCalendar from "@/components/MiniCalendar";
import UpcomingReservations from "@/components/UpcomingReservations";
import ReservationDetailModal from "@/components/ReservationDetailModal";
import { Reservation } from "@/types";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleDataChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleReservationClick = (res: Reservation) => {
    setSelectedReservation(res);
    setIsDetailModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-gray-200">
      {/* 헤더: 높이 최적화 & '예약' -> '대여' */}
      <header className="flex items-center justify-between px-4 py-2 md:px-6 md:py-4 bg-[#1a1a1a] border-b border-gray-800 flex-shrink-0 relative z-40">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <span className="md:hidden">📅 대여 시스템</span>
          <span className="hidden md:inline">📅 동아리방 대여 시스템</span>
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
              refreshKey={refreshKey}
            />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <UpcomingReservations
              refreshKey={refreshKey}
              onItemClick={handleReservationClick}
            />
          </div>
        </aside>

        {/* 메인: 패딩 최적화 */}
        <section className="flex-1 p-3 md:p-6 overflow-hidden bg-[#121212] w-full">
          {/* [핵심] refreshKey 전달! 이제 삭제하면 바로 반영됩니다. */}
          <WeeklyTimetable
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onReservationChange={handleDataChange}
            onReservationClick={handleReservationClick}
            refreshKey={refreshKey}
          />
        </section>
      </main>

      {/* <footer className="py-4 text-center text-gray-600 text-xs border-t border-gray-800 bg-[#1a1a1a] flex-shrink-0">
        © 2024 Club Scheduler. All rights reserved.
      </footer> */}

      {selectedReservation && (
        <ReservationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          reservation={selectedReservation}
          onDeleteSuccess={handleDataChange}
        />
      )}
    </div>
  );
}
