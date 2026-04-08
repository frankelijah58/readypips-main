import type { Db } from "mongodb";

type FxRateDoc = {
  pair: string;
  rate: number;
  source: string;
  fetchedAt: Date;
  createdAt: Date;
};

export async function getKesToUsdRate(
  db: Db,
  options?: { maxAgeMs?: number; forceRefresh?: boolean },
): Promise<{ rate: number; source: string; fetchedAt: Date }> {
  const pair = "KES_USD";
  const maxAgeMs = options?.maxAgeMs ?? 15 * 60 * 1000;

  const latest = await db
    .collection<FxRateDoc>("fx_rates")
    .find({ pair })
    .sort({ fetchedAt: -1 })
    .limit(1)
    .next();

  const now = Date.now();
  const isFresh =
    latest &&
    now - new Date(latest.fetchedAt).getTime() <= maxAgeMs &&
    Number.isFinite(latest.rate) &&
    latest.rate > 0;

  if (!options?.forceRefresh && isFresh && latest) {
    return {
      rate: latest.rate,
      source: latest.source,
      fetchedAt: new Date(latest.fetchedAt),
    };
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/KES", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`FX API responded ${res.status}`);
    }

    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    const rate = Number(data?.rates?.USD);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("USD rate missing in FX response");
    }

    const fetchedAt = data.time_last_update_utc
      ? new Date(data.time_last_update_utc)
      : new Date();

    await db.collection<FxRateDoc>("fx_rates").insertOne({
      pair,
      rate,
      source: "open.er-api.com",
      fetchedAt,
      createdAt: new Date(),
    });

    return { rate, source: "open.er-api.com", fetchedAt };
  } catch (error) {
    if (latest && Number.isFinite(latest.rate) && latest.rate > 0) {
      return {
        rate: latest.rate,
        source: `${latest.source} (cached)`,
        fetchedAt: new Date(latest.fetchedAt),
      };
    }
    throw error;
  }
}

export function convertKesToUsd(amountKes: number, rate: number): number {
  const value = Number(amountKes) * Number(rate);
  return Math.round(value * 100) / 100;
}
