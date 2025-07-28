import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@pageflow/utils';
import { assessmentRoutes } from './routes/assessmentRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'assessment-service' });
});

// Routes
app.use('/api/assessments', assessmentRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Assessment service running on port ${PORT}`);
});

export default app; 