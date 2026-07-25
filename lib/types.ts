export interface Signal {
  _id?: string;
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  target: number;
  stopLoss: number;
  confidence: number;
  timeframe: "1d" | "1wk" | "1mo"; // Only valid Yahoo Finance intervals
  description: string;
  createdAt: Date;
  isActive: boolean;
  profitLoss?: number;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  indicators?: any;
  reasoning?: string[];
}
 