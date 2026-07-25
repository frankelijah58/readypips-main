import crypto from "crypto";

const MPESA_BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function getTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function parseJsonSafely(res: Response, fallbackMessage: string) {
  const rawText = await res.text();

  if (!rawText) {
    throw new Error(`${fallbackMessage}: empty response body`);
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(`${fallbackMessage}: ${rawText}`);
  }
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");

  if (/^2547\d{8}$/.test(cleaned)) return cleaned;
  if (/^07\d{8}$/.test(cleaned)) return `254${cleaned.slice(1)}`;
  if (/^\+2547\d{8}$/.test(cleaned)) return cleaned.slice(1);

  throw new Error("Invalid Safaricom number. Use 07XXXXXXXX or 2547XXXXXXXX.");
}

export function buildMpesaPassword(
  shortcode: string,
  passkey: string,
  timestamp: string
) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export async function getMpesaAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error("Missing M-Pesa consumer key/secret");
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: "no-store",
    }
  );

  const data = await parseJsonSafely(res, "Invalid access token response from M-Pesa");

  if (!res.ok || !data?.access_token) {
    throw new Error(
      data?.errorMessage ||
        data?.error ||
        data?.message ||
        "Failed to get M-Pesa access token"
    );
  }

  return data.access_token;
}

export async function initiateStkPush(params: {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
}) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("Missing M-Pesa config");
  }

  const timestamp = getTimestamp();
  const password = buildMpesaPassword(shortcode, passkey, timestamp);
  const token = await getMpesaAccessToken();
  const normalizedPhone = normalizePhoneNumber(params.phoneNumber);

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(params.amount),
    PartyA: normalizedPhone,
    PartyB: shortcode,
    PhoneNumber: normalizedPhone,
    CallBackURL: callbackUrl,
    AccountReference: params.accountReference,
    TransactionDesc: params.transactionDesc,
  };

  console.log("M-Pesa STK payload:", {
    ...payload,
    Password: "[REDACTED]",
  });

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely(res, "Invalid STK Push response from M-Pesa");

  if (!res.ok) {
    throw new Error(
      data?.errorMessage ||
        data?.ResponseDescription ||
        data?.responseDescription ||
        data?.message ||
        "STK Push failed"
    );
  }

  if (data?.ResponseCode && data.ResponseCode !== "0") {
    throw new Error(
      data?.ResponseDescription ||
        data?.CustomerMessage ||
        "M-Pesa rejected the STK push request"
    );
  }

  return data;
}

export async function queryStkPush(params: {
  checkoutRequestId: string;
}) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  if (!shortcode || !passkey) {
    throw new Error("Missing M-Pesa config");
  }

  const timestamp = getTimestamp();
  const password = buildMpesaPassword(shortcode, passkey, timestamp);
  const token = await getMpesaAccessToken();

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: params.checkoutRequestId,
  };

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely(res, "Invalid STK Query response from M-Pesa");

  if (!res.ok) {
    throw new Error(
      data?.errorMessage ||
        data?.ResponseDescription ||
        data?.responseDescription ||
        data?.message ||
        "STK query failed"
    );
  }

  return data;
}

export function generateReference(prefix = "RDP") {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}