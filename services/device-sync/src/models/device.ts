import { Device, DeviceCapabilities, DeviceMetadata } from '@pageflow/types';

export class DeviceModel implements Device {
  id: string;
  userId: string;
  deviceType: 'web' | 'mobile' | 'ar' | 'vr';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web';
  deviceName: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion: string;
  capabilities: DeviceCapabilities;
  metadata: DeviceMetadata;
  isActive: boolean;
  lastSyncAt?: Date;
  registeredAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Device>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.deviceType = data.deviceType || 'web';
    this.platform = data.platform || 'web';
    this.deviceName = data.deviceName || '';
    this.deviceModel = data.deviceModel;
    this.osVersion = data.osVersion;
    this.appVersion = data.appVersion || '';
    this.capabilities = data.capabilities || this.getDefaultCapabilities();
    this.metadata = data.metadata || this.getDefaultMetadata();
    this.isActive = data.isActive ?? true;
    this.lastSyncAt = data.lastSyncAt;
    this.registeredAt = data.registeredAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  private getDefaultCapabilities(): DeviceCapabilities {
    return {
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
      maxStorageSize: 50, // 50MB default
    };
  }

  private getDefaultMetadata(): DeviceMetadata {
    return {
      timezone: 'UTC',
      locale: 'en-US',
    };
  }

  updateLastSync(): void {
    this.lastSyncAt = new Date();
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: Partial<DeviceMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  updateCapabilities(capabilities: Partial<DeviceCapabilities>): void {
    this.capabilities = { ...this.capabilities, ...capabilities };
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  toJSON(): Device {
    return {
      id: this.id,
      userId: this.userId,
      deviceType: this.deviceType,
      platform: this.platform,
      deviceName: this.deviceName,
      deviceModel: this.deviceModel,
      osVersion: this.osVersion,
      appVersion: this.appVersion,
      capabilities: this.capabilities,
      metadata: this.metadata,
      isActive: this.isActive,
      lastSyncAt: this.lastSyncAt,
      registeredAt: this.registeredAt,
      updatedAt: this.updatedAt,
    };
  }
}