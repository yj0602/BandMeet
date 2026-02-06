"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Plus, Calendar, List, Users, Music } from "lucide-react";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import MiniCalendar from "@/components/MiniCalendar";
import UpcomingReservations from "@/components/UpcomingReservations";
import ReservationDetailModal from "@/components/ReservationDetailModal";
import ReservationListView from "@/components/ReservationListView";
import { Reservation } from "@/types";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // FAB 메뉴 열림/닫힘
  const [isFabOpen, setIsFabOpen] = useState(false);

  // 뷰 모드 상태 (timetable | list)
  const [viewMode, setViewMode] = useState<"timetable" | "list">("timetable");

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // 모바일 메뉴 열림/닫힘 시 바디 스크롤 잠금/해제
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // FAB 메뉴 열림/닫힘 시 바디 스크롤 잠금/해제 (모바일에서 배경 스크롤 방지)
  useEffect(() => {
    if (isFabOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFabOpen]);

  const handleReservationClick = (res: Reservation) => {
    setSelectedReservation(res);
    setIsDetailModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  if (!currentDate) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#121212] text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[#121212] text-gray-200">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-2 md:px-6 md:py-4 bg-[#1a1a1a] border-b border-gray-800 flex-shrink-0 relative z-40">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <span className="md:hidden">📅 예약 시스템</span>
          <span className="hidden md:inline">📅 미케닉스 스케쥴러</span>
        </h1>
        <button
          className="md:hidden p-2 text-gray-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* 모바일 오버레이 */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/80 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* 사이드바 (고정) */}
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
          <div className="mt-2">
            <MiniCalendar
              selectedDate={currentDate}
              onSelectDate={(date) => {
                setCurrentDate(date);
                setIsMobileMenuOpen(false);
                setViewMode("timetable");
              }}
            />
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <UpcomingReservations onItemClick={handleReservationClick} />
          </div>
        </aside>

        {/* 메인 섹션 */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#121212] w-full relative">
          {/* 탭 스위처 */}
          <div className="flex-shrink-0 px-4 pt-2 pb-2 flex justify-center">
            <div className="bg-[#252525] p-1 rounded-lg flex items-center border border-gray-800">
              <button
                onClick={() => setViewMode("timetable")}
                className={`
                  flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all
                  px-4 py-1.5 md:px-8 md:py-2
                  ${
                    viewMode === "timetable"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-400 hover:text-gray-200"
                  }
                `}
              >
                <Calendar className="w-4 h-4" />
                <span>시간표</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`
                  flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all
                  px-4 py-1.5 md:px-8 md:py-2
                  ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-400 hover:text-gray-200"
                  }
                `}
              >
                <List className="w-4 h-4" />
                <span>목록</span>
              </button>
            </div>
          </div>

          {/* 뷰 모드에 따른 컨텐츠 렌더링 */}
          <div className="flex-1 overflow-hidden px-3 md:px-6 pb-3 md:pb-6">
            {viewMode === "timetable" ? (
              <WeeklyTimetable
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onReservationClick={handleReservationClick}
              />
            ) : (
              <ReservationListView onItemClick={handleReservationClick} />
            )}
          </div>

          {/* ===== FAB 메뉴(합주/공연 생성) ===== */}
          {isFabOpen && (
            <>
              {/* 딤 오버레이 + 페이드 */}
              <div
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
                onClick={() => setIsFabOpen(false)}
              />

              {/* 메뉴 컨테이너 (슬라이드 업 + 페이드) */}
              <div className="absolute bottom-20 right-6 md:bottom-28 md:right-10 z-40 w-[260px]">
                <div className="rounded-2xl border border-gray-800 bg-[#1a1a1a]/95 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
                  <div className="px-4 pt-4 pb-3 border-b border-gray-800">
                    <div className="text-sm font-bold text-gray-100">새로 만들기</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      합주 또는 공연을 선택하세요
                    </div>
                  </div>

                  <div className="p-2 space-y-2">
                    {/* 합주 생성 */}
                    <button
                      onClick={() => {
                        setIsFabOpen(false);
                        router.push("/ensembleCreate/new");
                      }}
                      className="w-full group flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-800 bg-[#121212] hover:bg-[#151515] transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-gray-100 group-hover:text-white">
                          합주 생성
                        </div>
                        <div className="text-xs text-gray-400">
                          팀/시간대 잡고 합주 일정 만들기
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        NEW
                      </span>
                    </button>

                    {/* 공연 생성 */}
                    <button
                      onClick={() => {
                        setIsFabOpen(false);
                        router.push("/concertCreate/new");
                      }}
                      className="w-full group flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-800 bg-[#121212] hover:bg-[#151515] transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Music className="w-5 h-5 text-purple-300" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-gray-100 group-hover:text-white">
                          공연 생성
                        </div>
                        <div className="text-xs text-gray-400">
                          공연 정보/세트리스트/팀 구성
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-200 border border-purple-500/20">
                        SET
                      </span>
                    </button>
                  </div>

                  <div className="px-3 pb-3">
                    <button
                      onClick={() => setIsFabOpen(false)}
                      className="w-full py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-gray-200 bg-[#121212] hover:bg-[#151515] border border-gray-800 transition"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 플로팅 버튼 (항상 표시) */}
          <button
            onClick={() => setIsFabOpen((prev) => !prev)}
            className={`absolute bottom-6 right-6 md:bottom-10 md:right-10 w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40
              ${isFabOpen ? "bg-blue-500 scale-[1.02]" : "bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95"}
            `}
            aria-label="생성 메뉴"
          >
            <Plus
              className={`w-8 h-8 transition-transform duration-200 ${
                isFabOpen ? "rotate-45" : ""
              }`}
            />
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
    </div>
  );
}
