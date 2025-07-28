import { DeviceService } from '../services/deviceService';
import { DeviceRepository } from '../repositories/deviceRepository';
import { DeviceRegistrationRequest, DeviceUpdateRequest, Device } from '@pageflow/types';
import { AppError } from '@pageflow/utils/src/error/appError';
import { createMockLogger } from '@pageflow/testing/src/mocks';

// Mock the repository
jest.mock('../repositories/deviceRepository');

describe('DeviceService', () => {
  let deviceService: DeviceService;
  let mockDeviceRepository: jest.Mocked<DeviceRepository>;
  let mockLogger: any;

  beforeEach(() => {
    mockDeviceRepository = new DeviceRepository() as jest.Mocked<DeviceRepository>;
    mockLogger = createMockLogger();
    deviceService = new DeviceService(mockDeviceRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerDevice', () => {
    const validWebDevice: DeviceRegistrationRequest = {
      deviceType: 'web',
      platform: 'web',
      deviceName: 'Chrome Browser',
      appVersion: '1.0.0',
      capabilities: {
        hasCamera: false,
        hasAR: false,
        hasVR: false,
        hasGPS: false,
        hasAccelerometer: false,
        hasGyroscope: false,
        hasTouchScreen: false,
        hasKeyboard: true,
        hasMicrophone: true,
        hasSpeakers: true,
        supportsOffline: true,
        maxStorageSize: 100
      },
      metadata: {
        screenResolution: { width: 1920, height: 1080 },
        timezone: 'America/New_York',
        locale: 'en-US',
        userAgent: 'Mozilla/5.0...'
      }
    };

    const validMobileDevice: DeviceRegistrationRequest = {
      deviceType: 'mobile',
      platform: 'ios',
      deviceName: 'iPhone 15',
      deviceModel: 'iPhone15,2',
      osVersion: '17.0',
      appVersion: '1.0.0',
      capabilities: {
        hasCamera: true,
        hasAR: true,
        hasVR: false,
        hasGPS: true,
        hasAccelerometer: true,
        hasGyroscope: true,
        hasTouchScreen: true,
        hasKeyboard: false,
        hasMicrophone: true,
        hasSpeakers: true,
        supportsOffline: true,
        maxStorageSize: 500
      },
      metadata: {
        screenResolution: { width: 393, height: 852 },
        screenDensity: 3,
        timezone: 'America/New_York',
        locale: 'en-US'
      }
    };

    const validARDevice: DeviceRegistrationRequest = {
      deviceType: 'ar',
      platform: 'android',
      deviceName: 'Pixel 8 Pro',
      deviceModel: 'Pixel 8 Pro',
      osVersion: '14.0',
      appVersion: '1.0.0',
      capabilities: {
        hasCamera: true,
        hasAR: true,
        hasVR: false,
        hasGPS: true,
        hasAccelerometer: true,
        hasGyroscope: true,
        hasTouchScreen: true,
        hasKeyboard: false,
        hasMicrophone: true,
        hasSpeakers: true,
        supportsOffline: true,
        maxStorageSize: 1000
      },
      metadata: {
        screenResolution: { width: 1008, height: 2244 },
        screenDensity: 2.625,
        timezone: 'America/New_York',
        locale: 'en-US'
      }
    };

    const validVRDevice: DeviceRegistrationRequest = {
      deviceType: 'vr',
      platform: 'android',
      deviceName: 'Meta Quest 3',
      deviceModel: 'Quest 3',
      osVersion: 'Quest OS 5.0',
      appVersion: '1.0.0',
      capabilities: {
        hasCamera: true,
        hasAR: false,
        hasVR: true,
        hasGPS: false,
        hasAccelerometer: true,
        hasGyroscope: true,
        hasTouchScreen: false,
        hasKeyboard: false,
        hasMicrophone: true,
        hasSpeakers: true,
        supportsOffline: true,
        maxStorageSize: 2000
      },
      metadata: {
        timezone: 'America/New_York',
        locale: 'en-US'
      }
    };

    it('should register a valid web device', async () => {
      const userId = 'user-123';
      const expectedDevice: Device = {
        id: 'device-123',
        userId,
        ...validWebDevice,
        isActive: true,
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);
      mockDeviceRepository.create.mockResolvedValue(expectedDevice);

      const result = await deviceService.registerDevice(userId, validWebDevice);

      expect(result).toEqual(expectedDevice);
      expect(mockDeviceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          ...validWebDevice,
          isActive: true
        })
      );
    });

    it('should register a valid mobile device', async () => {
      const userId = 'user-123';
      const expectedDevice: Device = {
        id: 'device-123',
        userId,
        ...validMobileDevice,
        isActive: true,
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);
      mockDeviceRepository.create.mockResolvedValue(expectedDevice);

      const result = await deviceService.registerDevice(userId, validMobileDevice);

      expect(result).toEqual(expectedDevice);
      expect(mockDeviceRepository.create).toHaveBeenCalled();
    });

    it('should register a valid AR device', async () => {
      const userId = 'user-123';
      const expectedDevice: Device = {
        id: 'device-123',
        userId,
        ...validARDevice,
        isActive: true,
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);
      mockDeviceRepository.create.mockResolvedValue(expectedDevice);

      const result = await deviceService.registerDevice(userId, validARDevice);

      expect(result).toEqual(expectedDevice);
      expect(mockDeviceRepository.create).toHaveBeenCalled();
    });

    it('should register a valid VR device', async () => {
      const userId = 'user-123';
      const expectedDevice: Device = {
        id: 'device-123',
        userId,
        ...validVRDevice,
        isActive: true,
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);
      mockDeviceRepository.create.mockResolvedValue(expectedDevice);

      const result = await deviceService.registerDevice(userId, validVRDevice);

      expect(result).toEqual(expectedDevice);
      expect(mockDeviceRepository.create).toHaveBeenCalled();
    });

    it('should throw error for AR device without AR capabilities', async () => {
      const userId = 'user-123';
      const invalidARDevice = {
        ...validARDevice,
        capabilities: {
          ...validARDevice.capabilities,
          hasAR: false
        }
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);

      await expect(
        deviceService.registerDevice(userId, invalidARDevice)
      ).rejects.toThrow(new AppError('AR device must have AR capabilities', 400));
    });

    it('should throw error for VR device without VR capabilities', async () => {
      const userId = 'user-123';
      const invalidVRDevice = {
        ...validVRDevice,
        capabilities: {
          ...validVRDevice.capabilities,
          hasVR: false
        }
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);

      await expect(
        deviceService.registerDevice(userId, invalidVRDevice)
      ).rejects.toThrow(new AppError('VR device must have VR capabilities', 400));
    });

    it('should throw error for mobile device without touch screen', async () => {
      const userId = 'user-123';
      const invalidMobileDevice = {
        ...validMobileDevice,
        capabilities: {
          ...validMobileDevice.capabilities,
          hasTouchScreen: false
        }
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);

      await expect(
        deviceService.registerDevice(userId, invalidMobileDevice)
      ).rejects.toThrow(new AppError('Mobile device must have touch screen', 400));
    });

    it('should throw error for device with insufficient storage', async () => {
      const userId = 'user-123';
      const invalidDevice = {
        ...validWebDevice,
        capabilities: {
          ...validWebDevice.capabilities,
          maxStorageSize: 5
        }
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);

      await expect(
        deviceService.registerDevice(userId, invalidDevice)
      ).rejects.toThrow(new AppError('Device must have at least 10MB storage capacity', 400));
    });

    it('should throw error for web platform with non-web device type', async () => {
      const userId = 'user-123';
      const invalidDevice = {
        ...validMobileDevice,
        platform: 'web' as const
      };

      mockDeviceRepository.getUserDevices.mockResolvedValue([]);

      await expect(
        deviceService.registerDevice(userId, invalidDevice)
      ).rejects.toThrow(new AppError('Web platform can only be used with web device type', 400));
    });

    it('should enforce device limit per user', async () => {
      const userId = 'user-123';
      const existingDevices = Array(10).fill(null).map((_, i) => ({
        id: `device-${i}`,
        userId,
        deviceType: 'web',
        isActive: true
      }));

      mockDeviceRepository.getUserDevices.mockResolvedValue(existingDevices as Device[]);

      await expect(
        deviceService.registerDevice(userId, validWebDevice)
      ).rejects.toThrow(new AppError('User has reached maximum device limit', 400));
    });
  });

  describe('updateDevice', () => {
    const deviceId = 'device-123';
    const userId = 'user-123';
    
    const existingDevice: Device = {
      id: deviceId,
      userId,
      deviceType: 'mobile',
      platform: 'ios',
      deviceName: 'iPhone 14',
      appVersion: '1.0.0',
      capabilities: {
        hasCamera: true,
        hasAR: true,
        hasVR: false,
        hasGPS: true,
        hasAccelerometer: true,
        hasGyroscope: true,
        hasTouchScreen: true,
        hasKeyboard: false,
        hasMicrophone: true,
        hasSpeakers: true,
        supportsOffline: true,
        maxStorageSize: 500
      },
      metadata: {
        timezone: 'America/New_York',
        locale: 'en-US'
      },
      isActive: true,
      registeredAt: new Date(),
      updatedAt: new Date()
    };

    it('should update device name', async () => {
      const updates: DeviceUpdateRequest = {
        deviceName: 'My iPhone'
      };

      const updatedDevice = { ...existingDevice, ...updates };

      mockDeviceRepository.getById.mockResolvedValue(existingDevice);
      mockDeviceRepository.update.mockResolvedValue(updatedDevice);

      const result = await deviceService.updateDevice(deviceId, updates);

      expect(result).toEqual(updatedDevice);
      expect(mockDeviceRepository.update).toHaveBeenCalledWith(deviceId, updates);
    });

    it('should update device capabilities', async () => {
      const updates: DeviceUpdateRequest = {
        capabilities: {
          maxStorageSize: 1000
        }
      };

      const updatedDevice = {
        ...existingDevice,
        capabilities: {
          ...existingDevice.capabilities,
          ...updates.capabilities
        }
      };

      mockDeviceRepository.getById.mockResolvedValue(existingDevice);
      mockDeviceRepository.update.mockResolvedValue(updatedDevice);

      const result = await deviceService.updateDevice(deviceId, updates);

      expect(result).toEqual(updatedDevice);
    });

    it('should validate capabilities when updating', async () => {
      const updates: DeviceUpdateRequest = {
        capabilities: {
          maxStorageSize: 5 // Below minimum
        }
      };

      mockDeviceRepository.getById.mockResolvedValue(existingDevice);

      await expect(
        deviceService.updateDevice(deviceId, updates)
      ).rejects.toThrow(new AppError('Device must have at least 10MB storage capacity', 400));
    });

    it('should throw error if device not found', async () => {
      const updates: DeviceUpdateRequest = {
        deviceName: 'New Name'
      };

      mockDeviceRepository.getById.mockResolvedValue(null);

      await expect(
        deviceService.updateDevice(deviceId, updates)
      ).rejects.toThrow(new AppError('Device not found', 404));
    });
  });

  describe('deactivateDevice', () => {
    it('should deactivate an active device', async () => {
      const deviceId = 'device-123';
      const activeDevice: Device = {
        id: deviceId,
        userId: 'user-123',
        deviceType: 'web',
        platform: 'web',
        deviceName: 'Chrome',
        appVersion: '1.0.0',
        capabilities: {} as any,
        metadata: {} as any,
        isActive: true,
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      const deactivatedDevice = { ...activeDevice, isActive: false };

      mockDeviceRepository.getById.mockResolvedValue(activeDevice);
      mockDeviceRepository.update.mockResolvedValue(deactivatedDevice);

      const result = await deviceService.deactivateDevice(deviceId);

      expect(result).toEqual(deactivatedDevice);
      expect(mockDeviceRepository.update).toHaveBeenCalledWith(deviceId, { isActive: false });
    });

    it('should throw error if device not found', async () => {
      const deviceId = 'device-123';

      mockDeviceRepository.getById.mockResolvedValue(null);

      await expect(
        deviceService.deactivateDevice(deviceId)
      ).rejects.toThrow(new AppError('Device not found', 404));
    });
  });
});