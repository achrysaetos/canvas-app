import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import docClient, { DYNAMODB_CANVASES_TABLE, DYNAMODB_ELEMENTS_TABLE } from '@/lib/dynamodb';
import { PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

interface Params {
  canvasId: string;
}

// Define a more specific type for the element data based on spec.md
interface CanvasElementData {
  type: 'rectangle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { canvasId } = params;

  if (!canvasId) {
    return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as CanvasElementData;

    // Basic validation for required fields based on type
    if (!body.type || typeof body.x !== 'number' || typeof body.y !== 'number') {
      return NextResponse.json({ error: 'Invalid element data: type, x, and y are required.' }, { status: 400 });
    }
    if (body.type === 'rectangle' && (typeof body.width !== 'number' || typeof body.height !== 'number')) {
      return NextResponse.json({ error: 'Invalid rectangle data: width and height are required.' }, { status: 400 });
    }
    if (body.type === 'text' && typeof body.text !== 'string') {
      return NextResponse.json({ error: 'Invalid text data: text content is required.' }, { status: 400 });
    }

    // 1. Check if canvas exists (optional, but good practice)
    const getCanvasCommand = new GetCommand({
      TableName: DYNAMODB_CANVASES_TABLE,
      Key: { canvasId },
    });
    const { Item: canvas } = await docClient.send(getCanvasCommand);
    if (!canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    const elementId = uuidv4();
    const timestamp = new Date().toISOString();

    const newElement = {
      canvasId: canvasId, // Partition Key for CanvasElements table
      elementId: elementId, // Sort Key for CanvasElements table
      ...body, // Spread the rest of the element properties from the request
      // Timestamps for the element itself could be added if needed, e.g., createdAt: timestamp
    };

    // 2. Add the new element
    const putElementCommand = new PutCommand({
      TableName: DYNAMODB_ELEMENTS_TABLE,
      Item: newElement,
    });
    await docClient.send(putElementCommand);

    // 3. Update the parent canvas's updatedAt timestamp
    const updateCanvasTimestampCommand = new UpdateCommand({
      TableName: DYNAMODB_CANVASES_TABLE,
      Key: {
        canvasId: canvasId,
      },
      UpdateExpression: 'SET updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': timestamp,
      },
      ReturnValues: 'UPDATED_NEW',
    });
    await docClient.send(updateCanvasTimestampCommand);

    return NextResponse.json(newElement, { status: 201 });

  } catch (error) {
    console.error(`Error adding element to canvas ${canvasId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to add element', details: errorMessage }, { status: 500 });
  }
} 