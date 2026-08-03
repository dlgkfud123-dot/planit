import type { GeneratedDay, GeneratedStop } from "./itineraryGenerator";

export interface DayCentroidResult {
  dayIndex: number;
  dayLabel: string;
  centroidLat: number;
  centroidLng: number;
  dispersionKm: number;
  autoRadiusLabel: string;
  confidenceLevel: "높음" | "중간" | "낮음";
  confidenceColor: string; // "#22C55E", "#EAB308", "#EF4444"
  stopNames: string[];
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDayCentroid(dayIndex: number, day: GeneratedDay): DayCentroidResult {
  const validStops = day.stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));

  if (validStops.length === 0) {
    return {
      dayIndex,
      dayLabel: day.label,
      centroidLat: 35.6895,
      centroidLng: 139.6917,
      dispersionKm: 0.8,
      autoRadiusLabel: "1.0km",
      confidenceLevel: "중간",
      confidenceColor: "#EAB308",
      stopNames: day.stops.map((s) => s.name),
    };
  }

  // 1. Calculate Centroid (average Lat/Lng)
  const sumLat = validStops.reduce((acc, s) => acc + s.lat, 0);
  const sumLng = validStops.reduce((acc, s) => acc + s.lng, 0);
  const centroidLat = sumLat / validStops.length;
  const centroidLng = sumLng / validStops.length;

  // 2. Calculate Dispersion (average Haversine distance to centroid)
  const totalDist = validStops.reduce(
    (acc, s) => acc + haversineDistanceKm(centroidLat, centroidLng, s.lat, s.lng),
    0
  );
  const dispersionKm = Number((totalDist / validStops.length).toFixed(2));

  // 3. Determine Auto Radius
  let autoRadiusLabel = "1.0km";
  if (dispersionKm <= 0.5) {
    autoRadiusLabel = "700m";
  } else if (dispersionKm <= 1.5) {
    autoRadiusLabel = "1.0km";
  } else {
    autoRadiusLabel = "2.0km";
  }

  // 4. Determine Confidence Level (Text + Color ONLY, NO ICONS)
  let confidenceLevel: "높음" | "중간" | "낮음" = "높음";
  let confidenceColor = "#22C55E"; // Green

  if (dispersionKm > 1.5 || validStops.length < 2) {
    confidenceLevel = "낮음";
    confidenceColor = "#EF4444"; // Red
  } else if (dispersionKm > 0.8) {
    confidenceLevel = "중간";
    confidenceColor = "#EAB308"; // Yellow
  }

  return {
    dayIndex,
    dayLabel: day.label,
    centroidLat: Number(centroidLat.toFixed(4)),
    centroidLng: Number(centroidLng.toFixed(4)),
    dispersionKm,
    autoRadiusLabel,
    confidenceLevel,
    confidenceColor,
    stopNames: validStops.map((s) => s.name),
  };
}

export function calculateAllDayCentroids(days: GeneratedDay[]): DayCentroidResult[] {
  return days.map((day, idx) => calculateDayCentroid(idx, day));
}
