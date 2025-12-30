"use client";

import { Clock, ShieldCheck, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PartnerPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
        
        {/* Icon */}
        <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-blue-50">
          <Clock className="w-7 h-7 text-blue-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900">
          Partner Application Under Review
        </h1>

        {/* Description */}
        <p className="text-slate-600 leading-relaxed">
          Thank you for applying to become a partner.  
          Our team is currently reviewing your application to ensure quality,
          compliance, and alignment with our platform standards.
        </p>

        {/* Status Steps */}
        <div className="bg-slate-50 rounded-xl p-5 text-left space-y-4">
          <StatusItem
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            title="Application Submitted"
            description="We’ve received your partner application."
          />
          <StatusItem
            icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
            title="Review in Progress"
            description="Our team is verifying your details and business profile."
          />
          <StatusItem
            icon={<Mail className="w-5 h-5 text-slate-400" />}
            title="Approval Notification"
            description="You’ll receive an email once approved."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild variant="outline">
            <Link href="/support">Contact Support</Link>
          </Button>
          <Button asChild>
            <Link href="/profile">View Account Details</Link>
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-400 pt-2">
          Reviews typically take 24–48 hours.
        </p>
      </div>
    </div>
  );
}

function StatusItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
