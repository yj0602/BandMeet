// src/components/ReservationConcert/ReservationConcert.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { timeToMinutes } from "@/utils/date";

import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase"; // ✅ Supabase import
import { v4 as uuidv4 } from "uuid";

import { Clock, Check, Plus, Trash2, MapPin, Music, LogOut } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  format,
} from "date-fns";

type SetListDraftItem = {
  id: string;
  title: string;
  note?: string;
};

export default function ConcertCreate() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [concertTitle, setConcertTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [setList, setSetList] = useState<SetListDraftItem[]>([
    { id: uuidv4(), title: "", note: "" },
  ]);

  // ✅ 로딩/에러 상태 추가
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  const timeOptions = useMemo(() => {
    const times: string[] = [];
    for (let h = 9; h < 24; h++) {
      times.push(`${String(h).padStart(2, "0")}:00`);
      times.push(`${String(h).padStart(2, "0")}:30`);
    }
    return times.filter((t) => t !== "24:00" && t !== "24:30");
  }, []);

  const isTimeRangeValid =
    startTime !== "" && endTime !== "" && timeToMinutes(startTime) < timeToMinutes(endTime);

  const canSubmit =
    concertTitle.trim() !== "" &&
    !!selectedDate &&
    venue.trim() !== "" &&
    isTimeRangeValid &&
    setList.some((x) => x.title.trim() !== "");

  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dates = useMemo(() => {
    if (!currentMonth) return [];
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePickDate = (dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  const addSetListRow = () => {
    setSetList((prev) => [...prev, { id: uuidv4(), title: "", note: "" }]);
  };

  const removeSetListRow = (id: string) => {
    setSetList((prev) => (prev.length === 1 ? prev : prev.filter((x) => x.id !== id)));
  };

  const updateSetListRow = (id: string, patch: Partial<SetListDraftItem>) => {
    setSetList((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  // ✅ Supabase에 저장
  const handleCreateConcert = async () => {
  if (!canSubmit || isSubmitting) return;

  setIsSubmitting(true);

  try {
    // ✅ 빈 제목 제외한 셋리스트만 필터링
    const validSetList = setList
      .filter((item) => item.title.trim() !== "")
      .map((item, index) => ({
        order: index + 1,
        title: item.title.trim(),
        note: item.note?.trim() || null,
      }));

    // Supabase에 insert할 데이터
    const concertData = {
      title: concertTitle.trim(),
      date: selectedDate!, // "YYYY-MM-DD"
      start_time: startTime, // "HH:mm"
      end_time: endTime, // "HH:mm"
      location: venue.trim(),
      kind: "concert",
      set_list: validSetList.length > 0 ? validSetList : null, // ✅ 셋리스트 추가
      // id, created_at, updated_at은 Supabase에서 자동 생성
    };

    const { data, error } = await supabase
      .from("concerts")
      .insert(concertData)
      .select()
      .single();

    if (error) {
      console.error("Concert insert error:", error);
      alert("공연 생성에 실패했습니다.");
      return;
    }

    console.log("Concert created:", data);

    // ✅ 캐시 무효화 → 메인 화면 즉시 반영
    queryClient.invalidateQueries({ queryKey: ["reservations"] });

    alert("공연이 생성되었습니다!");
    router.push("/");
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("공연 생성 중 오류가 발생했습니다.");
  } finally {
    setIsSubmitting(false);
  }
};

  if (!currentMonth) return <div className="text-gray-500">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center p-6 text-[#c9d1d9] font-sans">
      <header className="w-full max-w-xl mb-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-violet-500/20 ring-1 ring-white/10"></div>
          <span className="text-xl font-bold tracking-tight text-white/90">BandMeet</span>
        </div>
      </header>

      <main className="w-full max-w-2xl bg-[#0d1117] rounded-3xl">
        <div className="mb-8 text-center">
          <input
            type="text"
            placeholder="공연 제목 입력"
            className="w-full max-w-md text-3xl font-extrabold text-center border-none focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#161b22] py-4 rounded-2xl placeholder-[#484f58] text-[#f0f6fc]"
            value={concertTitle}
            onChange={(e) => setConcertTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section>
            <h3 className="text-lg font-semibold mb-6 text-center text-[#f0f6fc]">날짜 선택</h3>
            <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="font-bold text-[#58a6ff]">{format(currentMonth, "yyyy년 M월")}</span>
                <div className="flex gap-4 text-[#8b949e]">
                  <button className="hover:text-white" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    〈
                  </button>
                  <button className="hover:text-white" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    〉
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2 text-center">
                {days.map((day) => (
                  <div key={day} className="text-[10px] text-gray-500 font-medium">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {dates.map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const selected = selectedDate === dateStr;
                  const isCur = isSameMonth(date, currentMonth);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handlePickDate(dateStr)}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg transition text-sm
                        ${
                          selected
                            ? "bg-[#1f6feb] text-white font-bold"
                            : isCur
                              ? "hover:bg-[#30363d] text-[#c9d1d9]"
                              : "text-gray-600"
                        }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-xs text-gray-400">
                선택된 날짜: <span className="text-white/90 font-mono">{selectedDate ?? "없음"}</span>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-center text-[#f0f6fc]">장소</h3>
              <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Location</span>
                </div>
                <input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="예: The Vinyl Underground"
                  className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:ring-2 focus:ring-[#58a6ff] outline-none"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-center text-[#f0f6fc]">시간</h3>
              <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <label className="text-xs font-bold text-gray-400 uppercase">시작 시간</label>
                  </div>
                  <select
                    className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:ring-2 focus:ring-[#58a6ff] outline-none"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    <option value="">선택</option>
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-gray-500/10 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <label className="text-xs font-bold text-gray-400 uppercase">종료 시간</label>
                  </div>
                  <select
                    className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:ring-2 focus:ring-[#58a6ff] outline-none"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  >
                    <option value="">선택</option>
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {!isTimeRangeValid && startTime && endTime && (
                  <p className="text-xs text-red-400">종료 시간이 시작 시간보다 늦어야 합니다.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-center text-[#f0f6fc]">셋리스트</h3>
              <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase">Set List</span>
                  </div>
                  <button
                    type="button"
                    onClick={addSetListRow}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <Plus className="w-4 h-4" />
                    곡 추가
                  </button>
                </div>

                <div className="space-y-3">
                  {setList.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <div className="w-8 text-xs text-gray-500 font-mono pt-3">
                        {String(idx + 1).padStart(2, "0")}
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          value={item.title}
                          onChange={(e) => updateSetListRow(item.id, { title: e.target.value })}
                          placeholder="곡 제목"
                          className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] outline-none focus:ring-2 focus:ring-[#58a6ff]"
                        />
                        <input
                          value={item.note ?? ""}
                          onChange={(e) => updateSetListRow(item.id, { note: e.target.value })}
                          placeholder="메모 (선택) 예: Half Down 튜닝"
                          className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] outline-none focus:ring-2 focus:ring-[#58a6ff]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSetListRow(item.id)}
                        className="mt-2 p-2 rounded-lg bg-white/5 hover:bg-red-900/30 text-gray-400 hover:text-red-400 border border-white/10 transition"
                        aria-label="곡 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-[11px] text-gray-500">
                  * 곡 제목이 비어있는 항목은 저장 시 자동으로 제외됩니다.
                </p>
              </div>
            </div>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={handleCreateConcert}
                disabled={!canSubmit || isSubmitting}
                className={`flex-1 py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20
                  ${
                    !canSubmit || isSubmitting
                      ? "bg-blue-900/50 text-blue-200/50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
              >
                <Check className="w-5 h-5" />
                {isSubmitting ? "저장 중..." : "공연 생성"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}