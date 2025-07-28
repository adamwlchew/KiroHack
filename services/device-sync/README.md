# Device Sync Service

The Device Sync Service manages device registration, authentication, and cross-device synchronization for the PageFlow AI Learning Platform.

## Features

### Device Registration and Management
- Register new devices with comprehensive metadata
- Manage device capabilities and platform-specific features
- Device authentication with JWT tokens
- Device lifecycle management (activate/deactivate/delete)

### Device Authentication
- JWT-based device authentication
- Token refresh capabilities
- Device-specific security tokens
- Integration with user authentication

### Cross-Device Synchronization
- Real-time data synchronization across devices
- Conflict resolution strategies
- Offline data storage and reconciliation

### Real-Time Updates with WebSockets
- WebSocket connections for real-time communication
- Device status notifications
- Sync update broadcasting
- Connection recovery mechanisms

## API Endpoints

### Device Management

#### Register Device
```
POST /api/devices/register
Authorization: Bearer <user-token>
```

Request body:
```json
{
  "deviceType": "web|mobile|ar|vr",
  "platform": "ios|android|windows|macos|linux|web",
  "deviceName": "My Device",
  "deviceModel": "iPhone 14",
  "osVersion": "16.0",
  "appVersion": "1.0.0",
  "capabilities": {
    "hasCamera": true,
    "hasAR": true,
    "hasVR": false,
    "hasGPS": true,
    "hasAccelerometer": true,
    "hasGyroscope": true,
    "hasTouchScreen": true,
    "hasKeyboard": false,
    "hasMicrophone": true,
    "hasSpeakers": true,
    "supportsOffline": true,
    "maxStorageSize": 100
  },
  "metadata": {
    "screenResolution": {
      "width": 1920,
      "height": 1080
    },
    "screenDensity": 2.0,
    "batteryLevel": 85,
    "networkType": "wifi",
    "timezone": "America/New_York",
    "locale": "en-US",
    "userAgent": "Mozilla/5.0..."
  }
}
```

#### Get User Devices
```
GET /api/devices/user?active=true
Authorization: Bearer <user-token>
```

#### Get Device
```
GET /api/devices/:deviceId
Authorization: Bearer <user-token>
```

#### Update Device
```
PUT /api/devices/:deviceId
Authorization: Bearer <user-token>
```

#### Activate/Deactivate Device
```
POST /api/devices/:deviceId/activate
POST /api/devices/:deviceId/deactivate
Authorization: Bearer <user-token>
```

#### Delete Device
```
DELETE /api/devices/:deviceId
Authorization: Bearer <user-token>
```

### Device Authentication

#### Refresh Device Token
```
POST /api/devices/token/refresh
Authorization: Bearer <device-token>
```

### Synchronization

#### Sync Data
```
POST /api/sync/sync
Authorization: Bearer <device-token>
```

Request body:
```json
{
  "requests": [
    {
      "deviceId": "device-uuid",
      "dataType": "progress",
      "data": { "progress": 75 },
      "version": 1,
      "lastModified": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get User Sync Data
```
GET /api/sync/data?dataType=progress&deviceId=device-uuid
Authorization: Bearer <user-token>
```

#### Get Conflicts
```
GET /api/sync/conflicts
Authorization: Bearer <user-token>
```

#### Resolve Conflict
```
POST /api/sync/conflicts/resolve
Authorization: Bearer <user-token>
```

Request body:
```json
{
  "conflictId": "conflict-uuid",
  "resolution": "server_wins|client_wins|merge",
  "mergedData": { "merged": "data" }
}
```

#### Store Offline Data
```
POST /api/sync/offline
Authorization: Bearer <device-token>
```

#### Sync Offline Data
```
POST /api/sync/offline/sync
Authorization: Bearer <device-token>
```

### WebSocket

#### Connection
```
ws://localhost:3007?token=<device-token>
```

#### WebSocket Messages

**Ping/Pong**
```json
{ "type": "ping", "timestamp": "2024-01-01T00:00:00Z" }
{ "type": "pong", "timestamp": "2024-01-01T00:00:00Z" }
```

**Sync Update**
```json
{
  "type": "sync_update",
  "data": {
    "dataType": "progress",
    "version": 2,
    "lastModified": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Conflict Notification**
```json
{
  "type": "conflict_notification",
  "data": {
    "conflictId": "conflict-uuid",
    "dataType": "progress",
    "conflictedAt": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### WebSocket Management

**Get Connection Stats**
```
GET /api/websocket/stats
Authorization: Bearer <user-token>
```

**Check Device Connection**
```
GET /api/websocket/devices/:deviceId/connection
Authorization: Bearer <user-token>
```

**Get User Connected Devices**
```
GET /api/websocket/user/devices
Authorization: Bearer <user-token>
```

## Environment Variables

```bash
# Server Configuration
PORT=3006
NODE_ENV=development

# AWS Configuration
AWS_REGION=us-east-1
DEVICES_TABLE=pageflow-devices
SYNC_DATA_TABLE=pageflow-sync-data
OFFLINE_DATA_TABLE=pageflow-offline-data

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=device-sync-secret
JWT_EXPIRES_IN=7d

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# WebSocket Configuration
WS_PORT=3007

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://app.pageflow.com
```

## Database Schema

### DynamoDB Tables

#### Devices Table
- **Primary Key**: `id` (String)
- **GSI**: `userId` (String)
- **Attributes**: All device properties as defined in the Device interface

#### Sync Data Table (Future)
- **Primary Key**: `id` (String)
- **GSI**: `userId`, `deviceId`
- **Attributes**: Synchronization data and metadata

#### Offline Data Table (Future)
- **Primary Key**: `id` (String)
- **GSI**: `userId`, `deviceId`
- **Attributes**: Offline operation queue

## Development

### Setup
```bash
npm install
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Building
```bash
npm run build
npm start
```

## Device Types and Capabilities

### Web Devices
- Platform: web
- Required capabilities: keyboard, speakers
- Optional: camera, microphone

### Mobile Devices
- Platform: ios, android
- Required capabilities: touchScreen, speakers
- Optional: camera, GPS, accelerometer, gyroscope, AR

### AR Devices
- Platform: ios, android
- Required capabilities: camera, AR, touchScreen, accelerometer, gyroscope
- Optional: GPS

### VR Devices
- Platform: windows, macos, linux
- Required capabilities: VR, speakers
- Optional: camera, microphone

## Security Considerations

- Device tokens are JWT-based with expiration
- Device registration requires user authentication
- Device capabilities are validated based on device type
- IP addresses are logged for security auditing
- Maximum device limit per user (configurable)
- Inactive device cleanup process

## Monitoring and Logging

The service includes comprehensive logging for:
- Device registration and management operations
- Authentication attempts and failures
- Error conditions and debugging information
- Performance metrics and usage patterns

## Future Enhancements

- Real-time synchronization implementation
- Conflict resolution strategies
- Offline data reconciliation
- Device usage analytics
- Advanced security features