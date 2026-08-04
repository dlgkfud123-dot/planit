import type { Place, PlaceCategory } from "./places";

const p = (
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
  description: `${district}의 대표 취향 요소인 ${tags.slice(0, 2).join("·")}을 즐길 수 있는 실제 검증된 장소`,
  openingHours: "운영시간과 휴무일 변동 가능 · 방문 전 공식 안내 확인",
  tags,
  isCoreLandmark: core,
  district,
  nearbyTrip: nearby,
  transportHints: hints,
  estimateStatus: cost === 0 ? "free" : "estimated",
});

export const batchThirtyTwoPlaces: Place[] = [
  // ==========================================
  // 1. 상하이 (Shanghai)
  // ==========================================
  p("sha-jia-jia-tang-bao", "상하이", "가가가탕포 성젠바오", "food", 31.2348, 121.4688, 50, "morning", 35, "인민광장", ["업장","로컬식당","샤오롱바오","탕포","local_gem"]),
  p("sha-da-fu-hao-shengjian", "상하이", "대부호 성젠바오", "food", 31.2285, 121.4498, 40, "morning", 25, "정안사", ["업장","로컬식당","성젠바오","local_gem"]),
  p("sha-fu-1039-shanghai", "상하이", "푸 1039", "food", 31.2198, 121.4328, 90, "evening", 250, "우원로", ["업장","로컬식당","상하이요리","nofo_eatery"]),
  p("sha-chun-feng-song-yue-lou", "상하이", "춘풍송월루", "food", 31.2268, 121.4912, 60, "morning", 40, "예원", ["업장","로컬식당","만두","채식","history"]),
  p("sha-old-jesse-huaihai", "상하이", "올드 제시", "food", 31.2158, 121.4482, 80, "evening", 180, "조계지", ["업장","로컬식당","상하이요리","local_gem"]),
  p("sha-pushers-coffee-wukang", "상하이", "푸셔스 커피", "food", 31.2058, 121.4408, 50, "afternoon", 45, "우캉루", ["업장","골목카페","specialty_coffee","photo_spot"]),
  p("sha-basdban-bakery-xiangyang", "상하이", "바스드반 베이커리", "food", 31.2128, 121.4552, 60, "morning", 60, "조계지", ["업장","베이커리","bakery","youth"]),
  p("sha-nook-coffee-yuyuan", "상하이", "누크 커피", "food", 31.2208, 121.4358, 50, "afternoon", 40, "우원로", ["업장","골목카페","specialty_coffee","hidden_gem"]),
  p("sha-fuxing-park-green", "상하이", "복흥공원 산책로", "nature", 31.2172, 121.4658, 70, "afternoon", 0, "조계지", ["자연","공원","산책","조계지"]),
  p("sha-tin-zitan-craft-market", "상하이", "타이캉루 전티엔팡 공예 골목", "market", 31.2082, 121.4682, 90, "afternoon", 0, "타이캉루", ["거리","공예","쇼핑","retro_alley"]),
  p("sha-vUE-bar-hyatt-bund", "상하이", "VUE 바", "food", 31.2468, 121.4892, 90, "evening", 180, "와이탄", ["업장","루프탑바","rooftop_bar","night_view"]),
  p("sha-shake-shanghai-soul", "상하이", "셰이크 재즈클럽", "culture", 31.2212, 121.4568, 100, "evening", 200, "조계지", ["업장","재즈바","jazz_bar","live_music"]),
  p("sha-ziwu-modern-bookstore", "상하이", "자오우 디자인 서점", "culture", 31.1852, 121.4628, 80, "afternoon", 0, "서외탄", ["업장","독립서점","indie_bookstore","design"]),
  p("sha-tank-shanghai-art", "상하이", "TANK 상하이 현대미술관", "culture", 31.1808, 121.4602, 90, "afternoon", 80, "서외탄", ["업장","미술관","gallery","modern_art"]),
  p("sha-shanghai-old-street", "상하이", "상하이 올드 스트리트", "market", 31.2255, 121.4925, 80, "afternoon", 0, "예원", ["거리","상점가","history","local_market"]),

  // ==========================================
  // 2. 베이징 (Beijing)
  // ==========================================
  p("pek-siji-minfu-forbidden", "베이징", "사기민복 베이징덕 자금성점", "food", 39.9142, 116.4028, 90, "evening", 180, "자금성", ["업장","베이징덕","nofo_eatery","local_gem"]),
  p("pek-yingshuang-zhajiangmian", "베이징", "형상 자장면", "food", 39.8972, 116.3918, 50, "afternoon", 35, "전문", ["업장","로컬식당","자장면","nofo_eatery"]),
  p("pek-du-yi-chu-shaomai", "베이징", "두일처 샤오마이", "food", 39.8968, 116.3932, 60, "afternoon", 60, "전문", ["업장","로컬식당","샤오마이","history"]),
  p("pek-metal-hands-beixinqiao", "베이징", "메탈 핸즈 북신교점", "food", 39.9418, 116.4182, 60, "morning", 55, "후통", ["업장","후통카페","specialty_coffee","local_gem"]),
  p("pek-sansheng-tea-hutong", "베이징", "삼생 찻집", "culture", 39.9388, 116.4052, 70, "afternoon", 100, "후통", ["업장","전통찻집","traditional_tea","history"]),
  p("pek-wudaoying-craft-hutong", "베이징", "오도영 후통 공예 상점가", "market", 39.9480, 116.4165, 80, "afternoon", 0, "후통", ["거리","후통산책","retro_alley","shopping"]),
  p("pek-yangmeizhu-byway", "베이징", "양매죽사제 아티스트 골목", "culture", 39.8958, 116.3902, 70, "afternoon", 0, "전문", ["거리","후통산책","art","retro_alley"]),
  p("pek-today-art-museum", "베이징", "투데이 아트 뮤지엄", "culture", 39.9008, 116.4608, 90, "afternoon", 60, "쌍정", ["업장","미술관","gallery","modern_art"]),
  p("pek-red-brick-art-museum", "베이징", "붉은 벽돌 미술관", "culture", 40.0388, 116.5058, 90, "afternoon", 80, "조양구", ["업장","미술관","gallery","photo_spot"]),
  p("pek-jianghu-bar-hutong", "베이징", "강호 인디 라이브바", "culture", 39.9352, 116.4178, 90, "evening", 120, "후통", ["업장","라이브바","live_music","subculture"]),
  p("pek-migas-mercado-rooftop", "베이징", "미가스 메르카도 루프탑", "food", 39.9102, 116.4588, 90, "evening", 220, "국무", ["업장","루프탑바","rooftop_bar","night_view"]),
  // 베이징 근교 (nearbyTrip: true)
  p("pek-mutianyu-great-wall", "베이징", "무톈위 만리장성", "landmark", 40.4312, 116.5622, 240, "morning", 160, "회유구", ["근교","만리장성","landmark","nature"], true, true, ["기차","전용버스"]),
  p("pek-gubei-water-town", "베이징", "구베이 수향마을", "culture", 40.6508, 117.2718, 240, "afternoon", 280, "밀운구", ["근교","수향마을","night_view","photo_spot"], false, true, ["기차","시외버스"]),

  // ==========================================
  // 3. 타이베이 (Taipei)
  // ==========================================
  p("tpe-yongkang-beef-noodle", "타이베이", "용캉 우육면", "food", 25.0332, 121.5298, 60, "afternoon", 280, "용캉제", ["업장","우육면","nofo_eatery","local_gem"]),
  p("tpe-lin-dong-fang-beef", "타이베이", "임동방 우육면", "food", 25.0448, 121.5432, 60, "evening", 290, "팔덕로", ["업장","우육면","nofo_eatery","local_gem"]),
  p("tpe-jin-feng-lu-rou-fan", "타이베이", "진봉 루러우판", "food", 25.0318, 121.5188, 45, "morning", 60, "중정구", ["업장","루러우판","nofo_eatery","local_gem"]),
  p("tpe-fuhang-soy-milk", "타이베이", "푸항두장", "food", 25.0442, 121.5248, 50, "morning", 80, "화산", ["업장","아침식사","두장","nofo_eatery"]),
  p("tpe-kao-chi-yongkang", "타이베이", "고기 식당", "food", 25.0328, 121.5292, 70, "afternoon", 350, "용캉제", ["업장","딤섬","생전포","local_gem"]),
  p("tpe-wistaria-tea-house", "타이베이", "위스타리아 다원", "culture", 25.0268, 121.5348, 80, "afternoon", 350, "대안구", ["업장","전통찻집","traditional_tea","history"]),
  p("tpe-simple-kaffa-huashan", "타이베이", "심플 카파 화산본점", "food", 25.0445, 121.5272, 60, "morning", 200, "화산", ["업장","스페셜티카페","specialty_coffee","local_gem"]),
  p("tpe-fong-da-coffee-ximen", "타이베이", "봉대커피", "food", 25.0418, 121.5078, 50, "morning", 120, "시먼딩", ["업장","로컬카페","retro_cafe","history"]),
  p("tpe-raohe-night-market", "타이베이", "라오허제 야시장 화덕 후추빵", "market", 25.0508, 121.5778, 80, "evening", 60, "송산구", ["시장","야시장","local_market","street_food"]),
  p("tpe-ningxia-taro-ball", "타이베이", "류위자 토란튀김", "market", 25.0558, 121.5152, 30, "evening", 40, "닝샤", ["업장","야시장","street_food","local_gem"]),
  p("tpe-eslite-spectrum-songshan", "타이베이", "성품서점 송산점", "culture", 25.0438, 121.5608, 90, "afternoon", 0, "송산문창", ["업장","독립서점","indie_bookstore","design"]),
  p("tpe-vvg-something-book", "타이베이", "VVG 썸씽 디자인 서점", "culture", 25.0412, 121.5472, 60, "afternoon", 0, "동구", ["업장","독립서점","indie_bookstore","hidden_gem"]),
  p("tpe-beitou-thermal-valley", "타이베이", "베이투 지열곡 산책로", "nature", 25.1378, 121.5088, 70, "afternoon", 0, "베이투", ["자연","온천","산책","nature"]),
  p("tpe-elephant-mountain-trail", "타이베이", "샹산 101 전망 산책로", "nature", 25.0272, 121.5708, 90, "evening", 0, "신의구", ["자연","산책","free_viewpoint","night_view"]),
  p("tpe-draft-land-zhongxiao", "타이베이", "드래프트 랜드", "food", 25.0422, 121.5512, 80, "evening", 300, "동구", ["업장","칵테일바","cocktail_bar","youth"]),
  p("tpe-bar-mood-taipei", "타이베이", "바 무드", "food", 25.0398, 121.5468, 90, "evening", 450, "대안구", ["업장","칵테일바","cocktail_bar","luxury"]),
  // 타이베이 근교 (nearbyTrip: true)
  p("tpe-jiufen-old-street", "타이베이", "지우펀 홍등 골목", "culture", 25.1098, 121.8452, 150, "afternoon", 100, "지우펀", ["근교","홍등","retro_alley","photo_spot"], true, true, ["버스","택시"]),
  p("tpe-shifen-waterfall-lantern", "타이베이", "시펀 천등 마을 & 폭포", "landmark", 25.0428, 121.7768, 120, "afternoon", 200, "시펀", ["근교","천등","폭포","landmark"], false, true, ["기차","버스"]),

  // ==========================================
  // 4. 홍콩 (Hong Kong)
  // ==========================================
  p("hkg-lan-fong-yuen-soho", "홍콩", "란퐁유엔 본점", "food", 22.2828, 114.1538, 50, "morning", 50, "소호", ["업장","차찬텡","nofo_eatery","밀크티"]),
  p("hkg-kam-wah-cafe-mong-kok", "홍콩", "캄와 카페", "food", 22.3218, 114.1698, 50, "morning", 45, "몽콕", ["업장","차찬텡","파인애플번","nofo_eatery"]),
  p("hkg-yung-kee-roast-goose", "홍콩", "융키 거위구이", "food", 22.2818, 114.1558, 80, "evening", 300, "센트럴", ["업장","로스트구스","nofo_eatery","history"]),
  p("hkg-mak-man-kee-noodle", "홍콩", "막만키 완탕면", "food", 22.3048, 114.1692, 50, "afternoon", 60, "조던", ["업장","완탕면","nofo_eatery","local_gem"]),
  p("hkg-sing-heung-yuen-soho", "홍콩", "성흥유엔", "food", 22.2838, 114.1522, 50, "afternoon", 45, "소호", ["업장","차찬텡","토마토라면","nofo_eatery"]),
  p("hkg-mido-cafe-yau-ma-tei", "홍콩", "미도 카페", "food", 22.3115, 114.1702, 60, "afternoon", 65, "야우마테이", ["업장","전통빙실","retro_cafe","history"]),
  p("hkg-knockbox-coffee-roasters", "홍콩", "노크박스 커피", "food", 22.3178, 114.1728, 60, "morning", 55, "몽콕", ["업장","로컬카페","specialty_coffee","local_gem"]),
  p("hkg-pmq-design-hub", "홍콩", "PMQ 디자인 허브", "shopping", 22.2835, 114.1512, 90, "afternoon", 0, "소호", ["건물","디자인","shopping","photo_spot"]),
  p("hkg-tai-kwun-centre", "홍콩", "타이콴 문화공간", "culture", 22.2818, 114.1535, 90, "afternoon", 0, "센트럴", ["건물","문화공간","history","art"]),
  p("hkg-cat-street-antique-market", "홍콩", "캣스트리트 앤티크 상점가", "market", 22.2848, 114.1498, 70, "afternoon", 0, "셩완", ["거리","앤티크","shopping","retro_alley"]),
  p("hkg-wooloomooloo-wan-chai", "홍콩", "울루물루 루프탑 바", "food", 22.2762, 114.1728, 90, "evening", 250, "완차이", ["업장","루프탑바","rooftop_bar","night_view"]),
  p("hkg-the-iron-fairies-central", "홍콩", "아이언 페어리스 센트럴", "food", 22.2822, 114.1542, 90, "evening", 220, "센트럴", ["업장","칵테일바","cocktail_bar","design"]),
  // 홍콩 근교 (nearbyTrip: true)
  p("hkg-dragon-s-back-trail", "홍콩", "드래곤스백 하이킹 코스", "nature", 22.2415, 114.2412, 180, "morning", 0, "섹오", ["근교","자연","하이킹","nature"], false, true, ["2층버스"]),
  p("hkg-tai-o-fishing-village", "홍콩", "타이오 수상 어촌 마을", "culture", 22.2542, 113.8618, 180, "afternoon", 100, "란타우", ["근교","어촌마을","수상가옥","history"], false, true, ["페리","버스"]),

  // ==========================================
  // 5. 다낭 (Da Nang)
  // ==========================================
  p("dad-pho-bac-hai", "다낭", "포박하이 쌀국수", "food", 16.0678, 108.2232, 50, "morning", 45000, "시내", ["업장","쌀국수","nofo_eatery","local_gem"]),
  p("dad-mi-quang-1A", "다낭", "미꽝 1A", "food", 16.0638, 108.2202, 50, "afternoon", 40000, "시내", ["업장","미꽝","nofo_eatery","local_gem"]),
  p("dad-quan-be-man-seafood", "다낭", "베만 해산물", "food", 16.0718, 108.2468, 80, "evening", 300000, "미케비치", ["업장","해산물","nofo_eatery","local_gem"]),
  p("dad-banh-xeo-ba-duod", "다낭", "바두엉 반쎄오", "food", 16.0592, 108.2168, 60, "evening", 70000, "시내", ["업장","반쎄오","nofo_eatery","local_gem"]),
  p("dad-cuc-tran-coffee", "다낭", "꾹짠 코코넛 커피", "food", 16.0688, 108.2212, 50, "afternoon", 35000, "시내", ["업장","베트남커피","local_gem"]),
  p("dad-fil-coffee-danang", "다낭", "필 커피", "food", 16.0518, 108.2428, 60, "morning", 40000, "안상", ["업장","로컬카페","specialty_coffee","hidden_gem"]),
  p("dad-am-phu-cave", "다낭", "오행산 암푸 동굴", "culture", 16.0035, 108.2625, 80, "afternoon", 40000, "오행산", ["동굴","사찰","nature","hidden_gem"]),
  p("dad-herbal-spa-danang", "다낭", "허벌 스파", "culture", 16.0612, 108.2435, 90, "afternoon", 450000, "미케비치", ["업장","마사지","스파","healing"]),
  p("dad-non-nuoc-beach", "다낭", "논누억 해변 산책로", "nature", 16.0028, 108.2638, 80, "evening", 0, "논누억", ["자연","해변","산책","sunset_view"]),
  p("dad-marina-d-eu-boardwalk", "다낭", "사랑의 브릿지 야경 보드워크", "nature", 16.0618, 108.2295, 60, "evening", 0, "한강변", ["자연","야경","free_viewpoint","photo_spot"]),
  // 다낭 근교 (nearbyTrip: true)
  p("dad-tam-thanh-mural", "다낭", "땀탄 벽화마을 & 해변", "culture", 15.6128, 108.5282, 180, "afternoon", 0, "탐끼", ["근교","벽화마을","해변","photo_spot"], false, true, ["택시","렌트카"]),
  p("dad-bana-hills-golden-bridge", "다낭", "바나힐 골든브릿지", "landmark", 15.9988, 107.9882, 240, "morning", 850000, "바나힐", ["근교","테마파크","골든브릿지","landmark"], true, true, ["셔틀","택시"]),
  p("dad-marble-mountains-grotto", "다낭", "오행산 수산 동굴", "culture", 16.0048, 108.2618, 120, "afternoon", 40000, "오행산", ["근교","동굴","사찰","nature"], false, true, ["대중교통","택시"]),

  // ==========================================
  // 6. 하노이 (Hanoi)
  // ==========================================
  p("han-bun-cha-huong-lien", "하노이", "흐엉련 분짜", "food", 21.0178, 105.8542, 60, "afternoon", 60000, "하이바쯩", ["업장","분짜","nofo_eatery","local_gem"]),
  p("han-pho-thin-lo-duc", "하노이", "포틴 로뚝 쌀국수", "food", 21.0185, 105.8568, 50, "morning", 65000, "하이바쯩", ["업장","쌀국수","nofo_eatery","local_gem"]),
  p("han-banh-mi-25", "하노이", "반미 25", "food", 21.0362, 105.8488, 40, "morning", 35000, "구시가지", ["업장","반미","street_food","local_gem"]),
  p("han-pho-gia-truyen-bat-dan", "하노이", "포기아전 쌀국수", "food", 21.0342, 105.8468, 50, "morning", 55000, "구시가지", ["업장","쌀국수","nofo_eatery","local_gem"]),
  p("han-bun-bo-nam-bo-hang-dieu", "하노이", "분보남보 항디에우", "food", 21.0345, 105.8472, 50, "afternoon", 60000, "구시가지", ["업장","비빔쌀국수","nofo_eatery","local_gem"]),
  p("han-ca-phe-duong-tau", "하노이", "철길마을 기차 카페", "food", 21.0282, 105.8408, 60, "afternoon", 40000, "철길마을", ["업장","기차카페","photo_spot","retro_alley"]),
  p("han-an-nam-parlour-craft", "하노이", "안남 파밀리어 공예 숍", "shopping", 21.0302, 105.8478, 50, "afternoon", 100000, "구시가지", ["업장","자수","공예","shopping"]),
  p("han-manzi-art-space-cafe", "하노이", "만지 아트 스페이스", "culture", 21.0412, 105.8402, 70, "afternoon", 50000, "바딘구", ["업장","현대미술","gallery","specialty_coffee"]),
  p("han-west-lake-lotus-walk", "하노이", "서호 연꽃 산책길", "nature", 21.0568, 105.8208, 80, "morning", 0, "서호", ["자연","호수","산책","nature"]),
  p("han-sol-sky-bar-hanoi", "하노이", "솔 스카이바", "food", 21.0328, 105.8522, 80, "evening", 180000, "구시가지", ["업장","루프탑바","rooftop_bar","night_view"]),
  // 하노이 근교 (nearbyTrip: true)
  p("han-ninh-binh-tam-coc", "하노이", "닌빈 땀꼭 카르스트", "nature", 20.2158, 105.9362, 300, "morning", 250000, "닌빈", ["근교","뗏목","카르스트","nature"], true, true, ["투어버스","기차"]),
  p("han-ha-long-bay-cruise", "하노이", "하롱베이 크루즈", "landmark", 20.9102, 107.1838, 360, "morning", 800000, "하롱베이", ["근교","유네스코","크루즈","landmark"], true, true, ["투어버스"]),

  // ==========================================
  // 7. 호찌민 (Ho Chi Minh City)
  // ==========================================
  p("sgn-com-tam-ba-ghieu", "호찌민", "껌땀 바기에우", "food", 10.7878, 106.6858, 50, "morning", 55000, "3군", ["업장","껌땀","nofo_eatery","local_gem"]),
  p("sgn-banh-mi-huynh-hoa", "호찌민", "반미 후인호아", "food", 10.7712, 106.6925, 40, "afternoon", 60000, "1군", ["업장","반미","nofo_eatery","local_gem"]),
  p("sgn-pho-le-district5", "호찌민", "포레 쌀국수 본점", "food", 10.7558, 106.6718, 50, "morning", 75000, "5군", ["업장","쌀국수","nofo_eatery","local_gem"]),
  p("sgn-banh-xeo-46A", "호찌민", "반쎄오 46A", "food", 10.7882, 106.6908, 60, "evening", 90000, "1군", ["업장","반쎄오","nofo_eatery","local_gem"]),
  p("sgn-thinker-dreamer-cafe", "호찌민", "띵커 앤 드리머", "food", 10.7742, 106.7032, 60, "afternoon", 60000, "1군", ["업장","카페아파트","photo_spot","youth"]),
  p("sgn-maker-concept-store", "호찌민", "메이커 콘셉트 숍", "shopping", 10.7742, 106.7032, 50, "afternoon", 150000, "1군", ["업장","카페아파트","편집숍","shopping"]),
  p("sgn-ran-ran-coffee-thao-dien", "호찌민", "란란 커피", "food", 10.8032, 106.7312, 70, "morning", 70000, "2군", ["업장","정원카페","specialty_coffee","photo_spot"]),
  p("sgn-l-usine-dong-khoi", "호찌민", "루진 동코이점", "food", 10.7768, 106.7028, 70, "afternoon", 120000, "1군", ["업장","브런치","편집숍","design"]),
  p("sgn-saigon-kitsch-design", "호찌민", "사이공 키치 숍", "shopping", 10.7762, 106.7022, 50, "afternoon", 80000, "1군", ["업장","디자인","포스터","shopping"]),
  p("sgn-stoker-woodfired-bar", "호찌민", "스토커 우드파이어 바", "food", 10.7755, 106.7018, 90, "evening", 350000, "1군", ["업장","칵테일바","cocktail_bar","luxury"]),
  p("sgn-broma-not-a-bar", "호찌민", "브로마 루프탑", "food", 10.7738, 106.7045, 90, "evening", 180000, "1군", ["업장","루프탑바","rooftop_bar","night_life"]),
  // 호찌민 근교 (nearbyTrip: true)
  p("sgn-cu-chi-tunnels-history", "호찌민", "구찌터널 유적지", "culture", 11.1418, 106.4628, 240, "morning", 120000, "구찌", ["근교","지하갱도","역사","history"], true, true, ["투어버스"]),
  p("sgn-mekong-delta-my-tho", "호찌민", "메콩강 미토 삼판 투어", "nature", 10.3548, 106.3608, 300, "morning", 350000, "미토", ["근교","메콩강","목선","nature"], true, true, ["투어버스"]),

  // ==========================================
  // 8. 방콕 (Bangkok)
  // ==========================================
  p("bkk-thip-samai-pad-thai", "방콕", "팁싸마이 팟타이", "food", 13.7528, 100.5048, 60, "evening", 120, "프라나콘", ["업장","팟타이","nofo_eatery","local_gem"]),
  p("bkk-jay-fai-crab-omelet", "방콕", "쩨파이 게살 오믈렛", "food", 13.7525, 100.5045, 90, "afternoon", 1000, "프라나콘", ["업장","미슐랭","nofo_eatery","local_gem"]),
  p("bkk-jok-prince-congee", "방콕", "족프린스 돼지고기죽", "food", 13.7228, 100.5152, 45, "morning", 60, "방락", ["업장","로컬식당","돼지죽","nofo_eatery"]),
  p("bkk-rung-rueang-pork-noodle", "방콕", "롱르앙 돼지고기 쌀국수", "food", 13.7288, 100.5708, 50, "morning", 70, "프롬퐁", ["업장","쌀국수","nofo_eatery","local_gem"]),
  p("bkk-jodd-fairs-dan-neramit", "방콕", "조드페어 단네라밋 야시장", "market", 13.8188, 100.5628, 100, "evening", 150, "자투작구", ["시장","야시장","local_market","night_life"]),
  p("bkk-leng-zaap-jodd-fairs", "방콕", "조드페어 랭쌥 전문점", "food", 13.7568, 100.5692, 60, "evening", 250, "라차다", ["업장","랭쌥","street_food","local_gem"]),
  p("bkk-roots-coffee-thonglor", "방콕", "루츠 커피 통로점", "food", 13.7348, 100.5822, 60, "morning", 140, "통로", ["업장","로스터리","specialty_coffee","youth"]),
  p("bkk-after-you-thonglor", "방콕", "애프터유 통로점", "food", 13.7342, 100.5818, 50, "afternoon", 220, "통로", ["업장","빙수","디저트","popular"]),
  p("bkk-tichuca-rooftop-bar", "방콕", "티추카 루프탑 바", "food", 13.7242, 100.5788, 90, "evening", 400, "통로", ["업장","루프탑바","rooftop_bar","night_view"]),
  p("bkk-health-land-asok", "방콕", "헬스랜드 아속점", "culture", 13.7408, 100.5602, 120, "afternoon", 650, "아속", ["업장","타이마사지","스파","healing"]),
  p("bkk-moca-bangkok-art", "방콕", "MOCA 방콕 현대미술관", "culture", 13.8528, 100.5628, 100, "afternoon", 250, "자투작구", ["업장","미술관","gallery","modern_art"]),
  // 방콕 근교 (nearbyTrip: true)
  p("bkk-damnoen-saduak-floating", "방콕", "담넌사두억 수상시장", "market", 13.5188, 99.9592, 180, "morning", 300, "라차부리", ["근교","수상시장","배","street_food"], true, true, ["투어버스","택시"]),
  p("bkk-maeklong-railway-market", "방콕", "매클롱 기차시장", "market", 13.4075, 100.0008, 120, "morning", 100, "사뭇송크람", ["근교","기차시장","철길","unique"], true, true, ["투어버스","기차"]),
  p("bkk-ayutthaya-historical-park", "방콕", "아유타야 사원 유적지", "culture", 14.3548, 100.5612, 240, "morning", 200, "아유타야", ["근교","유네스코","사원유적","history"], true, true, ["기차","투어버스"]),

  // ==========================================
  // 9. 싱가포르 (Singapore)
  // ==========================================
  p("sin-tian-tian-chicken-rice", "싱가포르", "티안티안 치킨라이스", "food", 1.2805, 103.8448, 45, "afternoon", 7, "맥스웰", ["업장","호커센터","치킨라이스","nofo_eatery"]),
  p("sin-ya-kun-kaya-toast-china", "싱가포르", "야쿤 카야토스트 본점", "food", 1.2842, 103.8478, 45, "morning", 6, "차이나타운", ["업장","카야토스트","nofo_eatery","history"]),
  p("sin-328-katong-laksa", "싱가포르", "328 카통 락사", "food", 1.3052, 103.9052, 50, "afternoon", 8, "카통", ["업장","락사","nofo_eatery","local_gem"]),
  p("sin-song-fa-bak-kut-teh", "싱가포르", "송파 바쿠테 본점", "food", 1.2892, 103.8475, 60, "evening", 15, "클락키", ["업장","바쿠테","nofo_eatery","local_gem"]),
  p("sin-nylon-coffee-roasters", "싱가포르", "나일론 커피 로스터스", "food", 1.2768, 103.8398, 50, "morning", 5, "에버튼파크", ["업장","골목카페","specialty_coffee","hidden_gem"]),
  p("sin-tiong-bahru-bakery-main", "싱가포르", "티옹바루 베이커리 본점", "food", 1.2838, 103.8322, 60, "morning", 12, "티옹바루", ["업장","베이커리","bakery","local_gem"]),
  p("sin-haji-lane-boutiques", "싱가포르", "하지레인 골목 편집숍", "shopping", 1.3012, 103.8592, 80, "afternoon", 0, "캄퐁글람", ["거리","골목","편집숍","subculture"]),
  p("sin-tiong-bahru-heritage", "싱가포르", "티옹바루 아르데코 주택가 산책길", "nature", 1.2832, 103.8315, 70, "afternoon", 0, "티옹바루", ["거리","산책","건축","retro_alley"]),
  p("sin-southern-ridges-walk", "싱가포르", "핸더슨웨이브 교각 산책로", "nature", 1.2762, 103.8152, 90, "evening", 0, "사우전리짓", ["자연","산책","free_viewpoint","nature"]),
  p("sin-level33-craft-brewery", "싱가포르", "LeVeL33 루프탑 맥주바", "food", 1.2792, 103.8532, 90, "evening", 40, "마리나베이", ["업장","루프탑바","rooftop_bar","night_view"]),
  // 싱가포르 근교 (nearbyTrip: true)
  p("sin-pulau-ubin-nature", "싱가포르", "팔라우 우빈섬 체크자와 습지", "nature", 1.4128, 103.9582, 240, "morning", 10, "우빈섬", ["근교","자연","습지","자전거"], false, true, ["페리"])
];
