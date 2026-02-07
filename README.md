# 🎸 Mechanics Scheduler (미케닉스 동아리방 예약 시스템)

부산대학교 밴드 동아리 **'미케닉스(Mechanics)'** 부원들을 위한 스케쥴러 웹 서비스입니다.
기존의 번거로운 예약 방식(수기/메신저)을 대체하여, 모바일과 PC 어디서든 실시간으로 예약 현황(합주/공연)을 확인하고 신청할 수 있습니다.

## 📅 프로젝트 소개

- **서비스명**: 미케닉스 스케줄러 (Mechanics Scheduler)
- **목적**: 동아리 일정의 효율적인 관리
- **대상**: 미케닉스 동아리 부원 전체

## ✨ 주요 기능 및 사용 방법

### 1. 듀얼 뷰 모드 (Dual View Mode)

상단의 탭을 통해 두 가지 방식으로 스케줄을 확인할 수 있습니다.

- **시간표 모드 (Timetable)**: 일주일 단위의 시간표 그리드를 통해 빈 시간을 직관적으로 파악할 수 있습니다.
- **목록 모드 (List)**: 다가오는 모든 예약을 날짜별로 그룹핑하여 리스트(카드) 형태로 한눈에 볼 수 있습니다.

### 2. 간편한 예약 시스템

- **예약하기**:
- 우측 하단의 `+` 플로팅 버튼을 누릅니다.
- 합주 또는 공연 생성하기를 누른 후, 각 정보를 입력하면 예약을 생성할 수 있습니다.
- _중복 방지 시스템이 적용되어 있어, 이미 예약된 시간에는 신청할 수 없습니다._

- **예약 확인 및 취소**:
- 생성된 예약 카드를 클릭하면 요약 정보를 볼 수 있습니다.
- 상세 보기를 클릭하면 자세한 정보를 볼 수 있는 페이지로 이동합니다.
- 본인의 예약인 경우 `삭제` 버튼을 통해 취소할 수 있습니다.

### 3. 모바일/PC 반응형 디자인

- **Mobile**: 스마트폰 환경에 최적화된 UI (터치 친화적 달력, 바텀 시트, 플로팅 버튼).
- **PC**: 넓은 화면을 활용한 카드 그리드 뷰와 쾌적한 대시보드 레이아웃.

---

## 🛠 기술 스택 (Tech Stack)

이 프로젝트는 최신 웹 기술을 사용하여 빠르고 안정적인 사용자 경험을 제공합니다.

| 분류           | 기술 | 설명                                   |
| -------------- | ---- | -------------------------------------- |
| **Framework**  |      | App Router 기반의 React 프레임워크     |
| **Language**   |      | 정적 타입 지정을 통한 안정성 확보      |
| **Styling**    |      | 유틸리티 퍼스트 CSS 프레임워크         |
| **State Mgt**  |      | 서버 상태 관리 및 데이터 캐싱/동기화   |
| **Database**   |      | PostgreSQL 기반의 Backend-as-a-Service |
| **Deployment** |      | Next.js 최적화 배포 플랫폼             |

---

## 📂 프로젝트 구조 (File Structure)

핵심 파일들의 역할은 다음과 같습니다.

```
src/
├── app/
│   ├── layout.tsx            # 전체 레이아웃 (폰트, 스타일, React Query Provider 설정)
│   ├── page.tsx              # 메인 페이지 (뷰 모드 관리, 사이드바 및 메인 컨텐츠 조합)
│   └── globals.css           # 전역 스타일 및 Tailwind 설정
│
├── components/
│   ├── WeeklyTimetable.tsx       # [메인] 주간 시간표 그리드 컴포넌트
│   ├── ReservationListView.tsx   # [메인] 예약 목록 리스트/카드 뷰 컴포넌트
│   ├── ReservationModal.tsx      # [기능] 예약 생성 모달 (날짜/시간 선택, 중복 검사)
│   ├── ReservationDetailModal.tsx# [기능] 예약 상세 정보 및 삭제 모달
│   ├── MiniCalendar.tsx          # [사이드바] 날짜 이동용 미니 달력
│   └── UpcomingReservations.tsx  # [사이드바] 간략한 다가오는 예약 리스트
│
├── hooks/
│   └── useReservations.ts    # Supabase 데이터 연동을 위한 React Query Hooks (CRUD)
│
├── utils/
│   ├── supabase.ts           # Supabase 클라이언트 초기화 설정
│   ├── date.ts               # 날짜 포맷팅 및 계산 헬퍼 함수
│   └── colors.ts             # 예약 카드 색상 생성 로직
│
└── types/
    └── index.ts              # 예약(Reservation) 등 TypeScript 인터페이스 정의

```

---

## 🚀 설치 및 실행 방법 (Getting Started)

로컬 환경에서 프로젝트를 실행하려면 다음 단계가 필요합니다.

1. **저장소 클론 (Clone)**

```bash
git clone https://github.com/your-username/mechanics-scheduler.git
cd mechanics-scheduler

```

2. **패키지 설치**

```bash
npm install

```

3. **환경 변수 설정 (.env.local)**
   프로젝트 루트에 `.env.local` 파일을 생성하고 Supabase 키를 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```

4. **개발 서버 실행**

```bash
npm run dev

```

브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다.

---

## 📝 개발 주안점 (Dev Note)

- **UX 최적화**: 모바일 브라우저의 주소창 길이를 고려하여 `dvh` 단위를 사용하고, 사이드바 오픈 시 백그라운드 스크롤을 방지하여 앱과 같은 사용성을 구현했습니다.
- **데이터 무결성**: 예약 생성 시 실시간으로 DB를 조회하여 중복 예약을 원천 차단했습니다.
- **다크 모드**: 밴드 동아리의 이미지에 맞는 어두운 테마(Dark Mode)를 기본 디자인으로 채택했습니다.

---

© 2026 Mechanics. All rights reserved.
