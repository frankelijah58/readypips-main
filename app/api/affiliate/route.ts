import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phoneNumber, queryType, description } = body;

    // Validation
    if (!name || !email || !phoneNumber || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email content
    const queryTypeLabels: { [key: string]: string } = {
      payment: 'Payment Issue',
      credentials: 'Lost Credentials',
      signals: 'How to Read Signal',
      account: 'Account Management',
      other: 'Other',
    };
    const queryTypeLabel = queryTypeLabels[queryType] || 'Other';

    const emailContent = `
      <h2>New Support Request</h2>
      <hr />
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
      <p><strong>Query Type:</strong> ${queryTypeLabel}</p>
      <hr />
      <h3>Message:</h3>
      <p>${description.replace(/\n/g, '<br>')}</p>
      <hr />
      <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
    `;

    // Send email to support
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'info@readypips.com',
      subject: `Support Request: ${queryTypeLabel} from ${name}`,
      html: emailContent,
      replyTo: email,
    });

    // Optionally send confirmation email to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Support Request Has Been Received',
      html: `
        <h2>Thank You for Contacting Ready Pips Support</h2>
        <p>Hello ${name},</p>
        <p>We have received your support request and will get back to you as soon as possible.</p>
        <p><strong>Query Type:</strong> ${queryTypeLabel}</p>
        <p>Our support team typically responds within 24 hours.</p>
        <p>Best regards,<br>Ready Pips Support Team</p>
      `,
    });

    return NextResponse.json(
      { message: 'Support request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting support request:', error);
    return NextResponse.json(
      { error: 'Failed to submit support request' },
      { status: 500 }
    );
  }
}
