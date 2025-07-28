import { Request, Response } from 'express';
import { WebSocketService } from '../services/websocketService';
import { AppError, logger } from '@pageflow/utils';

export class WebSocketController {
  private websocketService: WebSocketService;
  private logger = logger.child({ component: 'WebSocketController' });

  constructor(websocketService: WebSocketService) {
    this.websocketService = websocketService;
  }

  getConnectionStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = this.websocketService.getConnectionStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  checkDeviceConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const isConnected = this.websocketService.isDeviceConnected(deviceId);

      res.json({
        success: true,
        data: {
          deviceId,
          isConnected,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getUserConnectedDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const connectedDevices = this.websocketService.getUserConnectedDevices(userId);

      res.json({
        success: true,
        data: {
          userId,
          connectedDevices,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  broadcastSyncUpdate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { data, excludeDeviceId } = req.body;
      if (!data) {
        throw new AppError('Data is required for sync update', 400);
      }

      this.websocketService.broadcastSyncUpdate(userId, data, excludeDeviceId);

      res.json({
        success: true,
        message: 'Sync update broadcasted successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  notifyConflict = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { conflictData } = req.body;
      if (!conflictData) {
        throw new AppError('Conflict data is required', 400);
      }

      this.websocketService.notifyConflict(userId, conflictData);

      res.json({
        success: true,
        message: 'Conflict notification sent successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  notifyDeviceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      this.websocketService.notifyDeviceStatus(deviceId, status);

      res.json({
        success: true,
        message: 'Device status notification sent successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: any, res: Response): void {
    this.logger.error({ message: 'WebSocket controller error', error });

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