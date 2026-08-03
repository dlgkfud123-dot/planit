import { cityByName } from "../data/cities.ts";
import { isSupportedAirport } from "../data/airports.ts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IATA_PATTERN = /^[A-Z]{3}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

const validDate = (value: string) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const todayUtc = (now: Date) => now.toISOString().slice(0, 10);

export function validateFlightInput(input: {
  departureAirport: string;
  arrivalAirport: string;
  outboundDate: string;
  returnDate: string;
  adults: number;
  travelClass: string;
  currency: string;
}, now = new Date()): string | null {
  if (!IATA_PATTERN.test(input.departureAirport) || !IATA_PATTERN.test(input.arrivalAirport)) return "공항 코드는 3자리 IATA 형식이어야 합니다.";
  if (!isSupportedAirport(input.departureAirport) || !isSupportedAirport(input.arrivalAirport)) return "지원하지 않는 공항입니다.";
  if (!validDate(input.outboundDate) || !validDate(input.returnDate)) return "날짜는 YYYY-MM-DD 형식이어야 합니다.";
  if (input.outboundDate < todayUtc(now) || input.returnDate < todayUtc(now)) return "과거 날짜는 검색할 수 없습니다.";
  if (input.returnDate < input.outboundDate) return "귀국일은 출국일보다 빠를 수 없습니다.";
  if (!Number.isInteger(input.adults) || input.adults < 1) return "성인 인원은 1명 이상이어야 합니다.";
  if (!["1", "2", "3", "4"].includes(input.travelClass)) return "지원하지 않는 좌석 등급입니다.";
  if (!CURRENCY_PATTERN.test(input.currency)) return "통화는 3자리 대문자 코드여야 합니다.";
  return null;
}

export function validateHotelInput(input: {
  cityId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  budget: number;
}, now = new Date()): string | null {
  const city = cityByName[input.cityId];
  if (!input.cityId || !city || !Number.isFinite(city.lat) || !Number.isFinite(city.lon)) return "등록되지 않은 도시입니다.";
  if (!validDate(input.checkIn) || !validDate(input.checkOut)) return "날짜는 YYYY-MM-DD 형식이어야 합니다.";
  if (input.checkIn < todayUtc(now) || input.checkOut < todayUtc(now)) return "과거 날짜는 검색할 수 없습니다.";
  if (input.checkOut <= input.checkIn) return "체크아웃은 체크인 이후여야 합니다.";
  if (!Number.isInteger(input.guests) || input.guests < 1) return "투숙객은 1명 이상이어야 합니다.";
  if (!Number.isInteger(input.rooms) || input.rooms < 1) return "객실은 1개 이상이어야 합니다.";
  if (!Number.isFinite(input.budget) || input.budget < 0) return "예산은 0 이상이어야 합니다.";
  return null;
}
