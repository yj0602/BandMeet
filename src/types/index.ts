// src/types/index.ts

export interface Reservation {
  id: string;
  purpose: string;
  date: string; // 'YYYY-MM-DD' 형식
  start_time: string; // 'HH:mm' 형식
  end_time: string; // 'HH:mm' 형식
  kind?: "ensemble" | "concert";
  created_at: string;
}

// 캘린더 등에서 사용할 날짜 관련 타입
export interface WeekDays {
  date: Date;
  dayName: string; // 'Mon', 'Tue' ...
}
