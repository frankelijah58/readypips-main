'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreditCard, Wallet, Check, Landmark } from "lucide-react";

interface Plan {
  name: string;
  price: string;
}

interface PaymentProviderModalProps {
  isOpen: boolean;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  onClose: () => void;
  plan: Plan | null;
  onSelect: (provider: "whop" | "binance" | "pesapal") => void;
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

  const handleSelect = (provider: "whop" | "binance" | "pesapal") => {
    onSelect(provider);
    if (setLoading) setLoading(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-xl text-center text-gray-900 dark:text-gray-100">
            Select Payment Method
          </DialogTitle>

          <DialogDescription className="text-center pt-2">
            You are subscribing to the{" "}
            <span className="font-bold text-green-600">{plan.name}</span> plan
            for <span className="font-semibold">{plan.price}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Whop */}
          <button
            type="button"
            onClick={() => handleSelect("whop")}
            disabled={loading}
            className="group relative flex items-center justify-between p-4 border rounded-xl hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Whop                 </p>
                <p className="text-xs text-gray-500">
                  Secure checkout via Whop(Card / Apple Pay)
                </p>
              </div>
            </div>

            <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-orange-500 transition-colors" />
          </button>

          {/* Binance */}
          <button
            type="button"
            onClick={() => handleSelect("binance")}
            disabled={loading}
            className="group relative flex items-center justify-between p-4 border rounded-xl hover:border-yellow-500 hover:bg-yellow-50/50 dark:hover:bg-yellow-950/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-yellow-600" />
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Binance
                </p>
                <p className="text-xs text-gray-500">
                  Instant USDT & Crypto payment(Crypto / Binance Pay)
                </p>
              </div>
            </div>

            <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-yellow-500 transition-colors" />
          </button>

          {/* Pesapal */}
          <button
            type="button"
            onClick={() => handleSelect("pesapal")}
            disabled={loading}
            className="group relative flex items-center justify-between p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6 text-blue-600" />
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Pesapal
                </p>
                <p className="text-xs text-gray-500">
                  Pay via Pesapal secure gateway
                </p>
              </div>
            </div>

            <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
          <Check className="w-3 h-3" />
          Secure & Encrypted Transaction
        </div>
      </DialogContent>
    </Dialog>
  );
}