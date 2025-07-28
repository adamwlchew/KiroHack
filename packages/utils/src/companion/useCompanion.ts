import { useState, useEffect, useCallback } from 'react';
import { PageCompanion, PersonalityTrait, AppearanceSettings } from '@pageflow/types';
import { MockCompanionService } from './companionService';

/**
 * Hook for managing companion interactions
 */
export function useCompanion() {
  const [companion, setCompanion] = useState<PageCompanion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionInProgress, setInteractionInProgress] = useState(false);

  const companionService = new MockCompanionService();

  /**
   * Fetch companion data
   */
  const fetchCompanion = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const companionData = await companionService.fetchCompanion();
      setCompanion(companionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companion');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Interact with companion
   */
  const interactWithCompanion = useCallback(async (userInput: string) => {
    if (!companion) return null;

    setInteractionInProgress(true);
    setError(null);

    try {
      const response = await companionService.interactWithCompanion(userInput);
      
      // Update companion's emotional state
      setCompanion((prev: PageCompanion | null) => prev ? {
        ...prev,
        emotionalState: {
          ...response.emotionalState,
          lastUpdated: new Date().toISOString()
        }
      } : null);

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to interact with companion');
      return null;
    } finally {
      setInteractionInProgress(false);
    }
  }, [companion]);

  /**
   * Update companion personality
   */
  const updatePersonality = useCallback(async (personality: PersonalityTrait[]) => {
    setLoading(true);
    setError(null);

    try {
      const updatedCompanion = await companionService.updateCompanionPersonality(personality);
      setCompanion(updatedCompanion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update personality');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update companion appearance
   */
  const updateAppearance = useCallback(async (appearance: Partial<AppearanceSettings>) => {
    setLoading(true);
    setError(null);

    try {
      const updatedCompanion = await companionService.updateCompanionAppearance(appearance);
      setCompanion(updatedCompanion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appearance');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch companion on mount
  useEffect(() => {
    fetchCompanion();
  }, [fetchCompanion]);

  return {
    companion,
    loading,
    error,
    interactionInProgress,
    fetchCompanion,
    interactWithCompanion,
    updatePersonality,
    updateAppearance
  };
}