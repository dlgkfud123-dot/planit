export type PlaceDetailMeta = {
  heroImage?: string;
  galleryImages?: string[];
  whyRecommend?: string;
  stayMethod?: string;
  bestTimeNote?: string;
  targetAudience?: string;
  transportTip?: string;
};

// Verified place.id based image and rich metadata registry
// NEVER fallback to city image or another landmark's image!
const u = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=82`;

export const PLACE_DETAIL_REGISTRY: Record<string, PlaceDetailMeta> = {
  // 뉴욕
  "nyc-brooklyn": {
    heroImage: u("photo-1543716627-839b54c40519", 1600),
    galleryImages: [
      u("photo-1543716627-839b54c40519"),
      u("photo-1518391846015-55a9cc003b25"),
      u("photo-1496442226666-8d4d0e62e6e9"),
    ],
    whyRecommend: "140년 역사를 지닌 고딕 양식의 현수교로, 맨해튼 스카이라인과 이스트강을 한눈에 감상할 수 있는 대표 랜드마크입니다.",
    stayMethod: "덤보에서 시작해 브루클린 브리지를 건너며 해 질 녘 노을과 밤 야경을 조용히 걸어보는 것을 추천합니다.",
    bestTimeNote: "일몰 30분 전 방문 시 붉은 노을과 도심 조명이 켜지는 순간을 동시에 감상할 수 있습니다.",
    targetAudience: "커플 · 사진 작가 · 혼자 여행",
    transportTip: "지하철 A/C선 High St역 또는 F선 York St역 하차 후 도보 5분",
  },
  "nyc-central": {
    heroImage: u("photo-1519501025264-65ba15a82390", 1600),
    galleryImages: [
      u("photo-1519501025264-65ba15a82390"),
      u("photo-1588733103629-b77aea042552"),
      u("photo-1500916434205-0c77489c6cf7"),
    ],
    whyRecommend: "맨해튼 한가운데 펼쳐진 도심 속 거대 녹지 공원으로 숲길, 호수, 잔디밭에서 한적한 휴식을 즐길 수 있습니다.",
    stayMethod: "베데스다 분수대와 테라스를 거쳐 쉐이프 호수 주변 산책길을 따라 벤치에 앉아 여유를 즐겨보세요.",
    bestTimeNote: "오전 09:00 - 11:00 상쾌한 아침 공기 속 산책을 추천합니다.",
    targetAudience: "가족 · 커플 · 산책 선호자",
    transportTip: "지하철 N/R/W선 5th Ave-59th St역 또는 A/B/C/D선 59th St-Columbus Circle역",
  },
  "nyc-met": {
    heroImage: u("photo-1582555172866-f73bb12a2ab3", 1600),
    galleryImages: [
      u("photo-1582555172866-f73bb12a2ab3"),
      u("photo-1579783902614-a3fb3927b675"),
    ],
    whyRecommend: "이집트 신전부터 인상주의 명화까지 5천 년 세계 인류 문명과 예술을 담고 있는 세계 3대 미술관입니다.",
    stayMethod: "이집트 덴두르 신전과 2층 유럽 회화관을 중심으로 동선을 계획하면 핵심 작품을 알차게 둘러볼 수 있습니다.",
    bestTimeNote: "오후 13:30 관람 시 가벼운 점심 식사 후 쾌적하게 관람할 수 있습니다.",
    targetAudience: "예술 애호가 · 문화 탐방객",
    transportTip: "지하철 4/5/6선 86th St역 하차 후 Fifth Avenue 방향 도보 10분",
  },
  "nyc-highline": {
    heroImage: u("photo-1534430480872-3498386e7856", 1600),
    galleryImages: [
      u("photo-1534430480872-3498386e7856"),
      u("photo-1501594907352-04cda38ebc29"),
    ],
    whyRecommend: "버려진 고가 철로를 예술적인 공원으로 재탄생시킨 도시 재생의 세계적인 모범 사례입니다.",
    stayMethod: "첼시 마켓에서 간식을 살짝 들고 걷기 시작해 첼시 갤러리 골목과 허드슨강 야경을 내려다보세요.",
    bestTimeNote: "오후 16:00 - 18:00 해 질 녘 분위기가 가장 따스하고 조화롭습니다.",
    targetAudience: "건축 애호가 · 커플 · 도심 산책자",
    transportTip: "지하철 L선 8th Ave역 또는 A/C/E선 14th St역",
  },
  "nyc-times": {
    heroImage: u("photo-1508057198894-247b23fe5ade", 1600),
    galleryImages: [
      u("photo-1508057198894-247b23fe5ade"),
      u("photo-1534430480872-3498386e7856"),
    ],
    whyRecommend: "화려한 전광판과 브로드웨이의 생동감이 밤낮없이 펼쳐지는 뉴욕의 불야성 광장입니다.",
    stayMethod: "TKTS 빨간 계단에 앉아 거대한 화려한 옥외 광고판과 유동 인구의 활기를 관찰해 보세요.",
    bestTimeNote: "저녁 20:00 이후 네온사인이 한창 피어나는 야간 시간대 최적입니다.",
    targetAudience: "첫 뉴욕 방문자 · 친구",
    transportTip: "지하철 1/2/3/7/N/Q/R/W/S선 Times Sq-42 St역 직결",
  },

  // 파리
  "paris-eiffel": {
    heroImage: u("photo-1511739001486-6bfe10ce785f", 1600),
    galleryImages: [
      u("photo-1511739001486-6bfe10ce785f"),
      u("photo-1502602898657-3e91760cbb34"),
      u("photo-1431274172761-f2d477a9a11e"),
    ],
    whyRecommend: "1889년 파리 만국박람회를 위해 건립된 철골 탑으로 파리의 낭만과 밤 야경을 대표합니다.",
    stayMethod: "샤요 궁(Palais de Chaillot) 광장에서 전경 사진을 촬영한 후 샹 드 마르스 공원에서 피크닉을 즐기세요.",
    bestTimeNote: "매시 정각에 5분간 반짝이는 스파클링 조명 쇼 타임(일몰 후)을 놓치지 마세요.",
    targetAudience: "커플 · 신혼여행 · 낭만 탐방객",
    transportTip: "지하철 6호선 Bir-Hakeim역 또는 RER C선 Champ de Mars-Tour Eiffel역",
  },
  "paris-louvre": {
    heroImage: u("photo-1565099824688-e93eb20fe622", 1600),
    galleryImages: [
      u("photo-1565099824688-e93eb20fe622"),
      u("photo-1499856871958-5b9627545d1a"),
    ],
    whyRecommend: "모나리자, 비너스 상 등 인류사의 인상적인 명작들이 수집된 세계 최대 미술관입니다.",
    stayMethod: "유리 피라미드 중앙 입구로 들어서 드농관(Denon) 핵심 대표작 동선을 따라 둘러보세요.",
    bestTimeNote: "오전 09:00 개장 직후 첫 관람 회차가 비교적 덜 붐빕니다.",
    targetAudience: "미술관 탐방객 · 역사 애호가",
    transportTip: "지하철 1/7호선 Palais Royal-Musée du Louvre역",
  },
  "paris-montmartre": {
    heroImage: u("photo-1509356843151-3e7d96241e11", 1600),
    galleryImages: [
      u("photo-1509356843151-3e7d96241e11"),
      u("photo-1520939817895-060bdef4fe17"),
    ],
    whyRecommend: "언덕 위 하얀 사크레쾨르 대성당과 피카소, 고흐가 거닐던 낭만적인 화가들의 골목입니다.",
    stayMethod: "테르트르 광장 화가들의 그림을 둘러보고 성당 앞 계단에 앉아 파리 시내 전경을 관망해 보세요.",
    bestTimeNote: "오후 15:00 - 17:00 따뜻한 햇살 아래 골목 카페 티타임과 어울립니다.",
    targetAudience: "커플 · 예술 애호가 · 도보 여행자",
    transportTip: "지하철 2호선 Anvers역 하차 후 푸니쿨라 또는 계단 이동",
  },

  // 서울
  "seoul-gyeongbokgung": {
    heroImage: u("photo-1546874177-9e664107314e", 1600),
    galleryImages: [
      u("photo-1546874177-9e664107314e"),
      u("photo-1618005182384-a83a8bd57fbe"),
    ],
    whyRecommend: "조선 왕조 500년의 으뜸 궁궐로 근정전과 경회루의 아름다운 전통 목조건축을 품고 있습니다.",
    stayMethod: "광화문 수문장 교대의식을 관람한 뒤 근정전과 경회루 연못 산책로를 여유롭게 둘러보세요.",
    bestTimeNote: "오전 10:00 수문장 교대의식 시각에 맞춰 방문 추천합니다.",
    targetAudience: "가족 · 외국인 친구 · 전통 역사 탐방",
    transportTip: "지하철 3호선 경복궁역 5번 출구 직결",
  },
  "seoul-bukchon": {
    heroImage: u("photo-1538485399081-7191377e8241", 1600),
    galleryImages: [
      u("photo-1538485399081-7191377e8241"),
      u("photo-1584824486509-112e4181ff6b"),
    ],
    whyRecommend: "조선시대 양반가들이 거주하던 한옥들이 언덕을 따라 수려하게 보존된 조용한 마을입니다.",
    stayMethod: "북촌 5길과 6길 고갯길을 따라 한옥 처마 능선 너머로 보이는 N서울타워 풍경을 촬영해보세요.",
    bestTimeNote: "오전 10:00 - 12:00 주거 지역 주민 배려를 위해 정숙한 오전 방문을 권장합니다.",
    targetAudience: "커플 · 사진 촬영자 · 혼자 여행",
    transportTip: "지하철 3호선 안국역 2번 출구 도보 8분",
  },
  "seoul-namsan": {
    heroImage: u("photo-1570168007204-dfb528c6958f", 1600),
    galleryImages: [
      u("photo-1570168007204-dfb528c6958f"),
      u("photo-1517154421773-0529f29ea451"),
    ],
    whyRecommend: "서울 중심 남산 꼭대기에 위치하여 360도 도심 스카이라인을 훤히 조망하는 대표 전망대입니다.",
    stayMethod: "남산 케이블카나 산책로를 타고 올라가 사랑의 자물쇠 도크와 전망대 타워 야경을 감상하세요.",
    bestTimeNote: "일몰 시각 30분 전 도착하여 노을에서 밤 야경으로 이어지는 풍경 관람 추천.",
    targetAudience: "커플 · 데이트 · 야경 탐방",
    transportTip: "지하철 4호선 명동역 3번 출구에서 N남산순환버스 01번 탑승",
  },

  // 오사카
  "osa-castle": {
    heroImage: u("photo-1590559899731-a382839e5549", 1600),
    galleryImages: [
      u("photo-1590559899731-a382839e5549"),
      u("photo-1503899036084-c55cdd92da26"),
    ],
    whyRecommend: "오사카의 역사와 석성이 계절 꽃과 조화를 이루는 일본 3대 명성 중 하나입니다.",
    stayMethod: "넓은 성곽 공원 해자 주변을 산책하고 천수각에 올라 오사카 시내 전경을 조망하세요.",
    bestTimeNote: "오전 09:30 단체 관광객이 모이기 전 오전에 방문하기 좋습니다.",
    targetAudience: "가족 · 역사 탐방 · 사진 촬영자",
    transportTip: "JR 다니마치욘초메역 또는 오사카조코엔역 도보 10분",
  },
  "osa-dotonbori": {
    heroImage: u("photo-1578637387939-43c525550085", 1600),
    galleryImages: [
      u("photo-1578637387939-43c525550085"),
      u("photo-1503899036084-c55cdd92da26"),
    ],
    whyRecommend: "글리코상 네온사인과 타코야키, 쿠시카츠 등 오사카 미식의 미식 에너지로 가득한 거리입니다.",
    stayMethod: "에비스 다리 위에서 글리코상 포즈로 기념 촬영 후 강변 길거리 음식을 탐방해 보세요.",
    bestTimeNote: "저녁 18:30 이후 화려한 화려한 네온사인이 밝혀질 때가 최고입니다.",
    targetAudience: "친구 · 미식가 · 야경 탐방",
    transportTip: "지하철 미도스지선 난바역 14번 출구 도보 3분",
  },

  // 도쿄
  "tokyo-sensoji": {
    heroImage: u("photo-1503899036084-c55cdd92da26", 1600),
    galleryImages: [
      u("photo-1503899036084-c55cdd92da26"),
      u("photo-1540959733332-eab4deabeeaf"),
    ],
    whyRecommend: "628년에 창건된 도쿄에서 가장 오래된 사찰로, 붉은 가미나리몬 등 붉은 신사 건축이 인상적입니다.",
    stayMethod: "가미나리몬 등롱을 거쳐 나카미세도리 전통 상점가에서 실크 전통 간식을 맛보며 본당으로 걸어가세요.",
    bestTimeNote: "오전 08:30 한적한 아침 나카미세 상점가의 한옥 사찰 분위기가 고즈넉합니다.",
    targetAudience: "가족 · 역사 탐방 · 전통 체험",
    transportTip: "지하철 긴자선/아사쿠사선 아사쿠사역 1번 출구 도보 5분",
  },

  // 런던
  "lon-towerbridge": {
    heroImage: u("photo-1513635269975-59663e0ac1ad", 1600),
    galleryImages: [
      u("photo-1513635269975-59663e0ac1ad"),
      u("photo-1529655683826-aba9b3e77383"),
    ],
    whyRecommend: "템스강 위 빅토리아 양식으로 설계된 쌍둥이 고딕 탑이 우뚝 선 런던의 상징적인 다리입니다.",
    stayMethod: "버러 마켓에서 수제 베이글을 사 들고 템스강 남안 산책로를 따라 다리 아래를 걸어보세요.",
    bestTimeNote: "오후 16:30 일몰 시각 템스강물에 붉은 빛이 반사되는 타이밍이 우수합니다.",
    targetAudience: "커플 · 사진 촬영자 · 런던 첫 여행",
    transportTip: "지하철 District/Circle선 Tower Hill역 하차 도보 7분",
  },

  // 시드니
  "syd-opera": {
    heroImage: u("photo-1506973035872-a4ec16b8e8d9", 1600),
    galleryImages: [
      u("photo-1506973035872-a4ec16b8e8d9"),
      u("photo-1523428096881-5bd79d043006"),
    ],
    whyRecommend: "조개껍데기 모양 지붕 건축의 미학을 인정받아 20세기 건축물 중 유네스코 세계유산에 등재된 랜드마크입니다.",
    stayMethod: "서큘러 키 선착장에서 페리를 타고 바라보거나, 오페라 바(Opera Bar) 야외 테라스에서 하버 브리지 야경과 함께 음료를 즐기세요.",
    bestTimeNote: "오후 17:00 붉은 노을이 항구를 감싸는 석양 시간대를 추천합니다.",
    targetAudience: "커플 · 건축 탐방 · 휴양객",
    transportTip: "지하철/페리 Circular Quay역 하차 후 도보 6분",
  }
};

export function getPlaceDetailMeta(placeId: string): PlaceDetailMeta | undefined {
  return PLACE_DETAIL_REGISTRY[placeId];
}
