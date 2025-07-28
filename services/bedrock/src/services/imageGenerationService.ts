import { logger } from '@pageflow/utils';
import { bedrockClient, ImageGenerationOptions } from '../clients/bedrockClient';
import { contentModerationService } from './contentModerationService';

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  style?: 'photographic' | 'digital-art' | 'cinematic' | 'anime' | 'line-art' | 'comic-book' | 'analog-film' | 'neon-punk' | 'isometric' | 'low-poly' | 'origami' | 'modeling-compound' | 'cinematic' | 'fantasy-art' | 'enhance' | 'tile-texture';
  width?: number;
  height?: number;
  cfgScale?: number;
  steps?: number;
  seed?: number;
  options?: ImageGenerationOptions;
  moderateContent?: boolean;
  userId?: string;
}

export interface ImageGenerationResponse {
  images: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
  modelUsed: string;
  requestId: string;
  cost: number;
  cached: boolean;
  moderationResult?: {
    flagged: boolean;
    categories: string[];
    confidence: number;
  };
}

export interface EducationalImageRequest extends ImageGenerationRequest {
  subject: string;
  gradeLevel: string;
  contentType: 'diagram' | 'illustration' | 'character' | 'scene' | 'infographic' | 'concept-art';
  educationalContext: string;
  ageAppropriate?: boolean;
  curriculumStandards?: string[];
}

export interface LearningCharacterRequest extends ImageGenerationRequest {
  characterName: string;
  characterType: 'mascot' | 'historical-figure' | 'scientist' | 'explorer' | 'teacher' | 'student';
  personality: string;
  setting?: string;
  emotion?: 'happy' | 'excited' | 'curious' | 'thoughtful' | 'encouraging' | 'surprised';
  platform: 'web' | 'mobile' | 'ar' | 'vr';
}

export interface DiagramRequest extends ImageGenerationRequest {
  diagramType: 'flowchart' | 'mind-map' | 'timeline' | 'process' | 'comparison' | 'cycle' | 'hierarchy' | 'network';
  elements: string[];
  relationships?: string[];
  labels?: boolean;
  colorScheme?: 'educational' | 'professional' | 'colorful' | 'monochrome';
}

export class ImageGenerationService {
  /**
   * Generate image from prompt
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const {
      prompt,
      negativePrompt,
      style,
      width,
      height,
      cfgScale,
      steps,
      seed,
      options = {},
      moderateContent = true,
      userId,
    } = request;

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required for image generation');
    }

    logger.info({
      message: 'Starting image generation',
      promptLength: prompt.length,
      style,
      width,
      height,
      userId,
    });

    try {
      // Moderate prompt if requested
      if (moderateContent) {
        const moderationResult = await contentModerationService.moderateText(prompt);
        
        if (moderationResult.flagged && moderationResult.confidence > 0.7) {
          logger.warn({
            message: 'Image generation prompt flagged by moderation',
            categories: moderationResult.categories,
            confidence: moderationResult.confidence,
          });
          
          throw new Error('Image generation prompt violates content policy');
        }
      }

      // Build enhanced prompt with style and educational context
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, style, negativePrompt);

      // Generate image using Stable Diffusion
      const response = await bedrockClient.invokeStableDiffusionModel(enhancedPrompt, {
        width,
        height,
        cfgScale,
        steps,
        seed,
        ...options,
        userId,
      });

      const result: ImageGenerationResponse = {
        images: response.data.artifacts || [],
        modelUsed: response.modelId,
        requestId: response.requestId,
        cost: response.cost,
        cached: response.cached,
      };

      logger.info({
        message: 'Image generation completed',
        requestId: response.requestId,
        imageCount: result.images.length,
        cached: response.cached,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Image generation failed',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate educational image
   */
  async generateEducationalImage(request: EducationalImageRequest): Promise<ImageGenerationResponse> {
    const {
      subject,
      gradeLevel,
      contentType,
      educationalContext,
      ageAppropriate = true,
      curriculumStandards = [],
      ...baseRequest
    } = request;

    // Build educational prompt
    const educationalPrompt = this.buildEducationalPrompt({
      originalPrompt: baseRequest.prompt,
      subject,
      gradeLevel,
      contentType,
      educationalContext,
      ageAppropriate,
      curriculumStandards,
    });

    // Set appropriate style for educational content
    const educationalStyle = this.getEducationalStyle(contentType, gradeLevel);

    // Build negative prompt for educational appropriateness
    const educationalNegativePrompt = this.buildEducationalNegativePrompt(
      baseRequest.negativePrompt,
      ageAppropriate
    );

    logger.info({
      message: 'Generating educational image',
      subject,
      gradeLevel,
      contentType,
      userId: baseRequest.userId,
    });

    return await this.generateImage({
      ...baseRequest,
      prompt: educationalPrompt,
      negativePrompt: educationalNegativePrompt,
      style: educationalStyle,
      moderateContent: true, // Always moderate educational content
    });
  }

  /**
   * Generate learning character image
   */
  async generateLearningCharacter(request: LearningCharacterRequest): Promise<ImageGenerationResponse> {
    const {
      characterName,
      characterType,
      personality,
      setting,
      emotion = 'happy',
      platform,
      ...baseRequest
    } = request;

    // Build character prompt
    const characterPrompt = this.buildCharacterPrompt({
      originalPrompt: baseRequest.prompt,
      characterName,
      characterType,
      personality,
      setting,
      emotion,
      platform,
    });

    // Set appropriate style for character
    const characterStyle = this.getCharacterStyle(characterType, platform);

    // Build negative prompt for character appropriateness
    const characterNegativePrompt = this.buildCharacterNegativePrompt(baseRequest.negativePrompt);

    logger.info({
      message: 'Generating learning character',
      characterName,
      characterType,
      emotion,
      platform,
      userId: baseRequest.userId,
    });

    return await this.generateImage({
      ...baseRequest,
      prompt: characterPrompt,
      negativePrompt: characterNegativePrompt,
      style: characterStyle,
      moderateContent: true,
    });
  }

  /**
   * Generate diagram image
   */
  async generateDiagram(request: DiagramRequest): Promise<ImageGenerationResponse> {
    const {
      diagramType,
      elements,
      relationships = [],
      labels = true,
      colorScheme = 'educational',
      ...baseRequest
    } = request;

    // Build diagram prompt
    const diagramPrompt = this.buildDiagramPrompt({
      originalPrompt: baseRequest.prompt,
      diagramType,
      elements,
      relationships,
      labels,
      colorScheme,
    });

    // Set appropriate style for diagrams
    const diagramStyle = this.getDiagramStyle(diagramType, colorScheme);

    // Build negative prompt for clean diagrams
    const diagramNegativePrompt = this.buildDiagramNegativePrompt(baseRequest.negativePrompt);

    logger.info({
      message: 'Generating diagram',
      diagramType,
      elementCount: elements.length,
      colorScheme,
      userId: baseRequest.userId,
    });

    return await this.generateImage({
      ...baseRequest,
      prompt: diagramPrompt,
      negativePrompt: diagramNegativePrompt,
      style: diagramStyle,
      moderateContent: true,
    });
  }

  /**
   * Generate multiple variations of an image
   */
  async generateVariations(
    baseRequest: ImageGenerationRequest,
    variationCount: number = 3
  ): Promise<ImageGenerationResponse[]> {
    if (variationCount < 1 || variationCount > 10) {
      throw new Error('Variation count must be between 1 and 10');
    }

    logger.info({
      message: 'Generating image variations',
      variationCount,
      userId: baseRequest.userId,
    });

    const variations = await Promise.allSettled(
      Array.from({ length: variationCount }, (_, index) => {
        // Use different seeds for variations
        const variationRequest = {
          ...baseRequest,
          seed: baseRequest.seed ? baseRequest.seed + index : undefined,
        };
        
        return this.generateImage(variationRequest);
      })
    );

    const results: ImageGenerationResponse[] = [];
    const errors: Error[] = [];

    variations.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        logger.error({
          message: 'Image variation generation failed',
          index,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        errors.push(result.reason);
      }
    });

    logger.info({
      message: 'Image variations generation completed',
      successCount: results.length,
      errorCount: errors.length,
    });

    return results;
  }

  /**
   * Build enhanced prompt with style and context
   */
  private buildEnhancedPrompt(prompt: string, style?: string, negativePrompt?: string): string {
    let enhancedPrompt = prompt;

    // Add style modifiers
    if (style) {
      const styleModifiers = this.getStyleModifiers(style);
      enhancedPrompt = `${enhancedPrompt}, ${styleModifiers}`;
    }

    // Add quality modifiers
    enhancedPrompt = `${enhancedPrompt}, high quality, detailed, professional`;

    return enhancedPrompt;
  }

  /**
   * Build educational prompt
   */
  private buildEducationalPrompt(params: {
    originalPrompt: string;
    subject: string;
    gradeLevel: string;
    contentType: string;
    educationalContext: string;
    ageAppropriate: boolean;
    curriculumStandards: string[];
  }): string {
    const {
      originalPrompt,
      subject,
      gradeLevel,
      contentType,
      educationalContext,
      ageAppropriate,
    } = params;

    let prompt = `Educational ${contentType} for ${gradeLevel} ${subject}: ${originalPrompt}`;
    
    if (educationalContext) {
      prompt += `, ${educationalContext}`;
    }

    if (ageAppropriate) {
      prompt += ', age-appropriate, safe for children';
    }

    prompt += ', clear, educational, informative, engaging';

    return prompt;
  }

  /**
   * Build character prompt
   */
  private buildCharacterPrompt(params: {
    originalPrompt: string;
    characterName: string;
    characterType: string;
    personality: string;
    setting?: string;
    emotion: string;
    platform: string;
  }): string {
    const {
      originalPrompt,
      characterName,
      characterType,
      personality,
      setting,
      emotion,
      platform,
    } = params;

    let prompt = `${characterType} character named ${characterName}: ${originalPrompt}`;
    prompt += `, ${personality} personality, ${emotion} expression`;

    if (setting) {
      prompt += `, in ${setting}`;
    }

    // Add platform-specific modifiers
    switch (platform) {
      case 'ar':
      case 'vr':
        prompt += ', 3D style, suitable for AR/VR';
        break;
      case 'mobile':
        prompt += ', simple design, mobile-friendly';
        break;
      default:
        prompt += ', 2D illustration style';
    }

    prompt += ', friendly, approachable, educational mascot';

    return prompt;
  }

  /**
   * Build diagram prompt
   */
  private buildDiagramPrompt(params: {
    originalPrompt: string;
    diagramType: string;
    elements: string[];
    relationships: string[];
    labels: boolean;
    colorScheme: string;
  }): string {
    const {
      originalPrompt,
      diagramType,
      elements,
      relationships,
      labels,
      colorScheme,
    } = params;

    let prompt = `${diagramType} diagram: ${originalPrompt}`;
    prompt += `, showing ${elements.join(', ')}`;

    if (relationships.length > 0) {
      prompt += `, with relationships: ${relationships.join(', ')}`;
    }

    if (labels) {
      prompt += ', with clear labels';
    }

    prompt += `, ${colorScheme} color scheme, clean design, professional`;

    return prompt;
  }

  /**
   * Build educational negative prompt
   */
  private buildEducationalNegativePrompt(baseNegative?: string, ageAppropriate: boolean = true): string {
    let negativePrompt = baseNegative || '';

    const educationalNegatives = [
      'inappropriate content',
      'violence',
      'scary',
      'disturbing',
      'adult content',
      'weapons',
      'blood',
      'dark themes',
    ];

    if (ageAppropriate) {
      educationalNegatives.push(
        'complex adult concepts',
        'inappropriate for children',
        'mature themes'
      );
    }

    const combinedNegatives = negativePrompt 
      ? `${negativePrompt}, ${educationalNegatives.join(', ')}`
      : educationalNegatives.join(', ');

    return combinedNegatives;
  }

  /**
   * Build character negative prompt
   */
  private buildCharacterNegativePrompt(baseNegative?: string): string {
    const characterNegatives = [
      'scary',
      'intimidating',
      'unfriendly',
      'dark',
      'evil',
      'inappropriate',
      'realistic human',
      'photorealistic',
    ];

    return baseNegative 
      ? `${baseNegative}, ${characterNegatives.join(', ')}`
      : characterNegatives.join(', ');
  }

  /**
   * Build diagram negative prompt
   */
  private buildDiagramNegativePrompt(baseNegative?: string): string {
    const diagramNegatives = [
      'cluttered',
      'messy',
      'unclear',
      'confusing',
      'artistic',
      'decorative',
      'ornate',
      'complex background',
    ];

    return baseNegative 
      ? `${baseNegative}, ${diagramNegatives.join(', ')}`
      : diagramNegatives.join(', ');
  }

  /**
   * Get style modifiers for different styles
   */
  private getStyleModifiers(style: string): string {
    const styleMap: Record<string, string> = {
      'photographic': 'photorealistic, photography, realistic',
      'digital-art': 'digital art, digital painting, artwork',
      'cinematic': 'cinematic lighting, movie style, dramatic',
      'anime': 'anime style, manga, Japanese animation',
      'line-art': 'line art, black and white, simple lines',
      'comic-book': 'comic book style, cartoon, illustrated',
      'analog-film': 'film photography, vintage, retro',
      'neon-punk': 'neon colors, cyberpunk, futuristic',
      'isometric': 'isometric view, 3D perspective, technical',
      'low-poly': 'low poly, geometric, minimalist',
      'origami': 'paper craft, origami style, folded paper',
      'modeling-compound': 'clay model, sculpture, 3D model',
      'fantasy-art': 'fantasy illustration, magical, ethereal',
      'enhance': 'enhanced, improved, high detail',
      'tile-texture': 'seamless pattern, texture, repeating',
    };

    return styleMap[style] || 'artistic, creative';
  }

  /**
   * Get appropriate style for educational content
   */
  private getEducationalStyle(contentType: string, gradeLevel: string): ImageGenerationRequest['style'] {
    const isElementary = gradeLevel.toLowerCase().includes('elementary') || 
                        gradeLevel.toLowerCase().includes('k-') ||
                        gradeLevel.toLowerCase().includes('kindergarten');

    switch (contentType) {
      case 'diagram':
        return 'line-art';
      case 'illustration':
        return isElementary ? 'comic-book' : 'digital-art';
      case 'character':
        return 'comic-book';
      case 'scene':
        return isElementary ? 'digital-art' : 'cinematic';
      case 'infographic':
        return 'digital-art';
      case 'concept-art':
        return 'fantasy-art';
      default:
        return 'digital-art';
    }
  }

  /**
   * Get appropriate style for characters
   */
  private getCharacterStyle(characterType: string, platform: string): ImageGenerationRequest['style'] {
    if (platform === 'ar' || platform === 'vr') {
      return 'low-poly';
    }

    switch (characterType) {
      case 'mascot':
        return 'comic-book';
      case 'historical-figure':
        return 'digital-art';
      case 'scientist':
        return 'digital-art';
      case 'explorer':
        return 'digital-art';
      case 'teacher':
        return 'comic-book';
      case 'student':
        return 'comic-book';
      default:
        return 'comic-book';
    }
  }

  /**
   * Get appropriate style for diagrams
   */
  private getDiagramStyle(diagramType: string, colorScheme: string): ImageGenerationRequest['style'] {
    switch (diagramType) {
      case 'flowchart':
      case 'process':
        return 'line-art';
      case 'mind-map':
        return colorScheme === 'colorful' ? 'digital-art' : 'line-art';
      case 'timeline':
        return 'digital-art';
      case 'comparison':
        return 'line-art';
      case 'cycle':
        return 'digital-art';
      case 'hierarchy':
        return 'line-art';
      case 'network':
        return 'digital-art';
      default:
        return 'line-art';
    }
  }

  /**
   * Get image generation statistics
   */
  getStats(): {
    supportedModels: string[];
    supportedStyles: string[];
    maxImageSize: { width: number; height: number };
    supportedFormats: string[];
    educationalContentTypes: string[];
    characterTypes: string[];
    diagramTypes: string[];
  } {
    return {
      supportedModels: ['stability.stable-diffusion-xl-v1'],
      supportedStyles: [
        'photographic', 'digital-art', 'cinematic', 'anime', 'line-art', 
        'comic-book', 'analog-film', 'neon-punk', 'isometric', 'low-poly', 
        'origami', 'modeling-compound', 'fantasy-art', 'enhance', 'tile-texture'
      ],
      maxImageSize: { width: 1024, height: 1024 },
      supportedFormats: ['base64'],
      educationalContentTypes: ['diagram', 'illustration', 'character', 'scene', 'infographic', 'concept-art'],
      characterTypes: ['mascot', 'historical-figure', 'scientist', 'explorer', 'teacher', 'student'],
      diagramTypes: ['flowchart', 'mind-map', 'timeline', 'process', 'comparison', 'cycle', 'hierarchy', 'network'],
    };
  }
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService();