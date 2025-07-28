import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  BatchGetCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { DynamoDbRepository } from '@pageflow/db-utils';
import { AppError } from '@pageflow/utils';
import {
  Progress,
  ProgressStatus,
  ModuleProgress,
  UnitProgress,
  ContentProgress
} from '@pageflow/types';
import {
  ProgressItem,
  ProgressUpdateRequest,
  ProgressQueryParams,
  DeviceSyncStatusItem
} from '../models/progress';

export class ProgressRepository {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client: DynamoDBClient, tableName: string) {
    this.client = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  /**
   * Get user progress for a specific learning path
   */
  async getProgress(userId: string, pathId: string): Promise<Progress | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `PATH#${pathId}`
        }
      });

      const result = await this.client.send(command);
      
      if (!result.Item) {
        return null;
      }

      return this.mapItemToProgress(result.Item as ProgressItem);
    } catch (error) {
      throw new AppError(
        'Failed to get progress',
        500,
        'PROGRESS_GET_ERROR',
        { userId, pathId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get all progress for a user
   */
  async getUserProgress(params: ProgressQueryParams): Promise<{
    progress: Progress[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${params.userId}`
        },
        FilterExpression: params.includeCompleted ? undefined : 'attribute_not_exists(completedAt)',
        Limit: params.limit || 50,
        ExclusiveStartKey: params.lastEvaluatedKey
      });

      const result = await this.client.send(command);
      
      const progress = result.Items?.map(item => 
        this.mapItemToProgress(item as ProgressItem)
      ) || [];

      return {
        progress,
        lastEvaluatedKey: result.LastEvaluatedKey
      };
    } catch (error) {
      throw new AppError(
        'Failed to get user progress',
        500,
        'USER_PROGRESS_GET_ERROR',
        { userId: params.userId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Create new progress record
   */
  async createProgress(userId: string, pathId: string): Promise<Progress> {
    try {
      const now = new Date().toISOString();
      const progressItem: ProgressItem = {
        PK: `USER#${userId}`,
        SK: `PATH#${pathId}`,
        GSI1PK: `PATH#${pathId}`,
        GSI1SK: `USER#${userId}`,
        userId,
        pathId,
        moduleProgress: [],
        overallCompletion: 0,
        startedAt: now,
        lastAccessedAt: now,
        deviceSyncStatus: {
          lastSyncedAt: now,
          syncedDevices: [],
          pendingSync: false
        },
        createdAt: now,
        updatedAt: now
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: progressItem,
        ConditionExpression: 'attribute_not_exists(PK)'
      });

      await this.client.send(command);
      return this.mapItemToProgress(progressItem);
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new AppError(
          'Progress already exists',
          409,
          'PROGRESS_ALREADY_EXISTS',
          { userId, pathId }
        );
      }
      throw new AppError(
        'Failed to create progress',
        500,
        'PROGRESS_CREATE_ERROR',
        { userId, pathId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Update progress for a specific content item
   */
  async updateProgress(request: ProgressUpdateRequest): Promise<Progress> {
    try {
      const { userId, pathId, moduleId, unitId, contentItemId, status, timeSpent, lastPosition, deviceId } = request;
      const now = new Date().toISOString();

      // Get current progress or create if doesn't exist
      let currentProgress = await this.getProgress(userId, pathId);
      if (!currentProgress) {
        currentProgress = await this.createProgress(userId, pathId);
      }

      // Update the specific content progress
      const updatedModuleProgress = this.updateContentProgress(
        currentProgress.moduleProgress,
        moduleId,
        unitId,
        contentItemId,
        status,
        timeSpent,
        lastPosition
      );

      // Calculate overall completion
      const overallCompletion = this.calculateOverallCompletion(updatedModuleProgress);

      // Update device sync status
      const deviceSyncStatus: DeviceSyncStatusItem = {
        lastSyncedAt: now,
        syncedDevices: currentProgress.deviceSyncStatus.syncedDevices.includes(deviceId) 
          ? currentProgress.deviceSyncStatus.syncedDevices 
          : [...currentProgress.deviceSyncStatus.syncedDevices, deviceId],
        pendingSync: false
      };

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `PATH#${pathId}`
        },
        UpdateExpression: `
          SET moduleProgress = :moduleProgress,
              overallCompletion = :overallCompletion,
              lastAccessedAt = :lastAccessedAt,
              deviceSyncStatus = :deviceSyncStatus,
              updatedAt = :updatedAt
              ${overallCompletion === 100 ? ', completedAt = :completedAt' : ''}
        `,
        ExpressionAttributeValues: {
          ':moduleProgress': updatedModuleProgress,
          ':overallCompletion': overallCompletion,
          ':lastAccessedAt': now,
          ':deviceSyncStatus': deviceSyncStatus,
          ':updatedAt': now,
          ...(overallCompletion === 100 && { ':completedAt': now })
        },
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.client.send(command);
      return this.mapItemToProgress(result.Attributes as ProgressItem);
    } catch (error) {
      throw new AppError(
        'Failed to update progress',
        500,
        'PROGRESS_UPDATE_ERROR',
        { request, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get progress for multiple users and paths (for reporting)
   */
  async getBatchProgress(requests: Array<{ userId: string; pathId: string }>): Promise<Progress[]> {
    try {
      const keys = requests.map(({ userId, pathId }) => ({
        PK: `USER#${userId}`,
        SK: `PATH#${pathId}`
      }));

      const command = new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: keys
          }
        }
      });

      const result = await this.client.send(command);
      const items = result.Responses?.[this.tableName] || [];
      
      return items.map(item => this.mapItemToProgress(item as ProgressItem));
    } catch (error) {
      throw new AppError(
        'Failed to get batch progress',
        500,
        'BATCH_PROGRESS_GET_ERROR',
        { requests, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Update content progress within module structure
   */
  private updateContentProgress(
    moduleProgress: ModuleProgress[],
    moduleId: string,
    unitId: string,
    contentItemId: string,
    status: ProgressStatus,
    timeSpent: number,
    lastPosition?: number
  ): ModuleProgress[] {
    const now = new Date();
    
    // Find or create module progress
    let targetModule = moduleProgress.find(m => m.moduleId === moduleId);
    if (!targetModule) {
      targetModule = {
        moduleId,
        unitProgress: [],
        completion: 0,
        startedAt: now
      };
      moduleProgress.push(targetModule);
    }

    // Find or create unit progress
    let targetUnit = targetModule.unitProgress.find(u => u.unitId === unitId);
    if (!targetUnit) {
      targetUnit = {
        unitId,
        contentProgress: [],
        completion: 0,
        startedAt: now
      };
      targetModule.unitProgress.push(targetUnit);
    }

    // Find or create content progress
    let targetContent = targetUnit.contentProgress.find(c => c.contentItemId === contentItemId);
    if (!targetContent) {
      targetContent = {
        contentItemId,
        status: ProgressStatus.NOT_STARTED,
        timeSpent: 0
      };
      targetUnit.contentProgress.push(targetContent);
    }

    // Update content progress
    targetContent.status = status;
    targetContent.timeSpent += timeSpent;
    if (lastPosition !== undefined) {
      targetContent.lastPosition = lastPosition;
    }
    if (status === ProgressStatus.COMPLETED && !targetContent.completedAt) {
      targetContent.completedAt = now;
    }

    // Recalculate unit completion
    const completedContent = targetUnit.contentProgress.filter(c => c.status === ProgressStatus.COMPLETED).length;
    targetUnit.completion = (completedContent / targetUnit.contentProgress.length) * 100;
    if (targetUnit.completion === 100 && !targetUnit.completedAt) {
      targetUnit.completedAt = now;
    }

    // Recalculate module completion
    const completedUnits = targetModule.unitProgress.filter(u => u.completion === 100).length;
    targetModule.completion = (completedUnits / targetModule.unitProgress.length) * 100;
    if (targetModule.completion === 100 && !targetModule.completedAt) {
      targetModule.completedAt = now;
    }

    return moduleProgress;
  }

  /**
   * Calculate overall completion percentage
   */
  private calculateOverallCompletion(moduleProgress: ModuleProgress[]): number {
    if (moduleProgress.length === 0) return 0;
    
    const totalCompletion = moduleProgress.reduce((sum, module) => sum + module.completion, 0);
    return Math.round(totalCompletion / moduleProgress.length);
  }

  /**
   * Map DynamoDB item to Progress domain model
   */
  private mapItemToProgress(item: ProgressItem): Progress {
    return {
      userId: item.userId,
      pathId: item.pathId,
      moduleProgress: item.moduleProgress.map(module => ({
        ...module,
        startedAt: new Date(module.startedAt),
        completedAt: module.completedAt ? new Date(module.completedAt) : undefined,
        unitProgress: module.unitProgress.map(unit => ({
          ...unit,
          startedAt: new Date(unit.startedAt),
          completedAt: unit.completedAt ? new Date(unit.completedAt) : undefined,
          contentProgress: unit.contentProgress.map(content => ({
            ...content,
            completedAt: content.completedAt ? new Date(content.completedAt) : undefined
          }))
        }))
      })),
      overallCompletion: item.overallCompletion,
      startedAt: new Date(item.startedAt),
      lastAccessedAt: new Date(item.lastAccessedAt),
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
      deviceSyncStatus: {
        lastSyncedAt: new Date(item.deviceSyncStatus.lastSyncedAt),
        syncedDevices: item.deviceSyncStatus.syncedDevices,
        pendingSync: item.deviceSyncStatus.pendingSync
      }
    };
  }
}