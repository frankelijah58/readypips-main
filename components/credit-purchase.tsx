"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  CreditCardIcon,
  Coins,
  Zap,
  Shield,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  features: string[];
}

interface CreditPurchaseProps {
  onPurchaseComplete?: () => void;
  className?: string;
}

const creditPackages: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 100,
    price: 19.99,
    features: [
      "100 trading credits",
      "Basic market analysis",
      "Email support",
      "Valid for 30 days",
    ],
  },
  {
    id: "professional",
    name: "Professional Pack",
    credits: 250,
    price: 39.99,
    originalPrice: 49.99,
    popular: true,
    features: [
      "250 trading credits",
      "Advanced analysis",
      "Priority support",
      "Valid for 60 days",
      "Bonus 25 credits",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 500,
    price: 69.99,
    originalPrice: 89.99,
    features: [
      "500 trading credits",
      "Premium analysis",
      "24/7 support",
      "Valid for 90 days",
      "Bonus 100 credits",
    ],
  },
];

export default function CreditPurchase({
  onPurchaseComplete,
  className = "",
}: CreditPurchaseProps) {
  const [selectedProvider, setSelectedProvider] = useState<
    "stripe" | "paystack" | "pesapal"
  >("pesapal");
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    setSelectedPackage(packageId);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to purchase credits");
        return;
      }

      // Use Pesapal endpoint
      const endpoint = "/api/payments/create-pesapal";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: packageId,
          provider: "pesapal",
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        if (data.hasActiveSubscription) {
          toast.error("You already have an active subscription");
        } else {
          throw new Error(data.error || "No checkout URL received");
        }
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Error creating checkout session. Please try again.");
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Provider Selection */}
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-center text-black dark:text-white">
            Choose Payment Method
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400">
            Secure Kenyan payments with Pesapal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button
                variant="default"
                className="h-16 bg-orange-600 hover:bg-orange-700 text-white px-8"
                onClick={() => setSelectedProvider("pesapal")}
              >
                <div className="flex flex-col items-center">
                  <CreditCard className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Pesapal</span>
                </div>
              </Button>
            </div>
            
            {/* Pesapal Payment Options Image */}
            <div className="mt-4">
              <img 
                src="/pesapal-payment-options.png" 
                alt="Pesapal Payment Options - M-Pesa, Airtel Money, Visa, Mastercard, and more"
                className="mx-auto max-w-sm w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Available payment methods: M-Pesa, Airtel Money, Visa, Mastercard, and more
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPackages.map((pkg, index) => (
          <Card
            key={index}
            className={`relative hover:shadow-lg transition-all duration-200 bg-white dark:bg-black ${
              pkg.popular
                ? "border-2 border-green-600"
                : "border-gray-200 dark:border-gray-800"
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white px-3 py-1">
                  Most Recommended
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-center text-black dark:text-white">
                {pkg.name}
              </CardTitle>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">
                  ${pkg.price}
                  {pkg.originalPrice && (
                    <span className="text-lg text-gray-600 dark:text-gray-400 line-through ml-2">
                      ${pkg.originalPrice}
                    </span>
                  )}
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {pkg.credits} Credits
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {pkg.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  pkg.popular
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                } text-white font-semibold`}
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading && selectedPackage === pkg.id}
              >
                {loading && selectedPackage === pkg.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay with Pesapal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Comparison */}
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-center text-black dark:text-white">
            Why Choose Our Credits?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Coins className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Flexible Usage
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Use credits for any analysis or signal generation
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Instant Access
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Credits are available immediately after purchase
              </p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Secure Payments
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Multiple payment options with bank-level security
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
