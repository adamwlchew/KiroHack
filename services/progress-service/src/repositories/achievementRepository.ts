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
  Achievement,
  AchievementType
} from '@pageflow/types';
import {
  AchievementItem,
  AchievementTriggerContext
} from '../models/progress';
import { v4 as uuidv4 } from 'uuid';

export class AchievementRepository extends DynamoDbRepository<AchievementItem> {
  constructor(tableName: string, client?: DynamoDBDocumentClient) {
    super(tableName, client);
  }

  /**
   * Get achievement by ID
   */
  async getAchievement(userId: string, achievementId: string): Promise<Achievement | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `ACHIEVEMENT#${achievementId}`
        }
      });

      const result = await this.client.send(command);
      
      if (!result.Item) {
        return null;
      }

      return this.mapItemToAchievement(result.Item as AchievementItem);
    } catch (error: any) {
      throw new AppError(
        'Failed to get achievement',
        500,
        'ACHIEVEMENT_GET_ERROR',
        { userId, achievementId, error: error.message }
      );
    }
  }

  /**
   * Get all achievements for a user
   */
  async getUserAchievements(userId: string, type?: AchievementType): Promise<Achievement[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: type ? '#type = :type' : undefined,
        ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'ACHIEVEMENT#',
          ...(type && { ':type': type })
        }
      });

      const result = await this.client.send(command);
      
      return result.Items?.map((item: any) => 
        this.mapItemToAchievement(item as AchievementItem)
      ) || [];
    } catch (error: any) {
      throw new AppError(
        'Failed to get user achievements',
        500,
        'USER_ACHIEVEMENTS_GET_ERROR',
        { userId, type, error: error.message }
      );
    }
  }

  /**
   * Get achievements by type (across all users)
   */
  async getAchievementsByType(type: AchievementType, limit?: number): Promise<Achievement[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `TYPE#${type}`
        },
        Limit: limit || 100,
        ScanIndexForward: false // Most recent first
      });

      const result = await this.client.send(command);
      
      return result.Items?.map((item: any) => 
        this.mapItemToAchievement(item as AchievementItem)
      ) || [];
    } catch (error: any) {
      throw new AppError(
        'Failed to get achievements by type',
        500,
        'ACHIEVEMENTS_BY_TYPE_GET_ERROR',
        { type, error: error.message }
      );
    }
  }

  /**
   * Create a new achievement
   */
  async createAchievement(
    userId: string,
    type: AchievementType,
    title: string,
    description: string,
    iconUrl: string,
    metadata: Record<string, any> = {}
  ): Promise<Achievement> {
    try {
      const achievementId = uuidv4();
      const now = new Date().toISOString();

      const achievementItem: AchievementItem = {
        PK: `USER#${userId}`,
        SK: `ACHIEVEMENT#${achievementId}`,
        GSI1PK: `TYPE#${type}`,
        GSI1SK: `AWARDED#${now}`,
        id: achievementId,
        userId,
        type,
        title,
        description,
        iconUrl,
        awardedAt: now,
        celebrationShown: false,
        metadata,
        createdAt: now,
        updatedAt: now
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: achievementItem
      });

      await this.client.send(command);
      return this.mapItemToAchievement(achievementItem);
    } catch (error: any) {
      throw new AppError(
        'Failed to create achievement',
        500,
        'ACHIEVEMENT_CREATE_ERROR',
        { userId, type, error: error.message }
      );
    }
  }

  /**
   * Mark celebration as shown
   */
  async markCelebrationShown(userId: string, achievementId: string): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `ACHIEVEMENT#${achievementId}`
        },
        UpdateExpression: 'SET celebrationShown = :shown, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':shown': true,
          ':updatedAt': new Date().toISOString()
        },
        ConditionExpression: 'attribute_exists(PK)'
      });

      await this.client.send(command);
    } catch (error: any) {
      throw new AppError(
        'Failed to mark celebration as shown',
        500,
        'CELEBRATION_MARK_ERROR',
        { userId, achievementId, error: error.message }
      );
    }
  }

  /**
   * Check if user already has achievement of specific type
   */
  async hasAchievementType(userId: string, type: AchievementType, metadata?: Record<string, any>): Promise<boolean> {
    try {
      const achievements = await this.getUserAchievements(userId, type);
      
      if (!metadata) {
        return achievements.length > 0;
      }

      // Check if achievement with specific metadata exists
      return achievements.some(achievement => {
        return Object.entries(metadata).every(([key, value]) => 
          achievement.metadata[key] === value
        );
      });
    } catch (error) {
      throw new AppError(
        'Failed to check achievement type',
        500,
        'ACHIEVEMENT_TYPE_CHECK_ERROR',
        { userId, type, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get recent achievements for celebration
   */
  async getRecentAchievements(userId: string, hours: number = 24): Promise<Achievement[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'awardedAt >= :cutoff AND celebrationShown = :notShown',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'ACHIEVEMENT#',
          ':cutoff': cutoffTime,
          ':notShown': false
        }
      });

      const result = await this.client.send(command);
      
      return result.Items?.map(item => 
        this.mapItemToAchievement(item as AchievementItem)
      ) || [];
    } catch (error) {
      throw new AppError(
        'Failed to get recent achievements',
        500,
        'RECENT_ACHIEVEMENTS_GET_ERROR',
        { userId, hours, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Create batch achievements
   */
  async createBatchAchievements(achievements: Array<{
    userId: string;
    type: AchievementType;
    title: string;
    description: string;
    iconUrl: string;
    metadata?: Record<string, any>;
  }>): Promise<Achievement[]> {
    try {
      const now = new Date().toISOString();
      const achievementItems: AchievementItem[] = [];
      const createdAchievements: Achievement[] = [];

      for (const achievement of achievements) {
        const achievementId = uuidv4();
        const item: AchievementItem = {
          PK: `USER#${achievement.userId}`,
          SK: `ACHIEVEMENT#${achievementId}`,
          GSI1PK: `TYPE#${achievement.type}`,
          GSI1SK: `AWARDED#${now}`,
          id: achievementId,
          userId: achievement.userId,
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
          iconUrl: achievement.iconUrl,
          awardedAt: now,
          celebrationShown: false,
          metadata: achievement.metadata || {},
          createdAt: now,
          updatedAt: now
        };
        
        achievementItems.push(item);
        createdAchievements.push(this.mapItemToAchievement(item));
      }

      // Batch write in chunks of 25 (DynamoDB limit)
      const chunks = this.chunkArray(achievementItems, 25);
      
      for (const chunk of chunks) {
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: chunk.map(item => ({
              PutRequest: { Item: item }
            }))
          }
        });

        await this.client.send(command);
      }

      return createdAchievements;
    } catch (error) {
      throw new AppError(
        'Failed to create batch achievements',
        500,
        'BATCH_ACHIEVEMENTS_CREATE_ERROR',
        { count: achievements.length, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Utility method to chunk array
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Map DynamoDB item to Achievement domain model
   */
  private mapItemToAchievement(item: AchievementItem): Achievement {
    return {
      id: item.id,
      userId: item.userId,
      type: item.type,
      title: item.title,
      description: item.description,
      iconUrl: item.iconUrl,
      awardedAt: new Date(item.awardedAt),
      celebrationShown: item.celebrationShown,
      metadata: item.metadata
    };
  }
}