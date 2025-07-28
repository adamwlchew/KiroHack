/**
 * Base event interface
 */
export interface BaseEvent {
  id: string;
  timestamp: string;
  source: string;
  type: string;
  version: string;
}

/**
 * User events
 */
export interface UserCreatedEvent extends BaseEvent {
  type: 'USER_CREATED';
  data: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface UserUpdatedEvent extends BaseEvent {
  type: 'USER_UPDATED';
  data: {
    userId: string;
    updatedFields: string[];
  };
}

export interface UserPreferencesUpdatedEvent extends BaseEvent {
  type: 'USER_PREFERENCES_UPDATED';
  data: {
    userId: string;
    preferences: Record<string, any>;
  };
}

/**
 * Learning progress events
 */
export interface ProgressUpdatedEvent extends BaseEvent {
  type: 'PROGRESS_UPDATED';
  data: {
    userId: string;
    learningPathId: string;
    moduleId: string;
    status: string;
    completedItems?: string[];
    score?: number;
  };
}

export interface AchievementAwardedEvent extends BaseEvent {
  type: 'ACHIEVEMENT_AWARDED';
  data: {
    userId: string;
    achievementId: string;
    achievementType: string;
    title: string;
  };
}

/**
 * Page Companion events
 */
export interface CompanionInteractionEvent extends BaseEvent {
  type: 'COMPANION_INTERACTION';
  data: {
    userId: string;
    companionId: string;
    userInput: string;
    companionResponse: string;
    emotionalState: {
      primary: string;
      intensity: number;
    };
  };
}

export interface CompanionCustomizedEvent extends BaseEvent {
  type: 'COMPANION_CUSTOMIZED';
  data: {
    userId: string;
    companionId: string;
    updatedFields: string[];
  };
}

/**
 * Content events
 */
export interface ContentGeneratedEvent extends BaseEvent {
  type: 'CONTENT_GENERATED';
  data: {
    contentId: string;
    userId: string;
    contentType: string;
    topic: string;
    generationModel: string;
  };
}

export interface ContentRatedEvent extends BaseEvent {
  type: 'CONTENT_RATED';
  data: {
    contentId: string;
    userId: string;
    rating: number;
    feedback?: string;
  };
}

/**
 * Device events
 */
export interface DeviceSyncEvent extends BaseEvent {
  type: 'DEVICE_SYNC';
  data: {
    userId: string;
    deviceType: 'web' | 'mobile' | 'vr';
    deviceId: string;
    syncType: 'progress' | 'preferences' | 'content';
    syncData: Record<string, any>;
  };
}

/**
 * Union type of all events
 */
export type AppEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserPreferencesUpdatedEvent
  | ProgressUpdatedEvent
  | AchievementAwardedEvent
  | CompanionInteractionEvent
  | CompanionCustomizedEvent
  | ContentGeneratedEvent
  | ContentRatedEvent
  | DeviceSyncEvent;