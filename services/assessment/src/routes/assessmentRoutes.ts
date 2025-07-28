import { Router } from 'express';
import { assessmentController } from '../controllers/assessmentController';

const router = Router();

// Assessment CRUD operations
router.get('/', assessmentController.getAllAssessments);
router.get('/:id', assessmentController.getAssessmentById);
router.post('/', assessmentController.createAssessment);
router.put('/:id', assessmentController.updateAssessment);
router.delete('/:id', assessmentController.deleteAssessment);

// Quiz-specific operations
router.get('/:id/questions', assessmentController.getAssessmentQuestions);
router.post('/:id/submit', assessmentController.submitAssessment);
router.get('/:id/results/:userId', assessmentController.getAssessmentResults);

// Analytics and reporting
router.get('/:id/analytics', assessmentController.getAssessmentAnalytics);
router.get('/user/:userId/assessments', assessmentController.getUserAssessments);

export { router as assessmentRoutes }; 