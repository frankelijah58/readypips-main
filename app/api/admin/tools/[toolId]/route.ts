import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// PUT - Update tool
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin has permission
    const db = await getDatabase();
    let adminUser = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    }) || await db.collection('admins').findOne({
      _id: new ObjectId(decoded.userId)
    }) || await db.collection('admins').findOne({
      _id: decoded.userId as any
    });

    if (!adminUser || (!adminUser.isAdmin && adminUser.role !== 'admin' && adminUser.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {
      ...body,
      updatedAt: new Date()
    };

    // Update tool
    const result = await db.collection('tools').updateOne(
      { _id: new ObjectId(toolId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Tool updated successfully'
    });

  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tool
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin has permission
    const db = await getDatabase();
    let adminUser = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    }) || await db.collection('admins').findOne({
      _id: new ObjectId(decoded.userId)
    }) || await db.collection('admins').findOne({
      _id: decoded.userId as any
    });

    if (!adminUser || (!adminUser.isAdmin && adminUser.role !== 'admin' && adminUser.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete tool
    const result = await db.collection('tools').deleteOne({
      _id: new ObjectId(toolId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Tool deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
