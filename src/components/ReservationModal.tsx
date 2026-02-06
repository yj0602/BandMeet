"use client";
// 기존에 쓰던 예약 모달, 이제 안쓰지만 일단 내버려 둠
import React, { useState, useEffect, useMemo } from "react";
import { format, addMinutes, parse } from "date-fns";
import { X, Clock, Calendar, User, FileText, Check } from "lucide-react";
import { useAddReservation, useReservations } from "@/hooks/useReservations";
import { formatToDbDate, timeToMinutes } from "@/utils/date";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  startTime: string;
  onSuccess: () => void;
}

export default function ReservationModal({
  isOpen,
  onClose,
  selectedDate: initialDate,
  startTime: initialStartTime,
  onSuccess,
}: ReservationModalProps) {
  const [targetDate, setTargetDate] = useState<Date>(initialDate);
  const [currentStartTime, setCurrentStartTime] = useState(initialStartTime);

  const [userName, setUserName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [endTime, setEndTime] = useState(""); // 기본값 비워둠

  const MAX_NAME_LENGTH = 8;
  const MAX_PURPOSE_LENGTH = 16;

  const addMutation = useAddReservation();
  const { data: existingReservations = [] } = useReservations(
    targetDate,
    targetDate
  );

  useEffect(() => {
    if (isOpen) {
      setTargetDate(initialDate);
      setCurrentStartTime(initialStartTime);
      setUserName("");
      setPurpose("");
      setEndTime(""); // 모달 열릴 때마다 종료 시간 초기화 (선택 강제)
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

  // [수정] 종료 시간 자동 선택 로직 제거
  // 시작 시간이 바뀌어서 현재 선택된 종료 시간이 유효하지 않게 될 때만 초기화
  useEffect(() => {
    if (isOpen) {
      if (
        endTime &&
        (availableEndTimes.length === 0 || !availableEndTimes.includes(endTime))
      ) {
        setEndTime("");
      }
    }
  }, [isOpen, availableEndTimes, endTime]);

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
        date: formatToDbDate(targetDate),
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
    "w-full h-11 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition flex items-center text-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1E1E1E] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center px-6 pt-6">
          <span className="pl-2 text-sm font-bold text-blue-500 tracking-wider">
            예약 추가하기
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-1 rounded-full hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* 날짜/시간 카드 섹션 */}
          <div className="bg-[#252525] rounded-xl p-4 border border-gray-800 space-y-4">
            {/* 날짜 선택 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-blue-500/10 rounded-md">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <label className="text-xs font-bold text-gray-400">날짜</label>
              </div>
              <input
                type="date"
                value={format(targetDate, "yyyy-MM-dd")}
                onChange={handleDateChange}
                className={`${inputBaseStyle} appearance-none cursor-pointer [color-scheme:dark]`}
              />
            </div>

            {/* 시간 선택 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-blue-500/10 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <label className="text-xs font-bold text-gray-400">
                    시작
                  </label>
                </div>
                <select
                  value={currentStartTime}
                  onChange={(e) => setCurrentStartTime(e.target.value)}
                  className={`${inputBaseStyle} appearance-none cursor-pointer hover:bg-[#1a1a1a]`}
                >
                  {startTimeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-gray-500/10 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <label className="text-xs font-bold text-gray-400">
                    종료
                  </label>
                </div>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`${inputBaseStyle} appearance-none cursor-pointer hover:bg-[#1a1a1a]`}
                  disabled={availableEndTimes.length === 0}
                >
                  {/* [수정] 기본값 '선택' 옵션 추가 (값 없음) */}
                  <option value="" disabled>
                    선택
                  </option>
                  {availableEndTimes.length === 0 ? (
                    <option value="" disabled>
                      불가
                    </option>
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

          {/* 입력 필드 영역 */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <label className="text-xs font-bold text-gray-400">
                    예약자 이름
                  </label>
                </div>
                <span
                  className={`text-[10px] ${
                    userName.length >= MAX_NAME_LENGTH
                      ? "text-red-400"
                      : "text-gray-600"
                  }`}
                >
                  {userName.length}/{MAX_NAME_LENGTH}
                </span>
              </div>
              <input
                type="text"
                maxLength={MAX_NAME_LENGTH}
                placeholder="홍길동"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`${inputBaseStyle}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <label className="text-xs font-bold text-gray-400">
                    사용 목적
                  </label>
                </div>
                <span
                  className={`text-[10px] ${
                    purpose.length >= MAX_PURPOSE_LENGTH
                      ? "text-red-400"
                      : "text-gray-600"
                  }`}
                >
                  {purpose.length}/{MAX_PURPOSE_LENGTH}
                </span>
              </div>
              <input
                type="text"
                maxLength={MAX_PURPOSE_LENGTH}
                placeholder="예: 정기공연 합주"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={`${inputBaseStyle}`}
              />
            </div>
          </div>

          {/* [수정] 하단 버튼: 취소 / 예약 완료 2분할 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#252525] hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-200 border border-gray-700 rounded-xl font-bold transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending || availableEndTimes.length === 0}
              className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 disabled:text-blue-200/50 text-white rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {addMutation.isPending ? (
                "저장 중..."
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  예약 완료
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
