"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandLogo from "../common/BrandLogo";
import Header from "../layout/Header";
import { cities, supportedCityIds, type TravelCity } from "../../data/cities";
import { placesByCity, type Place } from "../../data/places";
import { fetchWeatherData, type WeatherDataResponse } from "../../utils/weatherService";
import { calculateDayCostSummary, formatCurrency, formatKrwReference, EXCHANGE_RATE_METADATA } from "../../utils/costEngine";
import { validateStopOpening } from "../../utils/openingHoursValidator";
import { findSmartCandidates, replaceSingleStop } from "../../utils/smartReplaceEngine";

import {
  generateItinerary,
  refreshDay,
  type GeneratedDay,
  type GeneratedStop,
} from "../../utils/itineraryGenerator";
import {
  addRecentDestination,
  DESTINATION_COUNTRIES,
  getRecentDestinations,
  POPULAR_CITIES,
  searchDestinations,
} from "../../data/destinationData";

const PlannerMap = dynamic(() => import("./PlannerMap"), {
  ssr: false,
  loading: () => <div className="realPlannerMap" style={{ width: "100%", height: "100%", background: "#f8fafc" }} />,
});

import {
  decodeSharedTrip,
  downloadText,
  encodeSharedTrip,
  readDraft,
  readDraftById,
  writeDraft,
  writeDraftById,
  type TripSnapshot,
} from "../../utils/tripStorage";
import { usePlannerState, usePlannerUiState } from "./usePlannerState";
import { useTripPersistence } from "./useTripPersistence";
import AccountActions from "../auth/AccountActions";
import { saveWithFallback } from "../../utils/tripPersistence";

function nightsFrom(value: string) {
  const n = parseInt(value);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 14) : 4;
}

const informationReferenceDate = "2026년 7월 22일";

function recommendationReason(stop: GeneratedStop, interest: string, food: string) {
  if (stop.userAdded) return "직접 추가한 장소";
  if (stop.nearbyTrip) return "근교 여행 선호 반영";
  if (interest.includes("문화") && (stop.category === "culture" || stop.tags.some((tag) => tag.includes("역사") || tag.includes("예술"))))
    return "문화 취향 반영";
  if (interest.includes("자연") && stop.category === "nature") return "자연 취향 반영";
  if (interest.includes("쇼핑") && (stop.category === "shopping" || stop.category === "market")) return "쇼핑 취향 반영";
  if ((interest.includes("미식") || food.includes("맛집") || food.includes("미식")) && (stop.category === "food" || stop.category === "market"))
    return "음식 취향 반영";
  if (stop.recommendedTime === "evening" || stop.tags.some((tag) => ["야경", "노을", "전망", "일몰"].some((word) => tag.includes(word))))
    return "추천 시간대 반영";
  if ((stop.distanceFromPrevious ?? 99) <= 2) return "이동 동선 최소화";
  if (stop.isCoreLandmark) return "도시 핵심 명소";
  return `${stop.tags[0] || "여행"} 관심사 반영`;
}

const categoryNames: Record<Place["category"], string> = {
  landmark: "명소",
  culture: "문화",
  food: "미식",
  nature: "자연",
  shopping: "쇼핑",
  market: "시장",
};

export default function PlannerApp() {
  const {
    destination, setDestination, origin, setOrigin, start, setStart, end, setEnd,
    people, setPeople, budget, setBudget, tempo, setTempo, interest, setInterest,
    food, setFood, stay, setStay, wish, setWish, pace, setPace, hydrate,
  } = usePlannerState();

  const {
    status, setStatus, loadingStep, setLoadingStep, plan, setPlan, generationError,
    setGenerationError, activeDay, setActiveDay, activeStop, setActiveStop, mobileTab,
    setMobileTab, addOpen, setAddOpen, placeQuery, setPlaceQuery, editNotice, setEditNotice,
    historyDepth, setHistoryDepth, editingStop, setEditingStop, openStopMenu, setOpenStopMenu,
    savedTripId, setSavedTripId, saveStatus, setSaveStatus, shareUrl, setShareUrl, source, setSource,
  } = usePlannerUiState();

  const { authReady, isRemote, ensureId, save, find } = useTripPersistence();
  const historyRef = useRef<GeneratedDay[][]>([]);
  const dragRef = useRef<{ day: number; placeId: string } | null>(null);
  const addedIdRef = useRef(0);
  const initializedRef = useRef(false);
  const draftIdRef = useRef<string | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [weatherResult, setWeatherResult] = useState<WeatherDataResponse | null>(null);
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [smartReplaceStopId, setSmartReplaceStopId] = useState<string | null>(null);

  const nights = nightsFrom(end);
  const current = plan[activeDay] || plan[0];
  const currentStops = current?.stops || [];

  const snapshotFor = useCallback(
    (id: string): TripSnapshot => ({
      schemaVersion: 2,
      id,
      title: `${destination} 여행`,
      destination,
      origin,
      start,
      end,
      people,
      budget,
      tempo,
      interest,
      food,
      stay,
      pace,
      plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [destination, origin, start, end, people, budget, tempo, interest, food, stay, pace, plan]
  );

  const getPlaceDetailUrl = (stopPlaceId: string, stopIdx: number) => {
    const currentDraftId = savedTripId || draftIdRef.current || (draftIdRef.current = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    const snapshot = snapshotFor(currentDraftId);
    writeDraftById(currentDraftId, snapshot, activeDay, stopIdx);

    const params = new URLSearchParams();
    params.set("id", stopPlaceId);
    params.set("draft", currentDraftId);
    params.set("day", String(activeDay + 1));
    params.set("stop", String(stopIdx));
    params.set("dest", destination);
    if (savedTripId) params.set("saved", savedTripId);
    return `/place?${params.toString()}`;
  };

  useEffect(() => {
    if (!authReady || initializedRef.current) return;
    initializedRef.current = true;
    let active = true;
    const timer = window.setTimeout(async () => {
      const q = new URLSearchParams(location.search);
      const shared = q.get("share");
      const saved = q.get("saved");
      const draftParam = q.get("draft") || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("eyria:active-draft-id") : null);
      const dayParam = q.get("day");
      const stopParam = q.get("stop");
      const replaceParam = q.get("replace");

      const isExistingTrip = Boolean(shared || saved || draftParam);
      setSource(shared ? "shared" : saved ? "saved" : draftParam ? "draft" : "new");

      const snapshot: (TripSnapshot & { activeDay?: number; activeStop?: number }) | null = shared
        ? await decodeSharedTrip(shared)
        : saved
        ? await find(saved)
        : draftParam
        ? readDraftById(draftParam)
        : null;

      if (!active) return;

      if (snapshot && isExistingTrip && snapshot.plan && snapshot.plan.length > 0) {
        if (draftParam) draftIdRef.current = draftParam;
        setSavedTripId(saved ? snapshot.id : null);
        hydrate({
          destination: snapshot.destination,
          origin: snapshot.origin,
          start: snapshot.start,
          end: snapshot.end,
          people: snapshot.people,
          budget: snapshot.budget,
          tempo: snapshot.tempo,
          interest: snapshot.interest,
          food: snapshot.food,
          stay: snapshot.stay,
          wish: "",
          pace: snapshot.pace,
        });
        setPlan(snapshot.plan);
        setStatus("complete");
        setMobileTab("schedule");

        const targetDay = dayParam ? Math.max(0, Number(dayParam) - 1) : snapshot.activeDay ?? 0;
        const targetStop = stopParam ? Math.max(0, Number(stopParam)) : snapshot.activeStop ?? 0;
        const validDay = Math.min(targetDay, snapshot.plan.length - 1);
        setActiveDay(validDay);
        setActiveStop(targetStop);

        if (replaceParam && snapshot.plan[validDay]?.stops[targetStop]) {
          const targetStopObj = snapshot.plan[validDay].stops[targetStop];
          setSmartReplaceStopId(targetStopObj.id);
        }

        window.setTimeout(() => {
          const stopElems = document.querySelectorAll(".timelineList li");
          const targetElem = stopElems[targetStop];
          if (targetElem) {
            targetElem.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
        return;
      }

      const dest = q.get("destination"), s = q.get("style");
      hydrate({ destination: dest || "", origin: "", start: "", end: "", people: 0, budget: 0, wish: "", ...(s ? { interest: s } : {}) });
      setStatus("empty");
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [authReady, find, hydrate, setMobileTab, setPlan, setSavedTripId, setSource, setStatus]);

  useEffect(() => {
    if (status !== "complete" || !plan.length || source === "shared") return;
    let active = true;
    const timer = window.setTimeout(async () => {
      const id = ensureId(savedTripId);
      const snapshot = snapshotFor(id);
      writeDraft(snapshot);
      if (!isRemote) {
        if (active) setSaveStatus("saved");
        return;
      }
      setSaveStatus("saving");
      const result = await saveWithFallback(() => save(snapshot), snapshot, writeDraft);
      if (!active) return;
      if (result.saved) {
        setSavedTripId(id);
        setSaveStatus("saved");
      } else {
        setSaveStatus("idle");
        setEditNotice(`${result.error.message} 로컬 초안은 유지했습니다.`);
      }
    }, 650);
    return () => { active = false; window.clearTimeout(timer); };
  }, [status, plan, savedTripId, snapshotFor, setSaveStatus, setSavedTripId, setEditNotice, ensureId, isRemote, save, source]);

  const clonePlan = (value: GeneratedDay[]) => value.map((day) => ({ ...day, stops: day.stops.map((stop) => ({ ...stop, tags: [...stop.tags] })) }));
  const commitEdit = (next: GeneratedDay[], notice: string) => {
    const beforeIds = plan.flatMap((day) => day.stops.map((stop) => `${day.label}:${stop.placeId}`)).join("|");
    const afterIds = next.flatMap((day) => day.stops.map((stop) => `${day.label}:${stop.placeId}`)).join("|");
    if (beforeIds === afterIds) return false;
    historyRef.current = [...historyRef.current.slice(-19), clonePlan(plan)];
    setHistoryDepth(historyRef.current.length);
    setPlan(next);
    setEditNotice(notice);
    return true;
  };

  const undoEdit = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    setPlan(previous);
    setHistoryDepth(historyRef.current.length);
    setActiveDay((day) => Math.min(day, Math.max(0, previous.length - 1)));
    setActiveStop(0);
    setEditNotice("직전 편집을 실행 취소했습니다.");
  };

  const dayCostSummary = useMemo(() => (current ? calculateDayCostSummary(current.stops, people, destination) : null), [current, people, destination]);

  const executeSmartReplace = (stopIndex: number, newPlace: Place) => {
    const next = replaceSingleStop(plan, activeDay, stopIndex, newPlace, destination, pace);
    if (commitEdit(next, `${newPlace.name}(으)로 장소를 교체하고 동선과 경비를 재계산했습니다.`)) {
      setSmartReplaceStopId(null);
      setOpenStopMenu(null);
    }
  };

  const updateStop = (index: number, field: "name" | "time", value: string) =>
    setPlan((old) => old.map((d, di) => (di === activeDay ? { ...d, stops: d.stops.map((s, si) => (si === index ? { ...s, [field]: value } : s)) } : d)));

  const removeStop = (index: number) => {
    const next = plan.map((day, dayIndex) => (dayIndex === activeDay ? refreshDay({ ...day, stops: day.stops.filter((_, stopIndex) => stopIndex !== index) }, destination, pace) : day));
    if (commitEdit(next, "장소를 삭제하고 이동 시간을 다시 계산했습니다.")) setActiveStop(0);
  };

  const usedIds = new Set(plan.flatMap((day) => day.stops.map((stop) => stop.placeId)));
  const recommendations = placesByCity(destination).filter((place) => !usedIds.has(place.id)).slice(0, 3);

  const placeToStop = (place: Place, userAdded = false): GeneratedStop => ({
    id: `added-${place.id}-${++addedIdRef.current}`,
    placeId: place.id,
    name: place.name,
    time: "09:00",
    cost: place.estimatedCost,
    duration: `${place.recommendedDuration}분`,
    lat: place.latitude,
    lng: place.longitude,
    category: place.category,
    recommendedTime: place.recommendedTime,
    description: place.description,
    openingHours: place.openingHours,
    tags: place.tags,
    isCoreLandmark: place.isCoreLandmark,
    district: place.district,
    nearbyTrip: place.nearbyTrip,
    transportHints: place.transportHints,
    estimateStatus: place.estimateStatus,
    userAdded,
  });

  const addPlace = (place: Place, targetDay = activeDay, targetIndex?: number) => {
    if (usedIds.has(place.id)) {
      setEditNotice(`${place.name}은(는) 이미 일정에 포함되어 있습니다.`);
      return;
    }
    const isDayTrip = place.nearbyTrip;
    const eligibleDays = plan.map((day, index) => ({ day, index })).filter((item) => !item.day.stops.some((stop) => stop.userAdded));
    const resolvedDay = isDayTrip && targetIndex === undefined ? (eligibleDays.length ? eligibleDays.reduce((best, item) => (item.day.stops.length < best.day.stops.length ? item : best)).index : targetDay) : targetDay;
    let removedForDayTrip = 0;
    const next = plan.map((day, dayIndex) => {
      if (dayIndex !== resolvedDay) return day;
      let stops = [...day.stops];
      if (isDayTrip) {
        const protectedStops = stops.filter((stop) => stop.userAdded && stop.nearbyTrip && stop.district === place.district);
        removedForDayTrip = stops.length - protectedStops.length;
        stops = [placeToStop(place, true), ...protectedStops];
      } else {
        const automaticIndex = place.recommendedTime === "morning" ? 0 : place.recommendedTime === "evening" ? stops.length : Math.ceil(stops.length / 2);
        stops.splice(targetIndex ?? automaticIndex, 0, placeToStop(place, true));
      }
      return refreshDay({ ...day, stops }, destination, pace);
    });
    const notice = isDayTrip ? `${place.name}을(를) ${next[resolvedDay].label}의 근교 하루 일정으로 배치했습니다.${removedForDayTrip ? ` 충돌하는 AI 장소 ${removedForDayTrip}곳은 추천 목록으로 이동했습니다.` : ""}` : `${place.name}을(를) 추가하고 동선을 다시 계산했습니다.`;
    if (commitEdit(next, notice)) {
      setActiveDay(resolvedDay);
      setActiveStop(0);
      setAddOpen(false);
      setPlaceQuery("");
    }
  };

  const moveStop = (fromDay: number, fromIndex: number, toDay: number, toIndex: number) => {
    if (!plan[fromDay] || !plan[toDay] || !plan[fromDay].stops[fromIndex]) return;
    const next = plan.map((day) => ({ ...day, stops: [...day.stops] }));
    const [moved] = next[fromDay].stops.splice(fromIndex, 1);
    let insertIndex = toIndex;
    if (fromDay === toDay && fromIndex < toIndex) insertIndex--;
    next[toDay].stops.splice(Math.max(0, Math.min(insertIndex, next[toDay].stops.length)), 0, moved);
    next[fromDay] = refreshDay(next[fromDay], destination, pace);
    if (toDay !== fromDay) next[toDay] = refreshDay(next[toDay], destination, pace);
    if (commitEdit(next, "장소 순서와 이동 시간, 지도 경로를 갱신했습니다.")) {
      setActiveDay(toDay);
      setActiveStop(0);
    }
  };

  const handleDrop = (event: DragEvent, dayIndex: number, stopIndex: number) => {
    event.preventDefault();
    const source = dragRef.current;
    const sourceIndex = source ? plan[source.day]?.stops.findIndex((stop) => stop.placeId === source.placeId) : -1;
    if (source && sourceIndex >= 0) moveStop(source.day, sourceIndex, dayIndex, stopIndex);
    dragRef.current = null;
  };

  const moveWithinDay = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= currentStops.length) return;
    const next = plan.map((day) => ({ ...day, stops: [...day.stops] }));
    const stops = next[activeDay].stops;
    const [moved] = stops.splice(index, 1);
    stops.splice(target, 0, moved);
    next[activeDay] = refreshDay(next[activeDay], destination, pace);
    if (commitEdit(next, "장소 순서와 이동 시간을 갱신했습니다.")) setActiveStop(target);
  };

  // Action chips for quick style refinement on itinerary timeline
  const quickRefinementActionChips = [
    { key: "food", label: "🍜 맛집 늘리기" },
    { key: "culture", label: "🏛️ 문화 일정 늘리기" },
    { key: "nature", label: "🌿 자연 일정 늘리기" },
    { key: "shopping", label: "🛍️ 쇼핑 일정 늘리기" },
  ] as const;

  const styleMatch = (place: { category: Place["category"]; tags: string[] }, key: (typeof quickRefinementActionChips)[number]["key"]) =>
    key === "food"
      ? place.category === "food" || place.category === "market"
      : key === "shopping"
      ? place.category === "shopping"
      : key === "nature"
      ? place.category === "nature"
      : place.category === "culture";

  const applyQuickStyle = (key: (typeof quickRefinementActionChips)[number]["key"], label: string) => {
    const used = new Set(plan.flatMap((day) => day.stops.map((stop) => stop.placeId)));
    const candidate = placesByCity(destination).find((place) => !used.has(place.id) && styleMatch(place, key));
    const activeStops = plan[activeDay]?.stops || [];
    const rankedVictims = activeStops.map((stop, index) => ({ index, score: stop.userAdded ? Number.POSITIVE_INFINITY : 50 })).filter((item) => Number.isFinite(item.score)).sort((a,b) => a.score - b.score);
    const replaceIndex = rankedVictims[0]?.index ?? -1;

    if (candidate) {
      const next = plan.map((day) => ({ ...day, stops: [...day.stops] }));
      if (replaceIndex >= 0) next[activeDay].stops.splice(replaceIndex, 1, placeToStop(candidate));
      else next[activeDay].stops.push(placeToStop(candidate));
      next[activeDay] = refreshDay(next[activeDay], destination, pace);
      if (commitEdit(next, `${label}에 맞춰 보완 장소를 반영했습니다.`)) setActiveStop(0);
      return;
    }
    setEditNotice(`${label.replace(/^\S+\s/, "")}에 추천할 인접 장소가 이미 일정에 모두 반영되어 있습니다.`);
  };

  const saveCurrentTrip = async () => {
    const fromShare = source === "shared";
    const id = fromShare ? crypto.randomUUID() : ensureId(savedTripId);
    const snapshot = snapshotFor(id);
    setSaveStatus("saving");
    const result = await saveWithFallback(() => save(snapshot), snapshot, writeDraft);
    if (result.saved) {
      setSource("saved");
      setSavedTripId(id);
      setSaveStatus("saved");
      setEditNotice("일정을 내 여행에 저장했습니다.");
    } else {
      setSaveStatus("idle");
      setEditNotice(`${result.error.message} 로컬 초안은 유지했습니다.`);
    }
  };

  const shareCurrentTrip = async () => {
    const url = `${location.origin}/planner?share=${await encodeSharedTrip(snapshotFor(savedTripId || "shared"))}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setEditNotice("공유 링크를 복사했습니다.");
    } catch {
      setEditNotice("공유 링크를 직접 복사해주세요.");
    }
  };

  const exportCalendar = () => {
    const pad = (value: number) => value.toString().padStart(2, "0");
    const format = (date: Date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
    const escape = (value: string) => value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\n", "\\n");
    const events = plan.flatMap((day, dayIndex) =>
      day.stops.map((stop) => {
        const date = new Date(`${start || "2026-08-01"}T00:00:00`);
        date.setDate(date.getDate() + dayIndex);
        const [hour, minute] = stop.time.split(":").map(Number);
        date.setHours(hour, minute, 0, 0);
        const finish = new Date(date.getTime() + (Number.parseInt(stop.duration) || 90) * 60000);
        return [
          "BEGIN:VEVENT",
          `UID:${stop.id}@eyria.local`,
          `DTSTAMP:${format(new Date())}`,
          `DTSTART:${format(date)}`,
          `DTEND:${format(finish)}`,
          `SUMMARY:${escape(stop.name)}`,
          `DESCRIPTION:${escape(`${stop.description} · ${stop.openingHours}`)}`,
          `LOCATION:${stop.lat},${stop.lng}`,
          "END:VEVENT",
        ].join("\r\n");
      })
    );
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EYRIA//Travel Planner//KO", `X-WR-CALNAME:${destination} 여행`, ...events, "END:VCALENDAR"].join("\r\n");
    downloadText(`EYRIA-${destination}-일정.ics`, ics, "text/calendar;charset=utf-8");
  };

  return (
    <main className="plannerWorkspace v2PureEditor">
      {/* 1. Header with Compact Summary Bar */}
      <header className="workspaceHeader v2Header">
        <BrandLogo />
        <div className="v2SummaryBar">
          <span className="destPill">{destination || "여행지"}</span>
          <span className="datePill">{start && end ? `${start} ~ ${end}` : "기간 미지정"}</span>
          <span className="peoplePill">{people > 0 ? `${people}명` : "-명"}</span>
          <span className="budgetPill">{budget > 0 ? `${budget}만원` : "-만원"}</span>
          <button type="button" onClick={() => setShowSettingsModal(true)} className="tweakSettingsBtn">
            ⚙ 설정 변경
          </button>
        </div>
        <div className="headerActionsGroup">
          <button type="button" onClick={saveCurrentTrip} className="saveTripBtn">
            {saveStatus === "saving" ? "저장 중..." : "일정 저장"}
          </button>
          <button type="button" onClick={shareCurrentTrip} className="shareBtn">
            공유
          </button>
          <AccountActions />
        </div>
      </header>

      {/* Settings Modal (Secondary Tweak Tray) */}
      {showSettingsModal && (
        <div className="settingsModalOverlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settingsModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>여행 조건 설정 변경</h3>
              <button type="button" onClick={() => setShowSettingsModal(false)}>×</button>
            </div>
            <div className="modalBody">
              <label>
                목적지
                <input value={destination} onChange={(e) => setDestination(e.target.value)} />
              </label>
              <div className="modalRow">
                <label>
                  시작일
                  <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                </label>
                <label>
                  종료일
                  <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                </label>
              </div>
              <div className="modalRow">
                <label>
                  인원 (명)
                  <input type="number" min="1" step="1" value={people || ""} onChange={(e) => setPeople(+e.target.value || 0)} />
                </label>
                <label>
                  예산 (만원)
                  <input type="number" min="1" step="1" value={budget || ""} onChange={(e) => setBudget(+e.target.value || 0)} />
                </label>
              </div>
            </div>
            <div className="modalFooter">
              <button type="button" onClick={() => setShowSettingsModal(false)} className="closeModalBtn">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation Tabs */}
      <nav className="mobilePlannerNav">
        <button className={mobileTab === "schedule" ? "active" : ""} onClick={() => setMobileTab("schedule")}>
          일정
        </button>
        <button className={mobileTab === "map" ? "active" : ""} onClick={() => setMobileTab("map")}>
          지도
        </button>
      </nav>

      {/* Toast Notice */}
      {editNotice && (
        <div className="plannerToast">
          <i>✦</i>
          <span>{editNotice}</span>
        </div>
      )}

      {/* 2. Main Pure Itinerary Workspace */}
      <div className="workspaceBody v2FullEditorBody">
        <div className="timelineColumn">
          {/* DAY Tabs */}
          <div className="dayScroller">
            {plan.map((d, i) => (
              <button
                className={i === activeDay ? "active" : ""}
                onClick={() => {
                  setActiveDay(i);
                  setActiveStop(0);
                  setEditingStop(null);
                  setOpenStopMenu(null);
                }}
                key={d.label}
              >
                {d.label}
                <small>{d.date}</small>
              </button>
            ))}
          </div>

          {/* DAY Intro & Add Place */}
          <div className="dayIntro">
            <div>
              <h3>{current?.theme || `${activeDay + 1}일차 일정`}</h3>
              <p>{currentStops.length}개 장소 · 손잡이를 끌어 순서를 바꿔보세요</p>
            </div>
            <button onClick={() => setAddOpen((open) => !open)}>＋ 장소 검색</button>
          </div>

          {/* 1-Tap Style Refinement Action Chips */}
          <div className="hifiActionChipsBar">
            <span className="chipsBarLabel">일정 취향 보완:</span>
            {quickRefinementActionChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => applyQuickStyle(chip.key, chip.label)}
                className="refinementChipBtn"
              >
                {chip.label}
              </button>
            ))}
            <button type="button" className="undoButton" disabled={!historyDepth} onClick={undoEdit}>
              ↶ 실행 취소{historyDepth > 1 ? ` (${historyDepth})` : ""}
            </button>
          </div>

          {/* Add Place Drawer */}
          {addOpen && (
            <div className="placeFinder">
              <input
                autoFocus
                value={placeQuery}
                onChange={(event) => setPlaceQuery(event.target.value)}
                placeholder={`${destination}의 장소 또는 태그 검색`}
              />
              <div>
                {recommendations.map((place) => (
                  <button key={place.id} onClick={() => addPlace(place)}>
                    <strong>{place.name}</strong>
                    <span>{place.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Stop Card List */}
          <ol className="timelineList">
            {currentStops.map((stop, i) => {
              const validation = validateStopOpening(stop, current?.date || "", currentStops, i, destination);
              const candidates =
                smartReplaceStopId === stop.id
                  ? findSmartCandidates(stop, plan, destination, { destination, start, days: nights + 1, style: interest, foodPreference: food, pace, wishList: wish, weatherData: weatherResult }, weatherResult?.daily?.[activeDay], activeDay, i)
                  : [];

              return (
                <li
                  className={`${i === activeStop ? "active" : ""} ${editingStop === stop.id ? "editing" : ""}`}
                  onClick={() => setActiveStop(i)}
                  onMouseEnter={() => setActiveStop(i)}
                  key={stop.id}
                >
                  <span
                    className="dragHandle"
                    draggable
                    onDragStart={() => { dragRef.current = { day: activeDay, placeId: stop.placeId }; }}
                    onDragEnd={() => { dragRef.current = null; }}
                    aria-label={`${stop.name} 순서 이동`}
                  >
                    ⠿
                  </span>

                  <div className="stopTimeCard">
                    {editingStop === stop.id ? (
                      <input className="stopTime" value={stop.time} onChange={(e) => updateStop(i, "time", e.target.value)} />
                    ) : (
                      <strong>{stop.time}</strong>
                    )}
                    <small>{stop.recommendedTime === "morning" ? "오전" : stop.recommendedTime === "evening" ? "저녁" : "오후"}</small>
                  </div>

                  <i>{i + 1}</i>

                  <div className="stopCardBody">
                    {editingStop === stop.id ? (
                      <input className="stopName stopEditInput" value={stop.name} onChange={(e) => updateStop(i, "name", e.target.value)} />
                    ) : (
                      <div className="stopTitleRow">
                        <Link href={getPlaceDetailUrl(stop.placeId, i)} onClick={() => getPlaceDetailUrl(stop.placeId, i)}>
                          <strong>{stop.name}</strong>
                        </Link>
                        <span>{categoryNames[stop.category]}</span>
                      </div>
                    )}

                    <p className="stopMeta">
                      {stop.transportFromPrevious && `${stop.transportFromPrevious} ${stop.travelMinutes}분 · `}
                      {stop.duration} · 약 {stop.costBreakdown ? formatCurrency(stop.costBreakdown.localTotalPerPerson, stop.costBreakdown.localCurrency) : `${stop.cost.toLocaleString()}원`}
                    </p>

                    <em className="recommendationReason">✦ {recommendationReason(stop, interest, food)}</em>

                    {!validation.isValid && (
                      <div className="openingHoursNotice">
                        <div className="noticeTitle">정적 운영시간 검증: {validation.message}</div>
                        <div className="proposalActionGroup">
                          {validation.proposals.map((prop, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              className="proposalBtn"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (prop.type === "time_adjust") {
                                  updateStop(i, "time", prop.newTime);
                                  setEditNotice(`${prop.newTime}로 시간을 조정했습니다.`);
                                } else if (prop.type === "reorder") {
                                  moveWithinDay(i, prop.targetIndex > i ? 1 : -1);
                                } else if (prop.type === "smart_replace") {
                                  setSmartReplaceStopId(smartReplaceStopId === stop.id ? null : stop.id);
                                }
                              }}
                            >
                              {prop.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {smartReplaceStopId === stop.id && (
                      <div className="smartReplaceTray" onClick={(e) => e.stopPropagation()}>
                        <div className="smartReplaceHeader">
                          <strong>✦ {stop.name} 대체 추천 장소</strong>
                          <button type="button" onClick={() => setSmartReplaceStopId(null)}>×</button>
                        </div>
                        <div className="smartCandidateList">
                          {candidates.map((cand) => (
                            <div key={cand.place.id} className="smartCandidateCard">
                              <div>
                                <strong>{cand.place.name}</strong>
                                <small>{cand.matchReason} · {cand.place.district}</small>
                              </div>
                              <button type="button" onClick={() => executeSmartReplace(i, cand.place)}>이 장소로 교체</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="stopMenuWrap">
                    <button
                      type="button"
                      className="stopMenuButton"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenStopMenu(openStopMenu === stop.id ? null : stop.id);
                      }}
                    >
                      •••
                    </button>
                    {openStopMenu === stop.id && (
                      <div className="stopActionMenu" onClick={(event) => event.stopPropagation()}>
                        <button type="button" onClick={() => { setSmartReplaceStopId(stop.id); setOpenStopMenu(null); }}>
                          ✦ 다른 장소 추천 (Smart Replace)
                        </button>
                        <button type="button" onClick={() => { setEditingStop(stop.id); setOpenStopMenu(null); }}>
                          ✎ 장소 편집
                        </button>
                        <button type="button" className="danger" onClick={() => { removeStop(i); setOpenStopMenu(null); }}>
                          × 일정에서 삭제
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* 3. Interactive Map Column */}
        <div className="plannerMapColumn">
          <PlannerMap stops={currentStops} allDays={plan} activeDay={activeDay} activeIndex={activeStop} onSelect={setActiveStop} />
        </div>
      </div>
    </main>
  );
}
