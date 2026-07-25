"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Shield,
  TrendingUp,
  Users,
  ArrowRight,
  Info,
  Lock,
  Activity,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { useRequireSubscription } from "@/hooks/use-subscription-access";
import { useRouter } from "next/navigation";

// Define your broker configurations here
const brokers = [
  {
    id: "hfm",
    name: "HFM (HotForex)",
    logo: "/hfm-icon.png",
    description: "Award-winning broker with HFcopy social trading service - Our Primary Copy Trading Platform",
    features: [
      "HFcopy platform",
      "Over 1000+ strategy providers",
      "Performance fee only",
      "Risk management tools",
      "Professional copy trading service",
    ],
    minDeposit: "$100",
    leverage: "Up to 1:1000",
    copyTradingLink: "https://my.hfm.com/en/copy-trading/provider-details?provider=147026543",
    signupLink: "https://www.hfm.com/ke/en/?refid=30374049",
    recommended: true,
  },
  {
    id: "justmarkets",
    name: "Just Markets",
    logo: "/justmarkets-logo.webp",
    description: "Fast-growing broker with competitive spreads and copy trading",
    features: [
      "Copy trading platform",
      "Competitive spreads",
      "Fast execution",
      "Multiple account types",
    ],
    minDeposit: "$100",
    leverage: "Up to 1:1000",
    copyTradingLink: "https://justmarkets.com/spa/copytrading/leaderboard/66116",
    signupLink: "https://one.justmarkets.link/a/f2fxc0kmhk",
    recommended: false,
  },
  {
    id: "fxpro",
    name: "FxPro",
    logo: "/fxpro.png",
    description: "Global leader in online trading with Social Trading platform (Copy Coming Soon)",
    features: [
      "Social Trading platform",
      "Instant withdrawals",
      "Tight spreads from 0.0",
      "No commissions on Standard accounts",
    ],
    minDeposit: "$10",
    leverage: "Up to 1:2000",
    copyTradingLink: "https://direct-fxpro.com/en/partner/FKBP99Jk",
    signupLink: "https://www.readypips.com/trade",
    recommended: false,
  },
];

export default function CopyTradingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const subscriptionAccess = useRequireSubscription('/subscription');
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // Show subscription required message if access is denied
  if (subscriptionAccess.loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
/*
  if (!subscriptionAccess.hasAccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-orange-600" />
                </div>
                <CardTitle className="text-3xl text-gray-900 dark:text-white mb-2">
                  Subscription Required
                </CardTitle>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {subscriptionAccess.message}
                </p>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Access Premium Copy Trading
                  </h3>
                  <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300 max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Automatically copy professional traders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Access to verified trading strategies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Partner broker integrations (HFM, Just Markets)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Earn passive income from trading</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/subscription">
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-6 text-lg">
                      View Subscription Plans
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-8 py-6 text-lg">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
*}*/
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="h-1 w-16 bg-green-600 rounded-full mx-auto"></div>
          </div>
          <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Copy Trading
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Automatically copy trades from our professional traders directly to your broker account. 
            Start earning passive income with minimal effort.
          </p>
        </div>
      </section>

      {/* Info Alert */}
      <section className="py-8 px-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 text-blue-600 dark:text-blue-400 mt-1">
                <Info className="w-6 h-6" />
              </div>
              <div>
               <h3 className="font-semibold text-blue-900 text-center dark:text-blue-200 mb-2">How It Works</h3>
                <p className="text-blue-800 dark:text-blue-300 text-center text-sm">
                 
               Copy trading allows you to automatically mirror the strategies of experienced traders.
Instead of trading alone, you can follow proven strategies and learn from real market activity.
Explore the platforms below and see how copy trading works.

                  </p>
                  <i> <center>Always trade responsibly and manage your risk.</center></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-white dark:bg-black">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-3xl font-bold text-green-600 mb-2">127%</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Avg. Annual Return
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-3xl font-bold text-green-600 mb-2">2.5K+</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Copy Traders
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-3xl font-bold text-green-600 mb-2">$5.2M</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Total Copied Volume
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-3xl font-bold text-green-600 mb-2">92%</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Profitable Months
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brokers Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="h-1 w-16 bg-green-600 rounded-full mx-auto"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Choose Your Broker
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              <b>We primarily recommend Just Markets for copy trading. </b> 
              <br></br>Select from our partner brokers below. 
              Don't have an account? Create one using our referral links for exclusive benefits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {brokers.map((broker) => (
              <Card
                key={broker.id}
                className={`bg-white dark:bg-black border shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col ${
                  broker.recommended ? "border-2 border-green-600 relative" : "border-gray-200 dark:border-gray-800"
                }`}
              >
                {broker.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Recommended
                    </div>
                  </div>
                )}
                <CardHeader className="text-center border-b border-gray-200 dark:border-gray-800 pb-6">
                  <div className="h-16 flex items-center justify-center mb-6">
                    <img
                      src={broker.logo}
                      alt={`${broker.name} logo`}
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white mb-3">
                    {broker.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    {broker.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col pt-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Minimum Deposit</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {broker.minDeposit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Maximum Leverage</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {broker.leverage}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Features</p>
                    {broker.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start text-sm text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                      onClick={() => {
                        if (broker.id === "exness") {
                          toast.info("Exness copy trading coming soon! We'll notify you when it's available.", {
                            description: "We're working on getting the Exness affiliate link approved. Stay tuned!"
                          });
                        } else {
                          toast.success(`Opening ${broker.name} copy trading platform...`);
                          window.open(broker.copyTradingLink, "_blank");
                        }
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Start Copy Trading
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold"
                      onClick={() => {
                        if (broker.id === "exness") {
                          toast.info("Exness registration coming soon! We'll notify you when it's available.", {
                            description: "We're working on getting the Exness affiliate link approved. Stay tuned!"
                          });
                        } else {
                          toast.success(`Opening ${broker.name} registration page...`);
                          window.open(broker.signupLink, "_blank");
                        }
                      }}
                    >
                      Create Account
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Start Section */}
      <section className="py-16 px-4 bg-white dark:bg-black">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="h-1 w-16 bg-green-600 rounded-full mx-auto"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              How to Start Copy Trading
            </h2>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <span className="text-lg font-bold text-green-600">1</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Choose Your Broker
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                   Select one of our partner brokers based on 
                  reliability, features, and copy trading capabilities that best suit your needs.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <span className="text-lg font-bold text-green-600">2</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Create an Account
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  If you don't already have an account, click "Create Account" to sign up using our referral link. 
                  This ensures you get direct access to our copy trading service with exclusive benefits.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <span className="text-lg font-bold text-green-600">3</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Connect to Copy Trading
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Click "Start Copy Trading" to connect your broker account to our master trading account. 
                  Follow the broker's instructions to complete the setup process.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <span className="text-lg font-bold text-green-600">4</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Start Earning
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Once connected, your account will automatically copy all trades from our professional traders. 
                  Monitor your progress and adjust settings as needed to optimize your returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <section className="py-8 px-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 text-blue-600 dark:text-blue-400 mt-1">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Affiliate Disclosure</h3>
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  We may receive compensation when you use our referral links to create accounts with our partner brokers. 
                  This helps support our platform and services. Note: Some affiliate links are being updated as we receive approval from brokers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Disclaimer */}
      <section className="py-12 px-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Risk Disclaimer</h3>
                <p className="text-yellow-800 dark:text-yellow-300 text-sm leading-relaxed">
                  Trading involves substantial risk of loss. Past performance does not guarantee future results. 
                  Only trade with money you can afford to lose. Copy trading carries the same risks as manual trading. 
                  Please ensure you understand the risks before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
