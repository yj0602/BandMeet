"use client";

import { useRealtimeReservations } from "@/hooks/useReservations";

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeReservations();
  return <>{children}</>;
}
