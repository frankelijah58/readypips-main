"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  Shield, 
  Clock,
  Award,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface SubscriptionInfo {
  status: string;
  type: string | null;
  endDate: string | null;
  freeTrialEndDate?: string | null;
  daysRemaining: number;
  hoursRemaining: number;
  isExpiringSoon: boolean;
  isActive: boolean;
  isFreePlan: boolean;
  isFreeTrialExpired: boolean;
  freeTrialDaysRemaining: number;
  pendingSubscription?: {
    type: string;
    planId: string;
    planName: string;
    duration: number;
    scheduledStartDate: string;
  } | null;
}

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setEmail(user.email || "");
    
    // Fetch subscription info
    fetchSubscriptionInfo();
  }, [user, router]);

  const fetchSubscriptionInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/subscriptions/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data.subscription);
      }
    } catch (error) {
      console.error("Error fetching subscription info:", error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update profile');
      }

      toast.success('✅ Profile updated successfully!');
      await checkAuth();
      router.refresh();
    } catch (error: any) {
      console.error('Profile update error', error);
      toast.error(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const getSubscriptionBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600 text-white";
      case "expired":
        return "bg-red-600 text-white";
      case "inactive":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getPlanDisplayName = (type: string | null) => {
    if (!type) return "Free Plan";
    const planNames: Record<string, string> = {
      basic: "Weekly Plan",
      premium: "Monthly Plan",
      pro: "3 Months Plan",
      free: "Free Plan"
    };
    return planNames[type.toLowerCase()] || type;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Navigation />

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account information and subscription
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        First Name
                      </label>
                      <Input 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                        className="border-gray-300 dark:border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Last Name
                      </label>
                      <Input 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                        className="border-gray-300 dark:border-gray-700"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        value={email} 
                        readOnly 
                        className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  {user.emailVerified && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-400">
                        Email verified
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/signals')}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Details Card */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Member Since
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {user.image && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.image} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Profile Picture
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            From Google Account
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Subscription Info */}
          <div className="space-y-6">
            {/* Subscription Status Card */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : subscriptionInfo ? (
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="text-center">
                      <Badge className={`${getSubscriptionBadgeColor(subscriptionInfo.status)} text-sm px-4 py-2`}>
                        {subscriptionInfo.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Plan Name */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-green-600" />
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {getPlanDisplayName(subscriptionInfo.type)}
                        </p>
                      </div>
                    </div>

                    {/* Subscription Details - For Both Free Trial and Paid Plans */}
                    {subscriptionInfo.isActive && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        {/* Free Trial Information */}
                        {subscriptionInfo.isFreePlan && subscriptionInfo.freeTrialEndDate && (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              {/* <span className="text-sm text-gray-600 dark:text-gray-400">
                                Free Trial
                              </span>
                              <Badge className="bg-blue-600 text-white text-xs">
                                {subscriptionInfo.freeTrialDaysRemaining} day{subscriptionInfo.freeTrialDaysRemaining !== 1 ? 's' : ''} left
                              </Badge> */}
                            </div>
                            
                            <div className="flex items-center justify-between mb-2">
                              {/* <span className="text-sm text-gray-600 dark:text-gray-400">
                                Trial Expires
                              </span>
                              <span className={`text-sm font-semibold ${
                                subscriptionInfo.freeTrialDaysRemaining <= 1
                                  ? 'text-orange-600' 
                                  : 'text-green-600'
                              }`}>
                                {subscriptionInfo.freeTrialEndDate && new Date(subscriptionInfo.freeTrialEndDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span> */}
                            </div>

                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-xs text-blue-700 dark:text-blue-400">
                                🎁 <strong>Free Trial Active!</strong> You have full access to limited features for {subscriptionInfo.freeTrialDaysRemaining} more day{subscriptionInfo.freeTrialDaysRemaining !== 1 ? 's' : ''}. Subscribe before trial ends to continue enjoying premium features.
                              </p>
                            </div>

                            {subscriptionInfo.freeTrialDaysRemaining <= 1 && (
                              <div className="flex items-start gap-2 p-3 mt-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-orange-700 dark:text-orange-400">
                                  <strong>Trial Ending Soon!</strong> Your free trial expires in less than {subscriptionInfo.freeTrialDaysRemaining === 0 ? '24 hours' : '1 day'}. Subscribe now to avoid losing access to premium features.
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Paid Subscription Information */}
                        {!subscriptionInfo.isFreePlan && subscriptionInfo.endDate && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Days Remaining
                              </span>
                              <span className={`text-sm font-semibold ${
                                subscriptionInfo.isExpiringSoon 
                                  ? 'text-orange-600' 
                                  : 'text-green-600'
                              }`}>
                                {subscriptionInfo.daysRemaining} days
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Expires On
                              </span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {subscriptionInfo.endDate && new Date(subscriptionInfo.endDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>

                            {subscriptionInfo.isExpiringSoon && (
                              <div className="flex items-start gap-2 p-3 mt-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-orange-700 dark:text-orange-400">
                                  Your subscription is expiring soon. Renew to continue enjoying premium features.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-2">
                      {subscriptionInfo.isFreePlan ? (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => router.push("/subscription")}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          {subscriptionInfo.isFreeTrialExpired ? 'Subscribe Now' : 'Upgrade to Premium'}
                        </Button>
                      ) : subscriptionInfo.status !== "active" ? (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => router.push("/subscription")}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Renew Subscription
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => router.push("/subscription")}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Manage Subscription
                        </Button>
                      )}
                    </div>

                    {/* Free Plan Info */}
                    {subscriptionInfo.isFreePlan && !subscriptionInfo.isFreeTrialExpired && (
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
                        <p>🎁 Enjoying your free trial? Upgrade for unlimited access!</p>
                      </div>
                    )}

                    {subscriptionInfo.isFreeTrialExpired && (
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
                        <p>⏰ Free trial expired - Subscribe to continue</p>
                      </div>
                    )}

                    {/* Pending Subscription Alert */}
                    {subscriptionInfo.pendingSubscription && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                              Upcoming Subscription
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              Your <strong>{getPlanDisplayName(subscriptionInfo.pendingSubscription.type)}</strong> will activate on{' '}
                              <strong>
                                {subscriptionInfo.pendingSubscription.scheduledStartDate && new Date(subscriptionInfo.pendingSubscription.scheduledStartDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No subscription info</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/signals")}
                >
                  View Signals
                </Button>
                {/* <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/charts")}
                >
                  Trading Charts
                </Button> */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/support")}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
