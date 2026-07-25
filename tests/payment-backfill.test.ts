import test from "node:test";
import assert from "node:assert/strict";
import { extractMpesaKesFromCallbackPayload } from "@/lib/payment-backfill";

test("extracts M-Pesa Amount from Safaricom callback shape", () => {
  const payload = {
    Body: {
      stkCallback: {
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: 2470 },
            { Name: "MpesaReceiptNumber", Value: "ABC123" },
          ],
        },
      },
    },
  };
  assert.equal(extractMpesaKesFromCallbackPayload(payload), 2470);
});

test("returns null when no callback metadata", () => {
  assert.equal(extractMpesaKesFromCallbackPayload({}), null);
});
