import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    
    // Simple security check
    if (secret !== 'readypips-seed-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Check if demo user already exists
    const existingUser = await db.collection('users').findOne({ email: '123@gmail.com' });
    
    if (existingUser) {
      return NextResponse.json({
        message: 'Demo user already exists',
        credentials: {
          email: '123@gmail.com',
          password: '123456789'
        }
      });
    }

    const hashedPassword = await bcrypt.hash('123456789', 12);

    const demoUser = {
      email: '123@gmail.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      phoneNumber: '0712345678',
      role: 'user',
      isAdmin: false,
      subscriptionStatus: 'active',
      subscriptionType: 'pro',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      emailVerified: true,
      emailVerifiedAt: new Date(),
      provider: 'credentials',
      referralCode: 'DEMO123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').insertOne(demoUser);

    return NextResponse.json({
      success: true,
      message: 'Demo user created successfully',
      credentials: {
        email: '123@gmail.com',
        password: '123456789'
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to seed demo user'
    }, { status: 500 });
  }
}