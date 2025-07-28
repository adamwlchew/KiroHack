import { Router } from 'express';
import { PersonalizationController } from '../controllers/personalizationController';

const router = Router();

// Learning Style Detection
router.post('/learning-style/:userId', PersonalizationController.detectLearningStyle);
router.get('/learning-style/:userId', PersonalizationController.getLearningStyle);
router.put('/learning-style/:userId', PersonalizationController.updateLearningStyle);

// Learning Preferences
router.get('/preferences/:userId', PersonalizationController.getLearningPreferences);
router.put('/preferences/:userId', PersonalizationController.updateLearningPreferences);
router.post('/preferences/:userId/assessment', PersonalizationController.assessLearningPreferences);

// Adaptive Learning
router.post('/adaptive/:userId', PersonalizationController.createAdaptiveProfile);
router.get('/adaptive/:userId', PersonalizationController.getAdaptiveProfile);
router.put('/adaptive/:userId', PersonalizationController.updateAdaptiveProfile);

// Difficulty Adjustment
router.post('/difficulty/:userId', PersonalizationController.adjustDifficulty);
router.get('/difficulty/:userId', PersonalizationController.getDifficultyLevel);
router.put('/difficulty/:userId', PersonalizationController.updateDifficultyLevel);

// Learning Goals
router.get('/goals/:userId', PersonalizationController.getLearningGoals);
router.post('/goals/:userId', PersonalizationController.setLearningGoals);
router.put('/goals/:userId', PersonalizationController.updateLearningGoals);

export { router as personalizationRoutes }; 