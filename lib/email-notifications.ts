/**
 * Email Notifications Service
 * Sends email notifications for admin and user password resets, announcements, etc.
 * Uses SMTP configuration from environment variables
 */

import nodemailer from "nodemailer";

// Email template types
export enum EmailType {
  ADMIN_PASSWORD_RESET = "admin_password_reset",
  USER_PASSWORD_RESET = "user_password_reset",
  ADMIN_WELCOME = "admin_welcome",
  USER_WELCOME = "user_welcome",
  SUBSCRIPTION_RENEWED = "subscription_renewed",
  SUBSCRIPTION_EXPIRING = "subscription_expiring",
  SUBSCRIPTION_EXPIRED = "subscription_expired",
  NEW_TOOL_AVAILABLE = "new_tool_available",
  ANNOUNCEMENT = "announcement",
  PAYMENT_SUCCESS = "payment_success",
  PAYMENT_FAILED = "payment_failed",
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  type: EmailType;
}

// Create nodemailer transporter
const getEmailTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  // console.log('📧 [Email Notifications] SMTP Configuration:');
  // console.log('  Host:', host);
  // console.log('  Port:', port);
  // console.log('  User:', user || 'NOT SET');
  // console.log('  Pass:', pass ? '***SET***' : 'NOT SET');

  if (!user || !pass) {
    console.warn("⚠️ SMTP credentials not configured in environment variables");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false, // Use TLS for port 587
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  });
};

/**
 * Send generic email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = getEmailTransporter();

    const fromName = process.env.SMTP_FROM_NAME || "ReadyPips";
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@readypips.com";

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    // console.log(`✅ Email sent (${options.type}) to ${options.to}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email (${options.type}) to ${options.to}:`, error);
    return false;
  }
};

/**
 * Send admin password reset email
 */
export const sendAdminPasswordResetEmail = async (
  email: string,
  resetToken: string,
  adminName: string
): Promise<boolean> => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 15px; margin: 15px 0; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Admin Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${adminName}</strong>,</p>
          
          <p>We received a request to reset your admin account password. Click the link below to reset your password:</p>
          
          <center>
            <a href="${resetLink}" class="button">Reset Password</a>
          </center>
          
          <p style="color: #666; font-size: 12px;">
            Or copy this link in your browser:<br>
            <span style="word-break: break-all; color: #0066cc;">${resetLink}</span>
          </p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p style="color: #666; margin-top: 30px;">
            <strong>Steps to reset password:</strong><br>
            1. Click the link above<br>
            2. Enter your new password<br>
            3. Confirm your new password<br>
            4. Click "Reset Password"
          </p>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "🔐 Admin Password Reset Request",
    html,
    type: EmailType.ADMIN_PASSWORD_RESET,
  });
};

/**
 * Send user password reset email
 */
export const sendUserPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 15px; margin: 15px 0; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          
          <p>We received a request to reset your password. Click the link below to reset it:</p>
          
          <center>
            <a href="${resetLink}" class="button">Reset Your Password</a>
          </center>
          
          <p style="color: #666; font-size: 12px;">
            Or copy this link in your browser:<br>
            <span style="word-break: break-all; color: #0066cc;">${resetLink}</span>
          </p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "🔐 Password Reset Request",
    html,
    type: EmailType.USER_PASSWORD_RESET,
  });
};

/**
 * Send admin welcome email with initial credentials
 */
export const sendAdminWelcomeEmail = async (
  email: string,
  adminName: string,
  tempPassword: string,
  role: string
): Promise<boolean> => {
  const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/admin/login`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .credentials { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 15px 0; font-family: monospace; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .warning { background: #ffe0e0; border-left: 4px solid #ff6b6b; padding: 10px 15px; margin: 15px 0; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Welcome to ReadyPips Admin</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${adminName}</strong>,</p>
          
          <p>Your admin account has been successfully created! You now have access to the ReadyPips admin dashboard.</p>
          
          <p><strong>Account Role:</strong> ${role.toUpperCase()}</p>
          
          <p>Use the credentials below to login:</p>
          
          <div class="credentials">
            <strong>Email:</strong> ${email}<br>
            <strong>Password:</strong> ${tempPassword}
          </div>
          
          <center>
            <a href="${loginLink}" class="button">Login to Dashboard</a>
          </center>
          
          <div class="warning">
            <strong>⚠️ Important Security Steps:</strong>
            <ol>
              <li>Login immediately with the credentials above</li>
              <li>Change your password on first login</li>
              <li>Never share these credentials</li>
              <li>Keep your password secure</li>
            </ol>
          </div>
          
          <p><strong>What can you do?</strong></p>
          <ul>
            <li>📊 View dashboard analytics</li>
            <li>👥 Manage users</li>
            <li>💳 Monitor subscriptions</li>
            <li>⚙️ Manage system settings</li>
            <li>📈 View reports</li>
          </ul>
          
          <p style="color: #666; margin-top: 30px;">
            Need help? Contact support or check the admin documentation.
          </p>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `👋 Welcome to ReadyPips Admin - Your Account is Ready`,
    html,
    type: EmailType.ADMIN_WELCOME,
  });
};

/**
 * Send subscription renewed notification
 */
export const sendSubscriptionRenewedEmail = async (
  email: string,
  userName: string,
  planName: string,
  renewalDate: Date,
  expiryDate: Date
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .details { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Subscription Renewed</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          
          <p>Great news! Your subscription has been successfully renewed.</p>
          
          <div class="details">
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Renewal Date:</strong> ${renewalDate.toLocaleDateString()}</p>
            <p><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}</p>
          </div>
          
          <p>You now have full access to all features in the ${planName} plan, including:</p>
          <ul>
            <li>Advanced TradingView indicators</li>
            <li>Signal analysis tools</li>
            <li>Market insights</li>
            <li>Premium support</li>
          </ul>
          
          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Dashboard</a>
          </center>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `✅ Your ReadyPips Subscription Renewed - ${planName}`,
    html,
    type: EmailType.SUBSCRIPTION_RENEWED,
  });
};

/**
 * Send subscription expiring soon notification
 */
export const sendSubscriptionExpiringEmail = async (
  email: string,
  userName: string,
  planName: string,
  expiryDate: Date,
  daysRemaining: number
): Promise<boolean> => {
  const renewLink = `${process.env.NEXT_PUBLIC_APP_URL}/subscription`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 3px; margin: 15px 0; }
        .button { display: inline-block; background: #ffc107; color: #333; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; font-weight: bold; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Subscription Expiring Soon</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          
          <div class="warning">
            <strong>⚠️ Your ${planName} subscription will expire in ${daysRemaining} days!</strong><br>
            <strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}
          </div>
          
          <p>Renew your subscription now to maintain uninterrupted access to all premium features:</p>
          <ul>
            <li>✅ Advanced TradingView indicators</li>
            <li>✅ Signal analysis tools</li>
            <li>✅ Real-time market data</li>
            <li>✅ Premium support</li>
          </ul>
          
          <center>
            <a href="${renewLink}" class="button">Renew Subscription Now</a>
          </center>
          
          <p style="color: #666;">
            If you don't renew, you'll lose access to premium features on ${expiryDate.toLocaleDateString()}.
          </p>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `⏰ Your ReadyPips Subscription Expires in ${daysRemaining} Days`,
    html,
    type: EmailType.SUBSCRIPTION_EXPIRING,
  });
};

/**
 * Send new tool announcement email
 */
export const sendNewToolAnnouncementEmail = async (
  email: string,
  userName: string,
  toolName: string,
  toolDescription: string,
  planName: string
): Promise<boolean> => {
  const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/tools`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .feature { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 3px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 New Tool Available</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          
          <p>Exciting news! A new tool has been added to your <strong>${planName}</strong> plan:</p>
          
          <div class="feature">
            <h2 style="margin-top: 0; color: #667eea;">📊 ${toolName}</h2>
            <p>${toolDescription}</p>
          </div>
          
          <p>This tool is now available for you to use in the ReadyPips dashboard. Check it out and start using it right away!</p>
          
          <center>
            <a href="${dashboardLink}" class="button">View All Tools</a>
          </center>
          
          <p style="color: #666; margin-top: 30px;">
            Learn more about this tool and how to use it in our help documentation.
          </p>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎉 New Tool Available: ${toolName}`,
    html,
    type: EmailType.NEW_TOOL_AVAILABLE,
  });
};

/**
 * Send payment success notification
 */
export const sendPaymentSuccessEmail = async (
  email: string,
  userName: string,
  planName: string,
  amount: number,
  transactionId: string,
  paymentDate: Date
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .receipt { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 15px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #28a745; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Successful</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          
          <p>Thank you! Your payment has been successfully processed.</p>
          
          <div class="receipt">
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Amount:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Date:</strong> ${paymentDate.toLocaleDateString()} ${paymentDate.toLocaleTimeString()}</p>
          </div>
          
          <p>Your subscription is now active. You have full access to all features in the ${planName} plan.</p>
          
          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
          </center>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `✅ Payment Successful - ${planName} Subscription`,
    html,
    type: EmailType.PAYMENT_SUCCESS,
  });
};

/**
 * Send payment failed notification
 */
export const sendPaymentFailedEmail = async (
  email: string,
  userName: string,
  planName: string,
  amount: number,
  reason: string
): Promise<boolean> => {
  const retryLink = `${process.env.NEXT_PUBLIC_APP_URL}/subscription`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .warning { background: #ffe0e0; border-left: 4px solid #dc3545; padding: 15px; border-radius: 3px; margin: 15px 0; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Payment Failed</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          
          <div class="warning">
            <strong>Your payment attempt failed.</strong><br>
            We were unable to process your payment for the ${planName} plan ($${amount.toFixed(2)}).
          </div>
          
          <p><strong>Reason:</strong> ${reason}</p>
          
          <p><strong>What you can do:</strong></p>
          <ul>
            <li>Check your payment method details</li>
            <li>Ensure you have sufficient funds</li>
            <li>Try again with a different payment method</li>
            <li>Contact our support team if the issue persists</li>
          </ul>
          
          <center>
            <a href="${retryLink}" class="button">Try Payment Again</a>
          </center>
          
          <p style="color: #666; margin-top: 30px;">
            Need help? Contact our support team at support@readypips.com
          </p>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `❌ Payment Failed - ${planName} Subscription`,
    html,
    type: EmailType.PAYMENT_FAILED,
  });
};

/**
 * Send custom announcement/broadcast email
 */
export const sendAnnouncementEmail = async (
  email: string,
  recipientName: string,
  subject: string,
  content: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 ReadyPips Announcement</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${recipientName}</strong>,</p>
          
          <div style="line-height: 1.6;">
            ${content}
          </div>
          
          <div class="footer">
            <p>
              © 2025 ReadyPips. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    type: EmailType.ANNOUNCEMENT,
  });
};
