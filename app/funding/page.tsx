"use client";

import { useState } from "react";
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
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import {
  Trophy,
  Medal,
  TrendingUp,
  Users,
  ArrowRight,
  Crown,
  Target,
  Zap,
  CheckCircle,
  DollarSign,
  Star,
  Flame,
  Gift,
  Shield,
} from "lucide-react";

const PRIZES = [
  { rank: 1, amount: 5000, label: "1st Place", color: "text-yellow-400", icon: Crown },
  { rank: 2, amount: 1250, label: "2nd Place", color: "text-gray-300", icon: Medal },
  { rank: 3, amount: 650, label: "3rd Place", color: "text-amber-600", icon: Medal },
  { rank: 4, amount: 300, label: "4th Place", color: "text-blue-400", icon: Star },
  { rank: 5, amount: 150, label: "5th Place", color: "text-blue-400", icon: Star },
  { rank: 6, amount: 75, label: "6th Place", color: "text-blue-400", icon: Star },
];

const TOP_TRADERS = [
  { rank: 1, name: "TraderKing", profit: "+$12,450", trades: 89, winRate: "94%" },
  { rank: 2, name: "ForexMaster", profit: "+$9,800", trades: 72, winRate: "91%" },
  { rank: 3, name: "CryptoPro", profit: "+$7,200", trades: 65, winRate: "89%" },
  { rank: 4, name: "PipHunter", profit: "+$5,600", trades: 54, winRate: "87%" },
  { rank: 5, name: "TradeWizard", profit: "+$4,300", trades: 48, winRate: "85%" },
  { rank: 6, name: "BullRider", profit: "+$3,100", trades: 41, winRate: "83%" },
  { rank: 7, name: "AlgoTrader", profit: "+$2,800", trades: 38, winRate: "82%" },
  { rank: 8, name: "SignalKing", profit: "+$2,100", trades: 33, winRate: "80%" },
  { rank: 9, name: "ScalperPro", profit: "+$1,500", trades: 28, winRate: "78%" },
  { rank: 10, name: "DayTrader", profit: "+$900", trades: 22, winRate: "76%" },
];

const CHALLENGES = [
  {
    name: "Starter Challenge",
    entry: 42.99,
    target: "$500",
    rules: "10% profit target, 5% max drawdown, 30 days",
    popular: false,
  },
  {
    name: "Standard Challenge",
    entry: 99.99,
    target: "$2,000",
    rules: "10% profit target, 5% max drawdown, 60 days",
    popular: true,
  },
  {
    name: "Pro Challenge",
    entry: 249.99,
    target: "$5,000",
    rules: "10% profit target, 5% max drawdown, 90 days",
    popular: false,
  },
  {
    name: "Elite Challenge",
    entry: 499.99,
    target: "$10,000",
    rules: "10% profit target, 5% max drawdown, 120 days",
    popular: false,
  },
];

export default function FundingPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  const handleJoinChallenge = async (challenge: typeof CHALLENGES[0]) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.info("Please login to join a challenge");
        return;
      }

      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: "", // Will be prompted
          amount: challenge.entry,
          planId: `challenge-${challenge.name.toLowerCase().replace(/\s+/g, "-")}`,
          planName: challenge.name,
          duration: 30,
        }),
      });

      const data = await res.json();
      if (data?.success) {
        toast.success("M-Pesa prompt sent! Check your phone.");
      } else {
        toast.error(data?.message || "Payment failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-green-900 via-black to-green-900">
        <div className="absolute inset-0 bg-[url('/trading2.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800" variant="outline">
            <Trophy className="w-3 h-3 mr-1" />
            Funded Trading Challenges
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Get <span className="text-green-400">Funded</span>
          </h1>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Prove your trading skills, win prizes up to $5,000, and get funded.
            Start with as little as <span className="text-green-400 font-bold">$42.99</span>
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="#challenges">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                View Challenges
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="#leaderboard">
              <Button size="lg" variant="outline" className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white font-semibold">
                <Trophy className="mr-2 w-4 h-4" />
                Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 px-4 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">$42.99</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Min. Entry</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">$5,000</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Top Prize</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">$25</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Withdrawal Fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section id="challenges" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              Choose Your <span className="text-green-600 dark:text-green-400">Challenge</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Pick a challenge that matches your skill level. All payments via M-Pesa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {CHALLENGES.map((challenge) => (
              <Card
                key={challenge.name}
                className={`relative bg-white dark:bg-black border-2 transition-all duration-200 hover:shadow-xl ${
                  challenge.popular
                    ? "border-green-500 shadow-lg shadow-green-500/20"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                {challenge.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-black dark:text-white text-lg">{challenge.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                      ${challenge.entry}
                    </span>
                    <span className="text-gray-500 ml-1">entry</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4 text-green-500 mr-2" />
                      Target: {challenge.target}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Shield className="w-4 h-4 text-green-500 mr-2" />
                      {challenge.rules}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-4 h-4 text-green-500 mr-2" />
                      Payout via M-Pesa
                    </div>
                  </div>
                  <Button
                    className={`w-full ${
                      challenge.popular
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-800 hover:bg-gray-700 text-white"
                    }`}
                    onClick={() => handleJoinChallenge(challenge)}
                  >
                    Join Challenge - ${challenge.entry}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Pool Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              Prize <span className="text-green-600 dark:text-green-400">Pool</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Top 6 winners share the prize pool every month
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {PRIZES.map((prize) => {
                const Icon = prize.icon;
                return (
                  <div
                    key={prize.rank}
                    className={`flex items-center justify-between p-4 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all ${
                      prize.rank === 1 ? "ring-2 ring-yellow-400/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        prize.rank === 1 ? "bg-yellow-400/20" :
                        prize.rank === 2 ? "bg-gray-300/20" :
                        prize.rank === 3 ? "bg-amber-600/20" :
                        "bg-blue-400/20"
                      }`}>
                        <Icon className={`w-5 h-5 ${prize.color}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-black dark:text-white">{prize.label}</div>
                        <div className="text-sm text-gray-500">Monthly competition</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${prize.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Withdrawal Info */}
            <Card className="mt-8 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-black dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-green-500" />
                  Withdrawal & Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    All winnings are paid via M-Pesa within 24 hours
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Withdrawal fee: <span className="font-bold text-black dark:text-white ml-1">$25 USD</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Refund available within 7 days of entry (minus $25 processing fee)
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Minimum withdrawal: $50 USD
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800" variant="outline">
              <Flame className="w-3 h-3 mr-1" />
              Monthly Competition
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              Top 10 <span className="text-green-600 dark:text-green-400">Traders</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              This month's top performers competing for the $5,000 prize
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                      <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Rank</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Trader</th>
                      <th className="text-right p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Profit</th>
                      <th className="text-right p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Trades</th>
                      <th className="text-right p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_TRADERS.map((trader) => (
                      <tr
                        key={trader.rank}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                          trader.rank <= 3 ? "bg-green-50/50 dark:bg-green-900/10" : ""
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {trader.rank === 1 ? (
                              <Crown className="w-5 h-5 text-yellow-400" />
                            ) : trader.rank === 2 ? (
                              <Medal className="w-5 h-5 text-gray-300" />
                            ) : trader.rank === 3 ? (
                              <Medal className="w-5 h-5 text-amber-600" />
                            ) : (
                              <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">
                                {trader.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                              {trader.name.charAt(0)}
                            </div>
                            <span className="font-medium text-black dark:text-white">{trader.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-green-600 dark:text-green-400">{trader.profit}</span>
                        </td>
                        <td className="p-4 text-right text-gray-600 dark:text-gray-400">{trader.trades}</td>
                        <td className="p-4 text-right">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800">
                            {trader.winRate}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="text-center mt-8">
              <p className="text-gray-500 mb-4">
                Competition resets every month. Join a challenge to appear on the leaderboard.
              </p>
              <Link href="#challenges">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                  <Target className="mr-2 w-4 h-4" />
                  Join a Challenge
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              How It <span className="text-green-600 dark:text-green-400">Works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">1. Pay Entry via M-Pesa</h3>
              <p className="text-gray-600 dark:text-gray-400">Choose a challenge and pay the entry fee using M-Pesa</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">2. Trade & Compete</h3>
              <p className="text-gray-600 dark:text-gray-400">Trade forex and crypto to hit your profit target</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">3. Win & Withdraw</h3>
              <p className="text-gray-600 dark:text-gray-400">Top performers win prizes paid via M-Pesa ($25 withdrawal fee)</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}