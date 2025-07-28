import { Router } from 'express';
import { SyncController } from '../controllers/syncController';
import { authMiddleware } from '../middleware/authMiddleware';
import { deviceAuthMiddleware } from '../middleware/deviceAuthMiddleware';
import { WebSocketService } from '../services/websocketService';

const createSyncRoutes = (websocketService?: WebSocketService): Router => {
  const router = Router();
  const syncController = new SyncController(websocketService);

  // Sync operations (require device authentication)
  router.post('/sync', deviceAuthMiddleware, syncController.syncData);
  router.post('/offline', deviceAuthMiddleware, syncController.storeOfflineData);
  router.post('/offline/sync', deviceAuthMiddleware, syncController.syncOfflineData);

  // Data retrieval (require user authentication)
  router.get('/data', authMiddleware, syncController.getUserSyncData);
  router.get('/conflicts', authMiddleware, syncController.getConflicts);
  router.post('/conflicts/resolve', authMiddleware, syncController.resolveConflict);

  return router;
};

export default createSyncRoutes;