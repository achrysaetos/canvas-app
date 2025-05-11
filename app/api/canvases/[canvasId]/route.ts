import { NextResponse } from 'next/server';
import docClient, { DYNAMODB_CANVASES_TABLE, DYNAMODB_ELEMENTS_TABLE } from '@/lib/dynamodb';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

interface Params {
  canvasId: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { canvasId } = params;

  if (!canvasId) {
    return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
  }

  try {
    // 1. Fetch canvas metadata
    const getCanvasCommand = new GetCommand({
      TableName: DYNAMODB_CANVASES_TABLE,
      Key: {
        canvasId: canvasId,
      },
    });

    const { Item: canvas } = await docClient.send(getCanvasCommand);

    if (!canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // 2. Fetch canvas elements
    const queryElementsCommand = new QueryCommand({
      TableName: DYNAMODB_ELEMENTS_TABLE,
      KeyConditionExpression: 'canvasId = :canvasId',
      ExpressionAttributeValues: {
        ':canvasId': canvasId,
      },
    });

    const { Items: elements } = await docClient.send(queryElementsCommand);

    return NextResponse.json({ canvas, elements: elements || [] }, { status: 200 });

  } catch (error) {
    console.error(`Error fetching canvas ${canvasId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to fetch canvas data', details: errorMessage }, { status: 500 });
  }
} 