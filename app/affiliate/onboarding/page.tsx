"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronRight, Rocket, DollarSign, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateOnboarding() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((s) => s + 1);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Progress Bar */}
        <div className="flex justify-between mb-8 px-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 w-[30%] rounded-full ${step >= i ? 'bg-primary' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <Card className="border-none shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Rocket className="text-primary w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Become a Partner</CardTitle>
              <CardDescription>Join our affiliate program and start earning 20% commission on every referral.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-slate-600">Track clicks and conversions in real-time with your custom dashboard.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-slate-600">Monthly payouts directly to your account with no hidden fees.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={nextStep} className="w-full h-12 text-lg">Get Started <ChevronRight className="ml-2 w-4 h-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-none shadow-xl animate-in fade-in slide-in-from-right-4 duration-500">
            <CardHeader>
              <CardTitle>Tell us about you</CardTitle>
              <CardDescription>We need a few details to set up your partner account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="method">Primary Promotion Method</Label>
                <Input id="method" placeholder="e.g. YouTube, Twitter, Blog" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout">PayPal or Payout Email</Label>
                <Input id="payout" type="email" placeholder="email@example.com" />
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">Back</Button>
              <Button onClick={nextStep} className="w-2/3">Complete Application</Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-none shadow-xl text-center p-6 animate-in zoom-in-95 duration-500">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-green-600 w-8 h-8" />
            </div>
            <CardTitle className="text-2xl mb-2">Application Submitted!</CardTitle>
            <p className="text-slate-500 mb-6">
              Our team is reviewing your profile. You&apos;ll receive an email notification within 24 hours.
            </p>
            <Button onClick={() => window.location.href = '/affiliate/dashboard'} className="w-full">
              Go to Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}