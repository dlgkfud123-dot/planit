import { supportedCityIds, cities as legacyCities } from "./cities";

export type DestinationCity = {
  id: string;
  name: string;
  en: string;
  countryName: string;
  countryCode: string;
  isPopular?: boolean;
};

export type DestinationCountry = {
  code: string;
  name: string;
  cities: DestinationCity[];
};

const COUNTRY_MAP: Record<string, { code: string; name: string }> = {
  일본: { code: "JP", name: "일본" },
  태국: { code: "TH", name: "태국" },
  베트남: { code: "VN", name: "베트남" },
  프랑스: { code: "FR", name: "프랑스" },
  미국: { code: "US", name: "미국" },
  대한민국: { code: "KR", name: "대한민국" },
  대만: { code: "TW", name: "대만" },
  싱가포르: { code: "SG", name: "싱가포르" },
  영국: { code: "GB", name: "영국" },
  스위스: { code: "CH", name: "스위스" },
  이탈리아: { code: "IT", name: "이탈리아" },
  스페인: { code: "ES", name: "스페인" },
  네덜란드: { code: "NL", name: "네덜란드" },
  튀르키예: { code: "TR", name: "튀르키예" },
  인도네시아: { code: "ID", name: "인도네시아" },
  캐나다: { code: "CA", name: "캐나다" },
  호주: { code: "AU", name: "호주" },
  뉴질랜드: { code: "NZ", name: "뉴질랜드" },
  아랍에미리트: { code: "AE", name: "아랍에미리트" },
  중국: { code: "CN", name: "중국" },
  몽골: { code: "MN", name: "몽골" },
  러시아: { code: "RU", name: "러시아" },
  이집트: { code: "EG", name: "이집트" },
  남아프리카공화국: { code: "ZA", name: "남아프리카공화국" },
  브라질: { code: "BR", name: "브라질" },
};

const POPULAR_CITY_NAMES = new Set([
  "도쿄", "오사카", "후쿠오카", "방콕", "파리", "뉴욕", "런던", "타이베이", "다낭", "서울", "바르셀로나"
]);

// Build structured DestinationCity array from supported cities
export const ALL_DESTINATION_CITIES: DestinationCity[] = legacyCities
  .filter((c) => supportedCityIds.includes(c.name))
  .map((c) => {
    const countryInfo = COUNTRY_MAP[c.country] || { code: "OTHER", name: c.country };
    return {
      id: c.name,
      name: c.name,
      en: c.en,
      countryName: countryInfo.name,
      countryCode: countryInfo.code,
      isPopular: POPULAR_CITY_NAMES.has(c.name),
    };
  });

// Popular cities list
export const POPULAR_CITIES: DestinationCity[] = ALL_DESTINATION_CITIES.filter((c) => c.isPopular);

// Group by country
const groupedMap = new Map<string, DestinationCity[]>();
for (const city of ALL_DESTINATION_CITIES) {
  const list = groupedMap.get(city.countryName) || [];
  list.push(city);
  groupedMap.set(city.countryName, list);
}

// Preferred country ordering
const COUNTRY_ORDER = [
  "일본", "태국", "베트남", "대만", "대한민국", "프랑스", "영국", "미국",
  "스위스", "이탈리아", "스페인", "싱가포르", "인도네시아", "네덜란드",
  "튀르키예", "캐나다", "호주", "뉴질랜드", "아랍에미리트", "중국", "몽골",
  "러시아", "이집트", "남아프리카공화국", "브라질"
];

export const DESTINATION_COUNTRIES: DestinationCountry[] = COUNTRY_ORDER
  .filter((countryName) => groupedMap.has(countryName))
  .map((countryName) => {
    const countryInfo = COUNTRY_MAP[countryName] || { code: "OTHER", name: countryName };
    return {
      code: countryInfo.code,
      name: countryInfo.name,
      cities: groupedMap.get(countryName)!,
    };
  });

const CONTINENT_COUNTRY_CODES = [
  { name: "아시아", codes: ["KR", "JP", "TH", "VN", "TW", "SG", "ID", "CN", "MN", "AE"] },
  { name: "유럽", codes: ["FR", "GB", "IT", "CH", "ES", "NL", "TR", "RU"] },
  { name: "북아메리카", codes: ["US", "CA"] },
  { name: "남아메리카", codes: ["BR"] },
  { name: "오세아니아", codes: ["AU", "NZ"] },
  { name: "아프리카", codes: ["EG", "ZA"] },
] as const;

export const DESTINATION_CONTINENTS = CONTINENT_COUNTRY_CODES.map((continent) => ({
  name: continent.name,
  countries: continent.codes
    .map((code) => DESTINATION_COUNTRIES.find((country) => country.code === code))
    .filter((country): country is DestinationCountry => Boolean(country)),
})).filter((continent) => continent.countries.length > 0);

const RECENT_KEY = "eyria:recent-destinations";

export function getRecentDestinations(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function addRecentDestination(cityName: string): void {
  if (typeof window === "undefined" || !cityName) return;
  try {
    const current = getRecentDestinations();
    const next = [cityName, ...current.filter((c) => c !== cityName)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

export function searchDestinations(query: string): DestinationCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_DESTINATION_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.en.toLowerCase().includes(q) ||
      c.countryName.toLowerCase().includes(q)
  );
}
