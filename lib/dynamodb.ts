import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
  throw new Error(
    "AWS Region, Access Key ID, or Secret Access Key is not configured in environment variables."
  );
}

const ddbClient = new DynamoDBClient({
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

export const DYNAMODB_CANVASES_TABLE = process.env.DYNAMODB_CANVASES_TABLE_NAME;
export const DYNAMODB_ELEMENTS_TABLE = process.env.DYNAMODB_ELEMENTS_TABLE_NAME;

if (!DYNAMODB_CANVASES_TABLE || !DYNAMODB_ELEMENTS_TABLE) {
  throw new Error(
    "DynamoDB table names (Canvases or Elements) are not configured in environment variables."
  );
}

export default docClient; 