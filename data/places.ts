export type PlaceCategory="landmark"|"culture"|"food"|"market"|"nature"|"shopping";
export type EstimateStatus="estimated"|"free"|"variable";
export type Place={id:string;cityId:string;name:string;category:PlaceCategory;latitude:number;longitude:number;recommendedDuration:number;recommendedTime:"morning"|"afternoon"|"evening"|"any";estimatedCost:number;description:string;openingHours:string;tags:string[];isCoreLandmark:boolean;district:string;nearbyTrip:boolean;transportHints:string[];estimateStatus:EstimateStatus};
const districtOverrides:Record<string,string>={
  "seoul-gyeongbokgung":"종로","seoul-bukchon":"종로","seoul-gwangjang":"종로","seoul-namsan":"명동","seoul-seoulforest":"성수","seoul-mangwon":"홍대","seoul-leeum":"용산","seoul-namdaemun":"명동","seoul-haneul":"홍대","seoul-museum-modern":"종로",
  "fuk-kushida":"하카타","fuk-ohori":"오호리","fuk-castle":"오호리","fuk-yanagibashi":"하카타","fuk-canal":"하카타","fuk-nakasu":"나카스","fuk-dazaifu":"다자이후","fuk-uminonakamichi":"우미노나카미치","fuk-yufuin":"유후인","fuk-rec-coffee":"야쿠인",
  "osa-castle":"오사카성","osa-kuromon":"난바","osa-dotonbori":"난바","osa-shitennoji":"텐노지","osa-umeda":"우메다","osa-nakanoshima":"나카노시마","osa-minoh":"미노오","osa-kaiyukan":"오사카베이","osa-lilo-coffee":"신사이바시",
  "bkk-palace":"왕궁","bkk-watpho":"왕궁","bkk-watarun":"짜오프라야강변","bkk-chatuchak":"짜뚜짝","bkk-lumphini":"실롬","bkk-yaowarat":"차이나타운","bkk-asok":"아속","bkk-asiatique":"짜오프라야강변","bkk-factory-coffee":"파야타이"
  ,"paris-louvre":"루브르·튈르리","paris-eiffel":"에펠탑 주변","paris-montmartre":"몽마르트르","paris-luxembourg":"라탱 지구","paris-marche":"마레","paris-marais":"마레","paris-orsay":"센강","paris-saintechapelle":"라탱 지구","paris-canal":"생마르탱","paris-garnier":"오페라","paris-cafe-flore":"생제르맹"
  ,"lon-british":"소호·코벤트가든","lon-towerbridge":"시티","lon-borough":"사우스뱅크","lon-hyde":"웨스트민스터","lon-tate":"사우스뱅크","lon-covent":"소호·코벤트가든","lon-nationalgallery":"소호·코벤트가든","lon-westminster":"웨스트민스터","lon-camden":"캠든","lon-greenwich":"그리니치","lon-monmouth":"사우스뱅크"
  ,"nyc-central":"센트럴파크·어퍼맨해튼","nyc-met":"센트럴파크·어퍼맨해튼","nyc-highline":"첼시·하이라인","nyc-chelsea":"첼시·하이라인","nyc-brooklyn":"브루클린","nyc-times":"미드타운","nyc-moma":"미드타운","nyc-grandcentral":"미드타운","nyc-dumbo":"브루클린","nyc-williamsburg":"브루클린","nyc-devocion":"브루클린"
  ,"syd-opera":"서큘러키","syd-botanic":"서큘러키","syd-bondi":"본다이","syd-rocks":"더록스","syd-qvb":"CBD","syd-fishmarket":"달링하버","syd-harbourbridge":"더록스","syd-manly":"맨리","syd-artgallery":"CBD","syd-barangaroo":"더록스","syd-single-o":"서리힐스"
};
const corePlaceIds=new Set(["seoul-gyeongbokgung","seoul-bukchon","seoul-namsan","fuk-kushida","fuk-ohori","fuk-castle","osa-castle","osa-dotonbori","bkk-palace","bkk-watpho","bkk-watarun"]);
const nearbyPlaceIds=new Set(["lon-greenwich","syd-manly"]);
const waterTransportIds=new Set(["syd-manly"]);
const p=(id:string,cityId:string,name:string,category:PlaceCategory,latitude:number,longitude:number,recommendedDuration:number,recommendedTime:Place["recommendedTime"],estimatedCost:number,description:string,openingHours:string,tags:string[]):Place=>({id,cityId,name,category,latitude,longitude,recommendedDuration,recommendedTime,estimatedCost,description,openingHours,tags,isCoreLandmark:corePlaceIds.has(id)||category==="landmark"||tags.includes("랜드마크"),district:districtOverrides[id]||"도심",nearbyTrip:nearbyPlaceIds.has(id)||tags.includes("근교")||tags.includes("기차"),transportHints:waterTransportIds.has(id)?["보트·수상교통","도보"]:tags.includes("기차")?["기차"]:["대중교통","도보"],estimateStatus:estimatedCost===0?"free":"estimated"});
const basePlaces:Place[]=[
// 서울
p("seoul-gyeongbokgung","서울","경복궁","culture",37.5796,126.977,120,"morning",3000,"조선 왕조의 중심 궁궐과 전통 건축을 둘러보는 장소","09:00–18:00 전후 · 계절 변동, 화요일 휴무",["역사","궁궐","사진"]),p("seoul-bukchon","서울","북촌한옥마을","culture",37.5826,126.983,90,"morning",0,"한옥과 골목 풍경이 남아 있는 주거 지역","골목 관람 가능 · 주민 생활 시간 배려",["한옥","산책","골목"]),p("seoul-gwangjang","서울","광장시장","market",37.57,126.999,100,"afternoon",25000,"빈대떡과 육회 등 서울의 시장 음식을 경험하는 전통시장","점포별 운영시간 상이",["시장","미식","로컬"]),p("seoul-namsan","서울","N서울타워·남산","landmark",37.5512,126.9882,120,"evening",26000,"서울 도심을 한눈에 내려다보는 대표 전망 명소","전망대 운영시간 변동 · 방문 전 확인",["전망","야경","랜드마크"]),p("seoul-seoulforest","서울","서울숲","nature",37.5444,127.0374,100,"afternoon",0,"도심 속 숲길과 잔디밭에서 쉬어 가기 좋은 공원","공원 상시 개방 · 일부 시설 시간 제한",["공원","산책","휴식"]),p("seoul-mangwon","서울","망원시장","market",37.556,126.9057,80,"afternoon",20000,"동네 먹거리와 생활 풍경을 함께 만나는 시장","점포별 운영시간 상이",["시장","간식","로컬"]),
// 후쿠오카
p("fuk-kushida","후쿠오카","구시다 신사","culture",33.5931,130.4106,60,"morning",0,"하카타의 수호신을 모시는 도심 신사","경내 관람 가능 · 시설별 시간 상이",["신사","역사","하카타"]),p("fuk-ohori","후쿠오카","오호리 공원","nature",33.5861,130.3764,90,"morning",0,"큰 연못을 따라 걷기 좋은 후쿠오카 대표 공원","공원 상시 개방",["공원","산책","호수"]),p("fuk-castle","후쿠오카","후쿠오카성터·마이즈루공원","culture",33.5844,130.3831,90,"afternoon",0,"성터와 계절 꽃을 함께 볼 수 있는 역사 공원","공원 구역 상시 개방",["성터","공원","벚꽃"]),p("fuk-yanagibashi","후쿠오카","야나기바시 연합시장","market",33.5831,130.4078,75,"morning",22000,"해산물과 지역 식재료를 만나는 하카타의 부엌","점포별 운영시간 상이 · 일요일 휴무 점포 다수",["시장","해산물","미식"]),p("fuk-canal","후쿠오카","캐널시티 하카타","shopping",33.5898,130.4107,120,"afternoon",15000,"쇼핑과 분수 공연, 식사를 한 번에 즐기는 복합공간","시설 운영시간 변동 · 공식 안내 확인",["쇼핑","실내","가족"]),p("fuk-nakasu","후쿠오카","나카스 강변과 야타이 거리","food",33.5935,130.4055,100,"evening",35000,"강변 야경과 포장마차 음식을 경험하는 저녁 코스","야타이별 영업일·시간 상이",["야타이","야경","라멘"]),
// 오사카
p("osa-castle","오사카","오사카성","culture",34.6873,135.5262,120,"morning",6000,"오사카의 역사를 상징하는 성과 넓은 공원","천수각 운영시간 변동 · 공식 안내 확인",["성","역사","공원"]),p("osa-kuromon","오사카","구로몬시장","market",34.6654,135.5066,90,"morning",30000,"해산물과 길거리 음식을 맛보는 오사카 대표 시장","점포별 운영시간 상이",["시장","해산물","미식"]),p("osa-dotonbori","오사카","도톤보리","food",34.6687,135.5013,100,"evening",30000,"네온사인과 오사카 길거리 음식이 모인 번화가","거리 상시 개방 · 점포별 시간 상이",["야경","미식","상점가"]),p("osa-shitennoji","오사카","시텐노지","culture",34.6548,135.5165,80,"morning",5000,"일본에서 가장 오래된 사찰 중 하나","관람시간 변동 · 공식 안내 확인",["사찰","역사","정원"]),p("osa-umeda","오사카","우메다 스카이 빌딩","landmark",34.7053,135.49,90,"evening",15000,"오사카 도심을 내려다보는 공중정원 전망대","운영시간 변동 · 공식 안내 확인",["전망","야경","건축"]),p("osa-nakanoshima","오사카","나카노시마 공원","nature",34.6922,135.5075,70,"afternoon",0,"강 사이의 녹지와 근대 건축을 따라 걷는 공원","공원 상시 개방",["공원","산책","강변"]),
// 방콕
p("bkk-palace","방콕","방콕 왕궁","culture",13.7500,100.4913,150,"morning",20000,"태국 왕실 건축과 에메랄드 사원을 만나는 핵심 명소","복장 규정 및 운영시간 변동 · 공식 안내 확인",["왕궁","사원","역사"]),p("bkk-watpho","방콕","왓 포","culture",13.7465,100.493,90,"morning",9000,"거대한 와불상과 전통 마사지로 유명한 사원","운영시간 변동 · 공식 안내 확인",["사원","와불","문화"]),p("bkk-watarun","방콕","왓 아룬","landmark",13.7437,100.4889,80,"afternoon",8000,"짜오프라야강변의 아름다운 탑으로 유명한 사원","운영시간 변동 · 공식 안내 확인",["사원","강변","일몰"]),p("bkk-chatuchak","방콕","짜뚜짝 주말시장","market",13.7999,100.5501,150,"morning",25000,"수천 개 상점에서 쇼핑과 먹거리를 즐기는 대형 시장","주말 중심 운영 · 구역별 시간 상이",["시장","쇼핑","미식"]),p("bkk-lumphini","방콕","룸피니 공원","nature",13.7307,100.5418,90,"morning",0,"호수와 산책로가 있는 방콕 도심의 대표 녹지","공원 운영시간 변동",["공원","산책","휴식"]),p("bkk-yaowarat","방콕","야오와랏 로드","food",13.7408,100.5097,120,"evening",30000,"저녁이면 길거리 음식으로 활기를 띠는 차이나타운","점포별 운영시간 상이",["야시장","미식","차이나타운"]),
// 파리
p("paris-louvre","파리","루브르 박물관","culture",48.8606,2.3376,180,"morning",35000,"세계적인 예술 작품을 소장한 파리 대표 박물관","예약 및 휴관일 변동 · 공식 웹사이트 확인",["미술관","문화","실내"]),p("paris-eiffel","파리","에펠탑","landmark",48.8584,2.2945,120,"evening",45000,"파리의 상징과 센강 일대를 조망하는 랜드마크","입장시간·요금 변동 · 공식 웹사이트 확인",["전망","야경","랜드마크"]),p("paris-montmartre","파리","몽마르트르·사크레쾨르","culture",48.8867,2.3431,120,"afternoon",0,"언덕 위 성당과 예술가 골목을 걷는 지역","거리·성당 관람 가능 · 시설별 시간 상이",["골목","전망","예술"]),p("paris-luxembourg","파리","뤽상부르 공원","nature",48.8462,2.3372,80,"afternoon",0,"정원과 분수 주변에서 쉬기 좋은 파리 중심 공원","계절에 따라 개방시간 변동",["공원","산책","휴식"]),p("paris-marche","파리","마르셰 데 앙팡 루즈","market",48.8632,2.3628,90,"afternoon",30000,"다양한 음식점이 모인 파리의 오래된 시장","요일·점포별 운영시간 상이",["시장","미식","마레"]),p("paris-marais","파리","마레 지구","shopping",48.8578,2.3622,120,"afternoon",20000,"부티크와 카페, 오래된 저택이 이어지는 산책 지역","상점별 운영시간 상이",["쇼핑","카페","골목"]),
// 런던
p("lon-british","런던","영국박물관","culture",51.5194,-.127,180,"morning",0,"세계 문화유산과 방대한 컬렉션을 만나는 박물관","입장·운영시간 변동 · 공식 웹사이트 확인",["박물관","역사","실내"]),p("lon-towerbridge","런던","타워 브리지","landmark",51.5055,-.0754,90,"afternoon",22000,"템스강과 런던의 스카이라인을 상징하는 다리","전시 운영시간 변동 · 공식 웹사이트 확인",["랜드마크","강변","전망"]),p("lon-borough","런던","버러 마켓","market",51.5055,-.091,100,"afternoon",30000,"영국과 세계 각국의 음식을 맛보는 역사적인 시장","요일·점포별 운영시간 상이",["시장","미식","로컬"]),p("lon-hyde","런던","하이드 파크","nature",51.5073,-.1657,100,"morning",0,"호수와 넓은 잔디밭을 갖춘 런던 중심 공원","계절에 따라 개방시간 변동",["공원","산책","휴식"]),p("lon-tate","런던","테이트 모던","culture",51.5076,-.0994,150,"afternoon",0,"발전소 건물을 활용한 현대미술관","전시·운영시간 변동 · 공식 웹사이트 확인",["미술관","현대미술","실내"]),p("lon-covent","런던","코벤트 가든","shopping",51.5117,-.124,100,"evening",25000,"상점과 공연, 식당이 모인 활기찬 광장","상점별 운영시간 상이",["쇼핑","공연","광장"]),
// 뉴욕
p("nyc-central","뉴욕","센트럴 파크","nature",40.7829,-73.9654,150,"morning",0,"도시 중심에서 산책과 휴식을 즐기는 거대한 공원","공원 운영시간 변동",["공원","산책","휴식"]),p("nyc-met","뉴욕","메트로폴리탄 미술관","culture",40.7794,-73.9632,180,"afternoon",45000,"시대와 지역을 아우르는 세계적인 미술관","운영시간·요금 변동 · 공식 웹사이트 확인",["미술관","문화","실내"]),p("nyc-highline","뉴욕","하이라인","nature",40.748,-74.0048,90,"afternoon",0,"고가 철길을 재생한 도시 산책 공원","계절에 따라 개방시간 변동",["공원","건축","산책"]),p("nyc-chelsea","뉴욕","첼시 마켓","market",40.7424,-74.0061,100,"afternoon",35000,"식당과 상점이 모인 실내 푸드 마켓","점포별 운영시간 상이",["시장","미식","쇼핑"]),p("nyc-brooklyn","뉴욕","브루클린 브리지","landmark",40.7061,-73.9969,90,"evening",0,"맨해튼 스카이라인과 강을 바라보며 걷는 다리","보행로 상시 이용 가능",["다리","전망","야경"]),p("nyc-times","뉴욕","타임스 스퀘어","landmark",40.758,-73.9855,75,"evening",0,"대형 전광판과 극장가의 에너지를 느끼는 광장","광장 상시 이용 가능",["야경","광장","브로드웨이"]),
// 시드니
p("syd-opera","시드니","시드니 오페라 하우스","landmark",-33.8568,151.2153,120,"afternoon",30000,"시드니 항구를 상징하는 세계적인 공연장","투어·공연 시간 변동 · 공식 웹사이트 확인",["건축","항구","랜드마크"]),p("syd-botanic","시드니","로열 보타닉 가든","nature",-33.8642,151.2166,100,"morning",0,"항구 전망과 다양한 식물을 만나는 도심 정원","계절에 따라 개방시간 변동",["정원","산책","항구"]),p("syd-bondi","시드니","본다이 비치","nature",-33.8915,151.2767,150,"afternoon",0,"서핑과 해안 산책으로 유명한 시드니 대표 해변","해변 상시 접근 가능 · 안전 안내 확인",["해변","산책","서핑"]),p("syd-rocks","시드니","더 록스","culture",-33.8599,151.209,110,"afternoon",25000,"식민지 시대 골목과 주말 마켓을 만나는 항구 지역","상점·마켓별 운영시간 상이",["골목","역사","마켓"]),p("syd-qvb","시드니","퀸 빅토리아 빌딩","shopping",-33.8718,151.2067,90,"afternoon",15000,"역사적인 건축 안에서 즐기는 쇼핑과 카페","시설 운영시간 변동",["쇼핑","건축","카페"]),p("syd-fishmarket","시드니","시드니 피시 마켓","market",-33.8732,151.1949,100,"morning",35000,"신선한 해산물을 고르고 맛보는 대표 시장","시장 운영시간 변동 · 공식 안내 확인",["시장","해산물","미식"]),
// 서울 추가 장소
p("seoul-changdeokgung","서울","창덕궁","culture",37.5794,126.991,120,"morning",3000,"자연 지형을 살린 궁궐과 후원으로 유명한 조선 왕궁","후원 관람 예약·휴궁일 변동 · 공식 안내 확인",["궁궐","후원","역사"]),
p("seoul-leeum","서울","리움미술관","culture",37.5385,127.0025,120,"afternoon",18000,"한국 고미술과 현대미술을 함께 만나는 한남동 미술관","전시·예약 시간 변동 · 공식 웹사이트 확인",["미술관","현대미술","실내"]),
p("seoul-ikseon","서울","익선동 한옥거리","food",37.5743,126.9893,100,"afternoon",25000,"한옥 골목의 식당과 카페를 천천히 둘러보는 지역","점포별 운영시간 상이",["한옥","카페","골목"]),
p("seoul-yeonnam","서울","연남동 경의선숲길","nature",37.566,126.925,90,"evening",15000,"도심 철길을 재생한 산책로와 동네 상점을 즐기는 지역","산책로 상시 이용 가능 · 점포별 시간 상이",["산책","카페","로컬"]),
// 후쿠오카 추가 장소
p("fuk-dazaifu","후쿠오카","다자이후 텐만구","culture",33.5215,130.5348,150,"morning",10000,"학문의 신을 모신 신사와 산책로를 함께 둘러보는 근교 명소","본전 공사·시설별 운영시간 변동 · 공식 안내 확인",["신사","근교","역사"]),
p("fuk-teamlab","후쿠오카","팀랩 포레스트 후쿠오카","culture",33.5951,130.3621,110,"afternoon",24000,"움직임에 반응하는 디지털 아트를 체험하는 실내 전시","회차·입장료 변동 · 공식 웹사이트 확인",["미디어아트","실내","체험"]),
p("fuk-uminonakamichi","후쿠오카","우미노나카미치 해변공원","nature",33.6635,130.3615,180,"morning",5000,"계절 꽃과 바다 풍경을 넓은 공원에서 즐기는 근교 명소","계절·휴원일 변동 · 공식 안내 확인",["공원","바다","근교"]),
p("fuk-momochi","후쿠오카","모모치 해변","nature",33.5948,130.3515,100,"evening",0,"후쿠오카 타워 앞 인공 해변에서 노을을 즐기는 장소","해변 상시 접근 가능 · 시설별 시간 상이",["해변","노을","산책"]),
// 오사카 추가 장소
p("osa-sumiyoshi","오사카","스미요시타이샤","culture",34.6128,135.4931,100,"morning",0,"독특한 건축 양식과 붉은 다리로 알려진 오래된 신사","행사·시설별 관람시간 변동 · 공식 안내 확인",["신사","건축","역사"]),
p("osa-kaiyukan","오사카","가이유칸","culture",34.6545,135.4289,150,"afternoon",27000,"태평양 생태계를 대형 수조 동선으로 관람하는 수족관","입장 회차·운영시간 변동 · 공식 웹사이트 확인",["수족관","실내","가족"]),
p("osa-shinsekai","오사카","신세카이·쓰텐카쿠","food",34.6525,135.5063,110,"evening",28000,"복고적인 거리와 구시카쓰 식당이 모인 오사카 남부 지역","전망대·점포별 운영시간 상이",["구시카쓰","로컬","야경"]),
p("osa-minoh","오사카","미노오 공원","nature",34.8531,135.4711,180,"morning",0,"숲길을 따라 폭포까지 걷는 오사카 북부의 자연 명소","산책로 상태·계절 행사 변동 · 공식 안내 확인",["폭포","트레킹","근교"]),
// 방콕 추가 장소
p("bkk-jimthompson","방콕","짐 톰슨 하우스","culture",13.7493,100.528,100,"morning",8000,"태국 전통 가옥과 실크 컬렉션을 만나는 박물관","가이드 투어·운영시간 변동 · 공식 안내 확인",["박물관","전통가옥","실크"]),
p("bkk-bacc","방콕","방콕 예술문화센터","culture",13.7467,100.5301,100,"afternoon",0,"태국 현대미술 전시와 디자인 숍을 둘러보는 문화 공간","전시·휴관일 변동 · 공식 웹사이트 확인",["현대미술","실내","디자인"]),
p("bkk-iconsiam","방콕","아이콘시암","shopping",13.7265,100.5102,140,"evening",30000,"강변 전망과 쇼핑, 실내 로컬 푸드존을 함께 즐기는 복합 공간","시설·점포별 운영시간 상이",["쇼핑","강변","푸드코트"]),
p("bkk-khlonglatmayom","방콕","클롱랏마욤 수상시장","market",13.7612,100.4154,150,"morning",25000,"운하 주변에서 현지 음식과 시장 풍경을 경험하는 주말 명소","주말 중심 운영 · 방문 전 공식 안내 확인",["수상시장","로컬","미식"]),
// 파리 추가 장소
p("paris-orsay","파리","오르세 미술관","culture",48.86,2.3266,150,"morning",25000,"옛 기차역 건물에서 인상주의 걸작을 만나는 미술관","예약·휴관일 변동 · 공식 웹사이트 확인",["미술관","인상주의","실내"]),
p("paris-saintechapelle","파리","생트샤펠","culture",48.8554,2.345,80,"morning",20000,"화려한 중세 스테인드글라스로 유명한 왕실 예배당","보안 대기·입장시간 변동 · 공식 안내 확인",["성당","스테인드글라스","역사"]),
p("paris-canal","파리","생마르탱 운하","nature",48.8725,2.3654,100,"afternoon",10000,"운하와 다리, 동네 카페를 따라 걷는 파리 북동부 산책 지역","산책로 상시 이용 가능 · 점포별 시간 상이",["운하","산책","카페"]),
p("paris-garnier","파리","팔레 가르니에","landmark",48.8719,2.3316,100,"afternoon",25000,"화려한 실내 장식으로 유명한 파리의 역사적인 오페라 극장","공연·리허설에 따라 관람 변동 · 공식 안내 확인",["오페라","건축","실내"]),
// 런던 추가 장소
p("lon-nationalgallery","런던","내셔널 갤러리","culture",51.5089,-.1283,150,"morning",0,"트라팔가 광장에서 유럽 회화 컬렉션을 만나는 미술관","전시·운영시간 변동 · 공식 웹사이트 확인",["미술관","회화","실내"]),
p("lon-westminster","런던","웨스트민스터 사원","culture",51.4993,-.1273,110,"morning",45000,"영국 왕실 대관식과 역사를 간직한 고딕 양식 사원","예배·입장시간 변동 · 공식 안내 확인",["사원","왕실","역사"]),
p("lon-camden","런던","캠든 마켓","market",51.5414,-.1467,130,"afternoon",30000,"스트리트 푸드와 개성 있는 상점이 모인 운하변 시장","점포·요일별 운영시간 상이",["시장","스트리트푸드","쇼핑"]),
p("lon-greenwich","런던","그리니치 왕립천문대","landmark",51.4769,.0005,150,"afternoon",35000,"본초자오선과 런던 전망을 함께 경험하는 그리니치 명소","입장시간·전시 변동 · 공식 웹사이트 확인",["천문대","전망","근교"]),
// 뉴욕 추가 장소
p("nyc-moma","뉴욕","뉴욕 현대미술관","culture",40.7614,-73.9776,150,"morning",40000,"현대미술과 디자인의 주요 작품을 만나는 맨해튼 미술관","예약·운영시간 변동 · 공식 웹사이트 확인",["미술관","현대미술","실내"]),
p("nyc-grandcentral","뉴욕","그랜드 센트럴 터미널","landmark",40.7527,-73.9772,70,"morning",0,"별자리 천장과 역사적인 대합실로 유명한 철도 터미널","대합실 이용 가능 · 상점별 시간 상이",["건축","역사","교통"]),
p("nyc-dumbo","뉴욕","덤보","nature",40.7033,-73.9888,110,"afternoon",15000,"브루클린의 강변 공원과 맨해튼 브리지 뷰를 걷는 지역","공원 상시 이용 가능 · 점포별 시간 상이",["강변","산책","사진"]),
p("nyc-williamsburg","뉴욕","윌리엄스버그","shopping",40.7188,-73.9582,130,"evening",35000,"독립 상점과 식당, 음악 공간이 모인 브루클린 지역","상점·공연장별 운영시간 상이",["쇼핑","로컬","음악"]),
// 시드니 추가 장소
p("syd-harbourbridge","시드니","시드니 하버 브리지","landmark",-33.8523,151.2108,100,"morning",0,"보행로에서 오페라 하우스와 항구를 조망하는 상징적인 다리","보행로 이용 가능 · 클라임은 별도 예약",["다리","전망","산책"]),
p("syd-manly","시드니","맨리 비치","nature",-33.7969,151.287,180,"afternoon",0,"서큘러 키에서 페리로 찾아가는 여유로운 북부 해변","페리 운항·해변 안전 안내 확인",["해변","페리","산책"]),
p("syd-artgallery","시드니","뉴사우스웨일스 주립미술관","culture",-33.8688,151.2173,140,"afternoon",0,"호주와 아시아 미술을 폭넓게 만나는 도심 미술관","특별전·운영시간 변동 · 공식 웹사이트 확인",["미술관","호주미술","실내"]),
p("syd-barangaroo","시드니","바랑가루 리저브","nature",-33.8566,151.2018,100,"evening",0,"재생된 항구 산책로에서 노을과 도시 풍경을 즐기는 공원","공원 상시 이용 가능 · 일부 구역 행사 변동",["항구","노을","산책"]),
// 후쿠오카에서 선택 가능한 대표 근교
p("fuk-yufuin","후쿠오카","유후인·긴린코","nature",33.2667,131.36,240,"morning",45000,"기차로 이동해 긴린코와 온천 마을 상점가를 둘러보는 대표 근교 여행지","열차 시간과 시설별 운영시간 변동 · 사전 확인",["유후인","긴린코","온천","근교","기차"]),
// 도시별 카페 취향 보완용 실제 장소
p("fuk-rec-coffee","후쿠오카","REC COFFEE 야쿠인에키마에점","food",33.5808,130.4018,70,"afternoon",12000,"후쿠오카 로스터리의 스페셜티 커피를 즐기는 야쿠인 카페","점포 운영시간 변동 · 공식 안내 확인",["카페","커피","로스터리"]),
p("osa-lilo-coffee","오사카","LiLo Coffee Roasters","food",34.6747,135.4982,70,"afternoon",12000,"신사이바시 인근에서 다양한 원두를 골라 마시는 로스터리 카페","점포 운영시간 변동 · 공식 안내 확인",["카페","커피","로스터리"]),
p("bkk-factory-coffee","방콕","Factory Coffee","food",13.7565,100.5348,70,"morning",14000,"태국 스페셜티 커피 문화를 경험하는 파야타이의 로스터리 카페","점포 운영시간 변동 · 공식 안내 확인",["카페","커피","로스터리"]),
p("paris-cafe-flore","파리","카페 드 플로르","food",48.854,2.3325,80,"afternoon",25000,"생제르맹데프레의 역사와 분위기를 간직한 파리 카페","좌석 대기·운영시간 변동 · 공식 안내 확인",["카페","커피","생제르맹"]),
p("lon-monmouth","런던","Monmouth Coffee 버러 마켓점","food",51.5057,-.0913,60,"morning",12000,"버러 마켓 인근에서 직접 로스팅한 커피를 맛보는 카페","점포 운영시간 변동 · 공식 안내 확인",["카페","커피","로스터리"]),
p("nyc-devocion","뉴욕","Devoción 윌리엄스버그","food",40.7164,-73.9615,70,"afternoon",15000,"채광 좋은 공간에서 콜롬비아 원두를 즐기는 브루클린 카페","점포 운영시간 변동 · 공식 안내 확인",["카페","커피","브루클린"]),
p("syd-single-o","시드니","Single O Surry Hills","food",-33.881,151.2096,70,"morning",15000,"시드니 스페셜티 커피 문화를 대표하는 서리힐스 로스터리 카페","점포 운영시간 변동 · 공식 안내 확인",["카페","커피","로스터리"])
];
import {batchOnePlaces} from "./placesBatch1";
import {batchTwoPlaces} from "./placesBatch2";
import {batchThreePlaces} from "./placesBatch3";
import {batchFourPlaces} from "./placesBatch4";
import {batchFivePlaces} from "./placesBatch5";
import {batchSixPlaces} from "./placesBatch6";
export const places:Place[]=[...basePlaces,...batchOnePlaces,...batchTwoPlaces,...batchThreePlaces,...batchFourPlaces,...batchFivePlaces,...batchSixPlaces];
export const placesByCity=(cityId:string)=>places.filter(place=>place.cityId===cityId);
export const supportedCityIds=[...new Set(places.map(place=>place.cityId))];
