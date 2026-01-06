import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

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
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDatabase();
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
    const decoded = await verifyToken(token);

    if (!decoded) {
      console.error('Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // console.log('Decoded token:', decoded);

    // Verify admin has permission
    const db = await getDatabase();
    
    // Try to find admin user with multiple approaches
    // console.log('Looking for admin user with ID:', decoded.userId);
    
    let adminUser = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    });
    
    // If not found with ObjectId, try with string ID
    if (!adminUser) {
      // console.log('Not found with ObjectId in users, trying string ID...');
      adminUser = await db.collection('users').findOne({
        _id: decoded.userId as any
      });
    }
    
    // If still not found, check the admins collection (for separate admin system)
    if (!adminUser) {
      // console.log('Not found in users collection, checking admins collection...');
      const admin = await db.collection('admins').findOne({
        _id: new ObjectId(decoded.userId)
      }) || await db.collection('admins').findOne({
        _id: decoded.userId as any
      });
      
      if (admin) {
        // console.log('Found in admins collection:', admin.email);
        // Convert admin to user format for compatibility
        adminUser = {
          ...admin,
          isAdmin: true,
          role: admin.role || 'admin'
        } as any;
      }
    }

    // console.log('Admin user found:', adminUser ? {
    //   id: adminUser._id?.toString(),
    //   email: adminUser.email,
    //   isAdmin: adminUser.isAdmin,
    //   role: adminUser.role,
    //   firstName: adminUser.firstName,
    //   lastName: adminUser.lastName
    // } : 'NULL - User not found in database');

    if (!adminUser) {
      console.error('Admin user not found in database with ID:', decoded.userId);
      return NextResponse.json({ 
        error: 'Admin user not found',
        details: 'Your user account could not be found. Please log out and log in again.'
      }, { status: 403 });
    }

    if (!adminUser.isAdmin && adminUser.role !== 'admin' && adminUser.role !== 'superadmin') {
      console.error('User lacks admin permissions:', {
        isAdmin: adminUser.isAdmin,
        role: adminUser.role
      });
      return NextResponse.json({ 
        error: 'Admin access required',
        details: 'You do not have permission to perform this action'
      }, { status: 403 });
    }

    // console.log('Admin verification passed');

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
    const decoded = await verifyToken(token);

    if (!decoded) {
      console.error('Token verification failed (DELETE)');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin has permission
    const db = await getDatabase();
    
    // Check both users and admins collections
    let adminUser = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    }) || await db.collection('users').findOne({
      _id: decoded.userId as any
    });
    
    // If not found in users, check admins collection
    if (!adminUser) {
      const admin = await db.collection('admins').findOne({
        _id: new ObjectId(decoded.userId)
      }) || await db.collection('admins').findOne({
        _id: decoded.userId as any
      });
      
      if (admin) {
        adminUser = {
          ...admin,
          isAdmin: true,
          role: admin.role || 'admin'
        } as any;
      }
    }

    if (!adminUser) {
      console.error('Admin user not found in database (DELETE)');
      return NextResponse.json({ 
        error: 'Admin user not found',
        details: 'Your user account could not be found. Please log out and log in again.'
      }, { status: 403 });
    }

    if (!adminUser.isAdmin && adminUser.role !== 'admin' && adminUser.role !== 'superadmin') {
      console.error('User lacks admin permissions (DELETE)');
      return NextResponse.json({ 
        error: 'Admin access required',
        details: 'You do not have permission to perform this action'
      }, { status: 403 });
    }

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
