"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../layout/Header";
import { places, placesByCity, type Place } from "../../data/places";
import { getPlaceDetailMeta } from "../../data/placeDetailRegistry";
import CityDetailModal from "../cities/CityDetailModal";
import SinglePlaceMap from "./SinglePlaceMap";

export default function PlaceDetail() {
  const router = RouterHook();
  const [place, setPlace] = useState<Place | null | undefined>(undefined);
  const [dayParam, setDayParam] = useState<string | null>(null);
  const [stopParam, setStopParam] = useState<string | null>(null);
  const [destParam, setDestParam] = useState<string | null>(null);
  const [draftParam, setDraftParam] = useState<string | null>(null);
  const [savedParam, setSavedParam] = useState<string | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [nearbyFilter, setNearbyFilter] = useState<"all" | "landmark" | "food" | "culture">("all");

  function RouterHook() {
    try {
      return useRouter();
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = new URLSearchParams(location.search);
      const id = q.get("id");
      const day = q.get("day");
      const stop = q.get("stop");
      const dest = q.get("dest");
      const draft = q.get("draft") || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("eyria:active-draft-id") : null);
      const saved = q.get("saved");

      setDayParam(day);
      setStopParam(stop);
      setDestParam(dest);
      setDraftParam(draft);
      setSavedParam(saved);

      if (!id) {
        setPlace(null);
        return;
      }

      // Place Lookup
      let matched = places.find((item) => item.id === id);
      if (!matched) {
        const cleanedId = id.replace(/-\d+$/, "");
        matched = places.find((item) => item.id === cleanedId);
      }
      if (!matched) {
        const cleanedId = id.replace(/-\d+$/, "");
        matched = places.find((item) => id.startsWith(item.id) || item.id.startsWith(cleanedId));
      }
      if (!matched && dest) {
        const cityPlaces = places.filter((p) => p.cityId === dest);
        matched = cityPlaces.find((p) => id.includes(p.id) || p.id.includes(id));
      }

      setPlace(matched || null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleBack = () => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(location.search);
    const returnTo = q.get("returnTo");
    const draftId = q.get("draft") || sessionStorage.getItem("eyria:active-draft-id");
    const savedId = q.get("saved");
    const day = q.get("day");
    const stop = q.get("stop");

    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      window.location.href = returnTo;
      return;
    }

    if (savedId || draftId) {
      const params = new URLSearchParams();
      if (savedId) params.set("saved", savedId);
      if (draftId) params.set("draft", draftId);
      if (day) params.set("day", day);
      if (stop) params.set("stop", stop);
      window.location.href = `/planner?${params.toString()}`;
      return;
    }

    if (window.history.length > 1) {
      router?.back();
    } else {
      window.location.href = "/planner";
    }
  };

  const handleReplaceAction = () => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(location.search);
    const draftId = q.get("draft") || sessionStorage.getItem("eyria:active-draft-id");
    const savedId = q.get("saved");
    const day = q.get("day");
    const stop = q.get("stop");
    const params = new URLSearchParams();
    if (savedId) params.set("saved", savedId);
    if (draftId) params.set("draft", draftId);
    if (day) params.set("day", day);
    if (stop) params.set("stop", stop);
    if (place) params.set("replace", place.id);
    window.location.href = `/planner?${params.toString()}`;
  };

  if (place === undefined) {
    return <main className="detailLoading">장소 정보를 불러오는 중입니다...</main>;
  }

  if (!place) {
    return (
      <main className="detailLoading">
        <h1>장소를 찾을 수 없습니다.</h1>
        <p style={{ color: "#64748b", marginBottom: "20px" }}>요청하신 장소 데이터를 확인하지 못했습니다.</p>
        <button type="button" onClick={handleBack} className="returnPlannerLink">
          ← 일정으로 돌아가기
        </button>
      </main>
    );
  }

  // Get place metadata
  const meta = getPlaceDetailMeta(place);

  // Category Translation Map (Text-only, no emojis)
  const categoryLabelMap: Record<string, string> = {
    landmark: "명소 / 랜드마크",
    culture: "문화 / 유적",
    nature: "자연 / 공원",
    food: "미식 / 식당",
    market: "시장 / 로컬푸드",
    shopping: "쇼핑 / 상점가",
  };

  // Nearby places filtering
  const allNearby = placesByCity(place.cityId).filter((p) => p.id !== place.id);
  const filteredNearby = allNearby
    .filter((p) => {
      if (nearbyFilter === "all") return true;
      if (nearbyFilter === "landmark") return p.category === "landmark" || p.category === "nature";
      if (nearbyFilter === "food") return p.category === "food" || p.category === "market";
      if (nearbyFilter === "culture") return p.category === "culture" || p.category === "shopping";
      return true;
    })
    .slice(0, 4);

  const backText = dayParam ? `← DAY ${dayParam} 일정으로 돌아가기` : "← 일정으로 돌아가기";
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;

  // Cost formatting (Truthful data only)
  let costDisplay = "확인 필요";
  if (place.estimateStatus === "free" || place.estimatedCost === 0) {
    costDisplay = "무료 관람 (기본 입장료 없음)";
  } else if (place.estimatedCost > 0) {
    costDisplay = `약 ${place.estimatedCost.toLocaleString()}원`;
  }

  return (
    <main className="placeDetailPageClean">
      <Header />

      {/* 1. 장소 헤더 (Text-Centric Place Header - Strictly 0 Place Photos across ALL Cities) */}
      <header className="cleanHeaderSection">
        <div className="cleanHeaderContainer">
          {/* Top Breadcrumb & Context Bar */}
          <nav className="cleanBreadcrumbBar">
            <button type="button" onClick={handleBack} className="cleanBackBtn">
              {backText}
            </button>
            <div className="cleanContextBadges">
              <span className="contextLocationText">
                {place.cityId} {place.district}
              </span>
              {dayParam && <span className="contextDayTag">DAY {dayParam}</span>}
              {stopParam && <span className="contextStopTag">{Number(stopParam) + 1}번째 방문</span>}
            </div>
          </nav>

          {/* Place Title & Essential Typography */}
          <div className="placeTitleBlock">
            <div className="categoryMetaRow">
              <span className="categoryTextTag">
                {categoryLabelMap[place.category] || "추천 장소"}
              </span>
              <span className="locationDot">•</span>
              <span className="districtTextTag">
                {place.cityId} {place.district}
              </span>
            </div>

            <h1 className="mainPlaceName">{place.name}</h1>

            <p className="mainPlaceIntro">
              {meta.whyRecommend || place.description || `${place.cityId} ${place.district}에 위치한 추천 장소입니다.`}
            </p>
          </div>

          {/* Action Button Tray (Text-focused) */}
          <div className="cleanActionTray">
            <button type="button" onClick={handleReplaceAction} className="primaryReplaceBtn">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px", transform: "translateY(-1px)" }}
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              이 장소로 현재 일정 교체하기
            </button>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="secondaryGoogleMapsBtn">
              Google 지도에서 위치 보기
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "6px", display: "inline-block", verticalAlign: "middle" }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
            <button type="button" onClick={handleBack} className="secondaryReturnBtn">
              일정으로 돌아가기
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout Container */}
      <div className="cleanMainBody">
        {/* 2. 장소 소개 (Place Introduction) */}
        <section className="cleanSectionBox">
          <div className="cleanSectionTitle">
            <h2>장소 소개</h2>
            <p>{place.name}의 역사, 특징 및 방문 가이드</p>
          </div>

          <div className="cleanIntroGrid">
            <article className="famousDescCard">
              <h3>이 장소가 유명한 이유</h3>
              <p className="storyBodyText">
                {meta.whyRecommend || `${place.name}은(는) ${place.cityId} ${place.district} 권역에 위치한 명소입니다. ${place.description}`}
              </p>

              {meta.stayMethod && (
                <div className="stayTipCard">
                  <span className="tipHeaderLabel">추천 동선 및 체류 팁</span>
                  <p>{meta.stayMethod}</p>
                </div>
              )}
            </article>

            <div className="introInfoSidebar">
              {/* Mood & Tag Pills (Text-only, no emojis) */}
              <div className="tagsCard">
                <span className="sidebarLabel">분위기 및 특징</span>
                <div className="pillTagWrap">
                  {place.tags.map((tag) => (
                    <span key={tag} className="textTagPill">
                      #{tag}
                    </span>
                  ))}
                  <span className="textTagPill">#{place.district}</span>
                  <span className="textTagPill">
                    #{place.environment === "outdoor" ? "야외공간" : place.environment === "indoor" ? "실내공간" : "실내외겸용"}
                  </span>
                </div>
              </div>

              {/* Visit Recommendation Metrics */}
              <div className="metricsList">
                <div className="metricRow">
                  <span className="metricKey">추천 방문 시간</span>
                  <span className="metricVal">
                    {meta.bestTimeNote || (place.recommendedTime === "morning" ? "오전 시간대 (09:00~11:00)" : place.recommendedTime === "evening" ? "저녁 시간대 (18:00~20:00)" : "오후 시간대 (13:00~16:00)")}
                  </span>
                </div>

                <div className="metricRow">
                  <span className="metricKey">추천 계절</span>
                  <span className="metricVal">사계절 (방문 목적에 따른 계절 조화)</span>
                </div>

                <div className="metricRow">
                  <span className="metricKey">권장 체류 시간</span>
                  <span className="metricVal">
                    약 {place.recommendedDuration}분
                    {Math.floor(place.recommendedDuration / 60) > 0
                      ? ` (${Math.floor(place.recommendedDuration / 60)}시간 ${place.recommendedDuration % 60 > 0 ? `${place.recommendedDuration % 60}분` : ""})`
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 방문 정보 및 지도 (Visit Info & Map) */}
        <section className="cleanSectionBox">
          <div className="cleanSectionTitle">
            <h2>방문 정보 및 지도</h2>
            <p>운영시간, 비용, 예약 및 실시간 위치 안내</p>
          </div>

          <div className="visitGrid">
            {/* Practical Info List */}
            <div className="visitInfoColumn">
              <div className="visitFactCard">
                <span className="factLabel">운영시간</span>
                <strong className="factValue">{place.openingHours || "방문 전 안내 확인 필요"}</strong>
                <span className="factSub">현지 사정에 따라 변경될 수 있습니다.</span>
              </div>

              <div className="visitFactCard">
                <span className="factLabel">입장료 및 예상 비용</span>
                <strong className="factValue">{costDisplay}</strong>
                <span className="factSub">개인 소비 및 특별 전시 요금 미포함</span>
              </div>

              <div className="visitFactCard">
                <span className="factLabel">예약 여부</span>
                <strong className="factValue">
                  {place.estimateStatus === "free" ? "자유 관람 / 현장 입장" : "현장 입장 또는 사전 예매 권장"}
                </strong>
                <span className="factSub">성수기 방문 시 공식 예매 채널 사전 확인 권장</span>
              </div>

              <div className="visitFactCard">
                <span className="factLabel">교통 및 접근 정보</span>
                <strong className="factValue">{place.cityId} {place.district} 권역</strong>
                <span className="factSub">{meta.transportTip || `추천 이동 수단: ${place.transportHints.join(" · ")}`}</span>
              </div>
            </div>

            {/* Leaflet Interactive Map */}
            <div className="visitMapColumn">
              <div className="mapTopRow">
                <span className="mapTitle">실시간 지도 위치</span>
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="googleMapsTextLink">
                  Google 지도에서 길찾기
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px", display: "inline-block", verticalAlign: "middle" }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
              <SinglePlaceMap
                lat={place.latitude}
                lng={place.longitude}
                placeName={place.name}
                district={`${place.cityId} ${place.district}`}
              />
            </div>
          </div>
        </section>

        {/* 4. 근처 추천 장소 (Nearby Recommendations - Photo-free text cards) */}
        {allNearby.length > 0 && (
          <section className="cleanSectionBox">
            <div className="cleanSectionTitle">
              <h2>{place.cityId} {place.district} 인근 연계 추천 장소</h2>
              <p>{place.name}과(와) 동선상 함께 둘러보기 좋은 스팟 목록입니다.</p>
            </div>

            {/* Filter Tabs */}
            <div className="textFilterRow">
              <button
                type="button"
                className={`textFilterBtn ${nearbyFilter === "all" ? "active" : ""}`}
                onClick={() => setNearbyFilter("all")}
              >
                전체 추천 ({allNearby.length})
              </button>
              <button
                type="button"
                className={`textFilterBtn ${nearbyFilter === "landmark" ? "active" : ""}`}
                onClick={() => setNearbyFilter("landmark")}
              >
                명소 / 자연
              </button>
              <button
                type="button"
                className={`textFilterBtn ${nearbyFilter === "food" ? "active" : ""}`}
                onClick={() => setNearbyFilter("food")}
              >
                미식 / 시장
              </button>
              <button
                type="button"
                className={`textFilterBtn ${nearbyFilter === "culture" ? "active" : ""}`}
                onClick={() => setNearbyFilter("culture")}
              >
                문화 / 쇼핑
              </button>
            </div>

            {/* Text-based Nearby Cards */}
            <div className="textNearbyGrid">
              {filteredNearby.map((np) => (
                <Link
                  key={np.id}
                  href={`/place?id=${np.id}&dest=${encodeURIComponent(place.cityId)}${
                    draftParam ? `&draft=${draftParam}` : ""
                  }${savedParam ? `&saved=${savedParam}` : ""}${
                    dayParam ? `&day=${dayParam}` : ""
                  }${stopParam ? `&stop=${stopParam}` : ""}`}
                  className="textNearbyCard"
                >
                  <div className="textNearbyHeader">
                    <strong className="textNearbyName">{np.name}</strong>
                    <span className="textNearbyCategory">{categoryLabelMap[np.category] || np.category}</span>
                  </div>

                  <p className="textNearbyDesc">{np.description}</p>

                  <div className="textNearbyFooter">
                    <span className="textNearbyMeta">
                      {np.district} • 권장 체류 약 {np.recommendedDuration}분
                    </span>
                    <span className="textNearbyArrow">
                      상세보기
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px", display: "inline-block", verticalAlign: "middle" }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 5. 도시 여행 가이드 (Small, clean bottom banner/link ONLY!) */}
        <section className="cleanCityGuideSection">
          <div className="cleanCityGuideBar">
            <div className="guideBarText">
              <strong>{place.cityId} 여행 종합 가이드</strong>
              <span>{place.cityId}의 7가지 취향 프로필, 권장 체류 기간 및 핵심 특징 확인하기</span>
            </div>
            <button
              type="button"
              className="cleanCityGuideBtn"
              onClick={() => setShowCityModal(true)}
            >
              {place.cityId} 여행 가이드 보기
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "6px", display: "inline-block", verticalAlign: "middle" }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </section>
      </div>

      {/* CITY DETAIL MODAL (Portal mounted to document.body) */}
      {showCityModal && (
        <CityDetailModal
          cityName={place.cityId}
          onClose={() => setShowCityModal(false)}
        />
      )}
    </main>
  );
}
