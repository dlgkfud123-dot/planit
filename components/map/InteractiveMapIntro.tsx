import BrandLogo from "../common/BrandLogo";
import Header from "../layout/Header";
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Footer from "../layout/Footer";
import dynamic from "next/dynamic";
import { cities, supportedCityIds, type TravelCity } from "../../data/cities";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <div className="travelMap" style={{ width: "100%", height: "100%", background: "#f8fafc", borderRadius: "20px" }} />
});

import BrandOpeningIntro from "../intro/BrandOpeningIntro";

export { cities } from "../../data/cities";

const supportedCityNames = new Set(supportedCityIds);
const availableCities = cities.filter((city) => supportedCityNames.has(city.name));

const countryFlags: Record<string, string> = {
  대한민국: "🇰🇷", 일본: "🇯🇵", 태국: "🇹🇭", 베트남: "🇻🇳", 대만: "🇹🇼",
  싱가포르: "🇸🇬", 인도네시아: "🇮🇩", 중국: "🇨🇳", 몽골: "🇲🇳", 아랍에미리트: "🇦🇪",
  프랑스: "🇫🇷", 영국: "🇬🇧", 이탈리아: "🇮🇹", 스위스: "🇨🇭", 스페인: "🇪🇸",
  네덜란드: "🇳🇱", 튀르키예: "🇹🇷", 러시아: "🇷🇺", 미국: "🇺🇸", 캐나다: "🇨🇦",
  브라질: "🇧🇷", 호주: "🇦🇺", 뉴질랜드: "🇳🇿", 이집트: "🇪🇬", 남아프리카공화국: "🇿🇦"
};

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

  const countryCount = useMemo(() => new Set(availableCities.map((c) => c.country)).size, []);
  const cityCount = availableCities.length;

  // Handle Country dropdown change
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedCityName(""); // Clear city selection when country changes
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

  // Handle City dropdown change
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

  // Synchronize map marker clicks
  const handleMapCitySelect = (city: TravelCity) => {
    setSelectedCountry(city.country);
    setSelectedCityName(city.name);
    setFocusedCountry(city.country);
    setCitiesVisible(true);
  };

  const handleMapCountrySelect = (country: string) => {
    handleCountryChange(country);
  };

  const goPlanner = () => {
    if (!selectedCountry || !selectedCityName) return;
    const p = new URLSearchParams({
      destination: selectedCityName,
    });
    window.location.href = `/planner?${p}`;
  };

  if (showIntro) {
    return <BrandOpeningIntro onComplete={handleIntroComplete} />;
  }

  return (
    <main className="landingWrapper">
      <Header />

      <div className="landingMainContent">
        <section className="heroHeaderSection">
          <div className="heroAmbientAura" aria-hidden="true" />
          <div className="heroBadge">
            <span>✦</span> Intelligent Itinerary Builder
          </div>
          <h1 className="heroTitle">
            AI가 설계하는 나만의 완벽한 여행
          </h1>
          <p className="heroSubtitle">
            국가와 도시를 선택하면 AI가 이동 동선까지 자연스러운 일정을 만듭니다.
          </p>
          <div className="heroTagline">
            PERFECT ITINERARY IN SECONDS
          </div>

          <div className="heroValueIndicators">
            <div className="valueIndicatorItem">
              <div className="valueTextGroup">
                <strong className="valueTitle">{countryCount}+ 국가</strong>
                <span className="valueDesc">전 세계 여행지</span>
              </div>
            </div>
            <div className="valueDivider" />
            <div className="valueIndicatorItem">
              <div className="valueTextGroup">
                <strong className="valueTitle">AI 맞춤 설계</strong>
                <span className="valueDesc">취향 기반 일정 생성</span>
              </div>
            </div>
            <div className="valueDivider" />
            <div className="valueIndicatorItem">
              <div className="valueTextGroup">
                <strong className="valueTitle">실시간 자동 구성</strong>
                <span className="valueDesc">자유로운 일정 편집</span>
              </div>
            </div>
          </div>
        </section>

      <section className="plannerGridSection">
        <div className="heroSelectCard">
          <div className="selectFormGroup countryGroup">
            <label id="countrySelectLabel">국가 선택</label>
            <div className="customSelectWrapper" ref={countryDropdownRef}>
              <button
                type="button"
                aria-labelledby="countrySelectLabel"
                aria-haspopup="listbox"
                aria-expanded={isCountryOpen}
                className={`customSelectTrigger ${isCountryOpen ? "open" : ""}`}
                onClick={() => {
                  setIsCityOpen(false);
                  setIsCountryOpen((prev) => !prev);
                }}
              >
                <span className="selectValue">
                  {selectedCountry ? selectedCountry : "여행할 국가를 선택하세요"}
                </span>
                <i className="selectArrow">{isCountryOpen ? "▲" : "▼"}</i>
              </button>

              {isCountryOpen && (
                <div className="customDropdownPanel" role="listbox" aria-labelledby="countrySelectLabel">
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
                            role="option"
                            aria-selected={selectedCountry === country}
                            className={`countryOption ${selectedCountry === country ? "selected" : ""}`}
                            onClick={() => handleCountryChange(country)}
                          >
                            <span className="countryName">{country}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="selectFormGroup cityGroup">
            <label id="citySelectLabel">도시 선택</label>
            <div className="customSelectWrapper" ref={cityDropdownRef}>
              <button
                type="button"
                id="citySelect"
                aria-labelledby="citySelectLabel"
                aria-haspopup="listbox"
                aria-expanded={isCityOpen}
                disabled={!selectedCountry}
                className={`customSelectTrigger ${!selectedCountry ? "disabled" : ""} ${isCityOpen ? "open" : ""}`}
                onClick={() => {
                  if (selectedCountry) {
                    setIsCountryOpen(false);
                    setIsCityOpen((prev) => !prev);
                  }
                }}
              >
                <span className="selectValue">
                  {!selectedCountry
                    ? "먼저 국가를 선택하세요"
                    : selectedCityName
                    ? selectedCityName
                    : "도시를 선택하세요"}
                </span>
                <i className="selectArrow">{isCityOpen ? "▲" : "▼"}</i>
              </button>

              {isCityOpen && selectedCountry && (
                <div className="customDropdownPanel" role="listbox" aria-labelledby="citySelectLabel">
                  {countryCities.map((city) => (
                    <button
                      key={city.en}
                      type="button"
                      role="option"
                      aria-selected={selectedCityName === city.name}
                      className={`countryOption ${selectedCityName === city.name ? "selected" : ""}`}
                      onClick={() => handleCityChange(city.name)}
                    >
                      <span className="countryName">{city.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="heroCtaButton"
            disabled={!selectedCountry || !selectedCityName}
            onClick={goPlanner}
          >
            ✦ 여행 일정 만들기
          </button>
        </div>

        <div className="heroRightMap">
          <MapCanvas
            cities={availableCities}
            focusedCountry={focusedCountry}
            citiesVisible={citiesVisible}
            hoveredCity={hoveredCity}
            selected={selectedCity}
            showRoute={!!selectedCity}
            onCountrySelect={handleMapCountrySelect}
            onSelect={handleMapCitySelect}
            onCityHover={setHoveredCity}
            onMoveComplete={() => {}}
          />
        </div>
      </section>
      </div>

      <Footer />
    </main>
  );
}
