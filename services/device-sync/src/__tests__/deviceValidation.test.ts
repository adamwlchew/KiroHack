import {
  validateAccessibilityCapabilities,
  validateCrossPlatformCapabilities,
  validateStorageRequirements,
  validateDeviceMetadata,
  validateDevice,
  getRecommendedCapabilities,
  checkLearningFeatureSupport
} from '../utils/deviceValidation';
import { DeviceCapabilities, DeviceMetadata } from '@pageflow/types';

describe('Device Validation Utilities', () => {
  const mockWebCapabilities: DeviceCapabilities = {
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
  };

  const mockMobileCapabilities: DeviceCapabilities = {
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

  const mockVRCapabilities: DeviceCapabilities = {
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
    maxStorageSize: 1000
  };

  const mockMetadata: DeviceMetadata = {
    screenResolution: { width: 1920, height: 1080 },
    screenDensity: 1,
    timezone: 'America/New_York',
    locale: 'en-US',
    networkType: 'wifi'
  };

  describe('validateAccessibilityCapabilities', () => {
    it('should pass validation for web device with proper capabilities', () => {
      const result = validateAccessibilityCapabilities('web', mockWebCapabilities);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for web device without input methods', () => {
      const invalidCapabilities = {
        ...mockWebCapabilities,
        hasKeyboard: false,
        hasTouchScreen: false
      };

      const result = validateAccessibilityCapabilities('web', invalidCapabilities);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Web devices must support keyboard or touch input for accessibility');
    });

    it('should fail validation for VR device without audio', () => {
      const invalidCapabilities = {
        ...mockVRCapabilities,
        hasSpeakers: false,
        hasMicrophone: false
      };

      const result = validateAccessibilityCapabilities('vr', invalidCapabilities);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('VR devices must have audio capabilities for accessibility');
    });

    it('should fail validation for mobile device without touch screen', () => {
      const invalidCapabilities = {
        ...mockMobileCapabilities,
        hasTouchScreen: false
      };

      const result = validateAccessibilityCapabilities('mobile', invalidCapabilities);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mobile devices must have touch screen for accessibility');
    });

    it('should fail validation for VR device without motion sensors', () => {
      const invalidCapabilities = {
        ...mockVRCapabilities,
        hasAccelerometer: false,
        hasGyroscope: false
      };

      const result = validateAccessibilityCapabilities('vr', invalidCapabilities);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('VR devices must have motion sensors for head tracking accessibility');
    });
  });

  describe('validateCrossPlatformCapabilities', () => {
    it('should pass validation for iOS mobile device', () => {
      const result = validateCrossPlatformCapabilities('mobile', 'ios', mockMobileCapabilities);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for non-web device on web platform', () => {
      const result = validateCrossPlatformCapabilities('mobile', 'web', mockMobileCapabilities);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Web platform can only be used with web device type');
    });

    it('should warn about missing accelerometer on mobile platform', () => {
      const capabilitiesWithoutAccelerometer = {
        ...mockMobileCapabilities,
        hasAccelerometer: false
      };

      const result = validateCrossPlatformCapabilities('mobile', 'ios', capabilitiesWithoutAccelerometer);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Mobile platform should have accelerometer for orientation features');
    });

    it('should warn about missing GPS on mobile device', () => {
      const capabilitiesWithoutGPS = {
        ...mockMobileCapabilities,
        hasGPS: false
      };

      const result = validateCrossPlatformCapabilities('mobile', 'android', capabilitiesWithoutGPS);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Mobile device without GPS may have limited location features');
    });
  });

  describe('validateStorageRequirements', () => {
    it('should pass validation for device with sufficient storage', () => {
      const result = validateStorageRequirements('web', mockWebCapabilities);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for device with insufficient storage', () => {
      const lowStorageCapabilities = {
        ...mockWebCapabilities,
        maxStorageSize: 5
      };

      const result = validateStorageRequirements('web', lowStorageCapabilities);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('web device must have at least 10MB storage');
    });

    it('should warn about low storage for VR device', () => {
      const lowStorageCapabilities = {
        ...mockVRCapabilities,
        maxStorageSize: 250
      };

      const result = validateStorageRequirements('vr', lowStorageCapabilities);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('vr device should have at least 1000MB storage for optimal experience');
    });

    it('should have different storage requirements for different device types', () => {
      const capabilities = { ...mockWebCapabilities, maxStorageSize: 50 };

      const webResult = validateStorageRequirements('web', capabilities);
      const vrResult = validateStorageRequirements('vr', capabilities);

      expect(webResult.isValid).toBe(true);
      expect(vrResult.isValid).toBe(false);
    });
  });

  describe('validateDeviceMetadata', () => {
    it('should pass validation for complete metadata', () => {
      const result = validateDeviceMetadata('mobile', mockMetadata);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing timezone', () => {
      const incompleteMetadata = {
        ...mockMetadata,
        timezone: undefined as any
      };

      const result = validateDeviceMetadata('mobile', incompleteMetadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device timezone is required');
    });

    it('should fail validation for missing locale', () => {
      const incompleteMetadata = {
        ...mockMetadata,
        locale: undefined as any
      };

      const result = validateDeviceMetadata('mobile', incompleteMetadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device locale is required');
    });

    it('should warn about missing screen resolution for non-VR devices', () => {
      const metadataWithoutResolution = {
        ...mockMetadata,
        screenResolution: undefined
      };

      const result = validateDeviceMetadata('mobile', metadataWithoutResolution);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Screen resolution should be provided for optimal content rendering');
    });

    it('should not warn about missing screen resolution for VR devices', () => {
      const metadataWithoutResolution = {
        ...mockMetadata,
        screenResolution: undefined
      };

      const result = validateDeviceMetadata('vr', metadataWithoutResolution);
      
      expect(result.warnings).not.toContain('Screen resolution should be provided for optimal content rendering');
    });
  });

  describe('validateDevice', () => {
    it('should pass comprehensive validation for valid device', () => {
      const result = validateDevice('mobile', 'ios', mockMobileCapabilities, mockMetadata);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail comprehensive validation for invalid device', () => {
      const invalidCapabilities = {
        ...mockMobileCapabilities,
        hasTouchScreen: false,
        maxStorageSize: 5
      };

      const invalidMetadata = {
        ...mockMetadata,
        timezone: undefined as any
      };

      const result = validateDevice('mobile', 'ios', invalidCapabilities, invalidMetadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should combine warnings from all validation functions', () => {
      const capabilitiesWithWarnings = {
        ...mockMobileCapabilities,
        hasGPS: false,
        maxStorageSize: 75
      };

      const metadataWithWarnings = {
        ...mockMetadata,
        screenDensity: undefined
      };

      const result = validateDevice('mobile', 'ios', capabilitiesWithWarnings, metadataWithWarnings);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getRecommendedCapabilities', () => {
    it('should return appropriate capabilities for web device', () => {
      const recommended = getRecommendedCapabilities('web', 'web');
      
      expect(recommended.hasKeyboard).toBe(true);
      expect(recommended.supportsOffline).toBe(true);
      expect(recommended.maxStorageSize).toBe(100);
    });

    it('should return appropriate capabilities for mobile device', () => {
      const recommended = getRecommendedCapabilities('mobile', 'ios');
      
      expect(recommended.hasTouchScreen).toBe(true);
      expect(recommended.hasCamera).toBe(true);
      expect(recommended.hasGPS).toBe(true);
      expect(recommended.hasAccelerometer).toBe(true);
      expect(recommended.maxStorageSize).toBe(200);
    });

    it('should return appropriate capabilities for AR device', () => {
      const recommended = getRecommendedCapabilities('ar', 'android');
      
      expect(recommended.hasAR).toBe(true);
      expect(recommended.hasCamera).toBe(true);
      expect(recommended.hasAccelerometer).toBe(true);
      expect(recommended.hasGyroscope).toBe(true);
      expect(recommended.maxStorageSize).toBe(500);
    });

    it('should return appropriate capabilities for VR device', () => {
      const recommended = getRecommendedCapabilities('vr', 'android');
      
      expect(recommended.hasVR).toBe(true);
      expect(recommended.hasAccelerometer).toBe(true);
      expect(recommended.hasGyroscope).toBe(true);
      expect(recommended.maxStorageSize).toBe(1000);
    });
  });

  describe('checkLearningFeatureSupport', () => {
    it('should correctly identify supported features for web device', () => {
      const features = checkLearningFeatureSupport('web', mockWebCapabilities);
      
      expect(features.offlineContent).toBe(true);
      expect(features.audioContent).toBe(true);
      expect(features.voiceInteraction).toBe(true);
      expect(features.keyboardInput).toBe(true);
      expect(features.touchInteraction).toBe(false);
      expect(features.arLearning).toBe(false);
      expect(features.vrLearning).toBe(false);
    });

    it('should correctly identify supported features for mobile device', () => {
      const features = checkLearningFeatureSupport('mobile', mockMobileCapabilities);
      
      expect(features.touchInteraction).toBe(true);
      expect(features.cameraBasedLearning).toBe(true);
      expect(features.locationBasedLearning).toBe(true);
      expect(features.motionBasedLearning).toBe(true);
      expect(features.arLearning).toBe(true);
      expect(features.keyboardInput).toBe(false);
      expect(features.vrLearning).toBe(false);
    });

    it('should correctly identify supported features for VR device', () => {
      const features = checkLearningFeatureSupport('vr', mockVRCapabilities);
      
      expect(features.vrLearning).toBe(true);
      expect(features.motionBasedLearning).toBe(true);
      expect(features.audioContent).toBe(true);
      expect(features.voiceInteraction).toBe(true);
      expect(features.touchInteraction).toBe(false);
      expect(features.keyboardInput).toBe(false);
      expect(features.arLearning).toBe(false);
    });

    it('should identify adaptive content support based on storage', () => {
      const lowStorageCapabilities = {
        ...mockWebCapabilities,
        maxStorageSize: 50
      };

      const highStorageCapabilities = {
        ...mockWebCapabilities,
        maxStorageSize: 200
      };

      const lowStorageFeatures = checkLearningFeatureSupport('web', lowStorageCapabilities);
      const highStorageFeatures = checkLearningFeatureSupport('web', highStorageCapabilities);

      expect(lowStorageFeatures.adaptiveContent).toBe(false);
      expect(highStorageFeatures.adaptiveContent).toBe(true);
    });
  });
});