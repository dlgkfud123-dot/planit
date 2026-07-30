import { NextResponse } from "next/server";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitudeValue = searchParams.get("latitude");
  const longitudeValue = searchParams.get("longitude");
  const city = searchParams.get("city") || "";
  const start = searchParams.get("start") || new Date().toISOString().slice(0, 10);
  const end = searchParams.get("end") || start;

  if (latitudeValue === null || longitudeValue === null || latitudeValue.trim() === "" || longitudeValue.trim() === "") {
    return NextResponse.json({ success: false, weatherData: null, reason: "missing_coordinates" });
  }

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ success: false, weatherData: null, reason: "invalid_coordinates" });
  }

  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate || startDate > endDate) {
    return NextResponse.json({ success: false, weatherData: null, reason: "invalid_date" });
  }

  // Open-Meteo forecast requests are limited to the supported forecast window.
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startDiffDays = Math.round((startDate.getTime() - today) / DAY_MS);
  const endDiffDays = Math.round((endDate.getTime() - today) / DAY_MS);
  if (startDiffDays > 16 || startDiffDays < -30 || endDiffDays > 16 || endDiffDays < -30) {
    return NextResponse.json({ success: false, weatherData: null, reason: "date_out_of_range" });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${start}&end_date=${end}`;
    const response = await fetch(url, { signal: controller.signal, next: { revalidate: 1800 } });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ success: false, weatherData: null, reason: "api_error" });
    }

    const data = await response.json();
    const daily = data.daily || {};
    const dates: string[] = daily.time || [];
    const weatherCodes: number[] = daily.weathercode || [];
    const rainProbs: number[] = daily.precipitation_probability_max || [];
    const temperatureMaxValues: number[] = daily.temperature_2m_max || [];
    const temperatureMinValues: number[] = daily.temperature_2m_min || [];

    let totalRainDays = 0;
    let totalClearDays = 0;

    const parsedDaily = dates.map((dateStr, index) => {
      const probability = rainProbs[index] ?? 0;
      const code = weatherCodes[index] ?? 0;
      const isRainOrSnow = probability >= 50 || (code >= 51 && code <= 99);
      const isClear = probability < 20 && (code === 0 || code === 1);

      if (isRainOrSnow) totalRainDays++;
      if (isClear) totalClearDays++;

      return {
        date: dateStr,
        isRain: isRainOrSnow,
        isClear,
        rainProb: probability,
        weatherCode: code,
        temperatureMax: Number.isFinite(temperatureMaxValues[index]) ? temperatureMaxValues[index] : null,
        temperatureMin: Number.isFinite(temperatureMinValues[index]) ? temperatureMinValues[index] : null,
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
