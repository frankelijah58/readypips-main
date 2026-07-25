import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import {
  hasAdminPrivileges,
  resolveAdminRequester,
} from '@/lib/admin-requester';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const requester = await resolveAdminRequester(decoded.userId);

    if (!requester || !hasAdminPrivileges(requester)) {
      return NextResponse.json({ error: 'Admin access required to promote users' }, { status: 403 });
    }

    const db = await getDatabase();

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isAdmin === true || String(user.role || '').toLowerCase() === 'admin') {
      return NextResponse.json({ message: 'User is already an admin' });
    }

    if (userId === decoded.userId) {
      return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    // Update user to be an admin
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          isAdmin: true, 
          role: 'admin',
          updatedAt: new Date()
        } 
      }
    );

    // Additionally add them to admins collection if they are not there already
    const existingAdmin = await db.collection('admins').findOne({ email: user.email });
    if (!existingAdmin) {
      const { createAdmin } = await import('@/lib/admin');
      try {
        // Create an explicit admin record - generate a strong random password placeholder
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!@#';
        
        await createAdmin({
          email: user.email,
          firstName: user.firstName || 'Admin',
          lastName: user.lastName || 'User',
          role: 'admin' as any,
          password: randomPassword,
          isActive: true,
          createdBy: decoded.userId
        });
      } catch (err) {
        console.error('Failed to create matching admin record, but user was updated:', err);
      }
    }

    return NextResponse.json({ message: 'User successfully promoted to Admin' });

  } catch (error) {
    console.error('Error making user admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
