import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { DeviceAuthService } from './deviceAuthService';
import { DeviceService } from './deviceService';
import { logger } from '@pageflow/utils';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export interface WebSocketConnection {
  id: string;
  socket: WebSocket;
  userId: string;
  deviceId: string;
  deviceType: string;
  platform: string;
  isAlive: boolean;
  lastPing: Date;
  connectedAt: Date;
}

export interface WebSocketMessage {
  type: 'ping' | 'pong' | 'sync_update' | 'conflict_notification' | 'device_status' | 'error';
  id?: string;
  data?: any;
  timestamp: Date;
}

export class WebSocketService {
  private server: WebSocket.Server;
  private connections: Map<string, WebSocketConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> connectionIds
  private deviceConnections: Map<string, string> = new Map(); // deviceId -> connectionId
  private deviceAuthService: DeviceAuthService;
  private deviceService: DeviceService;
  private logger: any;
  private heartbeatInterval!: NodeJS.Timeout;

  constructor() {
    this.deviceAuthService = new DeviceAuthService();
    this.deviceService = new DeviceService();
    this.logger = logger.child({ service: 'WebSocketService' });
    
    this.server = new WebSocket.Server({
      port: Number(config.websocket.port),
      verifyClient: this.verifyClient.bind(this),
    });

    this.setupEventHandlers();
    this.startHeartbeat();

    this.logger.info({ message: `WebSocket server started on port ${config.websocket.port}` });
  }

  private async verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): Promise<boolean> {
    try {
      const url = new URL(info.req.url || '', `ws://localhost:${config.websocket.port}`);
      const token = url.searchParams.get('token');

      if (!token) {
        this.logger.warn({ message: 'WebSocket connection rejected: No token provided' });
        return false;
      }

      // Verify device token
      const { device } = await this.deviceService.authenticateDevice(token);
      
      if (!device.isActive) {
        this.logger.warn({ message: 'WebSocket connection rejected: Device not active', deviceId: device.id });
        return false;
      }

      // Store device info for later use
      (info.req as any).deviceInfo = {
        userId: device.userId,
        deviceId: device.id,
        deviceType: device.deviceType,
        platform: device.platform,
      };

      return true;
    } catch (error) {
      this.logger.warn({ message: 'WebSocket connection rejected: Authentication failed', error });
      return false;
    }
  }

  private setupEventHandlers(): void {
    this.server.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      this.handleConnection(socket, request);
    });

    this.server.on('error', (error) => {
      this.logger.error({ message: 'WebSocket server error', error });
    });
  }

  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const deviceInfo = (request as any).deviceInfo;
    if (!deviceInfo) {
      socket.close(1008, 'Authentication failed');
      return;
    }

    const connectionId = uuidv4();
    const connection: WebSocketConnection = {
      id: connectionId,
      socket,
      userId: deviceInfo.userId,
      deviceId: deviceInfo.deviceId,
      deviceType: deviceInfo.deviceType,
      platform: deviceInfo.platform,
      isAlive: true,
      lastPing: new Date(),
      connectedAt: new Date(),
    };

    // Store connection
    this.connections.set(connectionId, connection);
    
    // Update user connections mapping
    if (!this.userConnections.has(deviceInfo.userId)) {
      this.userConnections.set(deviceInfo.userId, new Set());
    }
    this.userConnections.get(deviceInfo.userId)!.add(connectionId);
    
    // Update device connections mapping
    const existingDeviceConnection = this.deviceConnections.get(deviceInfo.deviceId);
    if (existingDeviceConnection) {
      // Close existing connection for this device
      this.closeConnection(existingDeviceConnection, 1000, 'New connection established');
    }
    this.deviceConnections.set(deviceInfo.deviceId, connectionId);

    this.logger.info({ message: 'WebSocket connection established', connectionId, userId: deviceInfo.userId, deviceId: deviceInfo.deviceId, deviceType: deviceInfo.deviceType });

    // Setup socket event handlers
    socket.on('message', (data) => {
      this.handleMessage(connectionId, data);
    });

    socket.on('pong', () => {
      this.handlePong(connectionId);
    });

    socket.on('close', (code, reason) => {
      this.handleDisconnection(connectionId, code, reason);
    });

    socket.on('error', (error) => {
      this.logger.error({ message: 'WebSocket connection error', error, connectionId });
      this.closeConnection(connectionId, 1011, 'Connection error');
    });

    // Send welcome message
    this.sendMessage(connectionId, {
      type: 'device_status',
      data: { status: 'connected', connectionId },
      timestamp: new Date(),
    });
  }

  private handleMessage(connectionId: string, data: WebSocket.Data): void {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return;
      }

      const message: WebSocketMessage = JSON.parse(data.toString());
      
      this.logger.debug({ message: 'WebSocket message received', connectionId, messageType: message.type, userId: connection.userId, deviceId: connection.deviceId });

      switch (message.type) {
        case 'ping':
          this.handlePing(connectionId);
          break;
        
        case 'sync_update':
          this.handleSyncUpdate(connectionId, message);
          break;
        
        default:
          this.logger.warn({ message: 'Unknown message type received', connectionId, messageType: message.type });
      }
    } catch (error) {
      this.logger.error({ message: 'Failed to handle WebSocket message', error, connectionId });
      this.sendError(connectionId, 'Invalid message format');
    }
  }

  private handlePing(connectionId: string): void {
    this.sendMessage(connectionId, {
      type: 'pong',
      timestamp: new Date(),
    });
  }

  private handlePong(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isAlive = true;
      connection.lastPing = new Date();
    }
  }

  private handleSyncUpdate(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    // Broadcast sync update to other devices of the same user
    this.broadcastToUserDevices(connection.userId, {
      type: 'sync_update',
      data: {
        sourceDeviceId: connection.deviceId,
        ...message.data,
      },
      timestamp: new Date(),
    }, connection.deviceId); // Exclude the sender device
  }

  private handleDisconnection(connectionId: string, code: number, reason: Buffer): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    this.logger.info({ message: 'WebSocket connection closed', connectionId, userId: connection.userId, deviceId: connection.deviceId, code, reason: reason.toString() });

    // Clean up connections
    this.connections.delete(connectionId);
    
    // Update user connections mapping
    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }
    
    // Update device connections mapping
    if (this.deviceConnections.get(connection.deviceId) === connectionId) {
      this.deviceConnections.delete(connection.deviceId);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((connection, connectionId) => {
        if (!connection.isAlive) {
          this.logger.info({ message: 'Terminating inactive WebSocket connection', connectionId, userId: connection.userId, deviceId: connection.deviceId });
          this.closeConnection(connectionId, 1000, 'Heartbeat timeout');
          return;
        }

        connection.isAlive = false;
        connection.socket.ping();
      });
    }, config.websocket.heartbeatInterval);
  }

  // Public methods for broadcasting messages

  public broadcastSyncUpdate(userId: string, data: any, excludeDeviceId?: string): void {
    this.broadcastToUserDevices(userId, {
      type: 'sync_update',
      data,
      timestamp: new Date(),
    }, excludeDeviceId);
  }

  public notifyConflict(userId: string, conflictData: any): void {
    this.broadcastToUserDevices(userId, {
      type: 'conflict_notification',
      data: conflictData,
      timestamp: new Date(),
    });
  }

  public notifyDeviceStatus(deviceId: string, status: any): void {
    const connectionId = this.deviceConnections.get(deviceId);
    if (connectionId) {
      this.sendMessage(connectionId, {
        type: 'device_status',
        data: status,
        timestamp: new Date(),
      });
    }
  }

  private broadcastToUserDevices(userId: string, message: WebSocketMessage, excludeDeviceId?: string): void {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) {
      return;
    }

    userConnections.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.deviceId !== excludeDeviceId) {
        this.sendMessage(connectionId, message);
      }
    });
  }

  private sendMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      connection.socket.send(JSON.stringify(message));
    } catch (error) {
      this.logger.error({ message: 'Failed to send WebSocket message', error, connectionId });
      this.closeConnection(connectionId, 1011, 'Send error');
    }
  }

  private sendError(connectionId: string, errorMessage: string): void {
    this.sendMessage(connectionId, {
      type: 'error',
      data: { message: errorMessage },
      timestamp: new Date(),
    });
  }

  private closeConnection(connectionId: string, code: number, reason: string): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.close(code, reason);
    }
    this.handleDisconnection(connectionId, code, Buffer.from(reason));
  }

  // Utility methods

  public getConnectionStats(): {
    totalConnections: number;
    activeUsers: number;
    connectedDevices: number;
    connectionsByDeviceType: Record<string, number>;
  } {
    const connectionsByDeviceType: Record<string, number> = {};
    
    this.connections.forEach(connection => {
      connectionsByDeviceType[connection.deviceType] = 
        (connectionsByDeviceType[connection.deviceType] || 0) + 1;
    });

    return {
      totalConnections: this.connections.size,
      activeUsers: this.userConnections.size,
      connectedDevices: this.deviceConnections.size,
      connectionsByDeviceType,
    };
  }

  public isDeviceConnected(deviceId: string): boolean {
    return this.deviceConnections.has(deviceId);
  }

  public getUserConnectedDevices(userId: string): string[] {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) {
      return [];
    }

    const deviceIds: string[] = [];
    userConnections.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection) {
        deviceIds.push(connection.deviceId);
      }
    });

    return deviceIds;
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.connections.forEach((connection, connectionId) => {
      this.closeConnection(connectionId, 1001, 'Server shutdown');
    });

    this.server.close(() => {
      this.logger.info({ message: 'WebSocket server shut down' });
    });
  }
}