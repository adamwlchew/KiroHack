import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, logger } from '@pageflow/utils';
import { learningPathRoutes } from './routes/learningPathRoutes';
import { recommendationRoutes } from './routes/recommendationRoutes';
import { personalizationRoutes } from './routes/personalizationRoutes';

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info({
    message: 'Incoming request',
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Routes
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/personalization', personalizationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'learning-path-service' });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const serviceLogger = logger.child({ component: 'LearningPathService' });

app.listen(PORT, () => {
  serviceLogger.info({
    message: 'Learning Path Service started',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

export default app; 