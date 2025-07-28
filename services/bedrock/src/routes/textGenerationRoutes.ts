import { Router, Request, Response } from 'express';
import { logger } from '@pageflow/utils';
import { textGenerationService, TextGenerationRequest, ContentGenerationRequest, CompanionResponseRequest, AssessmentFeedbackRequest } from '../services/textGenerationService';
import { promptManager } from '../services/promptManager';
import { contentModerationService } from '../services/contentModerationService';

const router = Router();

/**
 * Generate text from a direct prompt
 * POST /api/text-generation/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const request: TextGenerationRequest = {
      prompt: req.body.prompt,
      model: req.body.model || 'claude',
      options: req.body.options || {},
      moderateContent: req.body.moderateContent !== false,
      userId: req.body.userId || req.headers['x-user-id'] as string,
    };

    if (!request.prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        code: 'MISSING_PROMPT',
      });
    }

    const result = await textGenerationService.generateText(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Text generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/generate',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Text generation failed',
      code: 'GENERATION_ERROR',
    });
  }
});

/**
 * Generate text from a template
 * POST /api/text-generation/template
 */
router.post('/template', async (req: Request, res: Response) => {
  try {
    const request: TextGenerationRequest = {
      templateId: req.body.templateId,
      templateVariables: req.body.templateVariables,
      model: req.body.model,
      options: req.body.options || {},
      moderateContent: req.body.moderateContent !== false,
      userId: req.body.userId || req.headers['x-user-id'] as string,
    };

    if (!request.templateId || !request.templateVariables) {
      return res.status(400).json({
        error: 'Template ID and variables are required',
        code: 'MISSING_TEMPLATE_DATA',
      });
    }

    const result = await textGenerationService.generateFromTemplate(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Template generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/template',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Template generation failed',
      code: 'TEMPLATE_GENERATION_ERROR',
    });
  }
});

/**
 * Generate educational content
 * POST /api/text-generation/content
 */
router.post('/content', async (req: Request, res: Response) => {
  try {
    const request: ContentGenerationRequest = {
      contentType: req.body.contentType,
      subject: req.body.subject,
      gradeLevel: req.body.gradeLevel,
      readingLevel: req.body.readingLevel || 'intermediate',
      duration: req.body.duration,
      includeAssessment: req.body.includeAssessment || false,
      curriculumStandards: req.body.curriculumStandards || [],
      options: req.body.options || {},
      userId: req.body.userId || req.headers['x-user-id'] as string,
    };

    if (!request.contentType || !request.subject || !request.gradeLevel) {
      return res.status(400).json({
        error: 'Content type, subject, and grade level are required',
        code: 'MISSING_CONTENT_DATA',
      });
    }

    const validContentTypes = ['lesson', 'quiz', 'explanation', 'summary', 'feedback'];
    if (!validContentTypes.includes(request.contentType)) {
      return res.status(400).json({
        error: `Invalid content type. Must be one of: ${validContentTypes.join(', ')}`,
        code: 'INVALID_CONTENT_TYPE',
      });
    }

    const result = await textGenerationService.generateContent(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Content generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/content',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Content generation failed',
      code: 'CONTENT_GENERATION_ERROR',
    });
  }
});

/**
 * Generate Page companion response
 * POST /api/text-generation/companion
 */
router.post('/companion', async (req: Request, res: Response) => {
  try {
    const request: CompanionResponseRequest = {
      studentName: req.body.studentName,
      currentTopic: req.body.currentTopic,
      recentProgress: req.body.recentProgress,
      emotionalState: req.body.emotionalState || 'neutral',
      platform: req.body.platform || 'web',
      personalityTraits: req.body.personalityTraits || {
        enthusiasm: 7,
        helpfulness: 8,
        humor: 5,
        formality: 4,
      },
      templateVariables: {
        studentMessage: req.body.studentMessage || '',
        ...req.body.templateVariables,
      },
      options: req.body.options || {},
      userId: req.body.userId || req.headers['x-user-id'] as string,
    };

    if (!request.studentName || !request.currentTopic) {
      return res.status(400).json({
        error: 'Student name and current topic are required',
        code: 'MISSING_COMPANION_DATA',
      });
    }

    const validEmotionalStates = ['neutral', 'happy', 'frustrated', 'confused', 'excited'];
    if (!validEmotionalStates.includes(request.emotionalState)) {
      return res.status(400).json({
        error: `Invalid emotional state. Must be one of: ${validEmotionalStates.join(', ')}`,
        code: 'INVALID_EMOTIONAL_STATE',
      });
    }

    const validPlatforms = ['web', 'mobile', 'ar', 'vr'];
    if (!validPlatforms.includes(request.platform)) {
      return res.status(400).json({
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`,
        code: 'INVALID_PLATFORM',
      });
    }

    const result = await textGenerationService.generateCompanionResponse(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Companion response endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/companion',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Companion response generation failed',
      code: 'COMPANION_GENERATION_ERROR',
    });
  }
});

/**
 * Generate assessment feedback
 * POST /api/text-generation/feedback
 */
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const request: AssessmentFeedbackRequest = {
      question: req.body.question,
      studentAnswer: req.body.studentAnswer,
      correctAnswer: req.body.correctAnswer,
      gradeLevel: req.body.gradeLevel,
      subject: req.body.subject,
      isCorrect: req.body.isCorrect,
      options: req.body.options || {},
      userId: req.body.userId || req.headers['x-user-id'] as string,
    };

    if (!request.question || !request.studentAnswer || !request.correctAnswer || !request.gradeLevel || !request.subject) {
      return res.status(400).json({
        error: 'Question, student answer, correct answer, grade level, and subject are required',
        code: 'MISSING_FEEDBACK_DATA',
      });
    }

    const result = await textGenerationService.generateAssessmentFeedback(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Assessment feedback endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/feedback',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Assessment feedback generation failed',
      code: 'FEEDBACK_GENERATION_ERROR',
    });
  }
});

/**
 * Summarize content
 * POST /api/text-generation/summarize
 */
router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const {
      content,
      gradeLevel,
      summaryLength = 'medium',
      focusAreas = [],
      options = {},
      userId,
    } = req.body;

    if (!content || !gradeLevel) {
      return res.status(400).json({
        error: 'Content and grade level are required',
        code: 'MISSING_SUMMARIZATION_DATA',
      });
    }

    const validSummaryLengths = ['short', 'medium', 'long'];
    if (!validSummaryLengths.includes(summaryLength)) {
      return res.status(400).json({
        error: `Invalid summary length. Must be one of: ${validSummaryLengths.join(', ')}`,
        code: 'INVALID_SUMMARY_LENGTH',
      });
    }

    const result = await textGenerationService.summarizeContent(
      content,
      gradeLevel,
      summaryLength,
      focusAreas,
      options,
      userId || req.headers['x-user-id'] as string
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Content summarization endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/summarize',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Content summarization failed',
      code: 'SUMMARIZATION_ERROR',
    });
  }
});

/**
 * Batch generate multiple texts
 * POST /api/text-generation/batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: 'Requests array is required and must not be empty',
        code: 'MISSING_BATCH_REQUESTS',
      });
    }

    if (requests.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 requests allowed per batch',
        code: 'BATCH_SIZE_EXCEEDED',
      });
    }

    const results = await textGenerationService.batchGenerate(requests);
    
    res.json({
      success: true,
      data: {
        results,
        successCount: results.length,
        totalRequests: requests.length,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Batch generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/batch',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Batch generation failed',
      code: 'BATCH_GENERATION_ERROR',
    });
  }
});

/**
 * Get available prompt templates
 * GET /api/text-generation/templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { category, model } = req.query;

    let templates = promptManager.getAllTemplates();

    if (category) {
      templates = promptManager.getTemplatesByCategory(category as any);
    }

    if (model) {
      templates = templates.filter(template => template.model === model);
    }

    res.json({
      success: true,
      data: {
        templates: templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          model: template.model,
          category: template.category,
          variables: template.variables,
          version: template.version,
        })),
        count: templates.length,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Templates endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/templates',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to retrieve templates',
      code: 'TEMPLATES_ERROR',
    });
  }
});

/**
 * Moderate content
 * POST /api/text-generation/moderate
 */
router.post('/moderate', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required for moderation',
        code: 'MISSING_TEXT',
      });
    }

    const result = await contentModerationService.moderateText(text);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Content moderation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/moderate',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Content moderation failed',
      code: 'MODERATION_ERROR',
    });
  }
});

/**
 * Get service statistics
 * GET /api/text-generation/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const textGenStats = textGenerationService.getStats();
    const promptStats = promptManager.getStats();
    const moderationStats = contentModerationService.getStats();

    res.json({
      success: true,
      data: {
        textGeneration: textGenStats,
        prompts: promptStats,
        moderation: moderationStats,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Stats endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/stats',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to retrieve statistics',
      code: 'STATS_ERROR',
    });
  }
});

export { router as textGenerationRoutes };