"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCompanion = useCompanion;
const react_1 = require("react");
const companionService_1 = require("./companionService");
/**
 * Hook for managing companion interactions
 */
function useCompanion() {
    const [companion, setCompanion] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [interactionInProgress, setInteractionInProgress] = (0, react_1.useState)(false);
    const companionService = new companionService_1.MockCompanionService();
    /**
     * Fetch companion data
     */
    const fetchCompanion = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const companionData = await companionService.fetchCompanion();
            setCompanion(companionData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch companion');
        }
        finally {
            setLoading(false);
        }
    }, []);
    /**
     * Interact with companion
     */
    const interactWithCompanion = (0, react_1.useCallback)(async (userInput) => {
        if (!companion)
            return null;
        setInteractionInProgress(true);
        setError(null);
        try {
            const response = await companionService.interactWithCompanion(userInput);
            // Update companion's emotional state
            setCompanion((prev) => prev ? {
                ...prev,
                emotionalState: {
                    ...response.emotionalState,
                    lastUpdated: new Date().toISOString()
                }
            } : null);
            return response;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to interact with companion');
            return null;
        }
        finally {
            setInteractionInProgress(false);
        }
    }, [companion]);
    /**
     * Update companion personality
     */
    const updatePersonality = (0, react_1.useCallback)(async (personality) => {
        setLoading(true);
        setError(null);
        try {
            const updatedCompanion = await companionService.updateCompanionPersonality(personality);
            setCompanion(updatedCompanion);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update personality');
        }
        finally {
            setLoading(false);
        }
    }, []);
    /**
     * Update companion appearance
     */
    const updateAppearance = (0, react_1.useCallback)(async (appearance) => {
        setLoading(true);
        setError(null);
        try {
            const updatedCompanion = await companionService.updateCompanionAppearance(appearance);
            setCompanion(updatedCompanion);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update appearance');
        }
        finally {
            setLoading(false);
        }
    }, []);
    // Fetch companion on mount
    (0, react_1.useEffect)(() => {
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
//# sourceMappingURL=useCompanion.js.map