// Inactive Provider declaration for deprecated Amadeus API
/**
 * @deprecated
 * INACTIVE PROVIDER: Amadeus Self-Service Portal was permanently shut down on July 17, 2026.
 * Currently only Enterprise API Portal is maintained.
 * This class is preserved as an inactive provider in compliance with project directives.
 */
export interface InactiveAmadeusProvider {
  status: "DEPRECATED_PERMANENTLY_CLOSED";
  closedDate: "2026-07-17";
}

export type TravelStyle = "budget" | "standard" | "premium";

export type TripScoreGrade =
  | "S (Excellent)"
  | "A (Very Good)"
  | "B (Good)"
  | "C (Fair)"
  | "D (Low Match)";

export type HotelLocation = {
  sourceId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  website: string | null;
  source: "OpenStreetMap";
};

export type NormalizedHotelPrice = {
  basePrice: number | null;
  includedTaxAmount: number | null;
  excludedTaxAmount: number | null;
  feeAmount: number | null;
  payableOnline: number | null;
  payableAtHotel: number | null;
  payableTotal: number | null;
  currency: string;
  taxStatus: "included" | "excluded" | "partial" | "unknown";
  paymentTiming: "online" | "at_property" | "mixed" | "unknown";
  sourcePaths: {
    basePrice: string | null;
    includedTaxAmount: string | null;
    excludedTaxAmount: string | null;
    payableTotal: string | null;
  };
};

export type TripScoreBreakdown = {
  itineraryDistScore: number;  // 일정 동선
  budgetMatchScore: number;    // 예산 적합
  cityAccessScore: number;     // 도심 접근
  detailQualityScore: number;  // 정보 품질
  totalScore: number;          // 0 ~ 100
  grade: TripScoreGrade;
};

export type HotelOffer = {
  providerHotelId: string;
  hotelName: string;
  city: string;
  countryCode: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  available: boolean;
  roomName: string | null;
  price: NormalizedHotelPrice;
  imageUrl: string | null;
  bookingUrl: string | null;
  bookingLinkType?: "external_search" | "provider_booking";
  provider: "LiteAPI";
  environment: "sandbox";
  fetchedAt: string;
  derivedNightlyPrice: boolean;
  distanceFromCenterKm: number;
  destinationMatched: boolean;
  // Eyria Travel Style & Trip Score AI Matching Fields
  travelStyle: TravelStyle;
  tripScore: number;
  tripScoreGrade: TripScoreGrade;
  avgItineraryDistanceKm: number;
  avgItineraryTimeMinutes: number;
  transitMode: "transit" | "walk" | "drive";
  closestDayNumber?: number;
  recommendationReasons: string[];
  scoreBreakdown: TripScoreBreakdown;
};

export type HotelDisplayItem = {
  offer: HotelOffer;
};

export type PriceDisplayLabel = "테스트 가격" | "최근 조회 가격" | "예상 가격" | "가격 정보 없음";

export type CityBudgetEstimate = {
  cityName: string;
  budgetRangeText: string;
  standardNightlyRange: string;
  premiumNightlyRange: string;
  disclaimer: string;
};
