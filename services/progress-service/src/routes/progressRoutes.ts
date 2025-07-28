import { Router } from 'express';
import { ProgressController } from '../controllers/progressController';

export function createProgressRoutes(progressController: ProgressController): Router {
  const router = Router();

  // Progress routes
  router.get('/users/:userId/paths/:pathId', progressController.getProgress);
  router.get('/users/:userId', progressController.getUserProgress);
  router.put('/users/:userId/paths/:pathId', progressController.updateProgress);

  // Milestone routes
  router.get('/users/:userId/milestones', progressController.getUserMilestones);
  router.put('/users/:userId/milestones/:milestoneId/celebration', progressController.markMilestoneCelebrationShown);

  // Achievement routes
  router.get('/users/:userId/achievements', progressController.getUserAchievements);
  router.get('/users/:userId/achievements/recent', progressController.getRecentAchievements);
  router.put('/users/:userId/achievements/:achievementId/celebration', progressController.markAchievementCelebrationShown);

  // Celebration routes
  router.get('/users/:userId/celebrations/recent', progressController.getRecentCelebrations);

  // Reporting routes
  router.get('/users/:userId/paths/:pathId/visualization', progressController.generateProgressVisualization);
  router.get('/users/:userId/reports/comprehensive', progressController.generateComprehensiveReport);
  router.get('/users/:userId/analysis/strengths-improvements', progressController.detectStrengthsAndImprovements);

  // Monitoring and intervention routes
  router.get('/users/:userId/monitoring/alerts', progressController.monitorUserProgress);
  router.post('/users/:userId/paths/:pathId/alternative-approaches', progressController.generateAlternativeLearningApproaches);
  router.get('/users/:userId/monitoring/comprehensive', progressController.performComprehensiveMonitoring);

  return router;
}