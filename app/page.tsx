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
  Users,
  Globe,
  Smartphone,
  Clock,
  Target,
} from "lucide-react";
import PricingPlans from "@/components/pricing-plans";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePricingPlanSelect = async (plan: any) => {
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

  // const handlePricingPlanSelect = async (plan: {
  //   planId: string;
  //   name: string;
  //   price: string;
  //   duration: number;
  //   provider?: "whop" | "binance";
  // }) => {
  //   try {
  //     setLoading(true);

  //     const res = await fetch("/api/payments/create", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         planId: plan.planId,
  //         provider: plan.provider,
  //         userId: user?._id,
  //       }),
  //     });

  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.error || "Payment failed");

  //     // Redirect to provider checkout
  //     window.location.href = data.checkoutUrl;
  //   } catch (err) {
  //     console.error(err);
  //     alert("Unable to start payment. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/trading.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="container mx-auto text-center relative z-10">
          <Badge
            className="mb-6 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
            variant="outline"
          >
            <Zap className="w-3 h-3 mr-1" />
            Precise powered Trading Signal
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Ready <span className="text-green-400">Pips</span>
          </h1>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Get real-time. Smart trading signals. Proven accuracy up to 93%.{" "}
            <br />
            Join thousands of successful traders using our proprietary algorithm.
          </p>

          {/* Conditional CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!authLoading && (
              <>
                {user ? (
                  // Logged in user - show dashboard button
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <Home className="mr-2 w-4 h-4" />
                      Go to Dashboard
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  // Not logged in - show signals button
                  <Link href="/signals">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <BarChart3 className="mr-2 w-4 h-4" />
                      Signals
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </>
            )}
            <Link href="/copy-trading">
              <Button
                size="lg"
                variant="outline"
                className="border-green-400 text-green-400 hover:bg-green-600 hover:text-white font-semibold"
              >
                Copy Trading
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">93%</div>
              <div className="text-sm text-gray-100 font-medium">
                Win Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">50K+</div>
              <div className="text-sm text-gray-100 font-medium">
                Active Users
              </div>
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

      {/* Features Section - with sl_022321_41020_35.jpg background */}
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
        {/* Dark overlay for readability */}
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
                  Advanced machine learning algorithms analyze market patterns
                  24/7
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
                    Stop-loss levels
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

      {/* Pricing Section - with trading2.jpg background */}
      <section
        className="py-20 px-4 relative overflow-hidden"
        style={{
          backgroundImage: "url('/trading2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-100 drop-shadow-md">
              Start with a free trial, upgrade anytime
            </p>
          </div>

          <PricingPlans showGetStarted={user ? false : true} onPlanSelect={(plan) => handlePricingPlanSelect(plan)} />
        </div>
      </section>

      {/* CTA Section - with trading3.jpg background */}
      <section
        className="py-20 px-4 relative overflow-hidden"
        style={{
          backgroundImage: "url('/trading3.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Dark overlay for readability */}
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
                Start Free Trial
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
                Unlock Powerful AI-Driven Trading Signals for a Competitive Edge
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
                <li>
                  <Link href="/charts" className="hover:text-white">
                    Charts
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
            <p>&copy; 2025 Ready Pips. All rights reserved.</p>
            <p className="mt-2">
              Developed and maintained by{" "}
              <a
                href="https://"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 font-semibold transition-colors"
              >
                Pro Limited
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
