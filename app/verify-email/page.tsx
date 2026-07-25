"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");
    
    if (!token) {
      setError("Invalid verification link");
      return;
    }
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    // Auto-verify the email
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerified(true);
        toast.success("Email verified successfully!");
      } else {
        setError(data.error || "Failed to verify email");
        toast.error(data.error || "Failed to verify email");
      }
    } catch (error) {
      setError("An error occurred during verification");
      toast.error("An error occurred during verification");
    } finally {
      setVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error("Email not found. Please try registering again.");
      return;
    }

    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent successfully!");
      } else {
        toast.error(data.error || "Failed to resend verification email");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="relative h-10">
              <img 
                src="/logo-light.png" 
                alt="Ready Pips Logo" 
                className="h-10 w-auto dark:hidden"
              />
              <img 
                src="/logo-dark.png" 
                alt="Ready Pips Logo" 
                className="h-10 w-auto hidden dark:block"
              />
            </Link>
          </div>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardHeader className="text-center">
              <RefreshCw className="h-16 w-16 text-green-600 mx-auto mb-4 animate-spin" />
              <CardTitle className="text-2xl text-black dark:text-white">Verifying Email...</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="relative h-10">
              <img 
                src="/logo-light.png" 
                alt="Ready Pips Logo" 
                className="h-10 w-auto dark:hidden"
              />
              <img 
                src="/logo-dark.png" 
                alt="Ready Pips Logo" 
                className="h-10 w-auto hidden dark:block"
              />
            </Link>
          </div>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-black dark:text-white">Email Verified!</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your email has been successfully verified. You can now log in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login" className="w-full">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Continue to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="relative h-10">
              <img 
                src="/logo-light.png" 
                alt="Ready Pips Logo" 
                className="h-10 w-auto dark:hidden"
              />
              <img 
                src="/logo-dark.png" 
                alt="Ready Pips Logo" 
                className="h-10 w-auto hidden dark:block"
              />
            </Link>
          </div>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardHeader className="text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-black dark:text-white">Verification Failed</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                The verification link may have expired or is invalid. You can request a new verification email.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={resendVerification}
                  disabled={resending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default state (should not reach here)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="relative h-10">
            <img 
              src="/logo-light.png" 
              alt="Ready Pips Logo" 
              className="h-10 w-auto dark:hidden"
            />
            <img 
              src="/logo-dark.png" 
              alt="Ready Pips Logo" 
              className="h-10 w-auto hidden dark:block"
            />
          </Link>
        </div>

        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-black dark:text-white">Email Verification</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Processing your verification request...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
