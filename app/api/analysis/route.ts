import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Get pair from query params
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair') || 'EURUSD';

    // Connect to database
    const db = await getDatabase();

    // Fetch recent signals for this pair to determine trend
    // Note: signals collection uses 'symbol' field, not 'pair'
    const recentSignals = await db
      .collection('signals')
      .find({ symbol: pair })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Calculate trend based on recent signals
    const buySignals = recentSignals.filter((s: any) => s.signal === 'BUY').length;
    const sellSignals = recentSignals.filter((s: any) => s.signal === 'SELL').length;

    let trend: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
    if (buySignals > sellSignals + 2) trend = 'Bullish';
    else if (sellSignals > buySignals + 2) trend = 'Bearish';

    // Calculate momentum based on signal frequency
    const momentum = recentSignals.length >= 7 ? 'Strong' : 
                     recentSignals.length >= 4 ? 'Moderate' : 'Weak';

    // Calculate support and resistance from recent signals
    const entries = recentSignals.map((s: any) => s.entry);
    const support = entries.length > 0 ? Math.min(...entries) : 1.0840;
    const resistance = entries.length > 0 ? Math.max(...entries) : 1.0920;

    // Determine volatility
    const priceRange = resistance - support;
    const volatility = priceRange > 0.008 ? 'High' : 
                       priceRange > 0.004 ? 'Medium' : 'Low';

    // Generate prediction
    let prediction = '';
    if (trend === 'Bullish') {
      prediction = `Strong upward momentum detected. Expect continued movement toward ${resistance.toFixed(4)} resistance.`;
    } else if (trend === 'Bearish') {
      prediction = `Downward pressure evident. Watch for potential test of ${support.toFixed(4)} support level.`;
    } else {
      prediction = `Market consolidation phase. Range-bound trading expected between ${support.toFixed(4)} and ${resistance.toFixed(4)}.`;
    }

    const analysis = {
      trend,
      momentum,
      prediction,
      support: parseFloat(support.toFixed(4)),
      resistance: parseFloat(resistance.toFixed(4)),
      volatility,
      lastUpdated: new Date().toISOString(),
      signalCount: recentSignals.length,
      buySignals,
      sellSignals,
    };

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
