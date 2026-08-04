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
  description: `${district}의 대표 감성인 ${tags.slice(0, 2).join("·")}을 즐기는 실제 현지인 추천 명소`,
  openingHours: "운영시간과 휴무일 변동 가능 · 방문 전 공식 안내 확인",
  tags,
  isCoreLandmark: core,
  district,
  nearbyTrip: nearby,
  transportHints: hints,
  estimateStatus: cost === 0 ? "free" : "estimated",
});

export const batchThirtyPlaces: Place[] = [
  // ==========================================
  // 도쿄 (Tokyo) - 현지 감성 & 분야별 깊이 보강
  // ==========================================
  // 1. 로컬 맛집 (노포·골목식당·지역 대표)
  p("tokyo-tsukiji-kitsuneya", "도쿄", "츠키지 키츠네야", "food", 35.6653, 139.7706, 45, "morning", 1000, "츠키지장외시장", ["노포","호르몬동","규동","소울푸드","local_gem","nofo_eatery"]),
  p("tokyo-afuri-ebisu", "도쿄", "아후리 에비스 본점", "food", 35.6465, 139.7101, 50, "evening", 1200, "에비스", ["라멘","유즈시오라멘","미식","local_gem"]),
  p("tokyo-kyushu-jangara-akiba", "도쿄", "큐슈 장가라 라멘 아키하바라", "food", 35.7005, 139.7712, 55, "evening", 1100, "아키하바라", ["라멘","돈코츠라멘","노포","local_gem","nofo_eatery"]),
  p("tokyo-asakusa-daikokuya", "도쿄", "아사쿠사 다이코쿠야 텐동", "food", 35.7118, 139.7942, 60, "afternoon", 1800, "아사쿠사", ["텐동","튀김덮밥","노포","history","local_gem"]),
  p("tokyo-katsu-midori-shibuya", "도쿄", "회전초밥 미도리 세이부 시부야점", "food", 35.6598, 139.7006, 70, "afternoon", 2500, "시부야", ["스시","회전초밥","가성비","local_gem"]),
  p("tokyo-nakameguro-yakitori-akira", "도쿄", "나카메구로 야키토리 아키라", "food", 35.6441, 139.6988, 80, "evening", 3500, "나카메구로", ["야키토리","닭꼬치","강변","izakaya","local_gem"]),

  // 2. 카페 (스페셜티·로스터리·전망·감성)
  p("tokyo-fuglen-yoyogi", "도쿄", "푸글렌 도쿄 요요기공원", "food", 35.6698, 139.6938, 60, "morning", 800, "시부야", ["카페","스페셜티커피","specialty_coffee","북유럽","photo_spot"]),
  p("tokyo-onibus-coffee-nakameguro", "도쿄", "오니버스 커피 나카메구로", "food", 35.6438, 139.6985, 50, "afternoon", 700, "나카메구로", ["카페","로스터리","specialty_coffee","기차길뷰","photo_spot"]),
  p("tokyo-chatei-hatou", "도쿄", "시부야 차테이 하토 (茶亭 羽當)", "food", 35.6592, 139.7032, 70, "afternoon", 1100, "시부야", ["카페","융드립","핸드드립","retro_cafe","history"]),
  p("tokyo-kayaba-coffee", "도쿄", "야나카 카야바 커피", "food", 35.7235, 139.7718, 60, "morning", 900, "야나카", ["카페","고가옥","retro_cafe","타마고사ندو","history"]),

  // 3. 골목 & 거리
  p("tokyo-yanaka-ginza", "도쿄", "야나카 긴자 골목", "culture", 35.7275, 139.7688, 80, "afternoon", 0, "야나카", ["골목","산책","retro_alley","고양이골목","photo_spot"]),
  p("tokyo-shimokitazawa-streets", "도쿄", "시모키타자와 빈티지 구제 골목", "shopping", 35.6614, 139.6681, 100, "afternoon", 0, "시모키타자와", ["골목","빈티지","구제샵","subculture","youth"]),
  p("tokyo-kagurazaka-alley", "도쿄", "카구라자카 돌담 골목길", "culture", 35.7025, 139.7378, 80, "afternoon", 0, "카구라자카", ["골목","산책","retro_alley","프랑스풍","photo_spot"]),

  // 4. 시장 (재래시장·야시장·푸드마켓)
  p("tokyo-sunamachi-ginza", "도쿄", "스나마치 긴자 로컬 상점가 시장", "market", 35.6742, 139.8285, 90, "afternoon", 1500, "고토구", ["시장","반찬거리","로컬시장","local_market","nofo_eatery"]),
  p("tokyo-ameyoko-ueno", "도쿄", "우에노 아메요코 재래시장", "market", 35.7088, 139.7745, 90, "afternoon", 2000, "우에노", ["시장","재래시장","스트리트푸드","local_market"]),

  // 5. 술집 (이자카야·재즈바·루프탑바·와인바)
  p("tokyo-golden-gai", "도쿄", "신주쿠 골든가이 바 골목", "food", 35.6942, 139.7042, 90, "evening", 3000, "신주쿠", ["술집","골목바","izakaya","night_life","subculture"]),
  p("tokyo-omoide-yokocho", "도쿄", "신주쿠 오모이데 요코초 꼬치 골목", "food", 35.6931, 139.6998, 80, "evening", 2500, "신주쿠", ["술집","야키토리","izakaya","night_life","retro_alley"]),
  p("tokyo-blue-note", "도쿄", "블루노트 도쿄 재즈클럽", "culture", 35.6608, 139.7152, 120, "evening", 8500, "미나미아오야마", ["술집","재즈바","jazz_bar","live_music","night_life"]),
  p("tokyo-andaz-rooftop", "도쿄", "토라노몬 힐스 앤다즈 루프탑바", "food", 35.6672, 139.7495, 90, "evening", 4500, "토라노몬", ["술집","루프탑바","rooftop_bar","야경","viewpoint"]),
  p("tokyo-ebisu-yokocho", "도쿄", "에비스 요코초 포장마차 타운", "food", 35.6472, 139.7115, 90, "evening", 3000, "에비스", ["술집","이자카야","izakaya","night_life","local"]),

  // 6. 전망 (무료전망·강변·일몰·야경)
  p("tokyo-tocho-observatory", "도쿄", "도쿄도청 45층 무료 전망대", "landmark", 35.6896, 139.6917, 75, "evening", 0, "신주쿠", ["전망","무료전망","night_view","sunset_view","landmark"]),
  p("tokyo-daiba-park-sunset", "도쿄", "오다이바 해변공원 일몰 명소", "nature", 35.6289, 139.7758, 90, "evening", 0, "오다이바", ["전망","일몰","sunset_view","강변","야경"]),
  p("tokyo-tokyu-plaza-kiriko", "도쿄", "긴자 토큐플라자 키리코 루프탑 테라스", "landmark", 35.6721, 139.7628, 60, "afternoon", 0, "긴자", ["전망","무료전망","rooftop_view","photo_spot"]),

  // 7. 숨은 명소 (독립서점·갤러리·특색상점)
  p("tokyo-daikanyama-tsutaya", "도쿄", "다이칸야마 T-SITE 츠타야 서점", "culture", 35.6489, 139.7001, 90, "afternoon", 0, "다이칸야마", ["독립서점","indie_bookstore","디자인","건축","photo_spot"]),
  p("tokyo-nezu-museum", "도쿄", "미나미아오야마 네즈 미술관", "culture", 35.6625, 139.7175, 100, "morning", 1400, "아오야마", ["미술관","일본정원","hidden_gem","culture","photo_spot"]),

  // ==========================================
  // 오사카 (Osaka) - 로컬 선술집 & 스페셜티 보강
  // ==========================================
  // 1. 로컬 맛집
  p("osa-fukutaro-okonomiyaki", "오사카", "난바 후쿠타로 오코노미야키 본점", "food", 34.6658, 135.5035, 70, "evening", 1800, "난바", ["오코노미야키","노포","local_gem","nofo_eatery"]),
  p("osa-harukoma-sushi", "오사카", "텐진바시 하루코마 스시 본점", "food", 34.7085, 135.5115, 60, "afternoon", 2200, "텐진바시", ["스시","가성비스시","노포","local_gem"]),
  p("osa-kushikatsu-daruma-shinsekai", "오사카", "신세카이 쿠시카츠 다루마 본점", "food", 34.6528, 135.5058, 60, "evening", 2000, "신세카이", ["쿠시카츠","원조노포","local_gem","nofo_eatery"]),

  // 2. 카페
  p("osa-brooklyn-roasting-kitahama", "오사카", "브루클린 로스팅 컴퍼니 키타하마", "food", 34.6912, 135.5068, 70, "morning", 800, "키타하마", ["카페","스페셜티커피","specialty_coffee","강변테라스","photo_spot"]),
  p("osa-moto-coffee-kitahama", "오사카", "모토 커피 키타하마 (MOTO COFFEE)", "food", 34.6915, 135.5055, 60, "afternoon", 900, "키타하마", ["카페","리버뷰","specialty_coffee","디저트","photo_spot"]),

  // 3. 골목
  p("osa-nakazaki-cho-alleys", "오사카", "나카자키초 카페 골목", "culture", 34.7065, 135.5038, 90, "afternoon", 0, "우메다", ["골목","retro_alley","빈티지","산책","photo_spot"]),
  p("osa-hozenji-yokocho", "오사카", "난바 호젠지 요코초 돌메밀길", "culture", 34.6681, 135.5021, 60, "evening", 0, "난바", ["골목","retro_alley","사찰","야경","photo_spot"]),

  // 4. 시장
  p("osa-tenjinbashisuji-arcade", "오사카", "텐진바시스지 7km 긴 아케이드 상점가", "market", 34.7092, 135.5118, 100, "afternoon", 1500, "텐진바시", ["시장","상점가","local_market","nofo_eatery"]),

  // 5. 술집
  p("osa-uranamba-izakaya", "오사카", "우라난바 로컬 선술집 골목", "food", 34.6645, 135.5038, 90, "evening", 2500, "난바", ["술집","이자카야","izakaya","스탠딩바","night_life"]),
  p("osa-misono-building", "오사카", "난바 미소노 빌딩 서브컬처 바", "food", 34.6648, 135.5042, 90, "evening", 2500, "난바", ["술집","서브컬처바","night_life","hidden_gem"]),

  // 6. 무료 전망
  p("osa-yodogawa-riverside-sunset", "오사카", "요도가와 강변공원 노을 명소", "nature", 34.7088, 135.4875, 80, "evening", 0, "우메다", ["전망","일몰","sunset_view","강변","휴식"]),

  // 7. 숨은 명소
  p("osa-nakanoshima-library-cafe", "오사카", "나카노시마 도서관 네오바르크 카페", "culture", 34.6931, 135.5042, 80, "afternoon", 900, "나카노시마", ["도서관","근대건축","hidden_gem","photo_spot"]),

  // ==========================================
  // 후쿠오카 (Fukuoka) - 로컬 멘타이쥬·야타이·스페셜티
  // ==========================================
  p("fuk-ganso-hakata-mentaiju", "후쿠오카", "하카타 멘타이쥬 본점", "food", 33.5908, 130.4038, 70, "morning", 2200, "텐진", ["명란","명란덮밥","원조노포","local_gem","nofo_eatery"]),
  p("fuk-no-coffee-yakuin", "후쿠오카", "야쿠인 NO COFFEE 카페", "food", 33.5792, 130.3975, 60, "afternoon", 750, "야쿠인", ["카페","스페셜티커피","specialty_coffee","블랙인테리어","photo_spot"]),
  p("fuk-coffee-county-yakuin", "후쿠오카", "COFFEE COUNTY 야쿠인 로스터리", "food", 33.5785, 130.3982, 60, "morning", 800, "야쿠인", ["카페","로스터리","specialty_coffee","핸드드립"]),
  p("fuk-yakuin-zakka-street", "후쿠오카", "야쿠인 편집숍 & 카페 거리", "shopping", 33.5798, 130.3968, 90, "afternoon", 0, "야쿠인", ["골목","산책","retro_alley","편집숍","photo_spot"]),
  p("fuk-bar-kurayoshi-hakata", "후쿠오카", "하카타 칵테일바 쿠라요시", "food", 33.5935, 130.4072, 90, "evening", 3500, "나카스", ["술집","칵테일바","cocktail_bar","night_life","luxury"]),

  // ==========================================
  // 서울 (Seoul) - 을지로·성수·서촌 로컬 깊이 보강
  // ==========================================
  p("seoul-wooraeok", "서울", "을지로 우래옥 평양냉면 본점", "food", 37.5681, 126.9978, 70, "afternoon", 16000, "을지로", ["평양냉면","노포","70년전통","local_gem","nofo_eatery"]),
  p("seoul-tosokchon", "서울", "서촌 토속촌 삼계탕", "food", 37.5778, 126.9708, 70, "afternoon", 20000, "서촌", ["삼계탕","한옥","노포","local_gem","nofo_eatery"]),
  p("seoul-anthracite-seongsu", "서울", "엔트러사이트 성수 공장형 카페", "food", 37.5412, 127.0568, 70, "afternoon", 7000, "성수", ["카페","공장개조","specialty_coffee","retro_cafe","photo_spot"]),
  p("seoul-fritz-dohwa", "서울", "프땋츠 커피 컴퍼니 도화점 (한옥)", "food", 37.5415, 126.9485, 60, "morning", 6500, "마포", ["카페","한옥카페","specialty_coffee","베이커리","photo_spot"]),
  p("seoul-seochon-daeo-alley", "서울", "서촌 대오서점 옆 한옥 골목길", "culture", 37.5792, 126.9702, 80, "afternoon", 0, "서촌", ["골목","한옥","retro_alley","산책","photo_spot"]),
  p("seoul-euljiro-nogari-alley", "서울", "을지로 노가리 야외 맥주 골목", "food", 37.5658, 126.9912, 90, "evening", 15000, "을지로", ["술집","야외맥주","노가리골목","night_life","local_gem"]),
  p("seoul-all-that-jazz", "서울", "이태원 올댓재즈 라이브바", "culture", 37.5348, 126.9942, 110, "evening", 25000, "이태원", ["술집","재즈바","jazz_bar","live_music","night_life"]),
  p("seoul-eungbongsan-nightview", "서울", "응봉산 팔각정 한강 야경 명소", "nature", 37.5502, 127.0348, 80, "evening", 0, "성동구", ["전망","무료전망","night_view","sunset_view","photo_spot"]),
  p("seoul-seoul-book-bogo", "서울", "잠실 서울책보고 중고서점 아치", "culture", 37.5208, 127.1028, 80, "afternoon", 0, "잠실", ["독립서점","중고서점","indie_bookstore","photo_spot","hidden_gem"]),

  // ==========================================
  // 방콕 (Bangkok) - 로컬 팟타이·루프탑·스페셜티
  // ==========================================
  p("bkk-thipsamai-padthai", "방콕", "팁싸마이 오렌지주스 & 팟타이 본점", "food", 13.7528, 100.5048, 60, "evening", 150, "카오산", ["팟타이","노포","소울푸드","local_gem","nofo_eatery"]),
  p("bkk-roots-coffee-thonglor", "방콕", "Roots Coffee 통로 로스터리", "food", 13.7348, 100.5822, 60, "morning", 140, "통로", ["카페","스페셜티커피","specialty_coffee","로스터리","photo_spot"]),
  p("bkk-octave-rooftop", "방콕", "옥타브 루프탑 바 메리어트 통로", "food", 13.7238, 100.5802, 90, "evening", 800, "통로", ["술집","루프탑바","rooftop_bar","야경","sunset_view"]),

  // ==========================================
  // 파리 (Paris) - 마레 골목·생마르탱 스페셜티·루프탑
  // ==========================================
  p("paris-l-as-du-fallafel", "파리", "마레 L'As du Fallafel", "food", 48.8572, 2.3592, 50, "afternoon", 12, "마레", ["파라펠","노포","길거리음식","local_gem","nofo_eatery"]),
  p("paris-telescope-coffee", "파리", "Télescope Coffee", "food", 48.8665, 2.3362, 50, "morning", 6, "팔레로얄", ["카페","스페셜티커피","specialty_coffee","드립커피"]),
  p("paris-galeries-lafayette-rooftop", "파리", "라파예트 백화점 무료 루프탑 전망대", "landmark", 48.8738, 2.3322, 60, "evening", 0, "오페라", ["전망","무료전망","rooftop_view","night_view","photo_spot"]),

  // ==========================================
  // 런던 (London) - 버러마켓 코너·소호 재즈·스페셜티
  // ==========================================
  p("lon-kappacasein-cheese", "런던", "버러 마켓 캡파케세인 멜트 치즈", "food", 51.5052, -0.0908, 45, "afternoon", 8, "사우스뱅크", ["치즈토스트","노포","스트리트푸드","local_gem","nofo_eatery"]),
  p("lon-pworkshop-coffee-clerkenwell", "런던", "Workshop Coffee 클러켄웰 본점", "food", 51.5222, -0.1028, 60, "morning", 5, "클러켄웰", ["카페","스페셜티커피","specialty_coffee","로스터리"]),
  p("lon-ronnie-scotts", "런던", "소호 로니 스콧 재즈 클럽 (Ronnie Scott's)", "culture", 51.5132, -0.1312, 120, "evening", 35, "소호", ["술집","재즈바","jazz_bar","live_music","night_life"]),

  // ==========================================
  // 뉴욕 (NYC) - 첼시 스페셜티·그린위치 재즈·무료 야경
  // ==========================================
  p("nyc-joe-pizza-greenwich", "뉴욕", "그린위치 조스 피자 본점 (Joe's Pizza)", "food", 40.7305, -74.0021, 40, "evening", 6, "그린위치빌리지", ["피자","조각피자","노포","local_gem","nofo_eatery"]),
  p("nyc-sey-coffee-brooklyn", "뉴욕", "브루클린 Sey Coffee 로스터리", "food", 40.7052, -73.9328, 60, "morning", 7, "브루클린", ["카페","스페셜티커피","specialty_coffee","로스터리","photo_spot"]),
  p("nyc-village-vanguard", "뉴욕", "빌리지 반가드 재즈클럽", "culture", 40.7362, -74.0018, 120, "evening", 40, "그린위치빌리지", ["술집","재즈바","jazz_bar","live_music","history"]),
  p("nyc-gansevoort-peninsula-sunset", "뉴욕", "허드슨 리버 파크 간스부르트 일몰 명소", "nature", 40.7392, -74.0112, 80, "evening", 0, "첼시", ["전망","일몰","sunset_view","강변","휴식"])
];
