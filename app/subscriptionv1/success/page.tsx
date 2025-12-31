'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      console.log('🔍 [Subscription Success] Page loaded');
      console.log('🔍 [Subscription Success] Search params:', searchParams.toString());
      
      // Get Paystack parameters
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      
      console.log('🔍 [Subscription Success] Reference:', reference);
      console.log('🔍 [Subscription Success] Trxref:', trxref);
      
      if (reference || trxref) {
        const paymentRef = reference || trxref;
        console.log('🔍 [Subscription Success] Payment reference found:', paymentRef);
        
        // Redirect to the main success page with the payment reference
        const successUrl = `/signals/success?reference=${paymentRef}`;
        console.log('🔍 [Subscription Success] Redirecting to:', successUrl);
        
        // Small delay to show loading state
        setTimeout(() => {
          router.push(successUrl);
        }, 1000);
      } else {
        console.log('❌ [Subscription Success] No payment reference found');
        // Redirect to dashboard if no payment reference
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    };

    handleRedirect();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-black dark:text-white">
              Payment Received!
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Processing your subscription...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">
                Verifying payment and activating subscription
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Please wait while we process your payment and activate your subscription.
            </p>
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
