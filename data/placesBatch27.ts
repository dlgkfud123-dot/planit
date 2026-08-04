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

export const batchTwentySevenPlaces: Place[] = [
  // ------------------ TOKYO EXPANSION PART 1 (70 PLACES) ------------------
  // LANDMARKS & VIEWPOINTS & NIGHT VIEWS
  q("tokyo-shibuya-sky_b27", "도쿄", "시부야 스카이", "landmark", 35.6585, 139.7013, 90, "evening", 2200, "시부야", ["전망", "야경", "viewpoint", "night_view", "photo_spot"], true),
  q("tokyo-roppongi-hills-view", "도쿄", "롯폰기 힐즈 도쿄 시티 뷰", "landmark", 35.6605, 139.7292, 90, "evening", 2000, "롯폰기", ["전망", "야경", "viewpoint", "night_view", "도심"], true),
  q("tokyo-shinjuku-gyoen_b27", "도쿄", "신주쿠 교엔", "nature", 35.6852, 139.7101, 100, "morning", 500, "신주쿠", ["공원", "산책", "park", "nature", "휴식"]),
  q("tokyo-meiji-jingu_b27", "도쿄", "메이지 신궁", "culture", 35.6764, 139.6993, 90, "morning", 0, "하라주쿠", ["신사", "shrine", "역사", "history", "산책"], true),
  q("tokyo-yoyogi-park_b27", "도쿄", "요요기 공원", "nature", 35.6717, 139.6949, 90, "afternoon", 0, "하라주쿠", ["공원", "park", "산책", "nature", "휴식"]),
  q("tokyo-ueno-park_b27", "도쿄", "우에노 온시 공원", "nature", 35.714, 139.7741, 100, "morning", 0, "우에노", ["공원", "park", "산책", "문화", "nature"]),
  q("tokyo-hama-rikyu_b27", "도쿄", "하마리큐 은사정원", "nature", 35.6602, 139.7637, 80, "afternoon", 300, "긴자", ["정원", "park", "전통정원", "nature", "산책"]),
  q("tokyo-meguro-river", "도쿄", "메구로강 산책로", "nature", 35.6457, 139.6987, 80, "evening", 0, "나카메구로", ["산책", "봄", "park", "photo_spot", "nature"]),
  q("tokyo-odaiba-seaside_b27", "도쿄", "오다이바 해변공원", "nature", 35.6294, 139.7758, 90, "evening", 0, "오다이바", ["해변", "야경", "night_view", "viewpoint", "beach"]),
  q("tokyo-toyosu-senkyaku", "도쿄", "토요스 센캬쿠 반라이", "market", 35.6468, 139.7825, 100, "afternoon", 2000, "토요스", ["온천", "해산물", "market", "미식", "체험"]),
  q("tokyo-zojoji", "도쿄", "조조지 사찰", "culture", 35.6574, 139.7482, 70, "morning", 0, "도쿄타워", ["사찰", "temple", "도쿄타워뷰", "photo_spot", "history"]),
  q("tokyo-hie-shrine", "도쿄", "히에 신사", "culture", 35.6747, 139.7404, 60, "morning", 0, "아카사카", ["신사", "shrine", "붉은토리이", "photo_spot", "history"]),
  q("tokyo-nezu-shrine", "도쿄", "네즈 신사", "culture", 35.7202, 139.7607, 70, "morning", 0, "야네센", ["신사", "shrine", "토리이길", "hidden_gem", "history"]),
  q("tokyo-imperial-palace-east", "도쿄", "도쿄 황거 동御苑", "nature", 35.6865, 139.7565, 90, "morning", 0, "도쿄역", ["황거", "정원", "park", "역사", "history"]),

  // CULTURE & MUSEUMS & MEDIA ART
  q("tokyo-teamlab-planets", "도쿄", "팀랩 플래닛 TOKYO", "culture", 35.6491, 139.7898, 120, "afternoon", 3800, "토요스", ["미디어아트", "art", "체험", "photo_spot", "museum"], true),
  q("tokyo-teamlab-borderless_b27", "도쿄", "팀랩 보더리스 아자부다이 힐즈", "culture", 35.6608, 139.7408, 120, "afternoon", 4200, "아자부다이", ["미디어아트", "art", "체험", "photo_spot", "museum"], true),
  q("tokyo-mori-art-museum", "도쿄", "모리 미술관", "culture", 35.6605, 139.7292, 100, "afternoon", 2000, "롯폰기", ["미술관", "art", "현대미술", "museum", "전시"]),
  q("tokyo-national-museum", "도쿄", "도쿄 국립박물관", "culture", 35.7188, 139.7765, 150, "morning", 1000, "우에노", ["박물관", "museum", "역사", "history", "문화"]),
  q("tokyo-nezu-museum_b27", "도쿄", "네즈 미술관", "culture", 35.6625, 139.7188, 90, "afternoon", 1400, "미나미아오야마", ["미술관", "art", "정원", "hidden_gem", "museum"]),
  q("tokyo-ghibli-museum_b27", "도쿄", "지브리 미술관", "culture", 35.6963, 139.5704, 120, "afternoon", 1000, "미타카", ["지브리", "museum", "애니메이션", "family", "체험"]),
  q("tokyo-yayoi-kusama-museum", "도쿄", "야요이 쿠사마 미술관", "culture", 35.7027, 139.7225, 90, "afternoon", 1100, "신주쿠", ["미술관", "art", "쿠사마야요이", "museum", "hidden_gem"]),
  q("tokyo-kabukiza", "도쿄", "가부키좌 극장", "culture", 35.6695, 139.7675, 90, "afternoon", 2000, "긴자", ["가부키", "전통공연", "culture", "역사", "history"]),

  // FOOD - RAMEN, SUSHI, YAKINIKU, TONKATSU, TEMPURA
  q("tokyo-afuri-harajuku_b27", "도쿄", "아후리 라멘 하라주쿠", "food", 35.6713, 139.7032, 60, "afternoon", 1200, "하라주쿠", ["라멘", "ramen", "유주시오라멘", "미식", "local"]),
  q("tokyo-fuunji-shinjuku", "도쿄", "후운지 츠케멘", "food", 35.6874, 139.6978, 60, "afternoon", 1100, "신주쿠", ["라멘", "ramen", "츠케멘", "미식", "local_gem"]),
  q("tokyo-ginza-kagari", "도쿄", "긴자 카가리 본점", "food", 35.6716, 139.7628, 60, "evening", 1300, "긴자", ["라멘", "ramen", "토리파이탄", "미식", "local"]),
  q("tokyo-rokurinsha-tokyo-station", "도쿄", "로쿠린샤 도쿄역점", "food", 35.6812, 139.7671, 60, "morning", 1100, "도쿄역", ["라멘", "ramen", "츠케멘", "미식", "도쿄역"]),
  q("tokyo-kyushu-jangara-akiba", "도쿄", "큐슈 장가라 라멘 아키하바라", "food", 35.7003, 139.7715, 60, "afternoon", 1100, "아키하바라", ["라멘", "ramen", "돈코츠라멘", "미식", "local"]),
  q("tokyo-mutekiya-ikebukuro", "도쿄", "무테키야 이케부쿠로", "food", 35.7275, 139.7118, 60, "evening", 1300, "이케부쿠로", ["라멘", "ramen", "돈코츠라멘", "미식", "local"]),
  q("tokyo-sushizanmai-tsukiji", "도쿄", "스시잔마이 본점 츠키지", "food", 35.6655, 139.7708, 70, "morning", 3000, "츠키지", ["스시", "sushi", "참치스시", "미식", "local"]),
  q("tokyo-sushi-dai-toyosu", "도쿄", "스시대이 토요스시장", "food", 35.6453, 139.7828, 80, "morning", 4500, "토요스", ["스시", "sushi", "오마카세", "미식", "local_gem"]),
  q("tokyo-sushi-midori-shibuya", "도쿄", "스시노미도리 시부야점", "food", 35.6585, 139.7008, 70, "afternoon", 3000, "시부야", ["스시", "sushi", "가성비스시", "미식", "local"]),
  q("tokyo-yoroniku-minamiaoyama", "도쿄", "요로니쿠 미나미아오야마", "food", 35.6612, 139.7164, 90, "evening", 12000, "아오야마", ["야키니쿠", "yakiniku", "고급야키니쿠", "미식", "couple"]),
  q("tokyo-jojoen-roppongi", "도쿄", "조조엔 롯폰기 본점", "food", 35.6628, 139.7323, 90, "evening", 10000, "롯폰기", ["야키니쿠", "yakiniku", "우설", "미식", "luxury"]),
  q("tokyo-gyukatsu-motomura-shinjuku", "도쿄", "규카츠 모토무라 신주쿠남구점", "food", 35.6892, 139.7025, 70, "afternoon", 1800, "신주쿠", ["규카츠", "yakiniku", "일식", "미식", "local"]),
  q("tokyo-tonkatsu-maisen-aoyama", "도쿄", "돈카츠 마이센 아오야마 본점", "food", 35.6662, 139.7118, 70, "afternoon", 2200, "아오야마", ["돈카츠", "tonkatsu", "일식", "미식", "local"]),
  q("tokyo-tempura-tsunahachi-shinjuku", "도쿄", "덴뿌라 츠나하치 신주쿠 본점", "food", 35.6908, 139.7028, 80, "evening", 3500, "신주쿠", ["튀김", "tempura", "일식", "미식", "history"]),
  q("tokyo-ningyocho-imahan", "도쿄", "닝교초 이마한 스키야키 본점", "food", 35.6853, 139.7842, 90, "evening", 11000, "닝교초", ["스키야키", "sukiyaki", "일식", "미식", "history"]),
  q("tokyo-unagi-nodaiwa-azabu", "도쿄", "노다이와 장어덮밥 아자부 본점", "food", 35.6575, 139.7431, 80, "afternoon", 5500, "아자부주반", ["장어덮밥", "unagi", "일식", "미식", "history"]),

  // FOOD - IZAKAYA, BARS, NIGHT LIFE
  q("tokyo-omoide-yokocho", "도쿄", "신주쿠 오모이데 요코초", "food", 35.6928, 139.6994, 90, "evening", 3000, "신주쿠", ["이자카야", "izakaya", "꼬치구이", "night_life", "local"]),
  q("tokyo-golden-gai_b27", "도쿄", "신주쿠 골든가이", "food", 35.6942, 139.7047, 90, "evening", 3500, "신주쿠", ["바", "bar", "술집", "night_life", "hidden_gem"]),
  q("tokyo-ebisu-yokocho", "도쿄", "에비스 요코초", "food", 35.6468, 139.7108, 90, "evening", 3500, "에비스", ["이자카야", "izakaya", "포장마차", "night_life", "local"]),
  q("tokyo-shinbashi-guard-izakaya", "도쿄", "신바시 가드 아래 이자카야 거리", "food", 35.6664, 139.7583, 90, "evening", 3000, "신바시", ["이자카야", "izakaya", "선술집", "night_life", "local"]),
  q("tokyo-shibuya-oiran", "도쿄", "시부야 오이란 네오이자카야", "food", 35.6598, 139.6965, 90, "evening", 3500, "시부야", ["이자카야", "izakaya", "음악바", "bar", "night_life"]),

  // CAFES, COFFEE & DESSERTS
  q("tokyo-blue-bottle-kiyosumi_b27", "도쿄", "블루보틀 커피 키요스미 시라카와", "food", 35.6805, 139.8005, 70, "morning", 800, "키요스미시라카와", ["카페", "coffee", "스페셜티", "bakery", "local"]),
  q("tokyo-fuglen-yoyogi", "도쿄", "푸글렌 도쿄 도가야", "food", 35.6688, 139.6917, 70, "morning", 900, "요요기", ["카페", "coffee", "북유럽카페", "bakery", "local_gem"]),
  q("tokyo-coffee-supreme-shibuya", "도쿄", "커피 슈프림 시부야", "food", 35.6645, 139.6922, 60, "morning", 800, "카미야마초", ["카페", "coffee", "스페셜티", "bakery", "local"]),
  q("tokyo-glitch-coffee-jimbocho", "도쿄", "글리치 커피 진보초 본점", "food", 35.6958, 139.7588, 70, "afternoon", 1000, "진보초", ["카페", "coffee", "드립커피", "roastery", "hidden_gem"]),
  q("tokyo-cafe-de-lambre", "도쿄", "카페 드 람브르 긴자", "food", 35.6702, 139.7618, 70, "afternoon", 1100, "긴자", ["카페", "coffee", "드립커피", "history", "retro"]),
  q("tokyo-koffee-mameya_b27", "도쿄", "커피 마메야 오모테산도", "food", 35.6678, 139.7092, 60, "afternoon", 1200, "오모테산도", ["카페", "coffee", "원두전문점", "roastery", "hidden_gem"]),
  q("tokyo-about-life-coffee", "도쿄", "어바웃 라이프 커피 로스터스 도겐자카", "food", 35.6582, 139.6961, 50, "morning", 700, "시부야", ["카페", "coffee", "에스프레소바", "roastery", "local"]),
  q("tokyo-cafe-kitsune-aoyama", "도쿄", "카페 키츠네 미나미아오야마", "food", 35.6642, 139.7142, 70, "afternoon", 1100, "아오야마", ["카페", "coffee", "디저트", "dessert", "photo_spot"]),
  q("tokyo-pierre-herme-aoyama", "도쿄", "피에르 에르메 파리 아오야마", "food", 35.6648, 139.7115, 70, "afternoon", 2000, "아오야마", ["디저트", "dessert", "마카롱", "bakery", "luxury"]),
  q("tokyo-suzukien-asakusa", "도쿄", "스즈키엔 아사쿠사 말차 제라토", "food", 35.7162, 139.7962, 50, "afternoon", 600, "아사쿠사", ["디저트", "dessert", "말차", "제라토", "local"]),
  q("tokyo-shirohige-cream-puff", "도쿄", "시로히게 토토로 슈크림 공방", "food", 35.6608, 139.6642, 60, "afternoon", 700, "시모키타자와", ["디저트", "dessert", "지브리", "bakery", "photo_spot"]),
  q("tokyo-turret-coffee-tsukiji", "도쿄", "터렛 커피 츠키지", "food", 35.6671, 139.7712, 50, "morning", 700, "츠키지", ["카페", "coffee", "에스프레소", "roastery", "local"]),
  q("tokyo-leaves-coffee-roasters", "도쿄", "리브스 커피 로스터스 쿠라마에", "food", 35.7032, 139.7915, 60, "afternoon", 900, "쿠라마에", ["카페", "coffee", "로스터리", "roastery", "hidden_gem"]),

  // SHOPPING - MALLS, VINTAGE, FASHION, MARKET
  q("tokyo-shibuya-scramble-square", "도쿄", "시부야 스크램블 스퀘어", "shopping", 35.6585, 139.7013, 100, "afternoon", 4000, "시부야", ["쇼핑", "shopping", "쇼핑몰", "디저트", "트렌드"]),
  q("tokyo-miyashita-park", "도쿄", "미야시타 파크", "shopping", 35.6622, 139.7022, 90, "afternoon", 3000, "시부야", ["쇼핑", "shopping", "옥상공원", "트렌드", "photo_spot"]),
  q("tokyo-ginza-six_b27", "도쿄", "긴자 식스 GINZA SIX", "shopping", 35.6696, 139.764, 100, "afternoon", 5000, "긴자", ["쇼핑", "shopping", "명품", "luxury_shopping", "건축"]),
  q("tokyo-dover-street-market", "도쿄", "도버 스트리트 마켓 긴자", "shopping", 35.6698, 139.7635, 90, "afternoon", 6000, "긴자", ["쇼핑", "shopping", "편집숍", "패션", "luxury_shopping"]),
  q("tokyo-isetan-shinjuku", "도쿄", "이세탄 백화점 신주쿠 본점", "shopping", 35.6916, 139.7046, 100, "afternoon", 5000, "신주쿠", ["쇼핑", "shopping", "백화점", "명품", "luxury_shopping"]),
  q("tokyo-harajuku-cat-street", "도쿄", "하라주쿠 캣스트리트", "shopping", 35.6668, 139.7058, 90, "afternoon", 3000, "하라주쿠", ["쇼핑", "shopping", "스트리트패션", "편집숍", "photo_spot"]),
  q("tokyo-beams-harajuku", "도쿄", "빔즈 하라주쿠 본점", "shopping", 35.6705, 139.7062, 60, "afternoon", 4000, "하라주쿠", ["쇼핑", "shopping", "편집숍", "패션", "local"]),
  q("tokyo-shimokitazawa-vintage", "도쿄", "시모키타자와 빈티지 옷길", "shopping", 35.6617, 139.6672, 100, "afternoon", 3000, "시모키타자와", ["빈티지", "shopping", "구제숍", "local_gem", "youth"]),
  q("tokyo-akihabara-radio-kaikan", "도쿄", "아키하바라 라디오 회관", "shopping", 35.6982, 139.7718, 90, "afternoon", 3000, "아키하바라", ["애니메이션", "shopping", "피규어", "서브컬처", "local"]),
  q("tokyo-kiddy-land-harajuku", "도쿄", "키디랜드 하라주쿠점", "shopping", 35.6675, 139.7065, 70, "afternoon", 2000, "하라주쿠", ["캐릭터", "shopping", "굿즈", "family", "photo_spot"]),
  q("tokyo-tsukiji-outer-market", "도쿄", "츠키지 장외시장", "market", 35.6654, 139.7706, 90, "morning", 2500, "츠키지", ["시장", "market", "해산물", "길거리음식", "미식"]),
  q("tokyo-nakamise-asakusa", "도쿄", "아사쿠사 나카미세 상점가", "market", 35.7118, 139.7963, 80, "morning", 1500, "아사쿠사", ["시장", "market", "전통간식", "기념품", "history"]),

  // ------------------ OSAKA EXPANSION PART 1 (50 PLACES) ------------------
  q("osaka-shibuya-sky-alt", "오사카", "오사카 중앙공회당", "culture", 34.6934, 135.5038, 70, "afternoon", 0, "나카노시마", ["근대건축", "culture", "역사", "photo_spot", "history"]),
  q("osaka-nakanoshima-museum", "오사카", "나카노시마 미술관", "culture", 34.6917, 135.4925, 100, "afternoon", 1800, "나카노시마", ["미술관", "art", "현대미술", "museum", "건축"]),
  q("osaka-grand-front", "오사카", "그랜드 프론트 오사카", "shopping", 34.7045, 135.4955, 100, "afternoon", 3000, "우메다", ["쇼핑", "shopping", "쇼핑몰", "디저트", "실내"]),
  q("osaka-lucua", "오사카", "루쿠아 오사카 LUCUA", "shopping", 34.7025, 135.4958, 100, "afternoon", 3000, "우메다", ["쇼핑", "shopping", "패션", "디저트", "실내"]),
  q("osaka-hep-five", "오사카", "헵파이브 대관람차", "landmark", 34.7035, 135.5005, 60, "evening", 600, "우메다", ["관람차", "전망", "야경", "night_view", "landmark"]),
  q("osaka-shinsaibashi-suji", "오사카", "신사이바시스지 상점가", "shopping", 34.6732, 135.5008, 100, "afternoon", 3000, "신사이바시", ["쇼핑", "shopping", "상점가", "드럭스토어", "local"]),
  q("osaka-america-mura", "오사카", "아메리카무라", "shopping", 34.6722, 135.4983, 90, "afternoon", 2000, "신사이바시", ["스트리트패션", "shopping", "빈티지", "youth", "photo_spot"]),
  q("osaka-horie-orange-street", "오사카", "호리에 오렌지 스트리트", "shopping", 34.6712, 135.4942, 90, "afternoon", 3000, "호리에", ["편집숍", "shopping", "가구", "패션", "local_gem"]),
  q("osaka-nipponbashi-den-den", "오사카", "덴덴타운 덴폰바시", "shopping", 34.6605, 135.5058, 90, "afternoon", 2000, "닛폰바시", ["피규어", "shopping", "애니메이션", "서브컬처", "local"]),
  q("osaka-namba-parks", "오사카", "난바 파크스", "shopping", 34.6618, 135.5015, 100, "afternoon", 3000, "난바", ["옥상정원", "shopping", "쇼핑몰", "건축", "family"]),

  // FOOD - RAMEN, OKONOMIYAKI, KUSHIKATSU, TAKOYAKI
  q("osaka-ichiran-dotonbori", "오사카", "이치란 라멘 도톤보리점", "food", 34.6688, 135.5025, 60, "evening", 1100, "도톤보리", ["라멘", "ramen", "돈코츠라멘", "미식", "local"]),
  q("osaka-kinryu-ramen", "오사카", "킨류 라멘 도톤보리", "food", 34.6685, 135.5028, 50, "evening", 900, "도톤보리", ["라멘", "ramen", "길거리음식", "미식", "local"]),
  q("osaka-hanaroju-okonomiyaki", "오사카", "치보 오코노미야키 도톤보리 본점", "food", 34.6682, 135.5032, 70, "evening", 2000, "도톤보리", ["오코노미야키", "okonomiyaki", "향토음식", "미식", "local"]),
  q("osaka-ajinoya", "오사카", "아지노야 오코노미야키", "food", 34.6675, 135.5005, 70, "afternoon", 1800, "난바", ["오코노미야키", "okonomiyaki", "야키소바", "미식", "local_gem"]),
  q("osaka-kushikatsu-daruma-dotonbori", "오사카", "쿠시카츠 다루마 도톤보리점", "food", 34.6686, 135.5018, 70, "evening", 2200, "도톤보리", ["쿠시카츠", "kushikatsu", "튀김", "미식", "local"]),
  q("osaka-wanaka-takoyaki", "오사카", "타코야키 완나카 센니치마에 본점", "food", 34.6665, 135.5025, 40, "afternoon", 600, "난바", ["타코야키", "takoyaki", "간식", "미식", "local"]),
  q("osaka-kukuru-takoyaki", "오사카", "쿠쿠루 타코야키 도톤보리 본점", "food", 34.6687, 135.5018, 40, "afternoon", 800, "도톤보리", ["타코야키", "takoyaki", "간식", "미식", "local"]),
  q("osaka-yasubei-yakiniku", "오사카", "야키니쿠 아지요시 센니치마에", "food", 34.6668, 135.5035, 80, "evening", 4500, "난바", ["야키니쿠", "yakiniku", "소고기", "미식", "local"]),
  q("osaka-sushi-gin", "오사카", "스시 긴 츠루하시", "food", 34.6652, 135.5305, 70, "afternoon", 3000, "츠루하시", ["스시", "sushi", "로컬스시", "미식", "hidden_gem"]),
  q("osaka-moeyo-mensuke", "오사카", "모에요 멘스케 오리라멘", "food", 34.6975, 135.4965, 60, "afternoon", 1200, "후쿠시마", ["라멘", "ramen", "오리라멘", "미식", "local_gem"]),

  // FOOD - CAFES, DESSERTS & IZAKAYA
  q("osaka-brooklyn-roasting-nkitahama", "오사카", "브루클린 로스팅 컴퍼니 기타하마", "food", 34.6912, 135.5065, 70, "morning", 900, "기타하마", ["카페", "coffee", "강변카페", "bakery", "viewpoint"]),
  q("osaka-moto-coffee", "오사카", "모토 커피 기타하마", "food", 34.6915, 135.5068, 70, "afternoon", 900, "기타하마", ["카페", "coffee", "강변테라스", "dessert", "photo_spot"]),
  q("osaka-tachinomi-jinbei", "오사카", "다치노미 진베이 닌고초", "food", 34.7012, 135.4988, 80, "evening", 2500, "우메다", ["서서마시는술집", "izakaya", "해산물", "night_life", "local"]),
  q("osaka-ura-namba-izakaya", "오사카", "우라난바 골목 이자카야", "food", 34.6652, 135.5032, 90, "evening", 3000, "난바", ["이자카야", "izakaya", "골목술집", "night_life", "hidden_gem"]),
  q("osaka-rikuro-ojisan", "오사카", "리쿠로 오지산 치즈케이크 난바 본점", "food", 34.6668, 135.5012, 40, "afternoon", 900, "난바", ["디저트", "dessert", "치즈케이크", "bakery", "local"]),
  q("osaka-gram-pancake", "오사카", "그램 수플레 팬케이크 신사이바시", "food", 34.6738, 135.5012, 60, "afternoon", 1400, "신사이바시", ["디저트", "dessert", "수플레", "bakery", "photo_spot"])
];
