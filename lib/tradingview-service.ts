// lib/tradingview-service.ts
// import { chromium } from "playwright";

// export async function grantTradingViewAccess(tvUsername: string) {
//   if (!tvUsername) throw new Error("Missing TradingView username");

//   const browser = await chromium.launch({ headless: true });
//   const page = await browser.newPage();

//   try {
//     await page.goto("https://www.tradingview.com/accounts/signin/");
//     await page.fill("input[name='username']", process.env.TV_USER!);
//     await page.fill("input[name='password']", process.env.TV_PASS!);
//     await page.click("button[type='submit']");

//     await page.waitForLoadState("networkidle");

//     await page.goto("https://www.tradingview.com/script/YOUR_SCRIPT_ID/");

//     await page.waitForSelector("text=Manage access");
//     await page.click("text=Manage access");

//     await page.fill("input", tvUsername);
//     await page.click("text=Add");

//     await page.waitForTimeout(1000);
//   } finally {
//     await browser.close();
//   }
// }
