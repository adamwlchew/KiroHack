import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Device, DeviceRegistrationRequest, DeviceUpdateRequest } from '@pageflow/types';
import { DeviceModel } from '../models/device';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@pageflow/utils';

export class DeviceRepository {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({ region: config.aws.region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = config.aws.dynamodb.devicesTable;
  }

  async create(userId: string, deviceData: DeviceRegistrationRequest, ipAddress?: string): Promise<Device> {
    const deviceId = uuidv4();
    const now = new Date();

    const device = new DeviceModel({
      id: deviceId,
      userId,
      ...deviceData,
      metadata: {
        ...deviceData.metadata,
        ipAddress,
      },
      isActive: true,
      registeredAt: now,
      updatedAt: now,
    });

    const command = new PutCommand({
      TableName: this.tableName,
      Item: device.toJSON(),
      ConditionExpression: 'attribute_not_exists(id)',
    });

    try {
      await this.client.send(command);
      return device.toJSON();
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new AppError('Device already exists', 409);
      }
      throw new AppError('Failed to create device', 500, error);
    }
  }

  async findById(deviceId: string): Promise<Device | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id: deviceId },
    });

    try {
      const result = await this.client.send(command);
      return result.Item ? (result.Item as Device) : null;
    } catch (error: any) {
      throw new AppError('Failed to find device', 500, error);
    }
  }

  async findByUserId(userId: string): Promise<Device[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    try {
      const result = await this.client.send(command);
      return (result.Items || []) as Device[];
    } catch (error: any) {
      throw new AppError('Failed to find devices by user', 500, error);
    }
  }

  async findActiveByUserId(userId: string): Promise<Device[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isActive': true,
      },
    });

    try {
      const result = await this.client.send(command);
      return (result.Items || []) as Device[];
    } catch (error: any) {
      throw new AppError('Failed to find active devices', 500, error);
    }
  }

  async update(deviceId: string, updates: DeviceUpdateRequest): Promise<Device> {
    const device = await this.findById(deviceId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.deviceName !== undefined) {
      updateExpressions.push('#deviceName = :deviceName');
      expressionAttributeNames['#deviceName'] = 'deviceName';
      expressionAttributeValues[':deviceName'] = updates.deviceName;
    }

    if (updates.capabilities !== undefined) {
      updateExpressions.push('#capabilities = :capabilities');
      expressionAttributeNames['#capabilities'] = 'capabilities';
      expressionAttributeValues[':capabilities'] = {
        ...device.capabilities,
        ...updates.capabilities,
      };
    }

    if (updates.metadata !== undefined) {
      updateExpressions.push('#metadata = :metadata');
      expressionAttributeNames['#metadata'] = 'metadata';
      expressionAttributeValues[':metadata'] = {
        ...device.metadata,
        ...updates.metadata,
      };
    }

    if (updates.isActive !== undefined) {
      updateExpressions.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = updates.isActive;
    }

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: deviceId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    try {
      const result = await this.client.send(command);
      return result.Attributes as Device;
    } catch (error: any) {
      throw new AppError('Failed to update device', 500, error);
    }
  }

  async updateLastSync(deviceId: string): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: deviceId },
      UpdateExpression: 'SET #lastSyncAt = :lastSyncAt, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#lastSyncAt': 'lastSyncAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':lastSyncAt': new Date().toISOString(),
        ':updatedAt': new Date().toISOString(),
      },
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      throw new AppError('Failed to update last sync time', 500, error);
    }
  }

  async delete(deviceId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id: deviceId },
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      throw new AppError('Failed to delete device', 500, error);
    }
  }

  async deactivate(deviceId: string): Promise<Device> {
    return this.update(deviceId, { isActive: false });
  }

  async activate(deviceId: string): Promise<Device> {
    return this.update(deviceId, { isActive: true });
  }

  async findInactiveDevices(olderThanDays: number = 30): Promise<Device[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: '#lastSyncAt < :cutoffDate OR (attribute_not_exists(#lastSyncAt) AND #registeredAt < :cutoffDate)',
      ExpressionAttributeNames: {
        '#lastSyncAt': 'lastSyncAt',
        '#registeredAt': 'registeredAt',
      },
      ExpressionAttributeValues: {
        ':cutoffDate': cutoffDate.toISOString(),
      },
    });

    try {
      const result = await this.client.send(command);
      return (result.Items || []) as Device[];
    } catch (error: any) {
      throw new AppError('Failed to find inactive devices', 500, error);
    }
  }
}