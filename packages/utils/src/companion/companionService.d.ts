import { PageCompanion, PersonalityTrait, Emotion, AppearanceSettings } from '@pageflow/types';
/**
 * Mock companion service for development and testing
 */
export declare class MockCompanionService {
    private companion;
    /**
     * Fetch the companion for the current user
     */
    fetchCompanion(): Promise<PageCompanion>;
    /**
     * Interact with the companion
     */
    interactWithCompanion(userInput: string): Promise<{
        response: string;
        emotionalState: {
            primary: Emotion;
            intensity: number;
        };
        suggestions?: string[];
    }>;
    /**
     * Update companion personality
     */
    updateCompanionPersonality(personality: PersonalityTrait[]): Promise<PageCompanion>;
    /**
     * Update companion appearance
     */
    updateCompanionAppearance(appearance: Partial<AppearanceSettings>): Promise<PageCompanion>;
    /**
     * Create a default companion
     */
    private createDefaultCompanion;
}
/**
 * Adapt companion for specific platform
 */
export declare function getCompanionForPlatform(companion: PageCompanion, platform: 'web' | 'mobile' | 'vr'): any;
/**
 * Adapt companion for accessibility preferences
 */
export declare function adaptCompanionForAccessibility(companion: PageCompanion, preferences: {
    screenReaderOptimized?: boolean;
    reducedMotion?: boolean;
}): PageCompanion;
//# sourceMappingURL=companionService.d.ts.map