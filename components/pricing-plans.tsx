"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight } from "lucide-react";
import { PLANS } from "@/lib/plans";
import PaymentProviderModal from "@/components/PaymentProviderModal";
import { useState } from "react";
import { set } from "date-fns";

interface PricingPlansProps {
  showGetStarted?: boolean;
  onPlanSelect?: (plan: {
    planId: string;
    name: string;
    price: string;
    duration: number;
    provider?: "whop" | "binance";
  }) => void;
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

  // --- ADD STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<boolean>(false);

  const handlePlanAction = (plan: any) => {
    if (onPlanSelect) {
      setSelectedPlanForPayment(plan);
      setIsModalOpen(true);
      setLoadingState(true);
    } else {
      // console.log("No onPlanSelect handler provided");
    }
  };

  const handleProviderSelect = (provider: "whop" | "binance") => {
    if (onPlanSelect && selectedPlanForPayment) {
      setLoadingState(true);
      onPlanSelect({ ...selectedPlanForPayment, provider });
      setIsModalOpen(false);
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
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white px-3 py-1">
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

            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Features List */}
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Features:</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {plan.features.slice(0, 6).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Benefits Section */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-sm text-green-800 dark:text-green-300 mb-2">Package Benefits:</h4>
                  <ul className="space-y-1 text-xs text-green-700 dark:text-green-200">
                    {(plan as any).benefits?.map((benefit: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-600 mr-1">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Duration Badge */}
                <div className="flex items-center justify-center mb-2">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                    {(plan as any).duration} days of access
                  </Badge>
                </div>
              </div>

              {showGetStarted ? (
                <Link href="/login">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                loadingState && currentPlan === "active" ? (
                  <Button
                    className="w-full bg-gray-400 text-white font-semibold cursor-not-allowed"
                    disabled
                  >
                    Processing...
                  </Button>
                ) : (
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-600 hover:bg-gray-700"
                  } text-white font-semibold`}
                  onClick={() => {
                      setLoadingState(true);
                      handlePlanAction({
                      planId: plan.name.toLowerCase().replace(" ", ""),
                      name: plan.name,
                      price: plan.price,
                      duration: (plan as any).duration,
                    })
                  }
                }
                  disabled={loading || currentPlan === "active"}
                >
                  {loading
                    ? "Processing..."
                    : currentPlan === "active"
                    ? "Active Subscription"
                    : `Get Access Now`}
                  {!loading && currentPlan !== "active" && (
                    <ArrowRight className="ml-2 w-4 h-4" />
                  )}
                </Button>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <PaymentProviderModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          plan={selectedPlanForPayment}
          onSelect={handleProviderSelect}
        />
    </>
  );
}
