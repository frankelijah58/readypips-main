import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    
    if (secret !== 'readypips-seed-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Seed regular demo user
    const existingUser = await db.collection('users').findOne({ email: '123@gmail.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123456789', 12);
      await db.collection('users').insertOne({
        email: '123@gmail.com',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        phoneNumber: '0712345678',
        role: 'user',
        isAdmin: false,
        subscriptionStatus: 'active',
        subscriptionType: 'pro',
        emailVerified: true,
        referralCode: 'DEMO123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Demo user created');
    }

    // Seed admin user
    const existingAdmin = await db.collection('admins').findOne({ email: 'frankelijah58@gmail.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('mysons$321', 12);
      await db.collection('admins').insertOne({
        email: 'frankelijah58@gmail.com',
        password: hashedPassword,
        firstName: 'Frank',
        lastName: 'Elijah',
        role: 'super_admin',
        isActive: true,
        permissions: [
          'view_users', 'create_user', 'edit_user', 'delete_user',
          'view_admins', 'create_admin', 'edit_admin', 'delete_admin',
          'view_subscriptions', 'manage_subscriptions', 'manage_payments',
          'view_tools', 'manage_tools', 'view_analytics', 'manage_settings',
          'view_logs', 'manage_roles',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Admin user created');
    }

    return NextResponse.json({
      success: true,
      users: {
        demo: { email: '123@gmail.com', password: '123456789', role: 'user' },
        admin: { email: 'frankelijah58@gmail.com', password: 'mysons$321', role: 'super_admin' },
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}