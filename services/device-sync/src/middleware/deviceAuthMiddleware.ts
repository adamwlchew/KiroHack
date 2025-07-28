import { Request, Response, NextFunction } from 'express';
import { DeviceAuthService } from '../services/deviceAuthService';
import { DeviceService } from '../services/deviceService';
import { AppError, logger } from '@pageflow/utils';

const deviceAuthLogger = logger.child({ service: 'DeviceAuthMiddleware' });

export interface DeviceAuthenticatedRequest extends Request {
  device?: {
    id: string;
    userId: string;
    deviceType: string;
    platform: string;
  };
  user?: {
    id: string;
  };
}

export const deviceAuthMiddleware = async (
  req: DeviceAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No device token provided', 401);
    }

    const token = authHeader.substring(7);
    const deviceService = new DeviceService();

    try {
      const { device, userId } = await deviceService.authenticateDevice(token);
      
      req.device = {
        id: device.id,
        userId: device.userId,
        deviceType: device.deviceType,
        platform: device.platform,
      };

      req.user = {
        id: userId,
      };

      next();
    } catch (error) {
      deviceAuthLogger.error({ message: 'Device token verification failed', error });
      throw new AppError('Invalid device token', 401);
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      deviceAuthLogger.error({ message: 'Device authentication middleware error', error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Device authentication failed',
        },
      });
    }
  }
};