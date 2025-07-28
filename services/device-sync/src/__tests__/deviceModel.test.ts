import { DeviceModel } from '../models/device';
import { Device, DeviceCapabilities, DeviceMetadata } from '@pageflow/types';

describe('DeviceModel', () => {
  const mockCapabilities: DeviceCapabilities = {
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
  };

  const mockMetadata: DeviceMetadata = {
    screenResolution: { width: 393, height: 852 },
    screenDensity: 3,
    timezone: 'America/New_York',
    locale: 'en-US',
    networkType: 'wifi'
  };

  const mockDeviceData: Partial<Device> = {
    id: 'device-123',
    userId: 'user-123',
    deviceType: 'mobile',
    platform: 'ios',
    deviceName: 'iPhone 15',
    deviceModel: 'iPhone15,2',
    osVersion: '17.0',
    appVersion: '1.0.0',
    capabilities: mockCapabilities,
    metadata: mockMetadata,
    isActive: true
  };

  describe('constructor', () => {
    it('should create a device with provided data', () => {
      const device = new DeviceModel(mockDeviceData);

      expect(device.id).toBe('device-123');
      expect(device.userId).toBe('user-123');
      expect(device.deviceType).toBe('mobile');
      expect(device.platform).toBe('ios');
      expect(device.deviceName).toBe('iPhone 15');
      expect(device.deviceModel).toBe('iPhone15,2');
      expect(device.osVersion).toBe('17.0');
      expect(device.appVersion).toBe('1.0.0');
      expect(device.capabilities).toEqual(mockCapabilities);
      expect(device.metadata).toEqual(mockMetadata);
      expect(device.isActive).toBe(true);
      expect(device.registeredAt).toBeInstanceOf(Date);
      expect(device.updatedAt).toBeInstanceOf(Date);
    });

    it('should use default values for missing data', () => {
      const minimalData = {
        userId: 'user-123',
        deviceName: 'Test Device',
        appVersion: '1.0.0'
      };

      const device = new DeviceModel(minimalData);

      expect(device.id).toBe('');
      expect(device.deviceType).toBe('web');
      expect(device.platform).toBe('web');
      expect(device.isActive).toBe(true);
      expect(device.capabilities).toEqual({
        hasCamera: false,
        hasAR: false,
        hasVR: false,
        hasGPS: false,
        hasAccelerometer: false,
        hasGyroscope: false,
        hasTouchScreen: false,
        hasKeyboard: true,
        hasMicrophone: false,
        hasSpeakers: true,
        supportsOffline: true,
        maxStorageSize: 50
      });
      expect(device.metadata).toEqual({
        timezone: 'UTC',
        locale: 'en-US'
      });
    });

    it('should handle partial capabilities', () => {
      const dataWithPartialCapabilities = {
        ...mockDeviceData,
        capabilities: {
          hasCamera: true,
          maxStorageSize: 1000
        } as Partial<DeviceCapabilities>
      };

      const device = new DeviceModel(dataWithPartialCapabilities);

      expect(device.capabilities.hasCamera).toBe(true);
      expect(device.capabilities.maxStorageSize).toBe(1000);
      // Should still have default values for other capabilities
      expect(device.capabilities.hasKeyboard).toBe(true);
      expect(device.capabilities.hasSpeakers).toBe(true);
    });
  });

  describe('updateLastSync', () => {
    it('should update lastSyncAt and updatedAt timestamps', () => {
      const device = new DeviceModel(mockDeviceData);
      const originalUpdatedAt = device.updatedAt;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        device.updateLastSync();

        expect(device.lastSyncAt).toBeInstanceOf(Date);
        expect(device.updatedAt).toBeInstanceOf(Date);
        expect(device.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('updateMetadata', () => {
    it('should merge new metadata with existing metadata', () => {
      const device = new DeviceModel(mockDeviceData);
      const originalUpdatedAt = device.updatedAt;

      const newMetadata = {
        batteryLevel: 85,
        networkType: 'cellular' as const
      };

      setTimeout(() => {
        device.updateMetadata(newMetadata);

        expect(device.metadata).toEqual({
          ...mockMetadata,
          ...newMetadata
        });
        expect(device.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('should preserve existing metadata when updating', () => {
      const device = new DeviceModel(mockDeviceData);

      device.updateMetadata({ batteryLevel: 75 });

      expect(device.metadata.timezone).toBe('America/New_York');
      expect(device.metadata.locale).toBe('en-US');
      expect(device.metadata.screenResolution).toEqual({ width: 393, height: 852 });
      expect((device.metadata as any).batteryLevel).toBe(75);
    });
  });

  describe('updateCapabilities', () => {
    it('should merge new capabilities with existing capabilities', () => {
      const device = new DeviceModel(mockDeviceData);
      const originalUpdatedAt = device.updatedAt;

      const newCapabilities = {
        hasVR: true,
        maxStorageSize: 1000
      };

      setTimeout(() => {
        device.updateCapabilities(newCapabilities);

        expect(device.capabilities).toEqual({
          ...mockCapabilities,
          ...newCapabilities
        });
        expect(device.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('should preserve existing capabilities when updating', () => {
      const device = new DeviceModel(mockDeviceData);

      device.updateCapabilities({ hasVR: true });

      expect(device.capabilities.hasCamera).toBe(true);
      expect(device.capabilities.hasAR).toBe(true);
      expect(device.capabilities.hasVR).toBe(true);
      expect(device.capabilities.maxStorageSize).toBe(500);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false and update timestamp', () => {
      const device = new DeviceModel(mockDeviceData);
      const originalUpdatedAt = device.updatedAt;

      setTimeout(() => {
        device.deactivate();

        expect(device.isActive).toBe(false);
        expect(device.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('activate', () => {
    it('should set isActive to true and update timestamp', () => {
      const inactiveDeviceData = { ...mockDeviceData, isActive: false };
      const device = new DeviceModel(inactiveDeviceData);
      const originalUpdatedAt = device.updatedAt;

      setTimeout(() => {
        device.activate();

        expect(device.isActive).toBe(true);
        expect(device.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('toJSON', () => {
    it('should return a plain Device object', () => {
      const device = new DeviceModel(mockDeviceData);
      const json = device.toJSON();

      expect(json).toEqual({
        id: device.id,
        userId: device.userId,
        deviceType: device.deviceType,
        platform: device.platform,
        deviceName: device.deviceName,
        deviceModel: device.deviceModel,
        osVersion: device.osVersion,
        appVersion: device.appVersion,
        capabilities: device.capabilities,
        metadata: device.metadata,
        isActive: device.isActive,
        lastSyncAt: device.lastSyncAt,
        registeredAt: device.registeredAt,
        updatedAt: device.updatedAt
      });

      // Ensure it's a plain object, not a DeviceModel instance
      expect(json).not.toBeInstanceOf(DeviceModel);
      expect(typeof json.updateLastSync).toBe('undefined');
    });
  });

  describe('platform-specific validation scenarios', () => {
    it('should handle web device capabilities correctly', () => {
      const webDeviceData = {
        userId: 'user-123',
        deviceType: 'web' as const,
        platform: 'web' as const,
        deviceName: 'Chrome Browser',
        appVersion: '1.0.0',
        capabilities: {
          hasCamera: true,
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
        }
      };

      const device = new DeviceModel(webDeviceData);

      expect(device.deviceType).toBe('web');
      expect(device.platform).toBe('web');
      expect(device.capabilities.hasKeyboard).toBe(true);
      expect(device.capabilities.hasTouchScreen).toBe(false);
    });

    it('should handle AR device capabilities correctly', () => {
      const arDeviceData = {
        userId: 'user-123',
        deviceType: 'ar' as const,
        platform: 'android' as const,
        deviceName: 'Pixel 8 Pro',
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
        }
      };

      const device = new DeviceModel(arDeviceData);

      expect(device.deviceType).toBe('ar');
      expect(device.capabilities.hasAR).toBe(true);
      expect(device.capabilities.hasCamera).toBe(true);
      expect(device.capabilities.hasAccelerometer).toBe(true);
      expect(device.capabilities.hasGyroscope).toBe(true);
    });

    it('should handle VR device capabilities correctly', () => {
      const vrDeviceData = {
        userId: 'user-123',
        deviceType: 'vr' as const,
        platform: 'android' as const,
        deviceName: 'Meta Quest 3',
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
        }
      };

      const device = new DeviceModel(vrDeviceData);

      expect(device.deviceType).toBe('vr');
      expect(device.capabilities.hasVR).toBe(true);
      expect(device.capabilities.hasTouchScreen).toBe(false);
      expect(device.capabilities.hasKeyboard).toBe(false);
    });
  });
});