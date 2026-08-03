import type { FlightOffer, TravelBudgetSummary } from "./flight";
import type { HotelOffer } from "./hotel";

export type BookingSnapshot = {
  version: 1;
  draftId: string;
  destinationId: string;
  departureAirport: string;
  arrivalAirport: string;
  checkIn: string;
  checkOut: string;
  passengerCount: number;
  selectedFlight: FlightOffer;
  selectedHotel: HotelOffer;
  budgetSummary: TravelBudgetSummary;
  packageId: string;
  createdAt: string;
  updatedAt: string;
};
