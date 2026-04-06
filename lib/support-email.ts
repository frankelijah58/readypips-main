import nodemailer from "nodemailer";
import { SUPPORT_FROM_EMAIL, SUPPORT_INBOX_EMAIL } from "@/lib/support-config";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createSupportMailTransport() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendSupportTicketEmails(params: {
  ticketNumber: string;
  name: string;
  email: string;
  phoneNumber: string;
  queryTypeLabel: string;
  description: string;
}): Promise<{ staffSent: boolean; userSent: boolean; error?: string }> {
  const transporter = createSupportMailTransport();
  if (!transporter) {
    return {
      staffSent: false,
      userSent: false,
      error: "Email not configured (EMAIL_USER / EMAIL_PASSWORD)",
    };
  }

  const from = SUPPORT_FROM_EMAIL;
  const toInbox = SUPPORT_INBOX_EMAIL;
  const safe = {
    name: escapeHtml(params.name),
    email: escapeHtml(params.email),
    phone: escapeHtml(params.phoneNumber),
    type: escapeHtml(params.queryTypeLabel),
    desc: escapeHtml(params.description).replace(/\n/g, "<br>"),
    ticket: escapeHtml(params.ticketNumber),
  };

  const staffHtml = `
      <h2>New support ticket ${safe.ticket}</h2>
      <hr />
      <p><strong>Name:</strong> ${safe.name}</p>
      <p><strong>Email:</strong> ${safe.email}</p>
      <p><strong>Phone:</strong> ${safe.phone}</p>
      <p><strong>Type:</strong> ${safe.type}</p>
      <hr />
      <h3>Message</h3>
      <p>${safe.desc}</p>
      <hr />
      <p><small>${new Date().toISOString()}</small></p>
    `;

  const userHtml = `
      <h2>We received your request</h2>
      <p>Hello ${safe.name},</p>
      <p>Your support ticket <strong>${safe.ticket}</strong> has been saved. Our team will respond as soon as possible.</p>
      <p><strong>Category:</strong> ${safe.type}</p>
      <p>Replies will come from our support channels; this message was sent from a no-reply address.</p>
      <p>Best regards,<br />ReadyPips Support</p>
    `;

  let staffSent = false;
  let userSent = false;
  let error: string | undefined;

  try {
    await transporter.sendMail({
      from,
      to: toInbox,
      replyTo: params.email,
      subject: `[${params.ticketNumber}] Support: ${params.queryTypeLabel} — ${params.name}`,
      html: staffHtml,
    });
    staffSent = true;
  } catch (e: any) {
    error = e?.message || "Staff notification failed";
  }

  try {
    await transporter.sendMail({
      from,
      to: params.email,
      subject: `ReadyPips support ticket ${params.ticketNumber}`,
      html: userHtml,
    });
    userSent = true;
  } catch (e: any) {
    error = error || e?.message || "User confirmation failed";
  }

  return { staffSent, userSent, error };
}
