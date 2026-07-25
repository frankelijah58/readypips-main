export type PaymentChannel = "mpesa" | "binance" | "card";

export function normalizePaymentChannel(provider: unknown): PaymentChannel {
  const raw = String(provider || "").toLowerCase().trim();
  if (raw === "mpesa") return "mpesa";
  if (raw === "binance") return "binance";
  return "card";
}

