"use client";

import { Clock, ShieldCheck, Mail, CheckCircle, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { cn } from "@/lib/utils";

export default function PartnerPendingPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex font-sans text-slate-100 relative overflow-hidden">
      
      {/* 1. Fixed Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-full flex flex-col items-center py-6 z-50 border-r border-slate-800/50 bg-[#020617]/50 backdrop-blur-md">
        <Navigation />

      {/* 2. Background Glow Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 ml-14">
        <div className="max-w-xl w-full bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800/50 p-10 shadow-3xl text-center space-y-8 animate-in fade-in zoom-in duration-700">
          
          {/* Animated Icon Header */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-3xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <Clock className="w-10 h-10 text-blue-500 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-4 border-[#020617]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Application Under Review
            </h1>
            <p className="text-slate-400 text-lg">
              We&apos;re currently verifying your profile details.
            </p>
          </div>

          {/* Status Timeline Card */}
          <div className="bg-slate-950/50 border border-slate-800/50 rounded-3xl p-6 text-left space-y-6">
            <StatusItem
              icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
              title="Submission Received"
              description="Your application is safely in our queue."
              active
            />
            <StatusItem
              icon={<ShieldCheck className="w-5 h-5 text-blue-500" />}
              title="Verification in Progress"
              description="Our team is reviewing your platform and strategy."
              active
              loading
            />
            <StatusItem
              icon={<Mail className="w-5 h-5 text-slate-600" />}
              title="Decision Email"
              description="Keep an eye on your inbox for the results."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="outline" className="h-12 px-8 rounded-xl border-slate-800 hover:bg-slate-800 text-slate-300">
              <Link href="/support" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Contact Support
              </Link>
            </Button>
            <Button asChild className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20">
              <Link href="/profile" className="flex items-center gap-2">
                <User className="w-4 h-4" /> View Account
              </Link>
            </Button>
          </div>

          {/* Timeline footer */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2 font-medium uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            Typical Response: 24–48 Hours
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>
    </div>
    
      </div>
  );
}

function StatusItem({
  icon,
  title,
  description,
  active = false,
  loading = false
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active?: boolean;
  loading?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-start gap-4 transition-opacity",
      !active && "opacity-40"
    )}>
      <div className={cn(
        "mt-1 p-1 rounded-lg",
        loading && "animate-pulse"
      )}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className={cn(
          "text-sm font-bold leading-none",
          active ? "text-slate-100" : "text-slate-500"
        )}>
          {title}
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}