"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import LiveChart from '@/components/live-chart';
import SignalNotifications from '@/components/signal-notifications';
import AnalysisPanel from '@/components/analysis-panel';

export default function ChartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPair, setSelectedPair] = useState('EURUSD');
  const [showAnalysis, setShowAnalysis] = useState(true);

  useEffect(() => {
    // Check if user has access to charts
    if (!user) {
      router.push('/login');
      return;
    }

    // Check subscription status
    if (user.subscriptionStatus !== 'active' && !user.role?.includes('admin')) {
      router.push('/subscription');
      return;
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Home className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Home</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Live Trading Chart
              </h1>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="EURUSD">EUR/USD</option>
                <option value="GBPUSD">GBP/USD</option>
                <option value="USDJPY">USD/JPY</option>
                <option value="AUDUSD">AUD/USD</option>
                <option value="USDCAD">USD/CAD</option>
                <option value="XAUUSD">XAU/USD (Gold)</option>
              </select>
            </div>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAnalysis ? 'Hide' : 'Show'} Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto p-2">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          {/* Chart Section */}
          <div className={`${showAnalysis ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <LiveChart pair={selectedPair} />
          </div>

          {/* Analysis Panel */}
          {showAnalysis && (
            <div className="lg:col-span-1">
              <AnalysisPanel pair={selectedPair} />
            </div>
          )}
        </div>
      </div>

      {/* Signal Notifications Component */}
      <SignalNotifications pair={selectedPair} />
    </div>
  );
}
