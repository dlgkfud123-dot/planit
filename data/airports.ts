export type AirportCoordinates = { latitude: number; longitude: number };

export type Airport = {
  iata: string;
  name: string;
  cityName: string;
  label: string;
};

export const KOREA_AIRPORTS: Airport[] = [
  { iata: "ICN", name: "인천국제공항", cityName: "서울·인천", label: "서울·인천 (ICN) — 인천국제공항" },
  { iata: "GMP", name: "김포국제공항", cityName: "서울·김포", label: "서울·김포 (GMP) — 김포국제공항" },
  { iata: "PUS", name: "김해국제공항", cityName: "부산", label: "부산·김해 (PUS) — 김해국제공항" },
  { iata: "TAE", name: "대구국제공항", cityName: "대구", label: "대구 (TAE) — 대구국제공항" },
  { iata: "CJU", name: "제주국제공항", cityName: "제주", label: "제주 (CJU) — 제주국제공항" },
  { iata: "CJJ", name: "청주국제공항", cityName: "청주", label: "청주 (CJJ) — 청주국제공항" },
  { iata: "MWX", name: "무안국제공항", cityName: "무안", label: "무안 (MWX) — 무안국제공항" },
  { iata: "YNY", name: "양양국제공항", cityName: "양양", label: "양양 (YNY) — 양양국제공항" },
];

export const AIRPORT_COORDINATES: Record<string, AirportCoordinates> = {
  ICN: { latitude: 37.4602, longitude: 126.4407 },
  GMP: { latitude: 37.5583, longitude: 126.7906 },
  PUS: { latitude: 35.1795, longitude: 128.9382 },
  TAE: { latitude: 35.8941, longitude: 128.6589 },
  CJU: { latitude: 33.5104, longitude: 126.4914 },
  CJJ: { latitude: 36.7166, longitude: 127.4991 },
  MWX: { latitude: 34.9914, longitude: 126.3828 },
  YNY: { latitude: 38.0613, longitude: 128.6692 },
  HND: { latitude: 35.5494, longitude: 139.7798 },
  FUK: { latitude: 33.5859, longitude: 130.4507 },
  KIX: { latitude: 34.4347, longitude: 135.244 },
  CTS: { latitude: 42.7752, longitude: 141.6923 },
  BKK: { latitude: 13.69, longitude: 100.7501 },
  SIN: { latitude: 1.3644, longitude: 103.9915 },
  TPE: { latitude: 25.0797, longitude: 121.2342 },
  HKG: { latitude: 22.308, longitude: 113.9185 },
  PEK: { latitude: 40.0799, longitude: 116.6031 },
  PVG: { latitude: 31.1443, longitude: 121.8083 },
  CDG: { latitude: 49.0097, longitude: 2.5479 },
  LHR: { latitude: 51.47, longitude: -0.4543 },
  ZRH: { latitude: 47.4581, longitude: 8.5555 },
  VCE: { latitude: 45.5053, longitude: 12.3519 },
  BCN: { latitude: 41.2974, longitude: 2.0833 },
  AMS: { latitude: 52.3105, longitude: 4.7683 },
  JFK: { latitude: 40.6413, longitude: -73.7781 },
  LAX: { latitude: 33.9416, longitude: -118.4085 },
  SFO: { latitude: 37.6213, longitude: -122.379 },
  HNL: { latitude: 21.3187, longitude: -157.9225 },
  YYZ: { latitude: 43.6777, longitude: -79.6248 },
  SYD: { latitude: -33.9399, longitude: 151.1753 },
  AKL: { latitude: -37.0082, longitude: 174.785 },
};

export const CITY_AIRPORT_IATA: Record<string, string> = {
  서울: "ICN",
  부산: "PUS",
  도쿄: "HND",
  후쿠오카: "FUK",
  오사카: "KIX",
  교토: "KIX",
  삿포로: "CTS",
  방콕: "BKK",
  싱가포르: "SIN",
  타이베이: "TPE",
  홍콩: "HKG",
  베이징: "PEK",
  상하이: "PVG",
  파리: "CDG",
  런던: "LHR",
  취리히: "ZRH",
  베네치아: "VCE",
  바르셀로나: "BCN",
  암스테르담: "AMS",
  뉴욕: "JFK",
  로스앤젤레스: "LAX",
  샌프란시스코: "SFO",
  호놀룰루: "HNL",
  토론토: "YYZ",
  시드니: "SYD",
  오클랜드: "AKL",
};

export const isSupportedAirport = (iata: string) =>
  Object.prototype.hasOwnProperty.call(AIRPORT_COORDINATES, iata);

export const getAirportCoordinates = (iata: string): AirportCoordinates | null =>
  AIRPORT_COORDINATES[iata] ?? null;

export const getCityAirportIata = (city: string): string | null =>
  CITY_AIRPORT_IATA[city] ?? null;

export function searchAirports(query: string): Airport[] {
  if (!query) return KOREA_AIRPORTS;
  const normalized = query.trim().toLowerCase();
  return KOREA_AIRPORTS.filter((airport) =>
    airport.name.toLowerCase().includes(normalized) ||
    airport.cityName.toLowerCase().includes(normalized) ||
    airport.iata.toLowerCase().includes(normalized)
  );
}
