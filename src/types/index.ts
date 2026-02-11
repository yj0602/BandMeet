// src/types/index.ts
import { Participant } from "./ensemble_detail";

export interface Reservation {
  id: string;
  purpose: string;
  date: string; // 'YYYY-MM-DD' 형식
  start_time: string; // 'HH:mm' 형식
  end_time: string; // 'HH:mm' 형식
  kind?: "ensemble" | "concert" | "personal";
  created_at: string;
  participants?: Participant[]; 
  room_id?: string;
  name?: string; // 개인 일정 예약자 이름
}

// 캘린더 등에서 사용할 날짜 관련 타입
export interface WeekDays {
  date: Date;
  dayName: string; // 'Mon', 'Tue' ...
}
