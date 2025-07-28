import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService';
import { DeviceRegistrationRequest, DeviceUpdateRequest } from '@pageflow/types';
import { AppError, logger } from '@pageflow/utils';
import Joi from 'joi';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class DeviceController {
  private deviceService: DeviceService;
  private logger = logger.child({ component: 'DeviceController' });

  constructor() {
    this.deviceService = new DeviceService();
  }

  registerDevice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { error, value } = this.validateRegistrationRequest(req.body);
      if (error) {
        throw new AppError('Invalid registration data', 400, error.details);
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await this.deviceService.registerDevice(userId, value!, ipAddress);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Device registered successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const device = await this.deviceService.getDevice(deviceId);

      res.json({
        success: true,
        data: device,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getUserDevices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const activeOnly = req.query.active === 'true';
      const devices = await this.deviceService.getUserDevices(userId, activeOnly);

      res.json({
        success: true,
        data: devices,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  updateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const { error, value } = this.validateUpdateRequest(req.body);
      if (error) {
        throw new AppError('Invalid update data', 400, error.details);
      }

      if (!value) {
        throw new AppError('Invalid update data', 400);
      }
      const device = await this.deviceService.updateDevice(deviceId, value);

      res.json({
        success: true,
        data: device,
        message: 'Device updated successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  deactivateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const device = await this.deviceService.deactivateDevice(deviceId);

      res.json({
        success: true,
        data: device,
        message: 'Device deactivated successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  activateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const device = await this.deviceService.activateDevice(deviceId);

      res.json({
        success: true,
        data: device,
        message: 'Device activated successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  deleteDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      await this.deviceService.deleteDevice(deviceId);

      res.json({
        success: true,
        message: 'Device deleted successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
      }

      const token = authHeader.substring(7);
      const newToken = await this.deviceService.refreshDeviceToken(token);

      res.json({
        success: true,
        data: newToken,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private validateRegistrationRequest(data: any): { error?: any; value?: DeviceRegistrationRequest } {
    const schema = Joi.object({
      deviceType: Joi.string().valid('web', 'mobile', 'ar', 'vr').required(),
      platform: Joi.string().valid('ios', 'android', 'windows', 'macos', 'linux', 'web').required(),
      deviceName: Joi.string().min(1).max(100).required(),
      deviceModel: Joi.string().max(100).optional(),
      osVersion: Joi.string().max(50).optional(),
      appVersion: Joi.string().required(),
      capabilities: Joi.object({
        hasCamera: Joi.boolean().required(),
        hasAR: Joi.boolean().required(),
        hasVR: Joi.boolean().required(),
        hasGPS: Joi.boolean().required(),
        hasAccelerometer: Joi.boolean().required(),
        hasGyroscope: Joi.boolean().required(),
        hasTouchScreen: Joi.boolean().required(),
        hasKeyboard: Joi.boolean().required(),
        hasMicrophone: Joi.boolean().required(),
        hasSpeakers: Joi.boolean().required(),
        supportsOffline: Joi.boolean().required(),
        maxStorageSize: Joi.number().min(10).required(),
      }).required(),
      metadata: Joi.object({
        screenResolution: Joi.object({
          width: Joi.number().positive().required(),
          height: Joi.number().positive().required(),
        }).optional(),
        screenDensity: Joi.number().positive().optional(),
        batteryLevel: Joi.number().min(0).max(100).optional(),
        networkType: Joi.string().valid('wifi', 'cellular', 'ethernet', 'offline').optional(),
        timezone: Joi.string().required(),
        locale: Joi.string().required(),
        userAgent: Joi.string().optional(),
      }).required(),
    });

    return schema.validate(data);
  }

  private validateUpdateRequest(data: any): { error?: any; value?: DeviceUpdateRequest } {
    const schema = Joi.object({
      deviceName: Joi.string().min(1).max(100).optional(),
      capabilities: Joi.object({
        hasCamera: Joi.boolean().optional(),
        hasAR: Joi.boolean().optional(),
        hasVR: Joi.boolean().optional(),
        hasGPS: Joi.boolean().optional(),
        hasAccelerometer: Joi.boolean().optional(),
        hasGyroscope: Joi.boolean().optional(),
        hasTouchScreen: Joi.boolean().optional(),
        hasKeyboard: Joi.boolean().optional(),
        hasMicrophone: Joi.boolean().optional(),
        hasSpeakers: Joi.boolean().optional(),
        supportsOffline: Joi.boolean().optional(),
        maxStorageSize: Joi.number().min(10).optional(),
      }).optional(),
      metadata: Joi.object({
        screenResolution: Joi.object({
          width: Joi.number().positive().required(),
          height: Joi.number().positive().required(),
        }).optional(),
        screenDensity: Joi.number().positive().optional(),
        batteryLevel: Joi.number().min(0).max(100).optional(),
        networkType: Joi.string().valid('wifi', 'cellular', 'ethernet', 'offline').optional(),
        timezone: Joi.string().optional(),
        locale: Joi.string().optional(),
        userAgent: Joi.string().optional(),
      }).optional(),
      isActive: Joi.boolean().optional(),
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