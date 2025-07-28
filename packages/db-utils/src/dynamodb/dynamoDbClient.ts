import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB client configuration
 */
export interface DynamoDbConfig {
  region?: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Create a DynamoDB document client
 * @param config DynamoDB configuration
 * @returns DynamoDB document client
 */
export function createDynamoDbClient(config: DynamoDbConfig = {}): DynamoDBDocumentClient {
  const clientConfig: DynamoDbConfig = {
    region: process.env.AWS_REGION || 'ap-southeast-2',
    ...config
  };

  // For local development, use a local DynamoDB endpoint if specified
  if (process.env.DYNAMODB_ENDPOINT) {
    clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  }

  const client = new DynamoDBClient(clientConfig);
  
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true
    },
    unmarshallOptions: {
      wrapNumbers: false
    }
  });
}