import { ProgressReportingService } from '../services/progressReportingService';
import { ProgressRepository } from '../repositories/progressRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { AchievementRepository } from '../repositories/achievementRepository';
import { Progress, ProgressStatus, ReportType } from '@pageflow/types';

// Mock the repositories
jest.mock('../repositories/progressRepository');
jest.mock('../repositories/milestoneRepository');
jest.mock('../repositories/achievementRepository');

describe('ProgressReportingService', () => {
  let progressReportingService: ProgressReportingService;
  let mockProgressRepository: jest.Mocked<ProgressRepository>;
  let mockMilestoneRepository: jest.Mocked<MilestoneRepository>;
  let mockAchievementRepository: jest.Mocked<AchievementRepository>;

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
          timeSpent: 150
        }],
        completion: 50,
        startedAt: new Date()
      }],
      completion: 50,
      startedAt: new Date()
    }],
    overallCompletion: 50,
    startedAt: new Date(),
    lastAccessedAt: new Date().toISOString(),
    deviceSyncStatus: {
      lastSyncedAt: new Date(),
      syncedDevices: ['device1'],
      pendingSync: false
    }
  };

  beforeEach(() => {
    mockProgressRepository = {} as jest.Mocked<ProgressRepository>;
    mockMilestoneRepository = {} as jest.Mocked<MilestoneRepository>;
    mockAchievementRepository = {} as jest.Mocked<AchievementRepository>;

    mockProgressRepository.getProgress = jest.fn();
    mockProgressRepository.getUserProgress = jest.fn();
    mockMilestoneRepository.getUserMilestones = jest.fn();
    mockAchievementRepository.getUserAchievements = jest.fn();

    progressReportingService = new ProgressReportingService(
      mockProgressRepository,
      mockMilestoneRepository,
      mockAchievementRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateProgressVisualization', () => {
    it('should generate progress visualization data', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(mockProgress);

      const result = await progressReportingService.generateProgressVisualization(
        'user1',
        'path1',
        30
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe('user1');
      expect(result.pathId).toBe('path1');
      expect(result.completionOverTime).toBeDefined();
      expect(result.moduleBreakdown).toBeDefined();
      expect(result.learningVelocity).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
      expect(result.strengthsAndWeaknesses).toBeDefined();

      expect(mockProgressRepository.getProgress).toHaveBeenCalledWith('user1', 'path1');
    });

    it('should throw error if progress not found', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(null);

      await expect(
        progressReportingService.generateProgressVisualization('user1', 'path1', 30)
      ).rejects.toThrow('Progress not found');
    });
  });

  describe('generateComprehensiveReport', () => {
    it('should generate comprehensive analysis report', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(mockProgress);
      mockMilestoneRepository.getUserMilestones.mockResolvedValue([]);
      mockAchievementRepository.getUserAchievements.mockResolvedValue([]);

      const result = await progressReportingService.generateComprehensiveReport(
        'user1',
        ReportType.WEEKLY,
        'path1'
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe('user1');
      expect(result.pathId).toBe('path1');
      expect(result.reportType).toBe(ReportType.WEEKLY);
      expect(result.summary).toBeDefined();
      expect(result.detailedMetrics).toBeDefined();
      expect(result.learningPatterns).toBeDefined();
      expect(result.progressTrends).toBeDefined();
      expect(result.recommendations).toBeDefined();

      expect(mockProgressRepository.getProgress).toHaveBeenCalledWith('user1', 'path1');
      expect(mockMilestoneRepository.getUserMilestones).toHaveBeenCalledWith('user1', 'path1');
      expect(mockAchievementRepository.getUserAchievements).toHaveBeenCalledWith('user1');
    });

    it('should generate report for all user progress when pathId not provided', async () => {
      mockProgressRepository.getUserProgress.mockResolvedValue({
        progress: [mockProgress],
        lastEvaluatedKey: undefined
      });
      mockMilestoneRepository.getUserMilestones.mockResolvedValue([]);
      mockAchievementRepository.getUserAchievements.mockResolvedValue([]);

      const result = await progressReportingService.generateComprehensiveReport(
        'user1',
        ReportType.MONTHLY
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe('user1');
      expect(result.pathId).toBeUndefined();
      expect(result.reportType).toBe(ReportType.MONTHLY);

      expect(mockProgressRepository.getUserProgress).toHaveBeenCalledWith({ userId: 'user1' });
    });
  });

  describe('detectStrengthsAndImprovements', () => {
    it('should detect strengths and improvement areas', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(mockProgress);

      const result = await progressReportingService.detectStrengthsAndImprovements(
        'user1',
        'path1'
      );

      expect(result).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.improvementAreas).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.improvementAreas)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);

      expect(mockProgressRepository.getProgress).toHaveBeenCalledWith('user1', 'path1');
    });

    it('should analyze multiple progress records when pathId not provided', async () => {
      const mockProgress2 = { ...mockProgress, pathId: 'path2', overallCompletion: 80 };
      
      mockProgressRepository.getUserProgress.mockResolvedValue({
        progress: [mockProgress, mockProgress2],
        lastEvaluatedKey: undefined
      });

      const result = await progressReportingService.detectStrengthsAndImprovements('user1');

      expect(result).toBeDefined();
      expect(mockProgressRepository.getUserProgress).toHaveBeenCalledWith({ userId: 'user1' });
    });
  });
});