"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Copy, CheckCircle2, Loader2, Wallet, ShieldAlert } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  priceKES: number;
  priceUSD?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  user: {
    id?: string;
    name?: string;
    email?: string;
  };
};

export default function BinanceManualModal({ isOpen, onClose, plan, user }: Props) {
  const [transactionId, setTransactionId] = useState("");
  const [senderWallet, setSenderWallet] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const depositAddress = "TXpwFoc64Z8z7ZFBxEX95DATUeteZ4tk9n";
  const network = "TRC20";
  const qrImage = "/images/payments/binance-usdt-qr.jpg"; // put your QR image here
  const usdAmount =
    typeof plan.priceUSD === "number"
      ? plan.priceUSD.toFixed(2)
      : (plan.priceKES / 130).toFixed(2); // fallback conversion

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied successfully");
    } catch {
      alert("Failed to copy");
    }
  };

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      alert("Please enter transaction ID");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/payments/binance/manual-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "binance_manual",
          planId: plan.id,
          planName: plan.name,
          amountKES: plan.priceKES,
          amountUSD: Number(usdAmount),
          network,
          depositAddress,
          transactionId: transactionId.trim(),
          senderWallet: senderWallet.trim(),
          note: note.trim(),
          userId: user?.id || null,
          userName: user?.name || "Guest User",
          userEmail: user?.email || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit payment");
      }

      setSubmitted(true);
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-yellow-500/20 bg-white p-6 shadow-2xl dark:bg-slate-950 dark:border-yellow-700/30 max-h-[95vh] overflow-y-auto">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Binance Manual Payment
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pay using USDT on Tron (TRC20), then submit your transaction ID for admin approval.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/30">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Payment Submitted
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Your Binance payment has been submitted successfully and is now
              <span className="font-semibold text-yellow-600"> waiting for admin approval</span>.
            </p>

            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black hover:bg-yellow-400"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-4 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Payment Details</h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-500">Plan</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{plan.name}</p>
                  </div>

                  <div>
                    <p className="text-slate-500">Amount to Send</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {usdAmount} USDT
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Network</p>
                    <div className="mt-1 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-900">
                      <span className="font-semibold text-slate-900 dark:text-white">{network}</span>
                      <button
                        onClick={() => copyText(network)}
                        className="text-xs font-medium text-yellow-600 hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-500">Deposit Address</p>
                    <div className="mt-1 rounded-xl bg-slate-100 p-3 dark:bg-slate-900">
                      <p className="break-all font-semibold text-slate-900 dark:text-white">
                        {depositAddress}
                      </p>
                      <button
                        onClick={() => copyText(depositAddress)}
                        className="mt-2 text-xs font-medium text-yellow-600 hover:underline"
                      >
                        Copy Address
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Send only <strong>USDT via TRC20</strong>. Sending through the wrong network may result in permanent loss.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Scan QR</h3>

                <div className="flex justify-center rounded-2xl bg-white p-4">
                  <Image
                    src={qrImage}
                    alt="Binance USDT QR"
                    width={260}
                    height={260}
                    className="rounded-xl object-contain"
                  />
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-white">How to pay</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                    <li>Open Binance</li>
                    <li>Select Withdraw / Send Crypto</li>
                    <li>Choose USDT</li>
                    <li>Select network: TRC20</li>
                    <li>Paste the wallet address or scan the QR code</li>
                    <li>Send exactly {usdAmount} USDT</li>
                    <li>After payment, paste the transaction ID below</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">
                Submit Payment Proof
              </h3>

              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Transaction ID / Hash *
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter Binance transaction ID / blockchain hash"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Sender Wallet Address
                  </label>
                  <input
                    type="text"
                    value={senderWallet}
                    onChange={(e) => setSenderWallet(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Note
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note"
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-black hover:bg-yellow-400 disabled:opacity-70"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit for Approval"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}