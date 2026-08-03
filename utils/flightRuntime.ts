import type { FlightSlice } from "../types/flight";

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

function sliceLayoverMinutes(slice: FlightSlice): number {
  const first = slice.segments[0];
  const last = slice.segments[slice.segments.length - 1];
  if (!first || !last) return 0;
  const departure = new Date(first.departingAt.replace(" ", "T")).getTime();
  const arrival = new Date(last.arrivingAt.replace(" ", "T")).getTime();
  if (!Number.isFinite(departure) || !Number.isFinite(arrival) || arrival <= departure) return 0;
  return Math.max(0, Math.round((arrival - departure) / 60_000) - slice.durationMinutes);
}

export function calculateFlightTimeScore(outbound: FlightSlice, inbound: FlightSlice): number {
  const durationMinutes = outbound.durationMinutes + inbound.durationMinutes;
  const layoverMinutes = sliceLayoverMinutes(outbound) + sliceLayoverMinutes(inbound);
  const stops = outbound.stopsCount + inbound.stopsCount;
  return clampScore(100 - durationMinutes / 20 - layoverMinutes / 12 - stops * 12);
}
