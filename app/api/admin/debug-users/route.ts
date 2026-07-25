import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

// DEBUG ENDPOINT - Remove in production!
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // Get all users with admin privileges
    const adminUsers = await db.collection('users').find({
      $or: [
        { isAdmin: true },
        { role: 'admin' },
        { role: 'superadmin' }
      ]
    }).toArray();
    
    // Get all from admins collection
    const admins = await db.collection('admins').find({}).toArray();
    
    // Format data safely (remove passwords)
    const safeAdminUsers = adminUsers.map(user => ({
      _id: user._id?.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      role: user.role,
      collection: 'users'
    }));
    
    const safeAdmins = admins.map(admin => ({
      _id: admin._id?.toString(),
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      isActive: admin.isActive,
      collection: 'admins'
    }));
    
    return NextResponse.json({
      message: 'Admin users found',
      totalInUsers: adminUsers.length,
      totalInAdmins: admins.length,
      adminUsers: safeAdminUsers,
      admins: safeAdmins,
      allAdmins: [...safeAdminUsers, ...safeAdmins]
    });
    
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
