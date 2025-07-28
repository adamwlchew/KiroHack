"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockCompanionService = void 0;
exports.getCompanionForPlatform = getCompanionForPlatform;
exports.adaptCompanionForAccessibility = adaptCompanionForAccessibility;
const types_1 = require("@pageflow/types");
const uuid_1 = require("uuid");
/**
 * Mock companion service for development and testing
 */
class MockCompanionService {
    constructor() {
        this.companion = null;
    }
    /**
     * Fetch the companion for the current user
     */
    async fetchCompanion() {
        if (!this.companion) {
            this.companion = this.createDefaultCompanion();
        }
        return { ...this.companion };
    }
    /**
     * Interact with the companion
     */
    async interactWithCompanion(userInput) {
        // Mock response based on input
        const responses = {
            greeting: "Hi there! I'm Page, your learning companion. How can I help you today?",
            help: "I'm here to guide you through your learning journey! What would you like to explore?",
            default: "That's interesting! Tell me more about what you'd like to learn."
        };
        let response = responses.default;
        if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
            response = responses.greeting;
        }
        else if (userInput.toLowerCase().includes('help') || userInput.toLowerCase().includes('learn')) {
            response = responses.help;
        }
        const suggestions = [
            "Explore a new learning path",
            "Review your progress",
            "Try an interactive quiz"
        ];
        return {
            response,
            emotionalState: {
                primary: types_1.Emotion.EXCITED,
                intensity: 90
            },
            suggestions: suggestions.slice(0, Math.floor(Math.random() * 3) + 1)
        };
    }
    /**
     * Update companion personality
     */
    async updateCompanionPersonality(personality) {
        if (!this.companion) {
            this.companion = this.createDefaultCompanion();
        }
        this.companion.personality = personality;
        this.companion.updatedAt = new Date().toISOString();
        return { ...this.companion };
    }
    /**
     * Update companion appearance
     */
    async updateCompanionAppearance(appearance) {
        if (!this.companion) {
            this.companion = this.createDefaultCompanion();
        }
        this.companion.appearance = {
            ...this.companion.appearance,
            ...appearance
        };
        this.companion.updatedAt = new Date().toISOString();
        return { ...this.companion };
    }
    /**
     * Create a default companion
     */
    createDefaultCompanion() {
        const now = new Date().toISOString();
        return {
            id: (0, uuid_1.v4)(),
            userId: 'mock-user-id',
            name: 'Page',
            personality: [types_1.PersonalityTrait.ENCOURAGING, types_1.PersonalityTrait.FRIENDLY],
            emotionalState: {
                primary: types_1.Emotion.HAPPY,
                intensity: 80,
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
            interactionHistory: [],
            createdAt: now,
            updatedAt: now
        };
    }
}
exports.MockCompanionService = MockCompanionService;
/**
 * Adapt companion for specific platform
 */
function getCompanionForPlatform(companion, platform) {
    const platformAppearance = companion.appearance.platformSpecific[platform];
    return {
        ...companion,
        appearance: {
            ...companion.appearance,
            ...platformAppearance
        }
    };
}
/**
 * Adapt companion for accessibility preferences
 */
function adaptCompanionForAccessibility(companion, preferences) {
    const adaptedCompanion = { ...companion };
    if (preferences.screenReaderOptimized) {
        adaptedCompanion.appearance.avatarType = 'text-only';
    }
    if (preferences.reducedMotion) {
        adaptedCompanion.appearance.animationLevel = 'none';
    }
    return adaptedCompanion;
}
//# sourceMappingURL=companionService.js.map