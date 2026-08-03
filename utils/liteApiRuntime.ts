import { ApiHttpError, fetchWithTimeout } from "./apiRuntime.ts";

export const LITEAPI_MIN_REQUEST_INTERVAL_MS = 250;

type RateLimitMetadata = {
  retryAt?: string;
  retryAfterSeconds?: number;
  rateLimitLimit?: number;
  rateLimitRemaining?: number;
};

let limiterTail: Promise<void> = Promise.resolve();
let nextRequestAt = 0;
let cooldownUntil = 0;

const numericHeader = (response: Response, name: string) => {
  const value = response.headers.get(name);
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function parseLiteApiRateLimit(response: Response, now = Date.now()): RateLimitMetadata {
  const limit = numericHeader(response, "x-ratelimit-limit");
  const remaining = numericHeader(response, "x-ratelimit-remaining");
  const retryAfterHeader = response.headers.get("retry-after");
  const resetEpochSeconds = numericHeader(response, "x-ratelimit-reset");
  let retryAtMs: number | undefined;

  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    retryAtMs = Number.isFinite(seconds) ? now + Math.max(0, seconds * 1000) : Date.parse(retryAfterHeader);
  } else if (resetEpochSeconds !== undefined) {
    retryAtMs = resetEpochSeconds * 1000;
  }

  if (retryAtMs !== undefined && (!Number.isFinite(retryAtMs) || retryAtMs <= now)) retryAtMs = now + 1000;

  return {
    ...(retryAtMs !== undefined ? {
      retryAt: new Date(retryAtMs).toISOString(),
      retryAfterSeconds: Math.max(1, Math.ceil((retryAtMs - now) / 1000)),
    } : {}),
    ...(limit !== undefined ? { rateLimitLimit: limit } : {}),
    ...(remaining !== undefined ? { rateLimitRemaining: remaining } : {}),
  };
}

const timeoutError = () => new ApiHttpError(504, "TIMEOUT", "외부 서비스 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.");

const waitUntil = (target: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const delay = Math.max(0, target - Date.now());
  if (delay === 0) return resolve();
  const timer = setTimeout(resolve, delay);
  signal?.addEventListener("abort", () => {
    clearTimeout(timer);
    reject(timeoutError());
  }, { once: true });
});

async function acquireLiteApiSlot(signal?: AbortSignal) {
  const ticket = limiterTail.then(async () => {
    if (signal?.aborted) throw timeoutError();
    await waitUntil(Math.max(nextRequestAt, cooldownUntil), signal);
    nextRequestAt = Date.now() + LITEAPI_MIN_REQUEST_INTERVAL_MS;
  });
  limiterTail = ticket.catch(() => undefined);
  await ticket;
}

export async function liteApiFetch(input: string, init: RequestInit, routeSignal?: AbortSignal): Promise<Response> {
  if (cooldownUntil > Date.now()) {
    const retryAfterSeconds = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
    throw new ApiHttpError(429, "RATE_LIMITED", `LiteAPI 요청 한도를 초과했습니다. ${retryAfterSeconds}초 후 다시 시도할 수 있습니다.`, {
      retryAt: new Date(cooldownUntil).toISOString(), retryAfterSeconds, rateLimitRemaining: 0,
    });
  }
  await acquireLiteApiSlot(routeSignal);
  const response = await fetchWithTimeout(input, init, routeSignal);
  const metadata = parseLiteApiRateLimit(response);
  if (response.status === 429) {
    cooldownUntil = metadata.retryAt ? Date.parse(metadata.retryAt) : Date.now() + 1000;
    throw new ApiHttpError(429, "RATE_LIMITED", `LiteAPI 요청 한도를 초과했습니다. ${metadata.retryAfterSeconds ?? 1}초 후 다시 시도할 수 있습니다.`, metadata);
  }
  if (response.status === 401 || response.status === 403) throw new ApiHttpError(502, "AUTH_FAILED", "LiteAPI 인증에 실패했습니다.", metadata);
  if (!response.ok) throw new ApiHttpError(502, "PROVIDER_ERROR", "LiteAPI 응답 오류가 발생했습니다.", metadata);
  return response;
}

export function resetLiteApiRuntimeForTests() {
  limiterTail = Promise.resolve();
  nextRequestAt = 0;
  cooldownUntil = 0;
}
