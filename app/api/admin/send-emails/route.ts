import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing");
}

if (!dbName) {
  throw new Error("MONGODB_DB_NAME is missing");
}

if (!jwtSecret) {
  throw new Error("JWT_SECRET is missing");
}

if (
  !process.env.SMTP_HOST ||
  !process.env.SMTP_PORT ||
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS ||
  !process.env.SMTP_FROM_EMAIL
) {
  throw new Error("SMTP variables are missing");
}

const client = new MongoClient(mongoUri);

type JwtPayload = {
  id?: string;
  email?: string;
  role?: string;
};

type UserDoc = {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

function getHtmlTemplate(params: {
  fullName: string;
  message: string;
  subject: string;
  email: string;
}) {
  const appUrl = process.env.APP_URL || "https://readypips.com";
  const logoUrl =
    process.env.EMAIL_LOGO_URL || "https://readypips.com/logo.png";

  const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(
    params.email
  )}`;

  const formattedMessage = params.message
    .split("\n")
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#334155;">${line}</p>`
    )
    .join("");

  return `
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
              Hello ${params.fullName},
            </h2>

            <h3 style="margin:0 0 18px;font-size:18px;color:#0f172a;">
              ${params.subject}
            </h3>

            ${formattedMessage}

            <div style="margin:30px 0;text-align:center;">
              <a
                href="${appUrl}"
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
  `;
}

function parseManualEmails(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  let connected = false;

  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: missing token" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized: admin access required" },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const mode = String(formData.get("mode") || "");
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const manualEmails = String(formData.get("emails") || "").trim();

    if (!subject) {
      return NextResponse.json(
        { message: "Subject is required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    await client.connect();
    connected = true;

    const db = client.db(dbName);

    let recipients: UserDoc[] = [];

    if (mode === "all") {
      const users = await db
        .collection<UserDoc>("users")
        .find({
          email: { $exists: true, $nin: [null, ""] },
        })
        .project({
          email: 1,
          firstName: 1,
          lastName: 1,
        })
        .toArray();

      recipients = users;
    } else if (mode === "manual") {
      const emails = parseManualEmails(manualEmails);

      if (!emails.length) {
        return NextResponse.json(
          { message: "Please provide at least one recipient email" },
          { status: 400 }
        );
      }

      const users = await db
        .collection<UserDoc>("users")
        .find({
          email: { $in: emails },
        })
        .project({
          email: 1,
          firstName: 1,
          lastName: 1,
        })
        .toArray();

      const foundEmails = new Set(
        users.map((u) => (u.email || "").toLowerCase()).filter(Boolean)
      );

      const missingEmails = emails.filter((email) => !foundEmails.has(email));

      const fallbackRecipients: UserDoc[] = missingEmails.map((email) => ({
        _id: email,
        email,
        firstName: "",
        lastName: "",
      }));

      recipients = [...users, ...fallbackRecipients];
    } else {
      return NextResponse.json(
        { message: "Invalid mode" },
        { status: 400 }
      );
    }

    if (!recipients.length) {
      return NextResponse.json(
        { message: "No recipients found" },
        { status: 404 }
      );
    }

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

    const uploadedFiles = formData.getAll("files");
    const attachments: nodemailer.SendMailOptions["attachments"] = [];

    for (const item of uploadedFiles) {
      if (item instanceof File) {
        const bytes = await item.arrayBuffer();
        attachments.push({
          filename: item.name,
          content: Buffer.from(bytes),
          contentType: item.type || undefined,
        });
      }
    }

    let successCount = 0;
    let failedCount = 0;
    const failures: string[] = [];

    for (const user of recipients) {
      try {
        if (!user.email) continue;

        const fullName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Trader";

        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || "ReadyPips"}" <${
            process.env.SMTP_FROM_EMAIL
          }>`,
          to: user.email,
          subject,
          html: getHtmlTemplate({
            fullName,
            message,
            subject,
            email: user.email,
          }),
          attachments,
        });

        successCount++;
      } catch (error: any) {
        failedCount++;
        failures.push(`${user.email}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: `Email campaign completed. Sent: ${successCount}, Failed: ${failedCount}`,
      successCount,
      failedCount,
      failures,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  } finally {
    if (connected) {
      await client.close();
    }
  }
}