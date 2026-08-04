export type AirportCoordinates = { latitude: number; longitude: number };

export type CityAirportGroup = {
  cityId: string;
  cityNames: string[];
  arrivalAirportCandidates: string[];
  primaryAirport: string;
  classification: "SINGLE_AIRPORT_CITY" | "MULTI_AIRPORT_CITY" | "UNVERIFIED_AIRPORT_GROUP";
  airportRoles: Record<string, "PRIMARY" | "SECONDARY" | "LOW_COST_ALTERNATIVE">;
};

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

export const DEFAULT_FLIGHT_COMPARISON_AIRPORTS = ["ICN", "GMP", "PUS", "CJU", "CJJ", "TAE"] as const;

export const getKoreaAirport = (iata: string): Airport | null =>
  KOREA_AIRPORTS.find((airport) => airport.iata === iata.toUpperCase()) ?? null;

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
  NRT: { latitude: 35.772, longitude: 140.3929 },
  FUK: { latitude: 33.5859, longitude: 130.4507 },
  KIX: { latitude: 34.4347, longitude: 135.244 },
  ITM: { latitude: 34.7855, longitude: 135.4382 },
  UKB: { latitude: 34.6328, longitude: 135.2239 },
  CTS: { latitude: 42.7752, longitude: 141.6923 },
  BKK: { latitude: 13.69, longitude: 100.7501 },
  DMK: { latitude: 13.9126, longitude: 100.6068 },
  SIN: { latitude: 1.3644, longitude: 103.9915 },
  TPE: { latitude: 25.0797, longitude: 121.2342 },
  TSA: { latitude: 25.0694, longitude: 121.552 },
  HKG: { latitude: 22.308, longitude: 113.9185 },
  PEK: { latitude: 40.0799, longitude: 116.6031 },
  PKX: { latitude: 39.5098, longitude: 116.4105 },
  PVG: { latitude: 31.1443, longitude: 121.8083 },
  SHA: { latitude: 31.1979, longitude: 121.3363 },
  CDG: { latitude: 49.0097, longitude: 2.5479 },
  ORY: { latitude: 48.7262, longitude: 2.3652 },
  LHR: { latitude: 51.47, longitude: -0.4543 },
  LGW: { latitude: 51.1537, longitude: -0.1821 },
  STN: { latitude: 51.885, longitude: 0.235 },
  LTN: { latitude: 51.8747, longitude: -0.3683 },
  LCY: { latitude: 51.5053, longitude: 0.0553 },
  ZRH: { latitude: 47.4581, longitude: 8.5555 },
  VCE: { latitude: 45.5053, longitude: 12.3519 },
  BCN: { latitude: 41.2974, longitude: 2.0833 },
  AMS: { latitude: 52.3105, longitude: 4.7683 },
  JFK: { latitude: 40.6413, longitude: -73.7781 },
  EWR: { latitude: 40.6895, longitude: -74.1745 },
  LGA: { latitude: 40.7769, longitude: -73.874 },
  MXP: { latitude: 45.6301, longitude: 8.7231 },
  LIN: { latitude: 45.4451, longitude: 9.2767 },
  BGY: { latitude: 45.6739, longitude: 9.7042 },
  ORD: { latitude: 41.9742, longitude: -87.9073 },
  MDW: { latitude: 41.7868, longitude: -87.7522 },
  IAD: { latitude: 38.9531, longitude: -77.4565 },
  DCA: { latitude: 38.8512, longitude: -77.0402 },
  BWI: { latitude: 39.1754, longitude: -76.6684 },
  LAX: { latitude: 33.9416, longitude: -118.4085 },
  SFO: { latitude: 37.6213, longitude: -122.379 },
  HNL: { latitude: 21.3187, longitude: -157.9225 },
  YYZ: { latitude: 43.6777, longitude: -79.6248 },
  SYD: { latitude: -33.9399, longitude: 151.1753 },
  AKL: { latitude: -37.0082, longitude: 174.785 },
};

export const AIRPORT_NAMES: Record<string, string> = {
  ICN: "인천국제공항", GMP: "김포국제공항", PUS: "김해국제공항", TAE: "대구국제공항",
  CJU: "제주국제공항", CJJ: "청주국제공항", MWX: "무안국제공항", YNY: "양양국제공항",
  HND: "하네다공항", NRT: "나리타국제공항", FUK: "후쿠오카공항", KIX: "간사이국제공항",
  ITM: "오사카국제공항", UKB: "고베공항", CTS: "신치토세공항", BKK: "수완나품공항",
  DMK: "돈므앙국제공항", SIN: "창이공항", TPE: "타오위안국제공항", TSA: "쑹산공항",
  HKG: "홍콩국제공항", PEK: "베이징 수도국제공항", PKX: "베이징 다싱국제공항",
  PVG: "상하이 푸둥국제공항", SHA: "상하이 훙차오국제공항", CDG: "샤를 드골공항",
  ORY: "오를리공항", LHR: "히스로공항", LGW: "개트윅공항", STN: "스탠스테드공항",
  LTN: "루턴공항", LCY: "런던 시티공항", JFK: "존 F. 케네디국제공항", EWR: "뉴어크 리버티국제공항",
  LGA: "라과디아공항", MXP: "밀라노 말펜사공항", LIN: "밀라노 리나테공항", BGY: "오리오 알 세리오공항",
  ORD: "오헤어국제공항", MDW: "미드웨이국제공항", IAD: "덜레스국제공항", DCA: "로널드 레이건 워싱턴공항",
  BWI: "볼티모어 워싱턴국제공항", ZRH: "취리히공항", VCE: "베네치아 마르코 폴로공항",
  BCN: "바르셀로나 엘프라트공항", AMS: "스키폴공항", LAX: "로스앤젤레스국제공항",
  SFO: "샌프란시스코국제공항", HNL: "호놀룰루국제공항", YYZ: "토론토 피어슨국제공항",
  SYD: "시드니공항", AKL: "오클랜드공항",
};

const group = (cityId: string, cityNames: string[], airports: string[], classification: CityAirportGroup["classification"], lowCost: string[] = []): CityAirportGroup => ({
  cityId,
  cityNames,
  arrivalAirportCandidates: airports,
  primaryAirport: airports[0] || "",
  classification,
  airportRoles: Object.fromEntries(airports.map((iata, index) => [iata, index === 0 ? "PRIMARY" : lowCost.includes(iata) ? "LOW_COST_ALTERNATIVE" : "SECONDARY"])),
});

export const CITY_AIRPORT_GROUPS: CityAirportGroup[] = [
  group("fukuoka", ["후쿠오카", "FUKUOKA"], ["FUK"], "SINGLE_AIRPORT_CITY"),
  group("tokyo", ["도쿄", "TOKYO"], ["HND", "NRT"], "MULTI_AIRPORT_CITY"),
  group("osaka", ["오사카", "OSAKA"], ["KIX", "ITM", "UKB"], "MULTI_AIRPORT_CITY"),
  group("kyoto", ["교토", "KYOTO"], ["KIX", "ITM", "UKB"], "MULTI_AIRPORT_CITY"),
  group("sapporo", ["삿포로", "SAPPORO"], ["CTS"], "SINGLE_AIRPORT_CITY"),
  group("seoul", ["서울", "SEOUL"], ["ICN", "GMP"], "MULTI_AIRPORT_CITY"),
  group("busan", ["부산", "BUSAN"], ["PUS"], "SINGLE_AIRPORT_CITY"),
  group("jeju", ["제주", "JEJU"], ["CJU"], "SINGLE_AIRPORT_CITY"),
  group("taipei", ["타이베이", "TAIPEI"], ["TPE", "TSA"], "MULTI_AIRPORT_CITY"),
  group("hong-kong", ["홍콩", "HONG KONG"], ["HKG"], "SINGLE_AIRPORT_CITY"),
  group("beijing", ["베이징", "BEIJING"], ["PEK", "PKX"], "MULTI_AIRPORT_CITY"),
  group("shanghai", ["상하이", "SHANGHAI"], ["PVG", "SHA"], "MULTI_AIRPORT_CITY"),
  group("xian", ["시안", "XI'AN", "XIAN"], ["XIY"], "UNVERIFIED_AIRPORT_GROUP"),
  group("chengdu", ["청두", "CHENGDU"], ["TFU", "CTU"], "UNVERIFIED_AIRPORT_GROUP"),
  group("ulaanbaatar", ["울란바토르", "ULAANBAATAR"], ["UBN"], "UNVERIFIED_AIRPORT_GROUP"),
  group("dalanzadgad", ["달란자드가드", "DALANZADGAD"], ["DLZ"], "UNVERIFIED_AIRPORT_GROUP"),
  group("singapore", ["싱가포르", "SINGAPORE"], ["SIN"], "SINGLE_AIRPORT_CITY"),
  group("bangkok", ["방콕", "BANGKOK"], ["BKK", "DMK"], "MULTI_AIRPORT_CITY", ["DMK"]),
  group("phuket", ["푸껫", "PHUKET"], ["HKT"], "UNVERIFIED_AIRPORT_GROUP"),
  group("chiang-mai", ["치앙마이", "CHIANG MAI"], ["CNX"], "UNVERIFIED_AIRPORT_GROUP"),
  group("da-nang", ["다낭", "DA NANG"], ["DAD"], "UNVERIFIED_AIRPORT_GROUP"),
  group("hanoi", ["하노이", "HANOI"], ["HAN"], "UNVERIFIED_AIRPORT_GROUP"),
  group("ho-chi-minh", ["호찌민", "HO CHI MINH"], ["SGN"], "UNVERIFIED_AIRPORT_GROUP"),
  group("bali", ["발리", "BALI"], ["DPS"], "UNVERIFIED_AIRPORT_GROUP"),
  group("dubai", ["두바이", "DUBAI"], ["DXB", "DWC"], "UNVERIFIED_AIRPORT_GROUP", ["DWC"]),
  group("abu-dhabi", ["아부다비", "ABU DHABI"], ["AUH"], "UNVERIFIED_AIRPORT_GROUP"),
  group("istanbul", ["이스탄불", "ISTANBUL"], ["IST", "SAW"], "UNVERIFIED_AIRPORT_GROUP", ["SAW"]),
  group("cappadocia", ["카파도키아", "CAPPADOCIA"], ["NAV", "ASR"], "UNVERIFIED_AIRPORT_GROUP"),
  group("antalya", ["안탈리아", "ANTALYA"], ["AYT"], "UNVERIFIED_AIRPORT_GROUP"),
  group("london", ["런던", "LONDON"], ["LHR", "LGW", "STN", "LTN", "LCY"], "MULTI_AIRPORT_CITY", ["STN", "LTN"]),
  group("rome", ["로마", "ROME"], ["FCO", "CIA"], "UNVERIFIED_AIRPORT_GROUP", ["CIA"]),
  group("interlaken", ["인터라켄", "INTERLAKEN"], [], "UNVERIFIED_AIRPORT_GROUP"),
  group("nice", ["니스", "NICE"], ["NCE"], "UNVERIFIED_AIRPORT_GROUP"),
  group("lyon", ["리옹", "LYON"], ["LYS"], "UNVERIFIED_AIRPORT_GROUP"),
  group("bordeaux", ["보르도", "BORDEAUX"], ["BOD"], "UNVERIFIED_AIRPORT_GROUP"),
  group("zurich", ["취리히", "ZURICH"], ["ZRH"], "SINGLE_AIRPORT_CITY"),
  group("lucerne", ["루체른", "LUCERNE"], [], "UNVERIFIED_AIRPORT_GROUP"),
  group("geneva", ["제네바", "GENEVA"], ["GVA"], "UNVERIFIED_AIRPORT_GROUP"),
  group("venice", ["베네치아", "VENICE"], ["VCE", "TSF"], "UNVERIFIED_AIRPORT_GROUP", ["TSF"]),
  group("florence", ["피렌체", "FLORENCE"], ["FLR"], "UNVERIFIED_AIRPORT_GROUP"),
  group("milan", ["밀라노", "MILAN"], ["MXP", "LIN", "BGY"], "MULTI_AIRPORT_CITY", ["BGY"]),
  group("edinburgh", ["에든버러", "EDINBURGH"], ["EDI"], "UNVERIFIED_AIRPORT_GROUP"),
  group("manchester", ["맨체스터", "MANCHESTER"], ["MAN"], "UNVERIFIED_AIRPORT_GROUP"),
  group("san-francisco", ["샌프란시스코", "SAN FRANCISCO"], ["SFO", "OAK", "SJC"], "UNVERIFIED_AIRPORT_GROUP", ["OAK"]),
  group("miami", ["마이애미", "MIAMI"], ["MIA", "FLL"], "UNVERIFIED_AIRPORT_GROUP", ["FLL"]),
  group("las-vegas", ["라스베이거스", "LAS VEGAS"], ["LAS"], "UNVERIFIED_AIRPORT_GROUP"),
  group("toronto", ["토론토", "TORONTO"], ["YYZ", "YTZ"], "UNVERIFIED_AIRPORT_GROUP"),
  group("montreal", ["몬트리올", "MONTREAL"], ["YUL"], "UNVERIFIED_AIRPORT_GROUP"),
  group("melbourne", ["멜버른", "MELBOURNE"], ["MEL", "AVV"], "UNVERIFIED_AIRPORT_GROUP", ["AVV"]),
  group("brisbane", ["브리즈번", "BRISBANE"], ["BNE"], "UNVERIFIED_AIRPORT_GROUP"),
  group("madrid", ["마드리드", "MADRID"], ["MAD"], "UNVERIFIED_AIRPORT_GROUP"),
  group("seville", ["세비야", "SEVILLE"], ["SVQ"], "UNVERIFIED_AIRPORT_GROUP"),
  group("barcelona", ["바르셀로나", "BARCELONA"], ["BCN"], "SINGLE_AIRPORT_CITY"),
  group("sydney", ["시드니", "SYDNEY"], ["SYD"], "SINGLE_AIRPORT_CITY"),
  group("auckland", ["오클랜드", "AUCKLAND"], ["AKL"], "SINGLE_AIRPORT_CITY"),
  group("queenstown", ["퀸스타운", "QUEENSTOWN"], ["ZQN"], "UNVERIFIED_AIRPORT_GROUP"),
  group("vancouver", ["밴쿠버", "VANCOUVER"], ["YVR"], "UNVERIFIED_AIRPORT_GROUP"),
  group("los-angeles", ["로스앤젤레스", "LOS ANGELES"], ["LAX", "BUR", "SNA", "LGB", "ONT"], "UNVERIFIED_AIRPORT_GROUP", ["BUR", "LGB"]),
  group("honolulu", ["호놀룰루", "HONOLULU"], ["HNL"], "SINGLE_AIRPORT_CITY"),
  group("amsterdam", ["암스테르담", "AMSTERDAM"], ["AMS"], "SINGLE_AIRPORT_CITY"),
  group("rotterdam", ["로테르담", "ROTTERDAM"], ["RTM"], "UNVERIFIED_AIRPORT_GROUP"),
  group("cairo", ["카이로", "CAIRO"], ["CAI", "SPX"], "UNVERIFIED_AIRPORT_GROUP", ["SPX"]),
  group("luxor", ["룩소르", "LUXOR"], ["LXR"], "UNVERIFIED_AIRPORT_GROUP"),
  group("aswan", ["아스완", "ASWAN"], ["ASW"], "UNVERIFIED_AIRPORT_GROUP"),
  group("sao-paulo", ["상파울루", "SAO PAULO"], ["GRU", "CGH", "VCP"], "UNVERIFIED_AIRPORT_GROUP"),
  group("rio", ["리우데자네이루", "RIO DE JANEIRO"], ["GIG", "SDU"], "UNVERIFIED_AIRPORT_GROUP"),
  group("johannesburg", ["요하네스버그", "JOHANNESBURG"], ["JNB", "HLA"], "UNVERIFIED_AIRPORT_GROUP", ["HLA"]),
  group("cape-town", ["케이프타운", "CAPE TOWN"], ["CPT"], "UNVERIFIED_AIRPORT_GROUP"),
  group("moscow", ["모스크바", "MOSCOW"], ["SVO", "DME", "VKO", "ZIA"], "UNVERIFIED_AIRPORT_GROUP"),
  group("saint-petersburg", ["상트페테르부르크", "SAINT PETERSBURG"], ["LED"], "UNVERIFIED_AIRPORT_GROUP"),
  group("irkutsk", ["이르쿠츠크", "IRKUTSK"], ["IKT"], "UNVERIFIED_AIRPORT_GROUP"),
  group("vladivostok", ["블라디보스토크", "VLADIVOSTOK"], ["VVO"], "UNVERIFIED_AIRPORT_GROUP"),
  group("paris", ["파리", "PARIS"], ["CDG", "ORY"], "MULTI_AIRPORT_CITY"),
  group("new-york", ["뉴욕", "NEW YORK"], ["JFK", "EWR", "LGA"], "MULTI_AIRPORT_CITY"),
];

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

const normalizeCityName = (city: string) => city.trim().toLocaleLowerCase();

export const getCityAirportGroup = (city: string): CityAirportGroup | null => {
  const normalized = normalizeCityName(city);
  return CITY_AIRPORT_GROUPS.find((candidate) =>
    candidate.cityId.toLocaleLowerCase() === normalized ||
    candidate.cityNames.some((name) => normalizeCityName(name) === normalized)
  ) ?? null;
};

export const getCanonicalArrivalAirportCandidates = (city: string): string[] => {
  const cityGroup = getCityAirportGroup(city);
  if (!cityGroup || cityGroup.classification === "UNVERIFIED_AIRPORT_GROUP") return [];
  return [...cityGroup.arrivalAirportCandidates].sort();
};

export const getAirportName = (iata: string): string => AIRPORT_NAMES[iata.toUpperCase()] ?? iata.toUpperCase();

export const getCityAirportIata = (city: string): string | null =>
  getCityAirportGroup(city)?.primaryAirport || CITY_AIRPORT_IATA[city] || null;

export function searchAirports(query: string): Airport[] {
  if (!query) return KOREA_AIRPORTS;
  const normalized = query.trim().toLowerCase();
  return KOREA_AIRPORTS.filter((airport) =>
    airport.name.toLowerCase().includes(normalized) ||
    airport.cityName.toLowerCase().includes(normalized) ||
    airport.iata.toLowerCase().includes(normalized)
  );
}
