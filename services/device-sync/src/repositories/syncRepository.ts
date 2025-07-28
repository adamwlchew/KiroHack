import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SyncData, SyncConflict, OfflineData } from '@pageflow/types';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@pageflow/utils';

export class SyncRepository {
  private client: DynamoDBDocumentClient;
  private syncDataTable: string;
  private offlineDataTable: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({ region: config.aws.region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.syncDataTable = config.aws.dynamodb.syncDataTable;
    this.offlineDataTable = config.aws.dynamodb.offlineDataTable;
  }

  // Sync Data Operations
  async createSyncData(syncData: Omit<SyncData, 'id'>): Promise<SyncData> {
    const id = uuidv4();
    const data: SyncData = {
      id,
      ...syncData,
    };

    const command = new PutCommand({
      TableName: this.syncDataTable,
      Item: data,
    });

    try {
      await this.client.send(command);
      return data;
    } catch (error: any) {
      throw new AppError('Failed to create sync data', 500, error);
    }
  }

  async getSyncData(id: string): Promise<SyncData | null> {
    const command = new GetCommand({
      TableName: this.syncDataTable,
      Key: { id },
    });

    try {
      const result = await this.client.send(command);
      return result.Item ? (result.Item as SyncData) : null;
    } catch (error: any) {
      throw new AppError('Failed to get sync data', 500, error);
    }
  }

  async getUserSyncData(userId: string, dataType?: string): Promise<SyncData[]> {
    const command = new QueryCommand({
      TableName: this.syncDataTable,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: dataType ? 'dataType = :dataType' : undefined,
      ExpressionAttributeValues: {
        ':userId': userId,
        ...(dataType && { ':dataType': dataType }),
      },
    });

    try {
      const result = await this.client.send(command);
      return (result.Items || []) as SyncData[];
    } catch (error: any) {
      throw new AppError('Failed to get user sync data', 500, error);
    }
  }

  async getDeviceSyncData(deviceId: string, dataType?: string): Promise<SyncData[]> {
    const command = new QueryCommand({
      TableName: this.syncDataTable,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      FilterExpression: dataType ? 'dataType = :dataType' : undefined,
      ExpressionAttributeValues: {
        ':deviceId': deviceId,
        ...(dataType && { ':dataType': dataType }),
      },
    });

    try {
      const result = await this.client.send(command);
      return (result.Items || []) as SyncData[];
    } catch (error: any) {
      throw new AppError('Failed to get device sync data', 500, error);
    }
  }

  async updateSyncData(id: string, updates: Partial<SyncData>): Promise<SyncData> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Always update lastModified
    updateExpressions.push('#lastModified = :lastModified');
    expressionAttributeNames['#lastModified'] = 'lastModified';
    expressionAttributeValues[':lastModified'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: this.syncDataTable,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    try {
      const result = await this.client.send(command);
      return result.Attributes as SyncData;
    } catch (error: any) {
      throw new AppError('Failed to update sync data', 500, error);
    }
  }

  async deleteSyncData(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.syncDataTable,
      Key: { id },
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      throw new AppError('Failed to delete sync data', 500, error);
    }
  }

  async getPendingSyncData(userId: string): Promise<SyncData[]> {
    const command = new QueryCommand({
      TableName: this.syncDataTable,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'syncStatus = :status',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':status': 'pending',
      },
    });

    try {
      const result = await this.client.send(command);
      return (result.Items || []) as SyncData[];
    } catch (error: any) {
      throw new AppError('Failed to get pending sync data', 500, error);
    }
  }

  async getConflictedSyncData(userId: string): Promise<SyncData[]> {
    const command = new QueryCommand({
      TableName: this.syncDataTable,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'syncStatus = :status',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':status': 'conflict',
      },
    });

    try {
      const result = await this.client.send(command);
      return (result.Items || []) as SyncData[];
    } catch (error: any) {
      throw new AppError('Failed to get conflicted sync data', 500, error);
    }
  }

  // Offline Data Operations
  async createOfflineData(offlineData: Omit<OfflineData, 'id'>): Promise<OfflineData> {
    const id = uuidv4();
    const data: OfflineData = {
      id,
      ...offlineData,
    };

    const command = new PutCommand({
      TableName: this.offlineDataTable,
      Item: data,
    });

    try {
      await this.client.send(command);
      return data;
    } catch (error: any) {
      throw new AppError('Failed to create offline data', 500, error);
    }
  }

  async getOfflineData(id: string): Promise<OfflineData | null> {
    const command = new GetCommand({
      TableName: this.offlineDataTable,
      Key: { id },
    });

    try {
      const result = await this.client.send(command);
      return result.Item ? (result.Item as OfflineData) : null;
    } catch (error: any) {
      throw new AppError('Failed to get offline data', 500, error);
    }
  }

  async getDeviceOfflineData(deviceId: string, synced: boolean = false): Promise<OfflineData[]> {
    const command = new QueryCommand({
      TableName: this.offlineDataTable,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      FilterExpression: 'synced = :synced',
      ExpressionAttributeValues: {
        ':deviceId': deviceId,
        ':synced': synced,
      },
    });

    try {
      const result = await this.client.send(command);
      return (result.Items || []) as OfflineData[];
    } catch (error: any) {
      throw new AppError('Failed to get device offline data', 500, error);
    }
  }

  async markOfflineDataSynced(id: string): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.offlineDataTable,
      Key: { id },
      UpdateExpression: 'SET synced = :synced',
      ExpressionAttributeValues: {
        ':synced': true,
      },
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      throw new AppError('Failed to mark offline data as synced', 500, error);
    }
  }

  async deleteOfflineData(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.offlineDataTable,
      Key: { id },
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      throw new AppError('Failed to delete offline data', 500, error);
    }
  }

  async batchCreateSyncData(syncDataList: Omit<SyncData, 'id'>[]): Promise<SyncData[]> {
    const items: SyncData[] = syncDataList.map(data => ({
      id: uuidv4(),
      ...data,
    }));

    const batches = this.chunkArray(items, 25); // DynamoDB batch limit
    const results: SyncData[] = [];

    for (const batch of batches) {
      const writeRequests = batch.map(item => ({
        PutRequest: {
          Item: item,
        },
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [this.syncDataTable]: writeRequests,
        },
      });

      try {
        await this.client.send(command);
        results.push(...batch);
      } catch (error: any) {
        throw new AppError('Failed to batch create sync data', 500, error);
      }
    }

    return results;
  }

  async cleanupOldSyncData(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // This would typically be implemented with a scan operation
    // For production, consider using DynamoDB TTL instead
    // This is a simplified implementation
    return 0; // Placeholder
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}