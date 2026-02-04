import { format, startOfWeek, addDays, parseISO, parse } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Seoul";

// 1. 현재 한국 시간 구하기 (서버/클라 어디서든 KST 기준)
export const getKSTDate = () => {
  const now = new Date();
  return toZonedTime(now, TIMEZONE);
};

// 2. 날짜 포맷팅 (DB 저장용: YYYY-MM-DD)
export const formatToDbDate = (date: Date) => {
  return format(date, "yyyy-MM-dd");
};

// 3. 날짜 포맷팅 (화면 표시용)
export const formatToDisplay = (date: Date, pattern: string = "M월 d일") => {
  return format(date, pattern);
};

// 4. 이번 주 시작일 구하기 (KST 기준 일요일)
export const getKSTStartOfWeek = (date: Date) => {
  return startOfWeek(date, { weekStartsOn: 0 });
};

// 5. 시간 문자열(HH:mm)을 분(number)으로 변환 (비교용)
export const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// 6. DB 시간(HH:mm:ss)을 깔끔하게(HH:mm) 자르기
export const formatTime = (timeStr: string) => {
  return timeStr.slice(0, 5);
};
