import { SyncData, SyncConflict, OfflineData, Device } from '@pageflow/types';
import { SyncRepository } from '../repositories/syncRepository';
import { DeviceRepository } from '../repositories/deviceRepository';
import { AppError, logger } from '@pageflow/utils';
import { config } from '../config';
import { WebSocketService } from './websocketService';

export interface SyncRequest {
  deviceId: string;
  dataType: 'progress' | 'preferences' | 'content' | 'companion' | 'assessment';
  data: any;
  version: number;
  lastModified: Date;
}

export interface SyncResponse {
  success: boolean;
  conflicts?: SyncConflict[];
  syncedData?: SyncData[];
  message?: string;
}

export interface ConflictResolutionRequest {
  conflictId: string;
  resolution: 'server_wins' | 'client_wins' | 'merge';
  mergedData?: any;
}

export class SyncService {
  private syncRepository: SyncRepository;
  private deviceRepository: DeviceRepository;
  private websocketService?: WebSocketService;
  private logger: any;

  constructor(websocketService?: WebSocketService) {
    this.syncRepository = new SyncRepository();
    this.deviceRepository = new DeviceRepository();
    this.websocketService = websocketService;
    this.logger = logger.child({ service: 'SyncService' });
  }

  async syncData(userId: string, requests: SyncRequest[]): Promise<SyncResponse> {
    try {
      this.logger.info('Starting data synchronization', { 
        userId, 
        requestCount: requests.length 
      });

      const conflicts: SyncConflict[] = [];
      const syncedData: SyncData[] = [];

      for (const request of requests) {
        try {
          const result = await this.processSyncRequest(userId, request);
          
          if (result.conflict) {
            conflicts.push(result.conflict);
          } else if (result.syncData) {
            syncedData.push(result.syncData);
          }
        } catch (error) {
          this.logger.error('Failed to process sync request', error, { 
            userId, 
            deviceId: request.deviceId,
            dataType: request.dataType 
          });
          // Continue processing other requests
        }
      }

      // Update device last sync time
      for (const request of requests) {
        try {
          await this.deviceRepository.updateLastSync(request.deviceId);
        } catch (error) {
          this.logger.error('Failed to update device last sync time', error, { 
            deviceId: request.deviceId 
          });
        }
      }

      // Notify other devices about sync updates
      if (this.websocketService && syncedData.length > 0) {
        for (const data of syncedData) {
          this.websocketService.broadcastSyncUpdate(userId, {
            dataType: data.dataType,
            version: data.version,
            lastModified: data.lastModified,
          }, data.deviceId);
        }
      }

      // Notify about conflicts
      if (this.websocketService && conflicts.length > 0) {
        for (const conflict of conflicts) {
          this.websocketService.notifyConflict(userId, {
            conflictId: conflict.id,
            dataType: conflict.dataType,
            conflictedAt: conflict.conflictedAt,
          });
        }
      }

      this.logger.info('Data synchronization completed', { 
        userId, 
        syncedCount: syncedData.length,
        conflictCount: conflicts.length 
      });

      return {
        success: true,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        syncedData: syncedData.length > 0 ? syncedData : undefined,
        message: `Synchronized ${syncedData.length} items, ${conflicts.length} conflicts`,
      };
    } catch (error) {
      this.logger.error({ message: 'Synchronization failed', error: error instanceof Error ? error.message : String(error), userId });
      throw new AppError('Synchronization failed', 500);
    }
  }

  async getUserSyncData(userId: string, dataType?: 'progress' | 'preferences' | 'content' | 'companion' | 'assessment', deviceId?: string): Promise<SyncData[]> {
    try {
      let syncData: SyncData[];

      if (deviceId) {
        syncData = await this.syncRepository.getDeviceSyncData(deviceId, dataType);
      } else {
        syncData = await this.syncRepository.getUserSyncData(userId, dataType);
      }

      // Filter out conflicted data unless specifically requested
      return syncData.filter(data => data.syncStatus !== 'conflict');
    } catch (error) {
      this.logger.error('Failed to get user sync data', error, { userId, dataType, deviceId });
      throw error;
    }
  }

  async resolveConflict(userId: string, request: ConflictResolutionRequest): Promise<SyncData> {
    try {
      this.logger.info('Resolving sync conflict', { 
        userId, 
        conflictId: request.conflictId,
        resolution: request.resolution 
      });

      const conflictData = await this.syncRepository.getSyncData(request.conflictId);
      if (!conflictData) {
        throw new AppError('Conflict not found', 404);
      }

      if (conflictData.userId !== userId) {
        throw new AppError('Unauthorized to resolve this conflict', 403);
      }

      if (conflictData.syncStatus !== 'conflict') {
        throw new AppError('Data is not in conflict state', 400);
      }

      let resolvedData: any;
      
      switch (request.resolution) {
        case 'server_wins':
          // Keep the current server data
          resolvedData = conflictData.data;
          break;
        
        case 'client_wins':
          // Use client data (this should be provided in the request)
          if (!request.mergedData) {
            throw new AppError('Client data required for client_wins resolution', 400);
          }
          resolvedData = request.mergedData;
          break;
        
        case 'merge':
          // Use merged data provided by client
          if (!request.mergedData) {
            throw new AppError('Merged data required for merge resolution', 400);
          }
          resolvedData = request.mergedData;
          break;
        
        default:
          throw new AppError('Invalid conflict resolution strategy', 400);
      }

      const updatedSyncData = await this.syncRepository.updateSyncData(request.conflictId, {
        data: resolvedData,
        syncStatus: 'synced',
        conflictResolution: request.resolution,
        version: conflictData.version + 1,
        lastModified: new Date(),
      });

      // Notify other devices about conflict resolution
      if (this.websocketService) {
        this.websocketService.broadcastSyncUpdate(userId, {
          dataType: updatedSyncData.dataType,
          version: updatedSyncData.version,
          lastModified: updatedSyncData.lastModified,
          conflictResolved: true,
        }, updatedSyncData.deviceId);
      }

      this.logger.info('Conflict resolved successfully', { 
        userId, 
        conflictId: request.conflictId,
        resolution: request.resolution 
      });

      return updatedSyncData;
    } catch (error) {
      this.logger.error('Failed to resolve conflict', error, { 
        userId, 
        conflictId: request.conflictId 
      });
      throw error;
    }
  }

  async getConflicts(userId: string): Promise<SyncData[]> {
    try {
      return await this.syncRepository.getConflictedSyncData(userId);
    } catch (error) {
      this.logger.error('Failed to get conflicts', error, { userId });
      throw error;
    }
  }

  async storeOfflineData(userId: string, deviceId: string, operations: Omit<OfflineData, 'id' | 'userId' | 'deviceId' | 'synced'>[]): Promise<OfflineData[]> {
    try {
      this.logger.info('Storing offline data', { 
        userId, 
        deviceId, 
        operationCount: operations.length 
      });

      const offlineDataList: OfflineData[] = [];

      for (const operation of operations) {
        const offlineData = await this.syncRepository.createOfflineData({
          userId,
          deviceId,
          ...operation,
          synced: false,
        });
        offlineDataList.push(offlineData);
      }

      this.logger.info('Offline data stored successfully', { 
        userId, 
        deviceId, 
        storedCount: offlineDataList.length 
      });

      return offlineDataList;
    } catch (error) {
      this.logger.error('Failed to store offline data', error, { userId, deviceId });
      throw error;
    }
  }

  async syncOfflineData(userId: string, deviceId: string): Promise<SyncResponse> {
    try {
      this.logger.info('Syncing offline data', { userId, deviceId });

      const offlineData = await this.syncRepository.getDeviceOfflineData(deviceId, false);
      
      if (offlineData.length === 0) {
        return {
          success: true,
          message: 'No offline data to sync',
        };
      }

      const syncRequests: SyncRequest[] = offlineData.map(data => ({
        deviceId,
        dataType: data.dataType as 'progress' | 'preferences' | 'content' | 'companion' | 'assessment',
        data: data.data,
        version: 1, // Offline data starts at version 1
        lastModified: data.timestamp,
      }));

      const syncResponse = await this.syncData(userId, syncRequests);

      // Mark offline data as synced
      for (const data of offlineData) {
        try {
          await this.syncRepository.markOfflineDataSynced(data.id);
        } catch (error) {
          this.logger.error('Failed to mark offline data as synced', error, { 
            offlineDataId: data.id 
          });
        }
      }

      this.logger.info('Offline data sync completed', { 
        userId, 
        deviceId, 
        processedCount: offlineData.length 
      });

      return syncResponse;
    } catch (error) {
      this.logger.error('Failed to sync offline data', error, { userId, deviceId });
      throw error;
    }
  }

  private async processSyncRequest(userId: string, request: SyncRequest): Promise<{
    syncData?: SyncData;
    conflict?: SyncConflict;
  }> {
    // Check if there's existing sync data for this data type and device
    const existingSyncData = await this.syncRepository.getDeviceSyncData(
      request.deviceId, 
      request.dataType
    );

    const latestData = existingSyncData
      .filter(data => data.dataType === request.dataType)
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())[0];

    if (!latestData) {
      // No existing data, create new sync data
      const syncData = await this.syncRepository.createSyncData({
        userId,
        deviceId: request.deviceId,
        dataType: request.dataType,
        data: request.data,
        version: request.version,
        lastModified: request.lastModified,
        syncStatus: 'synced',
      });

      return { syncData };
    }

    // Check for conflicts
    const serverModified = new Date(latestData.lastModified);
    const clientModified = new Date(request.lastModified);

    if (latestData.version >= request.version && serverModified > clientModified) {
      // Server data is newer, create conflict
      const conflict: SyncConflict = {
        id: latestData.id,
        userId,
        dataType: request.dataType,
        serverData: latestData.data,
        clientData: request.data,
        serverVersion: latestData.version,
        clientVersion: request.version,
        conflictedAt: new Date(),
      };

      // Update sync data to conflict status
      await this.syncRepository.updateSyncData(latestData.id, {
        syncStatus: 'conflict',
      });

      return { conflict };
    }

    // Client data is newer or same, update existing data
    const updatedSyncData = await this.syncRepository.updateSyncData(latestData.id, {
      data: request.data,
      version: Math.max(latestData.version, request.version) + 1,
      lastModified: new Date(),
      syncStatus: 'synced',
    });

    return { syncData: updatedSyncData };
  }

  async cleanupOldData(olderThanDays: number = 30): Promise<{ syncDataCleaned: number; offlineDataCleaned: number }> {
    try {
      this.logger.info('Starting cleanup of old sync data', { olderThanDays });

      const syncDataCleaned = await this.syncRepository.cleanupOldSyncData(olderThanDays);
      
      // For offline data, we might want to be more aggressive
      // const offlineDataCleaned = await this.syncRepository.cleanupOldOfflineData(7);
      const offlineDataCleaned = 0; // Placeholder

      this.logger.info('Cleanup completed', { 
        syncDataCleaned, 
        offlineDataCleaned 
      });

      return { syncDataCleaned, offlineDataCleaned };
    } catch (error) {
      this.logger.error('Failed to cleanup old data', error);
      throw error;
    }
  }
}