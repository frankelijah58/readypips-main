"use client";

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface SignalNotificationsProps {
  pair: string;
}

interface Signal {
  _id: string;
  pair: string;
  signal: 'BUY' | 'SELL';
  entry: number;
  tp: number;
  sl: number;
  createdAt: string;
}

interface Notification {
  id: string;
  signal: Signal;
  timestamp: number;
}

export default function SignalNotifications({ pair }: SignalNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastSignalId, setLastSignalId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/sounds/alert.mp3');
    audioRef.current.volume = 0.7;

    // Start polling for new signals
    const interval = setInterval(checkForNewSignals, 5000);

    return () => {
      clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [pair, lastSignalId]);

  const checkForNewSignals = async () => {
    try {
      const response = await fetch(`/api/signals?pair=${pair}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        const latestSignal = data.signals?.[0];

        if (latestSignal && latestSignal._id !== lastSignalId) {
          setLastSignalId(latestSignal._id);
          showNotification(latestSignal);
        }
      }
    } catch (error) {
      console.error('Error checking for new signals:', error);
    }
  };

  const showNotification = (signal: Signal) => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        // console.log('Audio play prevented:', err);
      });
    }

    // Add notification to state
    const newNotification: Notification = {
      id: `${signal._id}-${Date.now()}`,
      signal,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 8000);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚀 New Trading Signal!', {
        body: `${signal.signal} ${signal.pair} @ ${signal.entry}`,
        icon: '/favicon.ico',
        tag: signal._id,
      });
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      {/* Audio element for alert sound */}
      <audio id="pipSound" preload="auto" style={{ display: 'none' }}>
        <source src="/sounds/alert.mp3" type="audio/mpeg" />
      </audio>

      {/* Notification Stack */}
      <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              animate-slide-in-right
              rounded-lg shadow-2xl p-4 border-2
              ${
                notification.signal.signal === 'BUY'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-400'
                  : 'bg-gradient-to-r from-red-500 to-red-600 border-red-400'
              }
            `}
            style={{
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">
                    {notification.signal.signal === 'BUY' ? '🚀' : '⚡'}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    New {notification.signal.signal} Signal!
                  </h3>
                </div>
                <div className="text-white space-y-1">
                  <p className="font-semibold text-lg">
                    {notification.signal.pair}
                  </p>
                  <div className="text-sm bg-white bg-opacity-20 rounded p-2 space-y-1">
                    <p>📍 Entry: <strong>{notification.signal.entry}</strong></p>
                    <p>🎯 Take Profit: <strong>{notification.signal.tp}</strong></p>
                    <p>🛡️ Stop Loss: <strong>{notification.signal.sl}</strong></p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-white hover:text-gray-200 transition-colors"
                aria-label="Close notification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  animation: 'progress 8s linear',
                  transformOrigin: 'left',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }

        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
