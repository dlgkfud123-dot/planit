import type { BookingSnapshot } from "../types/booking";
import type { FlightOffer, TravelBudgetSummary } from "../types/flight";
import type { HotelOffer } from "../types/hotel";

export const BOOKING_SNAPSHOT_KEY = "eyria:booking-snapshot:v1";

type SnapshotInput = {
  draftId: string;
  destinationId: string;
  checkIn: string;
  checkOut: string;
  passengerCount: number;
  selectedFlight: FlightOffer;
  selectedHotel: HotelOffer;
  budgetSummary: TravelBudgetSummary;
  packageId: string;
  previousCreatedAt?: string;
};

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function createBookingSnapshot(input: SnapshotInput, now = new Date().toISOString()): BookingSnapshot | null {
  const { selectedFlight: flight, selectedHotel: hotel, budgetSummary } = input;
  const inbound = flight.inbound;
  if (!input.draftId || !input.destinationId || !input.checkIn || !input.checkOut || input.passengerCount <= 0) return null;
  if (!inbound || inbound.segments.length === 0 || flight.outbound.segments.length === 0) return null;
  if (flight.price.payableTotal === null || hotel.price.payableTotal === null) return null;
  if (flight.price.currency.toUpperCase() !== hotel.price.currency.toUpperCase()) return null;
  if (budgetSummary.budgetStatus === "incomplete" || budgetSummary.passengerCount !== input.passengerCount) return null;
  if (budgetSummary.selectedFlightTotal !== flight.price.payableTotal || budgetSummary.selectedHotelTotal !== hotel.price.payableTotal) return null;
  if (budgetSummary.committedTotal !== flight.price.payableTotal + hotel.price.payableTotal) return null;
  if (budgetSummary.currency.toUpperCase() !== flight.price.currency.toUpperCase()) return null;
  if (hotel.city !== input.destinationId || hotel.checkIn !== input.checkIn || hotel.checkOut !== input.checkOut || hotel.adults !== input.passengerCount) return null;
  if (flight.partyPrice.passengerCount !== input.passengerCount) return null;

  return {
    version: 1,
    draftId: input.draftId,
    destinationId: input.destinationId,
    departureAirport: flight.outbound.originAirport,
    arrivalAirport: flight.outbound.destinationAirport,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    passengerCount: input.passengerCount,
    selectedFlight: flight,
    selectedHotel: hotel,
    budgetSummary,
    packageId: input.packageId,
    createdAt: input.previousCreatedAt || now,
    updatedAt: now,
  };
}

export function isBookingSnapshot(value: unknown, expectedDraftId?: string): value is BookingSnapshot {
  if (!record(value) || value.version !== 1 || typeof value.draftId !== "string") return false;
  if (expectedDraftId && value.draftId !== expectedDraftId) return false;
  const snapshot = value as unknown as BookingSnapshot;
  return createBookingSnapshot({
    draftId: snapshot.draftId,
    destinationId: snapshot.destinationId,
    checkIn: snapshot.checkIn,
    checkOut: snapshot.checkOut,
    passengerCount: snapshot.passengerCount,
    selectedFlight: snapshot.selectedFlight,
    selectedHotel: snapshot.selectedHotel,
    budgetSummary: snapshot.budgetSummary,
    packageId: snapshot.packageId,
    previousCreatedAt: snapshot.createdAt,
  }, snapshot.updatedAt) !== null;
}

export function readBookingSnapshot(storage: Pick<Storage, "getItem">, expectedDraftId?: string): BookingSnapshot | null {
  try {
    const raw = storage.getItem(BOOKING_SNAPSHOT_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isBookingSnapshot(value, expectedDraftId) ? value : null;
  } catch {
    return null;
  }
}
