import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMoney,
  convertByRate,
  computeMismatch,
} from "@/lib/payment-amounts";

test("normalizes money safely", () => {
  assert.equal(normalizeMoney("29.00"), 29);
  assert.equal(normalizeMoney("2,199"), 2199);
  assert.equal(normalizeMoney(29.005), 29.01);
});

test("converts USD to KES with consistent precision", () => {
  const kes = convertByRate(29, 0.0075, { mode: "divide", scale: 2 });
  assert.equal(kes, 3866.67);
});

test("detects mismatch with currency-aware tolerance", () => {
  assert.equal(computeMismatch(29, 29, 1, 2), false);
  assert.equal(computeMismatch(29.01, 29, 1, 2), false);
  assert.equal(computeMismatch(29.02, 29, 1, 2), true);
  assert.equal(computeMismatch(2199, 2200, 100, 2), false);
  assert.equal(computeMismatch(2198, 2200, 100, 2), true);
});
