import { Device, DeviceRegistrationRequest, DeviceUpdateRequest, DeviceAuthToken, DeviceCapabilities } from '@pageflow/types';
import { DeviceRepository } from '../repositories/deviceRepository';
import { DeviceAuthService } from './deviceAuthService';
import { AppError, logger } from '@pageflow/utils';
import { validateDevice, checkLearningFeatureSupport } from '../utils/deviceValidation';

export class DeviceService {
  private deviceRepository: DeviceRepository;
  private deviceAuthService: DeviceAuthService;
  private logger: any;

  constructor() {
    this.deviceRepository = new DeviceRepository();
    this.deviceAuthService = new DeviceAuthService();
    this.logger = logger.child({ service: 'DeviceService' });
  }

  async registerDevice(
    userId: string,
    deviceData: DeviceRegistrationRequest,
    ipAddress?: string
  ): Promise<{ device: Device; authToken: DeviceAuthToken }> {
    try {
      this.logger.info({ message: 'Registering new device', userId, deviceType: deviceData.deviceType });

      // Comprehensive device validation
      this.validateDeviceComprehensively(deviceData);

      // Check if user has too many devices (optional limit)
      const existingDevices = await this.deviceRepository.findActiveByUserId(userId);
      const maxDevicesPerUser = 10; // Configurable limit
      
      if (existingDevices.length >= maxDevicesPerUser) {
        throw new AppError(`Maximum number of devices (${maxDevicesPerUser}) reached for user`, 400);
      }

      // Create the device
      const device = await this.deviceRepository.create(userId, deviceData, ipAddress);

      // Generate authentication token
      const authToken = this.deviceAuthService.generateDeviceToken(device.id, userId);

      this.logger.info({ message: 'Device registered successfully', 
        deviceId: device.id, 
        userId, 
        deviceType: device.deviceType 
      });

      return { device, authToken };
    } catch (error) {
      this.logger.error({ message: 'Failed to register device', error, userId, deviceType: deviceData.deviceType });
      throw error;
    }
  }

  async getDevice(deviceId: string): Promise<Device> {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }
    return device;
  }

  async getUserDevices(userId: string, activeOnly: boolean = false): Promise<Device[]> {
    if (activeOnly) {
      return this.deviceRepository.findActiveByUserId(userId);
    }
    return this.deviceRepository.findByUserId(userId);
  }

  async updateDevice(deviceId: string, updates: DeviceUpdateRequest): Promise<Device> {
    try {
      this.logger.info({ message: 'Updating device', deviceId, updates });

      // Validate capabilities if being updated
      if (updates.capabilities) {
        const device = await this.getDevice(deviceId);
        this.validateDeviceComprehensively({
          deviceType: device.deviceType,
          platform: device.platform,
          deviceName: device.deviceName,
          appVersion: device.appVersion,
          capabilities: { ...device.capabilities, ...updates.capabilities },
          metadata: device.metadata,
        });
      }

      const updatedDevice = await this.deviceRepository.update(deviceId, updates);

      this.logger.info({ message: 'Device updated successfully', deviceId });
      return updatedDevice;
    } catch (error) {
      this.logger.error({ message: 'Failed to update device', error, deviceId });
      throw error;
    }
  }

  async deactivateDevice(deviceId: string): Promise<Device> {
    try {
      this.logger.info({ message: 'Deactivating device', deviceId });
      const device = await this.deviceRepository.deactivate(deviceId);
      this.logger.info({ message: 'Device deactivated successfully', deviceId });
      return device;
    } catch (error) {
      this.logger.error({ message: 'Failed to deactivate device', error, deviceId });
      throw error;
    }
  }

  async activateDevice(deviceId: string): Promise<Device> {
    try {
      this.logger.info({ message: 'Activating device', deviceId });
      const device = await this.deviceRepository.activate(deviceId);
      this.logger.info({ message: 'Device activated successfully', deviceId });
      return device;
    } catch (error) {
      this.logger.error({ message: 'Failed to activate device', error, deviceId });
      throw error;
    }
  }

  async deleteDevice(deviceId: string): Promise<void> {
    try {
      this.logger.info({ message: 'Deleting device', deviceId });
      await this.deviceRepository.delete(deviceId);
      this.logger.info({ message: 'Device deleted successfully', deviceId });
    } catch (error) {
      this.logger.error({ message: 'Failed to delete device', error, deviceId });
      throw error;
    }
  }

  async updateLastSync(deviceId: string): Promise<void> {
    try {
      await this.deviceRepository.updateLastSync(deviceId);
    } catch (error) {
      this.logger.error({ message: 'Failed to update last sync time', error, deviceId });
      throw error;
    }
  }

  async authenticateDevice(token: string): Promise<{ device: Device; userId: string }> {
    try {
      const { deviceId, userId } = this.deviceAuthService.verifyDeviceToken(token);
      const device = await this.getDevice(deviceId);
      
      if (!device.isActive) {
        throw new AppError('Device is not active', 401);
      }

      return { device, userId };
    } catch (error) {
      this.logger.error({ message: 'Device authentication failed', error });
      throw error;
    }
  }

  async refreshDeviceToken(oldToken: string): Promise<DeviceAuthToken> {
    try {
      const { deviceId, userId } = this.deviceAuthService.verifyDeviceToken(oldToken);
      const device = await this.getDevice(deviceId);
      
      const newToken = this.deviceAuthService.generateDeviceToken(device.id, userId);
      this.logger.info({ message: 'Device token refreshed', deviceId: device.id });
      
      return newToken;
    } catch (error) {
      this.logger.error({ message: 'Failed to refresh device token', error });
      throw error;
    }
  }

  async cleanupInactiveDevices(olderThanDays: number = 30): Promise<number> {
    try {
      this.logger.info({ message: 'Starting cleanup of inactive devices', olderThanDays });
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const inactiveDevices = await this.deviceRepository.findInactiveDevices(olderThanDays);
      let deactivatedCount = 0;

      for (const device of inactiveDevices) {
        try {
          await this.deviceRepository.deactivate(device.id);
          deactivatedCount++;
        } catch (error) {
          this.logger.error({ message: 'Failed to deactivate inactive device', error, deviceId: device.id });
        }
      }

      this.logger.info({ message: 'Inactive devices cleanup completed', 
        totalFound: inactiveDevices.length, 
        deactivatedCount 
      });

      return deactivatedCount;
    } catch (error) {
      this.logger.error({ message: 'Failed to cleanup inactive devices', error });
      throw error;
    }
  }

  private validateDeviceComprehensively(deviceData: DeviceRegistrationRequest): void {
    const { deviceType, platform, capabilities, metadata } = deviceData;

    // Use comprehensive validation utility
    const validationResult = validateDevice(deviceType, platform, capabilities, metadata);

    // Handle validation errors
    if (!validationResult.isValid) {
      const errorMessage = validationResult.errors.join('; ');
      throw new AppError(errorMessage, 400, 'DEVICE_VALIDATION_FAILED', {
        errors: validationResult.errors,
        warnings: validationResult.warnings
      });
    }

    // Log warnings for monitoring
    if (validationResult.warnings.length > 0) {
      this.logger.warn({ message: 'Device validation warnings', 
        deviceType,
        platform,
        warnings: validationResult.warnings
      });
    }

    // Log learning feature support for analytics
    const featureSupport = checkLearningFeatureSupport(deviceType, capabilities);
    this.logger.info({ message: 'Device learning feature support', 
      deviceType,
      platform,
      featureSupport
    });
  }

  private validateDeviceCapabilities(deviceData: DeviceRegistrationRequest): void {
    const { deviceType, platform, capabilities } = deviceData;

    // Validate AR capabilities
    if (deviceType === 'ar') {
      if (!capabilities.hasAR) {
        throw new AppError('AR device must have AR capabilities', 400, 'INVALID_AR_CAPABILITIES');
      }
      if (!capabilities.hasCamera) {
        throw new AppError('AR device must have camera capabilities', 400, 'MISSING_CAMERA');
      }
      if (!capabilities.hasAccelerometer || !capabilities.hasGyroscope) {
        throw new AppError('AR device must have motion sensors (accelerometer and gyroscope)', 400, 'MISSING_MOTION_SENSORS');
      }
    }

    // Validate VR capabilities
    if (deviceType === 'vr') {
      if (!capabilities.hasVR) {
        throw new AppError('VR device must have VR capabilities', 400, 'INVALID_VR_CAPABILITIES');
      }
      if (!capabilities.hasAccelerometer || !capabilities.hasGyroscope) {
        throw new AppError('VR device must have motion sensors for head tracking', 400, 'MISSING_MOTION_SENSORS');
      }
      // VR devices should support audio for accessibility
      if (!capabilities.hasSpeakers && !capabilities.hasMicrophone) {
        throw new AppError('VR device should have audio capabilities for accessibility', 400, 'MISSING_AUDIO');
      }
    }

    // Validate mobile capabilities
    if (deviceType === 'mobile') {
      if (!capabilities.hasTouchScreen) {
        throw new AppError('Mobile device must have touch screen', 400, 'MISSING_TOUCHSCREEN');
      }
      // Mobile devices should have GPS for location-based learning
      if (!capabilities.hasGPS) {
        this.logger.warn({ message: 'Mobile device without GPS may have limited location-based features', 
          deviceType,
          platform
        });
      }
    }

    // Validate web capabilities
    if (deviceType === 'web') {
      if (!capabilities.hasKeyboard && !capabilities.hasTouchScreen) {
        throw new AppError('Web device must have keyboard or touch input', 400, 'MISSING_INPUT_METHOD');
      }
    }

    // Validate storage requirements (minimum for offline content)
    if (capabilities.maxStorageSize < 10) {
      throw new AppError('Device must have at least 10MB storage capacity', 400, 'INSUFFICIENT_STORAGE');
    }

    // Warn about low storage for rich content
    if (capabilities.maxStorageSize < 100) {
      this.logger.warn({ message: 'Device has limited storage, may affect offline content availability', 
        deviceType,
        platform,
        maxStorageSize: capabilities.maxStorageSize
      });
    }

    // Validate platform-specific requirements
    if (platform === 'web' && deviceType !== 'web') {
      throw new AppError('Web platform can only be used with web device type', 400, 'PLATFORM_DEVICE_MISMATCH');
    }

    // Accessibility validation - ensure devices can support basic accessibility features
    if (deviceType === 'mobile' || deviceType === 'ar') {
      if (!capabilities.hasSpeakers && !capabilities.hasMicrophone) {
        this.logger.warn({ message: 'Device lacks audio capabilities, may limit accessibility features', 
          deviceType,
          platform
        });
      }
    }

    // Validate platform-specific capabilities
    this.validatePlatformSpecificCapabilities(platform, capabilities);
  }

  private validatePlatformSpecificCapabilities(platform: string, capabilities: DeviceCapabilities): void {
    switch (platform) {
      case 'ios':
      case 'android':
        // Mobile platforms should have basic sensors for AR/orientation features
        if (!capabilities.hasAccelerometer) {
          this.logger.warn({ message: 'Mobile platform without accelerometer may have limited features', platform });
        }
        break;
      
      case 'web':
        // Web platform should support offline for PWA features
        if (!capabilities.supportsOffline) {
          this.logger.warn({ message: 'Web device without offline support may have limited PWA features', platform });
        }
        break;
      
      case 'windows':
      case 'macos':
      case 'linux':
        // Desktop platforms should have keyboard
        if (!capabilities.hasKeyboard) {
          this.logger.warn({ message: 'Desktop platform without keyboard may have limited accessibility', platform });
        }
        break;
    }
  }
}