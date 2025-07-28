import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// Service routing
router.use('/api/users', authMiddleware, (req, res) => {
  // Route to user service
  res.json({ message: 'User service endpoint' });
});

router.use('/api/progress', authMiddleware, (req, res) => {
  // Route to progress service
  res.json({ message: 'Progress service endpoint' });
});

router.use('/api/assessments', authMiddleware, (req, res) => {
  // Route to assessment service
  res.json({ message: 'Assessment service endpoint' });
});

router.use('/api/learning-paths', authMiddleware, (req, res) => {
  // Route to learning path service
  res.json({ message: 'Learning path service endpoint' });
});

router.use('/api/companions', authMiddleware, (req, res) => {
  // Route to page companion service
  res.json({ message: 'Page companion service endpoint' });
});

router.use('/api/bedrock', authMiddleware, (req, res) => {
  // Route to bedrock service
  res.json({ message: 'Bedrock service endpoint' });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
    },
  });
});

export default router; 