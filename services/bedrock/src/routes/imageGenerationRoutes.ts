import { Router, Request, Response } from 'express';
import { logger } from '@pageflow/utils';
import { 
  imageGenerationService, 
  ImageGenerationRequest, 
  EducationalImageRequest, 
  LearningCharacterRequest, 
  DiagramRequest 
} from '../services/imageGenerationService';

const router = Router();

/**
 * Generate image from prompt
 * POST /api/images/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const request: ImageGenerationRequest = {
      prompt: req.body.prompt,
      negativePrompt: req.body.negativePrompt,
      style: req.body.style,
      width: req.body.width,
      height: req.body.height,
      cfgScale: req.body.cfgScale,
      steps: req.body.steps,
      seed: req.body.seed,
      options: req.body.options || {},
      moderateContent: req.body.moderateContent !== false,
      userId: req.body.userId || (req.headers['x-user-id'] as string) || 'anonymous',
    };

    if (!request.prompt || request.prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required for image generation',
        code: 'MISSING_PROMPT',
      });
    }

    // Validate dimensions
    if (request.width && (request.width < 64 || request.width > 1024)) {
      return res.status(400).json({
        error: 'Width must be between 64 and 1024 pixels',
        code: 'INVALID_WIDTH',
      });
    }

    if (request.height && (request.height < 64 || request.height > 1024)) {
      return res.status(400).json({
        error: 'Height must be between 64 and 1024 pixels',
        code: 'INVALID_HEIGHT',
      });
    }

    // Validate style
    const validStyles = [
      'photographic', 'digital-art', 'cinematic', 'anime', 'line-art', 
      'comic-book', 'analog-film', 'neon-punk', 'isometric', 'low-poly', 
      'origami', 'modeling-compound', 'fantasy-art', 'enhance', 'tile-texture'
    ];
    
    if (request.style && !validStyles.includes(request.style)) {
      return res.status(400).json({
        error: `Invalid style. Must be one of: ${validStyles.join(', ')}`,
        code: 'INVALID_STYLE',
      });
    }

    const result = await imageGenerationService.generateImage(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Image generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/generate',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Image generation failed',
      code: 'IMAGE_GENERATION_ERROR',
    });
  }
});

/**
 * Generate educational image
 * POST /api/images/educational
 */
router.post('/educational', async (req: Request, res: Response) => {
  try {
    const request: EducationalImageRequest = {
      prompt: req.body.prompt,
      subject: req.body.subject,
      gradeLevel: req.body.gradeLevel,
      contentType: req.body.contentType,
      educationalContext: req.body.educationalContext,
      ageAppropriate: req.body.ageAppropriate !== false,
      curriculumStandards: req.body.curriculumStandards || [],
      negativePrompt: req.body.negativePrompt,
      style: req.body.style,
      width: req.body.width,
      height: req.body.height,
      cfgScale: req.body.cfgScale,
      steps: req.body.steps,
      seed: req.body.seed,
      options: req.body.options || {},
      userId: req.body.userId || (req.headers['x-user-id'] as string) || 'anonymous',
    };

    if (!request.prompt || request.prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required for educational image generation',
        code: 'MISSING_PROMPT',
      });
    }

    if (!request.subject || !request.gradeLevel || !request.contentType || !request.educationalContext) {
      return res.status(400).json({
        error: 'Subject, grade level, content type, and educational context are required',
        code: 'MISSING_EDUCATIONAL_DATA',
      });
    }

    const validContentTypes = ['diagram', 'illustration', 'character', 'scene', 'infographic', 'concept-art'];
    if (!validContentTypes.includes(request.contentType)) {
      return res.status(400).json({
        error: `Invalid content type. Must be one of: ${validContentTypes.join(', ')}`,
        code: 'INVALID_CONTENT_TYPE',
      });
    }

    const result = await imageGenerationService.generateEducationalImage(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Educational image generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/educational',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Educational image generation failed',
      code: 'EDUCATIONAL_IMAGE_ERROR',
    });
  }
});

/**
 * Generate learning character
 * POST /api/images/character
 */
router.post('/character', async (req: Request, res: Response) => {
  try {
    const request: LearningCharacterRequest = {
      prompt: req.body.prompt,
      characterName: req.body.characterName,
      characterType: req.body.characterType,
      personality: req.body.personality,
      setting: req.body.setting,
      emotion: req.body.emotion || 'happy',
      platform: req.body.platform || 'web',
      negativePrompt: req.body.negativePrompt,
      style: req.body.style,
      width: req.body.width,
      height: req.body.height,
      cfgScale: req.body.cfgScale,
      steps: req.body.steps,
      seed: req.body.seed,
      options: req.body.options || {},
      userId: req.body.userId || (req.headers['x-user-id'] as string) || 'anonymous',
    };

    if (!request.prompt || request.prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required for character generation',
        code: 'MISSING_PROMPT',
      });
    }

    if (!request.characterName || !request.characterType || !request.personality) {
      return res.status(400).json({
        error: 'Character name, type, and personality are required',
        code: 'MISSING_CHARACTER_DATA',
      });
    }

    const validCharacterTypes = ['mascot', 'historical-figure', 'scientist', 'explorer', 'teacher', 'student'];
    if (!validCharacterTypes.includes(request.characterType)) {
      return res.status(400).json({
        error: `Invalid character type. Must be one of: ${validCharacterTypes.join(', ')}`,
        code: 'INVALID_CHARACTER_TYPE',
      });
    }

    const validEmotions = ['happy', 'excited', 'curious', 'thoughtful', 'encouraging', 'surprised'];
    if (!validEmotions.includes(request.emotion!)) {
      return res.status(400).json({
        error: `Invalid emotion. Must be one of: ${validEmotions.join(', ')}`,
        code: 'INVALID_EMOTION',
      });
    }

    const validPlatforms = ['web', 'mobile', 'ar', 'vr'];
    if (!validPlatforms.includes(request.platform!)) {
      return res.status(400).json({
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`,
        code: 'INVALID_PLATFORM',
      });
    }

    const result = await imageGenerationService.generateLearningCharacter(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Character generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/character',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Character generation failed',
      code: 'CHARACTER_GENERATION_ERROR',
    });
  }
});

/**
 * Generate diagram
 * POST /api/images/diagram
 */
router.post('/diagram', async (req: Request, res: Response) => {
  try {
    const request: DiagramRequest = {
      prompt: req.body.prompt,
      diagramType: req.body.diagramType,
      elements: req.body.elements,
      relationships: req.body.relationships || [],
      labels: req.body.labels !== false,
      colorScheme: req.body.colorScheme || 'educational',
      negativePrompt: req.body.negativePrompt,
      style: req.body.style,
      width: req.body.width,
      height: req.body.height,
      cfgScale: req.body.cfgScale,
      steps: req.body.steps,
      seed: req.body.seed,
      options: req.body.options || {},
      userId: req.body.userId || (req.headers['x-user-id'] as string) || 'anonymous',
    };

    if (!request.prompt || request.prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required for diagram generation',
        code: 'MISSING_PROMPT',
      });
    }

    if (!request.diagramType || !Array.isArray(request.elements) || request.elements.length === 0) {
      return res.status(400).json({
        error: 'Diagram type and elements array are required',
        code: 'MISSING_DIAGRAM_DATA',
      });
    }

    const validDiagramTypes = ['flowchart', 'mind-map', 'timeline', 'process', 'comparison', 'cycle', 'hierarchy', 'network'];
    if (!validDiagramTypes.includes(request.diagramType)) {
      return res.status(400).json({
        error: `Invalid diagram type. Must be one of: ${validDiagramTypes.join(', ')}`,
        code: 'INVALID_DIAGRAM_TYPE',
      });
    }

    const validColorSchemes = ['educational', 'professional', 'colorful', 'monochrome'];
    if (!validColorSchemes.includes(request.colorScheme!)) {
      return res.status(400).json({
        error: `Invalid color scheme. Must be one of: ${validColorSchemes.join(', ')}`,
        code: 'INVALID_COLOR_SCHEME',
      });
    }

    const result = await imageGenerationService.generateDiagram(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Diagram generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/diagram',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Diagram generation failed',
      code: 'DIAGRAM_GENERATION_ERROR',
    });
  }
});

/**
 * Generate image variations
 * POST /api/images/variations
 */
router.post('/variations', async (req: Request, res: Response) => {
  try {
    const { variationCount = 3, ...baseRequest } = req.body;

    if (!baseRequest.prompt || baseRequest.prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required for image variations',
        code: 'MISSING_PROMPT',
      });
    }

    if (variationCount < 1 || variationCount > 10) {
      return res.status(400).json({
        error: 'Variation count must be between 1 and 10',
        code: 'INVALID_VARIATION_COUNT',
      });
    }

    const request: ImageGenerationRequest = {
      ...baseRequest,
      userId: baseRequest.userId || (req.headers['x-user-id'] as string) || 'anonymous',
      options: baseRequest.options || {},
      moderateContent: baseRequest.moderateContent !== false,
    };

    const results = await imageGenerationService.generateVariations(request, variationCount);
    
    res.json({
      success: true,
      data: {
        variations: results,
        count: results.length,
        requestedCount: variationCount,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Image variations endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/variations',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Image variations generation failed',
      code: 'VARIATIONS_ERROR',
    });
  }
});

/**
 * Get image generation statistics
 * GET /api/images/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = imageGenerationService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error({
      message: 'Image generation stats endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/stats',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to retrieve image generation statistics',
      code: 'STATS_ERROR',
    });
  }
});

export { router as imageGenerationRoutes };