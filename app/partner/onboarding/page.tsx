'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Users, 
  Briefcase, 
  Globe, 
  Layout, 
  Youtube, 
  Twitter, 
  Send, 
  Instagram, 
  MousePointer2,
  Building,
  BarChart3,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
// import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ApplicationType = 'affiliate' | 'partner' | null;

const PLATFORMS = [
  { id: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { id: 'Twitter/X', icon: Twitter, color: 'text-sky-400' },
  { id: 'Telegram', icon: Send, color: 'text-blue-400' },
  { id: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'TikTok', icon: MousePointer2, color: 'text-black' },
  { id: 'Blog/Web', icon: Globe, color: 'text-emerald-400' },
];

export default function PartnerOnboarding() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<ApplicationType>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    platform: '',
    audienceSize: '',
    strategy: '',
    companyName: '',
  });

  const handleNext = () => {
    if (step === 1 && !type) return toast.error("Please select a path");
    if (step === 2 && !formData.platform) return toast.error("Select your primary platform");
    if (step === 3 && (!formData.audienceSize || !formData.strategy)) return toast.error("Please fill in all fields");
    
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // ... same logic as before
    setTimeout(() => { // Simulating for UI demo
        toast.success("Application submitted successfully");
        router.push("/partner/pending");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans text-slate-100 relative overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] transition-colors duration-1000",
            type === 'partner' ? "bg-purple-600/10" : type === 'affiliate' ? "bg-blue-600/10" : "bg-slate-800/10"
        )} />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        
        {/* Progress Navigation */}
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="space-y-1">
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Step {step} of 4</h1>
            <p className="text-xl font-semibold text-white">
                {step === 1 && "Start your journey"}
                {step === 2 && "Platform selection"}
                {step === 3 && "Impact & Strategy"}
                {step === 4 && "Final Review"}
            </p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={cn(
                    "h-1 transition-all duration-500 rounded-full",
                    step >= i ? "w-8 bg-blue-500" : "w-4 bg-slate-800"
                )} 
              />
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] p-10 shadow-3xl min-h-[480px] flex flex-col">
          
          {/* <AnimatePresence mode="wait"> */}
            <div
            //   key={step}
            //   initial={{ opacity: 0, x: 20 }}
            //   animate={{ opacity: 1, x: 0 }}
            //   exit={{ opacity: 0, x: -20 }}
            //   transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {/* Step 1: Selection */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">How will you promote?</h2>
                    <p className="text-slate-400">Select the account type that best fits your profile.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectionCard 
                      active={type === 'affiliate'}
                      onClick={() => setType('affiliate')}
                      icon={Users}
                      title="Affiliate"
                      desc="Content creators, influencers, and community leaders."
                      color="blue"
                    />
                    <SelectionCard 
                      active={type === 'partner'}
                      onClick={() => setType('partner')}
                      icon={Briefcase}
                      title="Partner"
                      desc="Registered businesses, agencies, and institutional entities."
                      color="purple"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Platform Icons */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Main Platform</h2>
                    <p className="text-slate-400">Where do you engage with your audience most?</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setFormData({...formData, platform: p.id})}
                        className={cn(
                          "group p-6 rounded-3xl border transition-all flex flex-col items-center gap-3",
                          formData.platform === p.id 
                            ? "bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <p.icon className={cn("w-8 h-8 transition-transform group-hover:scale-110", p.color)} />
                        <span className="text-sm font-medium">{p.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Inputs */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">The specifics</h2>
                    <p className="text-slate-400">Help us understand your reach and conversion strategy.</p>
                  </div>
                  <div className="space-y-5">
                    {type === 'partner' && (
                      <div className="space-y-2">
                        <Label className="text-slate-300 ml-1">Registered Company Name</Label>
                        <div className="relative">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input 
                            className="bg-slate-950/50 border-slate-800 h-14 pl-12 rounded-2xl focus:ring-blue-500/20"
                            placeholder="e.g. Acme Marketing Ltd"
                            value={formData.companyName}
                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-slate-300 ml-1">Est. Monthly Reach / Audience Size</Label>
                      <div className="relative">
                        <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                          className="bg-slate-950/50 border-slate-800 h-14 pl-12 rounded-2xl focus:ring-blue-500/20"
                          placeholder="e.g. 150,000 active subs"
                          value={formData.audienceSize}
                          onChange={(e) => setFormData({...formData, audienceSize: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 ml-1">Brief Strategy</Label>
                      <Textarea 
                        className="bg-slate-950/50 border-slate-800 min-h-[120px] rounded-2xl focus:ring-blue-500/20 resize-none p-4"
                        placeholder="Tell us how you plan to onboard users..."
                        value={formData.strategy}
                        onChange={(e) => setFormData({...formData, strategy: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Summary */}
              {step === 4 && (
                <div className="space-y-8 flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                    <CheckCircle2 className="w-10 h-10 text-blue-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold">Review Application</h2>
                    <p className="text-slate-400">Double check your details before sending.</p>
                  </div>
                  <div className="w-full bg-slate-950/50 rounded-3xl border border-slate-800 p-6 grid grid-cols-2 gap-6">
                    <SummaryItem label="Program" value={type} highlight />
                    <SummaryItem label="Platform" value={formData.platform} />
                    <SummaryItem label="Reach" value={formData.audienceSize} />
                    {type === 'partner' && <SummaryItem label="Company" value={formData.companyName} />}
                  </div>
                </div>
              )}
            </div>
          {/* </AnimatePresence> */}

          {/* Action Bar */}
          <div className="mt-12 flex items-center justify-between">
            {step > 1 ? (
              <Button 
                variant="ghost" 
                onClick={() => setStep(step - 1)}
                className="text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-xl px-6"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : <div />}

            <Button
              onClick={handleNext}
              disabled={isLoading}
              className={cn(
                "h-14 px-10 rounded-2xl font-bold transition-all shadow-lg",
                step === 4 ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20" : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
              )}
            >
              {isLoading ? 'Processing...' : step === 4 ? 'Submit Application' : 'Continue'}
              {!isLoading && <ChevronRight className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function SelectionCard({ active, onClick, icon: Icon, title, desc, color }: any) {
  const isBlue = color === 'blue';
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-8 rounded-[2rem] border-2 transition-all text-left group overflow-hidden",
        active 
          ? (isBlue ? "bg-blue-600/10 border-blue-500" : "bg-purple-600/10 border-purple-500")
          : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors",
        active ? (isBlue ? "bg-blue-500 text-white" : "bg-purple-500 text-white") : "bg-slate-900 text-slate-500 group-hover:text-slate-300"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      
      {active && (
        <div className="absolute top-4 right-4 animate-in fade-in zoom-in">
          <CheckCircle2 className={cn("w-6 h-6", isBlue ? "text-blue-500" : "text-purple-500")} />
        </div>
      )}
    </button>
  );
}

function SummaryItem({ label, value, highlight }: { label: string, value: string | null, highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</p>
      <p className={cn("text-sm font-medium", highlight ? "text-blue-400 uppercase" : "text-slate-200")}>
        {value || 'Not provided'}
      </p>
    </div>
  );
}