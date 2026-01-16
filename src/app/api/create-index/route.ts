import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '@/lib/mongodb';
import { IndexSpecification, CreateIndexesOptions } from 'mongodb';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    if (!body.key || typeof body.key !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Request must include "key" field with index specification' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(getCollectionName());
    
    const indexSpec: IndexSpecification = body.key;
    const options: CreateIndexesOptions = {
      name: body.name,
      unique: body.options?.unique || false,
      sparse: body.options?.sparse || false,
    };

    const result = await collection.createIndex(indexSpec, options);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        indexName: result,
        key: body.key,
        options: options,
      },
      metrics: {
        executionTime,
        operation: 'createIndex',
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
