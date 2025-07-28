import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ProgressService } from '../services/progressService';
import { ProgressRepository } from '../repositories/progressRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { AchievementRepository } from '../repositories/achievementRepository';
import { ProgressStatus } from '@pageflow/types';
import { ProgressUpdateRequest } from '../models/progress';

// Mock the repositories
jest.mock('../repositories/progressRepository');
jest.mock('../repositories/milestoneRepository');
jest.mock('../repositories/achievementRepository');

describe('ProgressService', () => {
  let progressService: ProgressService;
  let mockDynamoDbClient: jest.Mocked<DynamoDBClient>;
  let mockProgressRepository: jest.Mocked<ProgressRepository>;
  let mockMilestoneRepository: jest.Mocked<MilestoneRepository>;
  let mockAchievementRepository: jest.Mocked<AchievementRepository>;

  beforeEach(() => {
    mockDynamoDbClient = {} as jest.Mocked<DynamoDBClient>;
    mockProgressRepository = new ProgressRepository(mockDynamoDbClient, 'test-table') as jest.Mocked<ProgressRepository>;
    mockMilestoneRepository = new MilestoneRepository(mockDynamoDbClient, 'test-table') as jest.Mocked<MilestoneRepository>;
    mockAchievementRepository = new AchievementRepository(mockDynamoDbClient, 'test-table') as jest.Mocked<AchievementRepository>;
    
    progressService = new ProgressService(mockDynamoDbClient);
    
    // Replace the repositories with mocks
    (progressService as any).progressRepository = mockProgressRepository;
    (progressService as any).milestoneRepository = mockMilestoneRepository;
    (progressService as any).achievementRepository = mockAchievementRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProgress', () => {
    it('should return progress for a user and path', async () => {
      const mockProgress = {
        userId: 'user1',
        pathId: 'path1',
        moduleProgress: [],
        overallCompletion: 0,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        deviceSyncStatus: {
          lastSyncedAt: new Date(),
          syncedDevices: [],
          pendingSync: false
        }
      };

      mockProgressRepository.getProgress.mockResolvedValue(mockProgress);

      const result = await progressService.getProgress('user1', 'path1');

      expect(result).toEqual(mockProgress);
      expect(mockProgressRepository.getProgress).toHaveBeenCalledWith('user1', 'path1');
    });

    it('should return null if progress not found', async () => {
      mockProgressRepository.getProgress.mockResolvedValue(null);

      const result = await progressService.getProgress('user1', 'path1');

      expect(result).toBeNull();
    });
  });

  describe('updateProgress', () => {
    it('should update progress and detect milestones', async () => {
      const updateRequest: ProgressUpdateRequest = {
        userId: 'user1',
        pathId: 'path1',
        moduleId: 'module1',
        unitId: 'unit1',
        contentItemId: 'content1',
        status: ProgressStatus.COMPLETED,
        timeSpent: 300,
        deviceId: 'device1'
      };

      const mockUpdatedProgress = {
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
            }],
            completion: 100,
            startedAt: new Date(),
            completedAt: new Date()
          }],
          completion: 100,
          startedAt: new Date(),
          completedAt: new Date()
        }],
        overallCompletion: 100,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        completedAt: new Date(),
        deviceSyncStatus: {
          lastSyncedAt: new Date(),
          syncedDevices: ['device1'],
          pendingSync: false
        }
      };

      const mockMilestones = [{
        id: 'milestone1',
        userId: 'user1',
        pathId: 'path1',
        type: 'path_completed' as any,
        title: 'Path Completed',
        description: 'You completed the path!',
        criteria: { type: 'path_completed' as any, conditions: {} },
        achievedAt: new Date(),
        celebrationShown: false,
        metadata: {}
      }];

      const mockAchievements = [{
        id: 'achievement1',
        userId: 'user1',
        type: 'completion' as any,
        title: 'Path Champion',
        description: 'You completed a learning path!',
        iconUrl: '/icons/path-champion.svg',
        awardedAt: new Date(),
        celebrationShown: false,
        metadata: {}
      }];

      mockProgressRepository.getProgress.mockResolvedValue(null);
      mockProgressRepository.updateProgress.mockResolvedValue(mockUpdatedProgress);
      mockMilestoneRepository.createDefaultMilestones.mockResolvedValue([]);
      mockMilestoneRepository.getUserMilestones.mockResolvedValue([{
        id: 'milestone1',
        userId: 'user1',
        pathId: 'path1',
        type: 'path_completed' as any,
        title: 'Path Completed',
        description: 'You completed the path!',
        criteria: { type: 'path_completed' as any, conditions: {} },
        celebrationShown: false,
        metadata: {}
      }]);
      mockMilestoneRepository.achieveMilestone.mockResolvedValue(mockMilestones[0]);
      mockAchievementRepository.hasAchievementType.mockResolvedValue(false);
      mockAchievementRepository.createAchievement.mockResolvedValue(mockAchievements[0]);

      const result = await progressService.updateProgress(updateRequest);

      expect(result.progress).toEqual(mockUpdatedProgress);
      expect(result.newMilestones).toHaveLength(1);
      expect(result.newAchievements).toHaveLength(1);
      expect(mockProgressRepository.updateProgress).toHaveBeenCalledWith(updateRequest);
    });
  });

  describe('getUserMilestones', () => {
    it('should return user milestones', async () => {
      const mockMilestones = [{
        id: 'milestone1',
        userId: 'user1',
        pathId: 'path1',
        type: 'path_started' as any,
        title: 'Getting Started',
        description: 'You started your learning journey!',
        criteria: { type: 'path_started' as any, conditions: {} },
        celebrationShown: false,
        metadata: {}
      }];

      mockMilestoneRepository.getUserMilestones.mockResolvedValue(mockMilestones);

      const result = await progressService.getUserMilestones('user1', 'path1');

      expect(result).toEqual(mockMilestones);
      expect(mockMilestoneRepository.getUserMilestones).toHaveBeenCalledWith('user1', 'path1');
    });
  });

  describe('getUserAchievements', () => {
    it('should return user achievements', async () => {
      const mockAchievements = [{
        id: 'achievement1',
        userId: 'user1',
        type: 'completion' as any,
        title: 'First Steps',
        description: 'You started learning!',
        iconUrl: '/icons/first-steps.svg',
        awardedAt: new Date(),
        celebrationShown: false,
        metadata: {}
      }];

      mockAchievementRepository.getUserAchievements.mockResolvedValue(mockAchievements);

      const result = await progressService.getUserAchievements('user1');

      expect(result).toEqual(mockAchievements);
      expect(mockAchievementRepository.getUserAchievements).toHaveBeenCalledWith('user1');
    });
  });
});