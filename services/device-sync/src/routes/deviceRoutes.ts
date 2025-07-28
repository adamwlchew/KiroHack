import { Router } from 'express';
import { DeviceController } from '../controllers/deviceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { deviceAuthMiddleware } from '../middleware/deviceAuthMiddleware';

const router = Router();
const deviceController = new DeviceController();

// Device registration (requires user authentication)
router.post('/register', authMiddleware, deviceController.registerDevice);

// Device management (requires user authentication)
router.get('/user', authMiddleware, deviceController.getUserDevices);
router.get('/:deviceId', authMiddleware, deviceController.getDevice);
router.put('/:deviceId', authMiddleware, deviceController.updateDevice);
router.post('/:deviceId/activate', authMiddleware, deviceController.activateDevice);
router.post('/:deviceId/deactivate', authMiddleware, deviceController.deactivateDevice);
router.delete('/:deviceId', authMiddleware, deviceController.deleteDevice);

// Device token management (requires device authentication)
router.post('/token/refresh', deviceAuthMiddleware, deviceController.refreshToken);

export default router;