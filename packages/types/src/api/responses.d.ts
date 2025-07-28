/**
 * Base response interface
 */
export interface BaseResponse {
    success: boolean;
    requestId?: string;
    timestamp?: string;
}
/**
 * Error response interface
 */
export interface ErrorResponse extends BaseResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
}
/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}
/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> extends BaseResponse {
    success: true;
    data: T[];
    pagination: PaginationMeta;
}
/**
 * Single item response interface
 */
export interface SingleResponse<T> extends BaseResponse {
    success: true;
    data: T;
}
/**
 * User response interfaces
 */
export type UserResponse = SingleResponse<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    preferences: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}>;
export type UsersResponse = PaginatedResponse<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
}>;
/**
 * Page Companion response interfaces
 */
export type CompanionResponse = SingleResponse<{
    id: string;
    userId: string;
    name: string;
    personality: string[];
    emotionalState: {
        primary: string;
        intensity: number;
    };
    appearance: Record<string, any>;
}>;
export type CompanionInteractionResponse = SingleResponse<{
    response: string;
    emotionalState: {
        primary: string;
        intensity: number;
    };
    suggestions?: string[];
}>;
/**
 * Learning progress response interfaces
 */
export type ProgressResponse = SingleResponse<{
    id: string;
    userId: string;
    learningPathId: string;
    moduleId: string;
    status: string;
    completedItems: string[];
    score: number;
    timeSpent: number;
    lastAccessedAt: string;
}>;
/**
 * Content generation response interfaces
 */
export type GeneratedContentResponse = SingleResponse<{
    contentId: string;
    contentType: string;
    content: any;
    metadata: {
        topic: string;
        learningLevel: string;
        curriculumStandards?: string[];
        generationModel: string;
    };
}>;
/**
 * Health check response
 */
export interface HealthCheckResponse extends BaseResponse {
    success: true;
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    services: {
        [key: string]: {
            status: 'up' | 'down' | 'degraded';
            latency?: number;
        };
    };
}
//# sourceMappingURL=responses.d.ts.map