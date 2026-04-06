/** Outbound support/automation address (must be allowed by your SMTP provider). */
export const SUPPORT_FROM_EMAIL =
  process.env.SUPPORT_FROM_EMAIL || "no-reply@readypips.com";

/** Inbox that receives new support tickets. */
export const SUPPORT_INBOX_EMAIL =
  process.env.SUPPORT_INBOX_EMAIL || "info@readypips.com";
