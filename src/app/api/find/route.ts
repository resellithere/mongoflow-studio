import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    const { db } = await connectToDatabase();
    const collection = db.collection(getCollectionName());
    
    const query = body || {};
    
    const explainResult = await collection.find(query).explain('executionStats');
    const documents = await collection.find(query).limit(100).toArray();
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        documents,
        count: documents.length,
      },
      metrics: {
        executionTime,
        operation: 'find',
        documentsExamined: explainResult.executionStats?.totalDocsExamined || 0,
        documentsReturned: documents.length,
        indexUsed: explainResult.queryPlanner?.winningPlan?.inputStage?.indexName || 'COLLSCAN',
      },
      queryPlan: {
        winningPlan: explainResult.queryPlanner?.winningPlan,
        executionStats: {
          executionTimeMillis: explainResult.executionStats?.executionTimeMillis,
          totalDocsExamined: explainResult.executionStats?.totalDocsExamined,
          totalKeysExamined: explainResult.executionStats?.totalKeysExamined,
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
