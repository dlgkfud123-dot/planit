import BrandLogo from "../common/BrandLogo";
import Header from "../layout/Header";
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Footer from "../layout/Footer";
import dynamic from "next/dynamic";
import { cities, supportedCityIds, type TravelCity } from "../../data/cities";
import { generateItinerary } from "../../utils/itineraryGenerator";
import { writeDraftById, type TripSnapshot } from "../../utils/tripStorage";
import styles from "./InteractiveMapIntro.module.css";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <div className="travelMap" style={{ width: "100%", height: "100%", background: "transparent" }} />
});

import BrandOpeningIntro from "../intro/BrandOpeningIntro";

export { cities } from "../../data/cities";

const supportedCityNames = new Set(supportedCityIds);
const availableCities = cities.filter((city) => supportedCityNames.has(city.name));

const continentGroups: { continent: string; countries: string[] }[] = [
  {
    continent: "아시아",
    countries: ["대한민국", "일본", "태국", "베트남", "대만", "싱가포르", "인도네시아", "중국", "몽골", "아랍에미리트"]
  },
  {
    continent: "유럽",
    countries: ["프랑스", "영국", "이탈리아", "스위스", "스페인", "네덜란드", "튀르키예", "러시아"]
  },
  {
    continent: "북아메리카",
    countries: ["미국", "캐나다"]
  },
  {
    continent: "남아메리카",
    countries: ["브라질"]
  },
  {
    continent: "오세아니아",
    countries: ["호주", "뉴질랜드"]
  },
  {
    continent: "아프리카",
    countries: ["이집트", "남아프리카공화국"]
  }
];

function checkShouldShowIntro(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const navEntries = performance.getEntriesByType("navigation");
    const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "reload";
    const hasSeenSession = sessionStorage.getItem("eyria_intro_seen_session");
    if (!hasSeenSession || isReload) {
      return true;
    }
  } catch {}
  return false;
}

function calculateDays(start: string, end: string): number {
  if (!start || !end) return 4;
  try {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Number.isFinite(diffDays) && diffDays > 0 ? Math.min(diffDays, 14) : 4;
  } catch {
    return 4;
  }
}

export default function InteractiveMapIntro() {
  const [showIntro, setShowIntro] = useState<boolean>(checkShouldShowIntro);

  const handleIntroComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("eyria_intro_seen_session", "true");
    }
    setShowIntro(false);
  }, []);

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>("");

  // Travel Condition Inputs
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [people, setPeople] = useState<number>(0);
  const [budget, setBudget] = useState<number>(0);

  // Generation & Loading state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [focusedCountry, setFocusedCountry] = useState<string | null>(null);
  const [citiesVisible, setCitiesVisible] = useState(false);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCountryOpen(false);
        setIsCityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const countryCities = useMemo(() => {
    if (!selectedCountry) return [];
    return availableCities.filter((c) => c.country === selectedCountry);
  }, [selectedCountry]);

  const selectedCity = useMemo(() => {
    if (!selectedCityName) return null;
    return availableCities.find((c) => c.name === selectedCityName) || null;
  }, [selectedCityName]);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedCityName("");
    setIsCountryOpen(false);
    setIsCityOpen(false);
    if (country) {
      setFocusedCountry(country);
      setCitiesVisible(true);
    } else {
      setFocusedCountry(null);
      setCitiesVisible(false);
    }
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCityName(cityName);
    setIsCityOpen(false);
    if (cityName) {
      const cityObj = availableCities.find((c) => c.name === cityName);
      if (cityObj) {
        setSelectedCountry(cityObj.country);
        setFocusedCountry(cityObj.country);
        setCitiesVisible(true);
      }
    }
  };

  const handleMapCitySelect = (city: TravelCity) => {
    setSelectedCountry(city.country);
    setSelectedCityName(city.name);
    setFocusedCountry(city.country);
    setCitiesVisible(true);
  };

  const handleMapCountrySelect = (country: string) => {
    handleCountryChange(country);
  };

  // Validation
  const isFormValid = Boolean(
    selectedCountry &&
    selectedCityName &&
    start &&
    end &&
    people > 0 &&
    budget > 0
  );

  const handleCreateItinerary = () => {
    if (!isFormValid || isGenerating) return;
    setGenerationError(null);
    setIsGenerating(true);

    const steps = [
      `${selectedCityName} 여행 데이터 확인 중...`,
      `장소 및 영업시간 검증 중...`,
      `이동 거리 및 동선 계산 중...`,
      `예산(${budget}만원) 및 인원(${people}명)에 맞게 일정 조정 중...`,
      `최종 일정을 정리 중...`
    ];

    let currentStep = 0;
    setLoadingStepText(steps[0]);

    const interval = window.setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStepText(steps[currentStep]);
      } else {
        window.clearInterval(interval);

        try {
          const daysCount = calculateDays(start, end);
          const generatedPlan = generateItinerary({
            destination: selectedCityName,
            start,
            days: daysCount,
            style: "자연 · 도시",
            foodPreference: "현지 맛집 중심",
            pace: 2,
            wishList: "",
          });

          const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const snapshot: TripSnapshot = {
            schemaVersion: 2,
            id: draftId,
            title: `${selectedCityName} 여행`,
            destination: selectedCityName,
            origin: "서울",
            start,
            end,
            people,
            budget,
            tempo: "균형 있게",
            interest: "자연 · 도시",
            food: "현지 맛집 중심",
            stay: "편안한 호텔",
            pace: 2,
            plan: generatedPlan,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          writeDraftById(draftId, snapshot, 0, 0);
          sessionStorage.setItem("eyria:active-draft-id", draftId);

          window.location.href = `/planner?draft=${draftId}&day=1&stop=0`;
        } catch {
          setIsGenerating(false);
          setGenerationError("일정 생성 중 문제가 발생했습니다. 다시 시도해주세요.");
        }
      }
    }, 380);
  };

  if (showIntro) {
    return <BrandOpeningIntro onComplete={handleIntroComplete} />;
  }

  return (
    <main className={`landingWrapper hifiHeroLayout ${styles.desktopLanding}`}>
      <Header />

      {/* AI Generation Loading Transition Screen */}
      {isGenerating && (
        <div className="hifiLoadingOverlay" aria-live="polite">
          <div className="hifiLoadingCard">
            <div className="pulseRingGraphic">
              <div className="pulseCore" />
            </div>
            <h2>AI가 {selectedCityName} 완벽 여행 일정을 생성하고 있습니다</h2>
            <p className="loadingStepMessage">{loadingStepText}</p>
            <div className="loadingProgressTrack">
              <div className="loadingProgressFill" />
            </div>
            <span className="loadingTripInfoBadge">
              {selectedCityName} · {start} ~ {end} · {people}명 · {budget}만원
            </span>
          </div>
        </div>
      )}

      <div className="landingMainContent hifiCenterContainer">
        {/* Sleek Hero Header */}
        <section className="heroHeaderSection centeredHeroHeader">
          <div className="heroBadge">
            <span>✦</span> AI 여행 플래너
          </div>
          <h1 className="heroTitle hifiHeroTitle">
            AI가 설계하는 나만의 완벽한 여행
          </h1>
        </section>

        {/* Hero Stage: Floating Card Overlapping Directly On Top of Seamless Map Canvas */}
        <section className="hifiHeroStage">
          {/* Floating Search Bar Card (Positioned Absolute / Z-Index 20 Over Map) */}
          <div className="hifiHorizontalSearchCard hifiFloatingOverlayCard">
            {/* 1. 여행지 선택 (국가 / 도시) */}
            <div className="hifiSearchCol whereCol">
              <span className="colLabel">여행지 (국가 / 도시)</span>
              <div className="fieldWithIcon">
                <div className="destSelectGroup">
                  <div className="customSelectWrapper" ref={countryDropdownRef}>
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isCountryOpen}
                      className="hifiPillTrigger"
                      onClick={() => {
                        setIsCityOpen(false);
                        setIsCountryOpen((prev) => !prev);
                      }}
                    >
                      <span>{selectedCountry ? selectedCountry : "국가 선택"}</span>
                      <i className="chevronIcon">{isCountryOpen ? "▲" : "▼"}</i>
                    </button>
                    {isCountryOpen && (
                      <div className="customDropdownPanel" role="listbox">
                        {continentGroups.map((group) => {
                          const groupCountries = group.countries.filter((c) =>
                            availableCities.some((ac) => ac.country === c)
                          );
                          if (groupCountries.length === 0) return null;
                          return (
                            <div key={group.continent} className="continentGroup">
                              <div className="continentHeader">•• {group.continent}</div>
                              {groupCountries.map((country) => (
                                <button
                                  key={country}
                                  type="button"
                                  className={`countryOption ${selectedCountry === country ? "selected" : ""}`}
                                  onClick={() => handleCountryChange(country)}
                                >
                                  {country}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="customSelectWrapper" ref={cityDropdownRef}>
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isCityOpen}
                      disabled={!selectedCountry}
                      className={`hifiPillTrigger ${!selectedCountry ? "disabled" : ""}`}
                      onClick={() => {
                        if (selectedCountry) {
                          setIsCountryOpen(false);
                          setIsCityOpen((prev) => !prev);
                        }
                      }}
                    >
                      <span>
                        {!selectedCountry ? "도시 선택" : selectedCityName ? selectedCityName : "도시 선택"}
                      </span>
                      <i className="chevronIcon">{isCityOpen ? "▲" : "▼"}</i>
                    </button>
                    {isCityOpen && selectedCountry && (
                      <div className="customDropdownPanel" role="listbox">
                        {countryCities.map((city) => (
                          <button
                            key={city.en}
                            type="button"
                            className={`countryOption ${selectedCityName === city.name ? "selected" : ""}`}
                            onClick={() => handleCityChange(city.name)}
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="hifiColDivider" />

            {/* 2. 여행 기간 */}
            <div className="hifiSearchCol whenCol">
              <span className="colLabel">여행 기간</span>
              <div className="fieldWithIcon">
                <div className="dateRangeInputsGroup">
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => {
                      setStart(e.target.value);
                      if (end && e.target.value > end) setEnd("");
                    }}
                    className="hifiPillInput"
                  />
                  <span className="dateDash">-</span>
                  <input
                    type="date"
                    min={start || undefined}
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="hifiPillInput"
                  />
                </div>
              </div>
            </div>

            <div className="hifiColDivider" />

            {/* 3. 여행 인원 */}
            <div className="hifiSearchCol whoCol">
              <span className="colLabel">여행 인원</span>
              <div className="fieldWithIcon">
                <div className="counterPillGroup">
                  <button
                    type="button"
                    onClick={() => setPeople((p) => Math.max(1, p - 1))}
                    className="counterSmallBtn"
                    disabled={people <= 1}
                  >
                    -
                  </button>
                  <span className="peopleValText">{people > 0 ? `${people}명` : "인원 선택"}</span>
                  <button
                    type="button"
                    onClick={() => setPeople((p) => (p === 0 ? 1 : p + 1))}
                    className="counterSmallBtn"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="hifiColDivider" />

            {/* 4. 여행 예산 */}
            <div className="hifiSearchCol budgetCol">
              <span className="colLabel">여행 예산</span>
              <div className="fieldWithIcon">
                <div className="budgetPillWrap">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="예산 입력"
                    value={budget === 0 ? "" : budget}
                    onChange={(e) => setBudget(e.target.value ? Math.max(1, +e.target.value) : 0)}
                    className="hifiPillInput budgetPillInput"
                  />
                  <span className="kwTag">만원</span>
                </div>
              </div>
            </div>

            {/* 5. Build AI Itinerary ✨ Button */}
            <div className="hifiSearchCol ctaCol">
              <button
                type="button"
                className={`hifiGradientCtaBtn ${isFormValid ? "active" : "disabled"}`}
                disabled={!isFormValid || isGenerating}
                onClick={handleCreateItinerary}
              >
                AI 일정 만들기
              </button>
            </div>
          </div>

          {/* Background Map Canvas Layer (Extends Seamlessly Behind Card) */}
          <div className="hifiHeroMapBackground">
            <MapCanvas
              cities={availableCities}
              variant="intro"
              focusedCountry={focusedCountry}
              citiesVisible={citiesVisible}
              hoveredCity={hoveredCity}
              selected={selectedCity}
              showRoute={false}
              onCountrySelect={handleMapCountrySelect}
              onSelect={handleMapCitySelect}
              onCityHover={setHoveredCity}
              onMoveComplete={() => {}}
            />
          </div>
        </section>

        {generationError && <p className="hifiErrorText">{generationError}</p>}
      </div>

      <Footer />
    </main>
  );
}
