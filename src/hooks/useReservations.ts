import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { Reservation } from "@/types";
import { formatToDbDate } from "@/utils/date";
import type { Ensemble, Participant } from "@/types/ensemble_detail";
import type { Concert, SetListItem } from "@/types/concert_detail";
import { useEffect } from "react"; // ✅ 추가

// Supabase에서 가져온 데이터 타입 (DB 원본)
type EnsembleRow = {
  id: string;
  room_id: string;
  title: string;
  date: string; // DATE 타입 → "YYYY-MM-DD" 문자열로 반환됨
  start_time: string; // TIME 타입 → "HH:mm:ss" 문자열로 반환됨
  end_time: string;
  location?: string;
  created_at: string;
  updated_at: string;
  kind: string;
  participants: Participant[];
  status: 'open' | 'confirmed';
};

// Supabase에서 가져온 데이터 타입 (DB 원본)
type ConcertRow = {
  id: string;
  title: string;
  date: string; // DATE 타입 → "YYYY-MM-DD" 문자열로 반환됨
  start_time: string; // TIME 타입 → "HH:mm:ss" 문자열로 반환됨
  end_time: string;
  rehearsal_start_time?: string;
  rehearsal_end_time?: string;
  location?: string;
  set_list?: SetListItem[] | null;
  created_at: string;
  updated_at: string;
  owner_id?: string;
  kind: string;
  memo?: string;
};

// 개인 일정 타입
type PersonalEventRow = {
  id: string;
  name: string;
  purpose: string;
  date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

// ============================================
// 댓글 관련 훅
// ============================================

type CommentRow = {
  id: string;
  ensemble_id: string;
  content: string;
  created_at: string;
};

export type EnsembleComment = {
  id: string;
  ensemble_id: string;
  content: string;
  created_at: string;
};

// [Read] 특정 합주의 댓글 목록 가져오기
export const useEnsembleComments = (ensembleId: string) => {
  return useQuery({
    queryKey: ["ensemble-comments", ensembleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ensemble_comments")
        .select("*")
        .eq("ensemble_id", ensembleId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as CommentRow[]) || [];
    },
  });
};

// [Create] 댓글 추가
export const useAddEnsembleComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ensembleId, 
      content 
    }: { 
      ensembleId: string; 
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("ensemble_comments")
        .insert({
          ensemble_id: ensembleId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as CommentRow;
    },
    onSuccess: (_, variables) => {
      // 해당 합주의 댓글 목록 갱신
      queryClient.invalidateQueries({ 
        queryKey: ["ensemble-comments", variables.ensembleId] 
      });
    },
    onError: (error) => {
      console.error("댓글 추가 실패:", error);
      alert("댓글 등록에 실패했습니다.");
    },
  });
};

// [Delete] 댓글 삭제
export const useDeleteEnsembleComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      ensembleId 
    }: { 
      commentId: string; 
      ensembleId: string;
    }) => {
      const { error } = await supabase
        .from("ensemble_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["ensemble-comments", variables.ensembleId] 
      });
    },
    onError: (error) => {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다.");
    },
  });
};

// DB TIME 타입("HH:mm:ss")을 "HH:mm"으로 변환
const formatTime = (time: string): string => {
  return time.slice(0, 5); // "14:30:00" → "14:30"
};

/*
DB 데이터 변환 함수
*/
// DB에서 가져온 raw 데이터를 Ensemble 타입으로 가공
const rowToEnsemble = (row: EnsembleRow): Ensemble => ({
  id: row.id,
  room_id: row.room_id,
  title: row.title,
  date: row.date,
  start_time: formatTime(row.start_time), // DB에 이미 HH:mm 형식으로 저장 중
  end_time: formatTime(row.end_time),
  location: row.location || undefined,
  participants: row.participants || [],
  created_at: row.created_at,
  updated_at: row.updated_at || row.created_at,
  status: row.status || 'open',
});

// Supabase Row → Concert 타입 변환
const rowToConcert = (row: ConcertRow): Concert => ({
  id: row.id,
  title: row.title,
  date: row.date,
  start_time: formatTime(row.start_time),
  end_time: formatTime(row.end_time),
  rehearsal_start_time: row.rehearsal_start_time ? formatTime(row.rehearsal_start_time) : undefined,
  rehearsal_end_time: row.rehearsal_end_time ? formatTime(row.rehearsal_end_time) : undefined,
  location: row.location,
  set_list: row.set_list || undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
  memo: row.memo,
});

// 개인 일정 → 예약 변환
const personalEventToReservation = (p: PersonalEventRow): Reservation => ({
  id: p.id,
  purpose: p.purpose,
  kind: "personal",
  date: p.date,
  start_time: formatTime(p.start_time),
  end_time: formatTime(p.end_time),
  created_at: p.created_at,
  name: p.name,
});

/**
 * 합주, 공연, 개인일정 타입 => 예약 변환 함수
 */

const ensembleToReservation = (e: Ensemble): Reservation => ({
  id: e.id,
  purpose: e.title,
  kind: "ensemble",
  date: e.date,
  start_time: e.start_time,
  end_time: e.end_time,
  created_at: e.created_at,
  participants: e.participants,
  room_id: e.room_id,
});

const concertToReservation = (c: Concert): Reservation => ({
  id: c.id,
  purpose: `🌟 ${c.title}`,
  kind: "concert",
  date: c.date,
  start_time: c.start_time,
  end_time: c.end_time,
  created_at: c.created_at,
});

// ✅ [NEW] 실시간 구독 훅 추가
export const useRealtimeReservations = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("reservations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ensemble" },
        (payload) => {
          console.log("✅ realtime ENSEMBLE:", payload);
          queryClient.invalidateQueries({ queryKey: ["reservations"], exact: false });
          queryClient.refetchQueries({ queryKey: ["reservations"], type: "active", exact: false });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "concerts" },
        (payload) => {
          console.log("✅ realtime CONCERTS:", payload);
          queryClient.invalidateQueries({ queryKey: ["reservations"], exact: false });
          queryClient.refetchQueries({ queryKey: ["reservations"], type: "active", exact: false });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "personal_events" },
        (payload) => {
          console.log("✅ realtime PERSONAL:", payload);
          queryClient.invalidateQueries({ queryKey: ["reservations"], exact: false });
          queryClient.refetchQueries({ queryKey: ["reservations"], type: "active", exact: false });
        }
      )
      .subscribe((status) => {
        console.log("📡 reservations-realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

// [Read] 특정 기간(주간/월간)의 예약 가져오기
export const useReservations = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ["reservations", formatToDbDate(startDate), formatToDbDate(endDate)],
    queryFn: async () => {
      const start = formatToDbDate(startDate);
      const end = formatToDbDate(endDate);

      const [concertsRes, ensembleRes, personalRes] = await Promise.all([
        supabase.from("concerts").select("*").gte("date", start).lte("date", end),
        supabase.from("ensemble").select("*").gte("date", start).lte("date", end),
        supabase.from("personal_events").select("*").gte("date", start).lte("date", end)
      ]);

      if (concertsRes.error) throw concertsRes.error;
      if (ensembleRes.error) throw ensembleRes.error;
      if (personalRes.error) throw personalRes.error;

      const concertList = (concertsRes.data as ConcertRow[]).map(rowToConcert).map(concertToReservation);
      const ensembleList = (ensembleRes.data as EnsembleRow[]).map(rowToEnsemble).map(ensembleToReservation);
      const personalList = (personalRes.data as PersonalEventRow[]).map(personalEventToReservation);

      return [...concertList, ...ensembleList, ...personalList].sort((a, b) => 
        a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)
      );
    },
  });
};

// [Read] 다가오는 예약 (통합)
export const useUpcomingReservations = () => {
  return useQuery({
    queryKey: ["reservations", "upcoming"],
    queryFn: async () => {
      const today = formatToDbDate(new Date());

      const [concertsRes, ensembleRes, personalRes] = await Promise.all([
        supabase
          .from("concerts")
          .select("*")
          .gte("date", today)
          .order("date", { ascending: true }),
        supabase
          .from("ensemble")
          .select("*")
          .gte("date", today)
          .order("date", { ascending: true }),
        supabase
          .from("personal_events")
          .select("*")
          .gte("date", today)
          .order("date", { ascending: true })
      ]);

      if (concertsRes.error) console.error("Concert fetch error:", concertsRes.error);
      if (ensembleRes.error) console.error("Ensemble fetch error:", ensembleRes.error);
      if (personalRes.error) console.error("Personal events fetch error:", personalRes.error);

      const concertList = (concertsRes.data as ConcertRow[] || [])
        .map(rowToConcert)
        .map(concertToReservation);

      const ensembleList = (ensembleRes.data as EnsembleRow[] || [])
        .map(rowToEnsemble)
        .map(ensembleToReservation);

      const personalList = (personalRes.data as PersonalEventRow[] || [])
        .map(personalEventToReservation);

      return [...concertList, ...ensembleList, ...personalList].sort((a, b) => {
        // 날짜순, 날짜가 같으면 시작 시간순 정렬
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      });
    },
  });
};

// 개인 일정 추가 훅
export const useAddPersonalEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEvent: Omit<PersonalEventRow, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("personal_events")
        .insert(newEvent)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reservations"] });
      await queryClient.refetchQueries({ queryKey: ["reservations"], exact: false });
      alert("개인 일정이 추가되었습니다.");
    },
    onError: (error) => {
      console.error(error);
      alert("일정 추가에 실패했습니다.");
    },
  });
};

// [Delete] 예약 삭제하기 (분기 처리)
export const useDeleteReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: string }) => {
      let table: string;
      
      if (kind === "ensemble") {
        table = "ensemble";
      } else if (kind === "concert") {
        table = "concerts";
      } else if (kind === "personal") {
        table = "personal_events";
      } else {
        throw new Error("Unknown kind: " + kind);
      }

      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"], exact: false });
      queryClient.refetchQueries({ queryKey: ["reservations"], type: "active", exact: false });
      alert("예약이 취소되었습니다.");
    },
    onError: (error) => {
      console.error(error);
      alert("삭제에 실패했습니다.");
    },
  });
};

// [Update] 합주 정보 수정하기 (제목, 장소)
export const useUpdateEnsemble = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      title, 
      location 
    }: { 
      id: string; 
      title: string; 
      location?: string 
    }) => {
      const { data, error } = await supabase
        .from("ensemble") // table 이름
        .update({ title, location }) // 변경할 값
        .eq("id", id) // 어떤 레코드를 바꿀지
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // 정보 수정 성공 시, 연관된 캐시 데이터를 무효화하여 화면을 최신 상태로 새로고침
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      // 단일 합주 디테일을 불러오는 쿼리가 있다면 그것도 갱신 (선택사항)
      // queryClient.invalidateQueries({ queryKey: ["ensemble", variables.id] }); 
      
      alert("합주 정보가 수정되었습니다.");
    },
    onError: (error) => {
      console.error("합주 정보 수정 실패:", error);
      alert("합주 정보 수정에 실패했습니다.");
    },
  });
};

// [NEW] 리스트 뷰용: 오늘 이후의 모든 예약 가져오기
export const useAllUpcomingReservations = () => {
  return useQuery({
    queryKey: ["reservations", "all_upcoming"],
    queryFn: async () => {
      const today = formatToDbDate(new Date());

      const [concertsRes, ensembleRes, personalRes] = await Promise.all([
        supabase
          .from("concerts")
          .select("*")
          .gte("date", today)
          .order("date", { ascending: true }),
        supabase
          .from("ensemble")
          .select("*")
          .gte("date", today)
          .order("date", { ascending: true }),
        supabase
          .from("personal_events")
          .select("*")
          .gte("date", today)
          .order("date", { ascending: true })
      ]);

      const concertList = (concertsRes.data as ConcertRow[] || [])
        .map(rowToConcert)
        .map(concertToReservation);

      const ensembleList = (ensembleRes.data as EnsembleRow[] || [])
        .map(rowToEnsemble)
        .map(ensembleToReservation);

      const personalList = (personalRes.data as PersonalEventRow[] || [])
        .map(personalEventToReservation);

      return [...concertList, ...ensembleList, ...personalList].sort((a, b) => {
        // 날짜순, 날짜가 같으면 시작 시간순 정렬
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      });
    },
  });
};