export const PROVIDER_REQUEST_TIMEOUT_MS = 8_000;
export const ROUTE_DEADLINE_MS = 25_000;
export const TIMEOUT_MESSAGE = "외부 서비스 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.";

export class ApiHttpError extends Error {
  readonly httpStatus: number;
  readonly providerStatus: string;
  readonly retryAt?: string;
  readonly retryAfterSeconds?: number;
  readonly rateLimitLimit?: number;
  readonly rateLimitRemaining?: number;
  readonly providerStage?: string;

  constructor(
    httpStatus: number,
    providerStatus: string,
    message: string,
    rateLimit?: { retryAt?: string; retryAfterSeconds?: number; rateLimitLimit?: number; rateLimitRemaining?: number; providerStage?: string }
  ) {
    super(message);
    this.httpStatus = httpStatus;
    this.providerStatus = providerStatus;
    this.retryAt = rateLimit?.retryAt;
    this.retryAfterSeconds = rateLimit?.retryAfterSeconds;
    this.rateLimitLimit = rateLimit?.rateLimitLimit;
    this.rateLimitRemaining = rateLimit?.rateLimitRemaining;
    this.providerStage = rateLimit?.providerStage;
  }
}

export const providerErrorFromStatus = (status: number, provider: string) => {
  if (status === 401 || status === 403) {
    return new ApiHttpError(502, "AUTH_FAILED", `${provider} 인증에 실패했습니다.`);
  }
  if (status === 429) {
    return new ApiHttpError(429, "RATE_LIMITED", `${provider} 요청 한도를 초과했습니다.`);
  }
  return new ApiHttpError(502, "PROVIDER_ERROR", `${provider} 응답 오류가 발생했습니다.`);
};

export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  routeSignal?: AbortSignal,
  timeoutMs = PROVIDER_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = routeSignal ? AbortSignal.any([routeSignal, timeoutSignal]) : timeoutSignal;
  try {
    return await fetch(input, { ...init, signal });
  } catch (error) {
    if (signal.aborted) throw new ApiHttpError(504, "TIMEOUT", TIMEOUT_MESSAGE);
    const causeCode = error instanceof Error && "cause" in error
      ? (error.cause as { code?: string } | undefined)?.code
      : undefined;
    const suffix = causeCode ? ` (${causeCode})` : "";
    throw new ApiHttpError(502, "PROVIDER_ERROR", `외부 공급자 연결에 실패했습니다${suffix}.`);
  }
}

export const apiErrorResponse = (error: unknown) => {
  if (error instanceof ApiHttpError) {
    return {
      status: error.httpStatus,
      body: {
        success: false,
        providerStatus: error.providerStatus,
        message: error.message,
        ...(error.retryAt ? { retryAt: error.retryAt } : {}),
        ...(error.retryAfterSeconds !== undefined ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
        ...(error.rateLimitLimit !== undefined ? { rateLimitLimit: error.rateLimitLimit } : {}),
        ...(error.rateLimitRemaining !== undefined ? { rateLimitRemaining: error.rateLimitRemaining } : {}),
        ...(error.providerStage ? { providerStage: error.providerStage } : {}),
      },
    };
  }
  return {
    status: 500,
    body: { success: false, providerStatus: "INTERNAL_ERROR", message: "내부 처리 중 오류가 발생했습니다." },
  };
};
