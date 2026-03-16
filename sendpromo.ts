import nodemailer from "nodemailer";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing in .env.local");
}

if (!dbName) {
  throw new Error("MONGODB_DB_NAME is missing in .env.local");
}

if (
  !process.env.SMTP_HOST ||
  !process.env.SMTP_PORT ||
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS ||
  !process.env.SMTP_FROM_EMAIL
) {
  throw new Error("SMTP variables are missing in .env.local");
}

const client = new MongoClient(mongoUri);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendPromo() {
  let connected = false;

  try {
    await client.connect();
    connected = true;
    console.log("MongoDB connected");

    const db = client.db(dbName);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log("SMTP connection successful");

    const testMode = process.env.TEST_MODE === "true";

    const users = testMode
      ? [
          {
            email: "codepappi@gmail.com",
            firstName: "Kenneth",
            lastName: "Kuria",
          },
        ]
      : await db
          .collection("users")
          .find({
            email: { $exists: true, $nin: [null, ""] },
          })
          .project({
            email: 1,
            firstName: 1,
            lastName: 1,
          })
          .limit(10) // start with 10 first, then increase or remove
          .toArray();

    if (!users.length) {
      console.log("No users found to email.");
      return;
    }

    console.log(`Preparing to send emails to ${users.length} user(s)...`);

    const logoUrl =
      process.env.EMAIL_LOGO_URL || "https://readypips.com/logo.png";

    let successCount = 0;
    let failedCount = 0;

    for (const user of users) {
      if (!user.email) continue;

      const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Trader";

      try {
        const unsubscribeUrl = `${
          process.env.APP_URL || "https://readypips.com"
        }/unsubscribe?email=${encodeURIComponent(user.email)}`;

        const info = await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || "ReadyPips"}" <${
            process.env.SMTP_FROM_EMAIL
          }>`,
          to: user.email,
          subject: "ReadyPips Updates",
          html: `
            <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
              <div style="max-width:620px;margin:0 auto;padding:30px 20px;">
                <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

                  <div style="background:#071533;padding:28px 30px;text-align:center;">
                    <img
                      src="${logoUrl}"
                      alt="ReadyPips Logo"
                      style="max-width:140px;height:auto;display:block;margin:0 auto 16px auto;"
                    />
                    <h1 style="margin:0;font-size:32px;line-height:1.2;color:#ffffff;font-weight:700;">
                      ReadyPips
                    </h1>
                    <p style="margin:10px 0 0;color:#cbd5e1;font-size:15px;">
                      Trading insights and platform updates
                    </p>
                  </div>

                  <div style="padding:34px 30px;">
                    <h2 style="margin:0 0 18px;font-size:22px;color:#0f172a;">
                      Hello ${fullName},
                    </h2>

                    <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#334155;">
                      We have new updates and promotional offers available on ReadyPips.
                    </p>

                    <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#334155;">
                      Check the latest improvements, explore new tools, and stay ahead with smarter trading support.
                    </p>

                    <div style="margin:30px 0;text-align:center;">
                      <a
                        href="https://readypips.com"
                        style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;"
                      >
                        Visit ReadyPips
                      </a>
                    </div>

                    <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">
                      Thank you,<br />
                      <strong>ReadyPips Team</strong>
                    </p>
                  </div>

                  <div style="padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="margin:0 0 8px 0;font-size:12px;line-height:1.7;color:#64748b;">
                      This email was sent by ReadyPips from
                      <strong>${process.env.SMTP_FROM_EMAIL}</strong>.
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                      If you no longer want to receive these emails,
                      <a href="${unsubscribeUrl}" style="color:#2563eb;text-decoration:none;">unsubscribe here</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          `,
        });

        successCount++;
        console.log(`Sent to ${user.email} | Message ID: ${info.messageId}`);

        await sleep(500);
      } catch (mailError: any) {
        failedCount++;
        console.error(`Failed sending to ${user.email}: ${mailError.message}`);
      }
    }

    console.log("Email campaign finished.");
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failedCount}`);
  } catch (error: any) {
    console.error("Promo send failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connected) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

sendPromo();