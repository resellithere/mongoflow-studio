import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(getCollectionName());
    
    const stats = await db.command({ collStats: getCollectionName() });
    const indexes = await collection.indexes();
    const count = await collection.countDocuments();
    
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        documentCount: count,
        storageSize: stats.storageSize,
        avgObjSize: stats.avgObjSize || 0,
        indexCount: indexes.length,
        indexes: indexes.map(idx => ({
          name: idx.name,
          key: idx.key,
          unique: idx.unique || false,
        })),
        totalIndexSize: stats.totalIndexSize,
      },
      metrics: {
        executionTime,
        operation: 'collStats',
      },
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    if (error instanceof Error && error.message.includes('ns not found')) {
      return NextResponse.json({
        success: true,
        data: {
          documentCount: 0,
          storageSize: 0,
          avgObjSize: 0,
          indexCount: 0,
          indexes: [],
          totalIndexSize: 0,
        },
        metrics: {
          executionTime,
          operation: 'collStats',
        },
      });
    }
    
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
