"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Zap,
  Shield,
  Globe,
  CreditCard,
  Coins,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import PricingPlans from "@/components/pricing-plans";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";

// Updated providers based on your new API
type PaymentProvider = "binance" | "whop";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentEndDate, setCurrentEndDate] = useState<string | null>(null);
  const [hasPendingSubscription, setHasPendingSubscription] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("whop");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/subscriptions/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.subscription) {
            // Mapping plan IDs to readable names
            setCurrentPlan(data.subscription.planId); 
            setCurrentEndDate(data.subscription.endDate);
            setHasPendingSubscription(!!data.subscription.pendingSubscription);
          }
        })
        .catch((err) => console.error("Error fetching subscription status:", err));
    }
  }, []);

  const handlePricingPlanSelect = async (plan: any) => {
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          planId: plan.id, // e.g., 'weekly', 'monthly'
          provider: selectedProvider,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Payment failed");

      if (data.checkoutUrl) {
        toast({
          title: 'Redirecting...',
          description: `Opening ${selectedProvider === 'binance' ? 'Binance Pay' : 'Whop Checkout'}`,
        });
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Unable to start payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-none py-1 px-4">
            Premium Trading Intelligence
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Access Ready Pips Pro
          </h1>
          <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose a plan that fits your trading style and start receiving high-accuracy signals today.
          </p>

          {currentPlan && (
            <div className="mt-8 flex justify-center">
              <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 px-6 py-3 rounded-2xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-900 dark:text-emerald-400 font-bold">
                  Active Plan: <span className="uppercase">{currentPlan}</span>
                  {currentEndDate && ` (Expires ${new Date(currentEndDate).toLocaleDateString()})`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Improved Payment Method Selection */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Whop Provider */}
            <button
              onClick={() => setSelectedProvider("whop")}
              className={cn(
                "relative p-6 rounded-2xl border-2 transition-all text-left group",
                selectedProvider === "whop" 
                ? "border-primary bg-white shadow-xl shadow-primary/5" 
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={cn("p-2 rounded-lg", selectedProvider === "whop" ? "bg-primary text-white" : "bg-slate-200")}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Card & Global</h3>
                  <p className="text-xs text-slate-500">Visa, Mastercard, Apple Pay</p>
                </div>
              </div>
              {selectedProvider === "whop" && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />}
            </button>

            {/* Binance Provider */}
            <button
              onClick={() => setSelectedProvider("binance")}
              className={cn(
                "relative p-6 rounded-2xl border-2 transition-all text-left group",
                selectedProvider === "binance" 
                ? "border-amber-400 bg-white shadow-xl shadow-amber-400/5" 
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={cn("p-2 rounded-lg", selectedProvider === "binance" ? "bg-amber-400 text-black" : "bg-slate-200")}>
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Crypto (USDT)</h3>
                  <p className="text-xs text-slate-500">Binance Pay - Zero Fees</p>
                </div>
              </div>
              {selectedProvider === "binance" && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-400" />}
            </button>
          </div>
        </div>

        {/* Pricing Cards Component */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-bold text-slate-900">Preparing Checkout...</p>
              </div>
            </div>
          )}
          <PricingPlans 
            showGetStarted={!user} 
            onPlanSelect={(plan) => handlePricingPlanSelect(plan)} 
          />
        </div>

        {/* Feature Highlights */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureItem 
                icon={<Zap className="w-6 h-6 text-blue-500" />}
                title="Instant Delivery"
                desc="Access your dashboard and signals immediately after payment."
            />
            <FeatureItem 
                icon={<Shield className="w-6 h-6 text-emerald-500" />}
                title="Secure Checkout"
                desc="Payments are handled by verified industry leaders (Whop & Binance)."
            />
            <FeatureItem 
                icon={<Globe className="w-6 h-6 text-purple-500" />}
                title="Global Access"
                desc="Whether you're in Kenya or anywhere else, our payment gateways just work."
            />
        </div>
      </div>
      <Footer />
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
  );
}