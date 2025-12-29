'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Wallet, Check } from "lucide-react";

interface PaymentProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
  onSelect: (provider: "whop" | "binance") => void;
}

export default function PaymentProviderModal({
  isOpen,
  onClose,
  plan,
  onSelect,
}: PaymentProviderModalProps) {
  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-xl text-center text-gray-900 dark:text-gray-100">Select Payment Method</DialogTitle>
          <DialogDescription className="text-center pt-2">
            You are subscribing to the <span className="font-bold text-green-600">{plan.name}</span> plan for {plan.price}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Whop Provider */}
          <button
            onClick={() => onSelect("whop")}
            className="group relative flex items-center justify-between p-4 border rounded-xl hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Card / Apple Pay</p>
                <p className="text-xs text-gray-500">Secure checkout via Whop</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-orange-500" />
          </button>

          {/* Binance Provider */}
          <button
            onClick={() => onSelect("binance")}
            className="group relative flex items-center justify-between p-4 border rounded-xl hover:border-yellow-500 hover:bg-yellow-50/50 dark:hover:bg-yellow-950/10 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Crypto / Binance Pay</p>
                <p className="text-xs text-gray-500">Instant USDT & Crypto payment</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-yellow-500" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
          <Check className="w-3 h-3" /> Secure & Encrypted Transaction
        </div>
      </DialogContent>
    </Dialog>
  );
}