"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Lock, ShieldCheck, Zap, Globe, MessageCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { useAuth } from "@/components/auth-context";
import PricingPlans from "@/components/pricing-plans";
import { useToast } from "@/hooks/use-toast";

///TRIGGER REFRESH AFTER PAYMENT
export default function SignalsPage() {
  // --- States ---
  const [loading, setLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive");
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"whop" | "binance">("whop");
  const { toast } = useToast();
  
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // --- 1. Fetch Subscription Data ---
  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setSubscriptionLoading(false);

      try {
        const res = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSubscriptionStatus(data.user?.subscriptionStatus || "inactive");
        setSubscriptionType(data.user?.subscriptionType || "free");
      } catch (err) {
        console.error("Failed to fetch status:", err);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    if (user) fetchStatus();
  }, [user]);

  // --- 2. Centralized Access Logic ---
  // Access is ONLY granted if Active AND NOT Free
  const hasAccess = subscriptionStatus === "active" && subscriptionType !== "free";

  // --- 3. Payment Initiation ---
  // const handlePlanSelect = async (plan: any) => {
  //   setLoading(true);
  //   console.log("Selected Plan:", plan);
  //   try {
  //     const response = await fetch("/api/payments/create", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         planId: plan.planId, // e.g., 'plan_weekly'
  //         provider: selectedProvider,
  //         userId: user?._id,
  //       }),
  //     });

  //     const data = await response.json();
  //     if (data.checkoutUrl) {
  //       window.location.href = data.checkoutUrl;
  //     }
  //   } catch (error) {
  //     console.error("Payment initiation failed:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePlanSelect = async (plan: any) => {
    try {
      setLoading(true);
      
      // Get the token from your auth state or cookies
      // Assuming you are using next-auth or a similar token-based system:
      const token = localStorage.getItem('token'); 

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          planId: plan.planId, // 'weekly', 'monthly', or '3months'
          provider: plan.provider,
          userId: user?._id,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Payment failed");

      // Smooth redirect to the checkout page
      if (data.checkoutUrl) {
        // toast.info(`Redirecting to ${plan.provider}...`);
        toast({
            title: 'Redirecting to Payment Provider',
            description: `You are being redirected to ${plan.provider} to complete your purchase.`,
            duration: 5000,
            // variant: 'default',
          });
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      console.error(err);
      // toast.error(err.message || "Unable to start payment.");
      toast({
        title: "Payment Error",
        description: err.message || "Unable to start payment. Please try again.",
        duration: 5000,
        variant: "destructive",

      })
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || subscriptionLoading) {
    return <div className="h-screen flex items-center justify-center">Authenticating...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        {/* Header Status Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Current Plan</p>
                <h2 className="text-2xl font-bold">
                  {hasAccess ? `${subscriptionType?.toUpperCase()} PRO` : "Free Tier (Indicator Locked)"}
                </h2>
              </div>
              <Badge variant={hasAccess ? "default" : "destructive"} className="px-4 py-1">
                {hasAccess ? "Premium Access Active" : "Upgrade Required"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* --- CONDITIONAL RENDERING --- */}

        {!hasAccess ? (
          /* PAYWALL VIEW: Visible if Status is Inactive OR Type is Free */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h1 className="text-4xl font-bold mb-4">Unlock Signals Indicator</h1>
              <p className="text-gray-500 text-lg">
                Your current **{subscriptionType}** account does not include real-time signal access. 
                Choose a plan below to gain entry to our private dashboard and Telegram.
              </p>
            </div>

            {/* Provider Switcher */}
            <div className="flex justify-center mb-8 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg w-fit mx-auto">
              <button 
                onClick={() => setSelectedProvider("whop")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${selectedProvider === "whop" ? "bg-white dark:bg-gray-800 shadow-sm" : "text-gray-500"}`}
              >
                Card / Apple Pay
              </button>
              <button 
                onClick={() => setSelectedProvider("binance")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${selectedProvider === "binance" ? "bg-white dark:bg-gray-800 shadow-sm" : "text-gray-500"}`}
              >
                Crypto (USDT)
              </button>
            </div>

            {/* <PricingPlans 
              onPlanSelect={handlePlanSelect} 
              loading={loading}
              showGetStarted={user ? false : true}
              // provider={selectedProvider} 
            /> */}

              <PricingPlans showGetStarted={user ? false : true} onPlanSelect={(plan) => handlePlanSelect(plan)} />
          </div>
        ) : (
          /* DASHBOARD VIEW: Visible only if Paid & Active */
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Telegram CTA */}
              <Card className="md:col-span-2 bg-blue-600 text-white border-none overflow-hidden relative">
                <CardContent className="p-8 relative z-10">
                  <h3 className="text-2xl font-bold mb-2">Private Telegram Access</h3>
                  <p className="text-blue-100 mb-6 max-w-md">
                    Get instant notifications for every trade setup. Join 2,400+ pro traders.
                  </p>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="font-bold"
                    onClick={() => window.open("https://t.me/readypips_pro_bot", "_blank")}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" /> Connect Telegram Bot
                  </Button>
                </CardContent>
                <Zap className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-blue-500 opacity-20 rotate-12" />
              </Card>

              {/* Account Stats */}
              <Card className="dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardContent className="p-8">
                  <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Member Since</h4>
                  <p className="text-xl font-mono">Dec 2024</p>
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Status</h4>
                    <div className="flex items-center text-green-500 font-bold">
                      <ShieldCheck className="mr-2 h-5 w-5" /> Verified Pro
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Signals Content Placeholder */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Globe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold">Signal Feed Initializing...</h3>
              <p className="text-gray-500">Your pro session is active. Live charts and trade alerts are loading.</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}