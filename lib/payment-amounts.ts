export type MoneyInput = number | string | null | undefined;

export function toMinorUnits(value: MoneyInput, scale = 2): number | null {
  if (value == null) return null;
  const raw = typeof value === "string" ? value.replace(/[, ]+/g, "").trim() : value;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return null;
  const factor = 10 ** scale;
  return Math.round(numeric * factor);
}

export function fromMinorUnits(value: number | null | undefined, scale = 2): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** scale;
  return Math.round(value) / factor;
}

export function normalizeMoney(value: MoneyInput, scale = 2): number | null {
  const minor = toMinorUnits(value, scale);
  return fromMinorUnits(minor, scale);
}

export function convertByRate(
  amount: MoneyInput,
  rate: MoneyInput,
  options?: { scale?: number; mode?: "multiply" | "divide" },
): number | null {
  const scale = options?.scale ?? 2;
  const mode = options?.mode ?? "multiply";
  const normalizedAmount = normalizeMoney(amount, scale);
  const normalizedRate = normalizeMoney(rate, 8);
  if (normalizedAmount == null || normalizedRate == null || normalizedRate <= 0) return null;
  const raw =
    mode === "multiply"
      ? normalizedAmount * normalizedRate
      : normalizedAmount / normalizedRate;
  return normalizeMoney(raw, scale);
}

export function computeMismatch(
  paid: MoneyInput,
  expected: MoneyInput,
  toleranceMinorUnits = 1,
  scale = 2,
): boolean {
  const p = toMinorUnits(paid, scale);
  const e = toMinorUnits(expected, scale);
  if (p == null || e == null) return false;
  return Math.abs(p - e) > toleranceMinorUnits;
}
