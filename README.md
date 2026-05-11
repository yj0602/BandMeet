# BandMeet

밴드 동아리의 개인 일정, 합주, 공연 일정을 한곳에서 확인하고 관리하는 예약 서비스입니다.<br />
주간 시간표와 목록 화면을 함께 제공해 모바일과 데스크톱에서 빠르게 일정을 만들고 확인할 수 있습니다.

## 주요 기능

- **예약 현황 조회**
  - 주간 시간표 화면에서 날짜별 예약을 시간대별로 확인
  - 목록 화면에서 다가오는 예약을 카드 형태로 확인
  - 사이드바 미니 캘린더와 다가오는 예약 목록 제공

- **개인 일정 등록**
  - FAB 메뉴에서 개인 연습, 회의, 약속 등 개인 일정을 바로 추가
  - 날짜, 시작 시간, 종료 시간, 예약자, 사용 목적 입력

- **합주 일정 생성**
  - 합주 제목, 장소, 후보 날짜, 시간 범위를 설정
  - 날짜를 선택하거나 드래그해 여러 후보일을 빠르게 지정
  - 합주 선택 및 결과 화면을 통해 합주 일정을 확정하는 흐름 제공

- **공연 일정 생성**
  - 공연 제목, 날짜, 장소, 시작/종료 시간 입력
  - 셋리스트와 곡별 메모 등록

- **예약 상세 조회 및 삭제**
  - 시간표나 목록의 예약을 선택해 상세 내용을 확인
  - 개인 일정, 합주, 공연 예약을 종류별로 구분해 삭제 처리

- **실시간 반영**
  - Supabase Realtime과 TanStack Query 캐시 갱신을 이용해 예약 변경 사항을 화면에 반영

## 기술 스택

| 분류 | 기술 |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Data Fetching | TanStack Query |
| Backend / DB | Supabase |
| Icons | lucide-react |
| Date Utility | date-fns, date-fns-tz |
| Deployment | Vercel |

## 프로젝트 구조

```text
src/
  app/
    page.tsx                         # 메인 예약 화면
    layout.tsx                       # 전역 레이아웃 및 Provider 구성
    globals.css                      # 전역 스타일
    event/[eventId]/page.tsx         # 예약 상세 페이지
    concertCreate/new/page.tsx       # 공연 생성 페이지
    ensembleCreate/new/page.tsx      # 합주 생성 페이지
    ensembleCreate/select/page.tsx   # 합주 일정 선택 페이지
    ensembleCreate/result/page.tsx   # 합주 결과 페이지

  components/
    WeeklyTimetable.tsx              # 주간 시간표
    ReservationListView.tsx          # 예약 목록 화면
    ReservationModal.tsx             # 개인 일정 추가 모달
    ReservationDetailModal.tsx       # 예약 상세 모달
    MiniCalendar.tsx                 # 미니 캘린더
    UpcomingReservations.tsx         # 다가오는 예약 목록
    QueryProvider.tsx                # TanStack Query Provider
    RealtimeProvider.tsx             # Supabase Realtime Provider
    ReservationConcert/              # 공연 생성 관련 컴포넌트
    ReservationEnsemble/             # 합주 생성/선택/결과 컴포넌트
    common/                          # 공통 UI

  hooks/
    useReservations.ts               # 예약 조회, 생성, 수정, 삭제 훅

  types/
    index.ts                         # 공통 예약 타입
    concert_detail.ts                # 공연 상세 타입
    ensemble_detail.ts               # 합주 상세 타입

  utils/
    supabase.ts                      # 클라이언트용 Supabase 설정
    supabase-server.ts               # 서버용 Supabase 설정
    date.ts                          # 날짜/시간 유틸
    colors.ts                        # 예약 종류별 색상 유틸
```

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/yj0602/BandMeet.git
cd BandMeet
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 Supabase 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 사용 가능한 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 실행
npm run lint     # ESLint 검사
```

## Supabase 테이블

현재 프론트엔드에서 사용하는 주요 테이블은 다음과 같습니다.

- `personal_events`: 개인 일정
- `ensemble`: 확정된 합주 일정
- `ensemble_rooms`: 합주 후보 날짜와 선택 흐름
- `ensemble_comments`: 합주 댓글
- `concerts`: 공연 일정과 셋리스트

## 개발 메모

- 예약 데이터는 `useReservations.ts`에서 개인 일정, 합주, 공연을 하나의 `Reservation` 형태로 변환해 사용합니다.
- 메인 화면은 시간표 보기와 목록 보기를 전환할 수 있습니다.
- 예약 변경 후에는 TanStack Query의 `reservations` 캐시를 무효화해 최신 데이터를 다시 가져옵니다.
- 모바일에서는 사이드 메뉴와 FAB 메뉴를 중심으로 빠르게 예약을 확인하고 생성할 수 있도록 구성되어 있습니다.

## 라이선스

© 2026 BandMeet. All rights reserved.
