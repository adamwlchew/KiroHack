export interface Device {
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
}
export interface DeviceCapabilities {
    hasCamera: boolean;
    hasAR: boolean;
    hasVR: boolean;
    hasGPS: boolean;
    hasAccelerometer: boolean;
    hasGyroscope: boolean;
    hasTouchScreen: boolean;
    hasKeyboard: boolean;
    hasMicrophone: boolean;
    hasSpeakers: boolean;
    supportsOffline: boolean;
    maxStorageSize: number;
}
export interface DeviceMetadata {
    screenResolution?: {
        width: number;
        height: number;
    };
    screenDensity?: number;
    batteryLevel?: number;
    networkType?: 'wifi' | 'cellular' | 'ethernet' | 'offline';
    timezone: string;
    locale: string;
    userAgent?: string;
    ipAddress?: string;
}
export interface DeviceRegistrationRequest {
    deviceType: Device['deviceType'];
    platform: Device['platform'];
    deviceName: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion: string;
    capabilities: DeviceCapabilities;
    metadata: Omit<DeviceMetadata, 'ipAddress'>;
}
export interface DeviceUpdateRequest {
    deviceName?: string;
    capabilities?: Partial<DeviceCapabilities>;
    metadata?: Partial<Omit<DeviceMetadata, 'ipAddress'>>;
    isActive?: boolean;
}
export interface DeviceAuthToken {
    deviceId: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface SyncData {
    id: string;
    userId: string;
    deviceId: string;
    dataType: 'progress' | 'preferences' | 'content' | 'companion' | 'assessment';
    data: any;
    version: number;
    lastModified: Date;
    syncStatus: 'pending' | 'synced' | 'conflict';
    conflictResolution?: 'server_wins' | 'client_wins' | 'merge' | 'manual';
}
export interface SyncConflict {
    id: string;
    userId: string;
    dataType: SyncData['dataType'];
    serverData: any;
    clientData: any;
    serverVersion: number;
    clientVersion: number;
    conflictedAt: Date;
    resolvedAt?: Date;
    resolution?: SyncData['conflictResolution'];
}
export interface OfflineData {
    id: string;
    userId: string;
    deviceId: string;
    dataType: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
    synced: boolean;
}
//# sourceMappingURL=device.d.ts.map