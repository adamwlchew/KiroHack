import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post('/register', rateLimitMiddleware, authController.register);
router.post('/confirm-signup', rateLimitMiddleware, authController.confirmSignUp);
router.post('/signin', rateLimitMiddleware, authController.signIn);
router.post('/refresh-token', rateLimitMiddleware, authController.refreshToken);
router.post('/forgot-password', rateLimitMiddleware, authController.forgotPassword);
router.post('/confirm-forgot-password', rateLimitMiddleware, authController.confirmForgotPassword);
router.post('/verify-mfa', rateLimitMiddleware, authController.verifyMFA);

// Protected routes
router.post('/signout', authMiddleware, authController.signOut);
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/setup-mfa', authMiddleware, authController.setupMFA);

export default router;