import { User, Progress, PageCompanion } from '@pageflow/types';

/**
 * Assert that a user object has the expected structure
 * @param user User object to validate
 */
export function assertValidUser(user: any): void {
  expect(user).toBeDefined();
  expect(user.id).toBeDefined();
  expect(user.email).toBeDefined();
  expect(user.firstName).toBeDefined();
  expect(user.lastName).toBeDefined();
  expect(user.role).toBeDefined();
  expect(user.preferences).toBeDefined();
  expect(user.createdAt).toBeDefined();
  expect(user.updatedAt).toBeDefined();
}

/**
 * Assert that a progress object has the expected structure
 * @param progress Progress object to validate
 */
export function assertValidProgress(progress: any): void {
  expect(progress).toBeDefined();
  expect(progress.userId).toBeDefined();
  expect(progress.pathId).toBeDefined();
  expect(progress.moduleProgress).toBeDefined();
  expect(Array.isArray(progress.moduleProgress)).toBe(true);
  expect(progress.overallCompletion).toBeDefined();
  expect(progress.startedAt).toBeDefined();
  expect(progress.lastAccessedAt).toBeDefined();
  expect(progress.deviceSyncStatus).toBeDefined();
}

/**
 * Assert that a Page Companion object has the expected structure
 * @param companion Page Companion object to validate
 */
export function assertValidPageCompanion(companion: any): void {
  expect(companion).toBeDefined();
  expect(companion.id).toBeDefined();
  expect(companion.userId).toBeDefined();
  expect(companion.name).toBeDefined();
  expect(companion.personality).toBeDefined();
  expect(Array.isArray(companion.personality)).toBe(true);
  expect(companion.emotionalState).toBeDefined();
  expect(companion.emotionalState.primary).toBeDefined();
  expect(companion.emotionalState.intensity).toBeDefined();
  expect(companion.appearance).toBeDefined();
  expect(companion.interactionHistory).toBeDefined();
  expect(Array.isArray(companion.interactionHistory)).toBe(true);
  expect(companion.createdAt).toBeDefined();
  expect(companion.updatedAt).toBeDefined();
}

/**
 * Assert that an API response has the expected success structure
 * @param response API response to validate
 */
export function assertValidSuccessResponse(response: any): void {
  expect(response).toBeDefined();
  expect(response.success).toBe(true);
  expect(response.data).toBeDefined();
}

/**
 * Assert that an API response has the expected error structure
 * @param response API response to validate
 */
export function assertValidErrorResponse(response: any): void {
  expect(response).toBeDefined();
  expect(response.success).toBe(false);
  expect(response.error).toBeDefined();
  expect(response.error.code).toBeDefined();
  expect(response.error.message).toBeDefined();
}

/**
 * Assert that an API response has the expected pagination structure
 * @param response API response to validate
 */
export function assertValidPaginatedResponse(response: any): void {
  assertValidSuccessResponse(response);
  expect(Array.isArray(response.data)).toBe(true);
  expect(response.pagination).toBeDefined();
  expect(response.pagination.page).toBeDefined();
  expect(response.pagination.limit).toBeDefined();
  expect(response.pagination.totalItems).toBeDefined();
  expect(response.pagination.totalPages).toBeDefined();
}

/**
 * Assert that two users are equal
 * @param user1 First user
 * @param user2 Second user
 */
export function assertUsersEqual(user1: User, user2: User): void {
  expect(user1.id).toBe(user2.id);
  expect(user1.email).toBe(user2.email);
  expect(user1.firstName).toBe(user2.firstName);
  expect(user1.lastName).toBe(user2.lastName);
  expect(user1.role).toBe(user2.role);
}

/**
 * Assert that two progress records are equal
 * @param progress1 First progress record
 * @param progress2 Second progress record
 */
export function assertProgressesEqual(progress1: Progress, progress2: Progress): void {
  expect(progress1.userId).toBe(progress2.userId);
  expect(progress1.pathId).toBe(progress2.pathId);
  expect(progress1.overallCompletion).toBe(progress2.overallCompletion);
  expect(progress1.startedAt).toEqual(progress2.startedAt);
  expect(progress1.lastAccessedAt).toEqual(progress2.lastAccessedAt);
}