'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Shield,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { Signal } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

interface SignalCardProps {
  signal: Signal;
  isActive?: boolean;
}

export function SignalCard({ signal, isActive = false }: SignalCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const signalText = `
${signal.type} ${signal.symbol}
Entry: ${signal.price}
Target: ${signal.target}
Stop Loss: ${signal.stopLoss}
Confidence: ${signal.confidence}%
Timeframe: ${signal.timeframe}
    `.trim();

    try {
      await navigator.clipboard.writeText(signalText);
      setCopied(true);
      toast.success('Signal copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy signal');
    }
  };

  const isBuy = signal.type === 'BUY';
  const confidenceColor = signal.confidence >= 80 ? 'text-green-400' : 
                         signal.confidence >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <Card className={`signal-card ${isActive ? 'signal-active' : ''} animate-fade-in-scale`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${isBuy ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
              {isBuy ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{signal.symbol}</h3>
              <p className="text-sm text-muted-foreground">{signal.description}</p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${isBuy ? 'signal-buy' : 'signal-sell'} font-semibold`}
          >
            {signal.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Target className="w-4 h-4 mr-1" />
              Entry Price
            </div>
            <div className="font-mono text-lg font-semibold">
              {signal.price.toFixed(5)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 mr-1" />
              Target
            </div>
            <div className="font-mono text-lg font-semibold text-green-400">
              {signal.target.toFixed(5)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Shield className="w-4 h-4 mr-1" />
              Stop Loss
            </div>
            <div className="font-mono text-lg font-semibold text-red-400">
              {signal.stopLoss.toFixed(5)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Timeframe
            </div>
            <div className="font-semibold">
              {signal.timeframe}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Confidence: <span className={`font-semibold ${confidenceColor}`}>
                {signal.confidence}%
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-primary"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Add default export
export default SignalCard;