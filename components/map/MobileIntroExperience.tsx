"use client";

import Link from "next/link";
import type { TravelCity } from "../../data/cities";
import styles from "./MobileIntroExperience.module.css";

type Props = {
  countries: string[];
  cities: TravelCity[];
  selectedCountry: string;
  selectedCityName: string;
  start: string;
  end: string;
  today: string;
  people: number;
  budget: number;
  isGenerating: boolean;
  loadingStep: number;
  isFormValid: boolean;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onPeopleChange: (value: number) => void;
  onBudgetChange: (value: number) => void;
  onCreate: () => void;
};

const loadingSteps = [
  "최적의 이동 경로 계산 중",
  "장소 운영시간 확인 중",
  "예산 균형 조정 중",
  "교통수단 확인 중",
  "일정 세부 조정 중",
];

function NavIcon({ type }: { type: "home" | "trips" | "map" | "profile" }) {
  const paths = {
    home: <><path d="M3.5 10.5 12 3.8l8.5 6.7" /><path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6" /></>,
    trips: <><rect x="4" y="6.5" width="16" height="13" rx="2.5" /><path d="M8 6.5V4.8h8v1.7M8 11h8M8 15h5" /></>,
    map: <><path d="m3.5 6 5-2 7 2 5-2v14l-5 2-7-2-5 2Z" /><path d="M8.5 4v14M15.5 6v14" /></>,
    profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.6-4 2.8-6 6.5-6s5.9 2 6.5 6" /></>,
  };
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

export default function MobileIntroExperience(props: Props) {
  const countryCities = props.cities.filter((city) => city.country === props.selectedCountry);
  const tripSummary = `${props.selectedCityName || "여행지"} 맞춤 여행 일정을`;

  return (
    <div className={styles.mobileOnly}>
      <section className={styles.hero}>
        <div className={styles.heroShade} />
        <strong className={styles.brand}>EYRIA</strong>
        <span className={styles.badge}>AI 여행 플래너</span>
        <h1>AI가 설계하는<br />나만의 완벽한 여행</h1>
        <p>새로운 여행을 시작해보세요</p>
      </section>

      <section className={styles.formPanel} aria-label="여행 일정 입력">
        <label>
          <span>여행지</span>
          <div className={styles.destinationRow}>
            <select value={props.selectedCountry} onChange={(event) => props.onCountryChange(event.target.value)}>
              <option value="">국가 선택</option>
              {props.countries.map((country) => <option key={country}>{country}</option>)}
            </select>
            <select
              value={props.selectedCityName}
              disabled={!props.selectedCountry}
              onChange={(event) => props.onCityChange(event.target.value)}
            >
              <option value="">도시 선택</option>
              {countryCities.map((city) => <option key={city.en} value={city.name}>{city.name}</option>)}
            </select>
          </div>
        </label>

        <label>
          <span>여행 기간</span>
          <div className={styles.dateRow}>
            <input type="date" min={props.today} value={props.start} onChange={(event) => props.onStartChange(event.target.value)} />
            <b>~</b>
            <input type="date" min={props.start || props.today} value={props.end} onChange={(event) => props.onEndChange(event.target.value)} />
          </div>
        </label>

        <div className={styles.controlRow}>
          <div>
            <span>여행 인원</span>
            <strong>{props.people > 0 ? `성인 ${props.people}명` : "인원 선택"}</strong>
          </div>
          <div className={styles.counter}>
            <button type="button" disabled={props.people <= 1} onClick={() => props.onPeopleChange(Math.max(1, props.people - 1))}>−</button>
            <button type="button" onClick={() => props.onPeopleChange(props.people > 0 ? props.people + 1 : 1)}>＋</button>
          </div>
        </div>

        <label>
          <span>여행 예산</span>
          <div className={styles.budgetRow}>
            <input
              type="number"
              min="1"
              placeholder="예산 입력"
              value={props.budget || ""}
              onChange={(event) => props.onBudgetChange(event.target.value ? Math.max(1, Number(event.target.value)) : 0)}
            />
            <b>만원</b>
          </div>
        </label>

        <button
          className={styles.cta}
          type="button"
          disabled={props.isGenerating}
          data-inactive={!props.isFormValid || undefined}
          onClick={props.onCreate}
        >
          AI 일정 만들기
        </button>
      </section>

      <nav className={styles.bottomNav} aria-label="모바일 주요 메뉴">
        <Link className={styles.active} href="/"><NavIcon type="home" /><span>홈</span></Link>
        <Link href="/trips"><NavIcon type="trips" /><span>내 여행</span></Link>
        <Link href="/planner?view=map"><NavIcon type="map" /><span>지도</span></Link>
        <Link href="/login"><NavIcon type="profile" /><span>내 정보</span></Link>
      </nav>

      {props.isGenerating && (
        <div className={styles.loading} role="status" aria-live="polite">
          <strong className={styles.loadingBrand}>EYRIA</strong>
          <div className={styles.ripple}><i /><i /><i /><i /></div>
          <h2>{tripSummary}<br />만들고 있어요</h2>
          <p>{props.start || "날짜 미정"} ~ {props.end || "날짜 미정"} · {props.people || 0}명</p>
          <ol>
            {loadingSteps.map((step, index) => (
              <li key={step} className={index === props.loadingStep ? styles.current : index < props.loadingStep ? styles.done : ""}>
                <span>{index < props.loadingStep ? "✓" : "●"}</span>{step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
