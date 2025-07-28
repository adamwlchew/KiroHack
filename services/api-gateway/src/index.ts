import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from '@pageflow/utils';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import config from './config';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/authMiddleware';
import { validateRequest } from './middleware/requestValidator';

// Create Express application
const app = express();

// Apply global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(config.cors));
app.use(helmet());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(rateLimiter);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply routes with authentication middleware
app.use('/api', authMiddleware, routes);

// Apply error handling middleware
app.use(errorHandler);

// Start the server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  logger.info(`API Gateway service running on port ${PORT}`);
});

export default app;