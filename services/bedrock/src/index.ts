import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@pageflow/utils';
import { textGenerationRoutes } from './routes/textGenerationRoutes';
import { embeddingRoutes } from './routes/embeddingRoutes';
import { imageGenerationRoutes } from './routes/imageGenerationRoutes';
import { costMonitor } from './services/costMonitor';
import { config } from './config';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    message: 'Incoming request',
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });
  next();
});

// Routes
app.use('/api/text-generation', textGenerationRoutes);
app.use('/api/embeddings', embeddingRoutes);
app.use('/api/images', imageGenerationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const costSummary = costMonitor.getCostSummary();
  const limits = costMonitor.isWithinLimits();
  
  res.status(200).json({
    success: true,
    status: 'healthy',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    services: {
      bedrock: {
        status: 'up',
        region: config.region,
      },
      costMonitoring: {
        status: 'up',
        dailyCost: costSummary.dailyCost,
        monthlyCost: costSummary.monthlyCost,
        withinLimits: limits,
      },
    },
  });
});

// Cost monitoring endpoint
app.get('/api/cost', (req, res) => {
  try {
    const summary = costMonitor.getCostSummary();
    const limits = costMonitor.isWithinLimits();
    const budget = costMonitor.getRemainingBudget();
    
    res.json({
      success: true,
      data: {
        summary,
        limits,
        budget,
        trends: costMonitor.getCostTrends(7), // Last 7 days
      },
    });
  } catch (error) {
    logger.error({
      message: 'Cost endpoint error',
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      error: 'Failed to retrieve cost information',
      code: 'COST_ERROR',
    });
  }
});

// Global error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
    message: 'Unhandled error',
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.headers['x-request-id'] || 'unknown',
  });
});

// Set up cost monitoring alerts
costMonitor.onAlert((alert) => {
  logger.warn({
    message: 'Cost alert received',
    type: alert.type,
    threshold: alert.threshold,
    currentAmount: alert.currentAmount,
    percentage: alert.percentage,
  });
  
  // Here you could integrate with notification services
  // like SNS, Slack, email, etc.
});

// Start server
app.listen(port, () => {
  logger.info({
    message: 'Bedrock service started',
    port,
    environment: process.env.NODE_ENV || 'development',
    region: config.region,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info({ message: 'SIGTERM received, shutting down gracefully' });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info({ message: 'SIGINT received, shutting down gracefully' });
  process.exit(0);
});

export default app;