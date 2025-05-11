import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import docClient, { DYNAMODB_CANVASES_TABLE, DYNAMODB_ELEMENTS_TABLE } from '@/lib/dynamodb';
import { PutCommand, UpdateCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

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
  id?: string;
  elementId?: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { canvasId } = params;

  if (!canvasId) {
    return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
  }

  try {
    const command = new QueryCommand({
      TableName: DYNAMODB_ELEMENTS_TABLE,
      KeyConditionExpression: 'canvasId = :canvasIdVal',
      ExpressionAttributeValues: {
        ':canvasIdVal': canvasId,
      },
    });

    const { Items } = await docClient.send(command);

    // The frontend expects 'id' not 'elementId'. We should map this.
    // Also, ensure all relevant fields are returned and any stray 'id' from old data is handled.
    const elementsToReturn = Items?.map(item => {
        const { elementId, id: oldIdField, ...attributes } = item as any; // Cast to any to handle potential oldIdField
        return { 
            id: elementId, // Use elementId from DB as the canonical 'id' for the client
            ...attributes // Spread other attributes
        };
    }) || [];

    return NextResponse.json(elementsToReturn);

  } catch (error) {
    console.error(`Error fetching elements for canvas ${canvasId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to fetch elements', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { canvasId } = params;

  if (!canvasId) {
    return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as Omit<CanvasElementData, 'id' | 'elementId'>; // Expect body without any id fields

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

    const generatedElementId = uuidv4(); // Backend generates the canonical ID
    const timestamp = new Date().toISOString();

    const newElementItem = { // This is the item to be saved in DynamoDB
      canvasId: canvasId,
      elementId: generatedElementId, // Use backend-generated ID as elementId
      ...body, // Spread other properties from the request body
      // Ensure body.id is not part of ...body or is ignored if it was
      createdAt: timestamp, // Add createdAt timestamp for the element
      updatedAt: timestamp, // Add updatedAt timestamp for the element
    };
    // Explicitly remove id from newElement if it came from body, to avoid confusion
    // However, by typing body as Omit<CanvasElementData, 'id' | 'elementId'>, we signal it shouldn't be there.
    // If body could still contain it: delete (newElementItem as any).id;


    // 2. Add the new element
    const putElementCommand = new PutCommand({
      TableName: DYNAMODB_ELEMENTS_TABLE,
      Item: newElementItem,
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

    // Prepare the response object for the client
    // The client expects an 'id' field
    const elementToReturn = {
      ...newElementItem, // Contains elementId, createdAt, updatedAt etc.
      id: newElementItem.elementId, // Map elementId to id
    };
    delete (elementToReturn as any).elementId; // Remove elementId to avoid client confusion if it only expects 'id'


    return NextResponse.json(elementToReturn, { status: 201 });

  } catch (error) {
    console.error(`Error adding element to canvas ${canvasId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to add element', details: errorMessage }, { status: 500 });
  }
} 