// import { chromium } from "playwright";
// import { MongoClient, ObjectId } from "mongodb";
// import "dotenv/config";

// const client = new MongoClient(process.env.MONGO_URI);

// async function run() {
//   await client.connect();
//   const db = client.db();

//   console.log("✅ Worker running");

//   while (true) {
//     const job = await db.collection("tradingview_jobs").findOneAndUpdate(
//       { status: "pending" },
//       {
//         $set: {
//           status: "processing",
//           updatedAt: new Date(),
//         },
//         $inc: { attempts: 1 },
//       },
//       { returnDocument: "after" }
//     );

//     if (!job.value) {
//       await sleep(3000);
//       continue;
//     }

//     try {
//       await processJob(job.value, db);
//     } catch (err) {
//       console.error("Job failed:", err.message);

//       await db.collection("tradingview_jobs").updateOne(
//         { _id: job.value._id },
//         {
//           $set: {
//             status: "failed",
//             error: err.message,
//             updatedAt: new Date(),
//           },
//         }
//       );
//     }
//   }
// }

// async function processJob(job, db) {
//   console.log("▶ Processing:", job.tradingviewUsername);

//   const browser = await chromium.launch({ headless: true });
//   const page = await browser.newPage();

//   // Login
//   await page.goto("https://www.tradingview.com/accounts/signin/");
//   await page.fill('input[name="username"]', process.env.TV_USER);
//   await page.fill('input[name="password"]', process.env.TV_PASS);
//   await page.click('button[type="submit"]');
//   await page.waitForLoadState("networkidle");

//   // Script page
//   await page.goto(process.env.TV_SCRIPT_URL);
//   await page.waitForTimeout(2000);

//   // Open invite panel
//   await page.click('text=Invite-only');
//   await page.fill('input[placeholder*="username"]', job.tradingviewUsername);
//   await page.click('text=Add');

//   await page.waitForTimeout(2000);

//   await browser.close();

//   await db.collection("tradingview_jobs").updateOne(
//     { _id: job._id },
//     {
//       $set: {
//         status: "success",
//         updatedAt: new Date(),
//       },
//     }
//   );

//   console.log("✅ Granted:", job.tradingviewUsername);
// }

// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// run();
