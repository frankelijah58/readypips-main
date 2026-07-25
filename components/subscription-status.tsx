"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, AlertTriangle, Crown } from "lucide-react";
import Link from "next/link";

interface SubscriptionStatusProps {
  subscriptionType: string;
  subscriptionStatus: string;
  subscriptionEndDate: string | Date;
  className?: string;
}

export function SubscriptionStatus({
  subscriptionType,
  subscriptionStatus,
  subscriptionEndDate,
  className = "",
}: SubscriptionStatusProps) {
  // Calculate remaining days
  const endDate = new Date(subscriptionEndDate);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine status color and icon
  const isActive = subscriptionStatus === "active";
  const isExpiringSoon = remainingDays <= 7 && remainingDays > 0;
  const isExpired = remainingDays <= 0;

  const statusColor = isExpired
    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
    : isExpiringSoon
    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";

  const planDetails = {
    weekly: {
      name: "Weekly Plan",
      icon: "📅",
      features: ["15 signals/day", "Basic analysis", "Email support"],
    },
    monthly: {
      name: "Monthly Plan",
      icon: "⭐",
      features: ["35 signals/day", "AI insights", "Priority support"],
    },
    "3months": {
      name: "3 Months Plan",
      icon: "�",
      features: ["Unlimited signals", "Advanced analysis", "Extended access"],
    },
  };

  const currentPlan = planDetails[subscriptionType as keyof typeof planDetails] || {
    name: "No Plan",
    icon: "📦",
    features: [],
  };

  if (!isActive || isExpired) {
    return (
      <Card className={`bg-white dark:bg-black border-gray-200 dark:border-gray-800 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-black dark:text-white">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>No Active Subscription</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {isExpired
                ? "Your subscription has expired. Renew now to continue accessing premium features."
                : "You don't have an active subscription yet."}
            </p>
            <Link href="/subscription">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                View Plans & Subscribe
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white dark:bg-black border-gray-200 dark:border-gray-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-black dark:text-white">
            <span className="text-2xl">{currentPlan.icon}</span>
            <span>{currentPlan.name}</span>
          </CardTitle>
          <Badge className={statusColor}>
            {isActive && !isExpiringSoon ? "Active" : isExpiringSoon ? "Expiring Soon" : "Expired"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Remaining Days Card */}
        <div
          className={`p-4 rounded-lg ${
            isExpiringSoon
              ? "bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-800"
              : "bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  isExpiringSoon
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-green-100 dark:bg-green-900/30"
                }`}
              >
                <Clock
                  className={`w-5 h-5 ${
                    isExpiringSoon ? "text-yellow-600" : "text-green-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Days Remaining
                </p>
                <p
                  className={`text-2xl font-bold ${
                    isExpiringSoon
                      ? "text-yellow-700 dark:text-yellow-400"
                      : "text-green-700 dark:text-green-400"
                  }`}
                >
                  {remainingDays} days
                </p>
              </div>
            </div>
            <Calendar
              className={`w-8 h-8 ${
                isExpiringSoon
                  ? "text-yellow-400 dark:text-yellow-600"
                  : "text-green-400 dark:text-green-600"
              }`}
            />
          </div>
          <div className="mt-3 flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Expires on: {endDate.toLocaleDateString()}</span>
          </div>
        </div>

        {/* Expiring Soon Warning */}
        {isExpiringSoon && (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
              <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              Your subscription is expiring soon! Renew now to avoid service interruption.
            </p>
            <Link href="/subscription">
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/20"
              >
                Renew Subscription
              </Button>
            </Link>
          </div>
        )}

        {/* Plan Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Your Plan Includes:
          </h4>
          <ul className="space-y-1">
            {currentPlan.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-center text-sm text-gray-600 dark:text-gray-400"
              >
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade Option */}
        {subscriptionType !== "3months" && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/subscription">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Save More
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
