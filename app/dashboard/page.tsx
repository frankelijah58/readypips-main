"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TradingViewChart } from "@/components/tradingview-chart";
import { SignalCard } from "@/components/signal-card";
import { Navigation } from "@/components/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  Calendar,
  Target,
  Shield,
} from "lucide-react";
import { Signal } from "@/lib/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { PhoneNumberModal } from "@/components/phone-number-modal";

interface Payment {
  id: string;
  sessionId: string;
  provider: string;
  planName: string;
  amount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  signals: Signal[];
  stats: {
    totalSignals: number;
    winRate: number;
    avgProfit: number;
    activeSignals: number;
  };
  user: {
    subscriptionType: string;
    subscriptionStatus: string;
    subscriptionEndDate: string;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState("FX:EURUSD");
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // console.log("🔄 Dashboard useEffect triggered");
    // // console.log("👤 User state:", user);
    // // console.log("⏳ Auth loading:", authLoading);
    // console.log("🔄 Redirect attempted:", redirectAttempted);

    if (authLoading) {
      // console.log("⏳ Still loading auth, waiting...");
      return;
    }

    if (!user && !redirectAttempted) {
      // console.log("❌ No user found, redirecting to login");
      setRedirectAttempted(true);

      // Use router.push first, then fallback to window.location
      router.push("/login");

      // Fallback redirect after a short delay
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          // console.log("🔄 Fallback redirect to login");
          window.location.href = "/login";
        }
      }, 2000);

      return;
    }

    if (user) {
      // Check if user logged in with Google and has no phone number
      const checkPhoneNumber = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            // Check if user logged in with Google (has googleId) and has no phone number
            if (data.user.googleId && !data.user.phoneNumber) {
              setShowPhoneModal(true);
            }
          }
        } catch (error) {
          console.error("Error checking phone number:", error);
        }
      };
      
      checkPhoneNumber();
      
      // Redirect authenticated users to signals page
      // console.log("✅ User authenticated, redirecting to signals");
      router.push("/signals");
      return;
    }
  }, [user, authLoading, redirectAttempted, router]);

  const fetchDashboardData = async () => {
    try {
      // console.log("🔍 Fetching dashboard data...");
      const token = localStorage.getItem("token");

      if (!token) {
        // console.log("❌ No token found, redirecting to login");
        if (!redirectAttempted) {
          setRedirectAttempted(true);
          router.push("/login");
        }
        return;
      }

      // console.log("📡 Making API request to /api/dashboard");
      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log("📊 Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // console.log("❌ Unauthorized, redirecting to login");
          localStorage.removeItem("token");
          if (!redirectAttempted) {
            setRedirectAttempted(true);
            router.push("/login");
          }
          return;
        }
        if (response.status === 403) {
          // console.log("❌ Forbidden, redirecting to subscription");
          router.push("/subscription");
          return;
        }
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(
          `Failed to fetch dashboard data: ${response.status} ${errorText}`
        );
      }

      const dashboardData = await response.json();
      // console.log("✅ Dashboard data received:", dashboardData);
      setData(dashboardData);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      // console.log("🏁 Setting loading to false");
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch("/api/payments/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Checking authentication...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  // Show redirect state if no user and redirect was attempted
  if (!user && redirectAttempted) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Redirecting to login...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Please wait
          </p>

          {/* Manual redirect button as fallback */}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Click here if not redirected automatically
          </button>
        </div>
      </div>
    );
  }

  // Show main dashboard content
  if (user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {/* Welcome back, {user.firstName}! */}
              Welcome back, TEST
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your trading dashboard and signals overview
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/chart" className="block">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                      <Activity className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Live Chart</h3>
                      <p className="text-sm text-blue-100">Real-time trading analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/signals" className="block">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all cursor-pointer border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Signals</h3>
                      <p className="text-sm text-green-100">View all trading signals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/insights" className="block">
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all cursor-pointer border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">AI Insights</h3>
                      <p className="text-sm text-purple-100">Smart market analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Signals
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data?.stats?.totalSignals || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Win Rate
                </CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data?.stats?.winRate || 0}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Profit
                </CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${data?.stats?.avgProfit || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Signals
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data?.stats?.activeSignals || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Status */}
          <Card className="mb-8 bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plan:{" "}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {data?.user?.subscriptionType ||
                        // user.subscriptionType ||
                        "No Plan"}
                    </span>
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Status:{" "}
                    <Badge
                      variant={
                        data?.user?.subscriptionStatus === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {data?.user?.subscriptionStatus ||
                        // user.subscriptionStatus ||
                        "Inactive"}
                    </Badge>
                  </div>
                </div>
                {data?.user?.subscriptionStatus !== "active" && (
                  <Link href="/subscription">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Upgrade Plan
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chart Section */}
          <Card className="mb-8 bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle>Market Chart</CardTitle>
              <CardDescription>
                Real-time price chart for {selectedSymbol}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradingViewChart symbol={selectedSymbol} />
            </CardContent>
          </Card>

          {/* Signals Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest Trading Signals
              </h2>
              <Link href="/signals">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  View All Signals
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800"
                  >
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data?.signals && data.signals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.signals.slice(0, 6).map((signal) => (
                  <SignalCard key={signal._id} signal={signal} />
                ))}
              </div>
            ) : (
              <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No signals available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Check back later for new trading opportunities
                  </p>
                  <Button
                    onClick={() => fetchDashboardData()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Refresh Signals
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.planName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.provider} •{" "}
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.amount}
                        </p>
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Phone Number Modal for Google Login Users (excluding admins) */}
        {showPhoneModal && user.role !== 'admin'  && (
          <PhoneNumberModal
            isOpen={showPhoneModal}
            onClose={() => setShowPhoneModal(false)}
            userEmail={user.email}
          />
        )}
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );
}
