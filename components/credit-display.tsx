"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Coins } from "lucide-react";

interface CreditInfo {
  credits: number;
  subscriptionType: string;
  subscriptionStatus: string;
}

export function CreditDisplay() {
  const { user } = useAuth();
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCredits = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/credits", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCreditInfo(data);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  // Hide credits display for logged-in users
  if (user) return null;

  return (
    <div className="flex items-center space-x-2">
      {creditInfo ? (
        <>
          <Badge
            variant="outline"
            className="flex items-center space-x-1 text-xs"
          >
            <Coins className="w-3 h-3" />
            <span>{creditInfo.credits} Credits</span>
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${
              creditInfo.subscriptionStatus === "active"
                ? "border-green-600 text-green-600 dark:text-green-400 dark:border-green-400"
                : "border-gray-400 text-gray-600 dark:text-gray-400"
            }`}
          >
            <CreditCard className="w-3 h-3 mr-1" />
            {creditInfo.subscriptionType?.toUpperCase() || "FREE"} PLAN
          </Badge>
        </>
      ) : (
        <div className="flex items-center space-x-2">
          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
}
