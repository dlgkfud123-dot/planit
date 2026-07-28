export type DayWeatherInfo = {
  date: string;
  isRain: boolean;
  isClear: boolean;
  rainProb: number;
  weatherCode: number;
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
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function fetchWeatherData(city: string, start: string, end: string): Promise<WeatherDataResponse | null> {
  const cacheKey = `${city}_${start}_${end}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({ city, start, end });
    const res = await fetch(`/api/weather?${params.toString()}`);
    if (!res.ok) {
      cache.set(cacheKey, { data: null, timestamp: now });
      return null;
    }
    const data: WeatherDataResponse = await res.json();
    if (data.success) {
      cache.set(cacheKey, { data, timestamp: now });
      return data;
    }
    cache.set(cacheKey, { data: null, timestamp: now });
    return null;
  } catch {
    cache.set(cacheKey, { data: null, timestamp: now });
    return null;
  }
}
