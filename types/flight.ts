export type NormalizedFlightPrice = {
  baseFare: number | null;
  taxes: number | null;
  surcharges: number | null;
  baggageFee: number | null;
  payableTotal: number | null;
  currency: string;
  taxStatus: "included" | "excluded" | "unknown";
  sourcePaths: {
    baseFare: string | null;
    taxes: string | null;
    payableTotal: string | null;
  };
};

export type FlightPartyPrice = {
  passengerCount: number;
  totalTripPrice: number;
  averagePerPassenger: number | null;
  currency: string;
  averagePerPassengerDerived: boolean;
};

export type FlightAmenities = {
  legroom: string | null;
  wifi: boolean | null;
  powerOutlet: boolean | null;
  carbonEmissionText: string | null;
};

export type FlightBaggageDetails = {
  outbound: string | null;
  inbound: string | null;
  status: "explicit" | "unknown";
  sourcePath: string | null;
};

export type FlightTimeFlags = {
  arrivesNextDay: boolean;
  dayOffset: number;
  isOvernightFlight: boolean;
};

export type FlightPriceSource = {
  stage: "initial_search" | "return_selection" | "booking_options";
  collection: "best_flights" | "other_flights" | "booking_options";
  index: number;
  path: string;
};

export type FlightSlice = {
  originAirport: string;
  destinationAirport: string;
  departureDateText: string;
  departureTime: string;
  arrivalDateText: string;
  arrivalTime: string;
  durationMinutes: number;
  durationText: string;
  stopsCount: number;
  isDirect: boolean;
  segments: FlightSegment[];
  sliceBaggageText: string;
};

export type FlightScoreBreakdown = {
  priceScore: number;
  timeScore: number;
  directScore: number;
  baggageScore: number;
  totalScore: number;
};

export type BookingRequestMethod = "get" | "post_required" | "unavailable";

export type FlightBookingOption = {
  sellerId: string;
  seller: string;
  price: number;
  currency: string;
  url: string | null;
  bookingRequestMethod: BookingRequestMethod;
  baggagePrices?: string[];
};

export type SelectedFlightSeller = {
  sellerId: string;
  sellerName: string;
  selectedSellerPrice: number;
  selectedSellerCurrency: string;
  bookingRequestMethod: BookingRequestMethod;
  priceSource: FlightPriceSource;
};

export type FlightSegment = {
  flightNumber: string | null;
  originAirport: string;
  destinationAirport: string;

  departingAt: string;
  arrivingAt: string;

  departureDateText: string;
  departureTimeText: string;
  arrivalDateText: string;
  arrivalTimeText: string;

  arrivesNextDay: boolean;
  dayOffset: number;
  isOvernightFlight?: boolean;

  marketingCarrierName: string | null;
  operatingCarrierName: string | null;
  airlineCode: string | null;
  isCodeshare: boolean;
};

export type FlightOffer = {
  providerOfferId: string;
  ownerAirlineName: string;
  ownerAirlineCode: string;
  airlineLogoUrl: string | null;
  outbound: FlightSlice;
  inbound: FlightSlice | null;
  baggageInfo: string[];
  baggageDetails?: FlightBaggageDetails;
  amenities?: FlightAmenities;
  priceSource?: FlightPriceSource;
  price: NormalizedFlightPrice;
  partyPrice: FlightPartyPrice;
  flightScore: number;
  recommendationReasons: string[];
  scoreBreakdown: FlightScoreBreakdown;
  expiresAt: string | null;
  isExpired?: boolean;
  bookingUrl: string | null;
  bookingOptions?: FlightBookingOption[] | null;
  bookingOptionsLookupId?: string | null;
  selectedSeller?: SelectedFlightSeller | null;
  departureToken?: string | null;
  bookingToken?: string | null;
  searchMetadataId?: string | null;
  provider: "Duffel" | "SerpAPI Google Flights";
  environment?: "sandbox" | "production";
  dataEnvironment?: "live_search";
  bookingEnvironment?: "external";
  fetchedAt: string;
};

export type RawOfferSummary = {
  id: string;
  live_mode: boolean;
  expires_at: string | null;
  base_amount: string | null;
  base_currency: string | null;
  tax_amount: string | null;
  tax_currency: string | null;
  total_amount: string | null;
  total_currency: string | null;
  slice_ids: string[];
  segment_ids: string[];
};

export type TravelBudgetSummary = {
  totalBudget: number;
  passengerCount: number;

  selectedFlightTotal: number | null;
  selectedHotelTotal: number | null;

  estimatedFoodBudget: number;
  estimatedLocalTransportBudget: number;
  estimatedActivityBudget: number;
  reserveBudget: number;

  committedTotal: number;
  estimatedGrandTotal: number;
  remainingBudget: number;

  budgetStatus: "within_budget" | "near_limit" | "over_budget" | "incomplete";
  statusMessage: string;
  currency: string;
};

export type FlightSearchResponse = {
  success: boolean;
  city: string;
  flightApiProvider: string;
  flightApiStatus: string;
  integrationStatus: "UNVERIFIED" | "VERIFIED";
  providerAvailable: boolean;
  liveSearchEnabled: boolean;
  status: "UNAVAILABLE_BUSINESS_ONBOARDING_REQUIRED" | "ACTIVE" | "DISABLED";
  reason: string;
  message: string;
  rawOfferSummary?: RawOfferSummary;
  offers: FlightOffer[];
  budgetMatchedOffers?: FlightOffer[];
  budgetExceededOffers?: FlightOffer[];
  providerCallCount?: number;
  cached?: boolean;
};
