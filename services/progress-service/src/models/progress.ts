import {
  Progress,
  ModuleProgress,
  UnitProgress,
  ContentProgress,
  ProgressStatus,
  DeviceSyncStatus,
  Milestone,
  MilestoneType,
  MilestoneCriteria,
  Achievement,
  AchievementType,
  ProgressReport,
  ReportType,
  ProgressMetrics
} from '@pageflow/types';

/**
 * DynamoDB item structure for Progress
 */
export interface ProgressItem {
  PK: string; // USER#userId
  SK: string; // PATH#pathId
  GSI1PK: string; // PATH#pathId
  GSI1SK: string; // USER#userId
  userId: string;
  pathId: string;
  moduleProgress: ModuleProgress[];
  overallCompletion: number;
  startedAt: string; // ISO string
  lastAccessedAt: string; // ISO string
  completedAt?: string; // ISO string
  deviceSyncStatus: DeviceSyncStatusItem;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  ttl?: number; // For data retention
}

/**
 * DynamoDB item structure for DeviceSyncStatus
 */
export interface DeviceSyncStatusItem {
  lastSyncedAt: string; // ISO string
  syncedDevices: string[];
  pendingSync: boolean;
}

/**
 * DynamoDB item structure for Milestone
 */
export interface MilestoneItem {
  PK: string; // USER#userId
  SK: string; // MILESTONE#milestoneId
  GSI1PK: string; // PATH#pathId
  GSI1SK: string; // MILESTONE#achievedAt
  id: string;
  userId: string;
  pathId: string;
  type: MilestoneType;
  title: string;
  description: string;
  criteria: MilestoneCriteria;
  achievedAt?: string; // ISO string
  celebrationShown: boolean;
  metadata: Record<string, any>;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * DynamoDB item structure for Achievement
 */
export interface AchievementItem {
  PK: string; // USER#userId
  SK: string; // ACHIEVEMENT#achievementId
  GSI1PK: string; // TYPE#type
  GSI1SK: string; // AWARDED#awardedAt
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  iconUrl: string;
  awardedAt: string; // ISO string
  celebrationShown: boolean;
  metadata: Record<string, any>;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * DynamoDB item structure for ProgressReport
 */
export interface ProgressReportItem {
  PK: string; // USER#userId
  SK: string; // REPORT#reportType#generatedAt
  GSI1PK: string; // PATH#pathId
  GSI1SK: string; // REPORT#generatedAt
  userId: string;
  pathId: string;
  reportType: ReportType;
  generatedAt: string; // ISO string
  timeframe: {
    startDate: string; // ISO string
    endDate: string; // ISO string
  };
  metrics: ProgressMetrics;
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
  createdAt: string; // ISO string
  ttl?: number; // For data retention
}

/**
 * Progress update request
 */
export interface ProgressUpdateRequest {
  userId: string;
  pathId: string;
  moduleId: string;
  unitId: string;
  contentItemId: string;
  status: ProgressStatus;
  timeSpent: number;
  lastPosition?: number;
  deviceId: string;
}

/**
 * Progress query parameters
 */
export interface ProgressQueryParams {
  userId: string;
  pathId?: string;
  includeCompleted?: boolean;
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
}

/**
 * Milestone detection context
 */
export interface MilestoneDetectionContext {
  userId: string;
  pathId: string;
  currentProgress: Progress;
  previousProgress?: Progress;
  recentActivity: ContentProgress[];
}

/**
 * Achievement trigger context
 */
export interface AchievementTriggerContext {
  userId: string;
  pathId?: string;
  milestones: Milestone[];
  progressHistory: Progress[];
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
}