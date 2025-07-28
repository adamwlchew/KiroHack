import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { logger, errorHandler } from '@pageflow/utils';
import { ProgressService } from './services/progressService';
import { ProgressController } from './controllers/progressController';
import { createProgressRoutes } from './routes/progressRoutes';
import progressServiceConfig from './config';

const appLogger = logger.child({ service: 'ProgressServiceApp' });

async function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors(progressServiceConfig.cors));
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit(progressServiceConfig.rateLimit);
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'progress-service',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Initialize AWS DynamoDB client
  const dynamoDbClient = new DynamoDBClient({
    region: progressServiceConfig.aws.region,
    ...(progressServiceConfig.aws.endpoint && {
      endpoint: progressServiceConfig.aws.endpoint
    })
  });

  // Initialize services
  const progressService = new ProgressService(dynamoDbClient);
  const progressController = new ProgressController(progressService);

  // Routes
  app.use('/api/progress', createProgressRoutes(progressController));

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });
  });

  return app;
}

async function startServer() {
  try {
    const app = await createApp();
    
    const server = app.listen(progressServiceConfig.port, () => {
      appLogger.info(`Progress service started on port ${progressServiceConfig.port}`);

    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      appLogger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        appLogger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      appLogger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        appLogger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    appLogger.error('Failed to start server');
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };