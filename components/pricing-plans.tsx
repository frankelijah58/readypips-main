"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Smartphone,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import PaymentProviderModal from "@/components/PaymentProviderModal";
import MpesaPromptModal from "@/components/MpesaPromptModal";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PricingPlansProps {
  showGetStarted?: boolean;
  onPlanSelect?: (plan: {
    planId: string;
    name: string;
    price: string;
    duration: number;
    provider?: "whop" | "binance" | "mpesa" | "paystack";
    phone?: string;
  }) => Promise<any> | void;
  className?: string;
  loading?: boolean;
  currentPlan?: string | null;
}

type PaymentStatus = "idle" | "waiting" | "success" | "failed";

function MpesaPaymentStatusModal({
  isOpen,
  status,
  message,
  amount,
  planName,
  phone,
  onClose,
}: {
  isOpen: boolean;
  status: PaymentStatus;
  message?: string;
  amount?: number;
  planName?: string;
  phone?: string;
  onClose: () => void;
}) {
  const canClose = status === "success" || status === "failed";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && canClose) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[420px] border bg-white text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl font-bold">
            {status === "waiting" && (
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            {status === "failed" && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}

            {status === "waiting" && "Waiting for Payment"}
            {status === "success" && "Payment Successful"}
            {status === "failed" && "Payment Failed"}
          </DialogTitle>

          <DialogDescription className="pt-2 text-center text-sm leading-6 text-gray-600 dark:text-gray-300">
            {status === "waiting" && (
              <>
                We sent an M-Pesa prompt to{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {phone || "your phone"}
                </span>
                .
                <br />
                Complete the payment for{" "}
                <span className="font-semibold text-green-600">
                  {planName || "your plan"}
                </span>
                {typeof amount === "number" ? (
                  <>
                    {" "}
                    at{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
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
                <span className="font-semibold text-green-600">
                  {planName || "your plan"}
                </span>{" "}
                has been confirmed successfully.
              </>
            )}

            {status === "failed" && (
              <>
                {message ||
                  "We could not confirm your payment. Please try again."}
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
                      Waiting for confirmation from the payment system...
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
            <Button
              type="button"
              onClick={onClose}
              className="w-full bg-green-600 text-white hover:bg-green-700"
            >
              Continue
            </Button>
          )}

          {status === "failed" && (
            <Button
              type="button"
              onClick={onClose}
              className="w-full bg-red-600 text-white hover:bg-red-700"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PricingPlans({
  showGetStarted = true,
  onPlanSelect,
  className = "",
  loading = false,
  currentPlan = null,
}: PricingPlansProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMpesaPromptOpen, setIsMpesaPromptOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] =
    useState<any>(null);
  const [loadingState, setLoadingState] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const USD_TO_KES = 130;

  const convertToKes = (price: string | number) => {
    const amount =
      typeof price === "number"
        ? price
        : Number(String(price).replace(/[^0-9.]/g, ""));
    return Math.round(amount * USD_TO_KES);
  };

  const clearPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPolling();
  }, []);

  const handlePlanAction = (plan: any) => {
    try {
      if (!onPlanSelect) return;

      const safePlan = {
        ...plan,
        id:
          plan.planId ||
          plan.id ||
          plan.name?.toLowerCase().replace(/\s+/g, ""),
        kesPrice: convertToKes(plan.price || 0),
      };

      setSelectedPlanForPayment(safePlan);
      setIsMpesaPromptOpen(false);
      setIsModalOpen(true);
    } catch (error) {
      console.error("handlePlanAction error:", error);
    }
  };

  const handleProviderSelect = async (
    provider: "whop" | "binance" | "mpesa" | "paystack"
  ) => {
    if (!onPlanSelect || !selectedPlanForPayment) return;

    if (provider === "mpesa") {
      setIsModalOpen(false);
      setIsMpesaPromptOpen(true);
      return;
    }

    try {
      setLoadingState(true);

      const result = await onPlanSelect({
        ...selectedPlanForPayment,
        provider,
      });

      console.log(`${provider.toUpperCase()} RESULT:`, result);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Provider selection error:", error);
      alert(
        error?.message || "Failed to continue with payment. Please try again."
      );
    } finally {
      setLoadingState(false);
    }
  };

  const pollPaymentStatus = async (
    merchantRequestID: string,
    checkoutRequestID: string
  ) => {
    clearPolling();

    let attempts = 0;
    const maxAttempts = 24;

    pollIntervalRef.current = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch("/api/payments/mpesa/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchantRequestID,
            checkoutRequestID,
          }),
        });

        const data = await res.json();
        console.log("M-PESA STATUS RESPONSE:", data);

        if (!res.ok) {
          if (attempts >= maxAttempts) {
            clearPolling();
            setPaymentStatus("failed");
            setPaymentMessage(
              data?.message || "Could not confirm payment status."
            );
          }
          return;
        }

        const status = data?.status || data?.paymentStatus;
        const paid =
          data?.paid === true || status === "success" || status === "paid";
        const failed =
          status === "failed" ||
          status === "cancelled" ||
          status === "canceled";

        if (paid) {
          clearPolling();
          setPaymentStatus("success");
          setPaymentMessage(data?.message || "Payment received successfully.");
          return;
        }

        if (failed) {
          clearPolling();
          setPaymentStatus("failed");
          setPaymentMessage(
            data?.message || "Payment failed or was cancelled."
          );
          return;
        }

        if (attempts >= maxAttempts) {
          clearPolling();
          setPaymentStatus("failed");
          setPaymentMessage(
            "Payment confirmation timed out. If you already paid, please refresh after a moment."
          );
        }
      } catch (error) {
        console.error("M-PESA STATUS POLL ERROR:", error);

        if (attempts >= maxAttempts) {
          clearPolling();
          setPaymentStatus("failed");
          setPaymentMessage("Could not confirm payment status.");
        }
      }
    }, 5000);
  };

  const handleMpesaSubmit = async (phone: string) => {
    if (!onPlanSelect || !selectedPlanForPayment) {
      throw new Error("No plan selected.");
    }

    try {
      setLoadingState(true);

      const result = await onPlanSelect({
        ...selectedPlanForPayment,
        provider: "mpesa",
        phone,
      });

      console.log("M-PESA RESULT:", result);

      const payload = result?.data?.data || result?.data || result;

      const success =
        result?.success === true ||
        result?.data?.success === true ||
        payload?.success === true ||
        payload?.ResponseCode === "0" ||
        payload?.ResponseCode === 0;

      if (!success) {
        throw new Error(
          result?.message ||
            result?.data?.message ||
            payload?.message ||
            payload?.ResponseDescription ||
            "Failed to send M-Pesa prompt."
        );
      }

      const merchantRequestID =
        result?.MerchantRequestID ||
        result?.merchantRequestID ||
        result?.merchantRequestId ||
        result?.data?.MerchantRequestID ||
        result?.data?.merchantRequestID ||
        result?.data?.merchantRequestId ||
        payload?.MerchantRequestID ||
        payload?.merchantRequestID ||
        payload?.merchantRequestId;

      const checkoutRequestID =
        result?.CheckoutRequestID ||
        result?.checkoutRequestID ||
        result?.checkoutRequestId ||
        result?.data?.CheckoutRequestID ||
        result?.data?.checkoutRequestID ||
        result?.data?.checkoutRequestId ||
        payload?.CheckoutRequestID ||
        payload?.checkoutRequestID ||
        payload?.checkoutRequestId;

      setPaymentPhone(phone);
      setPaymentStatus("waiting");
      setPaymentMessage(
        result?.message ||
          result?.data?.message ||
          payload?.CustomerMessage ||
          "Prompt sent. Waiting for payment confirmation."
      );
      setIsMpesaPromptOpen(false);
      setIsModalOpen(false);
      setIsStatusModalOpen(true);

      if (merchantRequestID && checkoutRequestID) {
        pollPaymentStatus(merchantRequestID, checkoutRequestID);
      } else {
        setPaymentStatus("failed");
        setPaymentMessage(
          "Prompt was sent but tracking IDs were not returned by the server."
        );
      }
    } catch (error: any) {
      console.error("M-Pesa submit error:", error);
      setPaymentStatus("failed");
      setPaymentMessage(error?.message || "Failed to send STK Push.");
      setIsMpesaPromptOpen(false);
      setIsModalOpen(false);
      setIsStatusModalOpen(true);
      throw new Error(error?.message || "Failed to send STK Push.");
    } finally {
      setLoadingState(false);
    }
  };

  const plans = PLANS;

  return (
    <>
      <div className={`grid md:grid-cols-3 gap-8 max-w-6xl mx-auto ${className}`}>
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative hover:shadow-lg transition-all duration-200 bg-white dark:bg-black flex flex-col ${
              plan.popular
                ? "border-2 border-green-600"
                : "border-gray-200 dark:border-gray-800"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                <Badge className="bg-green-600 px-3 py-1 text-white">
                  Most Recommended
                </Badge>
              </div>
            )}

            <CardHeader className="text-center flex-shrink-0">
              <CardTitle className="text-2xl text-black dark:text-white">
                {plan.name}
              </CardTitle>
              <div className="text-4xl font-bold text-green-600">
                {plan.price}
                <span className="text-lg text-gray-600 dark:text-gray-400">
                  {plan.period}
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col space-y-4">
              <div className="flex-1">
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Features:
                </h4>
                <ul className="mb-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {plan.features.slice(0, 6).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mb-4 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
                    Package Benefits:
                  </h4>
                  <ul className="space-y-1 text-xs text-green-700 dark:text-green-200">
                    {(plan as any).benefits?.map(
                      (benefit: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-1 text-green-600">✓</span>
                          <span>{benefit}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="mb-2 flex items-center justify-center">
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  >
                    {(plan as any).duration} days of access
                  </Badge>
                </div>
              </div>

              {showGetStarted ? (
                <Link href="/login">
                  <Button className="w-full bg-green-600 font-semibold text-white hover:bg-green-700">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : loadingState ? (
                <Button
                  className="w-full cursor-not-allowed bg-gray-400 font-semibold text-white"
                  disabled
                >
                  Processing...
                </Button>
              ) : (
                <Button
                  className={`w-full font-semibold text-white ${
                    plan.popular
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                  onClick={() =>
                    handlePlanAction({
                      planId: plan.name.toLowerCase().replace(/\s+/g, ""),
                      name: plan.name,
                      price: plan.price,
                      duration: (plan as any).duration,
                    })
                  }
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Proceed with Payment"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <PaymentProviderModal
        isOpen={isModalOpen}
        loading={loadingState}
        setLoading={setLoadingState}
        onClose={() => {
          if (!loadingState) setIsModalOpen(false);
        }}
        plan={selectedPlanForPayment || null}
        onSelect={handleProviderSelect}
      />

      <MpesaPromptModal
        isOpen={isMpesaPromptOpen}
        onClose={() => {
          if (!loadingState) setIsMpesaPromptOpen(false);
        }}
        plan={
          selectedPlanForPayment
            ? {
                ...selectedPlanForPayment,
                kesPrice: convertToKes(selectedPlanForPayment.price || 0),
              }
            : null
        }
        loading={loadingState}
        onSubmit={handleMpesaSubmit}
      />

      <MpesaPaymentStatusModal
        isOpen={isStatusModalOpen}
        status={paymentStatus}
        message={paymentMessage}
        amount={
          selectedPlanForPayment
            ? convertToKes(selectedPlanForPayment.price || 0)
            : undefined
        }
        planName={selectedPlanForPayment?.name}
        phone={paymentPhone}
        onClose={() => {
          clearPolling();
          setIsStatusModalOpen(false);
          setPaymentStatus("idle");
          setPaymentMessage("");
          setPaymentPhone("");
        }}
      />
    </>
  );
}