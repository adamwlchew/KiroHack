import { Router } from 'express';
import { AppError } from '@pageflow/utils';

export function textGenerationRouter(bedrockClient: any) {
  const router = Router();

  /**
   * Generate text using Claude model
   */
  router.post('/claude', async (req, res, next) => {
    try {
      const { prompt, options } = req.body;

      if (!prompt) {
        throw new AppError('Prompt is required', 400);
      }

      const result = await bedrockClient.invokeClaudeModel(prompt, options);

      res.status(200).json({
        success: true,
        data: {
          text: result.content[0].text,
          model: 'anthropic.claude-3-sonnet',
          usage: {
            inputTokens: result.usage?.input_tokens || 0,
            outputTokens: result.usage?.output_tokens || 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Generate text using Titan model
   */
  router.post('/titan', async (req, res, next) => {
    try {
      const { prompt, options } = req.body;

      if (!prompt) {
        throw new AppError('Prompt is required', 400);
      }

      const result = await bedrockClient.invokeTitanModel(prompt, options);

      res.status(200).json({
        success: true,
        data: {
          text: result.results[0].outputText,
          model: 'amazon.titan-text-express-v1',
          usage: {
            inputTokens: result.inputTextTokenCount || 0,
            outputTokens: result.results[0].tokenCount || 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Generate educational content aligned with curriculum standards
   */
  router.post('/educational-content', async (req, res, next) => {
    try {
      const { topic, learningLevel, curriculumStandards, accessibilityRequirements } = req.body;

      if (!topic || !learningLevel) {
        throw new AppError('Topic and learning level are required', 400);
      }

      // Build a prompt that incorporates curriculum standards and accessibility requirements
      const prompt = `
        Generate educational content about "${topic}" for ${learningLevel} level learners.
        ${curriculumStandards ? `Align with these curriculum standards: ${curriculumStandards.join(', ')}` : ''}
        ${accessibilityRequirements ? `Ensure content meets these accessibility requirements: ${accessibilityRequirements.join(', ')}` : ''}
        
        The content should be engaging, accurate, and educational. Include:
        1. A brief introduction to the topic
        2. Key concepts and explanations
        3. Examples or illustrations of the concepts
        4. Questions for reflection or assessment
      `;

      const result = await bedrockClient.invokeClaudeModel(prompt, {
        maxTokens: 2000,
        temperature: 0.7
      });

      res.status(200).json({
        success: true,
        data: {
          content: result.content[0].text,
          metadata: {
            topic,
            learningLevel,
            curriculumStandards,
            generationModel: 'anthropic.claude-3-sonnet'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}