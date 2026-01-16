import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(getCollectionName());
    
    const documentToInsert = {
      ...body,
      _createdAt: new Date(),
    };

    const result = await collection.insertOne(documentToInsert);
    const executionTime = Date.now() - startTime;

    const insertedDoc = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      data: {
        insertedId: result.insertedId.toString(),
        acknowledged: result.acknowledged,
        document: insertedDoc,
      },
      metrics: {
        executionTime,
        operation: 'insertOne',
        documentsAffected: 1,
      },
      bsonConversion: {
        original: body,
        converted: {
          ...body,
          _id: { $oid: result.insertedId.toString() },
          _createdAt: { $date: documentToInsert._createdAt.toISOString() },
        },
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
