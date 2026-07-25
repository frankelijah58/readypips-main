// lib/tradingview-private.ts

let cachedSession: {
  cookies: string;
  csrf: string;
  expires: number;
} | null = null;

function parseCookies(headers: Headers) {
  const raw = headers.get("set-cookie");
  if (!raw) return "";
  return raw
    .split(",")
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function loginTradingView() {
  // 1️⃣ Initial visit
  const initRes = await fetch("https://www.tradingview.com/", {
    method: "GET",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
    },
  });

  const initHtml = await initRes.text();
  const initCookies = parseCookies(initRes.headers);

  // ✅ Extract CSRF from HTML
  const csrfMatch =
    initHtml.match(/name="csrf-token"\s+content="([^"]+)"/) ||
    initHtml.match(/csrf-token" content="([^"]+)"/);

  if (!csrfMatch) {
    throw new Error("Failed to extract CSRF token from TradingView HTML");
  }

  const csrf = csrfMatch[1];

  // 2️⃣ Login
  const loginRes = await fetch("https://www.tradingview.com/accounts/signin/", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://www.tradingview.com",
      referer: "https://www.tradingview.com/",
      cookie: initCookies,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
      "x-csrf-token": csrf,
    },
    body: new URLSearchParams({
      username: process.env.TV_USER!,
      password: process.env.TV_PASS!,
      remember: "on",
    }),
    redirect: "manual",
  });

  const loginCookies = parseCookies(loginRes.headers);
  const mergedCookies = [initCookies, loginCookies].filter(Boolean).join("; ");

  cachedSession = {
    cookies: mergedCookies,
    csrf,
    expires: Date.now() + 1000 * 60 * 20,
  };

  return cachedSession;
}

async function getSession() {
  if (cachedSession && cachedSession.expires > Date.now()) {
    return cachedSession;
  }
  return loginTradingView();
}

export async function grantTradingViewAccess(username: string) {
  const session = await getSession();

  const res = await fetch("https://www.tradingview.com/pine_perm/add/", {
    method: "POST",
    headers: {
      cookie: session.cookies,
      "x-csrf-token": session.csrf,
      "content-type": "application/json",
      referer: "https://www.tradingview.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
    },
    body: JSON.stringify({
      username,
      script_id: process.env.TV_SCRIPT_ID,
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("TradingView Response:", text);
    throw new Error(text);
  }

  return text;
}
