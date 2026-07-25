import type { Db } from "mongodb";
import type { ObjectId } from "mongodb";
import { convertKesToUsd, getKesToUsdRate } from "@/lib/currency-rates";
import {
  computeMismatch,
  convertByRate,
  normalizeMoney,
  type MoneyInput,
} from "@/lib/payment-amounts";

export type PaymentIntentDoc = Record<string, unknown> & {
  _id: ObjectId;
  provider?: string;
  reference?: string;
  amount?: number;
  amountKes?: number;
  amountUsd?: number;
  currency?: string;
  currencyKes?: string;
  currencyUsd?: string;
  callbackPayload?: unknown;
  expectedAmountKes?: number;
  expectedAmountUsd?: number;
  status?: string;
  checkoutRequestID?: string;
  merchantRequestID?: string;
};

function extractCallbackItem(items: unknown[], name: string): unknown {
  if (!Array.isArray(items)) return null;
  const row = items.find((item: any) => item?.Name === name) as
    | { Value?: unknown }
    | undefined;
  return row?.Value ?? null;
}

export function extractMpesaKesFromCallbackPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const callback =
    (p.Body as any)?.stkCallback || (p.body as any)?.stkCallback || null;
  if (!callback) return null;
  const items = (callback as any).CallbackMetadata?.Item || [];
  const raw = extractCallbackItem(items, "Amount");
  return normalizeMoney(raw as any, 2);
}

function providerRef(doc: PaymentIntentDoc): string | null {
  const r =
    (doc.reference as string) ||
    (doc.checkoutRequestID as string) ||
    (doc.merchantRequestID as string) ||
    null;
  return r ? String(r) : null;
}

function isKesIntent(doc: PaymentIntentDoc): boolean {
  const c = String(doc.currency || doc.currencyKes || "").toUpperCase();
  if (doc.provider === "mpesa") return true;
  return c === "KES";
}

function isUsdLike(doc: PaymentIntentDoc): boolean {
  const c = String(doc.currency || doc.currencyUsd || "").toUpperCase();
  return (
    c === "USD" ||
    c === "USDT" ||
    doc.provider === "whop" ||
    doc.provider === "stripe" ||
    (doc.provider === "binance" && c !== "KES")
  );
}

export type BackfillPatch = {
  $set: Record<string, unknown>;
  notes: string[];
};

/**
 * Builds canonical reconciliation fields for a payment_intents document.
 * Does not write to DB — caller applies $set and audit.
 */
export async function buildPaymentIntentBackfillPatch(
  db: Db,
  doc: PaymentIntentDoc,
): Promise<BackfillPatch> {
  const notes: string[] = [];
  const $set: Record<string, unknown> = {};
  const provider = String(doc.provider || "").toLowerCase();

  const ref = providerRef(doc);
  if (ref && doc.provider_reference == null) {
    $set.provider_reference = ref;
    notes.push("Set provider_reference from reference/checkout/merchant id");
  }

  let paidOriginal: number | null = null;
  let currencyOriginal: string | null = null;
  let exchangeRateUsed: number | null = null;
  let amountConvertedKes: number | null = null;

  if (provider === "mpesa") {
    const fromCb = extractMpesaKesFromCallbackPayload(doc.callbackPayload);
    const fallback = normalizeMoney((doc.amountKes ?? doc.amount) as MoneyInput, 2);
    paidOriginal =
      fromCb != null && fromCb > 0 ? fromCb : fallback != null && fallback > 0 ? fallback : null;
    currencyOriginal = "KES";
    exchangeRateUsed = 1;
    amountConvertedKes = paidOriginal;
    if (fromCb != null && fromCb > 0) {
      notes.push("M-Pesa: amount from callback payload");
    } else if (paidOriginal != null) {
      notes.push("M-Pesa: amount from stored amountKes/amount (no callback Amount)");
    }
  } else if (provider === "paystack" && isKesIntent(doc)) {
    paidOriginal = normalizeMoney((doc.amountKes ?? doc.amount) as MoneyInput, 2);
    currencyOriginal = "KES";
    exchangeRateUsed = 1;
    amountConvertedKes = paidOriginal;
    notes.push("Paystack KES: canonical from amountKes/amount");
  } else if (isUsdLike(doc) || provider === "binance") {
    paidOriginal = normalizeMoney(
      (doc.amountUsd ?? doc.amount) as MoneyInput,
      2,
    );
    currencyOriginal =
      String(doc.currency || doc.currencyUsd || "USD").toUpperCase() === "USDT"
        ? "USDT"
        : "USD";
    try {
      const fx = await getKesToUsdRate(db, { forceRefresh: false });
      exchangeRateUsed = fx.rate;
      amountConvertedKes =
        paidOriginal != null && paidOriginal > 0
          ? convertByRate(paidOriginal, fx.rate, { mode: "divide", scale: 2 })
          : null;
      notes.push(`USD/USDT: KES derived with cached FX (${fx.source})`);
    } catch {
      exchangeRateUsed = null;
      amountConvertedKes = null;
      notes.push("USD/USDT: FX unavailable; skipped KES conversion");
    }
  } else {
    paidOriginal = normalizeMoney((doc.amount ?? doc.amountKes ?? doc.amountUsd) as MoneyInput, 2);
    currencyOriginal = String(doc.currency || "USD").toUpperCase();
    exchangeRateUsed = currencyOriginal === "KES" ? 1 : null;
    amountConvertedKes =
      currencyOriginal === "KES" ? paidOriginal : null;
    notes.push("Generic: inferred from amount fields");
  }

  if (paidOriginal != null && paidOriginal > 0) {
    $set.amount_paid_original = paidOriginal;
    $set.currency_original = currencyOriginal;
  }
  if (exchangeRateUsed != null && Number.isFinite(exchangeRateUsed)) {
    $set.exchange_rate_used = exchangeRateUsed;
  }
  if (amountConvertedKes != null && amountConvertedKes > 0) {
    $set.amount_converted = amountConvertedKes;
    $set.amount_converted_kes = amountConvertedKes;
  }

  const expectedKes = normalizeMoney(doc.expectedAmountKes as MoneyInput, 2);
  const expectedUsd = normalizeMoney(doc.expectedAmountUsd as MoneyInput, 2);
  if (currencyOriginal === "KES" && paidOriginal != null && expectedKes != null) {
    $set.amountMismatch = computeMismatch(paidOriginal, expectedKes, 100, 2);
    notes.push("Recomputed amountMismatch (KES vs expectedAmountKes)");
  } else if (
    (currencyOriginal === "USD" || currencyOriginal === "USDT") &&
    paidOriginal != null &&
    expectedUsd != null &&
    expectedUsd > 0
  ) {
    $set.amountMismatch = computeMismatch(paidOriginal, expectedUsd, 1, 2);
    notes.push("Recomputed amountMismatch (USD vs expectedAmountUsd)");
  }

  if (provider === "mpesa" && paidOriginal != null && paidOriginal > 0) {
    try {
      const fx = await getKesToUsdRate(db, { forceRefresh: false });
      const usd = convertKesToUsd(paidOriginal, fx.rate);
      $set.amountUsd = usd;
      $set.currencyUsd = "USD";
      $set.fxRateKesToUsd = fx.rate;
      $set.fxSource = fx.source;
      $set.fxFetchedAt = fx.fetchedAt;
      notes.push("M-Pesa: refreshed amountUsd from cached KES→USD rate");
    } catch {
      notes.push("M-Pesa: could not refresh USD side (FX error)");
    }
  }

  $set.backfilledAt = new Date();
  $set.backfillVersion = 1;

  return { $set, notes };
}

export function intentNeedsBackfill(doc: PaymentIntentDoc): boolean {
  const missing =
    doc.amount_paid_original == null ||
    doc.currency_original == null ||
    doc.amount_converted == null ||
    doc.provider_reference == null;
  const cbKes = extractMpesaKesFromCallbackPayload(doc.callbackPayload);
  const storedKes = normalizeMoney(
    (doc.amount_paid_original ?? doc.amountKes ?? doc.amount) as MoneyInput,
    2,
  );
  const mpesaStale =
    doc.provider === "mpesa" &&
    cbKes != null &&
    cbKes > 0 &&
    storedKes != null &&
    computeMismatch(cbKes, storedKes, 100, 2);
  return missing || Boolean(mpesaStale);
}
