import type { FlightBookingOption } from "../types/flight";
import type { HotelOffer } from "../types/hotel";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function normalizeFlightBookingOption(raw: unknown, optionIndex: number, fallbackPrice: number | null, currency = "KRW"): FlightBookingOption {
  const option = isRecord(raw) ? raw : {};
  const together = isRecord(option.together) ? option.together : option;
  const requestValue = together.booking_request || option.booking_request;
  const request = isRecord(requestValue) ? requestValue : {};
  const seller = String(together.book_with || together.seller || option.seller || "공식 예약처");
  const url = typeof request.url === "string" ? request.url : typeof together.url === "string" ? together.url : typeof option.url === "string" ? option.url : null;
  const requiresPost = Boolean(request.post_data);
  const baggageValue = together.baggage_prices || option.baggage_prices;
  const baggagePrices = Array.isArray(baggageValue) ? baggageValue.map(String) : undefined;
  return {
    sellerId: `${seller.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "seller"}-${optionIndex}`,
    seller,
    price: Number(together.price || option.price || fallbackPrice || 0),
    currency,
    url: requiresPost ? null : url,
    bookingRequestMethod: requiresPost ? "post_required" : url ? "get" : "unavailable",
    baggagePrices,
  };
}

export const getHotelBookingLinkLabel = (hotel: HotelOffer): string =>
  hotel.bookingLinkType === "provider_booking" ? "예약 사이트로 이동" : "Booking.com에서 다시 검색";
