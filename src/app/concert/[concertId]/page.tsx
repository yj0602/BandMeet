// app/concert/[concertId]/page.tsx

import ConcertInfoSection from "@/components/concert/concertInfoSection";
import BackToMainButton from "@/components/common/BackToMainButton";
import type { SetListItem } from "@/types/concert_detail";

export default function ConcertDetailPage({
  params,
}: {
  params: { concertId: string };
}) {
    // mock data
  const concert = {
    id: "params.concertId",
    title: "정기 공연",
    date: "2026-01-30",
    start_time: "18:00",
    end_time: "21:00",
    location: "The Vinyl Underground",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rehearsal_start_time: "13:00",
    rehearsal_end_time: "15:00",
  };

  const mockSetList: SetListItem[] = [
    { id: "1", order: 1, title: "Opening" },
    { id: "2", order: 2, title: "Smells Like Teen Spirit", note: "Drop D 튜닝" },
    { id: "3", order: 3, title: "Don't Look Back in Anger" },
    { id: "4", order: 4, title: "Yellow", note: "건반 볼륨 체크" },
  ];

  const dummyMemo = "뒷풀이 장소: 느그집\n";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <ConcertInfoSection 
        concert={concert} 
        setList={mockSetList} 
        memo={dummyMemo} 
      />
      <BackToMainButton />
    </main>
  );
}

export function generateStaticParams() {
  return [{ concertId: "concert1" }];
}