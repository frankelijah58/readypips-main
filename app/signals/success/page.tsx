"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { CheckCircle, ArrowRight, Shield, Zap, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";

interface SubscriptionData {
  sessionId: string;
  provider: string;
  planName: string;
  amount: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: string;
  subscriptionType: string;
  subscriptionEndDate: string;
}

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Support multiple payment providers' callback parameters
  const sessionId = searchParams.get("session_id"); // Stripe
  const reference = searchParams.get("reference"); // Paystack
  const orderTrackingId = searchParams.get("OrderTrackingId"); // Pesapal
  const merchantReference = searchParams.get("OrderMerchantReference"); // Pesapal
  
  const { user: authUser, checkAuth } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      // console.log("🔍 [Subscription Success] useEffect triggered");
      // console.log("🔍 [Subscription Success] sessionId:", sessionId);
      // console.log("🔍 [Subscription Success] reference:", reference);
      // console.log("🔍 [Subscription Success] orderTrackingId:", orderTrackingId);
      // console.log("🔍 [Subscription Success] merchantReference:", merchantReference);
      // console.log("🔍 [Subscription Success] authUser:", authUser);

      // Determine payment ID based on provider
      const paymentId = sessionId || reference || orderTrackingId;
      // console.log("🔍 [Subscription Success] Payment ID determined:", paymentId);

      if (paymentId) {
        // console.log("🔍 [Subscription Success] Starting verification for:", paymentId);
        verifySubscription(paymentId);
      } else {
        // console.log("❌ [Subscription Success] No payment ID found");
        
        // Check if user's subscription has already been activated by webhook
        // console.log("🔍 [Subscription Success] Checking if subscription was already activated...");
        
        // Use auth context user data if available
        if (authUser) {
          // console.log("✅ [Subscription Success] Using auth context user data:", authUser);
          
          if (authUser.subscriptionStatus === "active") {
            // console.log("✅ [Subscription Success] Subscription already active!");
            setSubscriptionData({
              sessionId: "webhook-processed",
              provider: "stripe",
              planName: authUser.subscriptionType || "Subscription",
              amount: "Payment processed",
              status: "success",
              startDate: new Date().toISOString(),
              endDate: authUser.subscriptionEndDate ? new Date(authUser.subscriptionEndDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
            setUserData({
              id: authUser._id ?? "",
              email: authUser.email,
              firstName: authUser.firstName,
              lastName: authUser.lastName,
              subscriptionStatus: authUser.subscriptionStatus,
              subscriptionType: authUser.subscriptionType ?? "",
              subscriptionEndDate: authUser.subscriptionEndDate ? authUser.subscriptionEndDate.toISOString() : "",
            });
            toast.success("Subscription activated successfully!");
            setLoading(false);
            return;
          }
        }

        // If no auth user, try to refresh auth
        if (!authUser) {
          // console.log("🔍 [Subscription Success] No auth user, refreshing auth...");
          await checkAuth();
          // Wait a bit for auth to refresh
          setTimeout(() => {
            if (authUser) {
              // console.log("✅ [Subscription Success] Auth refreshed, user data:", authUser);
              // Re-run the logic with fresh user data
              checkSubscription();
              return;
            }
          }, 1000);
        }

        // Show error if no user data available
        // console.log("❌ [Subscription Success] No user data available");
        toast.error("Unable to retrieve user information. Please log in again.");
        setLoading(false);
      }
    };

    checkSubscription();
  }, [sessionId, reference, authUser, checkAuth]);

  const verifySubscription = async (paymentId: string) => {
    try {
      // console.log("🔍 [Subscription Success] verifySubscription called with:", paymentId);

      // Get token from localStorage
      const token = localStorage.getItem("token");

      // console.log("🔍 [Subscription Success] Token found:", !!token);

      if (!token) {
        // console.log("❌ [Subscription Success] No token found");
        toast.error("Authentication required");
        setLoading(false);
        return;
      }

      // Determine provider from payment ID format
      let provider: string;
      if (paymentId.startsWith("cs_")) {
        provider = "stripe";
      } else if (orderTrackingId) {
        provider = "pesapal";
      } else {
        provider = "paystack";
      }
      // console.log("🔍 [Subscription Success] Provider determined:", provider);

      const requestBody = {
        sessionId: paymentId,
        provider,
      };

      // console.log("🔍 [Subscription Success] Making API request to /api/payments/verify-session...");
      const response = await fetch("/api/payments/verify-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      // console.log("🔍 [Subscription Success] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        // console.log("✅ [Subscription Success] Success response:", data);
        
        // Set subscription and user data
        setSubscriptionData(data.payment);
        setUserData(data.user);
        
        // Refresh auth context to get updated user data
        // console.log("🔍 [Subscription Success] Refreshing auth context...");
        await checkAuth();
        
        toast.success("🎉 Subscription activated successfully!");
        // console.log("✅ [Subscription Success] Verification complete!");
      } else {
        const errorData = await response.json();
        console.error("❌ [Subscription Success] Error response:", errorData);

        // If 401, the token might be invalid - try to refresh auth
        if (response.status === 401) {
          // console.log("⚠️ [Subscription Success] Token invalid, attempting to refresh auth...");
          await checkAuth();
          
          // Retry verification with refreshed token
          const newToken = localStorage.getItem("token");
          if (newToken && newToken !== token) {
            // console.log("� [Subscription Success] Retrying with refreshed token...");
            return verifySubscription(paymentId);
          }
        }

        // If verification fails, show error
        toast.error(errorData.error || "Failed to verify subscription. Please contact support.");
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("❌ [Subscription Success] Verification error:", error);
      toast.error("Network error during verification. Please refresh the page or contact support.");
      setLoading(false);
      return;
    } finally {
      // console.log("🏁 [Subscription Success] Verification process completed");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Verifying your subscription...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  if (!subscriptionData || !userData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">
            Verification Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn&apos;t automatically verify your subscription. Your payment may still be processing.
          </p>
          <div className="space-y-3">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.location.reload()}
            >
              Retry Verification
            </Button>
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => router.push("/signals")}
            >
              Check Dashboard
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              If the issue persists, please check your email for payment confirmation or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">
              Welcome to Ready Pips!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your subscription has been activated successfully
            </p>
          </div>

          {/* Subscription Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">
                Subscription Details
              </CardTitle>
              <CardDescription>
                Your payment was processed via{" "}
                {subscriptionData.provider === "stripe" ? "Stripe" : "Paystack"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plan
                  </p>
                  <p className="font-semibold text-black dark:text-white">
                    {subscriptionData.planName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Amount
                  </p>
                  <p className="font-semibold text-black dark:text-white">
                    {subscriptionData.amount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status
                  </p>
                  <Badge
                    variant={
                      subscriptionData.status === "completed"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      subscriptionData.status === "completed"
                        ? "bg-green-600"
                        : ""
                    }
                  >
                    {subscriptionData.status === "completed"
                      ? "Active"
                      : "Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Provider
                  </p>
                  <p className="font-semibold text-black dark:text-white capitalize">
                    {subscriptionData.provider}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Start Date
                    </p>
                    <p className="font-semibold text-black dark:text-white">
                      {subscriptionData.startDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      End Date
                    </p>
                    <p className="font-semibold text-black dark:text-white">
                      {subscriptionData.endDate}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Name
                  </p>
                  <p className="font-semibold text-black dark:text-white">
                    {userData.firstName} {userData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Email
                  </p>
                  <p className="font-semibold text-black dark:text-white">
                    {userData.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Subscription Status
                  </p>
                  <Badge
                    variant={
                      userData.subscriptionStatus === "active"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      userData.subscriptionStatus === "active"
                        ? "bg-green-600"
                        : ""
                    }
                  >
                    {userData.subscriptionStatus === "active"
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">
                What&apos;s Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black dark:text-white">
                      Access Your Dashboard
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View real-time trading signals and market analysis
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black dark:text-white">
                      Set Up Notifications
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure email and push notifications for instant alerts
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black dark:text-white">
                      Start Trading
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use our signals to make informed trading decisions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <Zap className="w-4 h-4 mr-2" />
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={() => (window.location.href = "/signals")}
            >
              <Target className="w-4 h-4 mr-2" />
              View Signals
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionSuccessContent;
