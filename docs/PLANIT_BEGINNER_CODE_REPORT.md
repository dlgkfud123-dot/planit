# PLANIT 초보 개발자를 위한 프로젝트 코드 분석 및 학습 가이드 보고서

> **문서 안내**: 본 보고서는 React, Next.js, TypeScript를 처음 공부하는 초보 개발자가 **PLANIT** 서비스의 실제 코드를 통해 현대적인 웹 애플리케이션 구조, 상태 관리, AI 여행 일정 생성 알고리즘, 인터랙티브 세계지도 렌더링, 모바일 반응형 UX 설계 방식을 완벽하게 파악할 수 있도록 작성된 종합 학습 교재입니다.

---

## 1. 프로젝트 한눈에 보기

### PLANIT 소개 및 서비스 목적
**PLANIT(플랜잇)**은 여행자가 원하는 국가와 도시, 여행 기간, 예산, 인원, 여행 취향(미식, 자연, 쇼핑, 문화 등)을 선택하면 **AI 엔진 및 큐레이션 데이터베이스**를 기반으로 3초 만에 이동 동선과 장소별 추천 방문 시간대가 포함된 맞춤형 여행 일정 초안을 자동으로 생성해 주는 웹 서비스입니다.

### 사용자 이용 흐름 (User Journey)
1. **오프닝 브랜드 인트로**: 서비스 첫 진입 및 새로고침(F5) 시 Apple/Stripe 스타일의 미니멀 `P L A N I T` 알파벳 순차 등장 애니메이션 노출 (약 2초).
2. **메인 인터랙티브 랜딩 (`/`)**: 25개국 100여 개 도시가 표시된 인터랙티브 세계지도 및 국가/도시 선택 드롭다운에서 여행지 선택.
3. **여행 조건 입력 & AI 일정 생성 (`/planner`)**: 출발지, 일정(숙박 박수), 인원, 예산, 여행 템포(여유롭게~촘촘하게) 설정 후 `AI 일정 만들기` 클릭.
4. **일정 편집 및 인터랙티브 지도 확인 (`/planner`)**: DAY별 장소 핀 확인, 순서 변경(드래그 앤 드롭 또는 모바일 화살표), 장소 추가/삭제, 미식/자연 등 스타일 보완.
5. **저장 및 공유**: 로그인 사용자 또는 로컬 초안으로 저장 (`/trips` 보관함 연동), 공유 링크 복사, PDF 출력, 캘린더(.ics) 내보내기.
6. **브랜드 및 고객 지원 (`/about`, `/contact`, `/privacy`, `/terms`)**: 브랜드 철학, 고객 지원 폼, 개인정보 처리방침, 이용약관 확인.

### 사용 기술 스택 (Technology Stack)
- **프론트엔드 (Frontend)**: Next.js (App Router, Vinext/Vite 엔진), React 19, TypeScript, Vanilla CSS (`globals.css`)
- **지도 (Map Rendering)**: Leaflet.js (`react-leaflet` / `leaflet`), CartoDB Light Tile Layer
- **백엔드 & 서버리스 (Backend / API)**: Next.js API Routes (`/api/route`), OpenRouteService (ORS) API
- **인증 & 데이터베이스 (Auth & Database)**: Supabase Authentication (Google OAuth), Supabase Database (PostgreSQL RLS)
- **배포 (Deployment)**: Vercel Production (`https://hayoung.cloud`)

---

## 2. 프로젝트 폴더 구조

```text
PLANIT_v1.0_pre_supabase/
├── app/                              # Next.js App Router (페이지 라우팅 & 최상위 레이아웃)
│   ├── layout.tsx                    # 앱 전체 공통 HTML 구조 및 AuthProvider 감싸기
│   ├── page.tsx                      # 메인 랜딩 페이지 (/)
│   ├── globals.css                   # 전역 CSS 스타일 및 모바일 미디어 쿼리
│   ├── about/page.tsx                # PLANIT 브랜드 소개 페이지 (/about)
│   ├── contact/page.tsx              # 고객센터 문의 폼 및 채널 페이지 (/contact)
│   ├── privacy/page.tsx              # 개인정보 처리방침 페이지 (/privacy)
│   ├── terms/page.tsx                # 서비스 이용약관 페이지 (/terms)
│   ├── trips/page.tsx                # 내 여행 보관함 페이지 (/trips)
│   ├── planner/page.tsx              # 여행 일정 플래너 워크스페이스 (/planner)
│   ├── place/page.tsx                # 장소 상세 페이지 (/place)
│   ├── login/page.tsx                # 로그인/회원가입 인증 페이지 (/login)
│   └── api/
│       └── route/route.ts            # OpenRouteService 연동 도로 동선 API 엔드포인트
├── components/                       # UI 컴포넌트 모음
│   ├── intro/
│   │   └── BrandOpeningIntro.tsx     # 오프닝 브랜드 인트로 애니메이션
│   ├── map/
│   │   ├── InteractiveMapIntro.tsx   # 메인 페이지 카드 & 지도를 감싸는 메인 랜딩 컴포넌트
│   │   └── MapCanvas.tsx             # Leaflet 기반 타일 지도 및 핀 렌더링
│   ├── planner/
│   │   ├── PlannerApp.tsx            # 플래너 메인 UI 및 일정 편집 로직 (핵심)
│   │   ├── PlannerMap.tsx            # 플래너 전용 핀 & 동선 연결 지도
│   │   ├── usePlannerState.ts        # 여행 조건 상태 관리 Hook
│   │   └── useTripPersistence.ts     # Supabase DB & LocalStorage 동기화 Hook
│   ├── auth/
│   │   ├── AccountActions.tsx        # 상단 아바타 프로필 & 팝업 메뉴
│   │   ├── AuthForm.tsx              # Google OAuth 버튼
│   │   └── AuthProvider.tsx          # Supabase 세션 상태 Context Provider
│   ├── layout/
│   │   └── Footer.tsx                # 하단 심플 푸터 (개인정보, 약관, 고객센터)
│   ├── trips/
│   │   └── SavedTrips.tsx            # 저장된 여행 카드 목록 및 불러오기 UI
│   └── places/
│       └── PlaceDetail.tsx           # 장소 상세 정보 뷰어
├── data/                             # 정적 데이터베이스 파일
│   ├── countries.ts                  # 지원 국가 정보 (25개국)
│   ├── cities.ts                     # 지원 도시 좌표 및 메타데이터 (100+ 도시)
│   ├── places.ts                     # 도시별 추천 장소 대표 데이터 (2,500+ 장소)
│   ├── placesBatch1.ts ~ 26.ts       # 도시별 분할 장소 데이터 배치 파일
│   └── travelRules.ts                # 이동수단 및 동선 배치 규칙 정의
├── lib/                              # 외부 서비스 연동 클라이언트
│   └── supabase/
│       └── client.ts                 # Supabase Browser Client 초기화
├── utils/                            # 헬퍼 및 비즈니스 로직 함수
│   ├── itineraryGenerator.ts         # AI 여행 일정 자동 생성 핵심 알고리즘
│   ├── distance.ts                   # 하버사인(Haversine) 위경도 직선거리 계산
│   ├── transport.ts                  # 이동시간 및 소요비용 추정
│   ├── tripStorage.ts                # LocalStorage 읽기/쓰기 & JSON 압축
│   └── tripPersistence.ts            # Supabase DB와 LocalStorage 듀얼 저장소 처리
└── docs/                             # 프로젝트 가이드 및 학습 보고서
    └── PLANIT_BEGINNER_CODE_REPORT.md
```

### 새로운 기능을 추가할 때 살펴볼 가이드
1. **새로운 여행지/장소 추가**: `data/cities.ts`에 도시 등록 후 `data/places.ts` (또는 배치 파일)에 장소 객체 추가.
2. **플래너 기능 변경 (예: 일정 정렬 방식 변경)**: `utils/itineraryGenerator.ts`와 `components/planner/PlannerApp.tsx`.
3. **디자인/반응형 스타일 변경**: `app/globals.css` 파일 하단 미디어 쿼리 영역 수정.

---

## 3. Next.js 실행 구조

### `layout.tsx`와 `page.tsx`
- **`app/layout.tsx`**: 앱 전체의 Root Layout입니다. `<html>` 및 `<body>` 태그를 생성하고, 글로벌 CSS(`globals.css`)를 불러오며 모든 페이지를 `<AuthProvider>`로 감싸 세션 상태를 공유합니다.
- **`app/page.tsx`**: 접속 주소 `/`에 매핑되는 메인 홈 페이지입니다. `<InteractiveMapIntro>` 컴포넌트를 렌더링합니다.

### 서버 컴포넌트(RSC) vs 클라이언트 컴포넌트(`"use client"`)
- Next.js App Router는 기본적으로 모든 컴포넌트를 **서버 컴포넌트**로 동작시킵니다.
- 하지만 브라우저 상태(`useState`), 이벤트 처리(`onClick`), DOM 액세스(`window`, `sessionStorage`, `Leaflet`)가 필요한 컴포넌트 최상단에는 **`"use client"`** 구문을 작성하여 **클라이언트 컴포넌트**로 지정해야 합니다.
- PLANIT의 `InteractiveMapIntro.tsx`, `PlannerApp.tsx`, `BrandOpeningIntro.tsx` 등은 모두 `"use client"`가 적용된 클라이언트 컴포넌트입니다.

### Dynamic Import (`dynamic`)와 `ssr: false`
- Leaflet.js 지도 라이브러리는 브라우저 전용 객체인 `window` 및 `document`를 직접 참조하므로, 서버 사이드 렌더링(SSR) 도중 실행되면 `window is not defined` 에러가 발생합니다.
- 이를 방지하기 위해 Next.js의 `dynamic()`을 사용하여 지도 컴포넌트를 **클라이언트 측에서만 동적으로 불러오도록** 설정했습니다:
```tsx
const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <div className="travelMapLoading" />
});
```

### 접속 유형별 진입 타임라인
1. **최초 접속 (First Visit)**: 브라우저가 HTML/CSS 다운로드 → `sessionStorage` 확인 → `planit_intro_seen_session` 없음 → `<BrandOpeningIntro>` 2.4초 오프닝 애니메이션 재생 → 메인 지도 화면 등장.
2. **새로고침 (F5 / Reload)**: `performance.getEntriesByType("navigation")[0].type === "reload"` 감지 → 오프닝 인트로 재재생 후 메인 화면 진입.
3. **내부 페이지 이동 (SPA Link Navigation)**: `<Link href="/about">` 등으로 이동 시 윈도우 전체 재로드가 없으므로 세션 값이 유지되어 인트로 없이 즉시 해당 페이지로 이동.

---

## 4. React 핵심 개념 (프로젝트 실제 코드 기준)

### ① Component (컴포넌트)
- **설명**: UI를 이루는 재사용 가능한 독립된 블록입니다.
- **프로젝트 활용**: `components/layout/Footer.tsx`
- **코드 예시**:
```tsx
export default function Footer() {
  return (
    <footer className="globalFooter">
      <div className="footerContainer">
        <div className="footerLinks">
          <Link href="/privacy">개인정보 처리방침</Link>
          <span className="footerDot">·</span>
          <Link href="/terms">이용약관</Link>
        </div>
      </div>
    </footer>
  );
}
```
- **없으면 생기는 문제**: 모든 페이지에 푸터 HTML을 복사-붙여넣기 해야 하며, 변경 시 10개 파일을 일일이 수정해야 합니다.

---

### ② Props (프롭스)
- **설명**: 부모 컴포넌트가 자식 컴포넌트에게 전달하는 읽기 전용 데이터입니다.
- **프로젝트 활용**: `components/intro/BrandOpeningIntro.tsx`
- **코드 예시**:
```tsx
export default function BrandOpeningIntro({ onComplete }: { onComplete?: () => void }) { ... }
```
- **없으면 생기는 문제**: 자식 컴포넌트가 언제 애니메이션이 끝났는지 부모에게 알릴 수 없습니다.

---

### ③ State (상태) & `useState`
- **설명**: 컴포넌트 내부에서 변경될 수 있으며, 값이 바뀌면 UI를 자동으로 다시 그려주는(Re-render) 동적 변수입니다.
- **프로젝트 활용**: `components/map/InteractiveMapIntro.tsx`
- **코드 예시**:
```tsx
const [selectedCountry, setSelectedCountry] = useState<string>("");
const [selectedCityName, setSelectedCityName] = useState<string>("");
```
- **없으면 생기는 문제**: 사용자가 드롭다운에서 국가를 클릭해도 화면의 선택 도시 항목이 갱신되지 않습니다.

---

### ④ `useEffect`
- **설명**: 컴포넌트가 화면에 렌더링된 후(Mount), 또는 특정 state가 변경될 때 실행되는 부증상(Side-effect) 함수입니다.
- **프로젝트 활용**: `components/intro/BrandOpeningIntro.tsx`
- **코드 예시**:
```tsx
useEffect(() => {
  const timer1 = setTimeout(() => setStage("animating"), 150);
  const timer2 = setTimeout(() => setStage("subtitle"), 1250);
  return () => { clearTimeout(timer1); clearTimeout(timer2); }; // 언마운트 시 클리어
}, []);
```
- **없으면 생기는 문제**: 타이머가 멈추지 않고 메모리 누수가 발생하거나 타임라인 단계 전환이 불가능해집니다.

---

### ⑤ `useMemo`
- **설명**: 연산량이 많은 함수의 반환 값을 메모리에 저장(캐싱)하여 불필요한 재연산을 방지합니다.
- **프로젝트 활용**: `components/map/InteractiveMapIntro.tsx`
- **코드 예시**:
```tsx
const countryCities = useMemo(() => {
  if (!selectedCountry) return [];
  return availableCities.filter((city) => city.country === selectedCountry);
}, [selectedCountry]);
```
- **없으면 생기는 문제**: 컴포넌트가 다른 이유로 리렌더링될 때마다 전체 도시 목록 필터링이 계속 재실행되어 성능이 저하됩니다.

---

### ⑥ `useCallback`
- **설명**: 컴포넌트 내부의 함수 객체를 재사용하도록 메모이제이션합니다.
- **프로젝트 활용**: `components/planner/PlannerApp.tsx`
- **코드 예시**:
```tsx
const snapshotFor = useCallback((id: string): TripSnapshot => ({
  schemaVersion: 2, id, title: `${destination} ${plan.length}일 여행`, destination, plan ...
}), [destination, plan, origin, start, end]);
```
- **없으면 생기는 문제**: `useEffect` 의존성 배열에 등록된 저장 함수가 매 렌더링마다 재생성되어 무한 저장 루프가 발생할 수 있습니다.

---

### ⑦ `useRef`
- **설명**: 렌더링을 일으키지 않고 값을 유지하거나, 실제 DOM 요소에 직접 접근할 때 사용합니다.
- **프로젝트 활용**: `components/map/MapCanvas.tsx`
- **코드 예시**:
```tsx
const containerRef = useRef<HTMLDivElement>(null);
const mapRef = useRef<LeafletMap | null>(null);
```
- **없으면 생기는 문제**: Leaflet 지도 객체를 저장할 때 `useState`를 쓰면 지도 객체 변경 시마다 무한 리렌더링이 일어납니다.

---

### ⑧ 조건부 렌더링 (Conditional Rendering)
- **설명**: 특정 조건(`true`/`false`)에 따라 UI 요소를 화면에 보여주거나 숨깁니다.
- **프로젝트 활용**: `components/map/InteractiveMapIntro.tsx`
- **코드 예시**:
```tsx
{showIntro && (
  <BrandOpeningIntro onComplete={() => setShowIntro(false)} />
)}
```
- **없으면 생기는 문제**: 인트로가 끝난 뒤에도 오프닝 레이어가 화면에 계속 남아 메인 지도를 막아버립니다.

---

### ⑨ `map`, `filter`, `find` 배열 메서드
- **`map`**: 배열의 요소를 순회하며 UI 목록으로 변환 (`continentGroups.map(...)`)
- **`filter`**: 조건에 맞는 요소만 추출 (`cities.filter(c => c.country === selectedCountry)`)
- **`find`**: 조건을 만족하는 첫 번째 요소 검색 (`placesByCity(dest).find(p => p.id === id)`)

---

## 5. 메인 지도 화면 분석

### 컴포넌트 구조
- **`InteractiveMapIntro.tsx`**: 메인 랜딩 페이지의 상단 헤더, Hero 텍스트, 국가/도시 선택 카드 UI를 담당합니다.
- **`MapCanvas.tsx`**: 실제 Leaflet.js 타일 지도를 렌더링하고, 국가/도시 좌표 핀 마커를 생성합니다.

### 지도 렌더링 및 모바일 뷰포트 맞춤
- **CartoDB 타일 층**: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` 사용.
- **반응형 Zoom 및 Bounds 조율**:
```ts
function getWorldView(): WorldView {
  const width = typeof window !== "undefined" ? window.innerWidth : 1200;
  if (width <= 480) return { center: [18, 0], zoom: 0.35, minZoom: 0.25 };
  if (width <= 700) return { center: [18, 10], zoom: 0.75, minZoom: 0.5 };
  return { center: [25, 20], zoom: 2.2, minZoom: 1.8 };
}
```
- 모바일(320px~430px)에서는 `zoom: 0.35` 및 `fitBounds(worldBounds, { padding: [4, 4] })`가 적용되어 전 세계 6개 대륙의 윤곽이 잘림 없이 100% 한눈에 노출됩니다.

---

## 6. 브랜드 인트로 분석 (`BrandOpeningIntro.tsx`)

### 동작 원리 및 타임라인
1. `init` (0ms ~ 150ms): 오프닝 배경 노출 (`#316bff`).
2. `animating` (150ms ~ 1250ms): `P`, `L`, `A`, `N`, `I`, `T` 6개 알파벳이 0.11초 간격으로 `scale(0.94)` → `scale(1.0)`부드러운 Fade In.
3. `subtitle` (1250ms ~ 1850ms): `Plan your journey.` 서브문구 Fade In.
4. `fadeout` (1850ms ~ 2400ms): `.brandIntroOverlay.fadeOut` 클래스 적용으로 `opacity: 0`, `pointer-events: none` 전환.
5. `done` (2400ms 이후): `setStage("done")` 및 `onComplete()` 호출로 DOM에서 완전히 제거.

### 최초 접속 및 새로고침 감지 로직
```ts
useEffect(() => {
  if (typeof window === "undefined") return;
  const navEntries = performance.getEntriesByType("navigation");
  const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "reload";
  const hasSeenSession = sessionStorage.getItem("planit_intro_seen_session");

  if (!hasSeenSession || isReload) {
    sessionStorage.setItem("planit_intro_seen_session", "true");
    setShowIntro(true);
  }
}, []);
```
- **장점**: F5 새로고침이나 첫 방문 시에는 무조건 오프닝 인트로가 실행되지만, 사이트 내부 이동(`/about` → `/`) 시에는 탭 세션이 유지되어 재재생 없이 메인 화면이 즉시 표시됩니다.

---

## 7. 여행 플래너 분석 (`PlannerApp.tsx`)

### 핵심 기능 동작 흐름
1. **여행 조건 설정 및 생성 버튼 클릭 (`FormEvent`)**:
   - `generateItinerary()` 실행 → `utils/itineraryGenerator.ts` 호출.
2. **AI 일정 생성 알고리즘 (`itineraryGenerator.ts`)**:
   - 선택된 도시의 `placesByCity(destination)` 데이터 로드.
   - 여행자 취향(미식, 자연 등)에 따라 장소에 가중치(Score) 부여.
   - 하루 3~5개 장소를 시간대별(아침/점심/오후/저녁/야경)로 최적 배치.
   - 하버사인 식 공식으로 직전 장소와의 거리 및 이동 시간 계산.
3. **일정 편집 기능**:
   - **장소 순서 변경**: HTML5 Drag & Drop (`onDragStart`, `onDrop`) 및 모바일 전용 ↑↓ 화살표 버튼 (`moveWithinDay`).
   - **실행 취소 (Undo)**: `historyRef.current` 스택에 직전 `plan` 배열 상태를 저장하여 20단계 실행 취소 지원.
   - **자동 저장 배지 분리**: 모바일에서 `✓ 자동 저장됨` 배지가 독립된 상단 행으로 분리되고 액션 버튼들(`[일정 저장] [링크 공유] [PDF 저장] [캘린더 내보내기]`)은 동등한 가로 스크롤 행으로 표시되어 잘림 방지.

---

## 8. 데이터 구조 분석 (`data/`)

### 데이터 추적 구조 (국가 → 도시 → 장소 → 일정 카드)
1. `data/countries.ts`: 25개국 목록 (`name`, `code`, `flag`, `continent`).
2. `data/cities.ts`: 100+ 도시 데이터 (`name`, `country`, `latitude`, `longitude`).
3. `data/places.ts`: 장소 객체 인터페이스 및 데이터:
```ts
export interface Place {
  id: string;
  name: string;
  country: string;
  cityName: string;
  category: "landmark" | "culture" | "food" | "nature" | "shopping" | "market";
  latitude: number;
  longitude: number;
  estimatedCost: number;
  recommendedDuration: number;
  recommendedTime: "morning" | "afternoon" | "evening";
  description: string;
  tags: string[];
}
```

---

## 9. Route API (`app/api/route/route.ts`)

### OpenRouteService (ORS) 연동 API
- **역할**: 두 장소의 위도/경도를 입력받아 실제 도로 네트워크 기반 이동 거리(km)와 소요 시간(분)을 계산해 반환하는 백엔드 API 엔드포인트입니다.
- **오류 처리 및 Fallback**: `process.env.OPENROUTESERVICE_API_KEY`가 없거나 네트워크 오류 발생 시, 하버사인 직선거리 기반 수학적 추정치로 자동 전환(Fallback)되어 앱이 튕기지 않고 안정적으로 동작합니다.

---

## 10. Supabase 데이터베이스 및 인증 (`lib/supabase/`)

### 듀얼 저장소 구조 (`utils/tripPersistence.ts`)
- **비로그인 사용자**: `LocalStorage` (`writeDraft`)에 여행 일정 저장.
- **로그인 사용자 (Google OAuth)**: `Supabase Database` (`public.trips` 테이블)에 PostgreSQL RLS(Row Level Security) 정책으로 본인 계정 데이터로 안전하게 암호화 저장.

---

## 11. CSS 및 모바일 반응형 이슈 원인 분석 (`app/globals.css`)

### 모바일 이슈 해결 분석
1. **한글 단어 깨짐 (예: "설계합\n니다") 원인 및 해결**:
   - **원인**: 기본 브라우저 한글 워드랩 동작이 문자 단위(Character-wrap)로 쪼개지는 현상.
   - **해결**: `word-break: keep-all; overflow-wrap: break-word;` 속성을 주요 Heading 및 Text 요소에 적용하여 어절 단위로 자연스럽게 줄바꿈되도록 수정.
2. **모바일 지도 좌우 잘림 원인 및 해결**:
   - **원인**: 모바일 뷰포트에서 지도의 `height: 380px` 세로 비율과 고정 `minZoom: 1.15` 충돌.
   - **해결**: 모바일 지도 높이를 `clamp(240px, 35vh, 280px)`로 높이고 `minZoom: 0.25` 및 `padding: [4, 4]` fitBounds를 적용하여 100% 한눈에 화면에 맞춤.

---

## 12. 사용자 행동 전체 흐름 (Full Flow Matrix)

| 단계 | 사용자 행동 | 실행 컴포넌트 | 호출 함수 / Hook | State / Storage 변화 | 결과 UI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `hayoung.cloud` 접속 | `InteractiveMapIntro` | `useEffect` 세션 검사 | `showIntro = true` | `P L A N I T` 오프닝 인트로 (2.4s) |
| 2 | 메인에서 국가/도시 선택 | `InteractiveMapIntro` | `handleCountryChange` | `selectedCountry`, `selectedCityName` | 선택 도시 카드가 등장하며 하단 지도 이동 |
| 3 | `여행 일정 만들기` 클릭 | `InteractiveMapIntro` | `goPlanner()` | `window.location.href = /planner?...` | 플래너 페이지(`/planner`)로 전환 |
| 4 | 일정 자동 생성 완료 | `PlannerApp` | `generateItinerary()` | `status = "complete"`, `plan = [...]` | DAY1~DAY4 일정 타임라인 및 지도 핀 렌더링 |
| 5 | 장소 순서 변경 | `PlannerApp` | `moveStop()` / `moveWithinDay()` | `plan` 배열 갱신, `historyRef` 저장 | 동선 및 이동시간 실시간 재계산 |
| 6 | 일정 저장 버튼 클릭 | `PlannerApp` | `saveCurrentTrip()` | `saveStatus = "saved"`, `Supabase DB/LocalStorage` | `✓ 자동 저장됨` 배지 및 보관함 저장 |

---

## 13. 초보자가 꼭 읽어야 할 코드 20선

1. **`app/layout.tsx` (L21-L23)**: Root Layout 구조 및 AuthProvider 전달.
2. **`components/intro/BrandOpeningIntro.tsx` (L47-L83)**: 순차 애니메이션 CSS 트랜지션 inline style 적용.
3. **`components/map/InteractiveMapIntro.tsx` (L61-L68)**: `useState` 초기화 함수(Lazy initial state) 사용법.
4. **`components/map/MapCanvas.tsx` (L27-L33)**: 뷰포트 너비 기반 responsive zoom 객체 반환.
5. **`components/map/MapCanvas.tsx` (L84-L111)**: Leaflet 동적 import 및 `invalidateSize()`.
6. **`components/planner/PlannerApp.tsx` (L36)**: 커스텀 hook(`usePlannerState`) 분리.
7. **`components/planner/PlannerApp.tsx` (L73)**: 디바운스(Debounce) 스타일 자동 저장 `useEffect`.
8. **`components/planner/PlannerApp.tsx` (L75-L77)**: Undo(실행 취소) 스택 관리.
9. **`components/planner/PlannerApp.tsx` (L84)**: 장소 추가 시 근교 하루 일정 배치 로직.
10. **`components/planner/PlannerApp.tsx` (L97)**: `.ics` 캘린더 파일 Blob 생성 및 다운로드.
11. **`components/planner/PlannerApp.tsx` (L116)**: `actionButtonsGroup` 모바일 버튼 분리 UI.
12. **`utils/itineraryGenerator.ts` (L10-L45)**: 취향/시간대 가중치 알고리즘.
13. **`utils/distance.ts` (L1-L12)**: 위경도 하버사인(Haversine) 공식.
14. **`utils/transport.ts` (L1-L25)**: 이동수단(도보/대중교통/차량) 자동 판단.
15. **`utils/tripStorage.ts` (L1-L30)**: LocalStorage 안전 읽기/쓰기.
16. **`utils/tripPersistence.ts` (L1-L20)**: Supabase ↔ LocalStorage Fallback.
17. **`components/auth/AuthProvider.tsx` (L1-L35)**: React Context API 사용자 세션 공유.
18. **`components/auth/AccountActions.tsx` (L1-L40)**: 드롭다운 팝업 밖 클릭 감지(`handleClickOutside`).
19. **`app/api/route/route.ts` (L1-L40)**: Next.js API Route handler.
20. **`app/globals.css` (L2640-L2700)**: `word-break: keep-all` 및 모바일 미디어 쿼리.

---

## 14. 잘 구현된 부분 (Code Strengths)

- **우수한 회복성(Resilience & Fallback)**: OpenRouteService API Key가 없어도 수학적 알고리즘으로 자동 전환되며, Supabase DB 연결이 끊겨도 LocalStorage로 연동되어 앱이 절대 다운되지 않습니다.
- **체계적인 뷰포트 고려**: 320px부터 1920px까지 모든 디바이스를 고려한 전용 줌 레벨과 CSS 가로 스크롤링 설계.
- **깔끔한 렌더링 최적화**: Dynamic import와 `useMemo`를 통한 컴포넌트 분리 및 불필요한 DOM 리렌더링 최소화.

---

## 15. 개선할 부분 및 발전 방향

1. **상태 관리 도구 도입 (우선순위: 보통)**: 현재 `usePlannerState` 등 커스텀 hook과 `useState` 위주로 구성되어 있어, 전역 상태가 커질 경우 Zustand나 Redux Toolkit 도입 권장.
2. **장소 데이터 분할 관리 (우선순위: 장기)**: 현재 30개의 정적 TS 파일(`placesBatch1~26.ts`)에 데이터를 가지고 있으나, 장소가 10,000개 이상으로 늘어날 경우 PostgreSQL 데이터베이스로 전면 이관 권장.

---

## 16. 용어 사전 (Beginner's Glossary)

- **RSC (React Server Component)**: 서버에서 실행되어 HTML 결과만 클라이언트로 전달되는 컴포넌트.
- **Hydration (하이드레이션)**: 서버가 그린 정적 HTML에 클라이언트 자바스크립트 이벤트와 state를 연결하는 과정.
- **Haversine Formula**: 지구의 곡률을 고려하여 두 위도/경도 좌표 사이의 대권 거리를 구하는 공공 수학 공식.
- **RLS (Row Level Security)**: 데이터베이스 레벨에서 특정 사용자 본인의 행(Row)만 읽고 쓸 수 있도록 제한하는 보안 정책.

---

## 17. 추천 학습 순서

1. **`app/layout.tsx` → `app/page.tsx`**: 앱의 전체적인 입구와 구조 이해.
2. **`components/intro/BrandOpeningIntro.tsx`**: State 기반 타임라인 애니메이션 학습.
3. **`data/cities.ts` & `data/places.ts`**: TypeScript 타입 정의와 데이터 구조 파악.
4. **`utils/itineraryGenerator.ts`**: AI 알고리즘의 장소 추천 및 시간 배치 로직 학습.
5. **`components/planner/PlannerApp.tsx`**: 가장 핵심적인 React 복합 상태와 UI 바인딩 학습.

---

## 18. 초보자 실습 과제

- **쉬움**: `components/layout/Footer.tsx` 저작권 연도를 `2026`에서 `2027`로 변경해보기.
- **보통**: `data/cities.ts`에 새로운 한국 도시 1개(예: `강릉`)를 등록하고 좌표 지정해보기.
- **도전**: `components/planner/PlannerApp.tsx`에 `모든 일정 삭제` 초기화 버튼 하나 추가해보기.

---

## 19. 프로젝트 최종 요약

PLANIT은 **Next.js App Router**, **TypeScript**, **Leaflet.js**, **Supabase**를 활용하여 초보 개발자가 모던 웹 프론트엔드의 필수 개념(상태 관리, 클라이언트/서버 컴포넌트 구분, 지도 APIs, 모바일 반응형 UX)을 모두 배울 수 있는 우수한 실전 프로젝트 표준 교재입니다.

---

## 20. 검토한 주요 파일 목록

1. `app/layout.tsx`
2. `app/page.tsx`
3. `app/globals.css`
4. `app/about/page.tsx`
5. `app/contact/page.tsx`
6. `app/privacy/page.tsx`
7. `app/terms/page.tsx`
8. `app/trips/page.tsx`
9. `app/planner/page.tsx`
10. `app/place/page.tsx`
11. `app/login/page.tsx`
12. `app/api/route/route.ts`
13. `components/intro/BrandOpeningIntro.tsx`
14. `components/map/InteractiveMapIntro.tsx`
15. `components/map/MapCanvas.tsx`
16. `components/planner/PlannerApp.tsx`
17. `components/planner/PlannerMap.tsx`
18. `components/planner/usePlannerState.ts`
19. `components/planner/useTripPersistence.ts`
20. `components/auth/AccountActions.tsx`
21. `components/auth/AuthForm.tsx`
22. `components/auth/AuthProvider.tsx`
23. `components/layout/Footer.tsx`
24. `components/trips/SavedTrips.tsx`
25. `components/places/PlaceDetail.tsx`
26. `data/countries.ts`
27. `data/cities.ts`
28. `data/places.ts`
29. `utils/itineraryGenerator.ts`
30. `utils/distance.ts`
31. `utils/transport.ts`
32. `utils/tripStorage.ts`
33. `utils/tripPersistence.ts`
34. `lib/supabase/client.ts`
