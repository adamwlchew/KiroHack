import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';

const router = Router();

// Content Recommendations
router.get('/content/:userId', RecommendationController.getContentRecommendations);
router.post('/content/:userId/feedback', RecommendationController.submitContentFeedback);
router.get('/content/:userId/similar', RecommendationController.getSimilarContent);

// Learning Path Recommendations
router.get('/paths/:userId', RecommendationController.getLearningPathRecommendations);
router.post('/paths/:userId/preferences', RecommendationController.updateLearningPreferences);
router.get('/paths/:userId/next-steps', RecommendationController.getNextStepsRecommendations);

// Collaborative Filtering
router.get('/collaborative/:userId', RecommendationController.getCollaborativeRecommendations);
router.post('/collaborative/:userId/rating', RecommendationController.submitRating);

// Trending and Popular
router.get('/trending', RecommendationController.getTrendingContent);
router.get('/popular', RecommendationController.getPopularContent);
router.get('/new', RecommendationController.getNewContent);

export { router as recommendationRoutes }; 