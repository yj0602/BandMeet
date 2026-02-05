// src/components/concert/concertInfoSection.tsx
"use client";

import type { Concert, SetListItem } from "@/types/concert_detail";
import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  LogOut,
  Edit3,
  Save,
  X,
  Music,
  AlignLeft,
  Clock,
  Ticket,
} from "lucide-react";

type Props = {
  concert: Concert;
  setList: SetListItem[];
  memo?: string;
};

export default function ConcertInfoSection({ concert, setList, memo }: Props) {
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

  const [rehearsalText, setRehearsalText] = useState(
    concert.rehearsal_start_time && concert.rehearsal_end_time
      ? `${concert.rehearsal_start_time} ~ ${concert.rehearsal_end_time} 리허설`
      : "리허설 정보를 입력해주세요."
  );

  const [performanceText, setPerformanceText] = useState(
    `${concert.start_time} ~ ${concert.end_time} 본공연`
  );

  const [memoText, setMemoText] = useState(memo ?? "");

  const handleSave = () => {
    console.log("UPDATE API 호출:", {
      concertId: concert.id,
      rehearsal_text_local: rehearsalText,
      performance_text_local: performanceText,
      memo: memoText,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const scrollbarStyle = 
    "overflow-y-auto pr-2 " +
    "[&::-webkit-scrollbar]:w-1 " +
    "[&::-webkit-scrollbar-track]:bg-white/5 " +
    "[&::-webkit-scrollbar-thumb]:bg-gray-600 " +
    "[&::-webkit-scrollbar-thumb]:rounded-full " +
    "hover:[&::-webkit-scrollbar-thumb]:bg-gray-400";

  return (
    <section className="bg-[#050505] text-gray-200 min-h-screen p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* 배경 장식 (Background Glow) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 헤더 */}
      <header className="w-full max-w-xl mb-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-violet-500/20 ring-1 ring-white/10"></div>
          <span className="text-xl font-bold tracking-tight text-white/90">
            BandMeet
          </span>
        </div>
        <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md">
          <LogOut size={14} />
          <span>로그아웃</span>
        </button>
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
                  <button onClick={handleCancel} className="p-2.5 rounded-full bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors border border-white/5">
                    <X size={16} />
                  </button>
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black hover:bg-gray-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <Save size={14} />
                    저장
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
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
              <div className={`group relative rounded-2xl p-5 border flex flex-col h-[180px] transition-all duration-300 ${isEditing ? 'border-violet-500/50 bg-[#0a0a0a] shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-violet-500 animate-pulse' : 'bg-gray-600'}`} />
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rehearsal</span>
                </div>
                
                {isEditing ? (
                  <textarea
                    value={rehearsalText}
                    onChange={(e) => setRehearsalText(e.target.value)}
                    className={`w-full flex-1 bg-transparent text-sm text-gray-200 outline-none resize-none placeholder:text-gray-700 font-mono leading-relaxed ${scrollbarStyle}`}
                  />
                ) : (
                  <div className={`text-sm text-gray-400 whitespace-pre-wrap leading-relaxed flex-1 font-mono ${scrollbarStyle}`}>
                    {rehearsalText}
                  </div>
                )}
              </div>

              {/* 본 공연 정보 */}
              <div className={`group relative rounded-2xl p-5 border flex flex-col h-[180px] transition-all duration-300 ${isEditing ? 'border-blue-500/50 bg-[#0a0a0a] shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/10 bg-gradient-to-br from-violet-500/5 to-blue-500/5'}`}>
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <Clock size={12} className={isEditing ? 'text-blue-500' : 'text-blue-400'} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isEditing ? 'text-blue-500' : 'text-blue-300'}`}>Performance</span>
                </div>

                {isEditing ? (
                   <textarea
                   value={performanceText}
                   onChange={(e) => setPerformanceText(e.target.value)}
                   className={`w-full flex-1 bg-transparent text-sm text-gray-200 outline-none resize-none placeholder:text-gray-700 font-mono leading-relaxed ${scrollbarStyle}`}
                 />
                ) : (
                  <div className={`text-sm text-white/90 whitespace-pre-wrap leading-relaxed font-medium flex-1 font-mono ${scrollbarStyle}`}>
                    {performanceText}
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
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <Music size={14} className="text-gray-500" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Set List</h3>
                </div>
                <ul className={`space-y-3 flex-1 ${scrollbarStyle} pr-2`}>
                  {setList && setList.length > 0 ? (
                    setList
                      .sort((a, b) => a.order - b.order)
                      .map((item: SetListItem) => (
                      <li key={item.id} className="flex items-start gap-3 group">
                        <span className="text-[10px] font-mono text-gray-600 mt-1 group-hover:text-violet-400 transition-colors">
                          {String(item.order).padStart(2, '0')}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{item.title}</span>
                          {item.note && <span className="text-[11px] text-gray-600 italic mt-0.5">{item.note}</span>}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-gray-600 italic">등록된 셋리스트가 없습니다.</li>
                  )}
                </ul>
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