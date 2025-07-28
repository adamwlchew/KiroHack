import { Request, Response, NextFunction } from 'express';
import { UserProfileService, UpdateUserProfileRequest } from '../services/userProfileService';
import { AppError, logger } from '@pageflow/utils';
import { UserPreferences, AccessibilitySettings } from '@pageflow/types';
import multer from 'multer';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
  };
}

export class UserProfileController {
  private userProfileService: UserProfileService;
  private logger = logger.child({ component: 'UserProfileController' });

  constructor() {
    this.userProfileService = new UserProfileService();
  }

  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const profile = await this.userProfileService.getUserProfile(userId);
      
      if (!profile) {
        throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      res.json({
        success: true,
        data: { user: profile },
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const updates: UpdateUserProfileRequest = req.body;

      // Validate settings if provided
      if (updates.preferences || updates.accessibilitySettings) {
        const validation = await this.userProfileService.validateUserSettings({
          preferences: updates.preferences,
          accessibilitySettings: updates.accessibilitySettings,
        });

        if (!validation.isValid) {
          throw new AppError('Invalid settings', 400, 'VALIDATION_ERROR', validation.errors);
        }
      }

      const updatedProfile = await this.userProfileService.updateUserProfile(userId, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedProfile },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      await this.userProfileService.deleteUserProfile(userId);

      res.json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  uploadProfilePicture = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      if (!req.file) {
        throw new AppError('No file uploaded', 400, 'NO_FILE');
      }

      const profilePictureUrl = await this.userProfileService.uploadProfilePicture({
        userId,
        file: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
      });

      // Update user profile with new profile picture URL
      const updatedProfile = await this.userProfileService.updateUserProfile(userId, {
        profilePicture: profilePictureUrl,
      });

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          profilePictureUrl,
          user: updatedProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProfilePicture = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      await this.userProfileService.deleteProfilePicture(userId);

      res.json({
        success: true,
        message: 'Profile picture deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getProfilePictureUploadUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const { mimeType } = req.body;
      
      if (!mimeType) {
        throw new AppError('MIME type is required', 400, 'VALIDATION_ERROR');
      }

      const result = await this.userProfileService.getProfilePictureUploadUrl(userId, mimeType);

      res.json({
        success: true,
        message: 'Upload URL generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const preferences: Partial<UserPreferences> = req.body;

      // Validate preferences
      const validation = await this.userProfileService.validateUserSettings({ preferences });
      
      if (!validation.isValid) {
        throw new AppError('Invalid preferences', 400, 'VALIDATION_ERROR', validation.errors);
      }

      const updatedProfile = await this.userProfileService.updateUserPreferences(userId, preferences);

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: { user: updatedProfile },
      });
    } catch (error) {
      next(error);
    }
  };

  updateAccessibilitySettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const accessibilitySettings: Partial<AccessibilitySettings> = req.body;

      // Validate accessibility settings
      const validation = await this.userProfileService.validateUserSettings({ accessibilitySettings });
      
      if (!validation.isValid) {
        throw new AppError('Invalid accessibility settings', 400, 'VALIDATION_ERROR', validation.errors);
      }

      // Get current user profile
      const currentUser = await this.userProfileService.getUserProfile(userId);
      
      if (!currentUser) {
        throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      // Update accessibility settings separately
      const updatedProfile = await this.userProfileService.updateUserProfile(userId, {
        accessibilitySettings: {
          ...currentUser.accessibilitySettings,
          ...accessibilitySettings,
        },
      });

      res.json({
        success: true,
        message: 'Accessibility settings updated successfully',
        data: { user: updatedProfile },
      });
    } catch (error) {
      next(error);
    }
  };
}

// Multer configuration for file uploads
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400, 'INVALID_FILE_TYPE'));
    }
  },
});