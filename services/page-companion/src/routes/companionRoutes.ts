import { Router } from 'express';
import { CompanionController } from '../controllers/companionController';

const router = Router();

// Companion management routes
router.post('/companions', CompanionController.createCompanion);
router.post('/companions/:companionId/interact', CompanionController.handleInteraction);
router.put('/companions/:companionId/personality', CompanionController.updatePersonality);
router.put('/companions/:companionId/appearance', CompanionController.updateAppearance);
router.post('/companions/:companionId/status', CompanionController.getCompanionStatus);
router.post('/companions/:companionId/analyze', CompanionController.analyzeInteractionHistory);

// Knowledge base routes
router.post('/users/:userId/knowledge', CompanionController.addKnowledge);
router.post('/users/:userId/knowledge/query', CompanionController.queryKnowledge);
router.post('/users/:userId/knowledge/preferences', CompanionController.getLearningPreferences);

// Health check
router.get('/health', CompanionController.healthCheck);

export default router;