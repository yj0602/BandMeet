# 🎸 Mechanics Scheduler (미케닉스 동아리방 예약 시스템)

부산대학교 밴드 동아리 **미케닉스(Mechanics)** 부원들을 위한 스케줄러 웹 서비스입니다.  
기존의 번거로운 예약 방식(수기/메신저)을 대체하여, **모바일/PC 어디서든 실시간으로** 예약 현황(개인/합주/공연)을 확인하고 생성/관리할 수 있습니다.

---

## 📌 프로젝트 소개

- **서비스명**: Mechanics Scheduler (미케닉스 스케줄러)
- **목적**: 동아리 일정(개인/합주/공연) 관리의 효율화
- **대상**: 미케닉스 동아리 부원

---

## ✨ 주요 기능

### 1) 듀얼 뷰 모드 (Timetable / List)
- **시간표 모드 (Timetable)**: 주간 시간표 그리드로 빈 시간을 직관적으로 파악
- **목록 모드 (List)**: 다가오는 예약을 날짜별 카드 리스트로 확인

### 2) 예약 생성 (개인 / 합주 / 공연)
- 우측 하단 `+` 플로팅 버튼(FAB)에서 **개인/합주/공연** 예약 생성 진입
- 예약 생성 후 메인 화면에 즉시 반영

### 3) 예약 상세 조회 및 삭제
- 예약 카드를 클릭하면 요약/상세 모달 확인
- 상세 페이지로 이동하여 더 많은 정보 확인 가능
- 삭제 버튼으로 예약 취소

### 4) 중복 예약 방지
- 이미 예약된 시간대에는 생성이 제한되도록 처리(중복 방지 로직)

### 5) 모바일/PC 반응형 UI
- **Mobile**: 터치 친화적 UI + 플로팅 버튼 중심 UX
- **PC**: 넓은 화면에 최적화된 레이아웃과 가독성

---

## 🛠 기술 스택 (Tech Stack)

| 분류 | 기술 | 설명 |
| --- | --- | --- |
| **Framework** | Next.js (App Router) | 라우팅/SSR 기반 React 프레임워크 |
| **Language** | TypeScript | 정적 타입으로 안정성 확보 |
| **Styling** | Tailwind CSS | 유틸리티 퍼스트 스타일링 |
| **State / Server Cache** | TanStack Query(React Query) | 서버 상태 캐싱/동기화 및 CRUD |
| **Database / BaaS** | Supabase (PostgreSQL) | 인증/DB/Realtime 기반 백엔드 |
| **Deployment** | Vercel | Next.js 배포 최적화 |

---

## 📂 프로젝트 구조 (File Structure)

현재 프로젝트(스크린샷 기준) 핵심 구조는 다음과 같습니다.

```

src/
├── app/
│   ├── page.tsx                 # 메인 페이지 (뷰 모드, 사이드바/컨텐츠 조합)
│   ├── layout.tsx               # 전체 레이아웃 (Provider, 폰트/전역 설정)
│   ├── globals.css              # 전역 스타일/Tailwind 설정
│   ├── event/                   # 예약 상세 페이지 라우트
│   ├── concertCreate/           # 공연 생성 라우트
│   └── ensembleCreate/          # 합주 생성 라우트 (new/select/result 등 단계형 화면)
│
├── components/
│   ├── common/                  # 공통 UI 컴포넌트
│   ├── concert/                 # 공연 관련 UI 섹션/컴포넌트
│   ├── ensemble/                # 합주 관련 UI 섹션/컴포넌트
│   ├── ReservationConcert/      # 공연 예약 생성/편집 관련 컴포넌트
│   ├── ReservationEnsemble/     # 합주 예약 생성/편집 관련 컴포넌트
│   ├── WeeklyTimetable.tsx      # [메인] 주간 시간표 그리드
│   ├── ReservationListView.tsx  # [메인] 예약 리스트/카드 뷰
│   ├── ReservationModal.tsx     # [기능] 개인 예약 생성 모달(필요 시)
│   ├── ReservationDetailModal.tsx # [기능] 예약 상세 모달 (상세보기/삭제)
│   ├── MiniCalendar.tsx         # [사이드] 날짜 이동용 미니 달력
│   ├── UpcomingReservations.tsx # [사이드] 다가오는 예약 요약 리스트
│   ├── QueryProvider.tsx        # React Query Client Provider
│   └── RealtimeProvider.tsx     # Supabase Realtime 구독/동기화(사용 중인 경우)
│
├── hooks/
│   └── useReservations.ts       # 예약 CRUD를 위한 React Query Hooks
│
├── utils/
│   ├── supabase.ts              # Supabase 클라이언트 초기화
│   ├── date.ts                  # 날짜 포맷/시간 계산 유틸
│   └── colors.ts                # 예약 타입별 색상/표시 로직
│
└── types/
└── index.ts                 # Reservation 등 공통 타입 정의

````

---

## 🚀 설치 및 실행 방법 (Getting Started)

### 1) 저장소 클론
```bash
git clone https://github.com/your-username/mechanics-scheduler.git
cd mechanics-scheduler
````

### 2) 패키지 설치

```bash
npm install
```

### 3) 환경 변수 설정 (.env.local)

프로젝트 루트에 `.env.local`을 만들고 아래 값을 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 📝 개발 주안점 (Dev Note)

* **UX 최적화**: 모바일 주소창 높이 변동을 고려한 레이아웃 구성, 플로팅 버튼 기반의 빠른 생성 플로우
* **데이터 무결성**: 예약 생성 시 중복 시간대 방지 로직으로 충돌 최소화
* **실시간성(선택)**: Supabase Realtime 구독을 통해 변경 사항을 빠르게 반영하는 구조(RealtimeProvider)

---

## 📄 라이선스

© 2026 Mechanics. All rights reserved.
