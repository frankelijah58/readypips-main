"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { toast } from "sonner";

export default function BillingSuccessPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let attempts = 0;

    const pollSubscription = async () => {
      await checkAuth();
      attempts++;

      if (user?.subscriptionStatus === "active") {
        toast.success("🎉 Subscription activated!");
        router.replace("/dashboard");
        return;
      }

      if (attempts >= 6) {
        setChecking(false);
        return;
      }

      setTimeout(pollSubscription, 3000);
    };

    pollSubscription();
  }, [user, checkAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-3">
            {checking ? (
              <Loader2 className="w-10 h-10 animate-spin text-green-600" />
            ) : (
              <CheckCircle className="w-10 h-10 text-green-600" />
            )}
          </div>
          <CardTitle>
            {checking
              ? "Finalizing your subscription…"
              : "Payment received"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {checking
              ? "Your payment was successful. We’re activating your subscription now."
              : "Your payment was successful. Your subscription will activate shortly."}
          </p>

          {!checking && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          )}

          <p className="text-xs text-gray-500">
            If this takes more than a minute, refresh the page or contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
