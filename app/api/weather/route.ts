import { NextResponse } from "next/server";

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  서울: { lat: 37.5665, lng: 126.9780 },
  후쿠오카: { lat: 33.5902, lng: 130.4017 },
  오사카: { lat: 34.6937, lng: 135.5023 },
  도쿄: { lat: 35.6762, lng: 139.6503 },
  교토: { lat: 35.0116, lng: 135.7681 },
  방콕: { lat: 13.7563, lng: 100.5018 },
  파리: { lat: 48.8566, lng: 2.3522 },
  런던: { lat: 51.5074, lng: -0.1278 },
  뉴욕: { lat: 40.7128, lng: -74.0060 },
  시드니: { lat: -33.8688, lng: 151.2093 },
  부산: { lat: 35.1796, lng: 129.0756 },
  제주: { lat: 33.4996, lng: 126.5312 },
  싱가포르: { lat: 1.3521, lng: 103.8198 },
  대만: { lat: 25.0330, lng: 121.5654 },
  다낭: { lat: 16.0544, lng: 108.2022 },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "서울";
  const start = searchParams.get("start") || new Date().toISOString().slice(0, 10);
  const end = searchParams.get("end") || start;

  const coords = cityCoordinates[city] || cityCoordinates["서울"];

  // Validate forecast date range (Open-Meteo supports up to 16 days from today)
  const today = new Date();
  const startDate = new Date(start);
  const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 16 || diffDays < -30) {
    return NextResponse.json({ success: false, weatherData: null, reason: "date_out_of_range" });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weathercode,precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${start}&end_date=${end}`;
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 1800 } });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ success: false, weatherData: null, reason: "api_error" });
    }

    const data = await res.json();
    const daily = data.daily || {};
    const dates: string[] = daily.time || [];
    const weatherCodes: number[] = daily.weathercode || [];
    const rainProbs: number[] = daily.precipitation_probability_max || [];

    let totalRainDays = 0;
    let totalClearDays = 0;

    const parsedDaily = dates.map((dateStr, idx) => {
      const prob = rainProbs[idx] ?? 0;
      const code = weatherCodes[idx] ?? 0;
      // WMO code 51-67, 80-82: Rain, 71-77, 85-86: Snow, 95-99: Thunderstorm
      const isRainOrSnow = prob >= 50 || (code >= 51 && code <= 99);
      const isClear = prob < 20 && (code === 0 || code === 1);

      if (isRainOrSnow) totalRainDays++;
      if (isClear) totalClearDays++;

      return {
        date: dateStr,
        isRain: isRainOrSnow,
        isClear,
        rainProb: prob,
        weatherCode: code,
      };
    });

    const summary = totalRainDays > 0 ? "rain" : totalClearDays >= Math.ceil(parsedDaily.length / 2) ? "clear" : "normal";

    return NextResponse.json({
      success: true,
      city,
      summary,
      hasRain: totalRainDays > 0,
      hasClear: summary === "clear",
      daily: parsedDaily,
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ success: false, weatherData: null, reason: "fallback" });
  }
}
