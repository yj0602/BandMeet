// src/components/ensemble/ensembleInfoSection.tsx
"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEnsembleComments, 
  useAddEnsembleComment, 
  useDeleteEnsembleComment, 
  useUpdateEnsemble
} from "@/hooks/useReservations"
import type { Ensemble, Participant } from "@/types/ensemble_detail";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  MessageSquare, 
  Trash2, 
  Send,
  Edit2, 
  Save,  
  X      
} from "lucide-react"; 

type Props = {
  ensemble: Ensemble;
  participants: Participant[];
};

function format_time_range(start_time: string, end_time: string) {
  return `${start_time} ~ ${end_time}`;
}

function get_instrument_icon(sessions?: string[]) {
  if (!sessions || sessions.length === 0) return "🎵";
  
  const session = sessions[0].toLowerCase();

  if (session.includes("보컬") || session.includes("vocal") || session.includes("🎤")) return "🎤";
  if (session.includes("기타") || session.includes("guitar") || session.includes("🎸")) return "🎸";
  if (session.includes("베이스") || session.includes("bass")) return "🎸"; 
  if (session.includes("드럼") || session.includes("drum") || session.includes("🥁")) return "🥁";
  if (session.includes("키보드") || session.includes("건반") || session.includes("피아노") || session.includes("piano") || session.includes("key")) return "🎹";
  
  return "🎵";
}

export default function EnsembleInfoSection({ ensemble, participants }: Props) {
  const [comment_text, set_comment_text] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  const [editTitle, setEditTitle] = useState(ensemble.title);
  const [editLocation, setEditLocation] = useState(ensemble.location ?? "");
  
  const [displayTitle, setDisplayTitle] = useState(ensemble.title);
  const [displayLocation, setDisplayLocation] = useState(ensemble.location ?? "-");
  
  const updateEnsemble = useUpdateEnsemble();
  const router = useRouter();

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).backgroundColor;
    const originalColor = window.getComputedStyle(document.body).color;

    document.body.style.backgroundColor = "#121212";
    document.body.style.color = "#e5e7eb";

    return () => {
      document.body.style.backgroundColor = originalStyle;
      document.body.style.color = originalColor;
    };
  }, []);

  const { data: comments = [], isLoading } = useEnsembleComments(ensemble.id);
  const addComment = useAddEnsembleComment();
  const deleteComment = useDeleteEnsembleComment();

  const on_add_comment = async () => {
    const content = comment_text.trim();
    if (!content) return;

    await addComment.mutateAsync({
      ensembleId: ensemble.id,
      content,
    });

    set_comment_text("");
  };

  const on_delete_comment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    
    await deleteComment.mutateAsync({
      commentId,
      ensembleId: ensemble.id,
    });
  };

  const handleSaveInfo = async () => {
    if (!editTitle.trim()) {
      alert("합주 제목을 입력해주세요.");
      return;
    }

    try {
      await updateEnsemble.mutateAsync({
        id: ensemble.id,
        title: editTitle,
        location: editLocation,
      });

      setDisplayTitle(editTitle);
      setDisplayLocation(editLocation || "-");
      
      setIsEditing(false);
      router.refresh(); 

    } catch (error) {
      console.error(error);
      setEditTitle(displayTitle);
      setEditLocation(displayLocation !== "-" ? displayLocation : "");
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(displayTitle);
    setEditLocation(displayLocation !== "-" ? displayLocation : "");
    setIsEditing(false);
  };

  return (
    <section className="bg-[#121212] text-gray-200 min-h-screen p-4 md:p-6">
      <header className="mb-8 relative z-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
          <span className="text-[#58a6ff] text-xl">📅</span>
            <span className="text-lg font-bold tracking-tight text-gray-100">BandMeet</span>
          </Link>
        </div>

        {/* ✅ 제목 (모바일) */}
        <div className="mt-6 md:hidden">
          {isEditing ? (
            <input 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              className="mx-auto block w-full max-w-[85vw] rounded-full border border-blue-500 bg-[#1a1a1a] px-6 py-3 text-lg font-semibold text-center text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
              placeholder="합주 제목"
              autoFocus
            />
          ) : (
            <div className="mx-auto rounded-full border border-gray-700 bg-[#1a1a1a] px-6 py-3 text-lg font-semibold text-center text-gray-100 shadow-lg">
              <span className="truncate block">{displayTitle}</span>
            </div>
          )}
        </div>

        {/* ✅ 제목 (데스크탑) */}
        <div className="relative hidden md:block">
          <div className="absolute left-1/2 top-[-44px] -translate-x-1/2">
            {isEditing ? (
              <input 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded-full border border-blue-500 bg-[#1a1a1a] px-12 py-3 text-xl font-semibold min-w-[400px] max-w-[60vw] text-center text-white shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
                placeholder="합주 제목"
                autoFocus
              />
            ) : (
              <div className="rounded-full border border-gray-700 bg-[#1a1a1a] px-12 py-3 text-xl font-semibold max-w-[60vw] text-center text-gray-100 shadow-xl">
                <span className="truncate block">{displayTitle}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 합주 정보 & 수정 토글 버튼 영역 */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-gray-100">합주 정보</h2>
        <div className="h-px flex-1 bg-gray-800"></div>
        
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={handleSaveInfo} className="flex items-center gap-1 text-sm bg-blue-600 px-3 py-1.5 rounded-lg text-white hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">
              <Save size={14} /> 저장
            </button>
            <button onClick={handleCancelEdit} className="flex items-center gap-1 text-sm bg-gray-700 border border-gray-600 px-3 py-1.5 rounded-lg text-white hover:bg-gray-600 transition">
              <X size={14} /> 취소
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-sm bg-[#1a1a1a] border border-gray-700 px-3 py-1.5 rounded-lg text-gray-300 hover:bg-gray-800 transition">
            <Edit2 size={14} /> 정보 수정
          </button>
        )}
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

        {/* ✅ 장소 입력/표시 */}
        <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-5 flex flex-col justify-center hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>장소</span>
          </div>
          
          {isEditing ? (
            <input 
              value={editLocation} 
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#121212] px-3 py-2 text-base text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="장소를 입력하세요"
            />
          ) : (
            <div className="text-lg font-medium text-gray-200">
              {displayLocation}
            </div>
          )}
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
                {participants.map((p,idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-[#252525] border border-gray-800 p-3 hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-xl border border-blue-500/20">
                        {get_instrument_icon(p.sessions)}
                      </div>
                      <span className="text-base font-medium text-gray-200">{p.name}</span>
                    </div>
                    {p.sessions?.map((s) => (
                      <span key={s} className="text-[10px] font-medium text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                        {s}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 회고 섹션 - 서버 연동 */}
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
              disabled={addComment.isPending}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={on_add_comment}
                disabled={!comment_text.trim() || addComment.isPending}
              >
                <Send size={14} />
                {addComment.isPending ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>

          {/* 목록 */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1 max-h-[300px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1a1a1a] [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
                로딩 중...
              </div>
            ) : comments.length === 0 ? (
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
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                        onClick={() => on_delete_comment(c.id)}
                        disabled={deleteComment.isPending}
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
        </div>
      </div>
    </section>
  );
}