import type { ExchangeRateInfo } from "../types/flight";

export async function fetchExchangeRate(
  baseCurrency: string,
  targetCurrency: string,
  signal?: AbortSignal
): Promise<ExchangeRateInfo | null> {
  const base = baseCurrency.toUpperCase().trim();
  const target = targetCurrency.toUpperCase().trim();

  if (base === target) {
    return {
      rate: 1,
      source: "Same Currency",
      timestamp: new Date().toISOString(),
      baseCurrency: base,
      targetCurrency: target,
    };
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      signal,
    });
    if (!res.ok) return null;
    const json = await res.json();

    if (json && json.result === "success" && json.rates && typeof json.rates[target] === "number") {
      const rate = json.rates[target];
      const timeLastUpdate = json.time_last_update_utc || new Date().toISOString();
      return {
        rate,
        source: "Open Exchange Rates API",
        timestamp: timeLastUpdate,
        baseCurrency: base,
        targetCurrency: target,
      };
    }
    return null;
  } catch {
    return null;
  }
}
