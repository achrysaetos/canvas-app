import { NextResponse } from 'next/server';
import docClient, { DYNAMODB_CANVASES_TABLE, DYNAMODB_ELEMENTS_TABLE } from '@/lib/dynamodb';
import { UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

interface Params {
  canvasId: string;
  elementId: string;
}

// Reusing the CanvasElementData interface, but all fields are optional for an update
interface CanvasElementUpdateData {
  type?: 'rectangle' | 'text';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // Add any other updatable fields from your spec
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { canvasId, elementId } = params;

  if (!canvasId || !elementId) {
    return NextResponse.json({ error: 'Canvas ID and Element ID are required' }, { status: 400 });
  }

  try {
    const body = await request.json() as CanvasElementUpdateData;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Request body cannot be empty for an update' }, { status: 400 });
    }

    // Construct UpdateExpression and ExpressionAttributeValues dynamically
    let updateExpression = 'SET';
    const expressionAttributeValues: { [key: string]: any } = {};
    const expressionAttributeNames: { [key: string]: string } = {}; // For reserved keywords
    let firstAttribute = true;

    // It's good practice to prevent updating the primary keys (canvasId, elementId) or type if it dictates structure
    // Also, createdAt should not be changed, and updatedAt will be set explicitly with a new server timestamp.
    const forbiddenUpdates = ['canvasId', 'elementId', 'type', 'createdAt', 'updatedAt']; 

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || forbiddenUpdates.includes(key)) continue; // Skip undefined values and forbidden keys

      if (!firstAttribute) {
        updateExpression += ',';
      }
      // Handle potential reserved keywords in DynamoDB, e.g., 'text', 'type', 'name'
      // Using # for attribute names and : for values
      const attributeKeyPlaceholder = `#attr_${key}`;
      const attributeValuePlaceholder = `:val_${key}`;
      
      updateExpression += ` ${attributeKeyPlaceholder} = ${attributeValuePlaceholder}`;
      expressionAttributeNames[attributeKeyPlaceholder] = key; 
      expressionAttributeValues[attributeValuePlaceholder] = value;
      firstAttribute = false;
    }

    if (Object.keys(expressionAttributeValues).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided or only forbidden fields were sent.' }, { status: 400 });
    }
    
    const timestamp = new Date().toISOString();
    // Add updatedAt to the element itself
    if (!firstAttribute) updateExpression += ',';
    updateExpression += ` #updatedAtElement = :updatedAtElement`;
    expressionAttributeNames['#updatedAtElement'] = 'updatedAt'; // Assuming elements have an 'updatedAt'
    expressionAttributeValues[':updatedAtElement'] = timestamp;


    const updateElementCommand = new UpdateCommand({
      TableName: DYNAMODB_ELEMENTS_TABLE,
      Key: {
        canvasId: canvasId,
        elementId: elementId,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ReturnValues: 'ALL_NEW', // Returns all attributes of the item as they appear after the update
    });

    const { Attributes: updatedElement } = await docClient.send(updateElementCommand);

    if (!updatedElement) {
      // This case might occur if the element didn't exist, UpdateCommand doesn't error by default for non-existent items unless a condition fails.
      // For stricter checking, a ConditionExpression like 'attribute_exists(elementId)' could be added.
      return NextResponse.json({ error: 'Element not found or no update occurred' }, { status: 404 });
    }

    // Update the parent canvas's updatedAt timestamp
    const updateCanvasTimestampCommand = new UpdateCommand({
      TableName: DYNAMODB_CANVASES_TABLE,
      Key: {
        canvasId: canvasId,
      },
      UpdateExpression: 'SET updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': timestamp, // Use the same timestamp for consistency
      },
    });
    await docClient.send(updateCanvasTimestampCommand);

    // Map elementId to id for the response, consistent with GET all elements
    if (updatedElement) {
      const { elementId: elId, ...rest } = updatedElement;
      const elementToReturn = { id: elId, ...rest };
      return NextResponse.json(elementToReturn, { status: 200 });
    }
    // Should not be reached if updatedElement was null due to earlier check, but as a fallback:
    return NextResponse.json({ error: 'Element updated but could not retrieve complete data' }, { status: 500 });

  } catch (error) {
    console.error(`Error updating element ${elementId} in canvas ${canvasId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to update element', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const { canvasId, elementId } = params;

  if (!canvasId || !elementId) {
    return NextResponse.json({ error: 'Canvas ID and Element ID are required' }, { status: 400 });
  }

  try {
    // Optional: Check if the element exists before attempting to delete.
    // This can prevent an unnecessary update to the parent canvas if the element is already gone.
    // However, DeleteCommand itself doesn't error if the item doesn't exist, it just does nothing.
    // For this implementation, we'll proceed directly to delete.

    const deleteElementCommand = new DeleteCommand({
      TableName: DYNAMODB_ELEMENTS_TABLE,
      Key: {
        canvasId: canvasId,
        elementId: elementId,
      },
      ReturnValues: 'ALL_OLD', // Returns the item as it was before deletion, if found.
    });

    const { Attributes: deletedElement } = await docClient.send(deleteElementCommand);

    if (!deletedElement) {
      return NextResponse.json({ error: 'Element not found' }, { status: 404 });
    }

    // Update the parent canvas's updatedAt timestamp
    const timestamp = new Date().toISOString();
    const updateCanvasTimestampCommand = new UpdateCommand({
      TableName: DYNAMODB_CANVASES_TABLE,
      Key: {
        canvasId: canvasId,
      },
      UpdateExpression: 'SET updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': timestamp,
      },
    });
    await docClient.send(updateCanvasTimestampCommand);

    return NextResponse.json({ message: 'Element deleted successfully', deletedElement }, { status: 200 });
    // Alternatively, for a 204 response (No Content):
    // return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`Error deleting element ${elementId} in canvas ${canvasId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to delete element', details: errorMessage }, { status: 500 });
  }
} 