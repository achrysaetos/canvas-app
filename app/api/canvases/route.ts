import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import docClient, { DYNAMODB_CANVASES_TABLE } from '@/lib/dynamodb';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Canvas name is required' }, { status: 400 });
    }

    const canvasId = uuidv4();
    const timestamp = new Date().toISOString();

    const newCanvas = {
      canvasId: canvasId,
      name: name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const putCommand = new PutCommand({
      TableName: DYNAMODB_CANVASES_TABLE,
      Item: newCanvas,
    });

    await docClient.send(putCommand);

    return NextResponse.json(newCanvas, { status: 201 });
  } catch (error) {
    console.error('Error creating canvas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to create canvas', details: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const scanCommand = new ScanCommand({
      TableName: DYNAMODB_CANVASES_TABLE,
    });

    const { Items } = await docClient.send(scanCommand);

    return NextResponse.json(Items || [], { status: 200 });
  } catch (error) {
    console.error('Error fetching canvases:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to fetch canvases', details: errorMessage }, { status: 500 });
  }
} 