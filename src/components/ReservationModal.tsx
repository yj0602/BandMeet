"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, addMinutes, parse, isSameDay } from "date-fns";
import { X, Clock, Calendar, User, FileText } from "lucide-react";
import { useAddReservation, useReservations } from "@/hooks/useReservations"; // Read Hook 추가
import { formatToDbDate, timeToMinutes } from "@/utils/date";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date; // 초기 날짜
  startTime: string; // 초기 시간
  // existingReservations prop 삭제됨 (내부에서 직접 조회)
  onSuccess: () => void;
}

export default function ReservationModal({
  isOpen,
  onClose,
  selectedDate: initialDate,
  startTime: initialStartTime,
  onSuccess,
}: ReservationModalProps) {
  // 1. 날짜와 시간 모두 상태로 관리
  const [targetDate, setTargetDate] = useState<Date>(initialDate);
  const [currentStartTime, setCurrentStartTime] = useState(initialStartTime);

  const [userName, setUserName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [endTime, setEndTime] = useState("");

  const MAX_NAME_LENGTH = 8;
  const MAX_PURPOSE_LENGTH = 16;

  // React Query Hooks
  const addMutation = useAddReservation();

  // [핵심] 선택된 날짜의 예약을 실시간으로 가져옴 (날짜 바꾸면 자동 갱신)
  const { data: existingReservations = [] } = useReservations(
    targetDate,
    targetDate
  );

  // 모달 열릴 때 초기값 세팅
  useEffect(() => {
    if (isOpen) {
      setTargetDate(initialDate);
      setCurrentStartTime(initialStartTime);
      setUserName("");
      setPurpose("");
      setEndTime("");
    }
  }, [isOpen, initialDate, initialStartTime]);

  const startTimeOptions = useMemo(() => {
    const times = [];
    for (let h = 9; h < 24; h++) {
      times.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== 24) times.push(`${String(h).padStart(2, "0")}:30`);
    }
    return times.filter((t) => t !== "24:00" && t !== "24:30");
  }, []);

  // 종료 시간 계산 (중복 검사 로직 포함)
  const availableEndTimes = useMemo(() => {
    if (!currentStartTime) return [];
    const times: string[] = [];
    let current = parse(currentStartTime, "HH:mm", new Date());
    const startMin = timeToMinutes(currentStartTime);

    while (true) {
      current = addMinutes(current, 30);
      const timeStr = format(current, "HH:mm");
      const displayTimeStr = timeStr === "00:00" ? "24:00" : timeStr;
      const endMin =
        displayTimeStr === "24:00" ? 1440 : timeToMinutes(displayTimeStr);

      // React Query로 가져온 데이터와 비교
      const isOverlapping = existingReservations.some((r) => {
        const rStart = timeToMinutes(r.start_time);
        const rEnd = timeToMinutes(r.end_time);
        return startMin < rEnd && endMin > rStart;
      });

      if (isOverlapping) break;
      times.push(displayTimeStr);
      if (displayTimeStr === "24:00") break;
      if (times.length > 48) break;
    }
    return times;
  }, [currentStartTime, existingReservations]);

  // 종료 시간 자동 선택
  useEffect(() => {
    if (isOpen && availableEndTimes.length > 0) {
      if (!endTime || !availableEndTimes.includes(endTime)) {
        setEndTime(availableEndTimes[0]);
      }
    } else {
      setEndTime("");
    }
  }, [isOpen, availableEndTimes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !purpose || !endTime || !currentStartTime) {
      alert("모든 정보를 입력해주세요.");
      return;
    }
    addMutation.mutate(
      {
        user_name: userName,
        purpose: purpose,
        date: formatToDbDate(targetDate), // 변경된 날짜 사용
        start_time: currentStartTime,
        end_time: endTime === "24:00" ? "23:59:59" : endTime,
      },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setTargetDate(new Date(e.target.value));
    }
  };

  if (!isOpen) return null;

  const inputBaseStyle =
    "w-full h-12 bg-[#121212] border border-gray-700 rounded-lg px-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition flex items-center";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1E1E1E] w-full max-w-md rounded-xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#252525] px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            예약하기
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. 날짜 선택 (변경 가능) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">날짜</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                type="date"
                value={format(targetDate, "yyyy-MM-dd")}
                onChange={handleDateChange}
                className={`${inputBaseStyle} pl-10 appearance-none cursor-pointer [color-scheme:dark]`}
              />
            </div>
          </div>

          {/* 2. 시간 선택 */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-gray-400">
                시작 시간
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 w-5 h-5 text-blue-500 pointer-events-none" />
                <select
                  value={currentStartTime}
                  onChange={(e) => setCurrentStartTime(e.target.value)}
                  className={`${inputBaseStyle} pl-10 appearance-none cursor-pointer hover:bg-[#1a1a1a]`}
                >
                  {startTimeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-gray-400">
                종료 시간
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`${inputBaseStyle} pl-10 appearance-none cursor-pointer hover:bg-[#1a1a1a]`}
                  disabled={availableEndTimes.length === 0}
                >
                  {availableEndTimes.length === 0 ? (
                    <option>불가</option>
                  ) : (
                    availableEndTimes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 3. 이름 & 목적 (기존 동일) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-400">
                예약자 이름
              </label>
              <span
                className={`text-[10px] ${
                  userName.length >= MAX_NAME_LENGTH
                    ? "text-red-400"
                    : "text-gray-500"
                }`}
              >
                {userName.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                maxLength={MAX_NAME_LENGTH}
                placeholder="홍길동"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`${inputBaseStyle} pl-10`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-400">
                사용 목적
              </label>
              <span
                className={`text-[10px] ${
                  purpose.length >= MAX_PURPOSE_LENGTH
                    ? "text-red-400"
                    : "text-gray-500"
                }`}
              >
                {purpose.length}/{MAX_PURPOSE_LENGTH}
              </span>
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                maxLength={MAX_PURPOSE_LENGTH}
                placeholder="예: 정기공연합주"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={`${inputBaseStyle} pl-10`}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending || availableEndTimes.length === 0}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white rounded-lg font-bold transition flex justify-center items-center shadow-lg shadow-blue-900/20"
            >
              {addMutation.isPending ? "저장 중..." : "예약 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
