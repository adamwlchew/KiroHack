import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { DynamoDbRepository } from '@pageflow/db-utils';
import { AppError } from '@pageflow/utils';
import {
  Milestone,
  MilestoneType,
  MilestoneCriteria
} from '@pageflow/types';
import {
  MilestoneItem,
  MilestoneDetectionContext
} from '../models/progress';
import { v4 as uuidv4 } from 'uuid';

export class MilestoneRepository extends DynamoDbRepository<MilestoneItem> {
  constructor(tableName: string, client?: DynamoDBDocumentClient) {
    super(tableName, client);
  }

  /**
   * Get milestone by ID
   */
  async getMilestone(userId: string, milestoneId: string): Promise<Milestone | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `MILESTONE#${milestoneId}`
        }
      });

      const result = await this.client.send(command);
      
      if (!result.Item) {
        return null;
      }

      return this.mapItemToMilestone(result.Item as MilestoneItem);
    } catch (error: any) {
      throw new AppError(
        'Failed to get milestone',
        500,
        'MILESTONE_GET_ERROR',
        { userId, milestoneId, error: error.message }
      );
    }
  }

  /**
   * Get all milestones for a user
   */
  async getUserMilestones(userId: string, pathId?: string): Promise<Milestone[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: pathId ? 'pathId = :pathId' : undefined,
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'MILESTONE#',
          ...(pathId && { ':pathId': pathId })
        }
      });

      const result = await this.client.send(command);
      
      return result.Items?.map((item: any) => 
        this.mapItemToMilestone(item as MilestoneItem)
      ) || [];
    } catch (error) {
      throw new AppError(
        'Failed to get user milestones',
        500,
        'USER_MILESTONES_GET_ERROR',
        { userId, pathId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get milestones for a learning path (across all users)
   */
  async getPathMilestones(pathId: string, limit?: number): Promise<Milestone[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `PATH#${pathId}`
        },
        Limit: limit || 100,
        ScanIndexForward: false // Most recent first
      });

      const result = await this.client.send(command);
      
      return result.Items?.map((item: any) => 
        this.mapItemToMilestone(item as MilestoneItem)
      ) || [];
    } catch (error) {
      throw new AppError(
        'Failed to get path milestones',
        500,
        'PATH_MILESTONES_GET_ERROR',
        { pathId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Create a new milestone
   */
  async createMilestone(
    userId: string,
    pathId: string,
    type: MilestoneType,
    title: string,
    description: string,
    criteria: MilestoneCriteria,
    metadata: Record<string, any> = {}
  ): Promise<Milestone> {
    try {
      const milestoneId = uuidv4();
      const now = new Date().toISOString();

      const milestoneItem: MilestoneItem = {
        PK: `USER#${userId}`,
        SK: `MILESTONE#${milestoneId}`,
        GSI1PK: `PATH#${pathId}`,
        GSI1SK: `MILESTONE#${now}`,
        id: milestoneId,
        userId,
        pathId,
        type,
        title,
        description,
        criteria,
        celebrationShown: false,
        metadata,
        createdAt: now,
        updatedAt: now
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: milestoneItem
      });

      await this.client.send(command);
      return this.mapItemToMilestone(milestoneItem);
    } catch (error) {
      throw new AppError(
        'Failed to create milestone',
        500,
        'MILESTONE_CREATE_ERROR',
        { userId, pathId, type, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Mark milestone as achieved
   */
  async achieveMilestone(userId: string, milestoneId: string): Promise<Milestone> {
    try {
      const now = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `MILESTONE#${milestoneId}`
        },
        UpdateExpression: 'SET achievedAt = :achievedAt, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':achievedAt': now,
          ':updatedAt': now
        },
        ConditionExpression: 'attribute_exists(PK) AND attribute_not_exists(achievedAt)',
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.client.send(command);
      return this.mapItemToMilestone(result.Attributes as MilestoneItem);
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new AppError(
          'Milestone already achieved or does not exist',
          409,
          'MILESTONE_ALREADY_ACHIEVED',
          { userId, milestoneId }
        );
      }
      throw new AppError(
        'Failed to achieve milestone',
        500,
        'MILESTONE_ACHIEVE_ERROR',
        { userId, milestoneId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Mark celebration as shown
   */
  async markCelebrationShown(userId: string, milestoneId: string): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `MILESTONE#${milestoneId}`
        },
        UpdateExpression: 'SET celebrationShown = :shown, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':shown': true,
          ':updatedAt': new Date().toISOString()
        },
        ConditionExpression: 'attribute_exists(PK)'
      });

      await this.client.send(command);
    } catch (error) {
      throw new AppError(
        'Failed to mark celebration as shown',
        500,
        'CELEBRATION_MARK_ERROR',
        { userId, milestoneId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Create default milestones for a learning path
   */
  async createDefaultMilestones(userId: string, pathId: string): Promise<Milestone[]> {
    try {
      const defaultMilestones = [
        {
          type: MilestoneType.PATH_STARTED,
          title: 'Learning Journey Begins!',
          description: 'You\'ve started your learning path. Great job taking the first step!',
          criteria: {
            type: MilestoneType.PATH_STARTED,
            conditions: { pathId }
          }
        },
        {
          type: MilestoneType.MODULE_COMPLETED,
          title: 'Module Master',
          description: 'You\'ve completed your first module. Keep up the excellent work!',
          criteria: {
            type: MilestoneType.MODULE_COMPLETED,
            threshold: 1,
            conditions: { pathId }
          }
        },
        {
          type: MilestoneType.PATH_COMPLETED,
          title: 'Path Champion',
          description: 'Congratulations! You\'ve completed the entire learning path!',
          criteria: {
            type: MilestoneType.PATH_COMPLETED,
            conditions: { pathId }
          }
        },
        {
          type: MilestoneType.STREAK_ACHIEVED,
          title: 'Consistency Champion',
          description: 'You\'ve maintained a 7-day learning streak. Fantastic dedication!',
          criteria: {
            type: MilestoneType.STREAK_ACHIEVED,
            threshold: 7,
            timeframe: 7,
            conditions: { pathId }
          }
        }
      ];

      const milestones: Milestone[] = [];
      
      for (const milestone of defaultMilestones) {
        const created = await this.createMilestone(
          userId,
          pathId,
          milestone.type,
          milestone.title,
          milestone.description,
          milestone.criteria
        );
        milestones.push(created);
      }

      return milestones;
    } catch (error) {
      throw new AppError(
        'Failed to create default milestones',
        500,
        'DEFAULT_MILESTONES_CREATE_ERROR',
        { userId, pathId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Map DynamoDB item to Milestone domain model
   */
  private mapItemToMilestone(item: MilestoneItem): Milestone {
    return {
      id: item.id,
      userId: item.userId,
      pathId: item.pathId,
      type: item.type,
      title: item.title,
      description: item.description,
      criteria: item.criteria,
      achievedAt: item.achievedAt ? new Date(item.achievedAt) : undefined,
      celebrationShown: item.celebrationShown,
      metadata: item.metadata
    };
  }
}