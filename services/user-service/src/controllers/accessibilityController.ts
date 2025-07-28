import { Request, Response, NextFunction } from 'express';
import { AccessibilityService } from '../services/accessibilityService';
import { AppError, logger } from '@pageflow/utils';
import { AccessibilitySettings } from '@pageflow/types';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
  };
}

export class AccessibilityController {
  private accessibilityService: AccessibilityService;
  private logger = logger.child({ component: 'AccessibilityController' });

  constructor() {
    this.accessibilityService = new AccessibilityService();
  }

  getAccessibilityProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const profile = await this.accessibilityService.getAccessibilityProfile(userId);
      
      if (!profile) {
        throw new AppError('Accessibility profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      res.json({
        success: true,
        data: { profile },
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

      const settings: Partial<AccessibilitySettings> = req.body;

      const updatedSettings = await this.accessibilityService.updateAccessibilitySettings(userId, settings);

      res.json({
        success: true,
        message: 'Accessibility settings updated successfully',
        data: { settings: updatedSettings },
      });
    } catch (error) {
      next(error);
    }
  };

  detectReadingLevel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const { textSamples } = req.body;

      if (!textSamples || !Array.isArray(textSamples) || textSamples.length === 0) {
        throw new AppError('Text samples are required for reading level detection', 400, 'VALIDATION_ERROR');
      }

      const analysis = await this.accessibilityService.detectReadingLevel(userId, textSamples);

      res.json({
        success: true,
        message: 'Reading level analysis completed',
        data: { analysis },
      });
    } catch (error) {
      next(error);
    }
  };

  configureAlternativeInput = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const { inputType, configuration } = req.body;

      if (!inputType) {
        throw new AppError('Input type is required', 400, 'VALIDATION_ERROR');
      }

      if (!['voice', 'switch', 'eye-tracking'].includes(inputType)) {
        throw new AppError('Invalid input type. Must be one of: voice, switch, eye-tracking', 400, 'VALIDATION_ERROR');
      }

      await this.accessibilityService.configureAlternativeInput(userId, inputType, configuration || {});

      res.json({
        success: true,
        message: 'Alternative input configured successfully',
        data: { inputType, configuration },
      });
    } catch (error) {
      next(error);
    }
  };

  detectAssistiveTechnologies = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const userAgent = req.headers['user-agent'] || '';
      const { capabilities } = req.body;

      const detectedTechnologies = await this.accessibilityService.detectAssistiveTechnologies(
        userId,
        userAgent,
        capabilities || {}
      );

      res.json({
        success: true,
        message: 'Assistive technologies detected',
        data: { technologies: detectedTechnologies },
      });
    } catch (error) {
      next(error);
    }
  };

  getAccessibilityRecommendations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const recommendations = await this.accessibilityService.generateAccessibilityRecommendations(userId);

      res.json({
        success: true,
        message: 'Accessibility recommendations generated',
        data: { recommendations },
      });
    } catch (error) {
      next(error);
    }
  };

  enableScreenReader = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const updatedSettings = await this.accessibilityService.updateAccessibilitySettings(userId, {
        screenReaderOptimized: true,
      });

      res.json({
        success: true,
        message: 'Screen reader support enabled',
        data: { settings: updatedSettings },
      });
    } catch (error) {
      next(error);
    }
  };

  enableHighContrast = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const updatedSettings = await this.accessibilityService.updateAccessibilitySettings(userId, {
        theme: 'high-contrast',
      });

      res.json({
        success: true,
        message: 'High contrast mode enabled',
        data: { settings: updatedSettings },
      });
    } catch (error) {
      next(error);
    }
  };

  enableReducedMotion = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const updatedSettings = await this.accessibilityService.updateAccessibilitySettings(userId, {
        reducedMotion: true,
      });

      res.json({
        success: true,
        message: 'Reduced motion enabled',
        data: { settings: updatedSettings },
      });
    } catch (error) {
      next(error);
    }
  };

  updateFontSize = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const { fontSize } = req.body;

      if (!fontSize || !['small', 'medium', 'large', 'x-large'].includes(fontSize)) {
        throw new AppError('Invalid font size. Must be one of: small, medium, large, x-large', 400, 'VALIDATION_ERROR');
      }

      const updatedSettings = await this.accessibilityService.updateAccessibilitySettings(userId, {
        fontSize,
      });

      res.json({
        success: true,
        message: 'Font size updated successfully',
        data: { settings: updatedSettings },
      });
    } catch (error) {
      next(error);
    }
  };

  updateReadingLevel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const { readingLevel } = req.body;

      if (!readingLevel || !['elementary', 'intermediate', 'advanced', 'expert'].includes(readingLevel)) {
        throw new AppError('Invalid reading level. Must be one of: elementary, intermediate, advanced, expert', 400, 'VALIDATION_ERROR');
      }

      const updatedSettings = await this.accessibilityService.updateAccessibilitySettings(userId, {
        readingLevel,
      });

      res.json({
        success: true,
        message: 'Reading level updated successfully',
        data: { settings: updatedSettings },
      });
    } catch (error) {
      next(error);
    }
  };
}