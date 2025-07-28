import { Router } from 'express';
import { LearningPathController } from '../controllers/learningPathController';

const router = Router();

// Learning Path Management
router.post('/', LearningPathController.createLearningPath);
router.get('/', LearningPathController.getAllLearningPaths);
router.get('/:id', LearningPathController.getLearningPathById);
router.put('/:id', LearningPathController.updateLearningPath);
router.delete('/:id', LearningPathController.deleteLearningPath);

// Learning Path Generation
router.post('/generate', LearningPathController.generatePersonalizedPath);
router.post('/:id/adapt', LearningPathController.adaptLearningPath);
router.post('/:id/optimize', LearningPathController.optimizeLearningPath);

// Learning Path Progress
router.get('/:id/progress/:userId', LearningPathController.getUserProgress);
router.post('/:id/progress/:userId', LearningPathController.updateUserProgress);
router.get('/:id/analytics', LearningPathController.getLearningPathAnalytics);

// Learning Path Content
router.get('/:id/modules', LearningPathController.getLearningPathModules);
router.post('/:id/modules', LearningPathController.addModuleToPath);
router.put('/:id/modules/:moduleId', LearningPathController.updateModuleInPath);
router.delete('/:id/modules/:moduleId', LearningPathController.removeModuleFromPath);

// Learning Path Recommendations
router.get('/:id/recommendations/:userId', LearningPathController.getPathRecommendations);
router.post('/:id/recommendations/:userId', LearningPathController.updateUserPreferences);

export { router as learningPathRoutes }; 