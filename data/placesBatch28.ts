import type { Place, PlaceCategory } from "./places";

const q = (
  id: string,
  cityId: string,
  name: string,
  category: PlaceCategory,
  latitude: number,
  longitude: number,
  duration: number,
  time: string,
  cost: number,
  district: string,
  tags: string[],
  core = false,
  nearby = false,
  hints: string[] = ["대중교통", "도보"]
): Place => ({
  id,
  cityId,
  name,
  category,
  latitude,
  longitude,
  recommendedDuration: duration,
  recommendedTime: (["morning", "afternoon", "evening", "any"].includes(time)
    ? time
    : time === "breakfast"
    ? "morning"
    : time === "dinner" || time === "night"
    ? "evening"
    : "afternoon") as Place["recommendedTime"],
  estimatedCost: cost,
  description: `${district}의 분위기와 ${tags.slice(0, 2).join("·")} 경험을 함께 즐기는 실제 여행 장소`,
  openingHours: "운영시간과 휴무일 변동 가능 · 방문 전 공식 안내 확인",
  tags,
  isCoreLandmark: core,
  district,
  nearbyTrip: nearby,
  transportHints: hints,
  estimateStatus: cost === 0 ? "free" : "estimated",
});

export const batchTwentyEightPlaces: Place[] = [
q("tokyo-shibuya-parco_b28", "도쿄", "시부야 파르코", "shopping", 35.662, 139.6987, 90, "afternoon", 4000, "시부야", ["쇼핑", "shopping", "닌텐도샵", "포켓몬센터", "youth"]),
q("tokyo-tokyu-hands-shinjuku", "도쿄", "도큐핸즈 신주쿠점", "shopping", 35.6888, 139.7018, 80, "afternoon", 3000, "신주쿠", ["쇼핑", "shopping", "잡화", "기념품", "local"]),
q("tokyo-takashimaya-times", "도쿄", "타카시마야 타임스퀘어", "shopping", 35.6885, 139.7012, 90, "afternoon", 4000, "신주쿠", ["쇼핑", "shopping", "백화점", "디저트", "luxury_shopping"]),
q("tokyo-ginza-itoya", "도쿄", "긴자 이토야 문구점", "shopping", 35.6722, 139.7652, 70, "afternoon", 2000, "긴자", ["문구", "shopping", "디자인", "history", "local_gem"]),
q("tokyo-mitsukoshi-ginza", "도쿄", "긴자 미츠코시 백화점", "shopping", 35.6712, 139.765, 90, "afternoon", 5000, "긴자", ["백화점", "shopping", "명품", "luxury_shopping", "history"]),
q("tokyo-matsuya-ginza_b28", "도쿄", "긴자 마츠야 백화점", "shopping", 35.6728, 139.7662, 90, "afternoon", 4000, "긴자", ["백화점", "shopping", "패션", "luxury_shopping", "local"]),
q("tokyo-yodobashi-akiba", "도쿄", "요도바시 카메라 아키하바라", "shopping", 35.6988, 139.7745, 90, "afternoon", 5000, "아키하바라", ["전자제품", "shopping", "피규어", "가전", "local"]),
q("tokyo-animate-ikebukuro", "도쿄", "애니메이트 이케부쿠로 본점", "shopping", 35.7315, 139.7155, 90, "afternoon", 3000, "이케부쿠로", ["애니메이션", "shopping", "굿즈", "서브컬처", "youth"]),
q("tokyo-nakano-broadway", "도쿄", "나카노 브로드웨이", "shopping", 35.7092, 139.6658, 100, "afternoon", 3000, "나카노", ["빈티지장난감", "shopping", "피규어", "hidden_gem", "subculture"]),
q("tokyo-roppongi-midtown", "도쿄", "도쿄 미드타운 롯폰기", "shopping", 35.6658, 139.7312, 90, "afternoon", 4000, "롯폰기", ["쇼핑몰", "shopping", "정원", "디자인", "luxury_shopping"]),
q("tokyo-koenji-thrift", "도쿄", "고엔지 빈티지 구제거리", "shopping", 35.7048, 139.6498, 90, "afternoon", 2500, "고엔지", ["구제숍", "shopping", "빈티지", "local_gem", "youth"]),
q("tokyo-mensho-tokyo", "도쿄", "멘쇼 도쿄 라멘", "food", 35.7078, 139.7525, 60, "evening", 1200, "고라쿠엔", ["라멘", "ramen", "양고기라멘", "미식", "hidden_gem"]),
q("tokyo-oreryu-shio-ramen", "도쿄", "오레류 시오라멘 시부야", "food", 35.6592, 139.6982, 60, "evening", 1000, "시부야", ["라멘", "ramen", "시오라멘", "미식", "local"]),
q("tokyo-sushi-no-kura", "도쿄", "스시 쿠라 긴자", "food", 35.6708, 139.7632, 80, "evening", 6500, "긴자", ["스시", "sushi", "오마카세", "미식", "couple"]),
q("tokyo-katsu-midori-seibu", "도쿄", "회전스시 카츠 세이부 이케부쿠로", "food", 35.7288, 139.7112, 70, "afternoon", 2500, "이케부쿠로", ["스시", "sushi", "회전스시", "미식", "local"]),
q("tokyo-isomaru-suisan-shinjuku", "도쿄", "이소마루 수산 신주쿠", "food", 35.6912, 139.7018, 80, "evening", 3000, "신주쿠", ["이자카야", "izakaya", "해산물구이", "night_life", "local"]),
q("tokyo-torikizoku-shibuya", "도쿄", "토리키조쿠 시부야점", "food", 35.6598, 139.7002, 70, "evening", 2000, "시부야", ["이자카야", "izakaya", "야키토리", "night_life", "youth"]),
q("tokyo-hub-roppongi", "도쿄", "HUB 롯폰기 펍", "food", 35.6632, 139.7328, 80, "evening", 2500, "롯폰기", ["바", "bar", "영국식펍", "night_life", "solo"]),
q("tokyo-harlem-shuffle", "도쿄", "시모키타자와 뮤직바", "food", 35.6622, 139.6685, 80, "evening", 3000, "시모키타자와", ["바", "bar", "재즈바", "night_life", "hidden_gem"]),
q("tokyo-sumida-hokusai-museum", "도쿄", "스미다 호쿠사이 미술관", "culture", 35.6962, 139.7992, 90, "afternoon", 1000, "료고쿠", ["미술관", "art", "우키요에", "museum", "history"]),
q("tokyo-edo-architecture-museum", "도쿄", "에도도쿄 야외건축박물관", "culture", 35.7162, 139.5125, 120, "morning", 400, "코가네이", ["야외박물관", "museum", "역사건축", "history", "hidden_gem"]),
q("tokyo-tokyo-city-view", "도쿄", "도쿄 타워 메인데크 전망대", "landmark", 35.6586, 139.7454, 80, "evening", 1200, "도쿄타워", ["전망대", "viewpoint", "야경", "night_view", "landmark"], true),
q("tokyo-skytree-tembo", "도쿄", "도쿄 스카이트리 텐보데크", "landmark", 35.7101, 139.8107, 100, "evening", 2100, "아사쿠사", ["전망대", "viewpoint", "야경", "night_view", "landmark"], true),
q("tokyo-rainbow-bridge-walk", "도쿄", "보행자용 레인보우 브릿지 워크", "landmark", 35.6365, 139.7632, 80, "afternoon", 0, "오다이바", ["다리", "viewpoint", "야경", "night_view", "photo_spot"]),
q("kyoto-kinkakuji", "교토", "금각사 (로쿠온지)", "culture", 35.0394, 135.7292, 90, "morning", 500, "킨카쿠지", ["사찰", "temple", "유네스코", "history", "photo_spot"], true),
q("kyoto-ginkakuji", "교토", "은각사 (지쇼지)", "culture", 35.0272, 135.7982, 80, "morning", 500, "히가시야마", ["사찰", "temple", "모래정원", "history", "nature"], true),
q("kyoto-kiyomizudera", "교토", "청수사 (키요미즈데라)", "culture", 34.9949, 135.785, 100, "morning", 400, "히가시야마", ["사찰", "temple", "유네스코", "history", "viewpoint"], true),
q("kyoto-fushimi-inari", "교토", "후시미 이나리 대샤", "culture", 34.9671, 135.7727, 110, "morning", 0, "후시미", ["신사", "shrine", "센본토리이", "photo_spot", "history"], true),
q("kyoto-arashiyama-bamboo", "교토", "아라시야마 대나무 숲길", "nature", 35.0172, 135.6713, 90, "morning", 0, "아라시야마", ["대나무숲", "nature", "산책", "park", "photo_spot"], true),
q("kyoto-togetsukyo", "교토", "도게츠교 다리", "nature", 35.0128, 135.6778, 60, "afternoon", 0, "아라시야마", ["다리", "nature", "풍경", "viewpoint", "산책"]),
q("kyoto-tenryuji", "교토", "텐류지 사찰 정원", "culture", 35.0158, 135.6777, 80, "morning", 500, "아라시야마", ["사찰정원", "temple", "유네스코", "history", "nature"]),
q("kyoto-nijojo", "교토", "니조성", "culture", 35.0142, 135.7482, 100, "afternoon", 800, "니조", ["성곽", "history", "유네스코", "휘파람복도", "culture"], true),
q("kyoto-gion-shijo", "교토", "기온 거리와 하나미코지", "culture", 35.0037, 135.7748, 90, "evening", 0, "기온", ["전통거리", "history", "게이샤거리", "photo_spot", "local"]),
q("kyoto-yasaka-shrine", "교토", "야사카 신사", "culture", 35.0036, 135.7785, 70, "evening", 0, "기온", ["신사", "shrine", "야경", "night_view", "history"]),
q("kyoto-philosophers-path", "교토", "철학의 길", "nature", 35.0215, 135.7947, 90, "morning", 0, "히가시야마", ["산책로", "nature", "운하", "park", "hidden_gem"])
];
