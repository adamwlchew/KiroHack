export const config = {
  port: process.env.PORT || 3006,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    dynamodb: {
      devicesTable: process.env.DEVICES_TABLE || 'pageflow-devices',
      syncDataTable: process.env.SYNC_DATA_TABLE || 'pageflow-sync-data',
      offlineDataTable: process.env.OFFLINE_DATA_TABLE || 'pageflow-offline-data',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'device-sync-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // WebSocket Configuration
  websocket: {
    port: process.env.WS_PORT || 3007,
    heartbeatInterval: 30000, // 30 seconds
    connectionTimeout: 60000, // 1 minute
  },

  // Sync Configuration
  sync: {
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    conflictResolutionTimeout: 300000, // 5 minutes
  },

  // Offline Configuration
  offline: {
    maxStorageSize: 100 * 1024 * 1024, // 100MB
    syncInterval: 30000, // 30 seconds
    maxOfflineTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};