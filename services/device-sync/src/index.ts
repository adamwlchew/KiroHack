import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from '@pageflow/utils';
import deviceRoutes from './routes/deviceRoutes';
import createSyncRoutes from './routes/syncRoutes';
import createWebSocketRoutes from './routes/websocketRoutes';
import { WebSocketService } from './services/websocketService';

const app = express();
const serviceLogger = logger.child({ component: 'DeviceSyncService' });

// Initialize WebSocket service
const websocketService = new WebSocketService();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'device-sync-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/devices', deviceRoutes);
app.use('/api/sync', createSyncRoutes(websocketService));
app.use('/api/websocket', createWebSocketRoutes(websocketService));

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  serviceLogger.error({ message: 'Unhandled error', error: error.message });
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Start server
const port = config.port;
app.listen(port, () => {
  serviceLogger.info({ message: `Device Sync Service started on port ${port}` });
  serviceLogger.info({ message: 'Environment', environment: config.nodeEnv });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  websocketService.shutdown();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  websocketService.shutdown();
  process.exit(0);
});

export default app;