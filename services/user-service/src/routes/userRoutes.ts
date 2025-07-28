import { Router } from 'express';
import { UserProfileController, uploadMiddleware } from '../controllers/userProfileController';
import { authMiddleware } from '../middleware/authMiddleware';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';

const router = Router();
const userProfileController = new UserProfileController();

// All user profile routes require authentication
router.use(authMiddleware);

// Profile management routes
router.get('/profile', userProfileController.getProfile);
router.put('/profile', rateLimitMiddleware, userProfileController.updateProfile);
router.delete('/profile', rateLimitMiddleware, userProfileController.deleteProfile);

// Profile picture routes
router.post('/profile/picture', 
  rateLimitMiddleware, 
  uploadMiddleware.single('profilePicture'), 
  userProfileController.uploadProfilePicture
);
router.delete('/profile/picture', rateLimitMiddleware, userProfileController.deleteProfilePicture);
router.post('/profile/picture/upload-url', rateLimitMiddleware, userProfileController.getProfilePictureUploadUrl);

// Preferences and settings routes
router.put('/preferences', rateLimitMiddleware, userProfileController.updatePreferences);
router.put('/accessibility-settings', rateLimitMiddleware, userProfileController.updateAccessibilitySettings);

export default router;