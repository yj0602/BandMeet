// src/types/concert_detail.ts
// 공연 상세 페이지 데이터 타입

// 공연 관련 타입
export type Concert = {
    id: string;
    title: string;

    date: string; // "YYYY-MM-DD" 형식
    start_time: string; // 'HH:mm' 형식
    end_time: string; // 'HH:mm' 형식

    rehearsal_start_time?: string; // 'HH:mm' 형식
    rehearsal_end_time?: string; // 'HH:mm' 형식
    set_list?: SetListItem[];
    location?: string;
    created_at: string;
    updated_at: string;  
    memo?: string | null;
}

export type SetListItem = {
    // id: string; // JSON 저장 시 불필요
    order: number; // 곡 순서
    title: string; // 곡 제목
    note?: string; // 선택: 튜닝, 특이사항 등
}

export type SetList = {
  concert_id: string;
  items: SetListItem[];
};

// 공연 상세 페이지용 종합 타입
export type ConcertDetail = {
  concert: Concert;
  setList: SetListItem[];
};