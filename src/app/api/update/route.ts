import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    if (!body.filter || !body.update) {
      return NextResponse.json(
        { success: false, error: 'Request must include "filter" and "update" fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(getCollectionName());
    
    const updateDoc = {
      ...body.update,
      $set: {
        ...(body.update.$set || {}),
        _updatedAt: new Date(),
      },
    };

    const result = await collection.updateMany(body.filter, updateDoc);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged,
      },
      metrics: {
        executionTime,
        operation: 'updateMany',
        documentsMatched: result.matchedCount,
        documentsModified: result.modifiedCount,
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
