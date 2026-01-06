'use client';

import { useEffect } from 'react';

export function SignalServiceProvider() {
  useEffect(() => {
    // Start the signal generation service when the app loads
    const startSignalService = async () => {
      try {
        const response = await fetch('/api/signals/start', {
          method: 'POST',
        });
        
        if (response.ok) {
          // console.log('Signal generation service started successfully');
        } else {
          // console.log('Signal generation service already running or failed to start');
        }
      } catch (error) {
        console.error('Error starting signal generation service:', error);
      }
    };

    // Start the service after a short delay to ensure the app is fully loaded
    const timer = setTimeout(startSignalService, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
} 