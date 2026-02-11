// src/app/ensembleCreate/new/page.tsx
import { Suspense } from "react";
import NewEnsembleClient from "./NewEnsembleClient";

export default function EnsembleCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-gray-500">
          로딩 중...
        </div>
      }
    >
      <NewEnsembleClient />
    </Suspense>
  );
}
