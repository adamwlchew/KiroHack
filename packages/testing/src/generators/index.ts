import { faker } from '@faker-js/faker';
import { User, UserRole } from '@pageflow/types';
import { Progress, ProgressStatus } from '@pageflow/types';

/**
 * Generate a random user
 * @returns Random user
 */
export function generateRandomUser(): User {
  const now = new Date().toISOString();
  const roles = Object.values(UserRole);
  
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: roles[Math.floor(Math.random() * roles.length)],
    preferences: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'high-contrast']),
      fontSize: faker.helpers.arrayElement(['small', 'medium', 'large', 'x-large']),
      reducedMotion: faker.datatype.boolean(),
      screenReaderOptimized: faker.datatype.boolean(),
      readingLevel: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
      preferredInputMethod: faker.helpers.arrayElement(['standard', 'voice', 'switch', 'eye-tracking']),
      pageCompanionSettings: {
        interactionStyle: faker.helpers.arrayElement(['visual', 'audio', 'text-only']),
        personality: faker.helpers.arrayElement(['encouraging', 'neutral', 'technical']),
        verbosity: faker.helpers.arrayElement(['minimal', 'balanced', 'detailed'])
      }
    },
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Generate multiple random users
 * @param count Number of users to generate
 * @returns Array of random users
 */
export function generateRandomUsers(count: number): User[] {
  return Array.from({ length: count }, () => generateRandomUser());
}

/**
 * Generate a random progress record
 * @param userId User ID
 * @returns Random progress record
 */
export function generateRandomProgress(userId?: string): Progress {
  const now = new Date();
  
  return {
    userId: userId || faker.string.uuid(),
    pathId: faker.string.uuid(),
    moduleProgress: [
      {
        moduleId: faker.string.uuid(),
        unitProgress: [
          {
            unitId: faker.string.uuid(),
            contentProgress: [
              {
                contentItemId: faker.string.uuid(),
                status: ProgressStatus.IN_PROGRESS,
                timeSpent: faker.number.int({ min: 60, max: 3600 }),
                lastPosition: faker.number.int({ min: 0, max: 100 }),
                completedAt: undefined
              }
            ],
            completion: faker.number.int({ min: 0, max: 100 }),
            startedAt: now,
            completedAt: undefined
          }
        ],
        completion: faker.number.int({ min: 0, max: 100 }),
        startedAt: now,
        completedAt: undefined
      }
    ],
    overallCompletion: faker.number.int({ min: 0, max: 100 }),
    startedAt: now,
    lastAccessedAt: now,
    completedAt: undefined,
    deviceSyncStatus: {
      lastSyncedAt: now,
      syncedDevices: [faker.string.uuid()],
      pendingSync: false
    }
  };
}

/**
 * Generate multiple random progress records
 * @param count Number of progress records to generate
 * @param userId User ID
 * @returns Array of random progress records
 */
export function generateRandomProgresses(count: number, userId?: string): Progress[] {
  return Array.from({ length: count }, () => generateRandomProgress(userId));
}

/**
 * Generate a random email
 * @returns Random email
 */
export function generateRandomEmail(): string {
  return faker.internet.email();
}

/**
 * Generate a random password
 * @param length Password length
 * @returns Random password
 */
export function generateRandomPassword(length: number = 12): string {
  return faker.internet.password({ length });
}

/**
 * Generate a random UUID
 * @returns Random UUID
 */
export function generateRandomUuid(): string {
  return faker.string.uuid();
}