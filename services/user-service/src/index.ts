import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler, logger } from '@pageflow/utils';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import accessibilityRoutes from './routes/accessibilityRoutes';

const app = express();
const serviceLogger = logger.child({ component: 'UserService' });

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accessibility', accessibilityRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  serviceLogger.info({
    message: `User service started on port ${config.port}`,
    environment: config.nodeEnv,
    port: config.port,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  serviceLogger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    serviceLogger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  serviceLogger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    serviceLogger.info('Process terminated');
    process.exit(0);
  });
});

export default app;