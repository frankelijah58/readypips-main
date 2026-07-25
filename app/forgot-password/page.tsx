"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showVerificationNote, setShowVerificationNote] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Email exists and reset link sent
        setSent(true);
        toast.success("Password reset link sent to your email!");
      } else {
        if (data.error && data.error.includes("verify your email")) {
          setShowVerificationNote(true);
          toast.error("Please verify your email first before resetting password");
        } else {
          // For security, we still show success even if email doesn't exist
          // But the backend won't send an email
          if (data.message && data.message.includes("If an account")) {
            setSent(true);
          } else {
            toast.error(data.error || "Failed to send reset link");
          }
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
              <CardTitle className="text-2xl text-black dark:text-white">Check Your Email</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                We've sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Click the link in your email to reset your password. The link will expire in 1 hour.
              </p>
              <div className="space-y-2">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
                <Button
                  onClick={() => setSent(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Send Another Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <CardTitle className="text-2xl text-black dark:text-white">Forgot Password?</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  required
                />
              </div>

              {showVerificationNote && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium mb-1">Email not verified</p>
                      <p className="mb-2">You need to verify your email address before you can reset your password.</p>
                      <button
                            type="button"
                            onClick={async () => {
                              if (!email?.trim()) {
                                toast.error("Please enter your email first.");
                                return;
                              }

                              try {
                                const response = await fetch("/api/auth/resend-verification", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ email: email.trim() }),
                                });

                                const data = await response.json();

                                if (response.ok) {
                                  toast.success("Verification email sent successfully. Check your inbox.");
                                } else {
                                  toast.error(data.error || "Failed to send verification email");
                                }
                              } catch (error) {
                                toast.error("Something went wrong. Please try again.");
                              }
                            }}
                            className="text-amber-700 dark:text-amber-300 hover:underline font-medium"
                          >
                            Verify your email first →
                          </button>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
