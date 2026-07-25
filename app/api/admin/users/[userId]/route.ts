import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import {
  hasAdminPrivileges,
  resolveAdminRequester,
} from '@/lib/admin-requester';

// GET single user
export async function GET(
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

    const db = await getDatabase();
    const requester = await resolveAdminRequester(decoded.userId);
    if (!hasAdminPrivileges(requester)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive data
    const { password, ...userData } = user;

    return NextResponse.json({ user: userData });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT (Update) user
export async function PUT(
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
      console.error('Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminUser = await resolveAdminRequester(decoded.userId);

    if (!adminUser) {
      console.error('Admin user not found in database with ID:', decoded.userId);
      return NextResponse.json({
        error: 'Admin user not found',
        details: 'Your user account could not be found. Please log out and log in again.',
      }, { status: 403 });
    }

    if (!hasAdminPrivileges(adminUser)) {
      console.error('User lacks admin permissions:', {
        isAdmin: adminUser.isAdmin,
        role: adminUser.role,
      });
      return NextResponse.json(
        {
          error: 'Admin access required',
          details: 'You do not have permission to perform this action',
        },
        { status: 403 },
      );
    }

    const db = await getDatabase();
    const { firstName, lastName, email, phoneNumber } = await request.json();

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    };

    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();

    // Update user
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get updated user
    const updatedUser = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to fetch updated user' }, { status: 500 });
    }

    // Remove sensitive data
    const { password, ...userData } = updatedUser;

    return NextResponse.json({
      message: 'User updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
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
      console.error('Token verification failed (DELETE)');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminUser = await resolveAdminRequester(decoded.userId);

    if (!adminUser) {
      console.error('Admin user not found in database (DELETE)');
      return NextResponse.json({
        error: 'Admin user not found',
        details: 'Your user account could not be found. Please log out and log in again.',
      }, { status: 403 });
    }

    if (!hasAdminPrivileges(adminUser)) {
      console.error('User lacks admin permissions (DELETE)');
      return NextResponse.json(
        {
          error: 'Admin access required',
          details: 'You do not have permission to perform this action',
        },
        { status: 403 },
      );
    }

    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account from this panel' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    // Delete user
    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
