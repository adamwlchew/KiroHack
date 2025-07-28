import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { createDynamoDbClient } from './dynamoDbClient';
import { logger } from '@pageflow/utils/src/logging/logger';

/**
 * Base DynamoDB repository
 */
export class DynamoDbRepository<T extends Record<string, any>> {
  protected client: DynamoDBDocumentClient;
  protected tableName: string;

  /**
   * Create a new DynamoDB repository
   * @param tableName DynamoDB table name
   * @param client DynamoDB document client (optional)
   */
  constructor(tableName: string, client?: DynamoDBDocumentClient) {
    this.tableName = tableName;
    this.client = client || createDynamoDbClient();
  }

  /**
   * Get an item by its key
   * @param key Item key
   * @returns Item or null if not found
   */
  async getItem(key: Record<string, any>): Promise<T | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: key
      });

      const response = await this.client.send(command);
      return response.Item as T || null;
    } catch (error) {
      logger.error({
        message: 'Error getting item from DynamoDB',
        tableName: this.tableName,
        key,
        error
      });
      throw error;
    }
  }

  /**
   * Put an item
   * @param item Item to put
   * @returns The item
   */
  async putItem(item: T): Promise<T> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item
      });

      await this.client.send(command);
      return item;
    } catch (error) {
      logger.error({
        message: 'Error putting item to DynamoDB',
        tableName: this.tableName,
        item,
        error
      });
      throw error;
    }
  }

  /**
   * Update an item
   * @param key Item key
   * @param updates Updates to apply
   * @returns Updated item
   */
  async updateItem(key: Record<string, any>, updates: Record<string, any>): Promise<T | null> {
    try {
      // Build update expression and attribute values
      const updateExpressionParts: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(updates).forEach(([field, value]) => {
        const attributeName = `#${field}`;
        const attributeValue = `:${field}`;
        
        updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = field;
        expressionAttributeValues[attributeValue] = value;
      });

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const response = await this.client.send(command);
      return response.Attributes as T || null;
    } catch (error) {
      logger.error({
        message: 'Error updating item in DynamoDB',
        tableName: this.tableName,
        key,
        updates,
        error
      });
      throw error;
    }
  }

  /**
   * Delete an item
   * @param key Item key
   * @returns Deleted item
   */
  async deleteItem(key: Record<string, any>): Promise<T | null> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: key,
        ReturnValues: 'ALL_OLD'
      });

      const response = await this.client.send(command);
      return response.Attributes as T || null;
    } catch (error) {
      logger.error({
        message: 'Error deleting item from DynamoDB',
        tableName: this.tableName,
        key,
        error
      });
      throw error;
    }
  }

  /**
   * Query items
   * @param keyConditionExpression Key condition expression
   * @param expressionAttributeValues Expression attribute values
   * @param options Query options
   * @returns Query result
   */
  async query(
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    options: {
      indexName?: string;
      filterExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      limit?: number;
      scanIndexForward?: boolean;
      exclusiveStartKey?: Record<string, any>;
    } = {}
  ): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any> }> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        IndexName: options.indexName,
        FilterExpression: options.filterExpression,
        ExpressionAttributeNames: options.expressionAttributeNames,
        Limit: options.limit,
        ScanIndexForward: options.scanIndexForward,
        ExclusiveStartKey: options.exclusiveStartKey
      });

      const response = await this.client.send(command);
      
      return {
        items: (response.Items || []) as T[],
        lastEvaluatedKey: response.LastEvaluatedKey
      };
    } catch (error) {
      logger.error({
        message: 'Error querying items from DynamoDB',
        tableName: this.tableName,
        keyConditionExpression,
        expressionAttributeValues,
        options,
        error
      });
      throw error;
    }
  }

  /**
   * Scan items
   * @param options Scan options
   * @returns Scan result
   */
  async scan(options: {
    filterExpression?: string;
    expressionAttributeValues?: Record<string, any>;
    expressionAttributeNames?: Record<string, string>;
    limit?: number;
    exclusiveStartKey?: Record<string, any>;
  } = {}): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any> }> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: options.filterExpression,
        ExpressionAttributeValues: options.expressionAttributeValues,
        ExpressionAttributeNames: options.expressionAttributeNames,
        Limit: options.limit,
        ExclusiveStartKey: options.exclusiveStartKey
      });

      const response = await this.client.send(command);
      
      return {
        items: (response.Items || []) as T[],
        lastEvaluatedKey: response.LastEvaluatedKey
      };
    } catch (error) {
      logger.error({
        message: 'Error scanning items from DynamoDB',
        tableName: this.tableName,
        options,
        error
      });
      throw error;
    }
  }

  /**
   * Batch write items
   * @param items Items to write
   * @returns Unprocessed items
   */
  async batchWrite(items: T[]): Promise<T[]> {
    try {
      // Split items into chunks of 25 (DynamoDB batch write limit)
      const chunks: T[][] = [];
      for (let i = 0; i < items.length; i += 25) {
        chunks.push(items.slice(i, i + 25));
      }

      const unprocessedItems: T[] = [];

      // Process each chunk
      for (const chunk of chunks) {
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: chunk.map(item => ({
              PutRequest: {
                Item: item
              }
            }))
          }
        });

        const response = await this.client.send(command);

        // Handle unprocessed items
        if (response.UnprocessedItems && response.UnprocessedItems[this.tableName]) {
          const unprocessed = response.UnprocessedItems[this.tableName]
            .filter(request => request.PutRequest)
            .map(request => request.PutRequest!.Item as T);
          
          unprocessedItems.push(...unprocessed);
        }
      }

      return unprocessedItems;
    } catch (error) {
      logger.error({
        message: 'Error batch writing items to DynamoDB',
        tableName: this.tableName,
        itemCount: items.length,
        error
      });
      throw error;
    }
  }
}