// src/app/ensembleCreate/result/page.tsx
import { Suspense } from "react";
import EnsembleResultClient from "./EnsembleResultClient";

export default function EnsembleResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-gray-500">
          로딩 중...
        </div>
      }
    >
      <EnsembleResultClient />
    </Suspense>
  );
}
