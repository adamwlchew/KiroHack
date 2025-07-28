import { TextGenerationService } from '../services/textGenerationService';
import { bedrockClient } from '../clients/bedrockClient';
import { promptManager } from '../services/promptManager';
import { contentModerationService } from '../services/contentModerationService';

// Mock dependencies
jest.mock('../clients/bedrockClient');
jest.mock('../services/promptManager');
jest.mock('../services/contentModerationService');

describe('TextGenerationService', () => {
  let service: TextGenerationService;
  let mockBedrockClient: jest.Mocked<typeof bedrockClient>;
  let mockPromptManager: jest.Mocked<typeof promptManager>;
  let mockModerationService: jest.Mocked<typeof contentModerationService>;

  beforeEach(() => {
    service = new TextGenerationService();
    mockBedrockClient = bedrockClient as jest.Mocked<typeof bedrockClient>;
    mockPromptManager = promptManager as jest.Mocked<typeof promptManager>;
    mockModerationService = contentModerationService as jest.Mocked<typeof contentModerationService>;

    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockModerationService.moderateText.mockResolvedValue({
      flagged: false,
      categories: [],
      confidence: 0,
    });
  });

  describe('generateText', () => {
    it('should generate text using Claude model', async () => {
      const mockResponse = {
        data: { content: [{ text: 'Generated text response' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-id',
        inputTokens: 10,
        outputTokens: 20,
        cost: 0.05,
        cached: false,
      };

      mockBedrockClient.invokeClaudeModel.mockResolvedValue(mockResponse);

      const result = await service.generateText({
        prompt: 'Test prompt',
        model: 'claude',
        userId: 'test-user',
      });

      expect(result).toMatchObject({
        text: 'Generated text response',
        modelUsed: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-id',
        inputTokens: 10,
        outputTokens: 20,
        cost: 0.05,
        cached: false,
      });

      expect(mockBedrockClient.invokeClaudeModel).toHaveBeenCalledWith(
        'Test prompt',
        expect.objectContaining({ userId: 'test-user' })
      );
    });

    it('should generate text using Titan model', async () => {
      const mockResponse = {
        data: { results: [{ outputText: 'Titan generated text' }] },
        modelId: 'amazon.titan-text-express-v1',
        requestId: 'test-request-id',
        inputTokens: 8,
        outputTokens: 15,
        cost: 0.02,
        cached: false,
      };

      mockBedrockClient.invokeTitanModel.mockResolvedValue(mockResponse);

      const result = await service.generateText({
        prompt: 'Test prompt',
        model: 'titan',
        userId: 'test-user',
      });

      expect(result.text).toBe('Titan generated text');
      expect(result.modelUsed).toBe('amazon.titan-text-express-v1');
      expect(mockBedrockClient.invokeTitanModel).toHaveBeenCalled();
    });

    it('should generate text using Cohere model', async () => {
      const mockResponse = {
        data: { generations: [{ text: 'Cohere generated text' }] },
        modelId: 'cohere.command-text-v14',
        requestId: 'test-request-id',
        inputTokens: 12,
        outputTokens: 18,
        cost: 0.03,
        cached: false,
      };

      mockBedrockClient.invokeCohereModel.mockResolvedValue(mockResponse);

      const result = await service.generateText({
        prompt: 'Test prompt',
        model: 'cohere',
        userId: 'test-user',
      });

      expect(result.text).toBe('Cohere generated text');
      expect(result.modelUsed).toBe('cohere.command-text-v14');
      expect(mockBedrockClient.invokeCohereModel).toHaveBeenCalled();
    });

    it('should moderate content when enabled', async () => {
      const mockResponse = {
        data: { content: [{ text: 'Generated text with inappropriate content' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-id',
        inputTokens: 10,
        outputTokens: 20,
        cost: 0.05,
        cached: false,
      };

      mockBedrockClient.invokeClaudeModel.mockResolvedValue(mockResponse);
      mockModerationService.moderateText.mockResolvedValue({
        flagged: true,
        categories: ['inappropriate_language'],
        confidence: 0.9,
      });

      await expect(service.generateText({
        prompt: 'Test prompt',
        model: 'claude',
        moderateContent: true,
      })).rejects.toThrow('Generated content violates content policy');

      expect(mockModerationService.moderateText).toHaveBeenCalledWith(
        'Generated text with inappropriate content'
      );
    });

    it('should skip moderation when disabled', async () => {
      const mockResponse = {
        data: { content: [{ text: 'Generated text' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-id',
        inputTokens: 10,
        outputTokens: 20,
        cost: 0.05,
        cached: false,
      };

      mockBedrockClient.invokeClaudeModel.mockResolvedValue(mockResponse);

      const result = await service.generateText({
        prompt: 'Test prompt',
        model: 'claude',
        moderateContent: false,
      });

      expect(result.moderationResult).toBeUndefined();
      expect(mockModerationService.moderateText).not.toHaveBeenCalled();
    });

    it('should throw error for missing prompt', async () => {
      await expect(service.generateText({
        prompt: '',
      })).rejects.toThrow('Prompt is required for text generation');
    });

    it('should throw error for unsupported model', async () => {
      await expect(service.generateText({
        prompt: 'Test prompt',
        model: 'unsupported' as any,
      })).rejects.toThrow('Unsupported model: unsupported');
    });
  });

  describe('generateFromTemplate', () => {
    it('should generate text from template', async () => {
      const mockTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test template',
        template: 'Hello {{name}}, welcome to {{subject}}!',
        variables: ['name', 'subject'],
        model: 'claude' as const,
        category: 'content_generation' as const,
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: { content: [{ text: 'Hello John, welcome to Math!' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-id',
        inputTokens: 10,
        outputTokens: 20,
        cost: 0.05,
        cached: false,
      };

      mockPromptManager.buildPrompt.mockReturnValue('Hello John, welcome to Math!');
      mockPromptManager.getTemplate.mockReturnValue(mockTemplate);
      mockBedrockClient.invokeClaudeModel.mockResolvedValue(mockResponse);

      const result = await service.generateFromTemplate({
        templateId: 'test-template',
        templateVariables: { name: 'John', subject: 'Math' },
      });

      expect(result.text).toBe('Hello John, welcome to Math!');
      expect(mockPromptManager.buildPrompt).toHaveBeenCalledWith(
        'test-template',
        { name: 'John', subject: 'Math' }
      );
    });

    it('should throw error for missing template data', async () => {
      await expect(service.generateFromTemplate({
        templateId: '',
        templateVariables: {},
      })).rejects.toThrow('Template ID and variables are required for template-based generation');
    });
  });

  describe('generateContent', () => {
    it('should generate educational content', async () => {
      const mockResponse = {
        data: { content: [{ text: 'Generated lesson content' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-id',
        inputTokens: 15,
        outputTokens: 30,
        cost: 0.08,
        cached: false,
      };

      mockPromptManager.buildPrompt.mockReturnValue('Generated prompt');
      mockBedrockClient.invokeClaudeModel.mockResolvedValue(mockResponse);

      const result = await service.generateContent({
        contentType: 'lesson',
        subject: 'Mathematics',
        gradeLevel: '5th Grade',
        readingLevel: 'intermediate',
        duration: 45,
        includeAssessment: true,
        curriculumStandards: ['CCSS.MATH.5.NBT.1'],
      });

      expect(result.text).toBe('Generated lesson content');
      expect(mockPromptManager.buildPrompt).toHaveBeenCalledWith(
        'content_generation_basic',
        expect.objectContaining({
          contentType: 'lesson',
          subject: 'Mathematics',
          gradeLevel: '5th Grade',
          readingLevel: 'intermediate',
          duration: 45,
          includeAssessment: 'yes',
          curriculumStandards: 'CCSS.MATH.5.NBT.1',
        })
      );
    });
  });

  describe('generateCompanionResponse', () => {
    it('should generate Page companion response', async () => {
      const mockResponse = {
        data: { content: [{ text: 'Hi Sarah! Great job on that math problem!' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-id',
        inputTokens: 20,
        outputTokens: 25,
        cost: 0.06,
        cached: false,
      };

      mockPromptManager.buildPrompt.mockReturnValue('Generated companion prompt');
      mockBedrockClient.invokeClaudeModel.mockResolvedValue(mockResponse);

      const result = await service.generateCompanionResponse({
        studentName: 'Sarah',
        currentTopic: 'Fractions',
        recentProgress: 'Completed 3 exercises correctly',
        emotionalState: 'happy',
        platform: 'web',
        personalityTraits: {
          enthusiasm: 8,
          helpfulness: 9,
          humor: 6,
          formality: 4,
        },
        templateVariables: {
          studentMessage: 'I solved the problem!',
        },
      });

      expect(result.text).toBe('Hi Sarah! Great job on that math problem!');
      expect(mockPromptManager.buildPrompt).toHaveBeenCalledWith(
        'page_companion_response',
        expect.objectContaining({
          studentName: 'Sarah',
          currentTopic: 'Fractions',
          emotionalState: 'happy',
          platform: 'web',
          studentMessage: 'I solved the problem!',
        })
      );
    });
  });

  describe('generateAssessmentFeedback', () => {
    it('should generate assessment feedback', async () => {
      const mockResponse = {
        data: { content: [{ text: 'Great work! Your answer is correct.' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-id',
        inputTokens: 25,
        outputTokens: 35,
        cost: 0.09,
        cached: false,
      };

      mockPromptManager.buildPrompt.mockReturnValue('Generated feedback prompt');
      mockBedrockClient.invokeClaudeModel.mockResolvedValue(mockResponse);

      const result = await service.generateAssessmentFeedback({
        question: 'What is 2 + 2?',
        studentAnswer: '4',
        correctAnswer: '4',
        gradeLevel: '2nd Grade',
        subject: 'Mathematics',
        isCorrect: true,
      });

      expect(result.text).toBe('Great work! Your answer is correct.');
      expect(mockPromptManager.buildPrompt).toHaveBeenCalledWith(
        'assessment_feedback_detailed',
        expect.objectContaining({
          question: 'What is 2 + 2?',
          studentAnswer: '4',
          correctAnswer: '4',
          gradeLevel: '2nd Grade',
          subject: 'Mathematics',
          isCorrect: 'correct',
        })
      );
    });
  });

  describe('summarizeContent', () => {
    it('should summarize content using Cohere', async () => {
      const mockResponse = {
        data: { generations: [{ text: 'This is a summary of the content.' }] },
        modelId: 'cohere.command-text-v14',
        requestId: 'test-request-id',
        inputTokens: 50,
        outputTokens: 20,
        cost: 0.04,
        cached: false,
      };

      mockPromptManager.buildPrompt.mockReturnValue('Generated summary prompt');
      mockBedrockClient.invokeCohereModel.mockResolvedValue(mockResponse);

      const result = await service.summarizeContent(
        'Long content to be summarized...',
        '6th Grade',
        'medium',
        ['main concepts', 'key points']
      );

      expect(result.text).toBe('This is a summary of the content.');
      expect(mockPromptManager.buildPrompt).toHaveBeenCalledWith(
        'content_summarization',
        expect.objectContaining({
          content: 'Long content to be summarized...',
          gradeLevel: '6th Grade',
          summaryLength: 'medium',
          focusAreas: 'main concepts, key points',
        })
      );
    });
  });

  describe('batchGenerate', () => {
    it('should handle batch generation', async () => {
      const mockResponse1 = {
        data: { content: [{ text: 'Response 1' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-1',
        inputTokens: 10,
        outputTokens: 15,
        cost: 0.03,
        cached: false,
      };

      const mockResponse2 = {
        data: { content: [{ text: 'Response 2' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-2',
        inputTokens: 12,
        outputTokens: 18,
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeClaudeModel
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const requests = [
        { prompt: 'Prompt 1', model: 'claude' as const },
        { prompt: 'Prompt 2', model: 'claude' as const },
      ];

      const results = await service.batchGenerate(requests);

      expect(results).toHaveLength(2);
      expect(results[0].text).toBe('Response 1');
      expect(results[1].text).toBe('Response 2');
    });

    it('should handle partial failures in batch generation', async () => {
      const mockResponse = {
        data: { content: [{ text: 'Success response' }] },
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        requestId: 'test-request-1',
        inputTokens: 10,
        outputTokens: 15,
        cost: 0.03,
        cached: false,
      };

      mockBedrockClient.invokeClaudeModel
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(new Error('Generation failed'));

      const requests = [
        { prompt: 'Prompt 1', model: 'claude' as const },
        { prompt: 'Prompt 2', model: 'claude' as const },
      ];

      const results = await service.batchGenerate(requests);

      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('Success response');
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      mockPromptManager.getStats.mockReturnValue({
        totalTemplates: 5,
        templatesByModel: { claude: 3, cohere: 2 },
        templatesByCategory: { content_generation: 2, assessment_feedback: 3 },
      });

      const stats = service.getStats();

      expect(stats).toEqual({
        templatesAvailable: 5,
        modelsSupported: ['claude', 'titan', 'cohere'],
        moderationEnabled: true,
      });
    });
  });
});