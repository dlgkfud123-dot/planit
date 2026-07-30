export type DayWeatherInfo = {
  date: string;
  isRain: boolean;
  isClear: boolean;
  rainProb: number;
  weatherCode: number;
  temperatureMax: number | null;
  temperatureMin: number | null;
};

export type WeatherDataResponse = {
  success: boolean;
  city: string;
  summary: "rain" | "clear" | "normal";
  hasRain: boolean;
  hasClear: boolean;
  daily: DayWeatherInfo[];
};

const cache = new Map<string, { data: WeatherDataResponse | null; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  start: string,
  end: string,
  city = ""
): Promise<WeatherDataResponse | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  const normalizedLatitude = latitude.toFixed(4);
  const normalizedLongitude = longitude.toFixed(4);
  const cacheKey = `${normalizedLatitude}_${normalizedLongitude}_${start}_${end}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) return cached.data;

  try {
    const params = new URLSearchParams({
      latitude: normalizedLatitude,
      longitude: normalizedLongitude,
      start,
      end,
    });
    if (city) params.set("city", city);

    const response = await fetch(`/api/weather?${params.toString()}`);
    if (!response.ok) {
      cache.set(cacheKey, { data: null, timestamp: now });
      return null;
    }

    const data: WeatherDataResponse = await response.json();
    const result = data.success ? data : null;
    cache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch {
    cache.set(cacheKey, { data: null, timestamp: now });
    return null;
  }
}

export function formatDayWeather(weather: DayWeatherInfo): string {
  const code = weather.weatherCode;
  const condition = code === 0 ? "☀️ 맑음"
    : code <= 2 ? "🌤️ 대체로 맑음"
    : code === 3 ? "☁️ 흐림"
    : code === 45 || code === 48 ? "🌫️ 안개"
    : (code >= 51 && code <= 67) || (code >= 80 && code <= 82) ? "🌧️ 비"
    : (code >= 71 && code <= 77) || (code >= 85 && code <= 86) ? "❄️ 눈"
    : code >= 95 ? "⛈️ 뇌우"
    : "🌥️ 구름";
  const high = weather.temperatureMax === null ? "–" : `${Math.round(weather.temperatureMax)}°`;
  const low = weather.temperatureMin === null ? "–" : `${Math.round(weather.temperatureMin)}°`;
  return `${condition} · 최고 ${high} / 최저 ${low} · 강수 ${Math.round(weather.rainProb)}%`;
}
