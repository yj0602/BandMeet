// src/components/ensemble/ensembleInfoSection.tsx
"use client"

import { useState, useEffect } from "react";
import type { Ensemble, Participant } from "@/types/ensemble_detail";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  LogOut, 
  User, 
  MessageSquare, 
  Trash2, 
  Send 
} from "lucide-react"; // 아이콘 통일성을 위해 추가

type Props = {
  ensemble: Ensemble;
  participants: Participant[];
};

type LocalComment = {
  id: string;
  content: string;
  created_at: string;
}

function format_time_range(start_time: string, end_time: string) {
  return `${start_time} ~ ${end_time}`;
}

function make_storage_key(ensemble_id: string) {
  return `bandmeet:ensemble:${ensemble_id}:comments`;
}

function load_comments(ensemble_id: string): LocalComment[] {
  try {
    const raw = localStorage.getItem(make_storage_key(ensemble_id));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save_comments(ensemble_id: string, comments: LocalComment[]) {
  try {
    localStorage.setItem(make_storage_key(ensemble_id), JSON.stringify(comments));
  } catch {
    // storage full / blocked 등은 무시
  }
}

function get_instrument_icon(instrument?: string) {
  switch (instrument) {
    case "Bass":
      return "🎸";
    case "Guitar":
      return "🎸";
    case "Drums":
      return "🥁";
    case "Keyboard":
      return "🎹";
    case "Vocal":
      return "🎤";
    default:
      return "🎵";
  }
}

export default function EnsembleInfoSection({ ensemble, participants }: Props) {

  useEffect(() => {
    // 1. 현재 body의 스타일을 백업 (나갈 때 복구하기 위해)
    const originalStyle = window.getComputedStyle(document.body).backgroundColor;
    const originalColor = window.getComputedStyle(document.body).color;

    // 2. 배경을 어두운 색(#121212)으로, 글자를 밝은 색으로 변경
    document.body.style.backgroundColor = "#121212";
    document.body.style.color = "#e5e7eb"; // tailwind text-gray-200

    // 3. 컴포넌트가 사라질 때(Unmount) 원래 색으로 복구
    return () => {
      document.body.style.backgroundColor = originalStyle;
      document.body.style.color = originalColor;
    };
  }, []);

  // const storage_key = useMemo(() => make_storage_key(ensemble.id), [ensemble.id]);

  // 최초 로드
  const [comments, set_comments] = useState<LocalComment[]>(() => {
    if (typeof window === "undefined") return [];
    return load_comments(ensemble.id);
  });
  const [comment_text, set_comment_text] = useState("");

  // 변경 시 저장 (옵션)
  useEffect(() => {
    if (typeof window === "undefined") return;
    save_comments(ensemble.id, comments);
  }, [ensemble.id, comments]);

    const on_add_comment = () => {
    const content = comment_text.trim();
    if (!content) return;

    const new_comment: LocalComment = {
      id: crypto.randomUUID(),
      content,
      created_at: new Date().toISOString(),
    };

    set_comments((prev) => [new_comment, ...prev]); // 최신이 위
    set_comment_text("");
  };

  const on_delete_comment = (id: string) => {
    set_comments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <section className="bg-[#121212] text-gray-200 min-h-screen p-4 md:p-6">
    <header className="mb-8 relative z-10">
    {/* 1행: 좌 로고 / 우 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs"></div>
            <span className="text-lg font-bold tracking-tight text-gray-100">BandMeet</span>
          </div>
        </div>

    {/* 2행: (모바일) 캡슐 */}
        <div className="mt-6 md:hidden">
          <div className="mx-auto rounded-full border border-gray-700 bg-[#1a1a1a] px-6 py-3 text-lg font-semibold truncate text-center text-gray-100 shadow-lg">
            {ensemble.title}
          </div>
        </div>

    {/* (데스크탑) 캡슐: 1행 위에 겹쳐서 중앙 고정 */}
        <div className="relative hidden md:block">
          <div className="absolute left-1/2 top-[-44px] -translate-x-1/2">
            <div className="rounded-full border border-gray-700 bg-[#1a1a1a] px-12 py-3 text-xl font-semibold truncate max-w-[60vw] text-center text-gray-100 shadow-xl">
              {ensemble.title}
            </div>
          </div>
        </div>
      </header>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-100">합주 정보</h2>
          <div className="h-px flex-1 bg-gray-800"></div>
        </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {/* 날짜 */}
        <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-5 flex flex-col gap-2 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>날짜</span>
          </div>
          <div className="text-lg font-medium text-gray-200">{ensemble.date}</div>
        </div>

        {/* 시간 */}
        <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-5 flex flex-col gap-2 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>시간</span>
          </div>
          <div className="text-lg font-medium text-gray-200">
            {format_time_range(ensemble.start_time, ensemble.end_time)}
          </div>
        </div>

        {/* 장소 */}
        <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-5 flex flex-col gap-2 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>장소</span>
          </div>
          <div className="text-lg font-medium text-gray-200">
            {ensemble.location ?? "-"}
          </div>
        </div>
      </div>

      <div className="mt-6 mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* 참여자 */}
        <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-base font-semibold text-gray-200">참여자</span>
            <span className="ml-auto text-xs text-gray-500 bg-[#252525] px-2 py-0.5 rounded-full border border-gray-800">
              {participants.length}명
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 max-h-[400px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1a1a1a] [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
            {participants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
                참여자가 없습니다.
              </div>
            ) : (
              <ul className="space-y-3">
                {participants.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-[#252525] border border-gray-800 p-3 hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-xl border border-blue-500/20">
                        {get_instrument_icon(p.instrument)}
                      </div>
                      <span className="text-base font-medium text-gray-200">{p.name}</span>
                    </div>
                    <span className="text-xs font-medium text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                      {p.instrument ?? "-"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 회고 (댓글 UI) */}
        <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span className="text-base font-semibold text-gray-200">회고 및 메모</span>
          </div>

          {/* 입력 */}
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full resize-none rounded-lg border border-gray-700 bg-[#121212] p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              rows={3}
              placeholder="합주에 대한 피드백이나 메모를 남겨주세요."
              value={comment_text}
              onChange={(e) => set_comment_text(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={on_add_comment}
                disabled={!comment_text.trim()}
              >
                <Send size={14} />
                등록
              </button>
            </div>
          </div>

          {/* 목록 */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1 max-h-[300px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1a1a1a] [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-gray-600 text-sm border-t border-dashed border-gray-800 mt-2">
                아직 작성된 회고가 없습니다.
              </div>
            ) : (
              <ul className="space-y-3 mt-2">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-lg border border-gray-800 bg-[#252525] p-3">
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {c.content}
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-700/50">
                      <span className="text-xs text-gray-500">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                        onClick={() => on_delete_comment(c.id)}
                      >
                        <Trash2 size={12} />
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 text-xs text-gray-600 flex items-center gap-1">
             * 이 내용은 브라우저에만 임시 저장됩니다.
          </div>
        </div>
      </div>
    </section>
  );
}