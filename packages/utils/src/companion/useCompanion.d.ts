import { PageCompanion, PersonalityTrait, AppearanceSettings } from '@pageflow/types';
/**
 * Hook for managing companion interactions
 */
export declare function useCompanion(): {
    companion: PageCompanion | null;
    loading: boolean;
    error: string | null;
    interactionInProgress: boolean;
    fetchCompanion: () => Promise<void>;
    interactWithCompanion: (userInput: string) => Promise<{
        response: string;
        emotionalState: {
            primary: import("@pageflow/types").Emotion;
            intensity: number;
        };
        suggestions?: string[];
    } | null>;
    updatePersonality: (personality: PersonalityTrait[]) => Promise<void>;
    updateAppearance: (appearance: Partial<AppearanceSettings>) => Promise<void>;
};
//# sourceMappingURL=useCompanion.d.ts.map