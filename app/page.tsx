"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Zap,
  ArrowRight,
  Home,
  BarChart3,
  CheckCircle,
  Shield,
  Globe,
  Smartphone,
  Target,
  PlayCircle,
} from "lucide-react";
import PricingPlans from "@/components/pricing-plans";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const showcaseSectionRef = useRef<HTMLElement | null>(null);
  const showcaseVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isShowcaseVisible, setIsShowcaseVisible] = useState(false);

  useEffect(() => {
    document.title =
      "Ready Pips | Forex Trading, TradingView Analysis, MT5 Strategy & Crypto Insights";

    const setMeta = (
      name: string,
      content: string,
      attr: "name" | "property" = "name"
    ) => {
      let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const setLink = (rel: string, href: string) => {
      let tag = document.head.querySelector(`link[rel="${rel}"]`);
      if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute("href", href);
    };

    setMeta(
      "description",
      "Ready Pips helps traders learn forex, analyze TradingView charts, improve MT5 execution, understand trading indicators, and trade forex and crypto with structured market insights and risk management."
    );

    setMeta(
      "keywords",
      "Ready Pips, BabyPips, TradingView, MT5, MetaTrader 5, trading indicator, best strategy, Swift Algo, LuxAlgo, traders, learn trading, learn forex, forex trading, crypto trading, forex signals, trading signals"
    );

    setMeta("robots", "index, follow");
    setMeta(
      "og:title",
      "Ready Pips | Forex Trading, TradingView Analysis, MT5 Strategy & Crypto Insights",
      "property"
    );
    setMeta(
      "og:description",
      "Smart forex and crypto trading insights with TradingView analysis, MT5 support, trading indicators, and structured strategy guidance.",
      "property"
    );
    setMeta("og:type", "website", "property");
    setMeta("og:url", "https://readypips.com", "property");

    setMeta(
      "twitter:title",
      "Ready Pips | Forex Trading, TradingView Analysis, MT5 Strategy & Crypto Insights"
    );
    setMeta(
      "twitter:description",
      "Smart forex and crypto trading insights with TradingView analysis, MT5 support, trading indicators, and structured strategy guidance."
    );
    setMeta("twitter:card", "summary_large_image");

    setLink("canonical", "https://readypips.com");
  }, []);

  useEffect(() => {
    if (!showcaseSectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsShowcaseVisible(entry.isIntersecting);
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(showcaseSectionRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showcaseVideoRef.current) return;

    if (isShowcaseVisible) {
      showcaseVideoRef.current.play().catch(() => {});
    } else {
      showcaseVideoRef.current.pause();
    }
  }, [isShowcaseVisible]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://readypips.com/#organization",
        name: "Ready Pips",
        url: "https://readypips.com",
        logo: "https://readypips.com/logo-dark.png",
        description:
          "Ready Pips is a smart trading platform that helps traders analyze forex and crypto markets using structured strategy, TradingView-aligned market analysis, trading indicators, and risk management.",
      },
      {
        "@type": "WebSite",
        "@id": "https://readypips.com/#website",
        url: "https://readypips.com",
        name: "Ready Pips",
        description:
          "Forex trading, crypto trading, TradingView analysis, MT5 strategy support, trader education, and trading indicators.",
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://readypips.com/#app",
        name: "Ready Pips",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: "https://readypips.com",
        description:
          "Ready Pips helps traders learn forex trading, analyze TradingView charts, support MT5 strategies, use trading indicators, and improve forex and crypto decision-making.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Forex trading analysis",
          "Crypto trading insights",
          "TradingView chart support",
          "MT5 strategy support",
          "Trading indicators",
          "Risk management structure",
          "Trader education",
          "Signal-based market analysis",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is Ready Pips?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ready Pips is a trading platform that helps traders analyze forex and crypto markets using TradingView-aligned analysis, structured signal workflows, and risk management support.",
            },
          },
          {
            "@type": "Question",
            name: "Can Ready Pips help traders using TradingView and MT5?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Ready Pips is designed for traders who use TradingView for analysis and MT5 for execution and strategy workflows.",
            },
          },
          {
            "@type": "Question",
            name: "Does Ready Pips help people learn forex trading?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ready Pips helps traders learn forex with clearer market analysis, indicator support, and structured risk management.",
            },
          },
        ],
      },
    ],
  };

  const convertToKes = (price: string | number) => {
    if (typeof price === "number" && Number.isFinite(price) && price > 100) {
      return Math.round(price);
    }
    const amount =
      typeof price === "number"
        ? price
        : Number(String(price).replace(/[^0-9.]/g, ""));
    return Math.round(amount);
  };

  const handlePlanSelect = async (plan: {
    planId: string;
    name: string;
    price: string;
    duration: number;
    provider?: "whop" | "binance" | "mpesa";
    phone?: string;
  }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("You need to login first.");
      }

      if (plan.provider === "mpesa") {
        const amountKES =
          typeof (plan as any).kesPrice === "number"
            ? Number((plan as any).kesPrice)
            : convertToKes(plan.price);

        const res = await fetch("/api/mpesa/stkpush", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phoneNumber: plan.phone,
            amount: amountKES,
            planId: plan.planId,
            userId: user?._id,
            duration: plan.duration,
            planName: plan.name,
          }),
          signal: controller.signal,
        });

        const rawText = await res.text();

        let data: any = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          throw new Error(rawText || "Server returned an invalid response.");
        }

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "M-Pesa payment failed");
        }

        toast({
          title: "M-Pesa Prompt Sent",
          description: `Check ${plan.phone} and enter your M-Pesa PIN to complete payment.`,
          duration: 5000,
        });

        return;
      }

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.planId,
          provider: plan.provider,
          userId: user?._id,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      if (data.checkoutUrl) {
        toast({
          title: "Redirecting to Payment Provider",
          description: `You are being redirected to ${plan.provider} to complete your purchase.`,
          duration: 5000,
        });

        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      console.error(err);

      const message =
        err?.name === "AbortError"
          ? "The request timed out. Please try again."
          : err.message || "Unable to start payment. Please try again.";

      toast({
        title: "Payment Error",
        description: message,
        duration: 5000,
        variant: "destructive",
      });

      throw new Error(message);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handlePricingPlanSelect = async (plan: any) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          planId: plan.planId,
          provider: plan.provider,
          userId: user?._id,
          phone: plan.phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      if (data.checkoutUrl) {
        toast({
          title: "Redirecting to Payment Provider",
          description: `You are being redirected to ${plan.provider} to complete your purchase.`,
          duration: 5000,
        });

        window.location.href = data.checkoutUrl;
      }

      return data;
    } catch (err: any) {
      console.error(err);

      toast({
        title: "Payment Error",
        description: err.message || "Unable to start payment. Please try again.",
        duration: 5000,
        variant: "destructive",
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <video
          autoPlay
        
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/trading.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="absolute inset-0 bg-black/60"></div>

        <div className="container mx-auto text-center relative z-10">
          <Badge
            className="mb-6 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
            variant="outline"
          >
            <Zap className="w-3 h-3 mr-1" />
            Get real-time. Smart trading signals.
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Ready <span className="text-green-400">Pips</span>
          </h1>

          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Historically consistent results.
            <br />
            Join thousands of successful traders using our proprietary algorithm.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!authLoading && (
              <>
                {user ? (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <Home className="mr-2 w-4 h-4" />
                      Indicator
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signals">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <BarChart3 className="mr-2 w-4 h-4" />
                      Indicator
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">93%</div>
              <div className="text-sm text-gray-100 font-medium">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">10K+</div>
              <div className="text-sm text-gray-100 font-medium">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">$2.1M</div>
              <div className="text-sm text-gray-100 font-medium">
                Avg. Monthly Profit
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">24/7</div>
              <div className="text-sm text-gray-100 font-medium">
                Market Coverage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section
        ref={showcaseSectionRef}
        className="py-20 px-4 bg-black relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black"></div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-10">
            <Badge
              className="mb-4 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
              variant="outline"
            >
              <PlayCircle className="w-3 h-3 mr-1" />
              Platform Walkthrough
            </Badge>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              See Ready <span className="text-green-400">Pips</span> In Action
            </h2>

            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Watch how traders use Ready Pips to follow signals, analyze setups,
              and act with more confidence.
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900">
            <div className="aspect-video w-full bg-black">
              <video
                ref={showcaseVideoRef}
                muted
                loop
                playsInline
                preload="metadata"
                controls
                className="w-full h-full object-cover"
                poster="/video-poster.jpg"
              >
                <source src="/ready-pips-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 bg-gray-50 dark:bg-gray-900 relative overflow-hidden"
        style={{
          backgroundImage: "url('/sl_022321_41020_35.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
              Why Choose Ready Pips?
            </h2>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-md">
              Advanced technology meets professional trading expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-black dark:text-white text-lg">
                  AI-Powered Analysis
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Advanced machine learning algorithms analyze market patterns 24/7
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Real-time market scanning
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Multi-timeframe analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Risk management built-in
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-black dark:text-white text-lg">
                  Instant Notifications
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Get signals delivered instantly via multiple channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Push notifications
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Email alerts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    WhatsApp integration
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-black dark:text-white text-lg">
                  Risk Management
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Built-in risk controls to protect your capital
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    TP & SL levels
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Position sizing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Risk-reward ratios
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-black dark:text-white text-lg">
                  Mobile Responsive
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Trade anywhere with our mobile-optimized platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Mobile app support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Responsive design
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Touch-friendly interface
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-black dark:text-white text-lg">
                  Global Markets
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Access to forex, stocks, crypto, and commodities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Forex pairs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Stock markets
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Cryptocurrencies
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-black dark:text-white text-lg">
                  High Accuracy
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Proven track record with consistent results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    93% win rate
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Backtested strategies
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Live performance tracking
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        className="py-20 px-4 relative overflow-hidden"
        style={{
          backgroundImage: "url('/trading2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
              Choose Your Plan
            </h2>
          </div>

          <PricingPlans
            showGetStarted={user ? false : true}
            onPlanSelect={(plan) => handlePricingPlanSelect(plan)}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 px-4 relative overflow-hidden"
        style={{
          backgroundImage: "url('/trading3.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Join thousands of successful traders and start making consistent
            profits today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-600 font-semibold"
              >
                Login to Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white dark:bg-black">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black dark:text-white">
            Forex Trading, TradingView Analysis, MT5 Strategy and Crypto Insights
          </h2>

          <p className="text-lg text-gray-700 dark:text-gray-300 leading-8 mb-8">
            Ready Pips is built for traders who want a smarter way to approach
            forex trading and crypto trading. The platform supports traders using
            TradingView, MT5, trading indicators, and structured risk management
            to make market analysis more practical and disciplined.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="relative h-8">
                  <img
                    src="/logo-dark.png"
                    alt="Ready Pips Logo"
                    className="h-8 w-auto"
                  />
                </div>
              </div>
              <p className="text-gray-400">
                Unlock Powerful AI-Driven Trading Signals Indicator for a competitive edge.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/signals" className="hover:text-white">
                    Signals Tool
                  </Link>
                </li>
                <li>
                  <Link href="/copy-trading" className="hover:text-white">
                    Copy Trading
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/support" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/admin/login" className="hover:text-white">
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Ready Pips. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}