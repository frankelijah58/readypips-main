'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreditCard, Wallet, Check, Smartphone, Loader2 } from "lucide-react";

interface Plan {
  id?: string;
  planId?: string;
  name: string;
  price: string | number;
  kesPrice?: number;
  duration?: number;
}

type PaymentProvider = "whop" | "binance" | "mpesa";

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
  if (!plan) return null;

  const amount =
    typeof plan.kesPrice === "number"
      ? plan.kesPrice
      : typeof plan.price === "number"
      ? plan.price
      : Number(String(plan.price || 0).replace(/[^0-9.]/g, ""));

  const displayAmount = Number.isFinite(amount) ? amount : 0;

  const handleSelect = async (provider: PaymentProvider) => {
    if (loading) return;

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

  return (
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
              {plan.kesPrice ? `KES ${displayAmount.toLocaleString()}` : String(plan.price)}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
                  Whop
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
                  Instant USDT & Crypto payment (Crypto / Binance Pay)
                </p>
              </div>
            </div>

            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-gray-300 transition-colors group-hover:bg-yellow-500" />
            )}
          </button>

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
                  M-Pesa
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
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-gray-400">
          <Check className="h-3 w-3" />
          Secure & Encrypted Transaction
        </div>
      </DialogContent>
    </Dialog>
  );
}