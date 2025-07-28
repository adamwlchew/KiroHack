import { Request, Response } from 'express';
import { SyncService, SyncRequest, ConflictResolutionRequest } from '../services/syncService';
import { DeviceAuthenticatedRequest } from '../middleware/deviceAuthMiddleware';
import { WebSocketService } from '../services/websocketService';
import { AppError, logger } from '@pageflow/utils';
import Joi from 'joi';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class SyncController {
  private syncService: SyncService;
  private logger = logger.child({ component: 'SyncController' });

  constructor(websocketService?: WebSocketService) {
    this.syncService = new SyncService(websocketService);
  }

  syncData = async (req: DeviceAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { error, value } = this.validateSyncRequest(req.body);
      if (error) {
        throw new AppError('Invalid sync request', 400, error.details);
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await this.syncService.syncData(userId, value!.requests);

      res.json({
        success: true,
        data: result,
        message: 'Data synchronized successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getUserSyncData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { dataType, deviceId } = req.query;
      const syncData = await this.syncService.getUserSyncData(
        userId,
        dataType as 'progress' | 'preferences' | 'content' | 'companion' | 'assessment' | undefined,
        deviceId as string
      );

      res.json({
        success: true,
        data: syncData,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getConflicts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const conflicts = await this.syncService.getConflicts(userId);

      res.json({
        success: true,
        data: conflicts,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  resolveConflict = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = this.validateConflictResolution(req.body);
      if (error) {
        throw new AppError('Invalid conflict resolution request', 400, error.details);
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!value) {
        throw new AppError('Invalid conflict resolution request', 400);
      }

      const resolvedData = await this.syncService.resolveConflict(userId, value);

      res.json({
        success: true,
        data: resolvedData,
        message: 'Conflict resolved successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  storeOfflineData = async (req: DeviceAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { error, value } = this.validateOfflineDataRequest(req.body);
      if (error) {
        throw new AppError('Invalid offline data request', 400, error.details);
      }

      const userId = req.user?.id;
      const deviceId = req.device?.id;
      
      if (!userId || !deviceId) {
        throw new AppError('User or device not authenticated', 401);
      }

      if (!value) {
        throw new AppError('Invalid offline data request', 400);
      }
      const offlineData = await this.syncService.storeOfflineData(
        userId,
        deviceId,
        value.operations
      );

      res.status(201).json({
        success: true,
        data: offlineData,
        message: 'Offline data stored successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  syncOfflineData = async (req: DeviceAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const deviceId = req.device?.id;
      
      if (!userId || !deviceId) {
        throw new AppError('User or device not authenticated', 401);
      }

      const result = await this.syncService.syncOfflineData(userId, deviceId);

      res.json({
        success: true,
        data: result,
        message: 'Offline data synchronized successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private validateSyncRequest(data: any): { error?: any; value?: { requests: SyncRequest[] } } {
    const schema = Joi.object({
      requests: Joi.array().items(
        Joi.object({
          deviceId: Joi.string().required(),
          dataType: Joi.string().valid('progress', 'preferences', 'content', 'companion', 'assessment').required(),
          data: Joi.any().required(),
          version: Joi.number().integer().min(1).required(),
          lastModified: Joi.date().required(),
        })
      ).min(1).required(),
    });

    return schema.validate(data);
  }

  private validateConflictResolution(data: any): { error?: any; value?: ConflictResolutionRequest } {
    const schema = Joi.object({
      conflictId: Joi.string().required(),
      resolution: Joi.string().valid('server_wins', 'client_wins', 'merge').required(),
      mergedData: Joi.when('resolution', {
        is: Joi.string().valid('client_wins', 'merge'),
        then: Joi.any().required(),
        otherwise: Joi.any().optional(),
      }),
    });

    return schema.validate(data);
  }

  private validateOfflineDataRequest(data: any): { error?: any; value?: { operations: any[] } } {
    const schema = Joi.object({
      operations: Joi.array().items(
        Joi.object({
          dataType: Joi.string().required(),
          operation: Joi.string().valid('create', 'update', 'delete').required(),
          data: Joi.any().required(),
          timestamp: Joi.date().required(),
        })
      ).min(1).required(),
    });

    return schema.validate(data);
  }

  private handleError(error: any, res: Response): void {
    this.logger.error({ message: 'Controller error', error });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
}