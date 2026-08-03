"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Header from "../layout/Header";
import { readDraftById } from "../../utils/tripStorage";
import BookingMap from "./BookingMap";
import type { HotelOffer, HotelLocation, CityBudgetEstimate, TravelStyle } from "../../types/hotel";
import type { FlightOffer, TravelBudgetSummary } from "../../types/flight";
import type { BookingSnapshot } from "../../types/booking";
import { BOOKING_SNAPSHOT_KEY, createBookingSnapshot, readBookingSnapshot } from "../../utils/bookingSnapshot";
import { isSelectableRoundTrip, selectFlightSeller } from "../../utils/flightSelection";
import { getHotelBookingLinkLabel } from "../../utils/bookingLinks";
import {
  calculateTravelBudgetSummary,
  calculatePackageCombos,
  calculateBudgetAlternatives,
  type PackageCombo,
  type OverBudgetAlternative,
} from "../../utils/packageBudgetEngine";
import { cityByName } from "../../data/cities";
import { getCityAirportIata, isSupportedAirport } from "../../data/airports";

const DESTINATION_ERROR = "여행 목적지 정보가 없습니다. 일정 페이지에서 목적지를 다시 선택해주세요.";

export function flightStatusMessage(status: string): string {
  if (status === "INVALID_INPUT") return "항공편 검색 조건을 확인해주세요.";
  if (status === "RATE_LIMITED") return "항공편 조회 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  if (status === "TIMEOUT") return "항공편 조회가 지연되고 있습니다. 잠시 후 다시 시도해주세요.";
  if (status === "AUTH_FAILED" || status === "PROVIDER_ERROR" || status === "UNAVAILABLE") return "현재 항공편 정보를 불러올 수 없습니다.";
  if (status === "NO_FLIGHTS_FOUND") return "현재 조건에서 검색 가능한 항공편이 없습니다.";
  return "항공편 조회 중 오류가 발생했습니다.";
}

export function hotelStatusMessage(status: string): string {
  if (status === "NO_HOTELS_FOUND") return "현재 조건에서 검색 가능한 숙소가 없습니다.";
  if (status === "TIMEOUT") return "숙소 조회가 지연되고 있습니다. 잠시 후 다시 시도해주세요.";
  if (status === "RATE_LIMITED") return "숙소 조회 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  if (status === "AUTH_FAILED" || status === "PROVIDER_ERROR" || status === "UNAVAILABLE") return "현재 숙소 정보를 불러올 수 없습니다.";
  if (status === "INVALID_INPUT") return "숙소 검색 조건을 확인해주세요.";
  return "숙소 조회 중 오류가 발생했습니다.";
}

function EyriaHotelImagePlaceholder() {
  return (
    <div className="eyriaDefaultImageContainer">
      <div className="eyriaDefaultImageContent">
        <span className="eyriaPlaceholderTitle">Eyria 기본 숙소 이미지</span>
        <span className="eyriaPlaceholderSub">대표 사진 미제공</span>
      </div>
    </div>
  );
}

function HotelCardImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return <EyriaHotelImagePlaceholder />;
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className="hotelPhotoImg"
      onError={() => setHasError(true)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}

export default function BookingApp() {
  const [destination, setDestination] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  const [nights, setNights] = useState(0);
  const [travelers, setTravelers] = useState(0);
  const [totalUserBudget, setTotalUserBudget] = useState(0);
  const [budgetLabel, setBudgetLabel] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [contextReady, setContextReady] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const restoredBookingRef = useRef<BookingSnapshot | null>(null);

  const [travelStyle, setTravelStyle] = useState<TravelStyle>("standard");
  const [transitMode, setTransitMode] = useState<"transit" | "walk" | "drive">("transit");
  const [itineraryPlacesList, setItineraryPlacesList] = useState<Array<{ name: string; lat: number; lng: number; day?: number }>>([]);

  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [lodgingBudgetThreshold, setLodgingBudgetThreshold] = useState<number>(0);
  const [flightBudgetThreshold, setFlightBudgetThreshold] = useState<number>(0);

  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [budgetMatchedHotels, setBudgetMatchedHotels] = useState<HotelOffer[]>([]);
  const [budgetExceededHotels, setBudgetExceededHotels] = useState<HotelOffer[]>([]);
  const [osmLocations, setOsmLocations] = useState<HotelLocation[]>([]);
  const [budgetEstimate, setBudgetEstimate] = useState<CityBudgetEstimate | null>(null);
  const [hotelsLoading, setHotelsLoading] = useState<boolean>(false);
  const [hotelsError, setHotelsError] = useState<string | null>(null);
  const [hotelsStatus, setHotelsStatus] = useState<string | null>(null);
  const [hotelRetryKey, setHotelRetryKey] = useState(0);
  const [hotelRetryAt, setHotelRetryAt] = useState<number | null>(null);
  const [hotelRetrySeconds, setHotelRetrySeconds] = useState(0);

  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [budgetMatchedFlights, setBudgetMatchedFlights] = useState<FlightOffer[]>([]);
  const [budgetExceededFlights, setBudgetExceededFlights] = useState<FlightOffer[]>([]);
  const [flightsLoading, setFlightsLoading] = useState<boolean>(false);
  const [flightsError, setFlightsError] = useState<string | null>(null);
  const [flightsStatus, setFlightsStatus] = useState<string | null>(null);
  const [flightRetryKey, setFlightRetryKey] = useState(0);

  const [requeryStatus, setRequeryStatus] = useState<string | null>(null);
  const [requeryMessage, setRequeryMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hotelRetryAt === null) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((hotelRetryAt - Date.now()) / 1000));
      setHotelRetrySeconds(remaining);
      if (remaining === 0) {
        setHotelRetryAt(null);
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [hotelRetryAt]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
    if (cancelled) return;
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const destParam = q.get("dest");
    const draftParam = q.get("draft");
    const savedParam = q.get("saved");
    const daysParam = q.get("days");

    let targetDest = destParam || "";
    let targetNights = 0;
    let targetPeople = 0;
    let targetBudget = "";
    let targetNumBudget = 0;
    let targetCheckIn = "";
    let targetCheckOut = "";
    const extractedPlaces: Array<{ name: string; lat: number; lng: number; day?: number }> = [];

    if (draftParam) {
      const snap = readDraftById(draftParam);
      if (snap && snap.destination) {
        targetDest = snap.destination;
        if (snap.plan && snap.plan.length > 0) {
          targetNights = Math.max(1, snap.plan.length - 1);
          snap.plan.forEach((dayObj, dIdx) => {
            if (Array.isArray(dayObj.stops)) {
              dayObj.stops.forEach((item) => {
                if (item.lat && item.lng) {
                  extractedPlaces.push({ name: item.name, lat: item.lat, lng: item.lng, day: dIdx + 1 });
                }
              });
            }
          });
        }
        if (snap.people) targetPeople = snap.people;
        targetCheckIn = snap.start || "";
        targetCheckOut = snap.end || "";
        if (snap.budget) {
          targetBudget = `${snap.budget}만원`;
          const numBudget = parseInt(String(snap.budget), 10);
          if (!isNaN(numBudget) && numBudget > 0) {
            targetNumBudget = numBudget * 10000;
            setLodgingBudgetThreshold(targetNumBudget * 0.4);
            setFlightBudgetThreshold(targetNumBudget * 0.4);
          }
        }
      }
    }

    if (daysParam && targetDest) {
      const parsedDays = parseInt(daysParam, 10);
      if (!isNaN(parsedDays) && parsedDays > 0) {
        targetNights = Math.max(1, parsedDays - 1);
      }
    }

    const city = cityByName[targetDest] || cityByName[targetDest.toLowerCase()];
    const targetArrivalAirport = getCityAirportIata(targetDest);
    const hasValidContext = Boolean(
      draftParam && targetDest && city && Number.isFinite(city.lat) && Number.isFinite(city.lon) &&
      targetArrivalAirport && isSupportedAirport(targetArrivalAirport) && isSupportedAirport("ICN") &&
      targetCheckIn && targetCheckOut && targetPeople >= 1 && targetNumBudget > 0 &&
      (!destParam || destParam === targetDest)
    );
    if (!hasValidContext) {
      setContextError(DESTINATION_ERROR);
      setContextReady(false);
      setHotelsLoading(false);
      setFlightsLoading(false);
      return;
    }

    setDestination(targetDest);
    setArrivalAirport(targetArrivalAirport || "");
    setNights(targetNights);
    setTravelers(targetPeople);
    setTotalUserBudget(targetNumBudget);
    setBudgetLabel(targetBudget);
    setDraftId(draftParam);
    setSavedId(savedParam);
    setItineraryPlacesList(extractedPlaces);

    setCheckIn(targetCheckIn);
    setCheckOut(targetCheckOut);
    const storedBooking = readBookingSnapshot(sessionStorage, draftParam || undefined);
    if (
      storedBooking && storedBooking.destinationId === targetDest &&
      storedBooking.checkIn === targetCheckIn && storedBooking.checkOut === targetCheckOut &&
      storedBooking.passengerCount === targetPeople
    ) {
      restoredBookingRef.current = storedBooking;
      setBudgetMatchedHotels([storedBooking.selectedHotel]);
      setBudgetMatchedFlights([storedBooking.selectedFlight]);
      setSelectedHotelId(storedBooking.selectedHotel.providerHotelId);
      setSelectedFlightId(storedBooking.selectedFlight.providerOfferId);
    }
    setContextError(null);
    setContextReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch LiteAPI Hotels
  useEffect(() => {
    if (!contextReady || !destination) return;

    const controller = new AbortController();

    queueMicrotask(() => {
      setHotelsLoading(true);
      setHotelsError(null);
      setHotelsStatus(null);
    });

    const payload = {
      city: destination,
      checkIn,
      checkOut,
      adults: travelers,
      rooms: 1,
      currency: "KRW",
      lodgingBudget: lodgingBudgetThreshold,
      travelStyle,
      itineraryPlaces: itineraryPlacesList,
      transitMode
    };

    fetch("/api/booking/hotels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(async (res) => ({ httpStatus: res.status, data: await res.json() }))
      .then(({ data }) => {
        setHotelsLoading(false);
        if (data.success) {
          setHotelRetryAt(null);
          setHotelRetrySeconds(0);
          const matchedHotels: HotelOffer[] = data.budgetMatchedHotels || [];
          const restoredHotel = restoredBookingRef.current?.selectedHotel;
          const mergedMatchedHotels = restoredHotel && !matchedHotels.some((hotel) => hotel.providerHotelId === restoredHotel.providerHotelId)
            ? [restoredHotel, ...matchedHotels]
            : matchedHotels;
          setBudgetMatchedHotels(mergedMatchedHotels);
          setBudgetExceededHotels(data.budgetExceededHotels || []);
          setOsmLocations(data.osmLocations || []);

          const allHotels = [...mergedMatchedHotels, ...(data.budgetExceededHotels || [])];
          if (allHotels.length > 0) {
            setSelectedHotelId((current) => allHotels.some((hotel) => hotel.providerHotelId === current) ? current : allHotels[0].providerHotelId);
            setHotelsError(null);
            setHotelsStatus(null);
          } else {
            const status = data.priceApiStatus || "NO_HOTELS_FOUND";
            setHotelsStatus(status);
            setHotelsError(hotelStatusMessage(status));
          }
          if (data.budgetEstimate) setBudgetEstimate(data.budgetEstimate);
        } else {
          setBudgetMatchedHotels([]);
          setBudgetExceededHotels([]);
          const status = data.providerStatus || data.priceApiStatus || "INTERNAL_ERROR";
          setHotelsStatus(status);
          setHotelsError(hotelStatusMessage(status));
          if (status === "RATE_LIMITED" && data.retryAt) {
            const retryAt = Date.parse(data.retryAt);
            if (Number.isFinite(retryAt)) {
              setHotelRetryAt(retryAt);
              setHotelRetrySeconds(Math.max(1, data.retryAfterSeconds ?? Math.ceil((retryAt - Date.now()) / 1000)));
            }
          }
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHotelsLoading(false);
        setBudgetMatchedHotels([]);
        setBudgetExceededHotels([]);
        setHotelsStatus("PROVIDER_ERROR");
        setHotelsError(hotelStatusMessage("PROVIDER_ERROR"));
      });
    return () => controller.abort();
  }, [contextReady, destination, checkIn, checkOut, travelers, lodgingBudgetThreshold, travelStyle, itineraryPlacesList, transitMode, hotelRetryKey]);

  // Fetch SerpAPI Google Flights
  useEffect(() => {
    if (!contextReady || !destination || !arrivalAirport) return;

    const controller = new AbortController();

    queueMicrotask(() => {
      setFlightsLoading(true);
      setFlightsError(null);
      setFlightsStatus(null);
    });

    const url = `/api/booking/flights?city=${encodeURIComponent(destination)}&departureAirport=ICN&arrivalAirport=${encodeURIComponent(arrivalAirport)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&adults=${travelers}&flightBudget=${flightBudgetThreshold}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => ({ httpStatus: res.status, data: await res.json() }))
      .then(({ data }) => {
        setFlightsLoading(false);
        if (data.success) {
          const liveMatched = (data.budgetMatchedOffers || []).filter(isSelectableRoundTrip);
          const restoredFlight = restoredBookingRef.current?.selectedFlight;
          const matched = restoredFlight && isSelectableRoundTrip(restoredFlight) && !liveMatched.some((flight: FlightOffer) => flight.providerOfferId === restoredFlight.providerOfferId)
            ? [restoredFlight, ...liveMatched]
            : liveMatched;
          const exceeded = (data.budgetExceededOffers || []).filter(isSelectableRoundTrip);
          setBudgetMatchedFlights(matched);
          setBudgetExceededFlights(exceeded);

          const allFlights = [...matched, ...exceeded];
          if (allFlights.length > 0) {
            setSelectedFlightId((current) => allFlights.some((flight) => flight.providerOfferId === current) ? current : allFlights[0].providerOfferId);
            setFlightsError(null);
            setFlightsStatus(null);
          } else {
            const status = data.flightApiStatus || "NO_FLIGHTS_FOUND";
            setFlightsStatus(status);
            setFlightsError(flightStatusMessage(status));
          }
        } else {
          setBudgetMatchedFlights([]);
          setBudgetExceededFlights([]);
          const status = data.providerStatus || data.flightApiStatus || "INTERNAL_ERROR";
          setFlightsStatus(status);
          setFlightsError(flightStatusMessage(status));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFlightsLoading(false);
        setBudgetMatchedFlights([]);
        setBudgetExceededFlights([]);
        setFlightsStatus("PROVIDER_ERROR");
        setFlightsError(flightStatusMessage("PROVIDER_ERROR"));
      });
    return () => controller.abort();
  }, [contextReady, destination, arrivalAirport, checkIn, checkOut, travelers, flightBudgetThreshold, flightRetryKey]);

  const handleSelectFlight = (offerId: string) => {
    restoredBookingRef.current = null;
    setSelectedFlightId(offerId);
    setRequeryStatus(null);
    setRequeryMessage(null);

    fetch(`/api/booking/flights?offerId=${encodeURIComponent(offerId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRequeryStatus("VALID");
          setRequeryMessage("최신 항공편 요금 및 좌석 상태가 확인되었습니다.");
        } else {
          setRequeryStatus("EXPIRED");
          setRequeryMessage("가격이 변경되었거나 항공편을 다시 조회해야 합니다.");
        }
      })
      .catch(() => {
        setRequeryStatus("EXPIRED");
        setRequeryMessage("가격이 변경되었거나 항공편을 다시 조회해야 합니다.");
      });
  };

  const allHotelsList = useMemo(() => [...budgetMatchedHotels, ...budgetExceededHotels], [budgetMatchedHotels, budgetExceededHotels]);
  const allFlightsList = useMemo(() => [...budgetMatchedFlights, ...budgetExceededFlights], [budgetMatchedFlights, budgetExceededFlights]);

  const activeOffer = allHotelsList.find((h) => h.providerHotelId === selectedHotelId) || null;
  const activeFlight = allFlightsList.find((f) => f.providerOfferId === selectedFlightId) || null;

  // Selected package ID for comparisonMode: "current_selection"
  const currentSelectedPackageId = useMemo(() => {
    if (activeFlight && activeOffer) {
      return `pkg_${activeFlight.providerOfferId}_${activeOffer.providerHotelId}`;
    }
    return null;
  }, [activeFlight, activeOffer]);

  const budgetSummary: TravelBudgetSummary = useMemo(() => {
    return calculateTravelBudgetSummary(
      totalUserBudget,
      travelers,
      activeFlight,
      activeOffer,
      nights
    );
  }, [totalUserBudget, travelers, activeFlight, activeOffer, nights]);

  const packageCombos: PackageCombo[] = useMemo(() => {
    return calculatePackageCombos(allFlightsList, allHotelsList, totalUserBudget, travelers, nights, currentSelectedPackageId);
  }, [allFlightsList, allHotelsList, totalUserBudget, travelers, nights, currentSelectedPackageId]);

  const overBudgetAlternatives: OverBudgetAlternative[] = useMemo(() => {
    if (budgetSummary.budgetStatus === "over_budget") {
      return calculateBudgetAlternatives(activeFlight, activeOffer, allFlightsList, allHotelsList, totalUserBudget, travelers, nights);
    }
    return [];
  }, [budgetSummary.budgetStatus, activeFlight, activeOffer, allFlightsList, allHotelsList, totalUserBudget, travelers, nights]);

  useEffect(() => {
    if (typeof window === "undefined" || !contextReady || hotelsLoading || flightsLoading) return;
    sessionStorage.removeItem("eyria:selected-flight");
    sessionStorage.removeItem("eyria:selected-hotel");
    sessionStorage.removeItem("eyria:budget-summary");
    if (!draftId || !activeFlight || !activeOffer || !currentSelectedPackageId) {
      sessionStorage.removeItem(BOOKING_SNAPSHOT_KEY);
      return;
    }
    const previous = readBookingSnapshot(sessionStorage, draftId);
    const snapshot = createBookingSnapshot({
      draftId,
      destinationId: destination,
      checkIn,
      checkOut,
      passengerCount: travelers,
      selectedFlight: activeFlight,
      selectedHotel: activeOffer,
      budgetSummary,
      packageId: currentSelectedPackageId,
      previousCreatedAt: previous?.createdAt,
    });
    if (snapshot) sessionStorage.setItem(BOOKING_SNAPSHOT_KEY, JSON.stringify(snapshot));
    else sessionStorage.removeItem(BOOKING_SNAPSHOT_KEY);
  }, [contextReady, hotelsLoading, flightsLoading, draftId, destination, checkIn, checkOut, travelers, activeFlight, activeOffer, budgetSummary, currentSelectedPackageId]);

  const handleSelectSellerPrice = (flight: FlightOffer, option: NonNullable<FlightOffer["bookingOptions"]>[number]) => {
    restoredBookingRef.current = null;
    const updatedFlight = selectFlightSeller(flight, option);
    const replace = (offers: FlightOffer[]) => offers.map((item) =>
      item.providerOfferId === flight.providerOfferId ? updatedFlight : item
    );
    setBudgetMatchedFlights(replace);
    setBudgetExceededFlights(replace);
    setSelectedFlightId(updatedFlight.providerOfferId);
    setRequeryStatus("VALID");
    setRequeryMessage(`'${option.seller}' 판매처 가격(₩${option.price.toLocaleString()}원)으로 예산이 재계산되었습니다.`);
  };

  const totalNights = Math.max(1, nights);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (destination) params.set("dest", destination);
    if (draftId) params.set("draft", draftId);
    if (savedId) params.set("saved", savedId);
    return params.toString();
  };

  const plannerUrl = `/planner?${buildQueryParams()}`;
  const summaryUrl = `/summary?${buildQueryParams()}`;

  const renderHotelCard = (offer: HotelOffer, isOverBudget: boolean) => {
    const isSelected = offer.providerHotelId === selectedHotelId;
    const p = offer.price;
    const isTaxUnknown = p.taxStatus === "unknown" || p.payableTotal === null;
    const overAmount = isOverBudget && p.payableTotal !== null ? p.payableTotal - lodgingBudgetThreshold : 0;
    const nightlyAvg = p.payableTotal !== null ? Math.round(p.payableTotal / totalNights) : null;
    const topReasons = (offer.recommendationReasons || []).slice(0, 3);

    return (
      <article
        key={offer.providerHotelId}
        className={`hotelCard ${isSelected ? "selected" : ""}`}
        onClick={() => {
          restoredBookingRef.current = null;
          setSelectedHotelId(offer.providerHotelId);
        }}
      >
        <div className="hotelPhotoWrapper">
          <HotelCardImage key={offer.imageUrl || "placeholder"} imageUrl={offer.imageUrl} name={offer.hotelName} />
          {isSelected && <span className="selectedBadge">선택됨</span>}
          {isTaxUnknown ? (
            <span className="budgetTag" style={{ position: "absolute", top: "10px", right: "10px", background: "#6B7280", color: "#FFF", fontSize: "11px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px" }}>
              최종 금액 확인 필요
            </span>
          ) : isOverBudget ? (
            <span className="budgetTag budgetExceeded" style={{ position: "absolute", top: "10px", right: "10px", background: "#F59E0B", color: "#FFF", fontSize: "11px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px" }}>
              + ₩{overAmount.toLocaleString()}원 초과
            </span>
          ) : (
            <span className="budgetTag budgetMatched" style={{ position: "absolute", top: "10px", right: "10px", background: "#10B981", color: "#FFF", fontSize: "11px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px" }}>
              예산 부합
            </span>
          )}
        </div>

        <div className="hotelContent">
          <div className="hotelTitleRow">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h3 className="hotelName">{offer.hotelName}</h3>
                <span className="priceCategoryBadge" style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: "12px", fontWeight: 800, padding: "3px 8px", borderRadius: "6px" }}>
                  Trip Score: {offer.tripScore}점 ({offer.tripScoreGrade})
                </span>
              </div>
              <span className="hotelAddress">{offer.address || `${destination} 중심가 위치`}</span>
            </div>
          </div>

          {/* AI 추천 핵심 포인트 (최대 3개 제한) */}
          <div style={{ margin: "10px 0", background: "#F8FAFC", borderLeft: "4px solid #2563EB", padding: "10px 14px", borderRadius: "6px" }}>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "12.5px", color: "#334155", lineHeight: "1.6" }}>
              {topReasons.map((reason, rIdx) => (
                <li key={rIdx} style={{ fontWeight: 600 }}>• {reason}</li>
              ))}
            </ul>
          </div>

          {/* 세부 지표 분리 블록 */}
          <div style={{ background: "#F1F5F9", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", color: "#475569", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <span>📍 도심: {offer.distanceFromCenterKm}km</span>
            <span>📍 일정 평균: {offer.avgItineraryDistanceKm}km</span>
            <span>⏱️ 이동시간: 약 {offer.avgItineraryTimeMinutes}분</span>
          </div>

          <div className="hotelFooterRow" style={{ marginTop: "12px" }}>
            <div className="hotelPriceBlock" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <strong className="totalStayPrice" style={{ fontSize: "16px", color: "#0F172A" }}>
                예상 결제 총액: {p.payableTotal !== null ? `₩${p.payableTotal.toLocaleString()} ${p.currency}` : "확인 필요"}
              </strong>
              {nightlyAvg !== null && (
                <span style={{ fontSize: "12px", color: "#2563EB", fontWeight: 600 }}>
                  1박 평균: ₩{nightlyAvg.toLocaleString()}
                </span>
              )}
            </div>

            <div className="hotelActionBtns">
              {offer.bookingUrl && (
                <a
                  href={offer.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  {getHotelBookingLinkLabel(offer)}
                </a>
              )}
              <button
                type="button"
                className={`selectHotelBtn ${isSelected ? "selected" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  restoredBookingRef.current = null;
                  setSelectedHotelId(offer.providerHotelId);
                }}
              >
                {isSelected ? "숙소 선택됨" : "숙소 선택"}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderFlightCard = (flight: FlightOffer, isOverBudget: boolean) => {
    const isSelected = flight.providerOfferId === selectedFlightId;
    const party = flight.partyPrice;
    const outbound = flight.outbound;
    const inbound = flight.inbound;
    const overAmount = isOverBudget && flight.price.payableTotal !== null ? flight.price.payableTotal - flightBudgetThreshold : 0;
    const firstSeg = outbound.segments[0];
    const inboundSeg = inbound?.segments[0];
    const topReasons = (flight.recommendationReasons || []).slice(0, 3);
    const avgPerPerson = party.averagePerPassenger || (party.totalTripPrice ? Math.round(party.totalTripPrice / party.passengerCount) : null);

    return (
      <article
        key={flight.providerOfferId}
        className={`flightCard ${isSelected ? "selected" : ""}`}
        onClick={() => handleSelectFlight(flight.providerOfferId)}
        style={{ position: "relative" }}
      >
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ background: "#F1F5F9", color: "#0F172A", fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px" }}>
            Flight Score: {flight.flightScore}점
          </span>
          {isOverBudget ? (
            <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", border: "1px solid #FCD34D" }}>
              + ₩{overAmount.toLocaleString()}원 초과
            </span>
          ) : (
            <span style={{ background: "#D1FAE5", color: "#065F46", fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", border: "1px solid #6EE7B7" }}>
              항공 예산 부합
            </span>
          )}
          <span style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px" }}>
            Google Flights Live Search · SerpAPI
          </span>
        </div>

        <div className="flightMainInfo">
          <div className="airlineTag">
            {flight.airlineLogoUrl ? (
              <img src={flight.airlineLogoUrl} alt={flight.ownerAirlineName} style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "3px" }} />
            ) : (
              <span className="airlineCode">{flight.ownerAirlineCode}</span>
            )}
            <div>
              <strong style={{ fontSize: "15px", color: "#0F172A" }}>{flight.ownerAirlineName}</strong>
              {firstSeg && firstSeg.flightNumber && (
                <span style={{ fontSize: "12px", color: "#64748B", marginLeft: "6px" }}>
                  ({firstSeg.flightNumber})
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
            {/* Outbound Leg */}
            <div className="scheduleBlock" style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "8px" }}>
              <div className="timePoint">
                <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>
                  출국 {outbound.departureDateText} {firstSeg?.isOvernightFlight && !firstSeg?.arrivesNextDay ? <span style={{ color: "#7C3AED", fontWeight: 700 }}>(심야·새벽)</span> : ""}
                </span>
                <strong className="timeText">{outbound.departureTime}</strong>
                <span className="airportText">{outbound.originAirport}</span>
              </div>
              <div className="durationLine">
                <span className="durationBadge">{outbound.durationText}</span>
                <div className="lineGraphic" />
                <span className="directTag">{outbound.isDirect ? "직항" : `경유 ${outbound.stopsCount}회`}</span>
              </div>
              <div className="timePoint">
                <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>
                  도착 {outbound.arrivalDateText} {firstSeg?.arrivesNextDay ? <strong style={{ color: "#DC2626" }}>(+1일 도착)</strong> : ""}
                </span>
                <strong className="timeText">{outbound.arrivalTime}</strong>
                <span className="airportText">{outbound.destinationAirport}</span>
              </div>
            </div>

            {/* Inbound Leg */}
            {inbound && (
              <div className="scheduleBlock" style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "8px" }}>
                <div className="timePoint">
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>
                    귀국 {inbound.departureDateText} {inboundSeg?.isOvernightFlight && !inboundSeg?.arrivesNextDay ? <span style={{ color: "#7C3AED", fontWeight: 700 }}>(심야·새벽)</span> : ""}
                  </span>
                  <strong className="timeText">{inbound.departureTime}</strong>
                  <span className="airportText">{inbound.originAirport}</span>
                </div>
                <div className="durationLine">
                  <span className="durationBadge">{inbound.durationText}</span>
                  <div className="lineGraphic" />
                  <span className="directTag">{inbound.isDirect ? "직항" : `경유 ${inbound.stopsCount}회`}</span>
                </div>
                <div className="timePoint">
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>
                    도착 {inbound.arrivalDateText} {inboundSeg?.arrivesNextDay ? <strong style={{ color: "#DC2626" }}>(+1일 도착)</strong> : ""}
                  </span>
                  <strong className="timeText">{inbound.arrivalTime}</strong>
                  <span className="airportText">{inbound.destinationAirport}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI 추천 포인트 */}
        <div style={{ margin: "10px 0", background: "#F8FAFC", borderLeft: "4px solid #10B981", padding: "8px 12px", borderRadius: "6px" }}>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
            {topReasons.map((reason, rIdx) => (
              <li key={rIdx} style={{ fontWeight: 600 }}>• {reason}</li>
            ))}
          </ul>
        </div>

        <div className="flightSubMeta" style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "12px", color: "#475569" }}>
          {flight.amenities?.legroom && (
            <span className="baggageTag" style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "4px 8px", borderRadius: "4px", fontWeight: 700 }}>
              좌석 간격: {flight.amenities.legroom}
            </span>
          )}
          {flight.baggageDetails?.status === "explicit" ? (
            <span className="baggageTag" style={{ background: "#F1F5F9", padding: "4px 8px", borderRadius: "4px" }}>
              수하물: {flight.baggageDetails.outbound}
            </span>
          ) : (
            <span className="baggageTag" style={{ background: "#F1F5F9", padding: "4px 8px", borderRadius: "4px", color: "#64748B" }}>
              수하물 조건은 예약 옵션에서 확인
            </span>
          )}
        </div>

        {/* Seller Options Box */}
        {flight.bookingOptions && flight.bookingOptions.length > 0 && (
          <div style={{ marginTop: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A", display: "block", marginBottom: "8px" }}>
              🛒 판매처별 가격 및 예약 옵션 목록 ({flight.bookingOptions.length}개)
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {flight.bookingOptions.slice(0, 4).map((opt, optIdx) => (
                <div key={optIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "12px" }}>
                  <div>
                    <strong style={{ color: "#0F172A" }}>{opt.seller}</strong>
                    <span style={{ marginLeft: "8px", fontWeight: 800, color: "#2563EB" }}>₩{opt.price.toLocaleString()}원</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSellerPrice(flight, opt);
                      }}
                      style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", cursor: "pointer" }}
                    >
                      이 가격 선택
                    </button>
                    {opt.bookingRequestMethod === "get" && opt.url ? (
                      <a
                        href={opt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ background: "#2563EB", color: "#FFFFFF", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", textDecoration: "none" }}
                      >
                        예약 이동 ↗
                      </a>
                    ) : (
                      <button type="button" disabled title="판매처 이동 방식 확인 필요" style={{ fontSize: "11px", padding: "3px 8px" }}>
                        판매처 이동 방식 확인 필요
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flightPriceAction" style={{ marginTop: "12px" }}>
          <div className="flightPriceBox">
            <span className="pricePerPerson" style={{ fontSize: "12.5px", color: "#475569" }}>
              성인 {party.passengerCount}명 왕복 총액: <strong style={{ fontSize: "16px", color: "#0F172A" }}>₩{party.totalTripPrice.toLocaleString()} {party.currency}</strong>
              {avgPerPerson && (
                <span style={{ fontSize: "11.5px", color: "#2563EB", fontWeight: 700, marginLeft: "6px" }}>
                  (1인 평균 ₩{avgPerPerson.toLocaleString()}원)
                </span>
              )}
            </span>
            <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: "2px" }}>
              세금 및 수수료 구성은 예약 옵션에서 확인
            </span>
          </div>

          <div className="flightBtns" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {flight.bookingUrl && (
              <a
                href={flight.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  border: "1px solid #BFDBFE",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  textDecoration: "none"
                }}
              >
                외부 사이트에서 예약 옵션 보기 ↗
              </a>
            )}

            <button
              type="button"
              className={`selectFlightBtn ${isSelected ? "selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectFlight(flight.providerOfferId);
              }}
            >
              {isSelected ? "항공편 선택됨" : "항공편 선택"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: "10px", borderTop: "1px solid #F1F5F9", paddingTop: "6px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px", fontSize: "11px", color: "#64748B" }}>
          <span>Google Flights 검색 데이터 · SerpAPI 제공</span>
          <span>가격과 판매 조건은 외부 예약 단계에서 변경될 수 있습니다.</span>
        </div>

        {isSelected && requeryMessage && (
          <div style={{ marginTop: "10px", background: requeryStatus === "VALID" ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${requeryStatus === "VALID" ? "#A7F3D0" : "#FCA5A5"}`, padding: "8px 12px", borderRadius: "6px", fontSize: "12px", color: requeryStatus === "VALID" ? "#065F46" : "#991B1B", fontWeight: 700 }}>
            {requeryMessage}
          </div>
        )}
      </article>
    );
  };

  if (contextError) {
    return (
      <main className="bookingPageApp">
        <Header />
        <div className="hotelsStateBox emptyStateError" style={{ margin: "48px auto", maxWidth: "720px", padding: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#991B1B" }}>{contextError}</h2>
          <Link href="/planner" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", marginTop: "16px", fontWeight: 800 }}>
            일정 페이지로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bookingPageApp">
      <Header />

      <header className="bookingHeroHeader">
        <div className="bookingHeroContainer">
          <span className="bookingStepTag">STEP 03 • RESERVATION & LOCATION</span>
          <h1 className="bookingTitle">AI 여행 맞춤 숙소 & 항공권 결합 파이프라인</h1>
          <p className="bookingSubtitle">
            선호 여행 스타일과 전체 일정 동선, 예산 적합도를 종합 계산한 AI 랭킹 추천입니다.
          </p>
        </div>
      </header>

      <div className="bookingMainBody">
        <section className="tripInfoSummaryCard">
          <div className="tripInfoGrid">
            <div className="infoItem">
              <span className="infoLabel">여행지</span>
              <strong className="infoValue">{destination}</strong>
            </div>
            <div className="infoDivider" />
            <div className="infoItem">
              <span className="infoLabel">여행 기간</span>
              <strong className="infoValue">{totalNights}박 {totalNights + 1}일 ({checkIn} ~ {checkOut})</strong>
            </div>
            <div className="infoDivider" />
            <div className="infoItem">
              <span className="infoLabel">인원</span>
              <strong className="infoValue">성인 {travelers}명</strong>
            </div>
            <div className="infoDivider" />
            <div className="infoItem">
              <span className="infoLabel">선호 예산</span>
              <strong className="infoValue">{budgetLabel} (총 ₩{totalUserBudget.toLocaleString()}원)</strong>
            </div>
          </div>
        </section>

        {/* Travel Style Selector Bar */}
        <section className="bookingSectionBox" style={{ background: "#F8FAFC", padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>
                🎯 AI 여행 스타일 가중치 선택
              </span>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
                스타일에 따라 숙소/항공 가격, 동선/시간, 품질 가중치가 자동 조율됩니다.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={`criteriaBtn ${travelStyle === "budget" ? "active" : ""}`}
                onClick={() => setTravelStyle("budget")}
              >
                예산 중심형 (Budget)
              </button>
              <button
                type="button"
                className={`criteriaBtn ${travelStyle === "standard" ? "active" : ""}`}
                onClick={() => setTravelStyle("standard")}
              >
                동선/밸런스형 (Standard)
              </button>
              <button
                type="button"
                className={`criteriaBtn ${travelStyle === "premium" ? "active" : ""}`}
                onClick={() => setTravelStyle("premium")}
              >
                품질/입지 중심형 (Premium)
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 1: AI 여행 패키지 추천 조합 (PackageCombos) */}
        {packageCombos.length > 0 && (
          <section className="bookingSectionBox" style={{ background: budgetSummary.budgetStatus === "over_budget" ? "#FFFBEB" : "#F0FDF4", border: `1px solid ${budgetSummary.budgetStatus === "over_budget" ? "#FCD34D" : "#BBF7D0"}`, borderRadius: "12px", padding: "20px" }}>
            {/* Zero Within-Budget Banner */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: budgetSummary.budgetStatus === "over_budget" ? "#92400E" : "#166534", textTransform: "uppercase", background: budgetSummary.budgetStatus === "over_budget" ? "#FEF3C7" : "#DCFCE7", padding: "3px 8px", borderRadius: "4px" }}>
                AI PACKAGE COMBINATION ENGINE
              </span>

              {budgetSummary.budgetStatus === "over_budget" ? (
                <>
                  <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#991B1B", margin: "6px 0 2px" }}>
                    현재 조건에서 전체 예산에 맞는 항공·숙소 조합이 없습니다.
                  </h2>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "#92400E", fontWeight: 700 }}>
                    가장 적게 초과하는 조합은 전체 예산보다 ₩{Math.abs(packageCombos[0].costBreakdown.remainingBudget).toLocaleString()}원 높습니다. (비교 가능한 고유 조합 {packageCombos.length}개)
                  </p>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#14532D", margin: "6px 0 2px" }}>
                    Eyria 추천 항공 + 숙소 결합 패키지
                  </h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#15803D" }}>
                    개별 스코어와 전체 예산 적합도를 종합하여 도출된 고유 패키지 조합입니다.
                  </p>
                </>
              )}
            </div>

            {/* Unique Package Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              {packageCombos.map((combo) => {
                const isComboSelected = activeFlight?.providerOfferId === combo.flight.providerOfferId && activeOffer?.providerHotelId === combo.hotel.providerHotelId;
                const topReasons = (combo.recommendationReasons || []).slice(0, 3);
                const overAmt = Math.abs(combo.costBreakdown.remainingBudget);

                return (
                  <div
                    key={combo.packageId}
                    style={{
                      background: "#FFFFFF",
                      border: isComboSelected ? "2px solid #2563EB" : combo.badges.includes("balanced") ? "2px solid #10B981" : "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: isComboSelected ? "0 4px 14px rgba(37, 99, 235, 0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Card Top: Title, Badges, Package Score & Grade */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {combo.badges.map((b, bIdx) => (
                            <span key={bIdx} style={{ fontSize: "11px", fontWeight: 800, background: b === "balanced" || b === "rank_1st" ? "#DCFCE7" : b === "cheapest" ? "#DBEAFE" : "#FEF3C7", color: b === "balanced" || b === "rank_1st" ? "#166534" : b === "cheapest" ? "#1E40AF" : "#92400E", padding: "2px 6px", borderRadius: "4px" }}>
                              {b === "balanced" || b === "rank_1st" ? "종합 점수 1위" : b === "cheapest" ? "최저 비용" : b === "best_location" ? "동선 최적" : "프리미엄 대안"}
                            </span>
                          ))}
                          {combo.costBreakdown.remainingBudget < 0 && (
                            <span style={{ fontSize: "11px", fontWeight: 800, background: "#FEF2F2", color: "#991B1B", padding: "2px 6px", borderRadius: "4px", border: "1px solid #FCA5A5" }}>
                              예산 ₩{overAmt.toLocaleString()}원 초과
                            </span>
                          )}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: "12px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", display: "inline-block" }}>
                            Package Score: {combo.packageScore}점
                          </span>
                          <span style={{ fontSize: "11px", color: "#475569", fontWeight: 700, display: "block", marginTop: "2px" }}>
                            등급: {combo.packageScoreGrade}
                          </span>
                        </div>
                      </div>

                      <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: "0 0 10px" }}>
                        {combo.title}
                      </h3>

                      {/* Card Middle: Selected Flight, Selected Hotel, Estimated Grand Total & Excess */}
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                        <div style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700, marginBottom: "4px" }}>
                          ✈️ 항공: {combo.flight.ownerAirlineName} ({combo.flight.outbound.isDirect ? "직항" : "경유"})
                        </div>
                        <div style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                          🏨 숙소: {combo.hotel.hotelName}
                        </div>
                      </div>

                      <div style={{ marginBottom: "12px" }}>
                        <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>전체 예상 여행 비용</span>
                        <strong style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                          ₩{combo.costBreakdown.estimatedGrandTotal.toLocaleString()} KRW
                        </strong>
                        {combo.costBreakdown.remainingBudget < 0 ? (
                          <span style={{ fontSize: "12.5px", color: "#DC2626", fontWeight: 800, display: "block", marginTop: "2px" }}>
                            + ₩{overAmt.toLocaleString()}원 예산 초과
                          </span>
                        ) : (
                          <span style={{ fontSize: "12.5px", color: "#059669", fontWeight: 800, display: "block", marginTop: "2px" }}>
                            ₩{combo.costBreakdown.remainingBudget.toLocaleString()}원 여유
                          </span>
                        )}
                      </div>

                      {/* Card Bottom: Max 3 Recommendation Reasons */}
                      <div style={{ margin: "10px 0", background: "#F8FAFC", borderLeft: "4px solid #2563EB", padding: "10px 12px", borderRadius: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#1E293B", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                          AI 추천 핵심 이유 (최대 3개)
                        </span>
                        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
                          {topReasons.map((r, rIdx) => (
                            <li key={rIdx} style={{ fontWeight: 600 }}>• {r}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Distance Metrics Block (Separated from reasons) */}
                      <div style={{ background: "#F1F5F9", padding: "8px 12px", borderRadius: "6px", fontSize: "11.5px", color: "#475569", display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                        <span>📍 도심: {combo.distanceFromCityCenterKm}km</span>
                        <span>✈️ 공항: {combo.distanceFromAirportKm}km</span>
                        <span>📍 일정 평균: {combo.avgDistanceFromItineraryKm}km</span>
                      </div>
                    </div>

                    {/* Card Bottom: Select Combo Button */}
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: isComboSelected ? "#2563EB" : "#10B981",
                        color: "#FFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        restoredBookingRef.current = null;
                        setSelectedFlightId(combo.flight.providerOfferId);
                        setSelectedHotelId(combo.hotel.providerHotelId);
                      }}
                    >
                      {isComboSelected ? "현재 선택된 조합" : "이 조합 선택하기"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: AI 일정 맞춤 숙소 추천 */}
        <section className="bookingSectionBox">
          <div className="sectionHeaderRow">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}>AI 일정 맞춤 숙소 추천</h2>
                <span className="locationApiBadgeTag" style={{ whiteSpace: "nowrap", background: "#DBEAFE", color: "#1E40AF" }}>
                  LiteAPI Trip Score AI 엔진
                </span>
              </div>
              <p style={{ wordBreak: "keep-all", color: "#475569" }}>
                일정 동선 및 이동시간, 예산 적합도, 도심 접근성, 정보 품질을 종합 계산하였습니다.
              </p>
            </div>
          </div>

          {budgetEstimate && (
            <div className="cityBudgetEstimateCard">
              <div className="estimateHeader">
                <div>
                  <h4 className="estimateTitle">[{budgetEstimate.cityName}] 도시별 예상 숙박 예산 범위 (참고 가이드)</h4>
                  <span className="estimateRangeBadge">{budgetEstimate.budgetRangeText}</span>
                </div>
              </div>
              <div className="estimateGrid">
                <div className="estimateItem">
                  <span className="itemLabel">실속/비즈니스 숙소 (예상 가격)</span>
                  <strong className="itemValue">{budgetEstimate.standardNightlyRange}</strong>
                </div>
                <div className="estimateItem">
                  <span className="itemLabel">중심가/고급 숙소 (예상 가격)</span>
                  <strong className="itemValue">{budgetEstimate.premiumNightlyRange}</strong>
                </div>
              </div>
            </div>
          )}

          {hotelsLoading && (
            <div className="hotelsStateBox">
              <div className="stateSpinner" />
              <p style={{ color: "#64748B", fontWeight: 600, marginTop: "12px" }}>
                {destination} [{travelStyle.toUpperCase()} 스타일] 일정 장소 {itineraryPlacesList.length}곳과의 평균 이동시간 및 Trip Score 분석 중...
              </p>
            </div>
          )}

          {!hotelsLoading && hotelsError && (
            <div className="hotelsStateBox emptyStateError" style={{ padding: "24px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#9A3412" }}>{hotelsError}</h3>
              <div style={{ marginTop: "6px", fontSize: "12px", color: "#7C2D12" }}>Status: {hotelsStatus}</div>
              {hotelsStatus === "RATE_LIMITED" && hotelRetrySeconds > 0 && (
                <div style={{ marginTop: "6px", fontSize: "13px", color: "#7C2D12" }}>
                  요청 한도를 초과했습니다. {hotelRetrySeconds}초 후 다시 시도할 수 있습니다.
                </div>
              )}
              <button
                type="button"
                disabled={hotelsLoading || hotelRetrySeconds > 0}
                onClick={() => {
                  if (hotelsLoading || hotelRetrySeconds > 0) return;
                  setHotelsError(null);
                  setHotelsStatus(null);
                  setHotelRetryKey((key) => key + 1);
                }}
                style={{ minHeight: "44px", marginTop: "14px", padding: "10px 18px", borderRadius: "8px", border: "1px solid #EA580C", background: "#FFFFFF", color: "#9A3412", fontWeight: 800, cursor: "pointer" }}
              >
                숙소 다시 조회
              </button>
            </div>
          )}

          {!hotelsLoading && budgetMatchedHotels.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", marginBottom: "12px", borderBottom: "2px solid #10B981", paddingBottom: "6px" }}>
                숙소 예산 부합 목록
              </div>
              <div className="hotelCardsList">
                {budgetMatchedHotels.map((offer) => renderHotelCard(offer, false))}
              </div>
            </div>
          )}

          {!hotelsLoading && budgetExceededHotels.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#92400E", marginBottom: "12px", borderBottom: "2px solid #F59E0B", paddingBottom: "6px" }}>
                예산을 초과하지만 동선이 우수한 대안 목록
              </div>
              <div className="hotelCardsList">
                {budgetExceededHotels.map((offer) => renderHotelCard(offer, true))}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3: AI 추천 항공권 */}
        <section className="bookingSectionBox">
          <div className="sectionHeaderRow">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}>AI 추천 왕복 항공권</h2>
                <span className="locationApiBadgeTag" style={{ whiteSpace: "nowrap", background: "#EFF6FF", color: "#1D4ED8" }}>
                  ✈️ Google Flights Live Search (SerpAPI)
                </span>
              </div>
              <p style={{ wordBreak: "keep-all", color: "#475569" }}>
                인천(ICN) ⇄ {destination} 왕복 구간의 정규화된 항공권 가격 및 일정 정보입니다.
              </p>
            </div>
          </div>

          {flightsLoading && (
            <div className="hotelsStateBox">
              <div className="stateSpinner" />
              <p style={{ color: "#64748B", fontWeight: 600, marginTop: "12px" }}>
                실시간 Google Flights 왕복 항공권 및 Flight Score 분석 중...
              </p>
            </div>
          )}

          {!flightsLoading && (flightsError || allFlightsList.length === 0) && (
            <div className="hotelsStateBox emptyStateError" style={{ padding: "24px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#1E40AF", fontWeight: 800 }}>
                {flightsError || flightStatusMessage("NO_FLIGHTS_FOUND")}
              </h3>
              <div style={{ marginTop: "6px", fontSize: "12px", color: "#1E3A8A" }}>SerpAPI Google Flights · Status: {flightsStatus || "NO_FLIGHTS_FOUND"}</div>
              <button
                type="button"
                disabled={flightsLoading}
                onClick={() => {
                  if (flightsLoading) return;
                  setFlightsError(null);
                  setFlightsStatus(null);
                  setFlightRetryKey((key) => key + 1);
                }}
                style={{ minHeight: "44px", marginTop: "14px", padding: "10px 18px", borderRadius: "8px", border: "1px solid #2563EB", background: "#FFFFFF", color: "#1D4ED8", fontWeight: 800, cursor: "pointer" }}
              >
                항공편 다시 조회
              </button>
            </div>
          )}

          {!flightsLoading && budgetMatchedFlights.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", marginBottom: "12px", borderBottom: "2px solid #10B981", paddingBottom: "6px" }}>
                항공 예산 부합 목록
              </div>
              <div className="flightCardsList">
                {budgetMatchedFlights.map((flight) => renderFlightCard(flight, false))}
              </div>
            </div>
          )}

          {!flightsLoading && budgetExceededFlights.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#92400E", marginBottom: "12px", borderBottom: "2px solid #F59E0B", paddingBottom: "6px" }}>
                예산을 초과하지만 일정이 좋은 대안 목록
              </div>
              <div className="flightCardsList">
                {budgetExceededFlights.map((flight) => renderFlightCard(flight, true))}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: 숙소 위치 미리보기 */}
        {activeOffer && activeOffer.latitude !== null && activeOffer.longitude !== null && (
          <section className="bookingSectionBox">
            <div className="cleanSectionTitle">
              <h2 style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}>숙소 위치 미리보기</h2>
              <p style={{ wordBreak: "keep-all" }}>선택하신 숙소 위치와 여행 일정 내 주요 방문 장소 간의 지형적 배치입니다.</p>
            </div>

            <BookingMap
              hotelLocation={{
                sourceId: activeOffer.providerHotelId,
                name: activeOffer.hotelName,
                address: activeOffer.address,
                latitude: activeOffer.latitude,
                longitude: activeOffer.longitude,
                website: null,
                source: "OpenStreetMap"
              }}
              itineraryPlaces={itineraryPlacesList.length > 0 ? itineraryPlacesList.map(p => ({ name: p.name, latitude: p.lat, longitude: p.lng })) : []}
            />
          </section>
        )}

        {/* SECTION 5: Eyria 전체 여행 예산 통합 요약 (TravelBudgetSummary) */}
        <section className="bookingSummaryBox" style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", padding: "24px" }}>
          <div className="cleanSectionTitle">
            <h2 style={{ whiteSpace: "nowrap", wordBreak: "keep-all", color: "#0F172A" }}>
              📊 Eyria 전체 여행 예산 통합 요약
            </h2>
            <p style={{ wordBreak: "keep-all", color: "#475569" }}>
              선택하신 항공권, 숙소 및 예상 식비·교통·관광비의 실시간 합산 결과입니다.
            </p>
          </div>

          <div
            style={{
              margin: "16px 0",
              padding: "14px 18px",
              borderRadius: "8px",
              fontWeight: 800,
              fontSize: "14px",
              background:
                budgetSummary.budgetStatus === "within_budget"
                  ? "#ECFDF5"
                  : budgetSummary.budgetStatus === "near_limit"
                  ? "#FEF3C7"
                  : budgetSummary.budgetStatus === "over_budget"
                  ? "#FEF2F2"
                  : "#F3F4F6",
              color:
                budgetSummary.budgetStatus === "within_budget"
                  ? "#065F46"
                  : budgetSummary.budgetStatus === "near_limit"
                  ? "#92400E"
                  : budgetSummary.budgetStatus === "over_budget"
                  ? "#991B1B"
                  : "#374151",
              border: `1px solid ${
                budgetSummary.budgetStatus === "within_budget"
                  ? "#A7F3D0"
                  : budgetSummary.budgetStatus === "near_limit"
                  ? "#FCD34D"
                  : budgetSummary.budgetStatus === "over_budget"
                  ? "#FCA5A5"
                  : "#E5E7EB"
              }`,
            }}
          >
            {budgetSummary.statusMessage}
          </div>

          {budgetSummary.budgetStatus === "over_budget" && overBudgetAlternatives.length > 0 && (
            <div style={{ margin: "16px 0", background: "#FFFBEB", border: "1px solid #FDE68A", padding: "14px 18px", borderRadius: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#92400E", display: "block", marginBottom: "8px" }}>
                💡 예산 초과 해결을 위한 AI 실질 대안 제안
              </span>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "13px", color: "#78350F", lineHeight: "1.6" }}>
                {overBudgetAlternatives.map((alt, aIdx) => (
                  <li key={aIdx} style={{ marginBottom: "4px" }}>
                    • <strong>{alt.title}</strong>: {alt.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="summaryCardsGrid">
            <div className="summaryFactCard">
              <span className="factTag">선택 숙소</span>
              <strong className="factTitle">{activeOffer ? activeOffer.hotelName : "선택 필요"}</strong>
              <span className="factSub">
                {activeOffer && activeOffer.price.payableTotal !== null
                  ? `숙소 예상 결제 총액: ₩${activeOffer.price.payableTotal.toLocaleString()} ${activeOffer.price.currency}`
                  : "최종 금액 확인 필요"}
              </span>
            </div>

            <div className="summaryFactCard">
              <span className="factTag">선택 항공권</span>
              <strong className="factTitle">
                {activeFlight ? `${activeFlight.ownerAirlineName} (성인 ${travelers}인 왕복)` : "선택 필요"}
              </strong>
              <span className="factSub">
                {activeFlight && activeFlight.price.payableTotal !== null
                  ? `성인 ${travelers}인 왕복 총액: ₩${activeFlight.price.payableTotal.toLocaleString()} ${activeFlight.price.currency}`
                  : "가격 확인 필요"}
              </span>
            </div>

            <div className="summaryTotalCard">
              <span className="totalLabel">전체 예상 총액 (항공 + 숙소 + 현지 경비)</span>
              <strong className="totalAmount">
                ₩{budgetSummary.estimatedGrandTotal.toLocaleString()} {budgetSummary.currency}
              </strong>
            </div>
          </div>
        </section>

        <div className="bookingBottomNav">
          <Link href={plannerUrl} className="navBackBtn">
            ← 일정 다시 편집하기
          </Link>
          <Link href={summaryUrl} className="navSkipBtn">
            예약 없이 계속하기
          </Link>
          <Link href={summaryUrl} className="navProceedBtn">
            여행 완성하기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
