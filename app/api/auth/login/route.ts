import { NextRequest, NextResponse } from 'next/server';
import { findUser, verifyPassword, generateToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user is an admin first
    const db = await getDatabase();
    const admin = await db.collection('admins').findOne({ email });
    
    if (admin) {
      // Verify admin password
      const isValidPassword = await verifyPassword(password, admin.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Generate token for admin (isAdmin required for admin-only API routes)
      const token = generateToken(
        admin._id.toString(),
        admin.email,
        admin.role || "admin",
        true,
      );

      // Remove password from response
      const { password: _, ...adminWithoutPassword } = admin;

      return NextResponse.json({
        message: 'Login successful',
        token,
        user: {
          ...adminWithoutPassword,
          _id: admin._id.toString(),
          role: admin.role,
          isAdmin: true,
        },
      });
    }

    // Find regular user
    const user = await findUser(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password!);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address before logging in. Check your inbox for a verification link.' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user._id!, user.email!, user!.role, user.isAdmin);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        ...userWithoutPassword,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}