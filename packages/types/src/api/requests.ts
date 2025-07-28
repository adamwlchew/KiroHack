/**
 * Base request interface
 */
export interface BaseRequest {
  requestId?: string;
  timestamp?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * User request interfaces
 */
export interface CreateUserRequest extends BaseRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: string;
  preferences?: Record<string, any>;
}

export interface UpdateUserRequest extends BaseRequest {
  firstName?: string;
  lastName?: string;
  role?: string;
  preferences?: Record<string, any>;
}

/**
 * Page Companion request interfaces
 */
export interface UpdateCompanionRequest extends BaseRequest {
  name?: string;
  personality?: string[];
  appearance?: Record<string, any>;
}

export interface CompanionInteractionRequest extends BaseRequest {
  userInput: string;
  context?: {
    location?: string;
    activity?: string;
  };
}

/**
 * Learning progress request interfaces
 */
export interface UpdateProgressRequest extends BaseRequest {
  status?: string;
  completedItems?: string[];
  score?: number;
  timeSpent?: number;
}

/**
 * Content generation request interfaces
 */
export interface GenerateContentRequest extends BaseRequest {
  contentType: 'text' | 'image' | 'quiz' | 'interactive';
  topic: string;
  learningLevel: string;
  curriculumStandards?: string[];
  userInterests?: string[];
  accessibilityRequirements?: string[];
}