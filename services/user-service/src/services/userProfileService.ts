import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@pageflow/utils';
import { AppError } from '@pageflow/utils';
import { User, UserPreferences, AccessibilitySettings } from '@pageflow/types';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export interface UpdateUserProfileRequest {
  displayName?: string;
  profilePicture?: string;
  preferences?: Partial<UserPreferences>;
  accessibilitySettings?: Partial<AccessibilitySettings>;
}

export interface ProfilePictureUploadRequest {
  userId: string;
  file: Buffer;
  mimeType: string;
  originalName: string;
}

export class UserProfileService {
  private dynamoClient: DynamoDBDocumentClient;
  private s3Client: S3Client;
  private tableName: string;
  private bucketName: string;
  private logger = logger.child({ component: 'UserProfileService' });

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMODB_ENDPOINT,
    });
    
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.tableName = process.env.DYNAMODB_USERS_TABLE || 'pageflow-users';
    this.bucketName = process.env.S3_PROFILE_PICTURES_BUCKET || 'pageflow-profile-pictures';
  }

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { id: userId },
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Item) {
        return null;
      }

      this.logger.info({ message: 'User profile retrieved', userId });
      return response.Item as User;
    } catch (error: any) {
      this.logger.error({ message: 'Failed to get user profile', error: error.message, userId });
      throw new AppError('Failed to retrieve user profile', 500, 'PROFILE_RETRIEVAL_ERROR');
    }
  }

  async createUserProfile(user: User): Promise<User> {
    try {
      const userWithTimestamps = {
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: userWithTimestamps,
        ConditionExpression: 'attribute_not_exists(id)',
      });

      await this.dynamoClient.send(command);
      
      this.logger.info({ message: 'User profile created', userId: user.id });
      return userWithTimestamps;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new AppError('User profile already exists', 409, 'PROFILE_EXISTS');
      }
      
      this.logger.error({ message: 'Failed to create user profile', error: error.message, userId: user.id });
      throw new AppError('Failed to create user profile', 500, 'PROFILE_CREATION_ERROR');
    }
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfileRequest): Promise<User> {
    try {
      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (updates.displayName !== undefined) {
        updateExpressions.push('#displayName = :displayName');
        expressionAttributeNames['#displayName'] = 'displayName';
        expressionAttributeValues[':displayName'] = updates.displayName;
      }

      if (updates.profilePicture !== undefined) {
        updateExpressions.push('#profilePicture = :profilePicture');
        expressionAttributeNames['#profilePicture'] = 'profilePicture';
        expressionAttributeValues[':profilePicture'] = updates.profilePicture;
      }

      if (updates.preferences) {
        // Merge with existing preferences
        updateExpressions.push('#preferences = :preferences');
        expressionAttributeNames['#preferences'] = 'preferences';
        expressionAttributeValues[':preferences'] = updates.preferences;
      }

      if (updates.accessibilitySettings) {
        // Merge with existing accessibility settings
        updateExpressions.push('#accessibilitySettings = :accessibilitySettings');
        expressionAttributeNames['#accessibilitySettings'] = 'accessibilitySettings';
        expressionAttributeValues[':accessibilitySettings'] = updates.accessibilitySettings;
      }

      // Always update the updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      if (updateExpressions.length === 1) { // Only updatedAt
        throw new AppError('No valid updates provided', 400, 'NO_UPDATES');
      }

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id: userId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Attributes) {
        throw new AppError('Failed to update user profile', 500, 'UPDATE_FAILED');
      }

      this.logger.info({ message: 'User profile updated', userId, updates: Object.keys(updates) });
      return response.Attributes as User;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      
      this.logger.error({ message: 'Failed to update user profile', error: error.message, userId });
      throw new AppError('Failed to update user profile', 500, 'PROFILE_UPDATE_ERROR');
    }
  }

  async deleteUserProfile(userId: string): Promise<void> {
    try {
      // First, get the user profile to check for profile picture
      const user = await this.getUserProfile(userId);
      
      if (user?.profilePicture) {
        // Delete profile picture from S3
        await this.deleteProfilePicture(userId);
      }

      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id: userId },
        ConditionExpression: 'attribute_exists(id)',
      });

      await this.dynamoClient.send(command);
      
      this.logger.info({ message: 'User profile deleted', userId });
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      
      this.logger.error({ message: 'Failed to delete user profile', error: error.message, userId });
      throw new AppError('Failed to delete user profile', 500, 'PROFILE_DELETION_ERROR');
    }
  }

  async uploadProfilePicture(request: ProfilePictureUploadRequest): Promise<string> {
    try {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(request.mimeType)) {
        throw new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400, 'INVALID_FILE_TYPE');
      }

      // Process image with Sharp
      const processedImage = await sharp(request.file)
        .resize(400, 400, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Generate unique filename
      const fileExtension = 'jpg'; // Always convert to JPEG
      const fileName = `${request.userId}/${uuidv4()}.${fileExtension}`;
      const key = `profile-pictures/${fileName}`;

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: processedImage,
        ContentType: 'image/jpeg',
        Metadata: {
          userId: request.userId,
          originalName: request.originalName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(uploadCommand);

      // Generate the public URL
      const profilePictureUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      this.logger.info({ message: 'Profile picture uploaded', userId: request.userId, key });
      return profilePictureUrl;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      
      this.logger.error({ message: 'Failed to upload profile picture', error: error.message, userId: request.userId });
      throw new AppError('Failed to upload profile picture', 500, 'UPLOAD_ERROR');
    }
  }

  async deleteProfilePicture(userId: string): Promise<void> {
    try {
      // Get current user profile to find the profile picture URL
      const user = await this.getUserProfile(userId);
      
      if (!user?.profilePicture) {
        return; // No profile picture to delete
      }

      // Extract key from URL
      const url = new URL(user.profilePicture);
      const key = url.pathname.substring(1); // Remove leading slash

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);

      // Update user profile to remove profile picture URL
      await this.updateUserProfile(userId, { profilePicture: undefined });

      this.logger.info({ message: 'Profile picture deleted', userId, key });
    } catch (error: any) {
      this.logger.error({ message: 'Failed to delete profile picture', error: error.message, userId });
      throw new AppError('Failed to delete profile picture', 500, 'DELETE_ERROR');
    }
  }

  async getProfilePictureUploadUrl(userId: string, mimeType: string): Promise<{ uploadUrl: string; key: string }> {
    try {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400, 'INVALID_FILE_TYPE');
      }

      // Generate unique filename
      const fileExtension = mimeType.split('/')[1];
      const fileName = `${userId}/${uuidv4()}.${fileExtension}`;
      const key = `profile-pictures/${fileName}`;

      // Generate presigned URL for upload
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: mimeType,
        Metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour

      this.logger.info({ message: 'Profile picture upload URL generated', userId, key });
      
      return { uploadUrl, key };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      
      this.logger.error({ message: 'Failed to generate upload URL', error: error.message, userId });
      throw new AppError('Failed to generate upload URL', 500, 'UPLOAD_URL_ERROR');
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    try {
      // Get current user profile
      const currentUser = await this.getUserProfile(userId);
      
      if (!currentUser) {
        throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      // Merge preferences
      const updatedPreferences = {
        ...currentUser.preferences,
        ...preferences,
      };

      return await this.updateUserProfile(userId, { preferences: updatedPreferences });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      
      this.logger.error({ message: 'Failed to update user preferences', error: error.message, userId });
      throw new AppError('Failed to update user preferences', 500, 'PREFERENCES_UPDATE_ERROR');
    }
  }

  async validateUserSettings(settings: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate theme
    if (settings.preferences?.theme && !['light', 'dark', 'high-contrast'].includes(settings.preferences.theme)) {
      errors.push('Invalid theme. Must be one of: light, dark, high-contrast');
    }

    // Validate font size
    if (settings.accessibilitySettings?.fontSize && !['small', 'medium', 'large', 'x-large'].includes(settings.accessibilitySettings.fontSize)) {
      errors.push('Invalid font size. Must be one of: small, medium, large, x-large');
    }

    // Validate reading level
    if (settings.accessibilitySettings?.readingLevel && !['elementary', 'intermediate', 'advanced', 'expert'].includes(settings.accessibilitySettings.readingLevel)) {
      errors.push('Invalid reading level. Must be one of: elementary, intermediate, advanced, expert');
    }

    // Validate alternative input type
    if (settings.accessibilitySettings?.alternativeInputType && !['voice', 'switch', 'eye-tracking'].includes(settings.accessibilitySettings.alternativeInputType)) {
      errors.push('Invalid alternative input type. Must be one of: voice, switch, eye-tracking');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}