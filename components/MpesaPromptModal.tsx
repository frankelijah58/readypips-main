'use client';

import { useEffect, useMemo, useState } from "react";
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
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhone("");
      setError("");
      setSubmitting(false);
    }
  }, [isOpen, plan?.id, plan?.name]);

  if (!plan) return null;

  const amount = useMemo(() => {
    if (typeof plan.kesPrice === "number") return plan.kesPrice;
    if (typeof plan.price === "number") return plan.price;

    const parsed = Number(String(plan.price).replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [plan.kesPrice, plan.price]);

  const normalizePhone = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, "").trim();

    if (/^07\d{8}$/.test(cleaned)) return `254${cleaned.slice(1)}`;
    if (/^2547\d{8}$/.test(cleaned)) return cleaned;
    if (/^\+2547\d{8}$/.test(cleaned)) return cleaned.slice(1);

    return cleaned;
  };

  const validatePhone = (value: string) => {
    const normalized = normalizePhone(value);

    if (!value.trim()) return "Phone number is required.";
    if (!/^2547\d{8}$/.test(normalized)) {
      return "Enter a valid Safaricom number like 07XXXXXXXX or 2547XXXXXXXX.";
    }

    return "";
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (error) setError(validatePhone(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || submitting) return;

    const validationError = validatePhone(phone);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setSubmitting(true);
      await onSubmit(normalizePhone(phone));
    } catch (err: any) {
      setError(err?.message || "Failed to send M-Pesa prompt.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading && !submitting) {
      onClose();
    }
  };

  const isBusy = loading || submitting;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] border border-green-500/20 bg-white text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl font-bold">
            <Smartphone className="h-5 w-5 text-green-600" />
            Pay with M-Pesa
          </DialogTitle>

          <DialogDescription className="pt-2 text-center text-sm leading-6 text-gray-600 dark:text-gray-300">
            Enter your Safaricom number to pay for{" "}
            <span className="font-semibold text-green-600">{plan.name}</span>{" "}
            at{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              KES {amount.toLocaleString()}
            </span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label htmlFor="mpesa-phone" className="mb-2 block text-sm font-medium">
              M-Pesa Phone Number
            </label>

            <input
              id="mpesa-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="07XXXXXXXX or 2547XXXXXXXX"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={isBusy}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                error
                  ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 dark:bg-red-950/20"
                  : "border-gray-300 bg-white focus:ring-2 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800"
              }`}
            />

            {error ? (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Use the phone number that will receive the M-Pesa prompt.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isBusy || !phone.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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