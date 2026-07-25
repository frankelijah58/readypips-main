'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Wallet,
  Check,
  Smartphone,
  Loader2,
  X,
  Copy,
} from "lucide-react";

interface Plan {
  id?: string;
  planId?: string;
  name: string;
  price: string | number;
  kesPrice?: number;
  duration?: number;
  usdPrice?: number;
}

type PaymentProvider = "whop" | "binance" | "mpesa" | "paystack";

interface PaymentProviderModalProps {
  isOpen: boolean;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  onClose: () => void;
  plan: Plan | null;
  onSelect: (provider: PaymentProvider) => void | Promise<void>;
}

export default function PaymentProviderModal({
  isOpen,
  loading = false,
  setLoading,
  onClose,
  plan,
  onSelect,
}: PaymentProviderModalProps) {
  const { data: session } = useSession();

  const [showBinanceManual, setShowBinanceManual] = useState(false);
  const [txId, setTxId] = useState("");
  const [senderWallet, setSenderWallet] = useState("");
  const [note, setNote] = useState("");
  const [binanceSubmitting, setBinanceSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const showPaystack = false;
  if (!plan) return null;

  const amount =
    typeof plan.kesPrice === "number"
      ? plan.kesPrice
      : typeof plan.price === "number"
        ? plan.price
        : Number(String(plan.price || 0).replace(/[^0-9.]/g, ""));
  const displayAmount = Number.isFinite(amount) ? amount : 0;
  const usdAmount = plan.usdPrice
    ? Number(plan.usdPrice)
    : typeof plan.price === "number"
      ? Number(plan.price)
      : Number(String(plan.price || 0).replace(/[^0-9.]/g, ""));

  const depositAddress = "TXpwFoc64Z8z7ZFBxEX95DATUeteZ4tk9n";
  const network = "TRC20";

  const handleSelect = async (provider: PaymentProvider) => {
    if (loading) return;

    if (provider === "binance") {
      setShowBinanceManual(true);
      return;
    }

    try {
      setLoading?.(true);
      await onSelect(provider);
    } catch (error) {
      console.error("Payment provider select error:", error);
    } finally {
      setLoading?.(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      onClose();
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied successfully");
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Failed to copy");
    }
  };

  const submitBinancePayment = async () => {
    if (!txId.trim()) {
      alert("Please enter the transaction ID / hash.");
      return;
    }

    try {
      setBinanceSubmitting(true);

      const token =
        localStorage.getItem("token");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/payments/binance/manual-submit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          token,
          userId: session?.user.id || null,
          email: session?.user?.email || "",
          planId: plan.planId || plan.id,
          amount: usdAmount,
          transactionId: txId.trim(),
          senderWallet: senderWallet.trim(),
          network,
          depositAddress,
          note: note.trim(),
        }),
      });

      const data = await response.json();
      console.log("BINANCE SUBMIT RESPONSE FROM PAYMENT PROVIDER MODAL:", data);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit Binance payment.");
      }

      setSubmitted(true);
      setTxId("");
      setSenderWallet("");
      setNote("");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong while submitting payment.");
    } finally {
      setBinanceSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[400px] bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-gray-900 dark:text-gray-100">
              Select Payment Method
            </DialogTitle>

            <DialogDescription className="pt-2 text-center">
              You are subscribing to the{" "}
              <span className="font-bold text-green-600">{plan.name}</span> plan
              for{" "}
              <span className="font-semibold">
                {plan.kesPrice
                  ? `KES ${displayAmount.toLocaleString()}`
                  : String(plan.price)}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <button
              type="button"
              onClick={() => handleSelect("mpesa")}
              disabled={loading}
              className="group relative flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-green-500 hover:bg-green-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-green-950/10"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-100 p-2 transition-transform group-hover:scale-110 dark:bg-green-900/30">
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    M-Pesa (STK Push)
                  </p>
                  <p className="text-xs text-gray-500">
                    Pay directly with Safaricom M-Pesa
                  </p>
                </div>
              </div>

              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-gray-300 transition-colors group-hover:bg-green-500" />
              )}
            </button>
            {showPaystack && (

              <button
                type="button"
                onClick={() => handleSelect("paystack")}
                disabled={loading}
                className="group relative flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-blue-950/10"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-2 transition-transform group-hover:scale-110 dark:bg-blue-900/30">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Paystack
                    </p>
                    <p className="text-xs text-gray-500">
                      Secure card and bank checkout via Paystack
                    </p>
                  </div>
                </div>

                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-gray-300 transition-colors group-hover:bg-blue-500" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelect("whop")}
              disabled={loading}
              className="group relative flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-orange-500 hover:bg-orange-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-orange-950/10"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-orange-100 p-2 transition-transform group-hover:scale-110 dark:bg-orange-900/30">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Card Payment
                  </p>
                  <p className="text-xs text-gray-500">
                    Secure checkout via Whop (Card / Apple Pay)
                  </p>
                </div>
              </div>

              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-gray-300 transition-colors group-hover:bg-orange-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("binance")}
              disabled={loading}
              className="group relative flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-yellow-500 hover:bg-yellow-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-yellow-950/10"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-yellow-100 p-2 transition-transform group-hover:scale-110 dark:bg-yellow-900/30">
                  <Wallet className="h-6 w-6 text-yellow-600" />
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Binance
                  </p>
                  <p className="text-xs text-gray-500">
                    Manual crypto payment via USDT (TRC20)
                  </p>
                </div>
              </div>

              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-gray-300 transition-colors group-hover:bg-yellow-500" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-gray-400">
            <Check className="h-3 w-3" />
            Secure & Encrypted Transaction
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBinanceManual} onOpenChange={setShowBinanceManual}>
        <DialogContent className="w-[95vw] max-w-[480px] max-h-[90vh] overflow-hidden p-0 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="shrink-0 border-b px-4 py-3 dark:border-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle className="text-base font-semibold">
                    Readypips Binance Payment
                  </DialogTitle>
                  <DialogDescription className="pt-1 text-xs leading-5">
                    Send USDT via TRC20, then submit the transaction ID for admin approval.
                  </DialogDescription>
                </div>


              </div>
            </DialogHeader>

            {submitted ? (
              <div className="overflow-y-auto px-4 py-5">
                <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center dark:border-green-900 dark:bg-green-950/20">
                  <p className="text-base font-semibold text-green-700 dark:text-green-400">
                    Payment submitted successfully
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Your payment is now marked as{" "}
                    <b>submitted waiting for admin approval</b>.
                  </p>
                  <button
                    className="mt-4 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
                    onClick={() => {
                      setSubmitted(false);
                      setShowBinanceManual(false);
                      onClose();
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  <div className="rounded-xl border p-3 dark:border-gray-700">
                    <p className="text-xs text-gray-500">Plan</p>
                    <p className="text-sm font-semibold">{plan.name}</p>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-semibold">{usdAmount} USDT</p>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Network</p>
                      <div className="mt-1 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
                        <span className="text-sm font-medium">{network}</span>
                        <button
                          type="button"
                          onClick={() => copyText(network)}
                          className="text-[11px] text-yellow-600 hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Deposit Address</p>
                      <div className="mt-1 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                        <p className="break-all text-xs font-medium">
                          {depositAddress}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyText(depositAddress)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-yellow-600 hover:underline"
                        >
                          <Copy className="h-3 w-3" />
                          Copy address
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-3 dark:border-gray-700">
                    <p className="mb-2 text-sm font-semibold">How to pay</p>
                    <ol className="list-decimal space-y-1 pl-4 text-xs text-gray-600 dark:text-gray-300">
                      <li>Open Binance app</li>
                      <li>Choose USDT</li>
                      <li>Select Send or Withdraw</li>
                      <li>Choose network: TRC20</li>
                      <li>Paste wallet address or scan QR</li>
                      <li>Send exactly {usdAmount} USDT</li>
                      <li>Copy transaction hash</li>
                      <li>Paste it below and submit</li>
                    </ol>

                    <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 p-2 text-[11px] text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                      Only send <b>USDT on TRC20</b>.
                    </div>

                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium">Scan our QR Code</p>
                      <img
                        src="/binance-usdt-qr.jpeg"
                        alt="Binance USDT QR"
                        className="mx-auto h-66 w-66 rounded-lg border object-contain bg-white p-2"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border p-3 dark:border-gray-700">
                    <p className="mb-3 text-sm font-semibold">
                      Submit Payment Proof
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Transaction ID / Hash(TxID){" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="text"
                          value={txId}
                          onChange={(e) => setTxId(e.target.value)}
                          placeholder="Enter blockchain transaction hash"
                          className="w-full rounded-lg border px-3 py-3 text-base font-mono tracking-wide outline-none focus:border-yellow-500 dark:border-gray-700 dark:bg-gray-800 break-all"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Your(Sender) Wallet Address
                        </label>
                        <input
                          type="text"
                          value={senderWallet}
                          onChange={(e) => setSenderWallet(e.target.value)}
                          placeholder="Optional"
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-yellow-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Note
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Optional note"
                          rows={2}
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-yellow-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBinanceManual(false)}
                        className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={submitBinancePayment}
                        disabled={binanceSubmitting}
                        className="flex-1 rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
                      >
                        {binanceSubmitting ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </span>
                        ) : (
                          "Submit"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}