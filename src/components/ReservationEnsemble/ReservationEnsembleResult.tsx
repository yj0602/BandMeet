"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, Calendar as CalendarIcon } from "lucide-react";
import { timeToMinutes } from "@/utils/date";

export default function ReservationEnsembleResult() {
    const router = useRouter();
    const [ensembleData, setEnsembleData] = useState<any>(null);
    const [responses, setResponses] = useState<any[]>([]);

    useEffect(() => {
        const savedDraft = localStorage.getItem("ensembleDraft");
        const savedResponses = localStorage.getItem("ensembleResponses");
        const currentUser = localStorage.getItem("ensembleUser");

        if (savedDraft) setEnsembleData(JSON.parse(savedDraft));
        if (savedResponses) {
            const parsedResponses = JSON.parse(savedResponses);
            setResponses(parsedResponses);
            
            // 현재 로그인한 유저의 데이터만 따로 찾아서 활용 가능
            const myData = parsedResponses.find((r: any) => r.userName === currentUser);
            if (myData) {
                console.log("내 선택 데이터:", myData.availableSlots);
            }
        }
    }, [router]);

    // 컴포넌트 내부 상단에 추가
    const commonTimes = useMemo(() => {
        if (responses.length === 0) return [];

        // 1. 모든 멤버가 선택한 시간(availableSlots)의 교집합 찾기
        const allAvailable = responses.map(r => r.availableSlots);
        
        // 첫 번째 멤버의 시간을 기준으로 다른 모든 멤버도 가지고 있는 시간만 필터링
        let intersection = allAvailable[0].filter((slot: string) =>
            allAvailable.every(slots => slots.includes(slot))
        );

        // 2. 시간 순서대로 정렬 (YYYY-MM-DD HH:mm 형태이므로 문자열 정렬 가능)
        intersection.sort();

        // 3. 연속된 30분 단위 슬롯들을 하나의 덩어리로 묶기 (예: 14:00, 14:30 -> 14:00~15:00)
        const segments: string[] = [];
        if (intersection.length === 0) return [];

        let start = intersection[0];
        let prev = intersection[0];

        for (let i = 1; i <= intersection.length; i++) {
            const current = intersection[i];
            const isLast = i === intersection.length;

            // 연속 여부 확인 로직
            let continuous = false;
            if (!isLast) {
                const [d1, t1] = prev.split(" ");
                const [d2, t2] = current.split(" ");
                if (d1 === d2) { // 같은 날짜여야 함
                    const diff = timeToMinutes(t2) - timeToMinutes(t1);
                    if (diff === 30) continuous = true;
                }
            }

            if (!continuous) {
                // 연속이 끊기면 지금까지의 범위를 저장
                const [startDate, startTime] = start.split(" ");
                const [, endTimeStr] = prev.split(" ");
                
                // 종료 시간은 마지막 슬롯 + 30분
                const endMins = timeToMinutes(endTimeStr) + 30;
                const endH = Math.floor(endMins / 60);
                const endM = endMins % 60;
                const endDisplay = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                segments.push(`${startDate} | ${startTime} ~ ${endDisplay}`);
                
                if (!isLast) start = current;
            }
            prev = current;
        }

        return segments;
    }, [responses]);

    // 확정 처리 함수
    const handleSelectTime = (timeRange: string) => {
        if (!window.confirm(`[${timeRange}]\n이 시간으로 합주를 확정하시겠습니까?`)) return;

        // 1. 데이터 포맷팅: "2026-02-03 | 14:00 ~ 15:30" -> 필요한 정보 추출
        const [datePart, timePart] = timeRange.split(" | ");
        const [startTime, endTime] = timePart.split(" ~ ");

        // 2. 메인 페이지 캘린더가 인식할 수 있는 '확정 일정' 객체 생성
        const finalEvent = {
            id: `ensemble-${Date.now()}`,
            title: `[합주] ${ensembleData.title}`,
            date: datePart.trim(),
            start_time: startTime.trim(),
            end_time: endTime.trim(),
            location: ensembleData.location,
            // 참여 멤버 정보도 넣어주면 좋음
            members: responses.map(r => ({ name: r.userName, sessions: r.sessions }))
        };

        // 3. 기존의 '확정된 일정 리스트'에 추가 (localStorage 활용)
        const existingEvents = JSON.parse(localStorage.getItem("confirmedEvents") || "[]");
        localStorage.setItem("confirmedEvents", JSON.stringify([...existingEvents, finalEvent]));

        // 4. 조율용 임시 데이터들 삭제 (청소)
        localStorage.removeItem("ensembleDraft");
        localStorage.removeItem("ensembleResponses");

        alert("합주 일정이 확정되었습니다! 캘린더에서 확인하세요.");
        router.push("/"); // 메인으로 이동
    };

    if (!ensembleData) return <div className="p-10 text-gray-500 text-center">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 text-[#c9d1d9]">
      {/* 상단 헤더 */}
      <header className="mb-10 border-b border-[#30363d] pb-6">
        <h1 className="text-3xl font-extrabold text-[#f0f6fc] mb-2">
          {ensembleData.title}
        </h1>
        <p className="text-gray-400">최종 조율 현황</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 왼쪽: 참여 멤버 목록 */}
        <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl h-fit">
          <div className="flex items-center gap-2 mb-4 text-[#58a6ff]">
            <Users className="w-5 h-5" />
            <h2 className="font-bold text-lg">참여 멤버 ({responses.length})</h2>
          </div>
          <div className="space-y-3">
            {responses.length === 0 ? (
              <p className="text-gray-500 text-sm italic">아직 응답한 멤버가 없습니다.</p>
            ) : (
              responses.map((res, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-[#0d1117] rounded-xl border border-gray-800">
                  <span className="font-medium text-[#f0f6fc]">{res.userName}</span>
                  <div className="flex gap-1">
                    {res.sessions.map((s: string) => (
                      <span key={s} className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 오른쪽: 결과 요약 및 확정 리스트 (임시) */}
        <section className="md:col-span-2 space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-[#58a6ff]">
              <Clock className="w-5 h-5" />
              <h2 className="font-bold text-lg">모두 가능한 시간 목록</h2>
            </div>
            
            {/* 모두 가능한 시간 목록 UI */}
            <div className="space-y-3">
                {commonTimes.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-2xl">
                        <p className="text-gray-500 font-medium">모두 가능한 시간이 없습니다.</p>
                        <p className="text-xs text-gray-600 mt-2 font-light">인원을 조정하거나 시간을 다시 선택해보세요.</p>
                    </div>
                ) : (
                    commonTimes.map((timeRange, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelectTime(timeRange)}
                            className="w-full flex items-center justify-between p-4 bg-[#0d1117] hover:bg-[#1f6feb]/10 border border-gray-800 hover:border-[#1f6feb] rounded-xl transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1f6feb]/10 rounded-lg group-hover:bg-[#1f6feb]/20">
                                    <CalendarIcon className="w-4 h-4 text-[#58a6ff]" />
                                </div>
                                <span className="text-sm md:text-base font-bold text-[#f0f6fc]">
                                    {timeRange}
                                </span>
                            </div>
                            <span className="text-xs text-[#58a6ff] font-semibold">선택하기</span>
                        </button>
                    ))
                )}
            </div>
          </div>

          <button 
            onClick={() => router.push("/")}
            className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition shadow-lg"
          >
            메인 페이지로 돌아가기
          </button>
        </section>
      </div>
    </div>
  );
}