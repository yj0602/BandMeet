// app/ensemble/select/[ensembleId]/page.tsx
import ReservationEnsembleSelect
  from "@/components/ReservationEnsemble/ReservationEnsembleSelect";

export default function EnsembleSelectPage({
  params,
}: {
  params: { ensembleId: string };
}) {
  return (
    <ReservationEnsembleSelect ensembleId={params.ensembleId} />
  );
}