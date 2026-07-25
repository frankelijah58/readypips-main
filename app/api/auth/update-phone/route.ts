import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return NextResponse.json(
        { error: 'Valid phone number is required (minimum 10 digits)' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Check if user already has a phone number
    const existingUser = await usersCollection.findOne({ 
      _id: new ObjectId(decoded.userId) 
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent changing phone number once it's been set
    if (existingUser.phoneNumber && existingUser.phoneNumber.trim() !== '') {
      return NextResponse.json(
        { error: 'Phone number has already been set and cannot be changed' },
        { status: 403 }
      );
    }

    // Update user's phone number (first time only)
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          phoneNumber: phoneNumber.trim(),
          phoneNumberVerified: true,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Phone number updated successfully',
      phoneNumber: phoneNumber.trim()
    });

  } catch (error) {
    console.error('Phone number update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
