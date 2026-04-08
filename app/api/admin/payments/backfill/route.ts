import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import {
  hasAdminPrivileges,
  resolveAdminRequester,
} from "@/lib/admin-requester";
import {
  buildPaymentIntentBackfillPatch,
  intentNeedsBackfill,
  type PaymentIntentDoc,
} from "@/lib/payment-backfill";
import { ObjectId } from "mongodb";

const SUCCESS_STATUSES = new Set([
  "success",
  "paid",
  "completed",
  "active",
]);

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = token ? verifyToken(token) : null;
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const requester = await resolveAdminRequester(decoded.userId);
    if (!hasAdminPrivileges(requester)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;
    const limit = Math.min(Math.max(Number(body.limit) || 200, 1), 2000);
    const syncSubscriptions = body.syncSubscriptions === true;
    const force = body.force === true;
    const intentIds: string[] | undefined = Array.isArray(body.intentIds)
      ? body.intentIds
      : undefined;

    const db = await getDatabase();

    const filter =
      intentIds && intentIds.length > 0
        ? {
            _id: {
              $in: intentIds
                .filter((id) => ObjectId.isValid(id))
                .map((id) => new ObjectId(id)),
            },
          }
        : {
            $or: [
              { amount_paid_original: { $exists: false } },
              { currency_original: { $exists: false } },
              { amount_converted: { $exists: false } },
              { provider_reference: { $exists: false } },
            ],
          };

    const cursor = db
      .collection("payment_intents")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit);

    const candidates = await cursor.toArray();
    const toProcess = force
      ? candidates
      : candidates.filter((d) => intentNeedsBackfill(d as PaymentIntentDoc));

    const preview: Array<{
      intentId: string;
      reference: string | null;
      provider: string | null;
      notes: string[];
      setKeys: string[];
    }> = [];

    let applied = 0;

    for (const doc of toProcess) {
      const intent = doc as PaymentIntentDoc;
      const { $set, notes } = await buildPaymentIntentBackfillPatch(db, intent);

      const setKeys = Object.keys($set).filter(
        (k) => k !== "backfilledAt" && k !== "backfillVersion",
      );
      if (setKeys.length === 0) continue;

      preview.push({
        intentId: String(intent._id),
        reference: (intent.reference as string) || null,
        provider: (intent.provider as string) || null,
        notes,
        setKeys,
      });

      if (!dryRun) {
        await db.collection("payment_intents").updateOne(
          { _id: intent._id },
          { $set },
        );

        await db.collection("payment_backfill_audit").insertOne({
          intentId: intent._id,
          reference: intent.reference ?? null,
          provider: intent.provider ?? null,
          dryRun: false,
          notes,
          patch: $set,
          adminUserId: decoded.userId,
          createdAt: new Date(),
        });

        applied++;

        if (
          syncSubscriptions &&
          intent.userId &&
          SUCCESS_STATUSES.has(String(intent.status || "").toLowerCase())
        ) {
          const subPatch: Record<string, unknown> = {};
          for (const key of [
            "amount_paid_original",
            "currency_original",
            "exchange_rate_used",
            "amount_converted",
            "amount_converted_kes",
            "amountMismatch",
            "amountUsd",
            "currencyUsd",
            "fxRateKesToUsd",
            "fxSource",
            "fxFetchedAt",
            "amountKes",
            "currencyKes",
            "amount",
            "currency",
          ] as const) {
            if ($set[key] !== undefined) subPatch[key] = $set[key];
          }
          if (Object.keys(subPatch).length > 0) {
            subPatch.updatedAt = new Date();
            await db.collection("subscriptions").updateOne(
              { userId: intent.userId },
              { $set: subPatch },
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      scanned: candidates.length,
      needingBackfill: toProcess.length,
      previewCount: preview.length,
      preview: preview.slice(0, 50),
      applied: dryRun ? 0 : applied,
      syncSubscriptions: dryRun ? false : syncSubscriptions,
      message: dryRun
        ? "Dry run complete (no DB writes). Send dryRun:false to apply; audit is written only on apply."
        : "Backfill applied. See collection payment_backfill_audit.",
    });
  } catch (e: unknown) {
    console.error("payment backfill error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backfill failed" },
      { status: 500 },
    );
  }
}
