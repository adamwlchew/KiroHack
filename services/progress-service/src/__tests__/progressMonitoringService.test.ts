import { ProgressMonitoringService } from '../services/progressMonitoringService';
import { ProgressRepository } from '../repositories/progressRepository';
import { Progress, ProgressStatus } from '@pageflow/types';

// Mock the progress repository
jest.mock('../repositories/progressRepository');

describe('ProgressMonitoringService', () => {
  let progressMonitoringService: ProgressMonitoringService;
  let mockProgressRepository: jest.Mocked<ProgressRepository>;

  const mockProgress: Progress = {
    userId: 'user1',
    pathId: 'path1',
    moduleProgress: [{
      moduleId: 'module1',
      unitProgress: [{
        unitId: 'unit1',
        contentProgress: [{
          contentItemId: 'content1',
          status: ProgressStatus.COMPLETED,
          timeSpent: 300,
          completedAt: new Date()
        }, {
          contentItemId: 'content2',
          status: ProgressStatus.IN_PROGRESS,
          timeSpent: 60 // Low engagement time
        }],
        completion: 50,
        startedAt: new Date()
      }],
      completion: 50,
      startedAt: new Date()
    }],
    overallCompletion: 50,
    startedAt: new Date(),
    lastAccessedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago - stagnation
    deviceSyncStatus: {
      lastSyncedAt: new Date(),
      syncedDevices: ['device1'],
      pendingSync: false
    }
  };

  beforeEach(() => {
    mockProgressRepository = {} as jest.Mocked<ProgressRepository>;
    mockProgressRepository.getProgress = jest.fn();
    mockProgressRepository.getUserProgress = jest.fn();

    progressMonitoringService = new ProgressMonitoringService(mockProgressRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('monitorUserProgress', () => {
    it('should detect stagnation when user has not accessed content for threshold days', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(mockProgress);

      const alerts = await progressMonitoringService.monitorUserProgress(
        'user1',
        'path1',
        { stagnationThresholdDays: 7 }
      );

      expect(alerts).toHaveLength(2); // Stagnation and low engagement
      
      const stagnationAlert = alerts.find(alert => alert.alertType === 'stagnation');
      expect(stagnationAlert).toBeDefined();
      expect(stagnationAlert?.severity).toBe('medium');
      expect(stagnationAlert?.description).toContain('8 days');
      expect(stagnationAlert?.suggestedInterventions).toBeDefined();
      expect(stagnationAlert?.suggestedInterventions.length).toBeGreaterThan(0);
    });

    it('should detect low engagement when average time per content is very low', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(mockProgress);

      const alerts = await progressMonitoringService.monitorUserProgress(
        'user1',
        'path1',
        { lowEngagementThreshold: 30 }
      );

      const engagementAlert = alerts.find(alert => alert.alertType === 'low_engagement');
      expect(engagementAlert).toBeDefined();
      expect(engagementAlert?.description).toContain('Low engagement detected');
      expect(engagementAlert?.suggestedInterventions).toBeDefined();
    });

    it('should detect regression in module progress', async () => {
      const regressedProgress = {
        ...mockProgress,
        moduleProgress: [
          {
            moduleId: 'module1',
            unitProgress: [{
              unitId: 'unit1',
              contentProgress: [{
                contentItemId: 'content1',
                status: ProgressStatus.IN_PROGRESS,
                timeSpent: 100
              }],
              completion: 30,
              startedAt: new Date()
            }],
            completion: 30, // Low completion suggesting regression
            startedAt: new Date()
          }
        ],
        lastAccessedAt: new Date() // Recent access to avoid stagnation alert
      };

      mockProgressRepository.getProgress.mockResolvedValue(regressedProgress);

      const alerts = await progressMonitoringService.monitorUserProgress('user1', 'path1');

      const regressionAlert = alerts.find(alert => alert.alertType === 'regression');
      expect(regressionAlert).toBeDefined();
      expect(regressionAlert?.description).toContain('regression detected');
    });

    it('should monitor multiple paths when pathId not provided', async () => {
      mockProgressRepository.getUserProgress.mockResolvedValue({
        progress: [mockProgress],
        lastEvaluatedKey: undefined
      });

      const alerts = await progressMonitoringService.monitorUserProgress('user1');

      expect(alerts.length).toBeGreaterThan(0);
      expect(mockProgressRepository.getUserProgress).toHaveBeenCalledWith({ userId: 'user1' });
    });

    it('should return empty array when no issues detected', async () => {
      const healthyProgress = {
        ...mockProgress,
        lastAccessedAt: new Date(), // Recent access
        moduleProgress: [{
          moduleId: 'module1',
          unitProgress: [{
            unitId: 'unit1',
            contentProgress: [{
              contentItemId: 'content1',
              status: ProgressStatus.COMPLETED,
              timeSpent: 600 // Good engagement time
            }],
            completion: 100,
            startedAt: new Date(),
            completedAt: new Date()
          }],
          completion: 100,
          startedAt: new Date(),
          completedAt: new Date()
        }],
        overallCompletion: 100
      };

      mockProgressRepository.getProgress.mockResolvedValue(healthyProgress);

      const alerts = await progressMonitoringService.monitorUserProgress('user1', 'path1');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('generateAlternativeLearningApproaches', () => {
    it('should generate alternative approaches for struggling areas', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(mockProgress);

      const approaches = await progressMonitoringService.generateAlternativeLearningApproaches(
        'user1',
        'path1',
        ['module1', 'module2']
      );

      expect(approaches).toBeDefined();
      expect(Array.isArray(approaches)).toBe(true);
      expect(approaches.length).toBeGreaterThan(0);
      
      approaches.forEach(approach => {
        expect(approach).toHaveProperty('id');
        expect(approach).toHaveProperty('name');
        expect(approach).toHaveProperty('description');
        expect(approach).toHaveProperty('contentType');
        expect(approach).toHaveProperty('difficulty');
        expect(approach).toHaveProperty('estimatedTime');
        expect(approach).toHaveProperty('benefits');
        expect(approach).toHaveProperty('suitableFor');
      });
    });

    it('should throw error when progress not found', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(null);

      await expect(
        progressMonitoringService.generateAlternativeLearningApproaches('user1', 'path1', ['module1'])
      ).rejects.toThrow('Progress not found');
    });
  });

  describe('createLearningInterventions', () => {
    it('should create interventions based on alerts', async () => {
      const alerts = [{
        userId: 'user1',
        pathId: 'path1',
        alertType: 'stagnation' as const,
        severity: 'medium' as const,
        detectedAt: new Date(),
        description: 'Test stagnation alert',
        affectedAreas: ['module1'],
        suggestedInterventions: [],
        metadata: {}
      }];

      const interventions = await progressMonitoringService.createLearningInterventions(alerts);

      expect(interventions).toBeDefined();
      expect(Array.isArray(interventions)).toBe(true);
      expect(interventions.length).toBeGreaterThan(0);

      interventions.forEach(intervention => {
        expect(intervention).toHaveProperty('id');
        expect(intervention).toHaveProperty('type');
        expect(intervention).toHaveProperty('title');
        expect(intervention).toHaveProperty('description');
        expect(intervention).toHaveProperty('priority');
        expect(intervention).toHaveProperty('estimatedImpact');
        expect(intervention).toHaveProperty('actionItems');
        expect(intervention).toHaveProperty('alternativeApproaches');
      });
    });

    it('should prioritize interventions by priority and impact', async () => {
      const alerts = [
        {
          userId: 'user1',
          pathId: 'path1',
          alertType: 'low_engagement' as const,
          severity: 'low' as const,
          detectedAt: new Date(),
          description: 'Low engagement alert',
          affectedAreas: ['module1'],
          suggestedInterventions: [],
          metadata: {}
        },
        {
          userId: 'user1',
          pathId: 'path1',
          alertType: 'stagnation' as const,
          severity: 'high' as const,
          detectedAt: new Date(),
          description: 'High severity stagnation alert',
          affectedAreas: ['module2'],
          suggestedInterventions: [],
          metadata: {}
        }
      ];

      const interventions = await progressMonitoringService.createLearningInterventions(alerts);

      expect(interventions.length).toBeGreaterThan(0);
      
      // Check that high priority interventions come first
      const priorities = interventions.map(i => i.priority);
      const highPriorityIndex = priorities.indexOf('high');
      const lowPriorityIndex = priorities.indexOf('low');
      
      if (highPriorityIndex !== -1 && lowPriorityIndex !== -1) {
        expect(highPriorityIndex).toBeLessThan(lowPriorityIndex);
      }
    });
  });
});