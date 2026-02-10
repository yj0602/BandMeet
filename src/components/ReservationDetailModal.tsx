"use client";

import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { X, Calendar, Clock, User, Trash2, ExternalLink } from "lucide-react";
import { Reservation } from "@/types";
import { useDeleteReservation } from "@/hooks/useReservations";
import { useRouter } from "next/navigation";

interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
  onDeleteSuccess: () => void;
}

export default function ReservationDetailModal({
  isOpen,
  onClose,
  reservation,
  onDeleteSuccess,
}: ReservationDetailModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const deleteMutation = useDeleteReservation();
  const router = useRouter();

  const handleGoDetail = () => {
    onClose();
    router.push(`/event/${reservation.id}`);
  };

  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else setTimeout(() => setIsVisible(false), 200);
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleDelete = () => {
    if (confirm("정말로 이 예약을 삭제하시겠습니까?")) {
      deleteMutation.mutate(reservation.id, {
        onSuccess: () => {
          onDeleteSuccess();
          onClose();
        },
      });
    }
  };

  // 날짜 포맷팅 (예: 2024년 2월 4일 (수))
  const formattedDate = format(
    parseISO(reservation.date),
    "yyyy년 M월 d일 (eee)",
    {
      locale: ko,
    }
  );

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4 
        transition-colors duration-200
        ${
          isOpen
            ? "bg-black/70 backdrop-blur-sm"
            : "bg-transparent pointer-events-none"
        }
      `}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          bg-[#1E1E1E] w-full max-w-sm md:max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700
          transform transition-all duration-300 ease-out
          ${
            isOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-4"
          }
        `}
      >
        {/* 상단 닫기 버튼 영역 */}
        <div className="flex justify-between items-center px-6 pt-6">
          <span className="pl-2 text-sm font-bold text-blue-500 tracking-wider">
            예약 상세내용
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-1 rounded-full hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 pt-2 space-y-4">
          {/* 1. 예약 목적 (주인공 - 가장 크게) */}
          <div className="space-y-2">
            <h2 className="pl-2 text-3xl md:text-4xl font-bold text-white leading-tight break-keep">
              {reservation.purpose}
            </h2>
          </div>

          {/* 2. 상세 정보 카드 (날짜/시간/예약자) */}
          <div className="bg-[#252525] rounded-xl p-5 border border-gray-800 space-y-4">
            {/* 날짜 & 시간 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-200">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-lg font-medium">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-200">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-lg font-medium font-mono">
                  {reservation.start_time.slice(0, 5)} ~{" "}
                  {reservation.end_time.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>
         {/* 상세보기 버튼 */}
         <button
           onClick={handleGoDetail}
           className="w-full py-4 rounded-xl border border-blue-900/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 flex items-center justify-center gap-2 transition-all group"
         >
           <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-bold">상세보기</span>
          </button>
          {/* 하단 삭제 버튼 */}
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full py-4 rounded-xl border border-red-900/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center gap-2 transition-all group"
          >
            {deleteMutation.isPending ? (
              <span className="text-sm font-medium">삭제 중...</span>
            ) : (
              <>
                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold">예약 삭제하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
