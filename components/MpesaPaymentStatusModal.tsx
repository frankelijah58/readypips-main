"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, Smartphone } from "lucide-react";

interface MpesaPaymentStatusModalProps {
  isOpen: boolean;
  status: "idle" | "waiting" | "success" | "failed";
  message?: string;
  amount?: number;
  planName?: string;
  phone?: string;
  onClose: () => void;
}

export default function MpesaPaymentStatusModal({
  isOpen,
  status,
  message,
  amount,
  planName,
  phone,
  onClose,
}: MpesaPaymentStatusModalProps) {
  const canClose = status === "success" || status === "failed";

  const handleOpenChange = (open: boolean) => {
    if (!open && canClose) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] border bg-white text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl font-bold">
            {status === "waiting" && <Loader2 className="h-5 w-5 animate-spin text-green-600" />}
            {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {status === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
            {status === "waiting" && "Waiting for Payment"}
            {status === "success" && "Payment Successful"}
            {status === "failed" && "Payment Failed"}
          </DialogTitle>

          <DialogDescription className="pt-2 text-center text-sm leading-6 text-gray-600 dark:text-gray-300">
            {status === "waiting" && (
              <>
                We sent an M-Pesa prompt to{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{phone || "your phone"}</span>.
                <br />
                Complete the payment to activate{" "}
                <span className="font-semibold text-green-600">{planName || "your plan"}</span>
                {typeof amount === "number" ? (
                  <>
                    {" "}for <span className="font-semibold text-gray-900 dark:text-white">
                      KES {amount.toLocaleString()}
                    </span>
                  </>
                ) : null}
                .
              </>
            )}

            {status === "success" && (
              <>
                Your payment for{" "}
                <span className="font-semibold text-green-600">{planName || "your plan"}</span>{" "}
                has been received successfully.
              </>
            )}

            {status === "failed" && (
              <>
                {message || "We could not confirm your payment. Please try again or check your M-Pesa transaction."}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          {status === "waiting" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Prompt sent</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Waiting for Safaricom confirmation...
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div className="h-2 w-1/2 animate-pulse rounded-full bg-green-600" />
              </div>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Do not close this window before payment confirmation.
              </p>
            </div>
          )}

          {status === "success" && (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-green-600 py-3 font-medium text-white transition hover:bg-green-700"
            >
              Continue
            </button>
          )}

          {status === "failed" && (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700"
            >
              Close
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}