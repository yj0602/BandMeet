// app/event/[eventId]/page.tsx

import EnsembleInfoSection from "@/components/ensemble/EnsembleInfoSection";
import BackToMainButton from "@/components/common/BackToMainButton";

export default function EventDetailPage({
    params,
}: {
    params: { eventId: string };
}) {
  const ensemble = {
    id: "params.eventId",
    title: "합주 제목",
    date: "2026-02-04",
    start_time: "18:00",
    end_time: "20:00",
    location: "미케 동방",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const participants = [
    { id: "u1", event_id: "evt_123", name: "바보", instrument: "Bass" },
    { id: "u2", event_id: "evt_123", name: "똥개", instrument: "Vocal" },
    { id: "u3", event_id: "evt_123", name: "멍충", instrument: "Guitar" },
    { id: "u4", event_id: "evt_123", name: "개똥", instrument: "Guitar" },
    { id: "u5", event_id: "evt_123", name: "떵개", instrument: "Drum" },
    { id: "u6", event_id: "evt_123", name: "개떵", instrument: "Keyboard" },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <EnsembleInfoSection ensemble={ensemble} participants={participants} />
      <BackToMainButton />
    </main>
  );
}

export function generateStaticParams() {
  return [{ eventId: "evt_123" }];
}

