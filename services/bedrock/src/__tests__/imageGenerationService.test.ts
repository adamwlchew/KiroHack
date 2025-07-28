import { ImageGenerationService } from '../services/imageGenerationService';
import { bedrockClient } from '../clients/bedrockClient';
import { contentModerationService } from '../services/contentModerationService';

// Mock dependencies
jest.mock('../clients/bedrockClient');
jest.mock('../services/contentModerationService');

describe('ImageGenerationService', () => {
  let service: ImageGenerationService;
  let mockBedrockClient: jest.Mocked<typeof bedrockClient>;
  let mockModerationService: jest.Mocked<typeof contentModerationService>;

  beforeEach(() => {
    service = new ImageGenerationService();
    mockBedrockClient = bedrockClient as jest.Mocked<typeof bedrockClient>;
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

  describe('generateImage', () => {
    it('should generate image from prompt', async () => {
      const mockResponse = {
        data: {
          artifacts: [
            {
              base64: 'base64-image-data',
              seed: 12345,
              finishReason: 'SUCCESS',
            },
          ],
        },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      const result = await service.generateImage({
        prompt: 'A beautiful landscape',
        style: 'photographic',
        width: 512,
        height: 512,
        userId: 'test-user',
      });

      expect(result).toMatchObject({
        images: [
          {
            base64: 'base64-image-data',
            seed: 12345,
            finishReason: 'SUCCESS',
          },
        ],
        modelUsed: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      });

      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledWith(
        expect.stringContaining('A beautiful landscape'),
        expect.objectContaining({
          width: 512,
          height: 512,
          userId: 'test-user',
        })
      );
    });

    it('should moderate content when enabled', async () => {
      mockModerationService.moderateText.mockResolvedValue({
        flagged: true,
        categories: ['inappropriate_language'],
        confidence: 0.9,
      });

      await expect(service.generateImage({
        prompt: 'Inappropriate content',
        moderateContent: true,
      })).rejects.toThrow('Image generation prompt violates content policy');

      expect(mockModerationService.moderateText).toHaveBeenCalledWith('Inappropriate content');
    });

    it('should skip moderation when disabled', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'image-data', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      const result = await service.generateImage({
        prompt: 'Test prompt',
        moderateContent: false,
      });

      expect(result.moderationResult).toBeUndefined();
      expect(mockModerationService.moderateText).not.toHaveBeenCalled();
    });

    it('should throw error for empty prompt', async () => {
      await expect(service.generateImage({
        prompt: '',
      })).rejects.toThrow('Prompt is required for image generation');
    });

    it('should enhance prompt with style modifiers', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'image-data', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      await service.generateImage({
        prompt: 'A cat',
        style: 'anime',
      });

      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledWith(
        expect.stringContaining('anime style'),
        expect.any(Object)
      );
    });
  });

  describe('generateEducationalImage', () => {
    it('should generate educational image with appropriate enhancements', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'educational-image', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      const result = await service.generateEducationalImage({
        prompt: 'Solar system diagram',
        subject: 'Science',
        gradeLevel: '5th Grade',
        contentType: 'diagram',
        educationalContext: 'Astronomy lesson about planets',
        ageAppropriate: true,
        curriculumStandards: ['NGSS.5-ESS1-1'],
        userId: 'test-user',
      });

      expect(result.images).toHaveLength(1);
      expect(result.images[0].base64).toBe('educational-image');

      // Should enhance prompt with educational context
      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledWith(
        expect.stringContaining('Educational diagram for 5th Grade Science'),
        expect.any(Object)
      );
    });

    it('should use appropriate style for content type', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'diagram-image', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      await service.generateEducationalImage({
        prompt: 'Water cycle',
        subject: 'Science',
        gradeLevel: '3rd Grade',
        contentType: 'diagram',
        educationalContext: 'Water cycle explanation',
      });

      // Diagrams should use line-art style
      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledWith(
        expect.stringContaining('line art'),
        expect.any(Object)
      );
    });
  });

  describe('generateLearningCharacter', () => {
    it('should generate learning character with personality traits', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'character-image', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      const result = await service.generateLearningCharacter({
        prompt: 'Friendly science teacher',
        characterName: 'Dr. Science',
        characterType: 'teacher',
        personality: 'enthusiastic and helpful',
        setting: 'classroom',
        emotion: 'excited',
        platform: 'web',
        userId: 'test-user',
      });

      expect(result.images).toHaveLength(1);
      expect(result.images[0].base64).toBe('character-image');

      // Should enhance prompt with character details
      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledWith(
        expect.stringContaining('teacher character named Dr. Science'),
        expect.any(Object)
      );
    });

    it('should adapt style for different platforms', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'vr-character', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      await service.generateLearningCharacter({
        prompt: 'VR mascot',
        characterName: 'VR Buddy',
        characterType: 'mascot',
        personality: 'friendly',
        platform: 'vr',
      });

      // VR characters should use low-poly style
      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledWith(
        expect.stringContaining('low poly'),
        expect.any(Object)
      );
    });
  });

  describe('generateDiagram', () => {
    it('should generate diagram with specified elements', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'diagram-image', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      const result = await service.generateDiagram({
        prompt: 'Process flow',
        diagramType: 'flowchart',
        elements: ['Start', 'Process', 'Decision', 'End'],
        relationships: ['Start -> Process', 'Process -> Decision'],
        labels: true,
        colorScheme: 'professional',
        userId: 'test-user',
      });

      expect(result.images).toHaveLength(1);
      expect(result.images[0].base64).toBe('diagram-image');

      // Should enhance prompt with diagram details
      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledWith(
        expect.stringContaining('flowchart diagram'),
        expect.any(Object)
      );
    });

    it('should use appropriate style for diagram type', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'mindmap-image', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'test-request-id',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel.mockResolvedValue(mockResponse);

      await service.generateDiagram({
        prompt: 'Topic overview',
        diagramType: 'mind-map',
        elements: ['Central Topic', 'Branch 1', 'Branch 2'],
        colorScheme: 'colorful',
      });

      // Colorful mind-maps should use digital-art style
      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledWith(
        expect.stringContaining('digital art'),
        expect.any(Object)
      );
    });
  });

  describe('generateVariations', () => {
    it('should generate multiple variations of an image', async () => {
      const mockResponse1 = {
        data: { artifacts: [{ base64: 'variation-1', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'request-1',
        cost: 0.04,
        cached: false,
      };

      const mockResponse2 = {
        data: { artifacts: [{ base64: 'variation-2', seed: 124, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'request-2',
        cost: 0.04,
        cached: false,
      };

      const mockResponse3 = {
        data: { artifacts: [{ base64: 'variation-3', seed: 125, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'request-3',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)
        .mockResolvedValueOnce(mockResponse3);

      const results = await service.generateVariations({
        prompt: 'Test image',
        seed: 123,
      }, 3);

      expect(results).toHaveLength(3);
      expect(results[0].images[0].base64).toBe('variation-1');
      expect(results[1].images[0].base64).toBe('variation-2');
      expect(results[2].images[0].base64).toBe('variation-3');
      expect(mockBedrockClient.invokeStableDiffusionModel).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in variations', async () => {
      const mockResponse = {
        data: { artifacts: [{ base64: 'success-variation', seed: 123, finishReason: 'SUCCESS' }] },
        modelId: 'stability.stable-diffusion-xl-v1',
        requestId: 'request-1',
        cost: 0.04,
        cached: false,
      };

      mockBedrockClient.invokeStableDiffusionModel
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(new Error('Generation failed'));

      const results = await service.generateVariations({
        prompt: 'Test image',
      }, 2);

      expect(results).toHaveLength(1);
      expect(results[0].images[0].base64).toBe('success-variation');
    });

    it('should throw error for invalid variation count', async () => {
      await expect(service.generateVariations({
        prompt: 'Test image',
      }, 0)).rejects.toThrow('Variation count must be between 1 and 10');

      await expect(service.generateVariations({
        prompt: 'Test image',
      }, 11)).rejects.toThrow('Variation count must be between 1 and 10');
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      const stats = service.getStats();

      expect(stats).toEqual({
        supportedModels: ['stability.stable-diffusion-xl-v1'],
        supportedStyles: expect.arrayContaining([
          'photographic', 'digital-art', 'cinematic', 'anime', 'line-art'
        ]),
        maxImageSize: { width: 1024, height: 1024 },
        supportedFormats: ['base64'],
        educationalContentTypes: ['diagram', 'illustration', 'character', 'scene', 'infographic', 'concept-art'],
        characterTypes: ['mascot', 'historical-figure', 'scientist', 'explorer', 'teacher', 'student'],
        diagramTypes: ['flowchart', 'mind-map', 'timeline', 'process', 'comparison', 'cycle', 'hierarchy', 'network'],
      });
    });
  });
});