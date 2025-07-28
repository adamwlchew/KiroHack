import { Router } from 'express';
import { AccessibilityController } from '../controllers/accessibilityController';
import { authMiddleware } from '../middleware/authMiddleware';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';

const router = Router();
const accessibilityController = new AccessibilityController();

// All accessibility routes require authentication
router.use(authMiddleware);

// Accessibility profile routes
router.get('/profile', accessibilityController.getAccessibilityProfile);
router.put('/settings', rateLimitMiddleware, accessibilityController.updateAccessibilitySettings);

// Reading level detection and management
router.post('/reading-level/detect', rateLimitMiddleware, accessibilityController.detectReadingLevel);
router.put('/reading-level', rateLimitMiddleware, accessibilityController.updateReadingLevel);

// Alternative input configuration
router.post('/alternative-input/configure', rateLimitMiddleware, accessibilityController.configureAlternativeInput);

// Assistive technology detection
router.post('/assistive-technologies/detect', rateLimitMiddleware, accessibilityController.detectAssistiveTechnologies);

// Accessibility recommendations
router.get('/recommendations', accessibilityController.getAccessibilityRecommendations);

// Quick accessibility toggles
router.post('/screen-reader/enable', rateLimitMiddleware, accessibilityController.enableScreenReader);
router.post('/high-contrast/enable', rateLimitMiddleware, accessibilityController.enableHighContrast);
router.post('/reduced-motion/enable', rateLimitMiddleware, accessibilityController.enableReducedMotion);

// Font size management
router.put('/font-size', rateLimitMiddleware, accessibilityController.updateFontSize);

export default router;