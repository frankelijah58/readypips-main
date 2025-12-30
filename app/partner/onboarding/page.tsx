'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, ChevronRight, LineChart, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assumes standard shadcn utils exist
import { toast } from 'sonner';

export default function PartnerOnboarding() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    platform: '',
    audienceSize: '',
    strategy: '',
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

//   const handleSubmit = async () => {
//     setIsLoading(true);
//     // Simulate API Call
//     await new Promise(resolve => setTimeout(resolve, 1500));
//     toast.success("Application Submitted!");
//     router.push('/partner/dashboard');
//   };

    const handleSubmit = async () => {
    setIsLoading(true);

    try {
        const res = await fetch("/api/partner/apply", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        toast.success("Application submitted for review");
        router.push("/partner/pending");
    } catch (err: any) {
        toast.error(err.message || "Failed to submit application");
    } finally {
        setIsLoading(false);
    }
    };


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Progress Header */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Partner Application
            </h1>
            <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-2 w-8 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-500' : 'bg-slate-700'}`} />
                ))}
            </div>
        </div>

        {/* Steps Container */}
        <div className="min-h-[300px]">
            {/* Step 1: Platform */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
                    <h2 className="text-3xl font-semibold">Where do you create content?</h2>
                    <p className="text-slate-400">Select your primary channel for distributing trading signals.</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {['YouTube', 'Twitter/X', 'Telegram', 'Blog'].map((platform) => (
                            <button
                                key={platform}
                                onClick={() => setFormData({...formData, platform})}
                                className={cn(
                                    "p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all text-left group",
                                    formData.platform === platform ? "bg-blue-600/10 border-blue-500" : "bg-slate-900"
                                )}
                            >
                                <span className="text-lg font-medium group-hover:text-blue-400 transition-colors">{platform}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Strategy */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
                    <h2 className="text-3xl font-semibold">What is your reach?</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Estimated Audience Size</label>
                            <input 
                                type="text" 
                                placeholder="e.g., 10,000 subscribers"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 focus:ring-2 ring-blue-500 outline-none transition-all"
                                value={formData.audienceSize}
                                onChange={(e) => setFormData({...formData, audienceSize: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Promotion Strategy</label>
                            <textarea 
                                placeholder="How do you plan to promote our signals?"
                                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 focus:ring-2 ring-blue-500 outline-none transition-all resize-none"
                                value={formData.strategy}
                                onChange={(e) => setFormData({...formData, strategy: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center space-y-6 flex flex-col items-center justify-center h-full pt-10">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold">Ready to Launch?</h2>
                    <p className="text-slate-400 max-w-md">
                        By clicking submit, you agree to our partner terms. We will review your application within 24 hours.
                    </p>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end">
            <button
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Processing...' : step === 3 ? 'Submit Application' : 'Continue'}
                {!isLoading && <ChevronRight className="w-5 h-5" />}
            </button>
        </div>

      </div>
    </div>
  );
}