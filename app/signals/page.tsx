"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Lock, ShieldCheck, Zap, Globe, MessageCircle, AlertCircle, RefreshCcw, BarChart3, CheckCircle2, Info, LayoutDashboard, LockKeyhole, PlusCircle, Send, Clock, Sparkles, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive");
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"whop" | "binance">("whop");
  const { toast } = useToast();
  
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     router.push("/login");
  //   }
  // }, [authLoading, user, router]);

  // --- 1. Fetch Subscription Data ---
  // useEffect(() => {
  //   const fetchStatus = async () => {
  //     const token = localStorage.getItem("token");
  //     if (!token) return setSubscriptionLoading(false);

  //     try {
  //       const res = await fetch("/api/dashboard", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       const data = await res.json();
  //       setSubscriptionStatus(data.user?.subscriptionStatus || "inactive");
  //       setSubscriptionType(data.user?.subscriptionType || "free");
  //     } catch (err) {
  //       console.error("Failed to fetch status:", err);
  //     } finally {
  //       setSubscriptionLoading(false);
  //     }
  //   };

  //   if (user) fetchStatus();
  // }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      setSubscriptionLoading(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setSubscriptionStatus(data.user?.subscriptionStatus ?? "inactive");
        setSubscriptionType(data.user?.subscriptionType ?? "free");
      } catch (err) {
        console.error(err);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchStatus();
  }, [user]);


  // --- 2. Centralized Access Logic ---
  // Access is ONLY granted if Active AND NOT Free
  const hasAccess = subscriptionStatus === "active" && subscriptionType !== "free";

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

  // if (authLoading || subscriptionLoading) {
  //   return <div className="h-screen flex items-center justify-center">Authenticating...</div>;
  // }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Authenticating...
      </div>
    );
  }

  if (!authLoading && !user) {
    router.replace("/login");
    return null;
  }

  


  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

     <main className="container mx-auto px-4 py-12 max-w-6xl">
  {/* Glassmorphism Header */}
  <div className="relative mb-10">
    <div className="absolute inset-0 bg-blue-500/5 blur-3xl -z-10 rounded-full" />
    <Card className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${hasAccess ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
              {hasAccess ? <Zap className="h-8 w-8 text-green-600" /> : <Lock className="h-8 w-8 text-gray-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">Membership</span>
                {hasAccess && <Badge className="bg-green-500 text-[10px] h-5">Verified</Badge>}
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {hasAccess ? `${subscriptionType?.toUpperCase()} PRO` : "Trial Version"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             {!hasAccess ? (
                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                   Upgrade Now
                </Button>
             ) : (
                <div className="text-right hidden md:block">
                   <p className="text-xs text-gray-500 font-medium">Status</p>
                   <p className="text-sm font-bold text-green-600">Active & Ready</p>
                </div>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  {!hasAccess ? (
    /* --- ENHANCED PAYWALL VIEW --- */
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic">LEVEL UP YOUR TRADES</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Gain the unfair advantage with institutional-grade signals and private community access.
        </p>
        
        <div className="flex flex-col items-center gap-6 pt-4">
            <div className="flex p-1.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-fit">
              {['whop', 'binance'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvider(p as "whop" | "binance")}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selectedProvider === p 
                    ? "bg-white dark:bg-gray-800 shadow-md scale-105" 
                    : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {p === 'whop' ? 'Card / Apple Pay' : 'Crypto (USDT)'}
                </button>
              ))}
            </div>
        </div>
      </div>
      <PricingPlans showGetStarted={!user} onPlanSelect={handlePlanSelect} />
    </div>
  ) : (
    /* --- INTERACTIVE ONBOARDING VIEW --- */
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Step-by-Step Roadmap */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Quick-Start Roadmap
            </h3>
            <span className="text-xs font-bold text-gray-400">4 STEPS TO GO LIVE</span>
        </div>

        <div className="relative space-y-4">
          {/* Vertical line connector */}
          <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500 to-transparent hidden sm:block" />
          
          {[
            { title: "TradingView Login", desc: "Open your TradingView desktop or web app.", icon: <Globe /> },
            { title: "Open Charts", desc: "Select any pair (e.g., BTCUSD or XAUUSD).", icon: <BarChart3 /> },
            { title: "Indicators Menu", desc: "Click the 'Indicators' button at the top top bar.", icon: <PlusCircle /> },
            { title: "Invite-Only Scripts", desc: "Search for 'Ready pips' and click to activate.", icon: <Star className="fill-yellow-500 text-yellow-500" />, highlight: true },
          ].map((step, idx) => (
            <div key={idx} className={`relative group flex items-start gap-6 p-5 rounded-2xl transition-all border ${step.highlight ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-300'}`}>
              <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${step.highlight ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-blue-500'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg mb-0.5">{step.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
              <div className="hidden sm:block opacity-10 group-hover:opacity-100 transition-opacity">
                 {step.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Sync Alert */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex gap-4 items-center">
            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                <strong>Syncing in progress:</strong> Indicators usually appear instantly, but TradingView can occasionally take up to <strong>12 hours</strong> to update your invite-only list. Try refreshing your browser.
            </p>
        </div>
      </div>

      {/* Side Engagement Column */}
      <div className="lg:col-span-4 space-y-6">
        {/* Telegram Card - High Engagement */}
        <Card className="bg-gradient-to-br from-[#0088cc] to-[#00a2ed] text-white border-none shadow-2xl shadow-blue-500/20 overflow-hidden group">
          <CardContent className="p-8 relative">
            <div className="relative z-10">
                <MessageCircle className="h-12 w-12 mb-4 bg-white/20 p-2 rounded-xl" />
                <h3 className="text-2xl font-black mb-2 leading-tight">Join the Pro<br/>Circle</h3>
                <p className="text-blue-50 text-sm mb-6 opacity-90">Instant mobile alerts for every high-probability trade setup.</p>
                <Button 
                    className="w-full bg-white text-[#0088cc] hover:bg-blue-50 font-black tracking-tight"
                    onClick={() => window.open("https://t.me/readypips_pro_bot", "_blank")}
                >
                    CONNECT TELEGRAM
                </Button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Send className="h-40 w-40" />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info Card */}
        <Card className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Subscription Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800">
                <span className="text-xs text-gray-500">Auto-Renew</span>
                <span className="text-xs font-bold">Enabled</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800">
                <span className="text-xs text-gray-500">Website</span>
                <span className="text-xs font-bold text-blue-500 underline">readypips.com</span>
            </div>
            <Button variant="ghost" className="w-full text-xs font-bold text-gray-400 hover:text-red-500">
                Manage Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )}
</main>

      <Footer />
    </div>
  );
}