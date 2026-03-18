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
import { CheckCircle, ArrowRight } from "lucide-react";
import { PLANS } from "@/lib/plans";
import PaymentProviderModal from "@/components/PaymentProviderModal";
import MpesaPromptModal from "@/components/MpesaPromptModal";
import { useState } from "react";

interface PricingPlansProps {
  showGetStarted?: boolean;
  onPlanSelect?: (plan: {
    planId: string;
    name: string;
    price: string;
    duration: number;
    provider?: "whop" | "binance" | "mpesa";
    phone?: string;
  }) => Promise<void> | void;
  className?: string;
  loading?: boolean;
  currentPlan?: string | null;
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
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);
  const [loadingState, setLoadingState] = useState(false);

  const USD_TO_KES = 130;

  const convertToKes = (price: string | number) => {
    const amount =
      typeof price === "number"
        ? price
        : Number(String(price).replace(/[^0-9.]/g, ""));

    return Math.round(amount * USD_TO_KES);
  };

 
  const handlePlanAction = (plan: any) => {
    try {
      if (!onPlanSelect) return;
  
      const safePlan = {
        ...plan,
        id: plan.planId || plan.id || plan.name?.toLowerCase().replace(/\s+/g, ""),
        kesPrice: convertToKes(plan.price || 0),
      };
  
      setSelectedPlanForPayment(safePlan);
      setIsMpesaPromptOpen(false);
      setIsModalOpen(true);
    } catch (error) {
      console.error("handlePlanAction error:", error);
    }
  };

  const handleProviderSelect = async (provider: "whop" | "binance" | "mpesa") => {
    if (!onPlanSelect || !selectedPlanForPayment) return;

    if (provider === "mpesa") {
      setIsModalOpen(false);
      setIsMpesaPromptOpen(true);
      return;
    }

    try {
      setLoadingState(true);

      await onPlanSelect({
        ...selectedPlanForPayment,
        provider,
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error("Provider selection error:", error);
      alert("Failed to continue with payment. Please try again.");
    } finally {
      setLoadingState(false);
    }
  };

  const handleMpesaSubmit = async (phone: string) => {
    if (!onPlanSelect || !selectedPlanForPayment) {
      throw new Error("No plan selected.");
    }

    try {
      setLoadingState(true);

      await onPlanSelect({
        ...selectedPlanForPayment,
        provider: "mpesa",
        phone,
      });

      setIsMpesaPromptOpen(false);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("M-Pesa submit error:", error);
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
                    {(plan as any).benefits?.map((benefit: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1 text-green-600">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
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
                  disabled={loading || currentPlan === "active"}
                >
                  {loading
                    ? "Processing..."
                    : currentPlan === "active"
                    ? "Active Subscription"
                    : "Get Access Now"}
                  {!loading && currentPlan !== "active" && (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
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
    </>
  );
}