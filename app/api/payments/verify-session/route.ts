import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyToken, findUserById, updateUserSubscription } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { subscriptionPlans, verifyPaystackTransaction, verifyPesapalTransaction } from "@/lib/payments";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

interface PaymentRecord {
  userId: string;
  sessionId: string;
  provider: "stripe" | "paystack" | "pesapal";
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  paymentData: any;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    // console.log('🔍 [Verify Session] Starting verification...');
    // console.log('🔍 [Verify Session] Request URL:', request.url);
    // console.log('🔍 [Verify Session] Request method:', request.method);
    
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    
    // console.log('🔍 [Verify Session] Auth header:', !!authHeader);
    // console.log('🔍 [Verify Session] Cookie token:', !!cookieToken);
    
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      // console.log('❌ [Verify Session] No token found');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // console.log('🔍 [Verify Session] Token found, verifying...');
    const decoded = verifyToken(token);
    if (!decoded) {
      // console.log('❌ [Verify Session] Invalid token');
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    // console.log('✅ [Verify Session] Token verified, userId:', decoded.userId);

    const requestBody = await request.json();
    // console.log('🔍 [Verify Session] Request body:', requestBody);
    
    const { sessionId, provider } = requestBody;
    // console.log('🔍 [Verify Session] Session ID:', sessionId);
    // console.log('🔍 [Verify Session] Provider:', provider);

    if (!sessionId || !provider) {
      // console.log('❌ [Verify Session] Missing sessionId or provider');
      // console.log('🔍 [Verify Session] sessionId:', sessionId);
      // console.log('🔍 [Verify Session] provider:', provider);
      return NextResponse.json(
        { error: "Session ID and provider are required" },
        { status: 400 }
      );
    }

    // console.log('🔍 [Verify Session] Connecting to database...');
    const db = await getDatabase();
    const paymentsCollection = db.collection("payments");
    // console.log('✅ [Verify Session] Database connected');

    let paymentData: any;
    let planId: string;
    let planName: string;
    let amount: number;
    let currency: string;
    let status: "pending" | "completed" | "failed";

    // Verify payment with provider
    if (provider === "stripe") {
      try {
        // console.log('🔍 [Verify Session] Verifying Stripe session...');
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        paymentData = session;
        // console.log('🔍 [Verify Session] Stripe session retrieved:', {
        //   id: session.id,
        //   payment_status: session.payment_status,
        //   status: session.status,
        //   metadata: session.metadata,
        //   amount_total: session.amount_total,
        //   currency: session.currency
        // });

        if (session.payment_status === "paid") {
          status = "completed";
          // Map Stripe plan names to our subscription types
          const stripePlan = session.metadata?.plan || "";
          const planMapping: Record<string, string> = {
            starter: "basic",
            professional: "premium", 
            enterprise: "pro"
          };
          planId = planMapping[stripePlan] || stripePlan;
          planName = `${stripePlan.charAt(0).toUpperCase() + stripePlan.slice(1)} Plan`;
          amount = session.amount_total || 0;
          currency = session.currency?.toUpperCase() || "USD";

          // console.log('✅ [Verify Session] Stripe payment completed');
          // console.log('🔍 [Verify Session] Stripe Plan:', stripePlan);
          // console.log('🔍 [Verify Session] Mapped Plan ID:', planId);
          // console.log('🔍 [Verify Session] Plan Name:', planName);
          // console.log('🔍 [Verify Session] Amount:', amount);
          // console.log('🔍 [Verify Session] Currency:', currency);

          // Update user subscription if payment is completed
          if (status === "completed" && planId) {
            const subscriptionEndDate = new Date();
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

            // console.log('🔍 [Verify Session] Updating user subscription...');
            await updateUserSubscription(decoded.userId, {
              subscriptionStatus: "active",
              subscriptionType: planId as "basic" | "premium" | "pro",
              subscriptionEndDate,
            });
            // console.log('✅ [Verify Session] User subscription updated');
          } else {
            // console.log('⚠️ [Verify Session] Payment completed but no planId found');
          }
        } else {
          status = "pending";
          const stripePlan = session.metadata?.plan || "";
          const planMapping: Record<string, string> = {
            starter: "basic",
            professional: "premium", 
            enterprise: "pro"
          };
          planId = planMapping[stripePlan] || stripePlan;
          planName = `${stripePlan.charAt(0).toUpperCase() + stripePlan.slice(1)} Plan`;
          amount = session.amount_total || 0;
          currency = session.currency?.toUpperCase() || "USD";
          // console.log('⏳ [Verify Session] Stripe payment pending, status:', session.payment_status);
        }
      } catch (error) {
        console.error("❌ [Verify Session] Stripe session verification error:", error);
        return NextResponse.json(
          { error: "Failed to verify Stripe session" },
          { status: 400 }
        );
      }
    } else if (provider === "paystack") {
      try {
        // console.log('🔍 [Verify Session] Verifying Paystack transaction...');
        // Verify Paystack transaction
        const paystackData = await verifyPaystackTransaction(sessionId);
        paymentData = paystackData;
        // console.log('🔍 [Verify Session] Paystack data:', paystackData);

        if (paystackData.status && paystackData.data.status === "success") {
          status = "completed";
          planId = paystackData.data.metadata?.planId || "";
          planName = paystackData.data.metadata?.planName || `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`;
          amount = paystackData.data.amount / 100; // Convert from cents (KES)
          currency = paystackData.data.currency;

          // console.log('✅ [Verify Session] Paystack payment completed');
          // console.log('🔍 [Verify Session] Plan ID:', planId);
          // console.log('🔍 [Verify Session] Plan Name:', planName);

          // Update user subscription if payment is completed
          if (status === "completed" && planId) {
            const subscriptionEndDate = new Date();
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

            await updateUserSubscription(decoded.userId, {
              subscriptionStatus: "active",
              subscriptionType: planId as "basic" | "premium" | "pro",
              subscriptionEndDate,
            });
            // console.log('✅ [Verify Session] User subscription updated');
          }
        } else {
          status = "pending";
          planId = paystackData.data.metadata?.planId || "";
          planName = paystackData.data.metadata?.planName || `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`;
          amount = paystackData.data.amount / 100; // Convert from cents (KES)
          currency = paystackData.data.currency;
          // console.log('⏳ [Verify Session] Paystack payment pending');
        }
      } catch (error) {
        console.error("❌ [Verify Session] Paystack verification error:", error);
        return NextResponse.json(
          { error: "Failed to verify Paystack payment" },
          { status: 400 }
        );
      }
    } else if (provider === "pesapal") {
      try {
        // console.log('🔍 [Verify Session] Verifying Pesapal transaction...');
        // Verify Pesapal transaction
        const pesapalData = await verifyPesapalTransaction(sessionId);
        paymentData = pesapalData;
        // console.log('🔍 [Verify Session] Pesapal data:', pesapalData);

        // Check payment status (can be in different fields)
        const isCompleted = 
          pesapalData.payment_status === "COMPLETED" || 
          pesapalData.payment_status_description?.toLowerCase() === "completed" ||
          pesapalData.status_code === 1;

        // console.log('🔍 [Verify Session] Payment completed check:', {
        //   payment_status: pesapalData.payment_status,
        //   payment_status_description: pesapalData.payment_status_description,
        //   status_code: pesapalData.status_code,
        //   isCompleted
        // });

        if (isCompleted) {
          status = "completed";
          
          // Extract plan ID from merchant reference (format: ref_timestamp_randomstring)
          // We need to look up the payment record to get the actual planId
          const db = await getDatabase();
          const existingPayment = await db.collection("payments").findOne({ sessionId });
          
          if (existingPayment) {
            planId = existingPayment.planId || "";
            planName = existingPayment.planName || "Subscription";
            // console.log('🔍 [Verify Session] Found existing payment record:', {
            //   planId: existingPayment.planId,
            //   planName: existingPayment.planName
            // });
          } else {
            // Fallback: try to extract from merchant reference
            planId = pesapalData.merchant_reference?.split('_')[1] || "";
            planName = `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`;
          }

          amount = pesapalData.amount;
          currency = pesapalData.currency;

          // console.log('✅ [Verify Session] Pesapal payment completed');
          // console.log('🔍 [Verify Session] Plan ID:', planId);
          // console.log('🔍 [Verify Session] Plan Name:', planName);

          // Update user subscription if payment is completed
          if (status === "completed" && planId) {
            // Map plan IDs to subscription types and calculate duration
            const planMapping: Record<string, { type: "basic" | "premium" | "pro", days: number }> = {
              "weekly": { type: "basic", days: 7 },
              "monthly": { type: "premium", days: 30 },
              "3months": { type: "pro", days: 90 }
            };

            const planConfig = planMapping[planId.toLowerCase()] || { type: "premium", days: 30 };
            
            // Get current user to check their subscription status
            const db = await getDatabase();
            const { ObjectId } = require("mongodb");
            const currentUser = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) });
            
            if (!currentUser) {
              console.error('❌ [Verify Session] User not found');
            } else {
              const currentType = currentUser.subscriptionType;
              const currentEndDate = currentUser.subscriptionEndDate ? new Date(currentUser.subscriptionEndDate) : null;
              const now = new Date();
              
              // Check if user is on a paid plan that hasn't expired
              const isOnActivePaidPlan = 
                currentType && 
                currentType !== "free" && 
                currentEndDate && 
                currentEndDate > now;

              // console.log('🔍 [Verify Session] Current subscription status:', {
              //   currentType,
              //   currentEndDate: currentEndDate?.toISOString(),
              //   isOnActivePaidPlan,
              //   newPlan: planConfig.type
              // });

              if (isOnActivePaidPlan) {
                // User has active paid subscription - schedule new subscription to start after current expires
                // console.log('⏰ [Verify Session] User has active paid plan - scheduling new subscription');
                
                await db.collection("users").updateOne(
                  { _id: new ObjectId(decoded.userId) },
                  {
                    $set: {
                      pendingSubscription: {
                        type: planConfig.type,
                        planId: planId,
                        planName: planName,
                        duration: planConfig.days,
                        scheduledStartDate: currentEndDate
                      },
                      updatedAt: new Date()
                    }
                  }
                );
                
                // console.log('✅ [Verify Session] Pending subscription scheduled to start on:', currentEndDate.toISOString());
              } else {
                // User is on free plan or expired plan - activate immediately
                // console.log('🚀 [Verify Session] Activating subscription immediately');
                
                const subscriptionStartDate = new Date();
                const subscriptionEndDate = new Date();
                subscriptionEndDate.setDate(subscriptionEndDate.getDate() + planConfig.days);

                await updateUserSubscription(decoded.userId, {
                  subscriptionStatus: "active",
                  subscriptionType: planConfig.type,
                  subscriptionStartDate,
                  subscriptionEndDate,
                });
                
                // console.log('✅ [Verify Session] User subscription activated immediately!');
              }
            }
          }
        } else {
          status = "pending";
          
          // Try to get plan info from existing payment record
          const db = await getDatabase();
          const existingPayment = await db.collection("payments").findOne({ sessionId });
          
          if (existingPayment) {
            planId = existingPayment.planId || "";
            planName = existingPayment.planName || "Subscription";
          } else {
            planId = pesapalData.merchant_reference?.split('_')[1] || "";
            planName = `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`;
          }

          amount = pesapalData.amount;
          currency = pesapalData.currency;
          // console.log('⏳ [Verify Session] Pesapal payment pending, status:', pesapalData.payment_status_description);
        }
      } catch (error) {
        console.error("❌ [Verify Session] Pesapal verification error:", error);
        return NextResponse.json(
          { error: "Failed to verify Pesapal payment" },
          { status: 400 }
        );
      }
    } else {
      // console.log('❌ [Verify Session] Invalid provider:', provider);
      return NextResponse.json(
        { error: "Invalid payment provider" },
        { status: 400 }
      );
    }

    // Record payment in MongoDB
    const paymentRecord: PaymentRecord = {
      userId: decoded.userId,
      sessionId,
      provider,
      planId,
      planName,
      amount,
      currency,
      status,
      paymentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // console.log('🔍 [Verify Session] Payment record created:', {
    //   userId: paymentRecord.userId,
    //   sessionId: paymentRecord.sessionId,
    //   provider: paymentRecord.provider,
    //   planId: paymentRecord.planId,
    //   planName: paymentRecord.planName,
    //   amount: paymentRecord.amount,
    //   currency: paymentRecord.currency,
    //   status: paymentRecord.status
    // });

    // Check if payment already exists
    const existingPayment = await paymentsCollection.findOne({ sessionId });
    // console.log('🔍 [Verify Session] Existing payment found:', !!existingPayment);

    if (existingPayment) {
      // Update existing payment
      // console.log('🔍 [Verify Session] Updating existing payment...');
      await paymentsCollection.updateOne(
        { sessionId },
        {
          $set: {
            ...paymentRecord,
            updatedAt: new Date(),
          },
        }
      );
      // console.log('✅ [Verify Session] Payment updated in database');
    } else {
      // Insert new payment
      // console.log('🔍 [Verify Session] Inserting new payment...');
      await paymentsCollection.insertOne(paymentRecord);
      // console.log('✅ [Verify Session] Payment inserted in database');
    }

    // Get user details
    // console.log('🔍 [Verify Session] Fetching user details...');
    const user = await findUserById(decoded.userId);
    if (!user) {
      // console.log('❌ [Verify Session] User not found');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // console.log('✅ [Verify Session] User found:', {
    //   id: user._id,
    //   email: user.email,
    //   subscriptionStatus: user.subscriptionStatus,
    //   subscriptionType: user.subscriptionType
    // });

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const responseData = {
      success: true,
      payment: {
        sessionId,
        provider,
        planName,
        amount: `${currency} ${amount.toFixed(2)}`,
        status,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionType: user.subscriptionType,
        subscriptionEndDate: user.subscriptionEndDate,
      },
    };

    // console.log('✅ [Verify Session] Verification completed successfully');
    // console.log('🔍 [Verify Session] Response data:', responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
