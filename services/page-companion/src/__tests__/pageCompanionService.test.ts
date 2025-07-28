import { PersonalityTrait, Emotion } from '@pageflow/types';
import { 
  PageCompanionService, 
  CompanionInteractionRequest 
} from '../services/pageCompanionService';
import { KnowledgeCategory, KnowledgeSource } from '../services/knowledgeBaseService';

describe('PageCompanionService', () => {
  const mockUserId = 'test-user-123';
  
  describe('createCompanion', () => {
    it('should create a companion with default personality', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      
      expect(companion.userId).toBe(mockUserId);
      expect(companion.name).toBe('Page');
      expect(companion.personality).toEqual([PersonalityTrait.FRIENDLY, PersonalityTrait.ENCOURAGING]);
      expect(companion.emotionalState.primary).toBe(Emotion.HAPPY);
      expect(companion.interactionHistory).toEqual([]);
      expect(companion.id).toBeTruthy();
      expect(companion.createdAt).toBeTruthy();
      expect(companion.updatedAt).toBeTruthy();
    });

    it('should create a companion with custom personality', async () => {
      const customPersonality = [PersonalityTrait.TECHNICAL, PersonalityTrait.PATIENT];
      const companion = await PageCompanionService.createCompanion(
        mockUserId, 
        customPersonality
      );
      
      expect(companion.personality).toEqual(customPersonality);
    });

    it('should create a companion with custom appearance', async () => {
      const customAppearance = {
        avatarType: 'realistic' as const,
        colorScheme: 'green'
      };
      
      const companion = await PageCompanionService.createCompanion(
        mockUserId,
        undefined,
        customAppearance
      );
      
      expect(companion.appearance.avatarType).toBe('realistic');
      expect(companion.appearance.colorScheme).toBe('green');
    });
  });

  describe('handleInteraction', () => {
    it('should handle a greeting interaction', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      const request: CompanionInteractionRequest = {
        userId: mockUserId,
        userInput: 'Hello Page!',
        context: {
          location: 'dashboard',
          activity: 'greeting',
          platform: 'web'
        }
      };

      const result = await PageCompanionService.handleInteraction(companion, request);
      
      expect(result.updatedCompanion.interactionHistory).toHaveLength(1);
      expect(result.response.response).toContain('Hi');
      expect(result.response.emotionalState.primary).toBe(Emotion.HAPPY);
      expect(result.response.personalityInfluence).toBeDefined();
    });

    it('should handle a help request interaction', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      const request: CompanionInteractionRequest = {
        userId: mockUserId,
        userInput: 'I need help with this problem',
        context: {
          location: 'learning_path',
          activity: 'asking_for_help',
          platform: 'web'
        }
      };

      const result = await PageCompanionService.handleInteraction(companion, request);
      
      expect(result.response.response).toContain('help');
      expect(result.response.actions).toBeDefined();
      expect(result.updatedCompanion.emotionalState.primary).toBe(Emotion.CONCERNED);
    });

    it('should update emotional state based on user behavior', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      const request: CompanionInteractionRequest = {
        userId: mockUserId,
        userInput: 'I completed the challenge!',
        context: {
          location: 'assessment',
          activity: 'completing_challenge',
          platform: 'web'
        },
        emotionalContext: {
          userBehavior: 'user_succeeding',
          interactionType: 'success',
          userProgress: 90
        }
      };

      const result = await PageCompanionService.handleInteraction(companion, request);
      
      expect(result.updatedCompanion.emotionalState.intensity).toBeGreaterThan(
        companion.emotionalState.intensity
      );
      expect(result.response.actions?.some(action => action.type === 'celebrate')).toBe(true);
    });

    it('should incorporate knowledge base context', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      const knowledgeBase = [
        {
          id: 'kb-1',
          userId: mockUserId,
          category: KnowledgeCategory.LEARNING_PREFERENCES,
          key: 'feedback_style',
          value: 'detailed',
          confidence: 80,
          source: KnowledgeSource.USER_STATED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const request: CompanionInteractionRequest = {
        userId: mockUserId,
        userInput: 'Can you explain this concept?',
        context: {
          location: 'learning_content',
          activity: 'asking_question',
          platform: 'web'
        }
      };

      const result = await PageCompanionService.handleInteraction(
        companion, 
        request, 
        knowledgeBase
      );
      
      expect(result.response.response).toBeTruthy();
      expect(result.updatedCompanion.interactionHistory).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      const invalidRequest = {
        userId: mockUserId,
        userInput: '',
        context: null as any
      };

      const result = await PageCompanionService.handleInteraction(companion, invalidRequest);
      
      expect(result.updatedCompanion).toEqual(companion);
      expect(result.response.response).toContain('help');
    });
  });

  describe('updatePersonality', () => {
    it('should update companion personality', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      const newPersonality = [PersonalityTrait.SERIOUS, PersonalityTrait.TECHNICAL];
      
      const updatedCompanion = PageCompanionService.updatePersonality(
        companion, 
        newPersonality
      );
      
      expect(updatedCompanion.personality).toEqual(newPersonality);
      expect(updatedCompanion.updatedAt).not.toBe(companion.updatedAt);
    });
  });

  describe('updateAppearance', () => {
    it('should update companion appearance', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      const newAppearance = {
        avatarType: 'abstract' as const,
        animationLevel: 'minimal' as const
      };
      
      const updatedCompanion = PageCompanionService.updateAppearance(
        companion, 
        newAppearance
      );
      
      expect(updatedCompanion.appearance.avatarType).toBe('abstract');
      expect(updatedCompanion.appearance.animationLevel).toBe('minimal');
      expect(updatedCompanion.appearance.colorScheme).toBe(companion.appearance.colorScheme);
    });
  });

  describe('analyzeInteractionHistory', () => {
    it('should analyze empty interaction history', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      
      const analysis = PageCompanionService.analyzeInteractionHistory(companion);
      
      expect(analysis.patterns.frequentQuestions).toEqual([]);
      expect(analysis.patterns.strugglingAreas).toEqual([]);
      expect(analysis.insights.learningStyle).toBe('mixed');
      expect(analysis.recommendations).toHaveLength(2);
    });

    it('should analyze interaction history with data', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      
      // Add some mock interactions
      companion.interactionHistory = [
        {
          id: 'int-1',
          timestamp: new Date().toISOString(),
          userInput: 'How do I solve this math problem?',
          companionResponse: 'Let me help you with that!',
          context: {
            location: 'math_module',
            activity: 'asking_question',
            emotionalState: {
              primary: Emotion.NEUTRAL,
              intensity: 50,
              lastUpdated: new Date().toISOString()
            }
          }
        },
        {
          id: 'int-2',
          timestamp: new Date().toISOString(),
          userInput: 'I\'m confused about fractions',
          companionResponse: 'Fractions can be tricky, let\'s break it down.',
          context: {
            location: 'math_module',
            activity: 'expressing_confusion',
            emotionalState: {
              primary: Emotion.CONCERNED,
              intensity: 60,
              lastUpdated: new Date().toISOString()
            }
          }
        }
      ];
      
      const analysis = PageCompanionService.analyzeInteractionHistory(companion);
      
      expect(analysis.patterns.strugglingAreas).toContain('math_module');
      expect(analysis.insights.helpSeekingBehavior).toBe('proactive');
    });
  });

  describe('getCompanionStatus', () => {
    it('should return companion status and insights', async () => {
      const companion = await PageCompanionService.createCompanion(mockUserId);
      const knowledgeBase = [
        {
          id: 'kb-1',
          userId: mockUserId,
          category: KnowledgeCategory.LEARNING_PREFERENCES,
          key: 'learning_style',
          value: 'visual',
          confidence: 75,
          source: KnowledgeSource.INFERRED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      const status = PageCompanionService.getCompanionStatus(companion, knowledgeBase);
      
      expect(status.emotionalDescription).toBe('quite happy');
      expect(status.personalityDescription).toContain('warm and approachable');
      expect(status.recentInsights).toHaveLength(3);
      expect(status.recommendations).toHaveLength(2);
    });
  });
});