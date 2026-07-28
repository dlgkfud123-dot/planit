"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../layout/Header";
import { places, placesByCity, type Place } from "../../data/places";
import { getPlaceDetailMeta } from "../../data/placeDetailRegistry";

export default function PlaceDetail() {
  const router = RouterHook();
  const [place, setPlace] = useState<Place | null | undefined>(undefined);
  const [dayParam, setDayParam] = useState<string | null>(null);
  const [stopParam, setStopParam] = useState<string | null>(null);
  const [destParam, setDestParam] = useState<string | null>(null);
  const [draftParam, setDraftParam] = useState<string | null>(null);
  const [savedParam, setSavedParam] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
      setPlace(places.find((item) => item.id === id) || null);
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

    // 1. Explicit returnTo path if provided
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      window.location.href = returnTo;
      return;
    }

    // 2. State-preserved return link with draft/saved ID and active DAY/stop
    if (savedId || draftId) {
      const params = new URLSearchParams();
      if (savedId) params.set("saved", savedId);
      if (draftId) params.set("draft", draftId);
      if (day) params.set("day", day);
      if (stop) params.set("stop", stop);
      window.location.href = `/planner?${params.toString()}`;
      return;
    }

    // 3. Fallback to browser history if same origin
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
        <button type="button" onClick={handleBack} className="returnPlannerLink">
          ← 일정으로 돌아가기
        </button>
      </main>
    );
  }

  const meta = getPlaceDetailMeta(place.id);
  const nearbyPlaces = placesByCity(place.cityId)
    .filter((p) => p.id !== place.id)
    .slice(0, 3);

  const backText = dayParam ? `← DAY ${dayParam} 일정으로 돌아가기` : "← 일정으로 돌아가기";
  const stopOrderText = stopParam ? `${Number(stopParam) + 1}번째 일정` : "";

  return (
    <main className="placeDetailPage">
      <Header />

      {/* 상단 돌아가기 및 맥락 바 */}
      <nav className="detailContextBar">
        <div className="detailContextContainer">
          <button type="button" onClick={handleBack} className="backBtnLink">
            {backText}
          </button>
          <div className="contextTagGroup">
            <span className="destTag">{destParam || place.cityId} 여행</span>
            {dayParam && <span className="dayTag">DAY {dayParam}</span>}
            {stopOrderText && <span className="orderTag">{stopOrderText}</span>}
          </div>
        </div>
      </nav>

      {/* 비주얼 히어로 영역 (place.id 기반 검증된 이미지만 노출, 타 랜드마크 이미지 폴백 금지) */}
      {meta?.heroImage ? (
        <section className="placeVisualHasImage">
          <Image
            src={meta.heroImage}
            alt={place.name}
            fill
            sizes="100vw"
            unoptimized
            priority
            className="heroImg"
          />
          <div className="visualOverlayContent">
            <div className="badgeRow">
              <span className="categoryBadge">{place.category}</span>
              <span className="districtBadge">{place.district}</span>
            </div>
            <h1>{place.name}</h1>
            <p className="descSummary">{place.description}</p>
          </div>
        </section>
      ) : (
        <section className="placeVisualNoImage">
          <div className="noImgVisualContent">
            <div className="badgeRow">
              <span className="categoryBadge">{place.category}</span>
              <span className="districtBadge">{place.cityId} · {place.district}</span>
            </div>
            <h1>{place.name}</h1>
            <p className="descSummary">{place.description}</p>
          </div>
        </section>
      )}

      {/* 핵심 팩트 그리드 */}
      <section className="placeFactsGrid">
        <article className="factCard">
          <small>위치</small>
          <strong>{place.cityId} {place.district}</strong>
          <p>위도 {place.latitude.toFixed(4)}, 경도 {place.longitude.toFixed(4)}</p>
        </article>

        <article className="factCard">
          <small>추천 체류시간</small>
          <strong>약 {place.recommendedDuration}분</strong>
          <p>
            {place.recommendedTime === "morning"
              ? "오전 방문 권장"
              : place.recommendedTime === "evening"
              ? "저녁 방문 권장"
              : place.recommendedTime === "afternoon"
              ? "오후 방문 권장"
              : "시간대 자유"}
          </p>
        </article>

        <article className="factCard">
          <small>운영시간</small>
          <strong>{place.openingHours}</strong>
          <p>방문 전 현지 최신 안내 확인 필요</p>
        </article>

        <article className="factCard">
          <small>예상 비용</small>
          <strong>
            {place.estimatedCost
              ? `약 ${place.estimatedCost.toLocaleString()}원`
              : "무료 또는 현장 확인"}
          </strong>
          <p>개인 소비 및 환율에 따라 다를 수 있습니다.</p>
        </article>
      </section>

      {/* 갤러리 섹션 (있을 경우만 표시) */}
      {meta?.galleryImages && meta.galleryImages.length > 0 && (
        <section className="placeGallerySection">
          <h2>장소 갤러리</h2>
          <div className="galleryGrid">
            {meta.galleryImages.map((imgUrl, idx) => (
              <div
                key={imgUrl}
                className={`galleryThumb ${activeImageIndex === idx ? "active" : ""}`}
                onClick={() => setActiveImageIndex(idx)}
              >
                <Image src={imgUrl} alt={`${place.name} 갤러리 ${idx + 1}`} fill unoptimized />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 상세 여행 정보 패널 */}
      <section className="placeDetailInfoGrid">
        {/* 왼쪽 상세 가이드 */}
        <div className="mainGuideColumn">
          {meta?.whyRecommend && (
            <article className="guideBlock">
              <h3>추천 방문 이유</h3>
              <p>{meta.whyRecommend}</p>
            </article>
          )}

          {meta?.stayMethod && (
            <article className="guideBlock">
              <h3>추천 체류 방법</h3>
              <p>{meta.stayMethod}</p>
            </article>
          )}

          {meta?.bestTimeNote && (
            <article className="guideBlock">
              <h3>추천 방문 시간대 팁</h3>
              <p>{meta.bestTimeNote}</p>
            </article>
          )}

          {meta?.targetAudience && (
            <article className="guideBlock">
              <h3>추천 대상</h3>
              <p>{meta.targetAudience}</p>
            </article>
          )}

          <article className="guideBlock">
            <h3>이동 팁 & 관람 정보</h3>
            <p>
              주요 이동 수단: <strong>{place.transportHints.join(" · ")}</strong>
            </p>
            {meta?.transportTip && <p className="subTip">{meta.transportTip}</p>}
          </article>
        </div>

        {/* 오른쪽 주변 추천 장소 & 액션 */}
        <div className="sideActionColumn">
          {/* 액션 버튼 */}
          <div className="detailActionTray">
            <h3>일정 액션</h3>
            <button type="button" onClick={handleBack} className="primaryBackAction">
              {backText}
            </button>
            <button type="button" onClick={handleReplaceAction} className="secondaryAction">
              일정에서 다른 장소로 교체하기
            </button>
          </div>

          {/* 주변 추천 장소 */}
          {nearbyPlaces.length > 0 && (
            <div className="nearbyPlacesBlock">
              <h3>{place.cityId} 주변 추천 장소</h3>
              <div className="nearbyList">
                {nearbyPlaces.map((np) => (
                  <Link
                    key={np.id}
                    href={`/place?id=${np.id}&dest=${encodeURIComponent(place.cityId)}${draftParam ? `&draft=${draftParam}` : ""}${savedParam ? `&saved=${savedParam}` : ""}`}
                    className="nearbyItemCard"
                  >
                    <strong>{np.name}</strong>
                    <small>{np.district} · {np.category}</small>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 외부 링크 */}
          <div className="externalMapBlock">
            <h3>지도 확인</h3>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mapSearchLink"
            >
              구글 지도에서 위치 보기 ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
