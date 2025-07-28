import { faker } from '@faker-js/faker';
import { User, UserRole, UserPreferences } from '@pageflow/types';
import { Progress, ProgressStatus, Achievement, AchievementType } from '@pageflow/types';
import { PageCompanion, PersonalityTrait, Emotion } from '@pageflow/types';

/**
 * Create a user fixture
 * @param overrides User overrides
 * @returns User fixture
 */
export function createUserFixture(overrides: Partial<User> = {}): User {
  const now = new Date().toISOString();
  
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: UserRole.LEARNER,
    preferences: createUserPreferencesFixture(),
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

/**
 * Create user preferences fixture
 * @param overrides User preferences overrides
 * @returns User preferences fixture
 */
export function createUserPreferencesFixture(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    theme: 'light',
    fontSize: 'medium',
    reducedMotion: false,
    screenReaderOptimized: false,
    readingLevel: 'intermediate',
    preferredInputMethod: 'standard',
    pageCompanionSettings: {
      interactionStyle: 'visual',
      personality: 'encouraging',
      verbosity: 'balanced'
    },
    ...overrides
  };
}

/**
 * Create a progress fixture
 * @param overrides Progress overrides
 * @returns Progress fixture
 */
export function createProgressFixture(overrides: Partial<Progress> = {}): Progress {
  const now = new Date();
  
  return {
    userId: faker.string.uuid(),
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
    },
    ...overrides
  };
}

/**
 * Create an achievement fixture
 * @param overrides Achievement overrides
 * @returns Achievement fixture
 */
export function createAchievementFixture(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    type: AchievementType.COMPLETION,
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    iconUrl: faker.image.url(),
    awardedAt: new Date(),
    celebrationShown: false,
    metadata: {
      moduleId: faker.string.uuid(),
      score: faker.number.int({ min: 0, max: 100 })
    },
    ...overrides
  };
}

/**
 * Create a Page Companion fixture
 * @param overrides Page Companion overrides
 * @returns Page Companion fixture
 */
export function createPageCompanionFixture(overrides: Partial<PageCompanion> = {}): PageCompanion {
  const now = new Date().toISOString();
  
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    name: 'Page',
    personality: [PersonalityTrait.ENCOURAGING, PersonalityTrait.FRIENDLY],
    emotionalState: {
      primary: Emotion.HAPPY,
      intensity: faker.number.int({ min: 50, max: 100 }),
      lastUpdated: now
    },
    appearance: {
      avatarType: 'cartoon',
      colorScheme: 'blue',
      animationLevel: 'standard',
      platformSpecific: {
        web: {
          position: 'corner',
          size: 'medium'
        },
        mobile: {
          arMode: true,
          size: 'medium'
        },
        vr: {
          presence: 'full-body',
          distance: 'medium'
        }
      }
    },
    interactionHistory: [
      {
        id: faker.string.uuid(),
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userInput: 'Hello Page!',
        companionResponse: 'Hi there! How can I help you today?',
        context: {
          location: 'home',
          activity: 'greeting',
          emotionalState: {
            primary: Emotion.HAPPY,
            intensity: 80,
            lastUpdated: new Date(Date.now() - 3600000).toISOString()
          }
        }
      }
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}