import nodemailer from 'nodemailer';
//refresh dotenv config
// Force hardcoded Hostinger settings since .env is not loading properly
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || 'no-reply@readypips.com',
  pass: process.env.EMAIL_PASSWORD || '@Readypips.com1',
};

console.log('📧 [Email Service] SMTP Configuration (HARDCODED):');
console.log('  Host:', SMTP_CONFIG.host);
console.log('  Port:', SMTP_CONFIG.port);
console.log('  User:', SMTP_CONFIG.user);
console.log('  Pass: ***SET***');

// Email configuration
const transporter = nodemailer.createTransport({
  host: SMTP_CONFIG.host,
  port: SMTP_CONFIG.port,
  secure: false, // Use TLS for port 587
  auth: {
    user: SMTP_CONFIG.user,
    pass: SMTP_CONFIG.pass,
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Email templates
export const emailTemplates = {
  emailVerification: (firstName: string, verificationUrl: string) => ({
    subject: 'Verify Your Email - Ready Pips',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { height: 50px; margin-bottom: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
          .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-light.png" alt="Ready Pips" class="logo">
            <h1>Welcome to Ready Pips!</h1>
          </div>
          
          <p>Hello ${firstName},</p>
          
          <p>Thank you for registering with Ready Pips! To complete your registration and access your account, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <div class="warning">
            <strong>Important:</strong> This verification link will expire in 24 hours.
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #16a34a;">${verificationUrl}</p>
          
          <div class="footer">
            <p>Best regards,<br>The Ready Pips Team</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (firstName: string, resetUrl: string) => ({
    subject: 'Reset Your Password - Ready Pips',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { height: 50px; margin-bottom: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
          .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-light.png" alt="Ready Pips" class="logo">
            <h1>Reset Your Password</h1>
          </div>
          
          <p>Hello ${firstName},</p>
          
          <p>We received a request to reset your password for your Ready Pips account. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          
          <div class="warning">
            <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #16a34a;">${resetUrl}</p>
          
          <div class="footer">
            <p>Best regards,<br>The Ready Pips Team</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  try {

    const fromName = process.env.SMTP_FROM_NAME || 'Ready Pips';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@readypips.com';
  
    console.log('📧 [Email Service] Preparing to send email...');
    console.log('  To:', to);
    console.log('  From Name:', fromName);
    console.log('  From Email:', fromEmail);
    console.log('  Subject:', subject);
    
    console.log('📧 [Email Service] Transporter config being used:');
    console.log('  Host:', SMTP_CONFIG.host);
    console.log('  Port:', SMTP_CONFIG.port);
    console.log('  User:', SMTP_CONFIG.user);
    console.log('  Pass:', '***17 chars***');
    
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    };

    console.log('📧 [Email Service] Attempting to send email via transporter...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to);
    console.log('✅ Message ID:', result.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    console.error('❌ Error details:', {
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
      message: error.message
    });
    return false;
  }
};
