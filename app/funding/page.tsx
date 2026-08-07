"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

import {
  Trophy,
  Medal,
  TrendingUp,
  ArrowRight,
  Crown,
  Target,
  Zap,
  CheckCircle,
  Star,
  Flame,
  Gift,
  Shield,
  Info,
  Smartphone,
  Loader2,
  RefreshCw,
  Lock,
  User,
  Server,
  FileText,
  Copy,
} from "lucide-react";

/* =========================================================
   PRIZES
========================================================= */

const PRIZES = [
  {
    rank: 1,
    amount: 5000,
    label: "1st Place",
    color: "text-yellow-400",
    icon: Crown,
  },
  {
    rank: 2,
    amount: 2500,
    label: "2nd Place",
    color: "text-gray-300",
    icon: Medal,
  },
  {
    rank: 3,
    amount: 1250,
    label: "3rd Place",
    color: "text-amber-600",
    icon: Medal,
  },
  {
    rank: 4,
    amount: 650,
    label: "4th Place",
    color: "text-blue-400",
    icon: Star,
  },
  {
    rank: 5,
    amount: 300,
    label: "5th Place",
    color: "text-blue-400",
    icon: Star,
  },
  {
    rank: 6,
    amount: 150,
    label: "6th Place",
    color: "text-blue-400",
    icon: Star,
  },
  {
    rank: 7,
    amount: 75,
    label: "7th Place",
    color: "text-blue-400",
    icon: Star,
  },
  {
    rank: 8,
    amount: 0,
    label: "8th Place",
    color: "text-green-400",
    icon: RefreshCw,
    isRefund: true,
  },
  {
    rank: 9,
    amount: 0,
    label: "9th Place",
    color: "text-green-400",
    icon: RefreshCw,
    isRefund: true,
  },
  {
    rank: 10,
    amount: 0,
    label: "10th Place",
    color: "text-green-400",
    icon: RefreshCw,
    isRefund: true,
  },
];

/* =========================================================
   CHALLENGES
========================================================= */

const CHALLENGES = [
  {
    name: "Starter Challenge",
    entry: 42.99,
    target: "$500",
    rules: "10% profit target, 5% max drawdown, 30 days",
    popular: true,
  },
];

/* =========================================================
   TYPES
========================================================= */

interface Challenge {
  name: string;
  entry: number;
  target: string;
  rules: string;
  popular: boolean;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  profit: string;
  trades: number;
  winRate: string;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function FundingPage() {
  /* =======================================================
     GENERAL STATES
  ======================================================= */

  const [selectedChallenge, setSelectedChallenge] =
    useState<Challenge | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const [paymentWaiting, setPaymentWaiting] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState<
    "waiting" | "success" | "failed"
  >("waiting");

  const [paymentMessage, setPaymentMessage] = useState("");

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  /* =======================================================
     MT5 STATES
  ======================================================= */

  const [showMt5Form, setShowMt5Form] = useState(false);

  const [showTerms, setShowTerms] = useState(false);

  const [agreedTerms, setAgreedTerms] = useState(false);

  const [mt5Form, setMt5Form] = useState({
    mt5_login: "",
    mt5_password: "",
    investor_password: "",
    server: "",
    group: "Starter Challenge",
    balance: "500",
    leverage: "1:100",
  });

  const [savingMt5, setSavingMt5] = useState(false);

  const [challengeStatus, setChallengeStatus] = useState<any>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  /* =======================================================
     BINANCE STATES

     IMPORTANT:
     These states are INSIDE the FundingPage component.
  ======================================================= */

  const [showBinanceManual, setShowBinanceManual] = useState(false);

  const [binanceChallenge, setBinanceChallenge] =
    useState<Challenge | null>(null);

  const [txId, setTxId] = useState("");

  const [senderWallet, setSenderWallet] = useState("");

  const [note, setNote] = useState("");

  const [binanceSubmitting, setBinanceSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  /* =======================================================
     BINANCE CONFIGURATION
  ======================================================= */

  const network = "TRC20";

  /*
   * Put your actual TRC20 address here.
   *
   * You can also use:
   *
   * process.env.NEXT_PUBLIC_BINANCE_USDT_TRC20_ADDRESS
   *
   * if you have configured it in .env.local.
   */

  const depositAddress =
    process.env.NEXT_PUBLIC_BINANCE_USDT_TRC20_ADDRESS ||
    "YOUR_TRC20_WALLET_ADDRESS";

  /* =======================================================
     COPY FUNCTION
  ======================================================= */

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Could not copy");
    }
  };

  /* =======================================================
     FETCH LEADERBOARD
  ======================================================= */

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);

      const res = await fetch("/api/challenge/leaderboard?limit=10");

      const data = await res.json();

      setLeaderboard(
        data.success && data.leaderboard?.length > 0
          ? data.leaderboard
          : []
      );
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  /* =======================================================
     FETCH CHALLENGE STATUS
  ======================================================= */

  const fetchChallengeStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await fetch("/api/challenge/mt5-credentials", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setChallengeStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch challenge status:", err);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchLeaderboard();
    fetchChallengeStatus();
  }, [fetchLeaderboard, fetchChallengeStatus]);

  /* =======================================================
     CLEANUP POLLING
  ======================================================= */

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  /* =======================================================
     JOIN CHALLENGE
  ======================================================= */

  const handleJoinChallenge = (challenge: Challenge) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.info("Please login to join a challenge");
      return;
    }

    setSelectedChallenge(challenge);
    setPhoneNumber("");
    setAgreedTerms(false);
  };

  /* =======================================================
     OPEN BINANCE PAYMENT
  ======================================================= */

  const handleOpenBinance = () => {
    if (!selectedChallenge) {
      toast.error("Please select a challenge first");
      return;
    }

    /*
     * Save the challenge before closing the M-Pesa modal.
     */
    setBinanceChallenge(selectedChallenge);

    /*
     * Close M-Pesa modal.
     */
    setSelectedChallenge(null);

    /*
     * Reset Binance form.
     */
    setTxId("");
    setSenderWallet("");
    setNote("");
    setSubmitted(false);

    /*
     * Open Binance modal.
     */
    setShowBinanceManual(true);
  };

  /* =======================================================
     SUBMIT BINANCE PAYMENT
  ======================================================= */

  const submitBinancePayment = async () => {
    if (!binanceChallenge) {
      toast.error("Challenge information is missing");
      return;
    }

    if (!txId.trim()) {
      toast.error("Please enter the transaction ID / hash");
      return;
    }

    if (!depositAddress || depositAddress === "YOUR_TRC20_WALLET_ADDRESS") {
      toast.error("Binance deposit address is not configured");
      return;
    }

    setBinanceSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/payments/binance", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },

        body: JSON.stringify({
          planName: binanceChallenge.name,
          planId: `challenge-${binanceChallenge.name
            .toLowerCase()
            .replace(/\s+/g, "-")}`,

          amount: binanceChallenge.entry,

          currency: "USDT",

          network: "TRC20",

          txId: txId.trim(),

          senderWallet: senderWallet.trim(),

          depositAddress,

          note: note.trim(),
        }),
      });

      const rawText = await res.text();

      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(
          rawText || "Server returned an invalid response."
        );
      }

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to submit Binance payment"
        );
      }

      setSubmitted(true);

      toast.success("Payment submitted", {
        description:
          "Your Binance payment is waiting for admin approval.",
      });
    } catch (err: any) {
      console.error("Binance payment error:", err);

      toast.error(
        err?.message || "Failed to submit Binance payment"
      );
    } finally {
      setBinanceSubmitting(false);
    }
  };

  /* =======================================================
     M-PESA PAYMENT
  ======================================================= */

  const handleMpesaPayment = async () => {
    if (!selectedChallenge) return;

    if (!agreedTerms) {
      toast.error(
        "Please accept the Terms & Conditions to continue"
      );
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\s+/g, "");

    if (!cleanedPhone || cleanedPhone.length < 10) {
      toast.error("Please enter a valid M-Pesa phone number");
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          phoneNumber: cleanedPhone,

          amount: selectedChallenge.entry,

          planId: `challenge-${selectedChallenge.name
            .toLowerCase()
            .replace(/\s+/g, "-")}`,

          userId: "",

          duration: 30,

          planName: selectedChallenge.name,
        }),
      });

      const rawText = await res.text();

      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(
          rawText || "Server returned an invalid response."
        );
      }

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message || "M-Pesa payment failed"
        );
      }

      toast.success("M-Pesa Prompt Sent", {
        description: `Check ${cleanedPhone} and enter your M-Pesa PIN to complete payment.`,
        duration: 8000,
      });

      const merchantRequestID =
        data?.MerchantRequestID ||
        data?.data?.MerchantRequestID ||
        null;

      const checkoutRequestID =
        data?.CheckoutRequestID ||
        data?.data?.CheckoutRequestID ||
        null;

      setSelectedChallenge(null);
      setPhoneNumber("");

      if (merchantRequestID && checkoutRequestID) {
        setPaymentStatus("waiting");

        setPaymentMessage(
          "Enter your M-Pesa PIN on your phone to complete the payment."
        );

        setPaymentWaiting(true);

        let attempts = 0;

        const maxAttempts = 24;

        pollRef.current = setInterval(async () => {
          attempts++;

          try {
            const statusRes = await fetch(
              "/api/payments/mpesa/status",
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                body: JSON.stringify({
                  merchantRequestID,
                  checkoutRequestID,
                }),
              }
            );

            const statusData = await statusRes.json();

            const status =
              statusData?.status ||
              statusData?.paymentStatus;

            const paid =
              statusData?.paid === true ||
              status === "success" ||
              status === "paid";

            const failed =
              status === "failed" ||
              status === "cancelled" ||
              status === "canceled";

            if (paid) {
              if (pollRef.current) {
                clearInterval(pollRef.current);
              }

              setPaymentStatus("success");

              setPaymentMessage(
                "Payment confirmed! You can now submit your MT5 credentials."
              );

              setTimeout(() => {
                setPaymentWaiting(false);
                setShowMt5Form(true);
                fetchChallengeStatus();
              }, 2000);
            } else if (failed) {
              if (pollRef.current) {
                clearInterval(pollRef.current);
              }

              setPaymentStatus("failed");

              setPaymentMessage(
                statusData?.message ||
                  "Payment was not completed. Please try again."
              );
            } else if (attempts >= maxAttempts) {
              if (pollRef.current) {
                clearInterval(pollRef.current);
              }

              setPaymentStatus("failed");

              setPaymentMessage(
                "Payment confirmation timed out. If you already paid, please refresh the page."
              );
            }
          } catch (pollErr) {
            console.error(
              "M-Pesa polling error:",
              pollErr
            );

            if (
              attempts >= maxAttempts &&
              pollRef.current
            ) {
              clearInterval(pollRef.current);

              setPaymentStatus("failed");

              setPaymentMessage(
                "Could not confirm payment status. If you already paid, please refresh the page."
              );
            }
          }
        }, 5000);
      } else {
        setTimeout(() => {
          setShowMt5Form(true);
          fetchChallengeStatus();
        }, 5000);
      }
    } catch (err: any) {
      toast.error(
        err.message || "Failed to process M-Pesa payment"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /* =======================================================
     MT5 SUBMIT
  ======================================================= */

  const handleMt5Submit = async () => {
    if (
      !mt5Form.mt5_login ||
      !mt5Form.mt5_password ||
      !mt5Form.server
    ) {
      toast.error(
        "MT5 login, password, and server are required"
      );
      return;
    }

    setSavingMt5(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "/api/challenge/mt5-credentials",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(mt5Form),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data?.message ||
            "Failed to save MT5 credentials"
        );
      }

      toast.success("Challenge Started!", {
        description:
          "Your MT5 credentials have been saved. The competition has started!",
        duration: 8000,
      });

      setShowMt5Form(false);

      setMt5Form({
        mt5_login: "",
        mt5_password: "",
        investor_password: "",
        server: "",
        group: "Starter Challenge",
        balance: "500",
        leverage: "1:100",
      });

      fetchChallengeStatus();
      fetchLeaderboard();
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to save MT5 credentials"
      );
    } finally {
      setSavingMt5(false);
    }
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-green-900 via-black to-green-900">
        <div className="absolute inset-0 bg-[url('/trading2.jpg')] bg-cover bg-center opacity-20"></div>

        <div className="container mx-auto text-center relative z-10">
          <Badge
            className="mb-6 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
            variant="outline"
          >
            <Trophy className="w-3 h-3 mr-1" />
            Funded Trading Challenge
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Get{" "}
            <span className="text-green-400">
              Funded
            </span>
          </h1>

          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Prove your trading skills, win prizes up to
            $5,000, and get funded. Start with just{" "}
            <span className="text-green-400 font-bold">
              $42.99
            </span>
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="#challenges">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Join the Challenge
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>

            <Link href="#leaderboard">
              <Button
                size="lg"
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white font-semibold"
              >
                <Trophy className="mr-2 w-4 h-4" />
                Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================
          STATS
      =================================================== */}

      <section className="py-8 px-4 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                $42.99
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Entry Fee
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                $5,000
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Top Prize
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                10
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Prize Positions
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {leaderboard.length || 0}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Participants
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          PAYMENT CONFIRMED
      =================================================== */}

      {challengeStatus?.hasPaid &&
        !challengeStatus?.hasSubmittedCredentials && (
          <section className="py-6 px-4 bg-green-50 dark:bg-green-950/20 border-b border-green-200 dark:border-green-800">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />

                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      Payment Confirmed!
                    </p>

                    <p className="text-sm text-green-600 dark:text-green-400">
                      Submit your MT5 credentials to start
                      the competition
                    </p>
                  </div>
                </div>

                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowMt5Form(true)}
                >
                  Submit MT5 Credentials
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>
        )}

      {/* ===================================================
          ACTIVE PARTICIPANT
      =================================================== */}

      {challengeStatus?.hasSubmittedCredentials &&
        challengeStatus?.participant && (
          <section className="py-6 px-4 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-blue-600" />

                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      You're in the competition!{" "}
                      {challengeStatus.participant.rank >
                        0 &&
                        `Rank: #${challengeStatus.participant.rank}`}
                    </p>

                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      MT5:{" "}
                      {challengeStatus.participant.mt5_login}{" "}
                      | Server:{" "}
                      {challengeStatus.participant.server}{" "}
                      | Balance: $
                      {challengeStatus.participant.balance}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  onClick={() => setShowMt5Form(true)}
                >
                  Update Credentials
                </Button>
              </div>
            </div>
          </section>
        )}

      {/* ===================================================
          CHALLENGES
      =================================================== */}

      <section
        id="challenges"
        className="py-20 px-4"
      >
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              The{" "}
              <span className="text-green-600 dark:text-green-400">
                Challenge
              </span>
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              One challenge. One entry fee. Big prizes for
              top 10 finishers. Payments via M-Pesa or
              Binance.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {CHALLENGES.map((challenge) => (
              <Card
                key={challenge.name}
                className="relative bg-white dark:bg-black border-2 border-green-500 shadow-lg shadow-green-500/20 transition-all duration-200 hover:shadow-xl"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Only Challenge
                  </Badge>
                </div>

                <CardHeader>
                  <CardTitle className="text-black dark:text-white text-lg">
                    {challenge.name}
                  </CardTitle>

                  <CardDescription>
                    <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                      ${challenge.entry}
                    </span>

                    <span className="text-gray-500 ml-1">
                      entry
                    </span>
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
                      <Trophy className="w-4 h-4 text-green-500 mr-2" />
                      Top 10 win prizes
                    </div>

                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Smartphone className="w-4 h-4 text-green-500 mr-2" />
                      Pay via M-Pesa or Binance
                    </div>
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      handleJoinChallenge(challenge)
                    }
                  >
                    Pay $42.99
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          PRIZE POOL
      =================================================== */}

      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              Prize{" "}
              <span className="text-green-600 dark:text-green-400">
                Pool
              </span>
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Top 10 winners share the prize pool every
              month
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {PRIZES.map((prize: any) => {
                const Icon = prize.icon;

                return (
                  <div
                    key={prize.rank}
                    className={`flex items-center justify-between p-4 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all ${
                      prize.rank === 1
                        ? "ring-2 ring-yellow-400/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          prize.rank === 1
                            ? "bg-yellow-400/20"
                            : prize.rank === 2
                            ? "bg-gray-300/20"
                            : prize.rank === 3
                            ? "bg-amber-600/20"
                            : prize.isRefund
                            ? "bg-green-400/20"
                            : "bg-blue-400/20"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${prize.color}`}
                        />
                      </div>

                      <div>
                        <div className="font-semibold text-black dark:text-white">
                          {prize.label}
                        </div>

                        <div className="text-sm text-gray-500">
                          Monthly competition
                        </div>
                      </div>
                    </div>

                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {prize.isRefund
                        ? "Refund"
                        : `$${prize.amount.toLocaleString()}`}
                    </div>
                  </div>
                );
              })}
            </div>

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
                    All winnings paid via M-Pesa within 24
                    hours
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Withdrawal fee:
                    <span className="font-bold text-black dark:text-white ml-1">
                      $25 USD
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Positions 8-10 get entry fee refunded
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Refund available within 7 days of entry
                    (minus $25 processing fee)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===================================================
          LEADERBOARD
      =================================================== */}

      <section
        id="leaderboard"
        className="py-20 px-4"
      >
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge
              className="mb-4 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
              variant="outline"
            >
              <Flame className="w-3 h-3 mr-1" />
              Monthly Competition
            </Badge>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              Top 10{" "}
              <span className="text-green-600 dark:text-green-400">
                Traders
              </span>
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Live leaderboard of this month's top
              performers competing for the $5,000 prize
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                      <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Rank
                      </th>

                      <th className="text-left p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Trader
                      </th>

                      <th className="text-right p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Profit
                      </th>

                      <th className="text-right p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Trades
                      </th>

                      <th className="text-right p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Win Rate
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaderboardLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-gray-500"
                        >
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Loading leaderboard...
                        </td>
                      </tr>
                    ) : leaderboard.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-gray-500"
                        >
                          <Trophy className="w-8 h-8 mx-auto mb-3 text-gray-400" />

                          <p className="font-medium">
                            No participants yet
                          </p>

                          <p className="text-sm text-gray-400 mt-1">
                            Be the first to join the
                            challenge!
                          </p>
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((trader) => (
                        <tr
                          key={trader.rank}
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                            trader.rank <= 3
                              ? "bg-green-50/50 dark:bg-green-900/10"
                              : ""
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

                              <span className="font-medium text-black dark:text-white">
                                {trader.name}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-right">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {trader.profit}
                            </span>
                          </td>

                          <td className="p-4 text-right text-gray-600 dark:text-gray-400">
                            {trader.trades}
                          </td>

                          <td className="p-4 text-right">
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
                            >
                              {trader.winRate}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="text-center mt-8">
              <p className="text-gray-500 mb-4">
                Competition resets every month. Join the
                challenge to appear on the leaderboard.
              </p>

              <Link href="#challenges">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  <Target className="mr-2 w-4 h-4" />
                  Join the Challenge
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          HOW IT WORKS
      =================================================== */}

      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              How It{" "}
              <span className="text-green-600 dark:text-green-400">
                Works
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
                1. Pay
              </h3>

              <p className="text-gray-600 dark:text-gray-400">
                Pay $42.99 using M-Pesa or Binance USDT
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
                2. Submit MT5 Credentials
              </h3>

              <p className="text-gray-600 dark:text-gray-400">
                Enter your MT5 login, password, and server
                details
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
                3. Trade & Compete
              </h3>

              <p className="text-gray-600 dark:text-gray-400">
                Trade forex and crypto to hit your profit
                target
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
                4. Win & Withdraw
              </h3>

              <p className="text-gray-600 dark:text-gray-400">
                Top 10 performers win prizes - positions 8-10
                get refund
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          M-PESA PAYMENT MODAL
      =================================================== */}

      <Dialog
        open={!!selectedChallenge}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedChallenge(null);
            setPhoneNumber("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-500" />
              Choose Payment Method
            </DialogTitle>

            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Choose how you would like to pay for your
              ReadyPips challenge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* CARD BUTTON */}
{/* CARD PAYMENT BUTTON */}
{/* CARD PAYMENT BUTTON */}
<Button
  type="button"
  variant="outline"
  onClick={() => {
    window.location.href = "https://whop.com/checkout/plan_Ah8SIdynixNFD";
  }}
  className="w-full border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
>
  Pay Via Card
</Button>

{/* BINANCE PAYMENT BUTTON */}
<Button
  type="button"
  onClick={handleOpenBinance}
  className="w-full border-yellow-500 bg-yellow-500 text-black hover:bg-yellow-400 hover:text-black dark:border-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400"
>
  Pay via Binance today
</Button>

            {/* M-PESA FORM */}

            <div className="border-t pt-4 dark:border-gray-800">
              <p className="text-sm font-semibold text-black dark:text-white mb-3">
                Or pay via M-Pesa
              </p>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-black dark:text-white"
                >
                  M-Pesa Phone Number
                </Label>

                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <Input
                    id="phone"
                    placeholder="e.g. 0712345678"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value)
                    }
                    className="pl-10 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Enter the Safaricom number you use for
                  M-Pesa
                </p>
              </div>

              {selectedChallenge && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Challenge
                    </span>

                    <span className="font-semibold text-black dark:text-white">
                      {selectedChallenge.name}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Amount
                    </span>

                    <span className="font-bold text-green-600 dark:text-green-400">
                      ${selectedChallenge.entry} USD
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Payment
                    </span>

                    <span className="text-black dark:text-white">
                      M-Pesa
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Target
                    </span>

                    <span className="text-black dark:text-white">
                      {selectedChallenge.target}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg mt-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedTerms}
                  onChange={(e) =>
                    setAgreedTerms(e.target.checked)
                  }
                  className="mt-1"
                />

                <label
                  htmlFor="terms"
                  className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-green-600 dark:text-green-400 underline font-medium"
                  >
                    Terms & Conditions
                  </button>{" "}
                  of the ReadyPips Funded Trading Challenge
                </label>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                size="lg"
                onClick={handleMpesaPayment}
                disabled={
                  isProcessing || !agreedTerms
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Pay $
                    {selectedChallenge?.entry || 0} via
                    M-Pesa
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-2">
                You will receive an M-Pesa prompt on your
                phone. Enter your PIN to complete the
                payment.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================
          BINANCE PAYMENT MODAL
      =================================================== */}

      <Dialog
        open={showBinanceManual}
        onOpenChange={(open) => {
          setShowBinanceManual(open);

          if (!open) {
            setSubmitted(false);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[480px] max-h-[90vh] overflow-hidden p-0 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="shrink-0 border-b px-4 py-3 dark:border-gray-800">
              <DialogTitle className="text-base font-semibold">
                ReadyPips Binance Payment
              </DialogTitle>

              <DialogDescription className="pt-1 text-xs leading-5">
                Send USDT via TRC20, then submit the
                transaction ID for admin approval.
              </DialogDescription>
            </DialogHeader>

            {/* =================================================
                SUBMITTED SUCCESS
            ================================================= */}

            {submitted ? (
              <div className="overflow-y-auto px-4 py-5">
                <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center dark:border-green-900 dark:bg-green-950/20">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />

                  <p className="mt-3 text-base font-semibold text-green-700 dark:text-green-400">
                    Payment submitted successfully
                  </p>

                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Your payment is now marked as{" "}
                    <b>
                      submitted waiting for admin
                      approval
                    </b>
                    .
                  </p>

                  <button
                    type="button"
                    className="mt-4 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
                    onClick={() => {
                      setSubmitted(false);
                      setShowBinanceManual(false);
                      setBinanceChallenge(null);
                      setTxId("");
                      setSenderWallet("");
                      setNote("");
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">

                  {/* =================================================
                      PAYMENT DETAILS
                  ================================================= */}

                  <div className="rounded-xl border p-3 dark:border-gray-700">
                    <p className="text-xs text-gray-500">
                      Plan
                    </p>

                    <p className="text-sm font-semibold">
                      {binanceChallenge?.name ||
                        "Starter Challenge"}
                    </p>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        Amount
                      </p>

                      <p className="text-sm font-semibold">
                        {binanceChallenge?.entry || 42.99}{" "}
                        USDT
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        Network
                      </p>

                      <div className="mt-1 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
                        <span className="text-sm font-medium">
                          {network}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            copyText(network)
                          }
                          className="text-[11px] text-yellow-600 hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        Deposit Address
                      </p>

                      <div className="mt-1 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                        <p className="break-all text-xs font-medium">
                          {depositAddress}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            copyText(depositAddress)
                          }
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-yellow-600 hover:underline"
                        >
                          <Copy className="h-3 w-3" />
                          Copy address
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      HOW TO PAY
                  ================================================= */}

                  <div className="rounded-xl border p-3 dark:border-gray-700">
                    <p className="mb-2 text-sm font-semibold">
                      How to pay
                    </p>

                    <ol className="list-decimal space-y-1 pl-4 text-xs text-gray-600 dark:text-gray-300">
                      <li>Open Binance app</li>
                      <li>Choose USDT</li>
                      <li>Select Send or Withdraw</li>
                      <li>
                        Choose network: <b>TRC20</b>
                      </li>
                      <li>
                        Paste wallet address or scan QR
                      </li>
                      <li>
                        Send exactly{" "}
                        {binanceChallenge?.entry ||
                          42.99}{" "}
                        USDT
                      </li>
                      <li>Copy transaction hash</li>
                      <li>Paste it below and submit</li>
                    </ol>

                    <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 p-2 text-[11px] text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                      Only send{" "}
                      <b>USDT on TRC20</b>.
                    </div>

                    {/* =================================================
                        QR CODE
                    ================================================= */}

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium text-center">
                        Scan our QR Code
                      </p>

                      <img
                        src="/binance-usdt-qr.jpeg"
                        alt="Binance USDT QR"
                        className="mx-auto h-64 w-64 rounded-lg border object-contain bg-white p-2"
                      />
                    </div>
                  </div>

                  {/* =================================================
                      PAYMENT PROOF
                  ================================================= */}

                  <div className="rounded-xl border p-3 dark:border-gray-700">
                    <p className="mb-3 text-sm font-semibold">
                      Submit Payment Proof
                    </p>

                    <div className="space-y-3">
                      {/* TX ID */}

                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Transaction ID / Hash (TxID){" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          value={txId}
                          onChange={(e) =>
                            setTxId(e.target.value)
                          }
                          placeholder="Enter blockchain transaction hash"
                          className="w-full rounded-lg border px-3 py-3 text-base font-mono tracking-wide outline-none focus:border-yellow-500 dark:border-gray-700 dark:bg-gray-800 break-all"
                        />
                      </div>

                      {/* SENDER WALLET */}

                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Your (Sender) Wallet Address
                        </label>

                        <input
                          type="text"
                          value={senderWallet}
                          onChange={(e) =>
                            setSenderWallet(
                              e.target.value
                            )
                          }
                          placeholder="Optional"
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-yellow-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                      </div>

                      {/* NOTE */}

                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Note
                        </label>

                        <textarea
                          value={note}
                          onChange={(e) =>
                            setNote(e.target.value)
                          }
                          placeholder="Optional note"
                          rows={2}
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-yellow-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    {/* =================================================
                        BUTTONS
                    ================================================= */}

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowBinanceManual(false)
                        }
                        disabled={binanceSubmitting}
                        className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={
                          submitBinancePayment
                        }
                        disabled={binanceSubmitting}
                        className="flex-1 rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
                      >
                        {binanceSubmitting ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </span>
                        ) : (
                          "Submit"
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================
          TERMS & CONDITIONS MODAL
      =================================================== */}

      <Dialog
        open={showTerms}
        onOpenChange={setShowTerms}
      >
        <DialogContent className="sm:max-w-lg bg-white dark:bg-black border-gray-200 dark:border-gray-800 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              Terms & Conditions
            </DialogTitle>

            <DialogDescription className="text-gray-600 dark:text-gray-400">
              ReadyPips Funded Trading Challenge - Terms &
              Conditions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm text-gray-600 dark:text-gray-400 max-h-[60vh] overflow-y-auto">
            <p>
              <strong className="text-black dark:text-white">
                1. Entry Fee:
              </strong>{" "}
              The entry fee is $42.99 USD, payable via
              M-Pesa at the prevailing KES exchange rate.
              The fee is non-refundable except as specified
              in section 6.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                2. Challenge Duration:
              </strong>{" "}
              The challenge runs for 30 days from the date
              your MT5 credentials are submitted and
              approved.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                3. Profit Target:
              </strong>{" "}
              Participants must achieve a 10% profit target
              on their starting balance to qualify for
              prizes.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                4. Max Drawdown:
              </strong>{" "}
              A maximum drawdown of 5% is allowed. Exceeding
              this limit results in disqualification.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                5. Prize Distribution:
              </strong>{" "}
              The top 10 traders share a prize pool of
              $5,000 USD. 1st place wins $5,000, 2nd $2,500,
              3rd $1,250, 4th $650, 5th $300, 6th $150, 7th
              $75. Positions 8-10 receive a full refund of
              their entry fee.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                6. Refund Policy:
              </strong>{" "}
              Refunds are available within 7 days of entry,
              minus a $25 USD processing fee. Positions 8-10
              automatically receive their entry fee refunded.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                7. Withdrawal:
              </strong>{" "}
              All winnings are paid via M-Pesa within 24
              hours of the competition ending. A $25 USD
              withdrawal fee applies.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                8. MT5 Credentials:
              </strong>{" "}
              Participants must provide valid MT5 login
              credentials (login, password, server).
              Credentials are stored securely and used only
              for monitoring trading performance.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                9. Fair Trading:
              </strong>{" "}
              The use of Expert Advisors (EAs), copy trading,
              or any automated trading tools is prohibited.
              Manual trading only.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                10. Disqualification:
              </strong>{" "}
              ReadyPips reserves the right to disqualify any
              participant found violating these terms, using
              multiple accounts, or engaging in fraudulent
              activity.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                11. Leaderboard:
              </strong>{" "}
              The leaderboard is updated in real-time based
              on profit performance. The admin has the final
              say on rankings.
            </p>

            <p>
              <strong className="text-black dark:text-white">
                12. Acceptance:
              </strong>{" "}
              By proceeding with payment, you acknowledge
              that you have read and agree to these Terms &
              Conditions.
            </p>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              setAgreedTerms(true);
              setShowTerms(false);
            }}
          >
            I Agree - Continue to Payment
          </Button>
        </DialogContent>
      </Dialog>

      {/* ===================================================
          PAYMENT WAITING MODAL
      =================================================== */}

      <Dialog
        open={paymentWaiting}
        onOpenChange={(open) => {
          if (
            !open &&
            (paymentStatus === "success" ||
              paymentStatus === "failed")
          ) {
            if (pollRef.current) {
              clearInterval(pollRef.current);
            }

            setPaymentWaiting(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white flex items-center justify-center gap-2 text-center text-xl font-bold">
              {paymentStatus === "waiting" && (
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              )}

              {paymentStatus === "success" && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}

              {paymentStatus === "failed" && (
                <span className="text-red-500">
                  &#10005;
                </span>
              )}

              {paymentStatus === "waiting" &&
                "Waiting for Payment"}

              {paymentStatus === "success" &&
                "Payment Confirmed!"}

              {paymentStatus === "failed" &&
                "Payment Failed"}
            </DialogTitle>

            <DialogDescription className="text-center text-sm pt-2 text-gray-600 dark:text-gray-400">
              {paymentMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 space-y-4">
            {paymentStatus === "waiting" && (
              <>
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/20">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-600" />

                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Check your phone
                      </p>

                      <p className="text-xs text-green-600 dark:text-green-400">
                        Enter your M-Pesa PIN to complete the
                        payment...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div className="h-2 w-1/2 animate-pulse rounded-full bg-green-600" />
                </div>

                <p className="text-center text-xs text-gray-500">
                  Do not close this window before payment
                  confirmation.
                </p>
              </>
            )}

            {paymentStatus === "success" && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />

                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Payment received!
                    </p>

                    <p className="text-xs text-green-600 dark:text-green-400">
                      Opening MT5 credentials form...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentStatus === "failed" && (
              <Button
                className="w-full bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  if (pollRef.current) {
                    clearInterval(pollRef.current);
                  }

                  setPaymentWaiting(false);
                }}
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================
          MT5 CREDENTIALS MODAL
      =================================================== */}

      <Dialog
        open={showMt5Form}
        onOpenChange={(open) => {
          if (!open && !savingMt5) {
            setShowMt5Form(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-black border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-500" />
              MT5 Trading Credentials
            </DialogTitle>

            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Enter your MT5 account details to join the
              competition. The competition starts immediately
              after submission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="mt5_login"
                className="text-black dark:text-white flex items-center gap-1"
              >
                <User className="w-3 h-3" />
                MT5 Login{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Input
                id="mt5_login"
                placeholder="e.g. 12345678"
                value={mt5Form.mt5_login}
                onChange={(e) =>
                  setMt5Form({
                    ...mt5Form,
                    mt5_login: e.target.value,
                  })
                }
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="mt5_password"
                className="text-black dark:text-white flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                MT5 Password{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Input
                id="mt5_password"
                type="password"
                placeholder="Your MT5 master password"
                value={mt5Form.mt5_password}
                onChange={(e) =>
                  setMt5Form({
                    ...mt5Form,
                    mt5_password: e.target.value,
                  })
                }
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="investor_password"
                className="text-black dark:text-white flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                Investor Password (optional)
              </Label>

              <Input
                id="investor_password"
                type="password"
                placeholder="Investor (read-only) password"
                value={mt5Form.investor_password}
                onChange={(e) =>
                  setMt5Form({
                    ...mt5Form,
                    investor_password: e.target.value,
                  })
                }
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="server"
                className="text-black dark:text-white flex items-center gap-1"
              >
                <Server className="w-3 h-3" />
                Server{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Input
                id="server"
                placeholder="e.g. Exness-MT5Real"
                value={mt5Form.server}
                onChange={(e) =>
                  setMt5Form({
                    ...mt5Form,
                    server: e.target.value,
                  })
                }
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label
                  htmlFor="balance"
                  className="text-black dark:text-white"
                >
                  Balance (USD)
                </Label>

                <Input
                  id="balance"
                  type="number"
                  placeholder="500"
                  value={mt5Form.balance}
                  onChange={(e) =>
                    setMt5Form({
                      ...mt5Form,
                      balance: e.target.value,
                    })
                  }
                  className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="leverage"
                  className="text-black dark:text-white"
                >
                  Leverage
                </Label>

                <Input
                  id="leverage"
                  placeholder="1:100"
                  value={mt5Form.leverage}
                  onChange={(e) =>
                    setMt5Form({
                      ...mt5Form,
                      leverage: e.target.value,
                    })
                  }
                  className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="group"
                className="text-black dark:text-white"
              >
                Group
              </Label>

              <Input
                id="group"
                placeholder="Starter Challenge"
                value={mt5Form.group}
                onChange={(e) =>
                  setMt5Form({
                    ...mt5Form,
                    group: e.target.value,
                  })
                }
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white"
              />
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />

                Your credentials are stored securely and
                only used to monitor your trading performance
                for the leaderboard. The competition starts
                immediately.
              </p>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              onClick={handleMt5Submit}
              disabled={savingMt5}
            >
              {savingMt5 ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Start Competition
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}