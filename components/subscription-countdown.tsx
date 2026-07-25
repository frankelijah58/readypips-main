"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionCountdownProps {
  token: string;
  onRenew?: () => void;
}

export function SubscriptionCountdown({ token, onRenew }: SubscriptionCountdownProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
    // Refresh every hour
    const interval = setInterval(fetchSubscriptionStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscriptions/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        console.error("Failed to fetch subscription status");
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || subscription.status === "inactive") {
    return (
      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                No Active Subscription
              </CardTitle>
              <CardDescription>Subscribe to access premium features</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => (window.location.href = "/subscription")}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Get Access Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { daysRemaining, hoursRemaining, isExpiringSoon, isExpired, type, endDate } = subscription;

  const formatEndDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isExpired) {
    return (
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Subscription Expired
              </CardTitle>
              <CardDescription>Your subscription has expired</CardDescription>
            </div>
            <Badge variant="destructive">Expired</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your subscription expired on {endDate ? formatEndDate(endDate) : "N/A"}. Renew now to continue accessing premium features.
          </p>
          <Button
            onClick={() => (window.location.href = "/subscription")}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Renew Subscription
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isExpiringSoon ? "border-yellow-200 dark:border-yellow-900" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isExpiringSoon ? (
                <Clock className="w-5 h-5 text-yellow-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              Subscription Active
            </CardTitle>
            <CardDescription className="capitalize">{type} Plan</CardDescription>
          </div>
          <Badge variant={isExpiringSoon ? "destructive" : "default"} className={isExpiringSoon ? "bg-yellow-600" : "bg-green-600"}>
            {isExpiringSoon ? "Expiring Soon" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-2xl font-bold text-black dark:text-white">{daysRemaining}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-2xl font-bold text-black dark:text-white">{hoursRemaining}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hours Remaining</p>
          </div>
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Expires on {endDate ? formatEndDate(endDate) : "N/A"}</span>
        </div>

        {/* Warning Message */}
        {isExpiringSoon && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Your subscription is expiring soon! Renew now to avoid interruption.
            </p>
          </div>
        )}

        {/* Renew Button */}
        {isExpiringSoon && (
          <Button
            onClick={() => (window.location.href = "/subscription")}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Renew Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
