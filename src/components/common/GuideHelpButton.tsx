"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, CircleHelp, X } from "lucide-react";

const GUIDE_STORAGE_KEY = "bandmeet-help-guide-seen-v1";

const GUIDE_PAGES = [
  {
    title: "합주 만들기",
    description: "합주 일정을 만드는 방법을 한 장씩 빠르게 볼 수 있어요.",
    imageSrc: "/help/help-1.png",
  },
  {
    title: "멤버가 시간 입력하기",
    description: "링크 공유 후 각자 가능한 시간과 파트를 선택하는 흐름이에요.",
    imageSrc: "/help/help-2.png",
  },
  {
    title: "가능 시간 확정하기",
    description: "모인 응답을 보고 가능한 시간대를 골라 최종 확정해요.",
    imageSrc: "/help/help-3.png",
  },
  {
    title: "상세 페이지 활용",
    description: "생성된 일정에서 상세보기, 메모, 정보 수정을 할 수 있어요.",
    imageSrc: "/help/help-4.png",
  },
  {
    title: "공연 만들기",
    description: "공연 생성부터 리허설과 본공연 정보 수정까지 한 번에 안내해요.",
    imageSrc: "/help/help-5.png",
  },
] as const;

type GuideHelpButtonProps = {
  autoOpenOnFirstVisit?: boolean;
  className?: string;
};

export default function GuideHelpButton({
  autoOpenOnFirstVisit = true,
  className = "",
}: GuideHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = GUIDE_PAGES.length;
  const guidePage = useMemo(() => GUIDE_PAGES[currentPage], [currentPage]);
  const canUseDOM = typeof window !== "undefined" && typeof document !== "undefined";

  useEffect(() => {
    if (!autoOpenOnFirstVisit) return;
    if (!canUseDOM) return;

    const hasSeenGuide = window.localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!hasSeenGuide) {
      const frameId = window.requestAnimationFrame(() => {
        setIsOpen(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }
  }, [autoOpenOnFirstVisit, canUseDOM]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const goPrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }

      if (event.key === "ArrowLeft") {
        setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
      }

      if (event.key === "ArrowRight") {
        setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, totalPages]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="도움말 열기"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white ${className}`}
      >
        <CircleHelp className="h-4 w-4" />
      </button>

      {canUseDOM &&
        isOpen &&
        createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="relative flex h-[min(88vh,780px)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#111318] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300/80">
                  BandMeet Guide
                </p>
                <h2 className="mt-1 text-lg font-bold text-white md:text-xl">
                  {guidePage.title}
                </h2>
                <p className="mt-1 text-sm text-gray-400">{guidePage.description}</p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="도움말 닫기"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1 bg-[#0b0d12]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(88,166,255,0.14),transparent_40%)]" />
              <div className="relative flex h-full items-center justify-center p-3 md:p-5">
                <Image
                  src={guidePage.imageSrc}
                  alt={`${guidePage.title} 도움말 이미지`}
                  width={1280}
                  height={720}
                  className="max-h-full w-full rounded-2xl border border-white/10 object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                  priority
                />
              </div>

              <button
                type="button"
                onClick={goPrev}
                aria-label="이전 도움말"
                className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0d1117]/85 text-white transition hover:bg-[#1b2230] md:left-5"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="다음 도움말"
                className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0d1117]/85 text-white transition hover:bg-[#1b2230] md:right-5"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="border-t border-white/10 px-4 py-4 md:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  {GUIDE_PAGES.map((page, index) => (
                    <button
                      key={page.title}
                      type="button"
                      aria-label={`${index + 1}번 도움말로 이동`}
                      onClick={() => setCurrentPage(index)}
                      className={`h-2.5 rounded-full transition ${
                        currentPage === index ? "w-8 bg-blue-400" : "w-2.5 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-400">
                    {currentPage + 1} / {totalPages}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/5"
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      onClick={currentPage === totalPages - 1 ? handleClose : goNext}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      {currentPage === totalPages - 1 ? "닫기" : "다음"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
