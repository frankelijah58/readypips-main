"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-3">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <CardTitle>Payment canceled</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You canceled the payment before it was completed.  
            No charges were made.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push("/pricing")}
            >
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Need help? Contact support anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
