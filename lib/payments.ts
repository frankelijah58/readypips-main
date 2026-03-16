import Stripe from "stripe";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export type PaymentProvider = "stripe" | "paystack" | "pesapal";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number; // in days
  features: string[];
  stripePriceId?: string;
  paystackPlanCode?: string;
  pesapalPlanCode?: string;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "weekly",
    name: "Weekly",
    price: 19.89,
    currency: "USD",
    duration: 7,
    features: [
      "15 signals per day",
      "Basic market analysis",
      "Email notifications",
      "Mobile app access",
      "Basic technical indicators",
      "Market news updates",
      "7-day access",
    ],
    stripePriceId: "price_weekly",
    paystackPlanCode: "PLN_weekly",
    pesapalPlanCode: "PES_weekly",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 49.89,
    currency: "USD",
    duration: 30,
    features: [
      "35 signals per day",
      "Advanced market analysis",
      "Real-time notifications",
      "Priority support",
      "Advanced technical indicators",
      "AI-powered insights",
      "Risk management tools",
      "Portfolio tracking",
      "30-day access",
    ],
    stripePriceId: "price_monthly",
    paystackPlanCode: "PLN_monthly",
    pesapalPlanCode: "PES_monthly",
  },
  {
    id: "3months",
    name: "3 Months",
    price: 129.89,
    currency: "USD",
    duration: 90,
    features: [
      "Unlimited signals",
      "Advanced market analysis",
      "Real-time notifications",
      "Priority support",
      "Advanced technical indicators",
      "AI-powered insights",
      "Risk management tools",
      "Portfolio tracking",
      "Extended analysis",
      "90-day access",
      "Save KES 500 vs monthly",
    ],
    stripePriceId: "price_3months",
    paystackPlanCode: "PLN_3months",
    pesapalPlanCode: "PES_3months",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getPlanById(planId: string): SubscriptionPlan {
  const plan = subscriptionPlans.find((p) => p.id === planId);
  if (!plan) {
    throw new Error("Invalid plan ID");
  }
  return plan;
}

export function generateReference(prefix = "ref"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Convert major amount to smallest unit for Stripe/Paystack where needed.
 * Example: 19.89 => 1989
 */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * If you want a simple static USD->KES conversion for Pesapal,
 * set USD_TO_KES_RATE in env. Example: 130
 */
export function convertUsdToKes(amountUsd: number): number {
  const rate = Number(process.env.USD_TO_KES_RATE || "130");
  return Math.round(amountUsd * rate * 100) / 100;
}

/* =========================================================
   STRIPE
========================================================= */

export async function createStripeCheckoutSession(
  planId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const plan = getPlanById(planId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: `${plan.name} Subscription`,
            description: plan.features.join(", "),
          },
          unit_amount: toSmallestUnit(plan.price),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planId,
      planName: plan.name,
      provider: "stripe",
    },
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a URL");
  }

  return session.url;
}

export function validateStripeWebhook(payload: string, signature: string): any {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
}

/* =========================================================
   PAYSTACK
========================================================= */

export async function initializePaystack(
  planId: string,
  userEmail: string,
  amount: number // amount in smallest unit for KES
): Promise<{ reference: string; authorization_url: string }> {
  const plan = getPlanById(planId);

  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  const reference = generateReference("paystack");

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: userEmail,
      amount,
      currency: "KES",
      reference,
      callback_url: `${getAppUrl()}/subscription/success`,
      metadata: {
        provider: "paystack",
        planId,
        planName: plan.name,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: plan.name,
          },
        ],
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Paystack API error: ${data.message || response.statusText}`);
  }

  if (!data.status || !data.data?.authorization_url || !data.data?.reference) {
    throw new Error("Invalid response from Paystack API");
  }

  return {
    reference: data.data.reference,
    authorization_url: data.data.authorization_url,
  };
}

export function validatePaystackWebhook(
  payload: any,
  signature: string
): boolean {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return false;
  }

  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest("hex");

    return hash === signature;
  } catch {
    return false;
  }
}

export async function verifyPaystackTransaction(reference: string): Promise<any> {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Paystack verification error: ${data.message || response.statusText}`
    );
  }

  return data;
}

/* =========================================================
   PESAPAL
========================================================= */

export interface PesapalOrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  redirect_mode?: "TOP_WINDOW" | "PARENT_WINDOW";
  branch?: string;
  cancellation_url?: string;
  billing_address: {
    phone_number?: string;
    email_address?: string;
    country_code?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

export interface PesapalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: {
    type?: string | null;
    code?: string | null;
    message?: string | null;
  } | null;
  status: string;
  message?: string;
}

export interface PesapalTokenResponse {
  token: string;
  expiryDate?: string;
  error?: {
    type?: string | null;
    code?: string | null;
    message?: string | null;
  } | null;
}

export interface PesapalTransactionStatusResponse {
  payment_method?: string;
  amount?: number;
  created_date?: string;
  confirmation_code?: string;
  payment_status_description?: string;
  description?: string;
  message?: string;
  payment_account?: string;
  call_back_url?: string;
  status_code?: number;
  merchant_reference?: string;
  currency?: string;
  status?: string;
  error?: {
    error_type?: string | null;
    code?: string | null;
    message?: string | null;
    call_back_url?: string | null;
  } | null;
}

export interface PesapalRegisterIPNResponse {
  url: string;
  created_date?: string;
  ipn_id: string;
  notification_type?: string;
  ipn_notification_type?: string;
  error?: {
    type?: string | null;
    code?: string | null;
    message?: string | null;
  } | null;
  status?: string;
  message?: string;
}

function getPesapalBaseUrl(): string {
  const isProduction = process.env.PESAPAL_USE_PRODUCTION === "true";
  return isProduction
    ? "https://pay.pesapal.com/v3/api"
    : "https://cybqa.pesapal.com/pesapalv3/api";
}

export async function getPesapalAccessToken(): Promise<string> {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("Pesapal credentials not configured");
  }

  const response = await fetch(`${getPesapalBaseUrl()}/Auth/RequestToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  const data: PesapalTokenResponse = await response.json();

  if (!response.ok || !data.token) {
    const errorMessage =
      data?.error?.message || "Failed to get Pesapal access token";
    throw new Error(errorMessage);
  }

  return data.token;
}

export async function registerPesapalIPN(): Promise<string> {
  const accessToken = await getPesapalAccessToken();
  const ipnUrl = `${getAppUrl()}/api/payments/pesapal-webhook`;

  const response = await fetch(
    `${getPesapalBaseUrl()}/URLSetup/RegisterIPN`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: "POST",
      }),
    }
  );

  const data: PesapalRegisterIPNResponse = await response.json();

  if (!response.ok || !data.ipn_id) {
    const errorMessage =
      data?.error?.message || data?.message || "Failed to register Pesapal IPN";
    throw new Error(errorMessage);
  }

  return data.ipn_id;
}

export async function getPesapalNotificationId(): Promise<string> {
  const existing = process.env.PESAPAL_NOTIFICATION_ID;

  if (
    existing &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing)
  ) {
    return existing;
  }

  return await registerPesapalIPN();
}

export async function initializePesapal(
  planId: string,
  userEmail: string,
  userPhone: string,
  userFirstName: string,
  userLastName: string,
  amountKes?: number
): Promise<{ order_tracking_id: string; redirect_url: string }> {
  const plan = getPlanById(planId);

  if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
    throw new Error("Pesapal credentials not configured");
  }

  const isMockMode = process.env.PESAPAL_MOCK_MODE === "true";
  if (isMockMode) {
    return {
      order_tracking_id: generateReference("pesapal_mock"),
      redirect_url:
        "https://cybqa.pesapal.com/pesapaliframe/PesapalIframe3/Index/?OrderTrackingId=mock_order_123",
    };
  }

  const isTestMode = process.env.PESAPAL_TEST_MODE === "true";
  const testAmount = Number(process.env.PESAPAL_TEST_AMOUNT || "5");

  let finalAmount = amountKes;

  if (!finalAmount || Number.isNaN(finalAmount)) {
    if (plan.currency === "USD") {
      finalAmount = convertUsdToKes(plan.price);
    } else {
      finalAmount = plan.price;
    }
  }

  if (isTestMode) {
    finalAmount = testAmount;
  }

  const accessToken = await getPesapalAccessToken();
  const notificationId = await getPesapalNotificationId();
  const merchantReference = generateReference(`RP_${planId}`);

  const orderRequest: PesapalOrderRequest = {
    id: merchantReference,
    currency: "KES",
    amount: finalAmount,
    description: `Ready Pips ${plan.name} Subscription`,
    callback_url: `${getAppUrl()}/signals/success`,
    cancellation_url: `${getAppUrl()}/pricing?payment=cancelled`,
    notification_id: notificationId,
    redirect_mode: "TOP_WINDOW",
    branch: "Ready Pips - HQ",
    billing_address: {
      email_address: userEmail,
      phone_number: userPhone,
      country_code: "KE",
      first_name: userFirstName,
      last_name: userLastName,
      city: "Nairobi",
    },
  };

  const response = await fetch(
    `${getPesapalBaseUrl()}/Transactions/SubmitOrderRequest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderRequest),
    }
  );

  const data: PesapalOrderResponse = await response.json();

  if (!response.ok || data.status !== "200" || !data.redirect_url) {
    const errorMessage =
      data?.error?.message || data?.message || "Pesapal order creation failed";
    throw new Error(errorMessage);
  }

  return {
    order_tracking_id: data.order_tracking_id,
    redirect_url: data.redirect_url,
  };
}

export async function verifyPesapalTransaction(
  orderTrackingId: string
): Promise<PesapalTransactionStatusResponse> {
  if (!orderTrackingId) {
    throw new Error("orderTrackingId is required");
  }

  const accessToken = await getPesapalAccessToken();

  const response = await fetch(
    `${getPesapalBaseUrl()}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
      orderTrackingId
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const data: PesapalTransactionStatusResponse = await response.json();

  if (!response.ok) {
    const errorMessage =
      data?.error?.message || data?.message || "Pesapal verification failed";
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Pesapal usually works best when you verify transaction status server-to-server.
 * This helper interprets a successful completed payment.
 */
export function isPesapalPaymentCompleted(
  status: PesapalTransactionStatusResponse
): boolean {
  return (
    (status.payment_status_description || "").toUpperCase() === "COMPLETED"
  );
}