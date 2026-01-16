import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid filter query' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(getCollectionName());
    
    const result = await collection.deleteMany(body);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        acknowledged: result.acknowledged,
      },
      metrics: {
        executionTime,
        operation: 'deleteMany',
        documentsDeleted: result.deletedCount,
      },
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: { executionTime },
      },
      { status: 500 }
    );
  }
}
