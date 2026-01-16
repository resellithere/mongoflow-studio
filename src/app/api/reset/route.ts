import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(getCollectionName());
    
    const result = await collection.deleteMany({});
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        message: 'Database has been reset successfully',
      },
      metrics: {
        executionTime,
        operation: 'deleteMany (reset)',
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
