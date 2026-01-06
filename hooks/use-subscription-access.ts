import { useAuth } from '@/components/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SubscriptionAccessResult {
  hasAccess: boolean;
  loading: boolean;
  daysRemaining: number;
  isFreeTrial: boolean;
  isFreeTrialExpired: boolean;
  isPaidSubscriptionExpired: boolean;
  message?: string;
}

/**
 * Hook to check if user has access to premium features
 * - New users get 3-day free trial
 * - After trial expires, must subscribe
 * - Paid subscriptions expire based on subscriptionEndDate
 */
export function useSubscriptionAccess(): SubscriptionAccessResult {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accessData, setAccessData] = useState<SubscriptionAccessResult>({
    hasAccess: false,
    loading: true,
    daysRemaining: 0,
    isFreeTrial: false,
    isFreeTrialExpired: false,
    isPaidSubscriptionExpired: false,
  });

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(true);
      return;
    }

    const checkAccess = () => {
      const currentDate = new Date();
      
      // console.log('🔍 Checking subscription access for user:', {
      //   email: user.email,
      //   subscriptionType: user.subscriptionType,
      //   subscriptionStatus: user.subscriptionStatus,
      //   freeTrialEndDate: user.freeTrialEndDate,
      //   freeTrialEndDateType: typeof user.freeTrialEndDate,
      //   subscriptionEndDate: user.subscriptionEndDate,
      //   hasFreeTrial: !!(user.freeTrialEndDate),
      // });
      
      // Check if user is on free trial (no paid subscription)
      const isFreeTrial = user.subscriptionType === 'free' || !user.subscriptionType;
      
      // console.log('🎯 Is Free Trial User:', isFreeTrial);
      
      if (isFreeTrial) {
        // Check free trial expiration
        if (user.freeTrialEndDate) {
          // Ensure we're working with a Date object
          const trialEndDate = new Date(user.freeTrialEndDate);
          const timeDiff = trialEndDate.getTime() - currentDate.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          // console.log('📅 Free Trial Check:', {
          //   trialEndDate: trialEndDate.toISOString(),
          //   currentDate: currentDate.toISOString(),
          //   timeDiff,
          //   daysRemaining,
          //   hasAccess: daysRemaining > 0,
          // });
          
          if (daysRemaining > 0) {
            // Free trial is still active
            setAccessData({
              hasAccess: true,
              loading: false,
              daysRemaining,
              isFreeTrial: true,
              isFreeTrialExpired: false,
              isPaidSubscriptionExpired: false,
              message: `Free trial: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`,
            });
          } else {
            // Free trial has expired
            setAccessData({
              hasAccess: false,
              loading: false,
              daysRemaining: 0,
              isFreeTrial: true,
              isFreeTrialExpired: true,
              isPaidSubscriptionExpired: false,
              message: 'Your free trial has expired. Please subscribe to continue.',
            });
          }
        } else {
          // No trial end date set (shouldn't happen, but handle gracefully)
          // console.log('⚠️ Free trial user but no freeTrialEndDate found:', user);
          setAccessData({
            hasAccess: false,
            loading: false,
            daysRemaining: 0,
            isFreeTrial: true,
            isFreeTrialExpired: true,
            isPaidSubscriptionExpired: false,
            message: 'Please subscribe to access this feature.',
          });
        }
      } else {
        // User has a paid subscription - check if it's expired
        if (user.subscriptionEndDate) {
          const subscriptionEndDate = new Date(user.subscriptionEndDate);
          const timeDiff = subscriptionEndDate.getTime() - currentDate.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > 0) {
            // Paid subscription is active
            setAccessData({
              hasAccess: true,
              loading: false,
              daysRemaining,
              isFreeTrial: false,
              isFreeTrialExpired: false,
              isPaidSubscriptionExpired: false,
              message: `${user.subscriptionType?.toUpperCase()} plan: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`,
            });
          } else {
            // Paid subscription has expired
            setAccessData({
              hasAccess: false,
              loading: false,
              daysRemaining: 0,
              isFreeTrial: false,
              isFreeTrialExpired: false,
              isPaidSubscriptionExpired: true,
              message: 'Your subscription has expired. Please renew to continue.',
            });
          }
        } else {
          // Has paid subscription type but no end date (shouldn't happen)
          setAccessData({
            hasAccess: true,
            loading: false,
            daysRemaining: 999,
            isFreeTrial: false,
            isFreeTrialExpired: false,
            isPaidSubscriptionExpired: false,
            message: `${user.subscriptionType?.toUpperCase()} plan active`,
          });
        }
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [user, authLoading]);

  return accessData;
}

/**
 * Hook to check subscription access without auto-redirecting
 * Components should handle the redirect logic based on hasAccess
 * This prevents premature redirects during loading states
 */
export function useRequireSubscription(redirectPath: string = '/subscription') {
  const accessData = useSubscriptionAccess();
  
  // Return access data - let component decide when to show subscription UI
  // Don't auto-redirect to allow proper loading states and prevent race conditions
  return accessData;
}
