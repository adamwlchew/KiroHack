import { DeviceCapabilities, DeviceMetadata } from '@pageflow/types';
import { AppError } from '@pageflow/utils/src/error/appError';

/**
 * Device validation utilities for ensuring devices meet platform requirements
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate device capabilities for accessibility compliance
 */
export function validateAccessibilityCapabilities(
  deviceType: string,
  capabilities: DeviceCapabilities
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Audio capabilities for screen reader support
  if (!capabilities.hasSpeakers && !capabilities.hasMicrophone) {
    if (deviceType === 'vr') {
      result.errors.push('VR devices must have audio capabilities for accessibility');
      result.isValid = false;
    } else {
      result.warnings.push('Device lacks audio capabilities, may limit accessibility features');
    }
  }

  // Input method validation
  if (deviceType === 'web' && !capabilities.hasKeyboard && !capabilities.hasTouchScreen) {
    result.errors.push('Web devices must support keyboard or touch input for accessibility');
    result.isValid = false;
  }

  // Mobile accessibility requirements
  if (deviceType === 'mobile') {
    if (!capabilities.hasTouchScreen) {
      result.errors.push('Mobile devices must have touch screen for accessibility');
      result.isValid = false;
    }
    
    if (!capabilities.hasSpeakers) {
      result.warnings.push('Mobile device without speakers may limit audio feedback');
    }
  }

  // VR accessibility requirements
  if (deviceType === 'vr') {
    if (!capabilities.hasAccelerometer || !capabilities.hasGyroscope) {
      result.errors.push('VR devices must have motion sensors for head tracking accessibility');
      result.isValid = false;
    }
  }

  return result;
}

/**
 * Validate device capabilities for cross-platform consistency
 */
export function validateCrossPlatformCapabilities(
  deviceType: string,
  platform: string,
  capabilities: DeviceCapabilities
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Platform-specific validations
  switch (platform) {
    case 'ios':
    case 'android':
      if (deviceType === 'mobile' || deviceType === 'ar') {
        if (!capabilities.hasAccelerometer) {
          result.warnings.push('Mobile platform should have accelerometer for orientation features');
        }
        if (!capabilities.hasGPS && deviceType === 'mobile') {
          result.warnings.push('Mobile device without GPS may have limited location features');
        }
      }
      break;

    case 'web':
      if (deviceType !== 'web') {
        result.errors.push('Web platform can only be used with web device type');
        result.isValid = false;
      }
      if (!capabilities.supportsOffline) {
        result.warnings.push('Web device should support offline for PWA features');
      }
      break;

    case 'windows':
    case 'macos':
    case 'linux':
      if (!capabilities.hasKeyboard) {
        result.warnings.push('Desktop platform should have keyboard for full functionality');
      }
      break;
  }

  return result;
}

/**
 * Validate device storage requirements based on device type
 */
export function validateStorageRequirements(
  deviceType: string,
  capabilities: DeviceCapabilities
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const minStorageRequirements = {
    web: 10,      // MB - Basic caching
    mobile: 50,   // MB - Offline content
    ar: 100,      // MB - AR assets
    vr: 200       // MB - VR assets and models
  };

  const recommendedStorage = {
    web: 100,
    mobile: 200,
    ar: 500,
    vr: 1000
  };

  const minRequired = minStorageRequirements[deviceType as keyof typeof minStorageRequirements] || 10;
  const recommended = recommendedStorage[deviceType as keyof typeof recommendedStorage] || 100;

  if (capabilities.maxStorageSize < minRequired) {
    result.errors.push(`${deviceType} device must have at least ${minRequired}MB storage`);
    result.isValid = false;
  } else if (capabilities.maxStorageSize < recommended) {
    result.warnings.push(`${deviceType} device should have at least ${recommended}MB storage for optimal experience`);
  }

  return result;
}

/**
 * Validate device metadata for completeness
 */
export function validateDeviceMetadata(
  deviceType: string,
  metadata: DeviceMetadata
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Required fields
  if (!metadata.timezone) {
    result.errors.push('Device timezone is required');
    result.isValid = false;
  }

  if (!metadata.locale) {
    result.errors.push('Device locale is required');
    result.isValid = false;
  }

  // Screen resolution for visual devices
  if (deviceType !== 'vr' && !metadata.screenResolution) {
    result.warnings.push('Screen resolution should be provided for optimal content rendering');
  }

  // Screen density for mobile devices
  if ((deviceType === 'mobile' || deviceType === 'ar') && !metadata.screenDensity) {
    result.warnings.push('Screen density should be provided for mobile devices');
  }

  // Network type for offline capability planning
  if (!metadata.networkType) {
    result.warnings.push('Network type should be provided for offline content optimization');
  }

  return result;
}

/**
 * Comprehensive device validation
 */
export function validateDevice(
  deviceType: string,
  platform: string,
  capabilities: DeviceCapabilities,
  metadata: DeviceMetadata
): ValidationResult {
  const results = [
    validateAccessibilityCapabilities(deviceType, capabilities),
    validateCrossPlatformCapabilities(deviceType, platform, capabilities),
    validateStorageRequirements(deviceType, capabilities),
    validateDeviceMetadata(deviceType, metadata)
  ];

  const combinedResult: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  for (const result of results) {
    if (!result.isValid) {
      combinedResult.isValid = false;
    }
    combinedResult.errors.push(...result.errors);
    combinedResult.warnings.push(...result.warnings);
  }

  return combinedResult;
}

/**
 * Get recommended capabilities for a device type
 */
export function getRecommendedCapabilities(deviceType: string, platform: string): Partial<DeviceCapabilities> {
  const baseCapabilities: Partial<DeviceCapabilities> = {
    supportsOffline: true,
    hasSpeakers: true
  };

  switch (deviceType) {
    case 'web':
      return {
        ...baseCapabilities,
        hasKeyboard: true,
        hasMicrophone: true,
        maxStorageSize: 100
      };

    case 'mobile':
      return {
        ...baseCapabilities,
        hasTouchScreen: true,
        hasCamera: true,
        hasGPS: true,
        hasAccelerometer: true,
        hasGyroscope: true,
        hasMicrophone: true,
        maxStorageSize: 200
      };

    case 'ar':
      return {
        ...baseCapabilities,
        hasCamera: true,
        hasAR: true,
        hasTouchScreen: true,
        hasGPS: true,
        hasAccelerometer: true,
        hasGyroscope: true,
        hasMicrophone: true,
        maxStorageSize: 500
      };

    case 'vr':
      return {
        ...baseCapabilities,
        hasVR: true,
        hasAccelerometer: true,
        hasGyroscope: true,
        hasMicrophone: true,
        maxStorageSize: 1000
      };

    default:
      return baseCapabilities;
  }
}

/**
 * Check if device supports specific learning features
 */
export function checkLearningFeatureSupport(
  deviceType: string,
  capabilities: DeviceCapabilities
): Record<string, boolean> {
  return {
    offlineContent: capabilities.supportsOffline,
    audioContent: capabilities.hasSpeakers,
    voiceInteraction: capabilities.hasMicrophone,
    cameraBasedLearning: capabilities.hasCamera,
    locationBasedLearning: capabilities.hasGPS,
    motionBasedLearning: capabilities.hasAccelerometer && capabilities.hasGyroscope,
    arLearning: capabilities.hasAR && capabilities.hasCamera,
    vrLearning: capabilities.hasVR,
    touchInteraction: capabilities.hasTouchScreen,
    keyboardInput: capabilities.hasKeyboard,
    adaptiveContent: capabilities.maxStorageSize >= 100
  };
}