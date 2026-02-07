import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { Reservation } from "@/types";
import { formatToDbDate } from "@/utils/date";
import type { Ensemble } from "@/types/ensemble_detail";
import type { Concert, SetListItem } from "@/types/concert_detail";

const mockUserName = "장혁재";

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

// DB TIME 타입("HH:mm:ss")을 "HH:mm"으로 변환
const formatTime = (time: string): string => {
  return time.slice(0, 5); // "14:30:00" → "14:30"
};

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

const ensembleToReservation = (e: Ensemble): Reservation => ({
  id: e.id,
  user_name: mockUserName,
  purpose: e.title,
  kind: "ensemble",
  date: e.date,
  start_time: e.start_time,
  end_time: e.end_time,
  created_at: e.created_at,
});

const concertToReservation = (c: Concert): Reservation => ({
  id: c.id,
  user_name: mockUserName,
  purpose: `🌟 ${c.title}`,
  kind: "concert",
  date: c.date,
  start_time: c.start_time,
  end_time: c.end_time,
  created_at: c.created_at,
});

// [Read] 특정 기간(주간/월간)의 예약 가져오기
export const useReservations = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ["reservations", formatToDbDate(startDate), formatToDbDate(endDate)],
    queryFn: async () => {
      const start = formatToDbDate(startDate);
      const end = formatToDbDate(endDate);

      // ✅ concerts 테이블만 조회 (ensemble은 나중에 추가)
      const { data: concerts, error } = await supabase
        .from("concerts")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Concert fetch error:", error);
        return [];
      }

      return (concerts as ConcertRow[])
        .map(rowToConcert)
        .map(concertToReservation);
    },
  });
};

// [Read] 다가오는 예약
export const useUpcomingReservations = () => {
  return useQuery({
    queryKey: ["reservations", "upcoming"],
    queryFn: async () => {
      const today = formatToDbDate(new Date());

      const { data: concerts, error } = await supabase
        .from("concerts")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(20);

      if (error) {
        console.error("Concert fetch error:", error);
        return [];
      }

      return (concerts as ConcertRow[])
        .map(rowToConcert)
        .map(concertToReservation);
    },
  });
};

// [Create] 예약 추가하기 (현재는 사용 안 함)
export const useAddReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRes: Omit<Reservation, "id" | "created_at">) => {
      // TODO: 나중에 ensemble 추가 기능 구현
      throw new Error("Not implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      alert("예약이 완료되었습니다.");
    },
    onError: (error) => {
      console.error(error);
      alert("예약에 실패했습니다.");
    },
  });
};

// [Delete] 예약 삭제하기
export const useDeleteReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // concert 삭제
      const { error } = await supabase
        .from("concerts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      alert("예약이 취소되었습니다.");
    },
    onError: (error) => {
      console.error(error);
      alert("삭제에 실패했습니다.");
    },
  });
};

// [NEW] 리스트 뷰용: 오늘 이후의 모든 예약 가져오기
export const useAllUpcomingReservations = () => {
  return useQuery({
    queryKey: ["reservations", "all_upcoming"],
    queryFn: async () => {
      const today = formatToDbDate(new Date());

      const { data: concerts, error } = await supabase
        .from("concerts")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Concert fetch error:", error);
        return [];
      }

      return (concerts as ConcertRow[])
        .map(rowToConcert)
        .map(concertToReservation);
    },
  });
};