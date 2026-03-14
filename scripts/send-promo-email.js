import nodemailer from "nodemailer";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

console.log("SMTP HOST:", process.env.SMTP_HOST);
console.log("SMTP PORT:", process.env.SMTP_PORT);

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing in .env.local");
}

if (!dbName) {
  throw new Error("MONGODB_DB_NAME is missing in .env.local");
}

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error("SMTP variables are missing in .env.local");
}

const client = new MongoClient(mongoUri);

async function sendPromo() {
  await client.connect();

  const db = client.db(dbName);

  // Test with one email first
  const users = [{ email: "no-reply@readypips.com", name: "Readypips.com Strategy Indicator" }];

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  for (const user of users) {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "ReadyPips"}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: user.email,
      subject: "ReadyPips Updates",
      html: `
        <h2>Hello${user.name ? " " + user.name : ""},</h2>
        <p>We have new updates and promotional offers available on ReadyPips.</p>
        <p><a href="https://readypips.com">Visit ReadyPips</a></p>
      `,
    });

    console.log(`Sent to: ${user.email}`);
  }

  console.log("Promo emails sent successfully.");
  await client.close();
}

sendPromo().catch(async (error) => {
  console.error("Promo send failed:", error.message);
  await client.close();
  process.exit(1);
});