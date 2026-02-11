// src/components/concert/concertInfoSection.tsx
"use client";

import { supabase } from "@/utils/supabase";
import type { Concert, SetListItem } from "@/types/concert_detail";
import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Edit3,
  Save,
  X,
  Music,
  AlignLeft,
  Clock,
  Ticket,
  Plus,
  Trash2,
} from "lucide-react";

type Props = {
  concert: Concert;
  setList?: SetListItem[];
};

// 셋리 수정 관련
type SetListDraftItem = {
  id: string;
  title: string;
  note?: string;
};

const normalizeToSaved = (draft: SetListDraftItem[]): SetListItem[] => {
  const filtered = draft.filter((x) => x.title.trim() !== "");
  return filtered.map((x, idx) => ({
    order: idx + 1,
    title: x.title.trim(),
    note: (x.note ?? "").trim() || undefined,
  }));
};

const toDraft = (items?: SetListItem[]): SetListDraftItem[] => {
  const base = items ?? [];
  if (base.length === 0) return [{ id: uuidv4(), title: "", note: "" }];
  return base.map((x) => ({ 
    id: uuidv4(),
    title: x.title, 
    note: x.note ?? "" 
  }));
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const makeTimeOptions = (startHour = 0, endHour = 24) => {
  const options: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    options.push(`${pad2(h)}:00`);
    options.push(`${pad2(h)}:30`);
  }
  // 24:00을 쓰고 싶으면 여기에서 options.push("24:00") 처리 가능
  return options;
};

const TIME_OPTIONS = makeTimeOptions(0, 24);

const compareTime = (a?: string | null, b?: string | null) => {
  if (!a || !b) return 0;
  // "HH:mm"
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return (ah * 60 + am) - (bh * 60 + bm);
};

const TimeSelect = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-[#58a6ff] disabled:opacity-50"
      >
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
};


export default function ConcertInfoSection({ concert, setList }: Props) {
  // ✅ concert.set_list를 우선 사용, props.setList는 fallback
  const actualSetList = concert.set_list ?? setList ?? [];

  // 배경색 관련
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).backgroundColor;
    const originalColor = window.getComputedStyle(document.body).color;
    document.body.style.backgroundColor = "#050505"; 
    document.body.style.color = "#e5e7eb";
    return () => {
      document.body.style.backgroundColor = originalStyle;
      document.body.style.color = originalColor;
    };
  }, []);

  const [isEditing, setIsEditing] = useState(false);

  const [rehearsalStart, setRehearsalStart] = useState(
    concert.rehearsal_start_time ?? "13:00"
  );
  const [rehearsalEnd, setRehearsalEnd] = useState(
    concert.rehearsal_end_time ?? "16:00"
  );

  const [performanceStart, setPerformanceStart] = useState(concert.start_time ?? "18:00");
  const [performanceEnd, setPerformanceEnd] = useState(concert.end_time ?? "21:00");

  const [memoText, setMemoText] = useState(concert.memo ?? "");

  // ✅ actualSetList로 초기화
  const [draftSetList, setDraftSetList] = useState<SetListDraftItem[]>(() => toDraft(actualSetList));

  // 편집 중이 아닐 때만 props 변화 동기화
useEffect(() => {
  if (!isEditing) {
    setDraftSetList(toDraft(actualSetList));
    setMemoText(concert.memo ?? "");

    setRehearsalStart(concert.rehearsal_start_time ?? "13:00");
    setRehearsalEnd(concert.rehearsal_end_time ?? "16:00");
    setPerformanceStart(concert.start_time ?? "18:00");
    setPerformanceEnd(concert.end_time ?? "21:00");
  }
}, [concert.set_list, setList, concert.memo, isEditing, concert.rehearsal_start_time, concert.rehearsal_end_time, concert.start_time, concert.end_time]);

const startEdit = () => {
    setDraftSetList(toDraft(actualSetList));
    setMemoText(concert.memo ?? "");

    setRehearsalStart(concert.rehearsal_start_time ?? "13:00");
    setRehearsalEnd(concert.rehearsal_end_time ?? "16:00");
    setPerformanceStart(concert.start_time ?? "18:00");
    setPerformanceEnd(concert.end_time ?? "21:00");

    setIsEditing(true);
  };


  const addSetRow = () => {
    setDraftSetList((prev) => [...prev, { id: uuidv4(), title: "", note: "" }]);
  };

  const removeSetRow = (id: string) => {
    setDraftSetList((prev) => (prev.length === 1 ? prev : prev.filter((x) => x.id !== id)));
  };

  const updateSetRow = (id: string, patch: Partial<SetListDraftItem>) => {
    setDraftSetList((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
  setIsSaving(true);

  try {
    const validSetList = normalizeToSaved(draftSetList);

    const { error } = await supabase
      .from("concerts")
      .update({
        rehearsal_start_time: rehearsalStart || null,
        rehearsal_end_time: rehearsalEnd || null,
        start_time: performanceStart,
        end_time: performanceEnd,
        memo: memoText, // ✅ 테이블에 memo 컬럼이 있을 때만
        set_list: validSetList.length > 0 ? validSetList : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", concert.id);

    if (error) {
      console.error("Update error:", error);
      alert("저장에 실패했습니다.");
      return;
    }

    alert("저장되었습니다.");
    window.location.reload();
    setIsEditing(false);
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("저장 중 오류가 발생했습니다.");
  } finally {
    setIsSaving(false);
  }
};


  const handleCancel = () => {
    setDraftSetList(toDraft(actualSetList));
    setMemoText(concert.memo ?? "");

    setRehearsalStart(concert.rehearsal_start_time ?? "13:00");
    setRehearsalEnd(concert.rehearsal_end_time ?? "16:00");
    setPerformanceStart(concert.start_time ?? "18:00");
    setPerformanceEnd(concert.end_time ?? "21:00");

    setIsEditing(false);
  };

  const scrollbarStyle = 
    "overflow-y-auto pr-2 " +
    "[&::-webkit-scrollbar]:w-1 " +
    "[&::-webkit-scrollbar-track]:bg-white/5 " +
    "[&::-webkit-scrollbar-thumb]:bg-gray-600 " +
    "[&::-webkit-scrollbar-thumb]:rounded-full " +
    "hover:[&::-webkit-scrollbar-thumb]:bg-gray-400";
    
  // ✅ actualSetList로 정렬
  const sortedSetList = actualSetList.length > 0 
    ? [...actualSetList].sort((a, b) => a.order - b.order) 
    : [];

  return (
    <section className="bg-[#050505] text-gray-200 min-h-screen p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* 배경 장식 (Background Glow) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 헤더 */}
      <header className="w-full max-w-xl mb-8 flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <span className="text-[#58a6ff] text-xl">📅</span>
            <span className="text-xl font-bold tracking-tight text-white/90">
              BandMeet
            </span>
          </Link>
      </header>

      {/* 메인 티켓 UI */}
      <div className="w-full max-w-xl relative z-10 perspective-1000">
        {/* 그림자 효과 */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-blue-500/5 blur-xl transform scale-95 translate-y-4" />
        
        <div className="bg-[#121212] rounded-[2rem] overflow-hidden border border-white/10 relative shadow-2xl">
          
          {/* 상단 장식 바 */}
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500" />

          {/* 1. 상단 정보 (헤더) */}
          <div className="p-8 pb-6 bg-[#18181b] relative">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* 수정 버튼 */}
            <div className="absolute top-6 right-6 z-20">
              {isEditing ? (
                <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <button 
                    onClick={handleCancel} 
                    disabled={isSaving}
                    className="p-2.5 rounded-full bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors border border-white/5 disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black hover:bg-gray-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={startEdit} 
                  className="group p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all"
                >
                  <Edit3 size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>

            {/* 티켓 상단 라벨 */}
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Ticket size={14} className="text-violet-400" />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-violet-300">Live Concert Ticket</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-center text-white mb-8 break-keep leading-tight px-2 tracking-tight drop-shadow-lg">
              {concert.title}
            </h1>

            {/* 날짜/장소 배지 */}
            <div className="flex flex-wrap justify-center gap-3 relative z-10">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10 bg-black/40 text-sm text-gray-200 backdrop-blur-sm">
                <Calendar size={16} className="text-fuchsia-400" />
                <span className="font-mono font-medium tracking-wide">{concert.date}</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10 bg-black/40 text-sm text-gray-200 backdrop-blur-sm">
                <MapPin size={16} className="text-blue-400" />
                <span className="font-medium">{concert.location ?? "장소 미정"}</span>
              </div>
            </div>
          </div>

          {/* 절취선 (Punch Holes) */}
          <div className="relative flex items-center justify-between bg-[#18181b]">
            <div className="absolute left-[-12px] w-6 h-6 bg-[#050505] rounded-full shadow-[inset_-2px_0_5px_rgba(0,0,0,0.5)]" />
            <div className="flex-1 border-b-2 border-dashed border-white/10 mx-6" />
            <div className="absolute right-[-12px] w-6 h-6 bg-[#050505] rounded-full shadow-[inset_2px_0_5px_rgba(0,0,0,0.5)]" />
          </div>

          {/* 2. 중간 영역 (Time Table) */}
          <div className="bg-[#18181b] px-6 py-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* 리허설 정보 */}
              <div
                className={`group relative rounded-2xl p-5 border flex flex-col min-h-[180px] transition-all duration-300 ${
                  isEditing
                    ? "border-violet-500/50 bg-[#0a0a0a] shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${isEditing ? "bg-violet-500 animate-pulse" : "bg-gray-600"}`} />
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Rehearsal
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-4 flex-1">
                    <TimeSelect
                      label="리허설 시작"
                      value={rehearsalStart}
                      onChange={(v) => {
                        setRehearsalStart(v);
                        if (compareTime(v, rehearsalEnd) > 0) setRehearsalEnd(v);
                      }}
                      disabled={isSaving}
                    />
                    <TimeSelect
                      label="리허설 종료"
                      value={rehearsalEnd}
                      onChange={(v) => {
                        setRehearsalEnd(v);
                        if (compareTime(rehearsalStart, v) > 0) setRehearsalStart(v);
                      }}
                      disabled={isSaving}
                    />
                  </div>
                ) : (
                  <div className={`text-sm text-gray-400 whitespace-pre-wrap leading-relaxed flex-1 font-mono ${scrollbarStyle}`}>
                    {concert.rehearsal_start_time && concert.rehearsal_end_time
                      ? `${concert.rehearsal_start_time} ~ ${concert.rehearsal_end_time} 리허설`
                      : "리허설 정보를 입력해주세요."}
                  </div>
                )}
              </div>

              {/* 본 공연 정보 */}
              <div
                className={`group relative rounded-2xl p-5 border flex flex-col min-h-[180px] transition-all duration-300 ${
                  isEditing
                    ? "border-blue-500/50 bg-[#0a0a0a] shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    : "border-white/10 bg-gradient-to-br from-violet-500/5 to-blue-500/5"
                }`}
              >
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <Clock size={12} className={isEditing ? "text-blue-500" : "text-blue-400"} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isEditing ? "text-blue-500" : "text-blue-300"}`}>
                    Performance
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-4 flex-1">
                    <TimeSelect
                      label="본공연 시작"
                      value={performanceStart}
                      onChange={(v) => {
                        setPerformanceStart(v);
                        if (compareTime(v, performanceEnd) > 0) setPerformanceEnd(v);
                      }}
                      disabled={isSaving}
                    />
                    <TimeSelect
                      label="본공연 종료"
                      value={performanceEnd}
                      onChange={(v) => {
                        setPerformanceEnd(v);
                        if (compareTime(performanceStart, v) > 0) setPerformanceStart(v);
                      }}
                      disabled={isSaving}
                    />
                  </div>
                ) : (
                  <div className={`text-sm text-white/90 whitespace-pre-wrap leading-relaxed font-medium flex-1 font-mono ${scrollbarStyle}`}>
                    {`${concert.start_time} ~ ${concert.end_time} 본공연`}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 절취선 2 */}
          <div className="relative flex items-center justify-between bg-[#18181b]">
            <div className="absolute left-[-12px] w-6 h-6 bg-[#050505] rounded-full shadow-[inset_-2px_0_5px_rgba(0,0,0,0.5)]" />
            <div className="flex-1 border-b-2 border-dashed border-white/10 mx-6" />
            <div className="absolute right-[-12px] w-6 h-6 bg-[#050505] rounded-full shadow-[inset_2px_0_5px_rgba(0,0,0,0.5)]" />
          </div>

          {/* 3. 하단 영역 (셋리스트 / 메모) */}
          <div className="bg-[#18181b] px-6 py-8 md:px-8 pb-10 rounded-b-[2rem] relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Set List */}
              <div className="border-l border-white/10 pl-5 h-[170px] flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Music size={14} className="text-gray-500" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Set List</h3>
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={addSetRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[11px] text-gray-300 hover:bg-white/10 hover:text-white transition"
                    >
                      <Plus className="w-4 h-4" />
                      곡 추가
                    </button>
                  )}
                </div>

                <div className={`flex-1 ${scrollbarStyle} pr-2`}>
                  {isEditing ? (
                    <div className="space-y-3">
                      {draftSetList.map((item, idx) => (
                        <div key={item.id} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-gray-600 mt-2 w-6">
                            {String(idx + 1).padStart(2, "0")}
                          </span>

                          <div className="flex-1 space-y-2">
                            <input
                              value={item.title}
                              onChange={(e) => updateSetRow(item.id, { title: e.target.value })}
                              placeholder="곡 제목"
                              className="w-full p-2.5 rounded-xl border border-white/10 bg-[#0a0a0a] text-sm text-gray-200 outline-none focus:ring-2 focus:ring-[#58a6ff]"
                            />
                            <input
                              value={item.note ?? ""}
                              onChange={(e) => updateSetRow(item.id, { note: e.target.value })}
                              placeholder="메모 (선택)"
                              className="w-full p-2.5 rounded-xl border border-white/10 bg-[#0a0a0a] text-[12px] text-gray-300 outline-none focus:ring-2 focus:ring-[#58a6ff]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSetRow(item.id)}
                            className="mt-1 p-2 rounded-lg bg-white/5 hover:bg-red-900/30 text-gray-400 hover:text-red-400 border border-white/10 transition"
                            aria-label="곡 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      <p className="text-[11px] text-gray-500">
                        * 곡 제목이 비어있는 항목은 저장 시 자동으로 제외됩니다.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {sortedSetList.length > 0 ? (
                        sortedSetList.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 group">
                            <span className="text-[10px] font-mono text-gray-600 mt-1 group-hover:text-violet-400 transition-colors">
                              {String(item.order).padStart(2, "0")}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                                {item.title}
                              </span>
                              {item.note && <span className="text-[11px] text-gray-600 italic mt-0.5">{item.note}</span>}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-gray-600 italic">등록된 셋리스트가 없습니다.</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Memo */}
              <div className="border-l border-white/10 pl-5 md:border-l-0 md:pl-0 h-[170px] flex flex-col">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <AlignLeft size={14} className="text-gray-500" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memo</h3>
                </div>
                {isEditing ? (
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-3 shadow-inner flex-1 flex flex-col ring-1 ring-white/5 focus-within:ring-violet-500/50 transition-all">
                    <textarea
                      value={memoText}
                      onChange={(e) => setMemoText(e.target.value)}
                      className="w-full flex-1 bg-transparent outline-none resize-none text-sm text-gray-200 placeholder:text-gray-700 custom-scrollbar leading-relaxed"
                      placeholder="메모를 입력하세요..."
                    />
                  </div>
                ) : (
                  <div className={`bg-white/[0.02] rounded-xl p-4 text-sm text-gray-400 flex-1 whitespace-pre-wrap leading-relaxed border border-white/5 ${scrollbarStyle}`}>
                    {memoText || <span className="text-gray-700 text-xs italic">작성된 메모가 없습니다.</span>}
                  </div>
                )}
              </div>
            </div>

            {/* 바코드 장식 (Footer) */}
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-end opacity-40">
               <div className="flex flex-col gap-1">
                 <div className="h-4 w-32 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Code_39_24-bit_color.svg/200px-Code_39_24-bit_color.svg.png')] bg-contain bg-no-repeat bg-left opacity-50 grayscale invert" />
               </div>
               <span className="text-[9px] font-mono text-gray-600">MECHANICS TICKET</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}