import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Request body must be an array of documents' },
        { status: 400 }
      );
    }

    if (body.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array cannot be empty' },
        { status: 400 }
      );
    }

    if (body.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 documents allowed per bulk insert' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(getCollectionName());
    
    const documentsToInsert = body.map(doc => ({
      ...doc,
      _createdAt: new Date(),
    }));

    const result = await collection.insertMany(documentsToInsert);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        insertedCount: result.insertedCount,
        insertedIds: Object.values(result.insertedIds).map(id => id.toString()),
        acknowledged: result.acknowledged,
      },
      metrics: {
        executionTime,
        operation: 'insertMany',
        documentsInserted: result.insertedCount,
        avgTimePerDocument: executionTime / result.insertedCount,
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
