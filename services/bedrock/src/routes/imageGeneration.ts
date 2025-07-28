import { Router } from 'express';
import { AppError } from '@pageflow/utils';

export function imageGenerationRouter(bedrockClient: any) {
  const router = Router();

  /**
   * Generate image using Stable Diffusion
   * Note: This is a placeholder implementation until Stable Diffusion access is configured
   */
  router.post('/generate', async (req, res, next) => {
    try {
      const { prompt, options } = req.body;

      if (!prompt) {
        throw new AppError('Prompt is required', 400);
      }

      try {
        const result = await bedrockClient.invokeStableDiffusionModel(prompt, options);
        
        res.status(200).json({
          success: true,
          data: {
            imageUrl: result.imageUrl,
            model: 'stability.stable-diffusion-xl',
            prompt
          }
        });
      } catch (error: any) {
        // If Stable Diffusion is not available, return a placeholder response
        if (error.message === 'Stable Diffusion access not configured') {
          res.status(200).json({
            success: true,
            data: {
              imageUrl: 'https://placeholder.com/512x512',
              model: 'placeholder',
              prompt,
              message: 'Stable Diffusion access not configured. This is a placeholder response.'
            }
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  });

  /**
   * Generate educational image
   */
  router.post('/educational', async (req, res, next) => {
    try {
      const { topic, learningLevel, style, accessibilityRequirements } = req.body;

      if (!topic || !learningLevel) {
        throw new AppError('Topic and learning level are required', 400);
      }

      // Build a prompt that incorporates educational requirements
      const prompt = `
        Create an educational image about "${topic}" for ${learningLevel} level learners.
        Style: ${style || 'clear, informative, engaging'}
        ${accessibilityRequirements ? `Ensure image meets these accessibility requirements: ${accessibilityRequirements.join(', ')}` : ''}
      `;

      try {
        const result = await bedrockClient.invokeStableDiffusionModel(prompt, {
          width: 512,
          height: 512,
          steps: 50
        });
        
        res.status(200).json({
          success: true,
          data: {
            imageUrl: result.imageUrl,
            model: 'stability.stable-diffusion-xl',
            metadata: {
              topic,
              learningLevel,
              style,
              prompt
            }
          }
        });
      } catch (error: any) {
        // If Stable Diffusion is not available, return a placeholder response
        if (error.message === 'Stable Diffusion access not configured') {
          res.status(200).json({
            success: true,
            data: {
              imageUrl: 'https://placeholder.com/512x512',
              model: 'placeholder',
              metadata: {
                topic,
                learningLevel,
                style,
                prompt,
                message: 'Stable Diffusion access not configured. This is a placeholder response.'
              }
            }
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  });

  return router;
}