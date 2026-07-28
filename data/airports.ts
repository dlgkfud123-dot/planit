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

export function searchAirports(query: string): Airport[] {
  if (!query) return KOREA_AIRPORTS;
  const q = query.trim().toLowerCase();
  return KOREA_AIRPORTS.filter(
    a => a.name.toLowerCase().includes(q) ||
         a.cityName.toLowerCase().includes(q) ||
         a.iata.toLowerCase().includes(q)
  );
}
