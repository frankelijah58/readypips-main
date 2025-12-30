import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUser } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { sendEmail, emailTemplates } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phoneNumber, password } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUser(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      subscriptionStatus: 'inactive',
      subscriptionType: null,
      role: 'user'
    });

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    // Create verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

    // Send verification email using NodeMailer
    try {
      const emailSent = await sendEmail({
        to: user.email,
        ...emailTemplates.emailVerification(user.firstName, verificationUrl)
      });

      if (!emailSent) {
        console.warn('Failed to send verification email, but user was created successfully');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}