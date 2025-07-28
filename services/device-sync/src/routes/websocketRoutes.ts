import { Router } from 'express';
import { WebSocketController } from '../controllers/websocketController';
import { authMiddleware } from '../middleware/authMiddleware';
import { WebSocketService } from '../services/websocketService';

const createWebSocketRoutes = (websocketService: WebSocketService): Router => {
  const router = Router();
  const websocketController = new WebSocketController(websocketService);

  // WebSocket management endpoints (require user authentication)
  router.get('/stats', authMiddleware, websocketController.getConnectionStats);
  router.get('/devices/:deviceId/connection', authMiddleware, websocketController.checkDeviceConnection);
  router.get('/user/devices', authMiddleware, websocketController.getUserConnectedDevices);

  // Broadcasting endpoints (require user authentication)
  router.post('/broadcast/sync', authMiddleware, websocketController.broadcastSyncUpdate);
  router.post('/broadcast/conflict', authMiddleware, websocketController.notifyConflict);
  router.post('/devices/:deviceId/notify', authMiddleware, websocketController.notifyDeviceStatus);

  return router;
};

export default createWebSocketRoutes;