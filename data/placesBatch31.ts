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

export const batchThirtyOnePlaces: Place[] = [
  // ==========================================
  // 1. 도쿄 (Tokyo)
  // ==========================================
  // 이자카야·재즈바·칵테일바 (15개)
  p("tokyo-bar-high-five", "도쿄", "긴자 칵테일 바 하이파이브", "food", 35.6708, 139.7628, 90, "evening", 3500, "긴자", ["술집","칵테일바","cocktail_bar","night_life","luxury"]),
  p("tokyo-bar-trench", "도쿄", "에비스 칵테일 바 트렌치", "food", 35.6475, 139.7088, 80, "evening", 3000, "에비스", ["술집","칵테일바","cocktail_bar","night_life","local_gem"]),
  p("tokyo-benfiddich", "도쿄", "신주쿠 허브 칵테일 바 벤피디치", "food", 35.6912, 139.6978, 90, "evening", 3800, "신주쿠", ["술집","칵테일바","cocktail_bar","hidden_gem","night_life"]),
  p("tokyo-bar-lupin", "도쿄", "긴자 바 루팡", "food", 35.6712, 139.7618, 80, "evening", 3000, "긴자", ["술집","칵테일바","nofo_eatery","history","night_life"]),
  p("tokyo-sg-club", "도쿄", "시부야 스피크이지 칵테일 바 SG 클럽", "food", 35.6631, 139.6982, 90, "evening", 3500, "시부야", ["술집","칵테일바","cocktail_bar","night_life","subculture"]),
  p("tokyo-cotton-club", "도쿄", "마루노우치 코튼 클럽 라이브 재즈", "culture", 35.6795, 139.7645, 120, "evening", 7500, "마루노우치", ["술집","재즈바","jazz_bar","live_music","night_life"]),
  p("tokyo-pit-inn", "도쿄", "신주쿠 재즈클럽 피트인", "culture", 35.6908, 139.7058, 110, "evening", 3500, "신주쿠", ["술집","재즈바","jazz_bar","live_music","history"]),
  p("tokyo-body-soul", "도쿄", "시부야 재즈바 바디앤솔", "culture", 35.6578, 139.7018, 110, "evening", 4500, "시부야", ["술집","재즈바","jazz_bar","live_music","night_life"]),
  p("tokyo-bar-radio", "도쿄", "미나미아오야마 바 라디오", "food", 35.6645, 139.7138, 80, "evening", 3200, "아오야마", ["술집","칵테일바","cocktail_bar","luxury","night_life"]),
  p("tokyo-izakaya-tengu", "도쿄", "신주쿠 로컬 대중 선술집 텐구", "food", 35.6922, 139.7012, 80, "evening", 2500, "신주쿠", ["술집","이자카야","izakaya","local_gem","nofo_eatery"]),
  p("tokyo-shimbashi-yokocho", "도쿄", "신바시 가드 아래 이자카야 거리", "food", 35.6668, 139.7582, 90, "evening", 3000, "신바시", ["술집","이자카야","izakaya","retro_alley","nofo_eatery"]),
  p("tokyo-zanmai-izakaya-ueno", "도쿄", "우에노 로컬 해산물 이자카야", "food", 35.7092, 139.7748, 80, "evening", 2800, "우에노", ["술집","이자카야","izakaya","local_gem","night_life"]),
  p("tokyo-asahi-sky-room", "도쿄", "아사히 맥주 본사 스카이룸 바", "food", 35.7098, 139.7995, 70, "evening", 1500, "아사쿠사", ["술집","맥주바","sunset_view","night_view","local"]),
  p("tokyo-mikkeller-shibuya", "도쿄", "시부야 크래프트 비어 미켈러 도쿄", "food", 35.6592, 139.6962, 80, "evening", 1800, "시부야", ["술집","수제맥주","craft_beer","youth","night_life"]),
  p("tokyo-yona-yona-beer-works", "도쿄", "아카사카 수제맥주 요나요나 비어 웍스", "food", 35.6742, 139.7375, 80, "evening", 2200, "아카사카", ["술집","수제맥주","craft_beer","local_gem","night_life"]),

  // 독립서점·소규모 갤러리 (10개)
  p("tokyo-bunkitsu-roppongi", "도쿄", "롯폰기 독립서점 분키츠", "culture", 35.6628, 139.7322, 100, "afternoon", 1650, "롯폰기", ["독립서점","indie_bookstore","디자인","hidden_gem","photo_spot"]),
  p("tokyo-cow-books-nakameguro", "도쿄", "나카메구로 빈티지 책방 카우 북스", "culture", 35.6455, 139.6968, 60, "afternoon", 0, "나카메구로", ["독립서점","indie_bookstore","빈티지","photo_spot","hidden_gem"]),
  p("tokyo-jimbocho-book-street", "도쿄", "진보초 고서점 거리 독립책방길", "culture", 35.6958, 139.7578, 90, "afternoon", 0, "진보초", ["독립서점","indie_bookstore","역사","retro_alley","history"]),
  p("tokyo-ginza-tsutaya-art", "도쿄", "긴자식스 아트 & 디자인 북카페 츠타야", "culture", 35.6695, 139.7641, 80, "afternoon", 0, "긴자", ["독립서점","indie_bookstore","갤러리","design","photo_spot"]),
  p("tokyo-21-21-design-sight", "도쿄", "롯폰기 21_21 DESIGN SIGHT 갤러리", "culture", 35.6678, 139.7305, 90, "afternoon", 1400, "롯폰기", ["소규모갤러리","gallery","건축","design","culture"]),
  p("tokyo-watari-um", "도쿄", "와타리움 현대미술 갤러리", "culture", 35.6705, 139.7128, 80, "afternoon", 1200, "아오야마", ["소규모갤러리","gallery","현대미술","hidden_gem","culture"]),
  p("tokyo-taka-ishii-gallery", "도쿄", "롯폰기 타카 이시이 현대아트 갤러리", "culture", 35.6642, 139.7312, 70, "afternoon", 0, "롯폰기", ["소규모갤러리","gallery","현대미술","hidden_gem","art"]),
  p("tokyo-mori-arts-center", "도쿄", "롯폰기힐즈 52층 모리 아트 센터 갤러리", "culture", 35.6605, 139.7292, 90, "afternoon", 2000, "롯폰기", ["소규모갤러리","gallery","전망","art","night_view"]),
  p("tokyo-poster-hub-jinbocho", "도쿄", "진보초 빈티지 포스터 전문 책방", "culture", 35.6962, 139.7562, 60, "afternoon", 0, "진보초", ["독립서점","indie_bookstore","포스터","subculture","hidden_gem"]),
  p("tokyo-nakanoshima-gallery-ginza", "도쿄", "긴자 소규모 현대아트 갤러리", "culture", 35.6715, 139.7635, 60, "afternoon", 0, "긴자", ["소규모갤러리","gallery","미술","art","hidden_gem"]),

  // 무료 전망·일몰 장소 (8개)
  p("tokyo-caretta-shiodome-view", "도쿄", "시오도메 카레타 46층 무료 스카이전망", "landmark", 35.6648, 139.7622, 60, "evening", 0, "시오도메", ["무료전망","free_viewpoint","night_view","sunset_view","viewpoint"]),
  p("tokyo-ebisu-garden-top-view", "도쿄", "에비스 가든플레이스 38층 무료 전망대", "landmark", 35.6425, 139.7132, 60, "evening", 0, "에비스", ["무료전망","free_viewpoint","night_view","sunset_view","viewpoint"]),
  p("tokyo-bunkyo-civic-center", "도쿄", "분쿄 시빅센터 25층 무료 후지산 일몰전망", "landmark", 35.7082, 139.7522, 70, "evening", 0, "분쿄구", ["무료전망","free_viewpoint","sunset_view","후지산전망","photo_spot"]),
  p("tokyo-sumida-park-sunset", "도쿄", "스미다 강변공원 타워 일몰 산책로", "nature", 35.7132, 139.7998, 80, "evening", 0, "아사쿠사", ["무료전망","sunset_view","free_viewpoint","강변","night_view"]),
  p("tokyo-toyosu-gururi-park", "도쿄", "토요스 구루리 공원 레인보우브릿지 노을", "nature", 35.6482, 139.7802, 80, "evening", 0, "토요스", ["무료전망","sunset_view","free_viewpoint","night_view","photo_spot"]),
  p("tokyo-yoyogi-park-view", "도쿄", "요요기공원 잔디밭 노을 스팟", "nature", 35.6715, 139.6948, 80, "evening", 0, "시부야", ["무료전망","sunset_view","free_viewpoint","산책","nature"]),
  p("tokyo-kasai-rinkai-sunset", "도쿄", "카사이 린카이 공원 바다 일몰 전망대", "nature", 35.6412, 139.8602, 90, "evening", 0, "에도가와구", ["무료전망","sunset_view","free_viewpoint","바다","nature"]),
  p("tokyo-hinode-pier-boardwalk", "도쿄", "히노데 피어 강변 보드워크 야경", "nature", 35.6538, 139.7588, 70, "evening", 0, "미나토구", ["무료전망","night_view","free_viewpoint","강변","photo_spot"]),

  // ==========================================
  // 2. 오사카 (Osaka)
  // ==========================================
  // 스페셜티 카페 (12개)
  p("osa-lilo-coffee-kissa", "오사카", "신사이바시 리로 커피 키사 융드립", "food", 34.6738, 135.4988, 60, "afternoon", 1000, "신사이바시", ["스페셜티카페","specialty_coffee","retro_cafe","드립커피","local_gem"]),
  p("osa-granknot-coffee", "오사카", "호리에 카페 그란크놋", "food", 34.6715, 135.4922, 60, "morning", 800, "호리에", ["스페셜티카페","specialty_coffee","에스프레소","photo_spot","local"]),
  p("osa-takamura-wine-coffee", "오사카", "히고바시 창고형 로스터리 타카무라", "food", 34.6868, 135.4912, 80, "afternoon", 1200, "히고바시", ["스페셜티카페","specialty_coffee","로스터리","와인","photo_spot"]),
  p("osa-elmers-green-cafe", "오사카", "키타하마 엘머스 그린 카페", "food", 34.6908, 135.5058, 70, "morning", 900, "키타하마", ["스페셜티카페","specialty_coffee","디저트","local_gem"]),
  p("osa-glitch-coffee-osaka", "오사카", "중앙구 드립 전문 글리치 커피 오사카", "food", 34.6928, 135.4982, 60, "morning", 1200, "중앙구", ["스페셜티카페","specialty_coffee","핸드드립","로스터리"]),
  p("osa-spectacle-kitahama", "오사카", "키타하마 지하 카페 스펙타클", "food", 34.6898, 135.5072, 70, "afternoon", 1000, "키타하마", ["스페셜티카페","specialty_coffee","retro_cafe","hidden_gem"]),
  p("osa-streamer-coffee-shinsaibashi", "오사카", "신사이바시 스트리머 커피 라테아트", "food", 34.6728, 135.4965, 60, "morning", 850, "신사이바시", ["스페셜티카페","specialty_coffee","라테아트","youth"]),
  p("osa-whitebird-coffee-stand", "오사카", "우메다 화이트버드 커피 스탠드", "food", 34.7008, 135.5002, 60, "afternoon", 900, "우메다", ["스페셜티카페","specialty_coffee","retro_cafe","드립커피"]),
  p("osa-dieci-cafe-tenjinbashi", "오사카", "텐진바시 북유럽 빈티지 카페 디에치", "food", 34.7022, 135.5108, 70, "afternoon", 950, "텐진바시", ["스페셜티카페","specialty_coffee","retro_cafe","편집숍"]),
  p("osa-mel-coffee-roasters", "오사카", "신사이바시 멜 커피 로스터스", "food", 34.6755, 135.4952, 50, "morning", 750, "신사이바시", ["스페셜티카페","specialty_coffee","로스터리","local_gem"]),
  p("osa-our-log-coffee", "오사카", "이쿠노구 로스터리 아워로그 커피", "food", 34.6612, 135.5348, 70, "afternoon", 800, "이쿠노구", ["스페셜티카페","specialty_coffee","photo_spot","local_gem"]),
  p("osa-sanwa-coffee-works", "오사카", "텐마 산와 커피 웍스", "food", 34.7045, 135.5122, 60, "morning", 800, "텐마", ["스페셜티카페","specialty_coffee","로스터리","local"]),

  // 스탠딩바·이자카야·재즈바 (12개)
  p("osa-tachinomi-jinanbo", "오사카", "난바 선술집 타치노미 지난보", "food", 34.6642, 135.5028, 70, "evening", 2000, "난바", ["스탠딩바","이자카야","izakaya","nofo_eatery","local_gem"]),
  p("osa-tachinomi-tokuda-shoten", "오사카", "우메다 지하상가 스탠딩바 토쿠다 쇼텐", "food", 34.7012, 135.4988, 70, "evening", 2200, "우메다", ["스탠딩바","이자카야","izakaya","nofo_eatery","night_life"]),
  p("osa-jazz-bar-968", "오사카", "우메다 레전드 재즈바 968", "culture", 34.7025, 135.4998, 100, "evening", 3500, "우메다", ["재즈바","jazz_bar","live_music","history","night_life"]),
  p("osa-royal-horse-jazz", "오사카", "우메다 라이브 재즈클럽 로열 호스", "culture", 34.7005, 135.5032, 110, "evening", 4500, "우메다", ["재즈바","jazz_bar","live_music","history","night_life"]),
  p("osa-bar-k-ginza-osaka", "오사카", "키타신치 칵테일바 바 케이", "food", 34.6978, 135.4982, 90, "evening", 3500, "키타신치", ["칵테일바","cocktail_bar","luxury","night_life"]),
  p("osa-bar-junge", "오사카", "키타신치 바 정글/윤게", "food", 34.6965, 135.4975, 80, "evening", 3000, "키타신치", ["칵테일바","cocktail_bar","nofo_eatery","history"]),
  p("osa-misono-universe", "오사카", "난바 라이브 홀 유니버스", "culture", 34.6648, 135.5042, 90, "evening", 2500, "난바", ["재즈바","night_life","retro_alley","subculture"]),
  p("osa-izakaya-toyo", "오사카", "교바시 길거리 서서 먹는 마구로 토요", "food", 34.6968, 135.5332, 70, "evening", 2500, "교바시", ["이자카야","izakaya","스탠딩바","nofo_eatery","local_gem"]),
  p("osa-shinsaku-kushikatsu", "오사카", "난바 수제 쿠시카츠 신사쿠", "food", 34.6662, 135.5015, 60, "evening", 2200, "난바", ["이자카야","izakaya","쿠시카츠","nofo_eatery","local_gem"]),
  p("osa-urashinsaibashi-izakaya", "오사카", "우라신사이바시 골목 술집 타운", "food", 34.6732, 135.4998, 80, "evening", 2800, "신사이바시", ["이자카야","izakaya","night_life","retro_alley"]),
  p("osa-beer-belly-tosabori", "오사카", "토사보리 크래프트 비어 베리", "food", 34.6882, 135.4928, 80, "evening", 2000, "토사보리", ["크래프트비어","craft_beer","night_life","local"]),
  p("osa-craft-beer-base", "오사카", "우메다 수제맥주 크래프트 비어 베이스", "food", 34.7068, 135.4948, 80, "evening", 2200, "우메다", ["크래프트비어","craft_beer","night_life","local_gem"]),

  // 레트로 골목·로컬 상점가 (8개)
  p("osa-nakazaki-cho-honten-street", "오사카", "나카자키초 옛 일본 골목 산책길", "culture", 34.7068, 135.5042, 90, "afternoon", 0, "우메다", ["레트로골목","retro_alley","산책","photo_spot","hidden_gem"]),
  p("osa-jan-jan-yokocho", "오사카", "신세카이 잔잔 요코초 아케이드", "market", 34.6508, 135.5062, 80, "afternoon", 1000, "신세카이", ["레트로골목","retro_alley","로컬상점가","local_market","history"]),
  p("osa-kuromon-back-street", "오사카", "난바 도구야스지 그릇 전문 상점가", "market", 34.6645, 135.5022, 70, "afternoon", 0, "난바", ["로컬상점가","local_market","그릇","shopping","hidden_gem"]),
  p("osa-orangeroad-horie", "오사카", "호리에 오렌지로드 스트리트 브랜드 골목", "shopping", 34.6708, 135.4932, 90, "afternoon", 0, "호리에", ["레트로골목","retro_alley","편집숍","youth","shopping"]),
  p("osa-americamura-alley", "오사카", "미나미 아메리카무라 스트리트 골목", "shopping", 34.6722, 135.4978, 80, "afternoon", 0, "신사이바시", ["레트로골목","retro_alley","구제샵","subculture","youth"]),
  p("osa-sannomiya-market-arcade", "오사카", "신사이바시 아케이드 서편 로컬상점가", "market", 34.6742, 135.5008, 80, "afternoon", 0, "신사이바시", ["로컬상점가","local_market","쇼핑","retro_alley"]),
  p("osa-tsutenkaku-hon-dori", "오사카", "쓰텐카쿠 본통 복고 상점가", "market", 34.6538, 135.5052, 70, "afternoon", 0, "신세카이", ["레트로골목","retro_alley","로컬상점가","photo_spot"]),
  p("osa-tsuruhashi-korean-market", "오사카", "쓰루하시 아시아 재래시장", "market", 34.6652, 135.5302, 90, "afternoon", 1500, "쓰루하시", ["로컬상점가","local_market","재래시장","retro_alley","nofo_eatery"]),

  // ==========================================
  // 3. 후쿠오카 (Fukuoka)
  // ==========================================
  // 로컬 카페·로스터리 (12개)
  p("fuk-coffee-county-kurume-fuk", "후쿠오카", "야쿠인 드립 커피 카운티", "food", 33.5788, 130.3985, 60, "morning", 800, "야쿠인", ["로컬카페","specialty_coffee","로스터리","local_gem"]),
  p("fuk-fuk-coffee-hakata", "후쿠오카", "하카타 공항 FUK COFFEE", "food", 33.5902, 130.4128, 60, "afternoon", 750, "하카타", ["로컬카페","specialty_coffee","photo_spot","youth"]),
  p("fuk-good-up-coffee", "후쿠오카", "고후쿠마치 토스트 & 에스프레소 굿업 커피", "food", 33.5728, 130.4022, 60, "morning", 850, "고후쿠마치", ["로컬카페","specialty_coffee","디저트","photo_spot"]),
  p("fuk-stereo-coffee", "후쿠오카", "와타나베도리 스탠딩 음악 카페 스테레오", "food", 33.5852, 130.4045, 60, "afternoon", 700, "와타나베도리", ["로컬카페","specialty_coffee","음악","photo_spot"]),
  p("fuk-abeki-coffee", "후쿠오카", "야쿠인 치즈케이크 전문 아베키", "food", 33.5772, 130.3992, 70, "afternoon", 900, "야쿠인", ["로컬카페","specialty_coffee","hidden_gem","local_gem"]),
  p("fuk-siro-coffee", "후쿠오카", "조난구 시로 커피", "food", 33.5712, 130.3788, 60, "afternoon", 750, "조난구", ["로컬카페","specialty_coffee","photo_spot","hidden_gem"]),
  p("fuk-townsquare-coffee", "후쿠오카", "하카타 강변 타운스퀘어 커피 로스터스", "food", 33.5925, 130.4162, 70, "morning", 800, "하카타", ["로컬카페","specialty_coffee","로스터리","강변"]),
  p("fuk-white-glass-coffee", "후쿠오카", "하카타 정원 테라스 화이트 글래스 커피", "food", 33.5878, 130.4142, 70, "morning", 850, "하카타", ["로컬카페","specialty_coffee","정원","photo_spot"]),
  p("fuk-hikaruxe-coffee", "후쿠오카", "다이묘 힐럭스 핸드드립 카페", "food", 33.5868, 130.3958, 60, "afternoon", 800, "다이묘", ["로컬카페","specialty_coffee","핸드드립","hidden_gem"]),
  p("fuk-filbert-steps", "후쿠오카", "롯폰마츠 필버트 스텝스 로스터리", "food", 33.5768, 130.3792, 60, "morning", 750, "롯폰마츠", ["로컬카페","specialty_coffee","로스터리","local"]),
  p("fuk-kyodo-coffee-yakuin", "후쿠오카", "야쿠인 쿄도 자원 로스터리 카페", "food", 33.5795, 130.3962, 60, "afternoon", 800, "야쿠인", ["로컬카페","specialty_coffee","로스터리","local_gem"]),
  p("fuk-adachi-coffee", "후쿠오카", "하카타역 아다치 커피 원두 전문점", "food", 33.5892, 130.4182, 50, "morning", 700, "하카타", ["로컬카페","specialty_coffee","로스터리","local"]),

  // 야타이 외 로컬 술집·바 (10개)
  p("fuk-bar-oscar", "후쿠오카", "다이묘 칵테일바 바 오스카", "food", 33.5878, 130.3948, 90, "evening", 3500, "다이묘", ["로컬술집","cocktail_bar","night_life","luxury"]),
  p("fuk-bar-palmer", "후쿠오카", "텐진 스피크이지 칵테일바 바 팔머", "food", 33.5888, 130.3962, 80, "evening", 3000, "텐진", ["로컬술집","cocktail_bar","hidden_gem","night_life"]),
  p("fuk-matsusuke-izakaya", "후쿠오카", "나카스 강변 야키토리 마츠스케", "food", 33.5912, 130.4055, 80, "evening", 3500, "나카스", ["로컬술집","izakaya","nofo_eatery","local_gem"]),
  p("fuk-hyotan-izakaya", "후쿠오카", "텐진 로컬 선술집 효탄 이자카야", "food", 33.5902, 130.3988, 80, "evening", 2800, "텐진", ["로컬술집","izakaya","local_gem","nofo_eatery"]),
  p("fuk-bar-hisa", "후쿠오카", "하카타역 와인 & 싱글몰트 바 히사", "food", 33.5882, 130.4175, 80, "evening", 3200, "하카타", ["로컬술집","cocktail_bar","hidden_gem","night_life"]),
  p("fuk-hakata-shin-uonoshima", "후쿠오카", "하카타 해산물 이자카야 신우오노시마", "food", 33.5898, 130.4152, 80, "evening", 3500, "하카타", ["로컬술집","izakaya","local_gem","night_life"]),
  p("fuk-nakasu-bar-higuchi", "후쿠오카", "나카스 바 히구치", "food", 33.5922, 130.4068, 80, "evening", 3000, "나카스", ["로컬술집","cocktail_bar","history","night_life"]),
  p("fuk-morisop-craftbeer", "후쿠오카", "와타나베도리 크래프트 비어 모리소프", "food", 33.5838, 130.4035, 80, "evening", 2200, "와타나베도리", ["로컬술집","craft_beer","night_life","local"]),
  p("fuk-asoma-sake-bar", "후쿠오카", "텐진 사케 전문 스탠딩바 아소마", "food", 33.5915, 130.3972, 70, "evening", 2000, "텐진", ["로컬술집","sake_bar","izakaya","local_gem"]),
  p("fuk-daimyo-gora-izakaya", "후쿠오카", "다이묘 수제 야키토리 이자카야 고라", "food", 33.5862, 130.3938, 80, "evening", 2800, "다이묘", ["로컬술집","izakaya","local_gem","night_life"]),

  // 야경·일몰·강변 산책 (8개)
  p("fuk-tenjin-central-park-view", "후쿠오카", "텐진 중앙공원 아크로스 루프탑 일몰", "nature", 33.5905, 130.4028, 80, "evening", 0, "텐진", ["야경","sunset_view","free_viewpoint","산책"]),
  p("fuk-nakasu-island-walk", "후쿠오카", "나카스섬 강변 야경 산책로", "nature", 33.5928, 130.4065, 80, "evening", 0, "나카스", ["야경","night_view","강변","산책"]),
  p("fuk-hakata-port-tower", "후쿠오카", "하카타 포트타워 무료 야경 전망대", "landmark", 33.6035, 130.3962, 70, "evening", 0, "하카타항", ["야경","free_viewpoint","night_view","sunset_view"]),
  p("fuk-aburayama-katae-view", "후쿠오카", "아부라야마 카타에 고개 야경 스팟", "nature", 33.5285, 130.3725, 90, "evening", 0, "남구", ["야경","night_view","sunset_view","hidden_gem"]),
  p("fuk-seaside-momochi-night", "후쿠오카", "씨사이드 모모치 야경 보드워크", "nature", 33.5955, 130.3512, 80, "evening", 0, "모모치", ["야경","night_view","바다","산책"]),
  p("fuk-muromi-river-walk", "후쿠오카", "무로미 강변 일몰 산책길", "nature", 33.5815, 130.3348, 80, "evening", 0, "무로미", ["야경","sunset_view","강변","산책"]),
  p("fuk-jyo-no-hama-sunset", "후쿠오카", "이토시마 노을 해변 산책", "nature", 33.6482, 130.1982, 100, "evening", 0, "이토시마", ["야경","sunset_view","해변","photo_spot"]),
  p("fuk-bayside-place-night", "후쿠오카", "베이사이드 플레이스 하카타 야경", "landmark", 33.6028, 130.3978, 70, "evening", 0, "하카타항", ["야경","night_view","free_viewpoint","산책"]),

  // ==========================================
  // 4. 삿포로 (Sapporo)
  // ==========================================
  // 로컬 술집·사케바·재즈바 (10개)
  p("spk-bar-barn-sapporo", "삿포로", "스스키노 칵테일바 바 반", "food", 43.0558, 141.3538, 80, "evening", 3500, "스스키노", ["로컬술집","cocktail_bar","night_life","luxury"]),
  p("spk-bar-proof", "삿포로", "스스키노 싱글몰트 스피크이지 바 프루프", "food", 43.0545, 141.3522, 80, "evening", 3200, "스스키노", ["로컬술집","cocktail_bar","hidden_gem","night_life"]),
  p("spk-bar-panisse", "삿포로", "스스키노 내추럴 와인바 파니스", "food", 43.0562, 141.3545, 80, "evening", 3000, "스스키노", ["로컬술집","wine_bar","night_life","local_gem"]),
  p("spk-slowboat-jazz", "삿포로", "스스키노 레전드 재즈클럽 슬로우보트", "culture", 43.0538, 141.3528, 110, "evening", 4000, "스스키노", ["재즈바","jazz_bar","live_music","history","night_life"]),
  p("spk-sake-bar-gokuraku", "삿포로", "스스키노 홋카이도 사케바 고쿠라쿠", "food", 43.0552, 141.3515, 80, "evening", 2800, "스스키노", ["사케바","izakaya","sake_bar","local_gem"]),
  p("spk-tanukikoji-izakaya-alley", "삿포로", "타누키코지 7초메 이자카야", "food", 43.0568, 141.3488, 80, "evening", 2500, "타누키코지", ["로컬술집","izakaya","nofo_eatery","retro_alley"]),
  p("spk-sumibi-yakitori-shinto", "삿포로", "스스키노 숯불 야키토리 신토", "food", 43.0548, 141.3532, 80, "evening", 2800, "스스키노", ["로컬술집","izakaya","nofo_eatery","local_gem"]),
  p("spk-sapporo-beer-garden-bar", "삿포로", "삿포로 비어가든 로컬 맥주홀", "food", 43.0715, 141.3698, 90, "evening", 3000, "동구", ["로컬술집","맥주홀","history","local"]),
  p("spk-north-island-beer", "삿포로", "오도리 수제맥주 노스 아일랜드 비어", "food", 43.0605, 141.3542, 80, "evening", 2200, "오도리", ["로컬술집","craft_beer","night_life","local_gem"]),
  p("spk-bar-yamazaki", "삿포로", "스스키노 삿포로 바 야마자키", "food", 43.0555, 141.3535, 80, "evening", 3500, "스스키노", ["로컬술집","cocktail_bar","history","nofo_eatery"]),

  // 카페·디저트 (10개)
  p("spk-barcom-sapporo", "삿포로", "오도리 공원 파페 & 커피 바콤", "food", 43.0612, 141.3518, 70, "afternoon", 1400, "오도리", ["카페","dessert","파페","photo_spot"]),
  p("spk-morihiko-coffee-maruyama", "삿포로", "마루야마 고가옥 로스터리 모리히코", "food", 43.0558, 141.3188, 70, "morning", 900, "마루야마", ["카페","specialty_coffee","retro_cafe","history","photo_spot"]),
  p("spk-bar-parfait-sato", "삿포로", "스스키노 마메 조시 심야파페 사토", "food", 43.0565, 141.3552, 60, "evening", 1600, "스스키노", ["디저트","dessert","심야파페","local_gem","night_life"]),
  p("spk-parfaititer-pal", "삿포로", "스스키노 시메파페 전문 파페티에 팔", "food", 43.0558, 141.3525, 60, "evening", 1500, "스스키노", ["디저트","dessert","심야파페","youth","night_life"]),
  p("spk-kinotoya-odori-cafe", "삿포로", "오도리 치즈타르트 카페 키노토야", "food", 43.0615, 141.3538, 50, "afternoon", 800, "오도리", ["디저트","dessert","치즈타르트","bakery"]),
  p("spk-rokit-coffee", "삿포로", "삿포로역 로컬 드립 카페 로킷 커피", "food", 43.0682, 141.3508, 60, "morning", 750, "삿포로역", ["카페","specialty_coffee","로스터리","local"]),
  p("spk-rokatei-sapporo-honten", "삿포로", "삿포로 본점 롯카테이 카페", "food", 43.0645, 141.3512, 70, "afternoon", 1200, "삿포로역", ["디저트","dessert","버터샌드","history"]),
  p("spk-ishiya-cafe-odori", "삿포로", "시로이코이비토 이시야 카페 오도리", "food", 43.0608, 141.3528, 60, "afternoon", 1000, "오도리", ["디저트","dessert","팬케이크","photo_spot"]),
  p("spk-marumi-coffee-stand", "삿포로", "오도리 마루미 커피 스탠드", "food", 43.0592, 141.3515, 50, "morning", 750, "오도리", ["카페","specialty_coffee","핸드드립","local_gem"]),
  p("spk-saturdays-chocolate", "삿포로", "창성천변 수제 초콜릿 & 커피 카페", "food", 43.0602, 141.3582, 60, "afternoon", 1100, "오도리", ["카페","dessert","초콜릿","photo_spot"]),

  // 상점가·시장·쇼핑 (8개)
  p("spk-tanukikoji-arcade-1-6", "삿포로", "타누키코지 아케이드 1-6초메 상점가", "market", 43.0572, 141.3522, 90, "afternoon", 0, "타누키코지", ["상점가","local_market","쇼핑","history"]),
  p("spk-nijo-market-sea", "삿포로", "니조시장 해산물 & 농산물 재래시장", "market", 43.0592, 141.3585, 80, "morning", 3000, "오도리", ["시장","local_market","해산물","nofo_eatery"]),
  p("spk-sapporo-factory-shopping", "삿포로", "붉은 벽돌 삿포로 팩토리 쇼핑몰", "shopping", 43.0658, 141.3622, 100, "afternoon", 0, "중앙구", ["쇼핑","shopping","건축","history"]),
  p("spk-stellar-place-sapporo", "삿포로", "삿포로역 스텔라 플레이스 쇼핑몰", "shopping", 43.0688, 141.3502, 100, "afternoon", 0, "삿포로역", ["쇼핑","shopping","패션","youth"]),
  p("spk-parco-sapporo", "삿포로", "오도리 패션 파르코 백화점", "shopping", 43.0598, 141.3528, 90, "afternoon", 0, "오도리", ["쇼핑","shopping","패션","youth"]),
  p("spk-marui-imai-dept", "삿포로", "삿포로 마루이 이마이 백화점", "shopping", 43.0595, 141.3548, 90, "afternoon", 0, "오도리", ["쇼핑","shopping","백화점","history"]),
  p("spk-jyugoshima-market", "삿포로", "스스키노 지하 로컬 식품 상점가", "market", 43.0542, 141.3538, 70, "afternoon", 1500, "스스키노", ["상점가","local_market","식품관","nofo_eatery"]),
  p("spk-curio-craft-shop", "삿포로", "오도리 홋카이도 공예 독립상점", "shopping", 43.0618, 141.3558, 60, "afternoon", 0, "오도리", ["쇼핑","shopping","공예","hidden_gem"]),

  // ==========================================
  // 5. 상하이 (Shanghai)
  // ==========================================
  // 독립 카페·로스터리 (12개)
  p("sha-metal-hands-french", "상하이", "조계지 메탈 핸즈", "food", 31.2185, 121.4502, 60, "morning", 80, "조계지", ["독립카페","specialty_coffee","로스터리","photo_spot"]),
  p("sha-manner-coffee-nanyang", "상하이", "남양로 매너 커피", "food", 31.2295, 121.4528, 40, "morning", 30, "정안사", ["독립카페","specialty_coffee","원조","local_gem"]),
  p("sha-see-saw-coffee-yuyuan", "상하이", "우원로 로스터리 시소 커피", "food", 31.2215, 121.4388, 70, "afternoon", 70, "우원로", ["독립카페","specialty_coffee","로스터리","design"]),
  p("sha-oats-coffee-anfu", "상하이", "안푸루 독립 카페 오츠 커피", "food", 31.2145, 121.4422, 60, "afternoon", 65, "안푸루", ["독립카페","specialty_coffee","photo_spot","youth"]),
  p("sha-arabica-wukang", "상하이", "우캉루 퍼레이드 % 아라비카", "food", 31.2062, 121.4415, 60, "afternoon", 80, "우캉루", ["독립카페","specialty_coffee","photo_spot","popular"]),
  p("sha-paras-coffee-fuxing", "상하이", "푸싱루 테라스 파라스 커피", "food", 31.2162, 121.4582, 70, "afternoon", 75, "조계지", ["독립카페","specialty_coffee","테라스","photo_spot"]),
  p("sha-summer-matisse-cafe", "상하이", "조계지 예술 카페 마티스", "food", 31.2128, 121.4485, 70, "afternoon", 85, "조계지", ["독립카페","specialty_coffee","art","hidden_gem"]),
  p("sha-fumi-coffee-richmond", "상하이", "부민로 FUMI 핸드드립 커피", "food", 31.2208, 121.4518, 60, "morning", 70, "부민로", ["독립카페","specialty_coffee","핸드드립","local_gem"]),
  p("sha-rumors-coffee-hunan", "상하이", "후난루 고전 핸드드립 루머스 커피", "food", 31.2088, 121.4402, 60, "afternoon", 80, "조계지", ["독립카페","specialty_coffee","핸드드립","retro_cafe"]),
  p("sha-small-arms-big-heart", "상하이", "조계지 따뜻한 분위기 스몰 암스", "food", 31.2155, 121.4495, 60, "afternoon", 65, "조계지", ["독립카페","specialty_coffee","hidden_gem","local"]),
  p("sha-duckbing-coffee", "상하이", "신천지 오리 마스코트 덕빙 커피", "food", 31.2198, 121.4722, 60, "afternoon", 60, "신천지", ["독립카페","specialty_coffee","youth","photo_spot"]),
  p("sha-m-roastery-bund", "상하이", "와이탄 정면 엠 로스터리", "food", 31.2382, 121.4862, 70, "morning", 90, "와이탄", ["독립카페","specialty_coffee","전망","photo_spot"]),

  // 루프탑바·재즈바·로컬 바 (10개)
  p("sha-bar-rouge-bund", "상하이", "와이탄 루프탑 바 루주", "food", 31.2392, 121.4878, 100, "evening", 350, "와이탄", ["루프탑바","rooftop_bar","야경","night_life","luxury"]),
  p("sha-flair-rooftop-ritz", "상하이", "리츠칼튼 58층 플레어 루프탑 바", "food", 31.2385, 121.5002, 90, "evening", 450, "푸동", ["루프탑바","rooftop_bar","야경","sunset_view","luxury"]),
  p("sha-jzs-jazz-club", "상하이", "조계지 JZ 재즈 클럽", "culture", 31.2148, 121.4468, 110, "evening", 250, "조계지", ["재즈바","jazz_bar","live_music","history","night_life"]),
  p("sha-peace-hotel-old-jazz", "상하이", "화평반점 올드 재즈바", "culture", 31.2388, 121.4868, 110, "evening", 300, "와이탄", ["재즈바","jazz_bar","history","nofo_eatery","night_life"]),
  p("sha-speak-low-shanghai", "상하이", "복흥중로 스피크이지 칵테일바 스피크 로우", "food", 31.2152, 121.4608, 90, "evening", 280, "조계지", ["로컬바","cocktail_bar","hidden_gem","night_life"]),
  p("sha-sober-company", "상하이", "신천지 복합 칵테일 & 식당 소버 컴퍼니", "food", 31.2178, 121.4682, 90, "evening", 300, "신천지", ["로컬바","cocktail_bar","night_life","local_gem"]),
  p("sha-cozy-wine-bar-anfu", "상하이", "안푸루 와인바 코지 와인스", "food", 31.2138, 121.4435, 80, "evening", 250, "안푸루", ["로컬바","wine_bar","night_life","local"]),
  p("sha-bar-heydday-jazz", "상하이", "조계지 빈티지 재즈바 헤이데이", "culture", 31.2112, 121.4522, 100, "evening", 220, "조계지", ["재즈바","jazz_bar","live_music","night_life"]),
  p("sha-arch-cocktail-bar", "상하이", "중산공원 인근 아치 칵테일바", "food", 31.2228, 121.4248, 80, "evening", 240, "중산공원", ["로컬바","cocktail_bar","hidden_gem","night_life"]),
  p("sha-shanghai-brew-house", "상하이", "동방명주 뷰 셰익스피어 브루하우스", "food", 31.2405, 121.4928, 80, "evening", 200, "푸동", ["로컬바","craft_beer","night_view","night_life"]),

  // ==========================================
  // 6. 베이징 (Beijing)
  // ==========================================
  // 후통 카페·전통 찻집 (10개)
  p("pek-metal-hands-wudaoying", "베이징", "오도영 후통 메탈 핸즈", "food", 39.9482, 116.4168, 60, "morning", 60, "후통", ["후통카페","specialty_coffee","retro_alley","local_gem"]),
  p("pek-barista-coffee-hutong", "베이징", "오도영 후통 바리스타 커피 숏", "food", 39.9485, 116.4172, 50, "morning", 50, "후통", ["후통카페","specialty_coffee","retro_alley","local"]),
  p("pek-berry-beans-qianmen", "베이징", "전문 주시 후통 루프탑 베리 빈스", "food", 39.8962, 116.3928, 70, "afternoon", 70, "전문", ["후통카페","specialty_coffee","sunset_view","photo_spot"]),
  p("pek-voyage-coffee-yangmeizhu", "베이징", "양매죽 사제 후통 보야지 커피", "food", 39.8955, 116.3908, 60, "afternoon", 65, "전문", ["후통카페","specialty_coffee","retro_alley","hidden_gem"]),
  p("pek-zhaozhao-tea-house", "베이징", "남라고항 조조 찻집", "culture", 39.9368, 116.4022, 80, "afternoon", 120, "후통", ["전통찻집","traditional_tea","history","retro_alley"]),
  p("pek-lao-she-teahouse", "베이징", "전문 노사 찻집 변검 & 공연", "culture", 39.8988, 116.3942, 100, "evening", 280, "전문", ["전통찻집","traditional_tea","history","culture"]),
  p("pek-soloist-coffee-qianmen", "베이징", "Dashilar 서구풍 솔로이스트 커피", "food", 39.8952, 116.3912, 60, "afternoon", 60, "전문", ["후통카페","specialty_coffee","retro_cafe","photo_spot"]),
  p("pek-mots-coffee-gulou", "베이징", "종고루 뷰 후통 모츠 커피", "food", 39.9422, 116.3958, 60, "afternoon", 55, "종고루", ["후통카페","specialty_coffee","sunset_view","photo_spot"]),
  p("pek-sanzai-tea-hutong", "베이징", "북경 후통 삼재 소담 찻집", "culture", 39.9412, 116.4018, 70, "afternoon", 90, "후통", ["전통찻집","traditional_tea","hidden_gem","nature"]),
  p("pek-big-bear-bakery-hutong", "베이징", "오도영 후통 베이커리 카페", "food", 39.9478, 116.4158, 60, "morning", 50, "후통", ["후통카페","bakery","retro_alley","photo_spot"]),

  // 로컬 바·재즈바 (8개)
  p("pek-east-shore-jazz-bar", "베이징", "십찰해 강변 이스트 쇼어 재즈바", "culture", 39.9372, 116.3918, 100, "evening", 180, "십찰해", ["재즈바","jazz_bar","live_music","night_view","night_life"]),
  p("pek-dDC-music-bar", "베이징", "후통 문화 공연 바 DDC", "culture", 39.9328, 116.4188, 90, "evening", 150, "후통", ["로컬바","live_music","subculture","night_life"]),
  p("pek-great-leap-brewing-doujiao", "베이징", "두각 후통 수제맥주 대약지배", "food", 39.9385, 116.4012, 80, "evening", 120, "후통", ["로컬바","craft_beer","retro_alley","local_gem"]),
  p("pek-capital-spirits-bar", "베이징", "후통 바이주 칵테일 바 캐피탈 스피리츠", "food", 39.9425, 116.4142, 80, "evening", 160, "후통", ["로컬바","cocktail_bar","hidden_gem","night_life"]),
  p("pek-atmosphere-bar-china-world", "베이징", "국무 80층 애트모스피어 야경 바", "food", 39.9108, 116.4578, 90, "evening", 350, "국무", ["로컬바","rooftop_bar","night_view","luxury"]),
  p("pek-janes-khoo-bar", "베이징", "산리툰 제인스 쿠 칵테일바", "food", 39.9358, 116.4532, 80, "evening", 200, "산리툰", ["로컬바","cocktail_bar","hidden_gem","night_life"]),
  p("pek-slow-boat-sanlitun", "베이징", "산리툰 슬로우 보트 수제맥주 브루어리", "food", 39.9332, 116.4528, 80, "evening", 140, "산리툰", ["로컬바","craft_beer","youth","night_life"]),
  p("pek-blue-note-beijing", "베이징", "전문 유적지 블루노트 베이징 재즈클럽", "culture", 39.8992, 116.3968, 110, "evening", 380, "전문", ["재즈바","jazz_bar","live_music","history","luxury"]),

  // ==========================================
  // 7. 홍콩 (Hong Kong)
  // ==========================================
  // 독립 카페 (10개)
  p("hkg-halfway-coffee-upper-lascar", "홍콩", "캣스트리트 빈티지 컵 하프웨이 커피", "food", 22.2845, 114.1502, 60, "morning", 65, "셩완", ["독립카페","specialty_coffee","retro_cafe","photo_spot","local_gem"]),
  p("hkg-fineprint-soho", "홍콩", "소호 사워도우 & 에스프레소 파인프린트", "food", 22.2818, 114.1528, 60, "morning", 75, "소호", ["독립카페","specialty_coffee","bakery","local"]),
  p("hkg-cupping-room-wan-chai", "홍콩", "완차이 커핑룸", "food", 22.2768, 114.1718, 60, "morning", 70, "완차이", ["독립카페","specialty_coffee","로스터리","local_gem"]),
  p("hkg-noc-coffee-co-gough", "홍콩", "고프스트리트 NOC 미니멀 로스터리", "food", 22.2838, 114.1525, 60, "afternoon", 65, "센트럴", ["독립카페","specialty_coffee","design","photo_spot"]),
  p("hkg-omotesando-koffee-wan-chai", "홍콩", "완차이 리퉁아베뉴 오모테산도 커피", "food", 22.2758, 114.1712, 50, "afternoon", 60, "완차이", ["독립카페","specialty_coffee","photo_spot"]),
  p("hkg-winstons-coffee-sai-ying-pun", "홍콩", "사이잉푼 영화관 윈스턴스 커피", "food", 22.2858, 114.1398, 60, "morning", 65, "사이잉푼", ["독립카페","specialty_coffee","retro_cafe","photo_spot"]),
  p("hkg-hazel-vintage-coffee", "홍콩", "센트럴 앤티크 헤이즐 커피", "food", 22.2825, 114.1538, 60, "afternoon", 70, "센트럴", ["독립카페","specialty_coffee","retro_cafe","hidden_gem"]),
  p("hkg-accr-coffee-sheung-wan", "홍콩", "셩완 앤티크 로스터리 ACCR", "food", 22.2862, 114.1488, 60, "afternoon", 65, "셩완", ["독립카페","specialty_coffee","로스터리","hidden_gem"]),
  p("hkg-urban-coffee-roaster-tsim-sha", "홍콩", "침사추이 아시안 로스터리 커피", "food", 22.2982, 114.1728, 60, "morning", 60, "침사추이", ["독립카페","specialty_coffee","로스터리","local"]),
  p("hkg-kahawa-coffee-sai-kung", "홍콩", "사이쿵 해변 카하와", "food", 22.3812, 114.2718, 70, "afternoon", 70, "사이쿵", ["독립카페","specialty_coffee","해변","hidden_gem"]),

  // 루프탑바·칵테일바·로컬 펍 (10개)
  p("hkg-aqua-spirit-rooftop", "홍콩", "침사추이 빅토리아 하버 아쿠아 루프탑바", "food", 22.2958, 114.1702, 90, "evening", 350, "침사추이", ["루프탑바","rooftop_bar","night_view","luxury"]),
  p("hkg-sevva-rooftop-central", "홍콩", "센트럴 프린스 빌딩 세바 야경 루프탑", "food", 22.2812, 114.1595, 90, "evening", 400, "센트럴", ["루프탑바","rooftop_bar","night_view","luxury"]),
  p("hkg-the-diplomat-cocktail", "홍콩", "소호 칵테일바 디플로맷", "food", 22.2822, 114.1532, 80, "evening", 220, "소호", ["칵테일바","cocktail_bar","night_life","luxury"]),
  p("hkg-quinary-molecular-bar", "홍콩", "소호 분자 칵테일바 퀴너리", "food", 22.2831, 114.1522, 80, "evening", 200, "소호", ["칵테일바","cocktail_bar","night_life","local_gem"]),
  p("hkg-coa-tequila-bar", "홍콩", "소호 데킬라 칵테일바 COA", "food", 22.2828, 114.1518, 90, "evening", 250, "소호", ["칵테일바","cocktail_bar","night_life","local_gem"]),
  p("hkg-foxglove-speakeasy", "홍콩", "센트럴 스피크이지 팍스글로브", "food", 22.2815, 114.1568, 80, "evening", 220, "센트럴", ["칵테일바","cocktail_bar","hidden_gem","night_life"]),
  p("hkg-ping-pong-129", "홍콩", "사이잉푼 옛 핑퐁장 지하 진바 핑퐁 129", "food", 22.2868, 114.1408, 80, "evening", 180, "사이잉푼", ["로컬펍","cocktail_bar","retro_alley","night_life"]),
  p("hkg-stockton-speakeasy", "홍콩", "센트럴 골목 칵테일바 스톡턴", "food", 22.2818, 114.1552, 80, "evening", 200, "센트럴", ["칵테일바","cocktail_bar","hidden_gem","night_life"]),
  p("hkg-iron-fairies-kwai-fong", "홍콩", "나비 인테리어 아이언 페어리스", "food", 22.2822, 114.1542, 90, "evening", 220, "센트럴", ["로컬펍","cocktail_bar","night_life","design"]),
  p("hkg-eyebar-tsim-sha-tsui", "홍콩", "아이스퀘어 30층 뷰 아이바", "food", 22.2965, 114.1718, 80, "evening", 200, "침사추이", ["루프탑바","rooftop_bar","night_view","local"]),

  // ==========================================
  // 8. 다낭 (Da Nang)
  // ==========================================
  // 쇼핑·시장·로컬 상점 (10개)
  p("dad-han-market-traditional", "다낭", "한시장 아오자이 & 수공예 재래시장", "market", 16.0682, 108.2242, 80, "morning", 200000, "시내", ["시장","local_market","쇼핑","nofo_eatery"]),
  p("dad-con-market-local", "다낭", "콘시장 현지인 중심 푸드 & 의류 시장", "market", 16.0695, 108.2148, 80, "afternoon", 150000, "시내", ["시장","local_market","nofo_eatery","local_gem"]),
  p("dad-son-tra-night-market", "다낭", "손짜 야시장 드래곤브릿지 먹거리", "market", 16.0612, 108.2288, 90, "evening", 150000, "손짜", ["시장","local_market","야시장","night_life"]),
  p("dad-danang-souvenir-cafe", "다낭", "한강변 다낭 수베니어 & 크래프트 숍", "shopping", 16.0712, 108.2238, 60, "afternoon", 100000, "시내", ["로컬상점","shopping","선물","photo_spot"]),
  p("dad-hoa-ly-handicraft", "다낭", "미케비치 라탄 & 수공예 소품숍 화리", "shopping", 16.0558, 108.2422, 60, "afternoon", 150000, "미케비치", ["로컬상점","shopping","라탄","photo_spot"]),
  p("dad-chom-chom-travel-shop", "다낭", "안상 로컬 공예 & 의류 편집숍", "shopping", 16.0538, 108.2435, 60, "afternoon", 200000, "안상", ["로컬상점","shopping","편집숍","youth"]),
  p("dad-bac-my-an-market", "다낭", "박미안 시장 아보카도 동네 재래시장", "market", 16.0428, 108.2388, 60, "afternoon", 50000, "박미안", ["시장","local_market","nofo_eatery","local_gem"]),
  p("dad-may-paper-craft", "다낭", "다낭 수제 종이공예 인테리어 숍", "shopping", 16.0652, 108.2218, 50, "afternoon", 100000, "시내", ["로컬상점","shopping","공예","hidden_gem"]),
  p("dad-clover-spa-shop", "다낭", "미케비치 유기농 아로마 오일 숍", "shopping", 16.0578, 108.2452, 50, "afternoon", 200000, "미케비치", ["로컬상점","shopping","아로마","local"]),
  p("dad-mori-craft-market", "다낭", "안상 수공예 팝업 미니 마켓", "shopping", 16.0522, 108.2448, 60, "afternoon", 100000, "안상", ["로컬상점","shopping","공예","youth"]),

  // 카페·브런치·로스터리 (10개)
  p("dad-43-factory-coffee", "다낭", "안상 로스터리 43 팩토리", "food", 16.0528, 108.2438, 70, "morning", 90000, "안상", ["스페셜티카페","specialty_coffee","로스터리","photo_spot"]),
  p("dad-reply-1988-cafe", "다낭", "한강변 1988 카페 리플라이", "food", 16.0642, 108.2208, 60, "afternoon", 60000, "시내", ["로컬카페","retro_cafe","photo_spot","youth"]),
  p("dad-wonderlust-cafe-bakery", "다낭", "도림 온실 원더러스트 카페", "food", 16.0668, 108.2215, 70, "afternoon", 70000, "시내", ["브런치","specialty_coffee","bakery","photo_spot"]),
  p("dad-ikigai-garden-cafe", "다낭", "일본 정원 스타일 이키가이 카페", "food", 16.0625, 108.2162, 60, "morning", 55000, "시내", ["로컬카페","정원","photo_spot","hidden_gem"]),
  p("dad-boulevard-gelato-coffee", "다낭", "도심 수제 젤라또 & 에스프레소 불바드", "food", 16.0658, 108.2228, 50, "afternoon", 65000, "시내", ["디저트","gelato","specialty_coffee","photo_spot"]),
  p("dad-six-on-six-cafe", "다낭", "미케비치 브런치 서양식 식스온식스", "food", 16.0488, 108.2458, 70, "morning", 120000, "미케비치", ["브런치","specialty_coffee","photo_spot","local"]),
  p("dad-rooty-coffee-danang", "다낭", "미케비치 로스터리 루트 커피", "food", 16.0542, 108.2432, 60, "morning", 50000, "미케비치", ["로스터리","specialty_coffee","local_gem"]),
  p("dad-nam-house-retro-cafe", "다낭", "골목 베트남 남하우스", "food", 16.0718, 108.2198, 60, "afternoon", 45000, "시내", ["로컬카페","retro_cafe","photo_spot","hidden_gem"]),
  p("dad-avocado-cafe-con", "다낭", "콘시장 아보카도 코코넛 카페", "food", 16.0692, 108.2152, 40, "afternoon", 30000, "시내", ["로컬카페","nofo_eatery","local_gem","디저트"]),
  p("dad-brewhouse-coffee-danang", "다낭", "미케비치 콜드브루 브루하우스", "food", 16.0565, 108.2445, 60, "morning", 60000, "미케비치", ["로스터리","specialty_coffee","local"]),

  // 야간 장소 (6개)
  p("dad-sky36-rooftop-bar", "다낭", "노보텔 36층 뷰 스카이36 루프탑", "food", 16.0772, 108.2245, 90, "evening", 300000, "시내", ["야간장소","rooftop_bar","night_view","night_life"]),
  p("dad-dragon-bridge-fire", "다낭", "용다리 불쇼 & 야경 강변 보드워크", "nature", 16.0608, 108.2272, 70, "evening", 0, "한강변", ["야간장소","night_view","free_viewpoint","photo_spot"]),
  p("dad-on-the-radio-bar", "다낭", "도심 라이브 인디 밴드 바 온더라디오", "culture", 16.0672, 108.2202, 90, "evening", 150000, "시내", ["야간장소","live_music","night_life","local_gem"]),
  p("dad-bambino-cocktail-club", "다낭", "미케비치 밤비노 칵테일클럽", "food", 16.0532, 108.2442, 80, "evening", 180000, "미케비치", ["야간장소","cocktail_bar","night_life","youth"]),
  p("dad-sevva-rooftop-danang", "다낭", "한강 야경 세바 루프탑 바", "food", 16.0655, 108.2255, 80, "evening", 200000, "시내", ["야간장소","rooftop_bar","night_view","local"]),
  p("dad-craft-beer-seven-bridges", "다낭", "한강변 칠교 수제맥주 브루어리", "food", 16.0675, 108.2248, 80, "evening", 120000, "시내", ["야간장소","craft_beer","night_life","local_gem"]),

  // ==========================================
  // 9. 하노이 (Hanoi)
  // ==========================================
  // 쇼핑·시장·공예 상점 (10개)
  p("han-dong-xuan-market", "하노이", "동쑤언 재래시장 상점가", "market", 21.0382, 105.8492, 90, "morning", 100000, "구시가지", ["시장","local_market","nofo_eatery","shopping"]),
  p("han-hanoi-weekend-night-market", "하노이", "구시가지 주말 야시장", "market", 21.0358, 105.8505, 90, "evening", 150000, "구시가지", ["시장","local_market","야시장","night_life"]),
  p("han-hang-gai-silk-street", "하노이", "항가이 실크 & 아오자이 공예 거리", "shopping", 21.0315, 105.8502, 70, "afternoon", 200000, "구시가지", ["공예상점","shopping","실크","history"]),
  p("han-ceramic-mosaic-mural", "하노이", "하노이 도자기 벽화 거리", "culture", 21.0368, 105.8568, 60, "afternoon", 0, "홍강변", ["공예상점","photo_spot","free_viewpoint","art"]),
  p("han-tann-hoang-craft", "하노이", "구시가지 수제 자수 & 라탄 공예 숍", "shopping", 21.0332, 105.8512, 60, "afternoon", 100000, "구시가지", ["공예상점","shopping","라탄","local"]),
  p("han-zo-project-paper", "하노이", "쏘(Dó) 종이 공예 숍 Zō", "shopping", 21.0362, 105.8432, 60, "afternoon", 80000, "구시가지", ["공예상점","shopping","종이공예","hidden_gem"]),
  p("han-tired-city-hanoi", "하노이", "하노이 인디 아티스트 굿즈 숍 타이얼드시티", "shopping", 21.0308, 105.8522, 50, "afternoon", 100000, "구시가지", ["공예상점","shopping","디자인","youth"]),
  p("han-craft-link-shop", "하노이", "소수민족 공정무역 수공예 숍 크래프트링크", "shopping", 21.0282, 105.8348, 60, "afternoon", 120000, "바딘구", ["공예상점","shopping","수공예","hidden_gem"]),
  p("han-quang-ba-flower-market", "하노이", "꽝바 야간 꽃시장", "market", 21.0668, 105.8238, 70, "evening", 50000, "서호", ["시장","local_market","night_life","photo_spot"]),
  p("han-hang-dieu-market", "하노이", "항디에우 가죽 & 공예 상점가", "shopping", 21.0342, 105.8475, 60, "afternoon", 150000, "구시가지", ["공예상점","shopping","가죽","retro_alley"]),

  // 카페·전통 커피 (10개)
  p("han-cafe-giang-egg-coffee", "하노이", "에그커피 카페 짱", "food", 21.0345, 105.8532, 50, "morning", 35000, "구시가지", ["전통커피","nofo_eatery","local_gem","에그커피"]),
  p("han-cafe-dinh-egg-coffee", "하노이", "호안끼엠 호수 뷰 카페 딘", "food", 21.0318, 105.8528, 50, "afternoon", 30000, "구시가지", ["전통커피","nofo_eatery","local_gem","호수뷰"]),
  p("han-loading-t-cafe", "하노이", "프랑스 고가옥 로딩티 카페", "food", 21.0305, 105.8488, 60, "afternoon", 55000, "구시가지", ["전통커피","retro_cafe","photo_spot","hidden_gem"]),
  p("han-tranquil-books-coffee", "하노이", "구시가지 조용한 책방 카페 트랭퀼", "food", 21.0285, 105.8458, 70, "afternoon", 60000, "구시가지", ["독립서점카페","indie_bookstore","specialty_coffee","hidden_gem"]),
  p("han-blackbird-coffee-old", "하노이", "구시가지 블랙버드 로스터리", "food", 21.0328, 105.8498, 60, "morning", 50000, "구시가지", ["전통커피","specialty_coffee","로스터리","photo_spot"]),
  p("han-kafeville-specialty", "하노이", "하노이 드립 전문 카페빌", "food", 21.0402, 105.8448, 60, "morning", 55000, "구시가지", ["전통커피","specialty_coffee","핸드드립","local"]),
  p("han-hidden-gem-cafe", "하노이", "재활용 인테리어 히든젬 에그커피", "food", 21.0365, 105.8542, 60, "afternoon", 45000, "구시가지", ["전통커피","hidden_gem","에그커피","photo_spot"]),
  p("han-hanoi-house-cafe", "하노이", "하노이 성당 뷰 고가옥 발코니 카페", "food", 21.0288, 105.8492, 60, "afternoon", 60000, "구시가지", ["전통커피","retro_cafe","photo_spot","성당뷰"]),
  p("han-la-tasse-de-cafe", "하노이", "서호 테라스 뷰 프랑스풍 카페", "food", 21.0582, 105.8292, 70, "afternoon", 65000, "서호", ["전통커피","specialty_coffee","sunset_view","photo_spot"]),
  p("han-oriental-tea-house", "하노이", "호안끼엠 동양 찻집 오리엔탈 티", "culture", 21.0312, 105.8518, 70, "afternoon", 70000, "구시가지", ["전통커피","traditional_tea","history","hidden_gem"]),

  // 바·재즈바·루프탑 (8개)
  p("han-binh-minh-jazz-club", "하노이", "오페라하우스 옆 빈민 재즈클럽", "culture", 21.0248, 105.8562, 110, "evening", 250000, "구시가지", ["재즈바","jazz_bar","live_music","history","night_life"]),
  p("han-diamond-sky-bar", "하노이", "구시가지 360도 야경 다이아몬드 스카이 바", "food", 21.0335, 105.8548, 90, "evening", 200000, "구시가지", ["루프탑바","rooftop_bar","night_view","sunset_view"]),
  p("han-top-of-hanoi-lotte", "하노이", "롯데센터 65층 루프탑 탑오브하노이", "food", 21.0318, 105.8132, 90, "evening", 300000, "바딘구", ["루프탑바","rooftop_bar","night_view","luxury"]),
  p("han-polite-co-cocktails", "하노이", "폴라이트 & 코 칵테일바", "food", 21.0302, 105.8508, 80, "evening", 180000, "구시가지", ["칵테일바","cocktail_bar","history","night_life"]),
  p("han-ray-quan-railway-bar", "하노이", "철길 마을 스피크이지 주 바 레이콴", "food", 21.0272, 105.8402, 80, "evening", 150000, "철길마을", ["로컬바","hidden_gem","retro_alley","night_life"]),
  p("han-furbrew-craft-beer", "하노이", "서호 수제맥주 퍼브루 아시안 브루어리", "food", 21.0632, 105.8242, 80, "evening", 120000, "서호", ["로컬바","craft_beer","night_life","local_gem"]),
  p("han-lighthouse-sky-bar", "하노이", "호안끼엠 뷰 등대 루프탑 바", "food", 21.0322, 105.8535, 80, "evening", 180000, "구시가지", ["루프탑바","rooftop_bar","night_view","photo_spot"]),
  p("han-standing-bar-westlake", "하노이", "서호 강변 스탠딩 수제맥주 바", "food", 21.0558, 105.8312, 80, "evening", 140000, "서호", ["로컬바","craft_beer","night_view","youth"]),

  // ==========================================
  // 10. 호찌민 (Ho Chi Minh City)
  // ==========================================
  // 쇼핑·시장·편집숍 (10개)
  p("sgn-ben-thanh-market", "호찌민", "벤탄 재래시장 기념품 & 잡화", "market", 10.7725, 106.6982, 90, "morning", 150000, "1군", ["시장","local_market","nofo_eatery","shopping"]),
  p("sgn-binh-tay-cho-lon", "호찌민", "차이나타운 빈따이 재래시장", "market", 10.7508, 106.6508, 90, "morning", 100000, "5군", ["시장","local_market","nofo_eatery","history"]),
  p("sgn-cafe-apartment-42", "호찌민", "응우옌후에 42번지 카페 아파트먼트 숍", "shopping", 10.7742, 106.7032, 80, "afternoon", 100000, "1군", ["편집숍","shopping","photo_spot","retro_alley"]),
  p("sgn-lousia-vintage-shop", "호찌민", "1군 빈티지 의류 & 소품 편집숍", "shopping", 10.7758, 106.6958, 60, "afternoon", 200000, "1군", ["편집숍","shopping","빈티지","youth"]),
  p("sgn-ginkgo-tshirts-vietnam", "호찌민", "유기농 베트남 디자인 티셔츠 숍", "shopping", 10.7712, 106.6942, 50, "afternoon", 300000, "1군", ["편집숍","shopping","디자인","local"]),
  p("sgn-saddec-district-ceramics", "호찌민", "베트남 현대 수제 도자기 숍 사덱", "shopping", 10.7788, 106.6975, 60, "afternoon", 250000, "1군", ["편집숍","shopping","도자기","photo_spot"]),
  p("sgn-an-dong-market", "호찌민", "안동 재래시장 직물 & 가죽 상점", "market", 10.7578, 106.6712, 80, "afternoon", 200000, "5군", ["시장","local_market","가죽","shopping"]),
  p("sgn-kito-lacquerware", "호찌민", "동코이 거리 주칠 공예 숍 키토", "shopping", 10.7765, 106.7028, 60, "afternoon", 300000, "1군", ["편집숍","shopping","전통공예","history"]),
  p("sgn-dan-sinh-war-market", "호찌민", "단생 밀리터리 & 빈티지 재래시장", "market", 10.7682, 106.6965, 70, "afternoon", 100000, "1군", ["시장","local_market","빈티지","history"]),
  p("sgn-concept-store-district2", "호찌민", "2군 타오디엔 디자인 레지던스 편집숍", "shopping", 10.8042, 106.7328, 80, "afternoon", 300000, "2군", ["편집숍","shopping","디자인","photo_spot"]),

  // 카페·스페셜티 커피 (12개)
  p("sgn-bosgaurus-coffee-roasters", "호찌민", "사이공 강변 보스가우루스", "food", 10.7892, 106.7162, 70, "morning", 90000, "빈탄구", ["스페셜티카페","specialty_coffee","로스터리","강변뷰"]),
  p("sgn-workshop-specialty-coffee", "호찌민", "1군 베트남 웍샵", "food", 10.7752, 106.7038, 70, "morning", 85000, "1군", ["스페셜티카페","specialty_coffee","로스터리","local_gem"]),
  p("sgn-shin-coffee-nguyen-hue", "호찌민", "응우옌후에 신 커피", "food", 10.7735, 106.7042, 60, "afternoon", 75000, "1군", ["스페셜티카페","specialty_coffee","핸드드립","local"]),
  p("sgn-cheo-leo-cafe-vintage", "호찌민", "첼레오 카페", "food", 10.7678, 106.6808, 60, "morning", 30000, "3군", ["스페셜티카페","nofo_eatery","retro_cafe","history"]),
  p("sgn-okkio-caffe-le-loi", "호찌민", "레러이 레드 브루잉 오키오 카페", "food", 10.7732, 106.6978, 60, "morning", 70000, "1군", ["스페셜티카페","specialty_coffee","photo_spot","design"]),
  p("sgn-duong-bo-cafe", "호찌민", "골목 정원 즈엉보 카페", "food", 10.7782, 106.6922, 60, "afternoon", 65000, "1군", ["스페셜티카페","specialty_coffee","정원","photo_spot"]),
  p("sgn-dabao-concept-cafe", "호찌민", "황실 정원풍 다바오 콘셉트 카페", "food", 10.7812, 106.6915, 70, "afternoon", 80000, "3군", ["스페셜티카페","specialty_coffee","photo_spot","hidden_gem"]),
  p("sgn-cafe-den-da", "호찌민", "24시간 로컬 에스프레소 카페 덴다", "food", 10.7718, 106.6938, 50, "evening", 45000, "1군", ["스페셜티카페","local_gem","retro_cafe","night_life"]),
  p("sgn-little-ha-noi-egg-coffee", "호찌민", "1군 에그커피 전문 리틀하노이", "food", 10.7688, 106.6928, 50, "morning", 40000, "1군", ["스페셜티카페","에그커피","local_gem","photo_spot"]),
  p("sgn-mockingbird-cafe", "호찌민", "옛 아파트 건물 모킹버드", "food", 10.7702, 106.7025, 60, "afternoon", 55000, "1군", ["스페셜티카페","retro_cafe","photo_spot","hidden_gem"]),
  p("sgn-snoob-coffee-24h", "호찌민", "24시간 로컬 콜드브루 스눕 커피", "food", 10.7658, 106.6908, 60, "evening", 45000, "1군", ["스페셜티카페","night_life","local","24시"]),
  p("sgn-manki-specialty-coffee", "호찌민", "골목 빈티지 만키", "food", 10.7715, 106.7018, 60, "morning", 70000, "1군", ["스페셜티카페","specialty_coffee","hidden_gem","local"]),

  // 루프탑바·재즈바·로컬 펍 (10개)
  p("sgn-chill-skybar-rooftop", "호찌민", "AB타워 26층 칠 스카이바", "food", 10.7708, 106.6932, 90, "evening", 350000, "1군", ["루프탑바","rooftop_bar","night_view","luxury"]),
  p("sgn-social-club-rooftop", "호찌민", "엠갤러리 루프탑 소셜클럽 바", "food", 10.7838, 106.6978, 90, "evening", 300000, "3군", ["루프탑바","rooftop_bar","night_view","luxury"]),
  p("sgn-saxnart-jazz-club", "호찌민", "동코이거리 베테랑 색소폰 사가 재즈클럽", "culture", 10.7762, 106.7035, 110, "evening", 250000, "1군", ["재즈바","jazz_bar","live_music","history"]),
  p("sgn-rabbit-hole-cocktails", "호찌민", "미술관 지하 스피크이지 래빗홀", "food", 10.7778, 106.6962, 80, "evening", 200000, "1군", ["칵테일바","cocktail_bar","hidden_gem","night_life"]),
  p("sgn-summer-experiment-bar", "호찌민", "실험적 과일 칵테일 써머 익스페리먼트", "food", 10.7745, 106.7012, 80, "evening", 220000, "1군", ["칵테일바","cocktail_bar","night_life","youth"]),
  p("sgn-pasteur-street-brewing", "호찌민", "파스퇴르 스트리트 수제맥주", "food", 10.7758, 106.7002, 80, "evening", 150000, "1군", ["로컬펍","craft_beer","night_life","local_gem"]),
  p("sgn-heart-of-darkness-craft", "호찌민", "수제맥주 하트 오브 다크니스", "food", 10.7785, 106.7022, 80, "evening", 160000, "1군", ["로컬펍","craft_beer","night_life","local"]),
  p("sgn-zuma-rooftop-saigon", "호찌민", "사이공 강변 뷰 루프탑 주마", "food", 10.7722, 106.7065, 80, "evening", 250000, "1군", ["루프탑바","rooftop_bar","night_view","sunset_view"]),
  p("sgn-layla-eatery-drinkery", "호찌민", "고가옥 바 레이라", "food", 10.7768, 106.7025, 80, "evening", 180000, "1군", ["칵테일바","cocktail_bar","hidden_gem","night_life"]),
  p("sgn-bui-vien-walking-pub", "호찌민", "부이비엔 여행자거리 활기찬 펍", "food", 10.7672, 106.6935, 90, "evening", 100000, "1군", ["로컬펍","night_life","youth","street_pub"]),

  // ==========================================
  // 11. 파리 (Paris)
  // ==========================================
  // 로컬 비스트로·노포 (15개)
  p("par-bistrot-paul-bert", "파리", "11구 비스트로 폴 베르", "food", 48.8532, 2.3832, 80, "evening", 45, "11구", ["비스트로","bistro","nofo_eatery","local_gem"]),
  p("par-le-comptoir-du-relais", "파리", "생제르맹 비스트로 컴투아 르 릴레이", "food", 48.8522, 2.3388, 80, "afternoon", 40, "6구", ["비스트로","bistro","nofo_eatery","local_gem"]),
  p("par-chez-l-ami-jean", "파리", "7구 대중적인 바스크 비스트로 아미 장", "food", 48.8588, 2.3068, 90, "evening", 50, "7구", ["비스트로","bistro","nofo_eatery","local_gem"]),
  p("par-bouillon-chartier-grands", "파리", "부용 샤르티에", "food", 48.8722, 2.3432, 70, "afternoon", 20, "9구", ["비스트로","bistro","nofo_eatery","history"]),
  p("par-bouillon-julien", "파리", "10구 부용 쥐리앙", "food", 48.8712, 2.3538, 70, "evening", 25, "10구", ["비스트로","bistro","nofo_eatery","photo_spot"]),
  p("par-le-momo-bistrot", "파리", "마레 지구 비스트로", "food", 48.8578, 2.3612, 80, "evening", 35, "마레", ["비스트로","bistro","hidden_gem","local"]),
  p("par-chez-janou", "파리", "마레 지구 프로방스 요리 & 자누", "food", 48.8562, 2.3668, 80, "evening", 35, "마레", ["비스트로","bistro","nofo_eatery","local_gem"]),
  p("par-le-petit-marche", "파리", "마레 지구 참치 스테이크 비스트로", "food", 48.8558, 2.3658, 80, "evening", 38, "마레", ["비스트로","bistro","nofo_eatery","local_gem"]),
  p("par-bistrot-des-gascons", "파리", "12구 가스코뉴 비스트로", "food", 48.8475, 2.3788, 80, "evening", 40, "12구", ["비스트로","bistro","nofo_eatery","local"]),
  p("par-au-pied-de-cochon", "파리", "할레 지구 족발/양파스프", "food", 48.8625, 2.3458, 80, "evening", 35, "1구", ["비스트로","bistro","nofo_eatery","history"]),
  p("par-chez-georges-ruerob", "파리", "2구 손글씨 메뉴판 비스트로 쥐르주", "food", 48.8665, 2.3392, 80, "afternoon", 35, "2구", ["비스트로","bistro","nofo_eatery","retro_cafe"]),
  p("par-robert-et-louise", "파리", "마레 지구 로베르 에 루이즈", "food", 48.8582, 2.3608, 80, "evening", 38, "마레", ["비스트로","bistro","nofo_eatery","local_gem"]),
  p("par-clamato-seafood", "파리", "11구 신선한 해산물 비스트로 클라마토", "food", 48.8538, 2.3812, 80, "evening", 45, "11구", ["비스트로","bistro","local_gem","seafood"]),
  p("par-frenchie-bistrot", "파리", "2구 현대적 프랑스 비스트로 프렌치", "food", 48.8672, 2.3482, 90, "evening", 55, "2구", ["비스트로","bistro","local_gem","luxury"]),
  p("par-duguesclin-bistrot", "파리", "6구 라탱지구 오래된 동네 식당", "food", 48.8508, 2.3398, 70, "afternoon", 25, "6구", ["비스트로","bistro","local","nofo_eatery"]),

  // 독립 카페·베이커리 (15개)
  p("par-ten-belles-canal", "파리", "생마르탱 텐 벨스", "food", 48.8718, 2.3658, 60, "morning", 6, "생마르탱", ["독립카페","specialty_coffee","local_gem"]),
  p("par-boot-cafe-marais", "파리", "카페 부트", "food", 48.8618, 2.3648, 50, "afternoon", 5, "마레", ["독립카페","specialty_coffee","photo_spot","hidden_gem"]),
  p("par-fragments-paris", "파리", "마레 지구 아보카도 토스트 & 드립 프래그먼츠", "food", 48.8588, 2.3662, 60, "morning", 12, "마레", ["독립카페","specialty_coffee","브런치","local_gem"]),
  p("par-ob-la-di-cafe", "파리", "마레 지구 브런치 림 카페", "food", 48.8628, 2.3625, 60, "afternoon", 14, "마레", ["독립카페","specialty_coffee","photo_spot","youth"]),
  p("par-kb-coffee-roasters", "파리", "몽마르트르언덕 입구 로스터리 KB", "food", 48.8808, 2.3382, 60, "morning", 6, "9구", ["독립카페","specialty_coffee","로스터리","local"]),
  p("par-coutume-cafe-7th", "파리", "7구 프랑스 선구자 쿠툼", "food", 48.8518, 2.3182, 60, "morning", 7, "7구", ["독립카페","specialty_coffee","로스터리","local_gem"]),
  p("par-dreamin-man-cafe", "파리", "11구 일본 바리스타의 정적 빈티지 카페", "food", 48.8568, 2.3732, 60, "afternoon", 6, "11구", ["독립카페","specialty_coffee","retro_cafe","hidden_gem"]),
  p("par-du-pain-et-des-idees", "파리", "두 팽 에 데 지데", "food", 48.8712, 2.3628, 45, "morning", 8, "10구", ["베이커리","bakery","nofo_eatery","history"]),
  p("par-mamiche-bakery-9th", "파리", "9구 동네 최애 줄서는 베이커리 마미슈", "food", 48.8802, 2.3395, 45, "morning", 6, "9구", ["베이커리","bakery","local_gem","popular"]),
  p("par-poilane-bakery-6th", "파리", "생제르맹 사워도우 푸알란", "food", 48.8505, 2.3282, 45, "morning", 7, "6구", ["베이커리","bakery","nofo_eatery","history"]),
  p("par-ble-sucre-pastry", "파리", "12구 마들렌 천국 블레 쉬크레", "food", 48.8512, 2.3785, 40, "morning", 5, "12구", ["베이커리","bakery","local_gem","마들렌"]),
  p("par-stohrer-pastry-1730", "파리", "2구 스토레", "food", 48.8655, 2.3475, 50, "afternoon", 9, "2구", ["베이커리","bakery","nofo_eatery","history"]),
  p("par-mori-yoshida-pastry", "파리", "7구 몽블랑 모리 요시다", "food", 48.8488, 2.3128, 45, "afternoon", 10, "7구", ["베이커리","bakery","dessert","photo_spot"]),
  p("par-des-gateaux-et-du-pain", "파리", "15구 르누아르 장인 베이커리", "food", 48.8432, 2.3028, 45, "morning", 8, "15구", ["베이커리","bakery","local_gem"]),
  p("par-circus-bakery-pantheon", "파리", "판테온 옆 시나몬롤 서커스 베이커리", "food", 48.8515, 2.3488, 40, "afternoon", 6, "5구", ["베이커리","bakery","youth","hidden_gem"]),

  // 독립서점·갤러리 (10개)
  p("par-shakespeare-and-company", "파리", "센강변 100년 영문 독립서점 셰익스피어", "culture", 48.8525, 2.3472, 70, "afternoon", 0, "5구", ["독립서점","indie_bookstore","history","photo_spot"]),
  p("par-the-red-wheelbarrow", "파리", "뤽상부르 영문 독립서점 레드 휠배로", "culture", 48.8482, 2.3392, 50, "afternoon", 0, "6구", ["독립서점","indie_bookstore","hidden_gem","culture"]),
  p("par-librairie-galignani", "파리", "튈르리 정원 옆 1801년 서점 갈리냐니", "culture", 48.8652, 2.3278, 60, "afternoon", 0, "1구", ["독립서점","indie_bookstore","history","culture"]),
  p("par-yvon-lambert-bookshop", "파리", "마레 예술 독립서점 이봉 람베르", "culture", 48.8582, 2.3642, 60, "afternoon", 0, "마레", ["독립서점","indie_bookstore","art","hidden_gem"]),
  p("par-ofr-paris-bookshop", "파리", "마레 패션 & 예술 잡지 서점 Ofr.", "culture", 48.8648, 2.3638, 60, "afternoon", 0, "마레", ["독립서점","indie_bookstore","subculture","youth"]),
  p("par-perrotin-gallery-marais", "파리", "마레 지구 현대아트 페로탱 갤러리", "culture", 48.8615, 2.3665, 70, "afternoon", 0, "마레", ["소규모갤러리","gallery","현대미술","art"]),
  p("par-thaddaeus-ropac-gallery", "파리", "마레 19세기 저택 타데우스 로팍 갤러리", "culture", 48.8598, 2.3618, 70, "afternoon", 0, "마레", ["소규모갤러리","gallery","현대미술","history"]),
  p("par-lafayette-anticipations", "파리", "마레 쿨하스 건축 가변 아트센터", "culture", 48.8585, 2.3548, 70, "afternoon", 0, "마레", ["소규모갤러리","gallery","건축","design"]),
  p("par-mep-photography-museum", "파리", "마레 파리 사진 미술관 MEP", "culture", 48.8552, 2.3582, 80, "afternoon", 10, "마레", ["소규모갤러리","gallery","사진","art"]),
  p("par-librairie-du-monde-entier", "파리", "생제르맹 문학 전문 독립서점", "culture", 48.8528, 2.3342, 50, "afternoon", 0, "6구", ["독립서점","indie_bookstore","hidden_gem"]),

  // 재즈바·와인바·루프탑 (10개)
  p("par-duc-des-lombards", "파리", "샤틀레 레전드 재즈클럽 댝 데 롱바르", "culture", 48.8595, 2.3468, 110, "evening", 30, "1구", ["재즈바","jazz_bar","live_music","history","night_life"]),
  p("par-sunset-sunside-jazz", "파리", "샤틀레 지하 2색 재즈클럽 썬셋 썬사이드", "culture", 48.8598, 2.3472, 110, "evening", 28, "1구", ["재즈바","jazz_bar","live_music","night_life"]),
  p("par-le-caveau-de-la-huchette", "파리", "라탱지구 16세기 지하 재즈바 카보 드 라 위셰트", "culture", 48.8528, 2.3448, 110, "evening", 15, "5구", ["재즈바","jazz_bar","live_music","history","night_life"]),
  p("par-frenchie-bar-a-vins", "파리", "2구 내추럴 와인바 프렌치 바 아 뱅", "food", 48.8675, 2.3485, 80, "evening", 30, "2구", ["와인바","wine_bar","local_gem","night_life"]),
  p("par-le-caveau-des-oubliettes", "파리", "라탱지구 12세기 감옥 재즈 & 블루스 바", "culture", 48.8518, 2.3468, 100, "evening", 20, "5구", ["재즈바","jazz_bar","history","hidden_gem"]),
  p("par-septime-la-cave", "파리", "11구 스탠딩 내추럴 와인바 셉팀 라 카브", "food", 48.8535, 2.3808, 70, "evening", 25, "11구", ["와인바","wine_bar","local_gem","night_life"]),
  p("par-le-perchoir-marais", "파리", "BHV 백화점 루프탑 바 르 페르슈아 마레", "food", 48.8568, 2.3528, 80, "evening", 20, "마레", ["루프탑바","rooftop_bar","night_view","photo_spot"]),
  p("par-le-perchoir-menilmontant", "파리", "11구 파리 전경 루프탑 르 페르슈아", "food", 48.8645, 2.3812, 90, "evening", 22, "11구", ["루프탑바","rooftop_bar","night_view","youth"]),
  p("par-rooftop-le-louxor", "파리", "10구 아르데코 극장 루프탑 바 룩소르", "food", 48.8835, 2.3502, 70, "evening", 18, "10구", ["루프탑바","rooftop_bar","night_view","hidden_gem"]),
  p("par-aux-trois-mailletz", "파리", "라탱지구 카바레 & 재즈 카보 트루아 마이에", "culture", 48.8522, 2.3462, 100, "evening", 20, "5구", ["재즈바","jazz_bar","history","night_life"]),

  // ==========================================
  // 12. 런던 (London)
  // ==========================================
  // 로컬 펍 (15개)
  p("lon-ye-olde-cheshire-cheese", "런던", "펍 예 올드 체셔 치즈", "food", 51.5142, -0.1075, 80, "evening", 18, "시티", ["로컬펍","local_pub","nofo_eatery","history","night_life"]),
  p("lon-the-churchill-arms", "런던", "켄싱턴 꽃으로 둘러싸인 처칠 암스", "food", 51.5068, -0.1945, 80, "afternoon", 16, "켄싱턴", ["로컬펍","local_pub","photo_spot","history"]),
  p("lon-the-anchorage-bankside", "런던", "템스강변 앵커 뱅크사이드", "food", 51.5065, -0.0935, 80, "evening", 18, "사우스뱅크", ["로컬펍","local_pub","강변","history"]),
  p("lon-the-black-friar", "런던", "펍 더 블랙 프라이어", "food", 51.5122, -0.1035, 70, "evening", 16, "시티", ["로컬펍","local_pub","건축","history"]),
  p("lon-the-french-house-soho", "런던", "소호 문학가들의 펍 더 프렌치 하우스", "food", 51.5125, -0.1318, 70, "evening", 15, "소호", ["로컬펍","local_pub","history","local_gem"]),
  p("lon-the-grenadier-belgravia", "런던", "벨그레이비어 숨은 펍 더 그리너디어", "food", 51.5015, -0.1538, 70, "evening", 18, "벨그레이비어", ["로컬펍","local_pub","hidden_gem","history"]),
  p("lon-the-nag-s-head-covent", "런던", "코벤트가든 앤티크 더 내그스 헤드", "food", 51.5118, -0.1258, 70, "evening", 15, "코벤트가든", ["로컬펍","local_pub","nofo_eatery","history"]),
  p("lon-the-holly-bush-hampstead", "런던", "햄스테드 언덕 운치 있는 더 홀리 부시", "food", 51.5568, -0.1788, 80, "afternoon", 18, "햄스테드", ["로컬펍","local_pub","hidden_gem","history"]),
  p("lon-the-lamb-flag-covent", "런던", "코벤트가든 더 램 앤 플래그", "food", 51.5112, -0.1262, 70, "evening", 16, "코벤트가든", ["로컬펍","local_pub","nofo_eatery","history"]),
  p("lon-the-spaniards-inn", "런던", "햄스테드 1585년 역사 더 스패니어즈 인", "food", 51.5718, -0.1728, 80, "afternoon", 20, "햄스테드", ["로컬펍","local_pub","history","hidden_gem"]),
  p("lon-the-grapes-limehouse", "런던", "템스강변 이안 맥켈런의 펍 더 그레이프스", "food", 51.5092, -0.0385, 80, "evening", 18, "타워하믈렛", ["로컬펍","local_pub","강변","history"]),
  p("lon-the-dove-hammersmith", "런던", "템스강변 가장 작은 바 공간 더 다브", "food", 51.4908, -0.2312, 80, "afternoon", 16, "해머스미스", ["로컬펍","local_pub","강변","history"]),
  p("lon-the-ten-bells-spitalfields", "런던", "스피탈필즈 더 텐 벨스", "food", 51.5192, -0.0748, 70, "evening", 15, "스피탈필즈", ["로컬펍","local_pub","history","local_gem"]),
  p("lon-the-crown-and-shuttle", "런던", "쇼디치 에일 야외 정원 펍 크라운 앤 셔틀", "food", 51.5242, -0.0782, 80, "evening", 16, "쇼디치", ["로컬펍","local_pub","craft_beer","youth"]),
  p("lon-the-scarsdale-tavern", "런던", "켄싱턴 조용한 주택가 테라스 스카스데일", "food", 51.4975, -0.1988, 70, "afternoon", 18, "켄싱턴", ["로컬펍","local_pub","local","hidden_gem"]),

  // 독립 카페·베이커리 (12개)
  p("lon-prufrock-coffee-holborn", "런던", "홀본 선구자 프루프록 커피", "food", 51.5198, -0.1082, 60, "morning", 4.5, "홀본", ["독립카페","specialty_coffee","로스터리","local_gem"]),
  p("lon-climpson-and-sons-broadway", "런던", "브로드웨이 마켓 대표 로스터리 클림슨", "food", 51.5368, -0.0578, 60, "morning", 4, "해크니", ["독립카페","specialty_coffee","로스터리","local_gem"]),
  p("lon-rosslyn-coffee-city", "런던", "시티 오브 런던 정밀 핸드드립 로스린", "food", 51.5132, -0.0915, 50, "morning", 4.5, "시티", ["독립카페","specialty_coffee","local_gem"]),
  p("lon-watchhouse-tower-bridge", "런던", "타워브릿지 옛 파수꾼 집 왓치하우스", "food", 51.5028, -0.0792, 60, "morning", 5, "버러", ["독립카페","specialty_coffee","history","photo_spot"]),
  p("lon-ozone-coffee-shoreditch", "런던", "쇼디치 아일랜드 로스터리 오존", "food", 51.5255, -0.0862, 70, "morning", 12, "쇼디치", ["독립카페","specialty_coffee","브런치","youth"]),
  p("lon-kestrel-coffee-soho", "런던", "소호 미니멀 에스프레소 캐스트렐", "food", 51.5138, -0.1332, 50, "morning", 4, "소호", ["독립카페","specialty_coffee","youth"]),
  p("lon-jolene-bakery-hackney", "런던", "해크니 내추럴 사워도우 졸린 베이커리", "food", 51.5528, -0.0882, 60, "morning", 8, "해크니", ["베이커리","bakery","specialty_coffee","photo_spot"]),
  p("lon-e5-bakehouse-london-fields", "런던", "런던필즈 교각 아래 아티잔 샌드위치 e5", "food", 51.5412, -0.0588, 60, "morning", 9, "해크니", ["베이커리","bakery","local_gem","photo_spot"]),
  p("lon-pophams-bakery-islington", "런던", "이슬링턴 메이플 베이컨 크루아상 팝햄스", "food", 51.5385, -0.0942, 50, "morning", 6, "이슬링턴", ["베이커리","bakery","local_gem","photo_spot"]),
  p("lon-dusty-knuckle-dalston", "런던", "달스톤 아티잔 베이커리 더스티 너클", "food", 51.5478, -0.0732, 60, "morning", 8, "달스톤", ["베이커리","bakery","local_gem","youth"]),
  p("lon-brick-lane-beigel-bake", "런던", "브릭레인 24시간 솔트비프 베이글 베이글베이크", "food", 51.5248, -0.0718, 40, "morning", 6, "브릭레인", ["베이커리","bakery","nofo_eatery","local_gem"]),
  p("lon-st-john-bakery-cove", "런던", "코벤트가든 도넛 세인트존 베이커리", "food", 51.5128, -0.1245, 40, "afternoon", 5, "코벤트가든", ["베이커리","bakery","local_gem"]),

  // 마켓·빈티지·독립서점 (12개)
  p("lon-columbia-road-flower", "런던", "일요일만 열리는 컬럼비아 로드 꽃시장", "market", 51.5292, -0.0692, 80, "morning", 0, "해크니", ["마켓","local_market","꽃시장","photo_spot"]),
  p("lon-broadway-market-hackney", "런던", "해크니 운하변 로컬 브로드웨이 마켓", "market", 51.5362, -0.0582, 90, "afternoon", 10, "해크니", ["마켓","local_market","스트리트푸드","youth"]),
  p("lon-maltby-street-market", "런던", "철교 아래 주말 알짜 몰트비 스트리트 마켓", "market", 51.5002, -0.0745, 80, "afternoon", 15, "버러", ["마켓","local_market","스트리트푸드","hidden_gem"]),
  p("lon-spitalfields-vintage-market", "런던", "올드 스피탈필즈 빈티지 & 크래프트 마켓", "market", 51.5195, -0.0755, 90, "afternoon", 0, "쇼디치", ["마켓","local_market","빈티지","shopping"]),
  p("lon-daunt-books-marylebone", "런던", "마릴본 에드워디안 양식 여행 서점 돈트 북스", "culture", 51.5208, -0.1532, 60, "afternoon", 0, "마릴본", ["독립서점","indie_bookstore","history","photo_spot"]),
  p("lon-hatchards-piccadilly", "런던", "피카딜리 1797년 왕실 지정 해차즈 서점", "culture", 51.5088, -0.1382, 60, "afternoon", 0, "메이페어", ["독립서점","indie_bookstore","history","culture"]),
  p("lon-foyles-charing-cross", "런던", "차링크로스 6층 독립 서점 포일스", "culture", 51.5135, -0.1302, 80, "afternoon", 0, "소호", ["독립서점","indie_bookstore","culture","history"]),
  p("lon-cecil-court-book-street", "런던", "해리포터 다이애건앨리 모티브 고서점 거리", "culture", 51.5105, -0.1272, 60, "afternoon", 0, "코벤트가든", ["독립서점","indie_bookstore","retro_alley","history"]),
  p("lon-brick-lane-vintage-market", "런던", "브릭레인 지하 빈티지 마켓", "shopping", 51.5222, -0.0712, 90, "afternoon", 0, "브릭레인", ["빈티지","shopping","구제샵","youth"]),
  p("lon-perseverance-works-shoreditch", "런던", "쇼디치 크리에이티브 디자인 아케이드", "shopping", 51.5268, -0.0772, 70, "afternoon", 0, "쇼디치", ["빈티지","design","shopping","photo_spot"]),
  p("lon-word-on-the-water", "런던", "운하 배 위 서점 워드 온 더 워터", "culture", 51.5348, -0.1258, 60, "afternoon", 0, "킹스크로스", ["독립서점","indie_bookstore","hidden_gem","photo_spot"]),
  p("lon-stanfords-travel-books", "런던", "코벤트가든 지도 전문 서점 스탠포즈", "culture", 51.5122, -0.1268, 60, "afternoon", 0, "코벤트가든", ["독립서점","indie_bookstore","history","culture"]),

  // 재즈바·루프탑바 (8개)
  p("lon-ronnie-scotts-soho-lon", "런던", "소호 로니 스콧", "culture", 51.5132, -0.1312, 110, "evening", 35, "소호", ["재즈바","jazz_bar","live_music","history","night_life"]),
  p("lon-vortex-jazz-club", "런던", "달스톤 아방가르드 인디 재즈 볼텍스", "culture", 51.5472, -0.0752, 100, "evening", 20, "달스톤", ["재즈바","jazz_bar","live_music","night_life"]),
  p("lon-pizzaexpress-live-soho", "런던", "소호 지하 라이브 재즈 피자익스프레스", "culture", 51.5135, -0.1322, 100, "evening", 25, "소호", ["재즈바","jazz_bar","live_music","night_life"]),
  p("lon-netil-360-rooftop", "런던", "해크니 360도 전경 수제맥주 루프탑 네틸360", "food", 51.5382, -0.0568, 80, "evening", 15, "해크니", ["루프탑바","rooftop_bar","sunset_view","youth"]),
  p("lon-frank-s-cafe-peckham", "런던", "펙컴 주차장 옥상 루프탑 프랭크스 카페", "food", 51.4705, -0.0672, 80, "evening", 12, "펙컴", ["루프탑바","rooftop_bar","sunset_view","youth"]),
  p("lon-sky-garden-city", "런던", "시티 35층 실내 정원 무료 전망 스카이가든", "landmark", 51.5112, -0.0835, 80, "evening", 0, "시티", ["루프탑바","free_viewpoint","night_view","photo_spot"]),
  p("lon-savage-garden-tower", "런던", "타워힐 스카이라인 바 세비지 가든", "food", 51.5108, -0.0768, 80, "evening", 25, "시티", ["루프탑바","rooftop_bar","night_view","luxury"]),
  p("lon-the-culpeper-rooftop", "런던", "스피탈필즈 옥상 정원 와인바 컬페퍼", "food", 51.5168, -0.0735, 80, "evening", 20, "스피탈필즈", ["루프탑바","wine_bar","rooftop_bar","local_gem"]),

  // ==========================================
  // 13. 뉴욕 (NYC)
  // ==========================================
  // 델리·다이너·로컬 맛집 (15개)
  p("nyc-katz-delicatessen", "뉴욕", "카츠 델리 파스트라미", "food", 40.7222, -73.9875, 70, "afternoon", 30, "이스트빌리지", ["델리","deli","nofo_eatery","local_gem","history"]),
  p("nyc-russ-and-daughters", "뉴욕", "1914년 연어 훈제 & 베이글 러시앤도터스", "food", 40.7225, -73.9882, 60, "morning", 25, "이스트빌리지", ["델리","deli","nofo_eatery","local_gem","history"]),
  p("nyc-2nd-ave-deli", "뉴욕", "유대인 델리 2nd 에비뉴", "food", 40.7442, -73.9785, 70, "afternoon", 28, "머레이힐", ["델리","deli","nofo_eatery","local_gem"]),
  p("nyc-emilio-ballato", "뉴욕", "소호 스타들의 단골 이탈리안 에밀리오", "food", 40.7242, -73.9938, 80, "evening", 50, "소호", ["로컬맛집","nofo_eatery","local_gem","hidden_gem"]),
  p("nyc-veselka-diner", "뉴욕", "이스트빌리지 24시간 다이너 베셀카", "food", 40.7292, -73.9872, 60, "evening", 20, "이스트빌리지", ["다이너","diner","nofo_eatery","local_gem","24시"]),
  p("nyc-eisenberg-sandwich", "뉴욕", "플랫아이언 에그샐러드 다이너", "food", 40.7412, -73.9892, 50, "morning", 15, "플랫아이언", ["다이너","diner","nofo_eatery","history"]),
  p("nyc-peter-luger-steak", "뉴욕", "브루클린 드라이에이징 피터루거", "food", 40.7098, -73.9625, 90, "evening", 120, "브루클린", ["로컬맛집","nofo_eatery","steak","history"]),
  p("nyc-joes-shanghai-chinatown", "뉴욕", "차이나타운 소룡포 만두 조스 샹하이", "food", 40.7145, -73.9978, 60, "afternoon", 25, "차이나타운", ["로컬맛집","nofo_eatery","local_gem"]),
  p("nyc-keens-steakhouse", "뉴욕", "미드타운 파이프 파이프 킨스 스파이스", "food", 40.7508, -73.9862, 90, "evening", 100, "미드타운", ["로컬맛집","nofo_eatery","history","steak"]),
  p("nyc-corner-bistro-west", "뉴욕", "웨스트빌리지 로컬 수제버거 코너 비스트로", "food", 40.7375, -74.0048, 60, "evening", 18, "웨스트빌리지", ["로컬맛집","nofo_eatery","burger","local_gem"]),
  p("nyc-lucali-brooklyn-pizza", "뉴욕", "브루클린 화덕피자 루칼리", "food", 40.6818, -73.9962, 80, "evening", 35, "브루클린", ["로컬맛집","nofo_eatery","pizza","local_gem"]),
  p("nyc-balthazar-soho", "뉴욕", "소호 프랑스 프렌치 브라세리 발타자르", "food", 40.7225, -73.9982, 80, "morning", 45, "소호", ["로컬맛집","brasserie","local_gem","photo_spot"]),
  p("nyc-minetta-tavern", "뉴욕", "그린위치 블랙레이블 버거 미네타 타번", "food", 40.7302, -74.0005, 80, "evening", 55, "그린위치", ["로컬맛집","nofo_eatery","burger","history"]),
  p("nyc-patsys-pizzeria-east", "뉴욕", "이스트하렘 1933년 화덕 피자 팻시스", "food", 40.7972, -73.9318, 60, "afternoon", 25, "이스트하렘", ["로컬맛집","nofo_eatery","pizza","history"]),
  p("nyc-los-tacos-no1-chelsea", "뉴욕", "첼시마켓 멕시칸 로스타코스 노원", "food", 40.7422, -74.0062, 45, "afternoon", 15, "첼시", ["로컬맛집","nofo_eatery","tacos","local_gem"]),

  // 독립 카페·베이커리 (12개)
  p("nyc-cafe-grumpy-chelsea", "뉴욕", "첼시 선구자 카페 그럼피", "food", 40.7455, -74.0008, 50, "morning", 6, "첼시", ["독립카페","specialty_coffee","local_gem"]),
  p("nyc-abracadabra-brooklyn", "뉴욕", "윌리엄스버그 유기농 아브라카다브라", "food", 40.7125, -73.9558, 60, "morning", 8, "브루클린", ["독립카페","specialty_coffee","유기농","photo_spot"]),
  p("nyc-devocion-flat-iron", "뉴욕", "플랫아이언 실내 정원 콜롬비아 드보시온", "food", 40.7408, -73.9888, 60, "morning", 7, "플랫아이언", ["독립카페","specialty_coffee","photo_spot","design"]),
  p("nyc-birch-coffee-madison", "뉴욕", "메디슨파크 드립 전문 버치 커피", "food", 40.7445, -73.9868, 50, "morning", 6, "메디슨파크", ["독립카페","specialty_coffee","local_gem"]),
  p("nyc-pantheon-roasters-soho", "뉴욕", "소호 빈티지 에스프레소 판테온", "food", 40.7238, -73.9995, 50, "afternoon", 6, "소호", ["독립카페","specialty_coffee","retro_cafe"]),
  p("nyc-everyman-espresso-soho", "뉴욕", "소호 에브리맨 에스프레소", "food", 40.7282, -73.9892, 50, "morning", 6, "소호", ["독립카페","specialty_coffee","local_gem"]),
  p("nyc-domique-ansel-bakery", "뉴욕", "소호 크로넛 도미니크 앙셀", "food", 40.7252, -74.0032, 50, "morning", 10, "소호", ["베이커리","bakery","크로넛","photo_spot"]),
  p("nyc-levain-bakery-upper-west", "뉴욕", "어퍼웨스트 르뱅 몬스터 초코칩 쿠키", "food", 40.7798, -73.9805, 45, "afternoon", 6, "어퍼웨스트", ["베이커리","bakery","쿠키","local_gem"]),
  p("nyc-balthazar-bakery-soho", "뉴욕", "소호 크루아상 전문 발타자르 베이커리", "food", 40.7228, -73.9985, 45, "morning", 7, "소호", ["베이커리","bakery","local_gem"]),
  p("nyc-supermoon-bakehouse", "뉴욕", "이스트빌리지 크로인 & 베이커리 슈퍼문", "food", 40.7188, -73.9865, 50, "afternoon", 8, "이스트빌리지", ["베이커리","bakery","youth","photo_spot"]),
  p("nyc-sadelles-bagels-soho", "뉴욕", "소호 브런치 & 연어 베이글 사델스", "food", 40.7258, -74.0002, 60, "morning", 25, "소호", ["베이커리","bakery","베이글","photo_spot"]),
  p("nyc-russ-daughters-cafe", "뉴욕", "이스트빌리지 러시앤도터스 카페", "food", 40.7198, -73.9895, 60, "morning", 28, "이스트빌리지", ["베이커리","bakery","local_gem","history"]),

  // 재즈클럽·루프탑바·스피크이지 (12개)
  p("nyc-blue-note-jazz-greenwich", "뉴욕", "그린위치빌리지 블루노트 뉴욕", "culture", 40.7308, -74.0008, 110, "evening", 45, "그린위치", ["재즈클럽","jazz_bar","live_music","history","night_life"]),
  p("nyc-smalls-jazz-club", "뉴욕", "그린위치 심야 지하 재즈클럽 스몰스", "culture", 40.7345, -74.0032, 110, "evening", 25, "그린위치", ["재즈클럽","jazz_bar","live_music","night_life"]),
  p("nyc-mezzrow-jazz-club", "뉴욕", "그린위치 피아노 재즈 바 메즈로", "culture", 40.7338, -74.0025, 100, "evening", 25, "그린위치", ["재즈클럽","jazz_bar","live_music","night_life"]),
  p("nyc-birdland-jazz-club", "뉴욕", "미드타운 파커의 버드랜드 재즈클럽", "culture", 40.7592, -73.9895, 110, "evening", 40, "미드타운", ["재즈클럽","jazz_bar","live_music","history"]),
  p("nyc-dizzy-club-coca-cola", "뉴욕", "링컨센터 뷰 지지스 재즈클럽", "culture", 40.7685, -73.9832, 110, "evening", 45, "링컨센터", ["재즈클럽","jazz_bar","live_music","night_view"]),
  p("nyc-pdt-please-dont-tell", "뉴욕", "스피크이지 PDT", "food", 40.7272, -73.9838, 80, "evening", 25, "이스트빌리지", ["스피크이지","speakeasy","hidden_gem","night_life"]),
  p("nyc-attaboy-speakeasy", "뉴욕", "밀크앤하늬 계승 스피크이지 아타보이", "food", 40.7188, -73.9918, 80, "evening", 22, "소호", ["스피크이지","speakeasy","hidden_gem","night_life"]),
  p("nyc-the-dead-rabbit", "뉴욕", "파이낸셜디스트릭트 펍 더 데드 래빗", "food", 40.7032, -74.0112, 80, "evening", 20, "파이낸셜", ["스피크이지","speakeasy","local_pub","night_life"]),
  p("nyc-230-fifth-rooftop", "뉴욕", "엠파이어스테이트 뷰 230 피프스 루프탑", "food", 40.7442, -73.9882, 90, "evening", 25, "미드타운", ["루프탑바","rooftop_bar","night_view","photo_spot"]),
  p("nyc-westlight-rooftop-williamsburg", "뉴욕", "브루클린 22층 맨해튼 뷰 웨스트라이트", "food", 40.7222, -73.9578, 90, "evening", 28, "브루클린", ["루프탑바","rooftop_bar","night_view","sunset_view"]),
  p("nyc-rooftop-at-exchange-place", "뉴욕", "허드슨강 건너 야경 루프탑 바", "food", 40.7162, -74.0332, 90, "evening", 25, "허드슨강변", ["루프탑바","rooftop_bar","night_view","photo_spot"]),
  p("nyc-employees-only-speakeasy", "뉴욕", "칵테일바 임플로이즈 온리", "food", 40.7358, -74.0068, 80, "evening", 24, "웨스트빌리지", ["스피크이지","speakeasy","hidden_gem","night_life"]),

  // 독립서점·갤러리·동네 산책 (10개)
  p("nyc-strand-book-store", "뉴욕", "1927년 스트랜드 독립 서점 (Strand Books)", "culture", 40.7332, -73.9908, 80, "afternoon", 0, "유니온스퀘어", ["독립서점","indie_bookstore","history","culture"]),
  p("nyc-mcnalley-jackson-soho", "뉴욕", "소호 카페 겸 독립서점 맥널리 잭슨", "culture", 40.7235, -73.9952, 70, "afternoon", 0, "소호", ["독립서점","indie_bookstore","specialty_coffee","photo_spot"]),
  p("nyc-housing-works-bookstore", "뉴욕", "소호 기부형 도서관 카페 하우징 웍스", "culture", 40.7248, -73.9968, 70, "afternoon", 0, "소호", ["독립서점","indie_bookstore","hidden_gem","culture"]),
  p("nyc-riizzoli-bookstore-nomad", "뉴욕", "노매드 이탈리아 미술 & 디자인 리졸리 서점", "culture", 40.7448, -73.9885, 60, "afternoon", 0, "노매드", ["독립서점","indie_bookstore","design","art"]),
  p("nyc-david-zwirner-chelsea", "뉴욕", "첼시 갤러리 거리 데이비드 츠위너", "culture", 40.7482, -74.0052, 70, "afternoon", 0, "첼시", ["소규모갤러리","gallery","현대미술","art"]),
  p("nyc-gagosian-gallery-chelsea", "뉴욕", "첼시 현대미술 가고시안 갤러리", "culture", 40.7495, -74.0048, 70, "afternoon", 0, "첼시", ["소규모갤러리","gallery","현대미술","art"]),
  p("nyc-pace-gallery-chelsea", "뉴욕", "첼시 8층 멀티플렉스 페이스 갤러리", "culture", 40.7488, -74.0055, 70, "afternoon", 0, "첼시", ["소규모갤러리","gallery","현대미술","art"]),
  p("nyc-washington-square-walk", "뉴욕", "그린위치 워싱턴 스퀘어 파크 산책로", "nature", 40.7308, -73.9975, 70, "afternoon", 0, "그린위치", ["동네산책","park","sunset_view","photo_spot"]),
  p("nyc-domino-park-williamsburg", "뉴욕", "설탕공장 재생 브루클린 도미노 파크", "nature", 40.7155, -73.9678, 80, "evening", 0, "브루클린", ["동네산책","park","sunset_view","free_viewpoint"]),
  p("nyc-little-island-hudson", "뉴욕", "허드슨강 인공섬 물결 파크 리틀 아일랜드", "nature", 40.7422, -74.0102, 80, "afternoon", 0, "첼시", ["동네산책","park","free_viewpoint","photo_spot"])
];
