// src/components/common/BackToMainButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackToMainButton() {
  const router = useRouter();

  const className =
    "fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10 flex items-center gap-2 rounded-full border border-gray-700 bg-[#1a1a1a] px-5 py-3 text-sm font-semibold text-gray-200 shadow-lg shadow-black/50 transition-all hover:bg-[#252525] hover:border-gray-600 hover:text-white hover:scale-105 active:scale-95";

  return (
    <button onClick={() => router.push("/")} className={className}>
      <ArrowLeft size={18} className="text-blue-500" />
      <span>메인으로</span>
    </button>
  );
}
