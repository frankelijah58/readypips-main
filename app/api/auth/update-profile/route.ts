import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ message: 'Missing token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName } = body;

    if (!firstName && !lastName) {
      return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
    }

    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const updates: any = { updatedAt: new Date() };
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;

    await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: updates }
    );

    return NextResponse.json({ message: 'Profile updated' });
  } catch (error: any) {
    console.error('Error updating profile', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
