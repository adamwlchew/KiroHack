/**
 * Progress model representing a user's learning progress across a learning path
 */
export interface Progress {
  userId: string;
  pathId: string;
  moduleProgress: ModuleProgress[];
  overallCompletion: number; // Percentage
  startedAt: Date;
  lastAccessedAt: Date;
  completedAt?: Date;
  deviceSyncStatus: DeviceSyncStatus;
}

/**
 * Module progress within a learning path
 */
export interface ModuleProgress {
  moduleId: string;
  unitProgress: UnitProgress[];
  completion: number; // Percentage
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Unit progress within a module
 */
export interface UnitProgress {
  unitId: string;
  contentProgress: ContentProgress[];
  completion: number; // Percentage
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Content progress within a unit
 */
export interface ContentProgress {
  contentItemId: string;
  status: ProgressStatus;
  timeSpent: number; // in seconds
  lastPosition?: number; // For resuming content
  completedAt?: Date;
}

/**
 * Device synchronization status
 */
export interface DeviceSyncStatus {
  lastSyncedAt: Date;
  syncedDevices: string[];
  pendingSync: boolean;
}

/**
 * Progress status enum
 */
export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

/**
 * Milestone model for tracking learning achievements
 */
export interface Milestone {
  id: string;
  userId: string;
  pathId: string;
  type: MilestoneType;
  title: string;
  description: string;
  criteria: MilestoneCriteria;
  achievedAt?: Date;
  celebrationShown: boolean;
  metadata: Record<string, any>;
}

/**
 * Milestone types
 */
export enum MilestoneType {
  PATH_STARTED = 'path_started',
  MODULE_COMPLETED = 'module_completed',
  PATH_COMPLETED = 'path_completed',
  STREAK_ACHIEVED = 'streak_achieved',
  MASTERY_DEMONSTRATED = 'mastery_demonstrated',
  PERSEVERANCE_SHOWN = 'perseverance_shown'
}

/**
 * Milestone criteria for achievement detection
 */
export interface MilestoneCriteria {
  type: MilestoneType;
  threshold?: number;
  timeframe?: number; // in days
  conditions: Record<string, any>;
}

/**
 * Achievement model
 */
export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  iconUrl: string;
  awardedAt: Date;
  celebrationShown: boolean;
  metadata: Record<string, any>;
}

/**
 * Achievement types
 */
export enum AchievementType {
  COMPLETION = 'completion',
  MASTERY = 'mastery',
  STREAK = 'streak',
  MILESTONE = 'milestone',
  EXPLORATION = 'exploration'
}

/**
 * Progress report model for analytics and visualization
 */
export interface ProgressReport {
  userId: string;
  pathId: string;
  reportType: ReportType;
  generatedAt: Date;
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  metrics: ProgressMetrics;
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
}

/**
 * Report types
 */
export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

/**
 * Progress metrics for reporting
 */
export interface ProgressMetrics {
  totalTimeSpent: number; // in seconds
  completionRate: number; // percentage
  averageScore: number;
  streakDays: number;
  modulesCompleted: number;
  achievementsEarned: number;
  strugglingAreas: string[];
  strongAreas: string[];
}

