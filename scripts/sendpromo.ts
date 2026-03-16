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

    // TEST MODE
    const testMode = process.env.TEST_MODE === "true";

    const users = testMode
      ? [
          {
            email: "yourtestemail@example.com",
            name: "Test User",
          },
        ]
      : await db
          .collection("users")
          .find({
            email: { $exists: true, $nin: [null, ""] },
          })
          .project({ email: 1, name: 1 })
          .limit(50)
          .toArray();

    if (!users.length) {
      console.log("No users found to email.");
      return;
    }

    for (const user of users) {
      if (!user.email) continue;

      try {
        const info = await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || "ReadyPips"}" <${process.env.SMTP_FROM_EMAIL}>`,
          to: user.email,
          subject: "ReadyPips Updates",
          html: `
            <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
              <div style="max-width:600px;margin:0 auto;padding:30px 20px;">
                <div style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
                  <div style="background:#0f172a;padding:24px 30px;text-align:center;">
                    <h1 style="margin:0;font-size:26px;line-height:1.2;color:#ffffff;">ReadyPips</h1>
                    <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">
                      Trading insights and platform updates
                    </p>
                  </div>

                  <div style="padding:30px;">
                    <h2 style="margin:0 0 16px;font-size:22px;color:#0f172a;">
                      Hello${user.name ? " " + user.name : ""},
                    </h2>

                    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
                      We have new updates and promotional offers available on ReadyPips.
                    </p>

                    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
                      Check the latest improvements, explore new tools, and stay ahead with smarter trading support.
                    </p>

                    <div style="margin:28px 0;text-align:center;">
                      <a
                        href="https://readypips.com"
                        style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px;"
                      >
                        Visit ReadyPips
                      </a>
                    </div>

                    <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">
                      Thank you,<br />
                      <strong>ReadyPips Team</strong>
                    </p>
                  </div>

                  <div style="padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                      This email was sent by ReadyPips from
                      <strong> ${process.env.SMTP_FROM_EMAIL}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          `,
        });

        console.log(`Sent to ${user.email} | Message ID: ${info.messageId}`);
      } catch (mailError: any) {
        console.error(`Failed sending to ${user.email}: ${mailError.message}`);
      }
    }

    console.log("Promo emails processed successfully.");
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