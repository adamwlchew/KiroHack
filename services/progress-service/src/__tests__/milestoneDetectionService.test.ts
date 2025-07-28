import { MilestoneDetectionService } from '../services/milestoneDetectionService';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { MilestoneType, ProgressStatus } from '@pageflow/types';
import { MilestoneDetectionContext } from '../models/progress';

// Mock the milestone repository
jest.mock('../repositories/milestoneRepository');

describe('MilestoneDetectionService', () => {
  let milestoneDetectionService: MilestoneDetectionService;
  let mockMilestoneRepository: jest.Mocked<MilestoneRepository>;

  beforeEach(() => {
    mockMilestoneRepository = {} as jest.Mocked<MilestoneRepository>;
    mockMilestoneRepository.getUserMilestones = jest.fn();
    mockMilestoneRepository.achieveMilestone = jest.fn();
    
    milestoneDetectionService = new MilestoneDetectionService(mockMilestoneRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectAndAchieveMilestones', () => {
    it('should detect path started milestone for new user', async () => {
      const context: MilestoneDetectionContext = {
        userId: 'user1',
        pathId: 'path1',
        currentProgress: {
          userId: 'user1',
          pathId: 'path1',
          moduleProgress: [{
            moduleId: 'module1',
            unitProgress: [],
            completion: 0,
            startedAt: new Date()
          }],
          overallCompletion: 0,
          startedAt: new Date(),
          lastAccessedAt: new Date(),
          deviceSyncStatus: {
            lastSyncedAt: new Date(),
            syncedDevices: [],
            pendingSync: false
          }
        },
        previousProgress: undefined,
        recentActivity: []
      };

      const existingMilestones = [{
        id: 'milestone1',
        userId: 'user1',
        pathId: 'path1',
        type: MilestoneType.PATH_STARTED,
        title: 'Getting Started',
        description: 'You started your learning journey!',
        criteria: { type: MilestoneType.PATH_STARTED, conditions: {} },
        celebrationShown: false,
        metadata: {}
      }];

      const achievedMilestone = {
        ...existingMilestones[0],
        achievedAt: new Date()
      };

      mockMilestoneRepository.getUserMilestones.mockResolvedValue(existingMilestones);
      mockMilestoneRepository.achieveMilestone.mockResolvedValue(achievedMilestone);

      const result = await milestoneDetectionService.detectAndAchieveMilestones(context);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(MilestoneType.PATH_STARTED);
      expect(mockMilestoneRepository.achieveMilestone).toHaveBeenCalledWith('user1', 'milestone1');
    });

    it('should detect module completed milestone', async () => {
      const context: MilestoneDetectionContext = {
        userId: 'user1',
        pathId: 'path1',
        currentProgress: {
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
          deviceSyncStatus: {
            lastSyncedAt: new Date(),
            syncedDevices: [],
            pendingSync: false
          }
        },
        previousProgress: {
          userId: 'user1',
          pathId: 'path1',
          moduleProgress: [{
            moduleId: 'module1',
            unitProgress: [{
              unitId: 'unit1',
              contentProgress: [{
                contentItemId: 'content1',
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
          lastAccessedAt: new Date(),
          deviceSyncStatus: {
            lastSyncedAt: new Date(),
            syncedDevices: [],
            pendingSync: false
          }
        },
        recentActivity: []
      };

      const existingMilestones = [{
        id: 'milestone2',
        userId: 'user1',
        pathId: 'path1',
        type: MilestoneType.MODULE_COMPLETED,
        title: 'Module Master',
        description: 'You completed a module!',
        criteria: { type: MilestoneType.MODULE_COMPLETED, threshold: 1, conditions: {} },
        celebrationShown: false,
        metadata: {}
      }];

      const achievedMilestone = {
        ...existingMilestones[0],
        achievedAt: new Date()
      };

      mockMilestoneRepository.getUserMilestones.mockResolvedValue(existingMilestones);
      mockMilestoneRepository.achieveMilestone.mockResolvedValue(achievedMilestone);

      const result = await milestoneDetectionService.detectAndAchieveMilestones(context);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(MilestoneType.MODULE_COMPLETED);
      expect(mockMilestoneRepository.achieveMilestone).toHaveBeenCalledWith('user1', 'milestone2');
    });

    it('should detect path completed milestone', async () => {
      const context: MilestoneDetectionContext = {
        userId: 'user1',
        pathId: 'path1',
        currentProgress: {
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
            syncedDevices: [],
            pendingSync: false
          }
        },
        previousProgress: {
          userId: 'user1',
          pathId: 'path1',
          moduleProgress: [{
            moduleId: 'module1',
            unitProgress: [{
              unitId: 'unit1',
              contentProgress: [{
                contentItemId: 'content1',
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
          lastAccessedAt: new Date(),
          deviceSyncStatus: {
            lastSyncedAt: new Date(),
            syncedDevices: [],
            pendingSync: false
          }
        },
        recentActivity: []
      };

      const existingMilestones = [{
        id: 'milestone3',
        userId: 'user1',
        pathId: 'path1',
        type: MilestoneType.PATH_COMPLETED,
        title: 'Path Champion',
        description: 'You completed the entire path!',
        criteria: { type: MilestoneType.PATH_COMPLETED, conditions: {} },
        celebrationShown: false,
        metadata: {}
      }];

      const achievedMilestone = {
        ...existingMilestones[0],
        achievedAt: new Date()
      };

      mockMilestoneRepository.getUserMilestones.mockResolvedValue(existingMilestones);
      mockMilestoneRepository.achieveMilestone.mockResolvedValue(achievedMilestone);

      const result = await milestoneDetectionService.detectAndAchieveMilestones(context);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(MilestoneType.PATH_COMPLETED);
      expect(mockMilestoneRepository.achieveMilestone).toHaveBeenCalledWith('user1', 'milestone3');
    });

    it('should handle errors gracefully and return partial results', async () => {
      const context: MilestoneDetectionContext = {
        userId: 'user1',
        pathId: 'path1',
        currentProgress: {
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
        },
        recentActivity: []
      };

      mockMilestoneRepository.getUserMilestones.mockRejectedValue(new Error('Database error'));

      const result = await milestoneDetectionService.detectAndAchieveMilestones(context);

      expect(result).toHaveLength(0);
      expect(mockMilestoneRepository.getUserMilestones).toHaveBeenCalledWith('user1', 'path1');
    });
  });
});