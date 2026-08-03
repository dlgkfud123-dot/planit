import type { FlightBookingOption, FlightOffer } from "../types/flight";

export const isSelectableRoundTrip = (flight: FlightOffer): boolean =>
  flight.outbound.segments.length > 0 && Boolean(flight.inbound && flight.inbound.segments.length > 0);

export function selectFlightSeller(flight: FlightOffer, option: FlightBookingOption): FlightOffer {
  const priceSource = {
    stage: "booking_options" as const,
    collection: "booking_options" as const,
    index: flight.bookingOptions?.findIndex((item) => item.sellerId === option.sellerId) ?? 0,
    path: `booking_options.${option.sellerId}.price`,
  };
  return {
    ...flight,
    price: {
      ...flight.price,
      payableTotal: option.price,
      currency: option.currency,
      sourcePaths: { ...flight.price.sourcePaths, payableTotal: priceSource.path },
    },
    priceSource,
    partyPrice: {
      ...flight.partyPrice,
      totalTripPrice: option.price,
      averagePerPassenger: Math.round(option.price / flight.partyPrice.passengerCount),
      currency: option.currency,
    },
    selectedSeller: {
      sellerId: option.sellerId,
      sellerName: option.seller,
      selectedSellerPrice: option.price,
      selectedSellerCurrency: option.currency,
      bookingRequestMethod: option.bookingRequestMethod,
      priceSource,
    },
  };
}
