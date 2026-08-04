import { findCity, type TravelCity } from "../data/cities.ts";
import { getCanonicalArrivalAirportCandidates, getCityAirportGroup, isSupportedAirport } from "../data/airports.ts";
import { validateTravelDateRange } from "./travelDateValidation.ts";

export type BookingContextErrorCode =
  | "DRAFT_NOT_FOUND"
  | "DESTINATION_MISSING"
  | "UNSUPPORTED_CITY"
  | "AIRPORT_GROUP_UNVERIFIED"
  | "HOTEL_CITY_UNSUPPORTED"
  | "INVALID_DATES"
  | "INVALID_TRAVELERS";

export type BookingDestinationContext =
  | { ok: true; canonicalCityId: string; city: TravelCity; arrivalAirports: string[] }
  | { ok: false; code: BookingContextErrorCode; message: string };

export function resolveBookingDestinationContext(input: {
  draftRequested: boolean;
  draftFound: boolean;
  destination: string;
  checkIn: string;
  checkOut: string;
  travelers: number;
  budget: number;
  today?: string;
}): BookingDestinationContext {
  if (!input.draftRequested || !input.draftFound) {
    return { ok: false, code: "DRAFT_NOT_FOUND", message: "여행 일정 초안을 찾을 수 없습니다. 일정 페이지에서 여행을 다시 선택해주세요." };
  }
  if (!input.destination.trim()) {
    return { ok: false, code: "DESTINATION_MISSING", message: "여행 목적지 정보가 없습니다. 일정 페이지에서 목적지를 다시 선택해주세요." };
  }
  const city = findCity(input.destination);
  if (!city || !Number.isFinite(city.lat) || !Number.isFinite(city.lon)) {
    return { ok: false, code: "UNSUPPORTED_CITY", message: "현재 지원하지 않는 여행 도시입니다. 일정 페이지에서 다른 도시를 선택해주세요." };
  }
  const airportGroup = getCityAirportGroup(city.name);
  const arrivalAirports = getCanonicalArrivalAirportCandidates(city.name);
  if (!airportGroup || airportGroup.classification === "UNVERIFIED_AIRPORT_GROUP" || arrivalAirports.length === 0 || arrivalAirports.some((iata) => !isSupportedAirport(iata))) {
    return { ok: false, code: "AIRPORT_GROUP_UNVERIFIED", message: "이 도시의 항공·숙소 연동을 준비하고 있습니다. 검증이 완료된 도시를 선택해주세요." };
  }
  if (!input.checkIn || !input.checkOut || !validateTravelDateRange(input.checkIn, input.checkOut, input.today).valid) {
    return { ok: false, code: "INVALID_DATES", message: "여행 날짜를 확인해주세요. 일정 페이지에서 날짜를 다시 선택해주세요." };
  }
  if (!Number.isInteger(input.travelers) || input.travelers < 1 || !Number.isFinite(input.budget) || input.budget <= 0) {
    return { ok: false, code: "INVALID_TRAVELERS", message: "여행 인원과 예산을 확인해주세요. 일정 페이지에서 여행 설정을 다시 확인해주세요." };
  }
  return { ok: true, canonicalCityId: city.name, city, arrivalAirports };
}
