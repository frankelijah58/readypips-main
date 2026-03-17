'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Smartphone, Loader2 } from "lucide-react";


interface Plan {
    id?: string;
    name: string;
    price: string | number;
    kesPrice?: number;
  }

interface MpesaPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  loading?: boolean;
  onSubmit: (phone: string) => Promise<void> | void;
}


export default function MpesaPromptModal({
  isOpen,
  onClose,
  plan,
  loading = false,
  onSubmit,
}: MpesaPromptModalProps) {
  const [phone, setPhone] = useState("");

  if (!plan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(phone);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-xl text-center flex items-center justify-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            Pay with M-Pesa
          </DialogTitle>

          <DialogDescription className="text-center pt-2">
          Enter your Safaricom number to pay for{" "}
<span className="font-semibold text-green-600">{plan.name}</span>{" "}
at <span className="font-semibold">KES {(plan.kesPrice ?? 0).toLocaleString()}</span>.
          </DialogDescription>
        </DialogHeader>
 
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="07XXXXXXXX or 2547XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border px-4 py-3 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Use the phone number that will receive the M-Pesa prompt.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending STK Push...
              </>
            ) : (
              "Send M-Pesa Prompt"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}