"use client";
import React, { useMemo } from "react";
import type { TravelCity } from "../../data/cities";

type Props = {
  cities: TravelCity[];
  focusedCountry: string | null;
  citiesVisible: boolean;
  hoveredCity: string | null;
  selected: TravelCity | null;
  onCountrySelect: (country: string) => void;
  onSelect: (city: TravelCity) => void;
  onCityHover: (city: string | null) => void;
};

// High-resolution world map country paths & bounds mapping
// Warm Ivory landmass (#F6F4EF), Soft Blue-Gray borders (#C3D3DD), Pure White background (#FFFFFF)
interface CountryPathData {
  id: string;
  name: string;
  d: string;
  center: [number, number]; // SVG viewBox x, y for city pins
}

const countryPaths: CountryPathData[] = [
  // 동아시아 & 일본 열도 (고해상도 굴곡 표현)
  {
    id: "JPN",
    name: "일본",
    d: "M 880 230 Q 885 220 890 210 T 900 195 L 905 190 Q 908 198 902 210 L 892 228 Z M 865 245 Q 875 238 885 232 L 878 248 Z M 850 258 Q 860 250 868 246 L 860 262 Z M 835 268 Q 842 264 848 262 L 842 272 Z",
    center: [875, 235],
  },
  {
    id: "KOR",
    name: "대한민국",
    d: "M 830 240 L 840 242 L 842 255 L 832 258 L 828 248 Z",
    center: [835, 248],
  },
  {
    id: "CHN",
    name: "중국",
    d: "M 740 210 L 780 200 L 825 215 L 832 238 L 815 260 L 780 265 L 750 250 L 730 230 Z",
    center: [780, 235],
  },
  {
    id: "TWN",
    name: "대만",
    d: "M 825 272 L 828 270 L 829 280 L 825 282 Z",
    center: [827, 276],
  },

  // 동남아시아 & 군도 (필리핀, 인도네시아 등)
  {
    id: "THA",
    name: "태국",
    d: "M 770 280 L 780 275 L 785 290 L 778 310 L 772 312 L 772 295 Z",
    center: [778, 290],
  },
  {
    id: "VNM",
    name: "베트남",
    d: "M 788 272 L 795 275 L 788 295 L 782 315 L 778 305 L 788 288 Z",
    center: [788, 290],
  },
  {
    id: "SGP",
    name: "싱가포르",
    d: "M 771 324 A 3 3 0 1 1 771 323.9 Z",
    center: [771, 324],
  },
  {
    id: "IDN",
    name: "인도네시아",
    d: "M 760 328 L 790 330 L 820 332 L 810 338 L 770 336 Z M 800 318 L 825 315 L 820 324 Z M 840 320 L 865 325 L 850 335 Z",
    center: [800, 328],
  },

  // 서아시아 & 아랍
  {
    id: "ARE",
    name: "아랍에미리트",
    d: "M 645 260 L 655 258 L 658 265 L 648 267 Z",
    center: [652, 262],
  },

  // 유럽 & 스칸디나비아 & 지중해
  {
    id: "FRA",
    name: "프랑스",
    d: "M 480 180 L 500 178 L 505 195 L 488 205 L 475 192 Z",
    center: [490, 190],
  },
  {
    id: "GBR",
    name: "영국",
    d: "M 470 155 L 480 150 L 482 172 L 472 175 Z M 460 162 L 467 160 L 465 170 Z",
    center: [475, 162],
  },
  {
    id: "ITA",
    name: "이탈리아",
    d: "M 502 195 L 512 198 L 522 215 L 515 220 L 508 208 Z M 500 218 L 508 216 L 505 224 Z",
    center: [512, 208],
  },
  {
    id: "CHE",
    name: "스위스",
    d: "M 498 190 L 506 189 L 505 195 L 497 194 Z",
    center: [501, 192],
  },
  {
    id: "ESP",
    name: "스페인",
    d: "M 458 192 L 478 190 L 475 210 L 455 208 Z",
    center: [468, 200],
  },
  {
    id: "NLD",
    name: "네덜란드",
    d: "M 490 170 L 498 168 L 497 175 L 489 176 Z",
    center: [494, 172],
  },
  {
    id: "TUR",
    name: "튀르키예",
    d: "M 545 210 L 580 208 L 585 220 L 548 222 Z",
    center: [565, 215],
  },
  {
    id: "RUS",
    name: "러시아",
    d: "M 510 130 L 600 110 L 750 100 L 900 115 L 890 160 L 720 170 L 560 165 L 520 150 Z",
    center: [680, 140],
  },

  // 북아메리카
  {
    id: "USA",
    name: "미국",
    d: "M 180 180 L 290 175 L 295 230 L 195 235 L 175 200 Z M 110 130 L 150 125 L 140 150 Z",
    center: [235, 205],
  },
  {
    id: "CAN",
    name: "캐나다",
    d: "M 150 120 L 290 110 L 285 170 L 160 175 Z",
    center: [220, 142],
  },

  // 남아메리카
  {
    id: "BRA",
    name: "브라질",
    d: "M 320 280 L 370 275 L 385 320 L 340 350 L 315 310 Z",
    center: [350, 310],
  },

  // 아프리카
  {
    id: "EGY",
    name: "이집트",
    d: "M 540 228 L 570 225 L 568 250 L 538 248 Z",
    center: [554, 236],
  },
  {
    id: "ZAF",
    name: "남아프리카공화국",
    d: "M 525 350 L 555 348 L 550 375 L 520 372 Z",
    center: [538, 362],
  },

  // 오세아니아 (호주 & 뉴질랜드)
  {
    id: "AUS",
    name: "호주",
    d: "M 820 350 L 890 345 L 895 395 L 830 400 L 815 370 Z M 885 410 A 5 5 0 1 1 885 409.9 Z",
    center: [855, 372],
  },
  {
    id: "NZL",
    name: "뉴질랜드",
    d: "M 945 390 L 955 405 Z M 935 410 L 945 425 Z",
    center: [945, 410],
  },
];

export default function VectorWorldMap({
  cities,
  focusedCountry,
  citiesVisible,
  hoveredCity,
  selected,
  onCountrySelect,
  onSelect,
  onCityHover,
}: Props) {
  // Filter active city markers
  const activeCities = useMemo(() => {
    if (!focusedCountry) return [];
    return cities.filter((c) => c.country === focusedCountry);
  }, [cities, focusedCountry]);

  return (
    <div className="vectorWorldMapWrapper">
      <svg
        viewBox="0 0 1000 500"
        className="vectorWorldSvg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Crisp Pure White Background */}
        <rect x="0" y="0" width="1000" height="500" fill="#FFFFFF" />

        {/* Decorative subtle latitude lines */}
        <g stroke="#F1F5F9" strokeWidth="0.5" strokeDasharray="4 6">
          <line x1="0" y1="125" x2="1000" y2="125" />
          <line x1="0" y1="250" x2="1000" y2="250" />
          <line x1="0" y1="375" x2="1000" y2="375" />
        </g>

        {/* High-Precision Country Polygons */}
        <g className="countriesGroup">
          {countryPaths.map((country) => {
            const isFocused = focusedCountry === country.name;
            return (
              <g
                key={country.id}
                onClick={() => onCountrySelect(country.name)}
                className={`countryGroupItem ${isFocused ? "focused" : ""}`}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={country.d}
                  fill={isFocused ? "#E2F0F9" : "#F6F4EF"}
                  stroke={isFocused ? "#326CFF" : "#C3D3DD"}
                  strokeWidth={isFocused ? "1.6" : "0.8"}
                  strokeLinejoin="round"
                  className="countryPath"
                />

                {/* Country Name Label badge */}
                <text
                  x={country.center[0]}
                  y={country.center[1]}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight={isFocused ? "800" : "600"}
                  fill={isFocused ? "#2563EB" : "#64748B"}
                  className="countryLabelText"
                >
                  {country.name}
                </text>
              </g>
            );
          })}
        </g>

        {/* City Marker Pins Overlay */}
        {activeCities.map((city) => {
          const isSelected = selected?.name === city.name;
          const isHovered = hoveredCity === city.name;
          // Calculate relative position based on country center
          const countryData = countryPaths.find((c) => c.name === city.country);
          const baseX = countryData ? countryData.center[0] : 500;
          const baseY = countryData ? countryData.center[1] : 250;

          return (
            <g
              key={city.en}
              transform={`translate(${baseX}, ${baseY + 14})`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(city);
              }}
              onMouseEnter={() => onCityHover(city.name)}
              onMouseLeave={() => onCityHover(null)}
              style={{ cursor: "pointer" }}
              className={`cityPinGroup ${isSelected ? "selected" : ""}`}
            >
              {/* Outer Pulsing Glow */}
              <circle
                r={isSelected || isHovered ? "10" : "6"}
                fill={isSelected ? "rgba(50,108,255,0.25)" : "rgba(245,158,11,0.2)"}
              />

              {/* Pin Center */}
              <circle
                r="4.5"
                fill={isSelected ? "#326CFF" : "#F59E0B"}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* City Label Badge */}
              <g transform="translate(0, 16)">
                <rect
                  x="-24"
                  y="-11"
                  width="48"
                  height="16"
                  rx="4"
                  fill="#FFFFFF"
                  stroke={isSelected ? "#326CFF" : "#CBD5E1"}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill={isSelected ? "#2563EB" : "#0F172A"}
                >
                  {city.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
