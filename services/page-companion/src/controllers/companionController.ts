import { Request, Response } from 'express';
import { PageCompanionService, CompanionInteractionRequest } from '../services/pageCompanionService';
import { KnowledgeBaseService, KnowledgeCategory, KnowledgeSource } from '../services/knowledgeBaseService';
import { PersonalityTrait, AppearanceSettings } from '@pageflow/types';
import { logger } from '@pageflow/utils';

/**
 * Controller for Page Companion endpoints
 */
export class CompanionController {
  /**
   * Create a new companion for a user
   */
  public static async createCompanion(req: Request, res: Response): Promise<void> {
    try {
      const { userId, personality, appearance } = req.body;

      if (!userId) {
        res.status(400).json({
          error: 'User ID is required'
        });
        return;
      }

      const personalityTraits = personality || [PersonalityTrait.FRIENDLY, PersonalityTrait.ENCOURAGING];
      const companion = await PageCompanionService.createCompanion(
        userId,
        personalityTraits,
        appearance
      );

      res.status(201).json({
        success: true,
        data: companion
      });

    } catch (error) {
      logger.error({
        message: 'Error creating companion',
        error: error instanceof Error ? error.message : String(error),
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to create companion'
      });
    }
  }

  /**
   * Handle interaction with companion
   */
  public static async handleInteraction(req: Request, res: Response): Promise<void> {
    try {
      const { companionId } = req.params;
      const { userInput, context, companion, knowledgeBase } = req.body;

      if (!userInput || !context || !companion) {
        res.status(400).json({
          error: 'User input, context, and companion data are required'
        });
        return;
      }

      const interactionRequest: CompanionInteractionRequest = {
        userId: companion.userId,
        userInput,
        context
      };

      const result = await PageCompanionService.handleInteraction(
        companion,
        interactionRequest,
        knowledgeBase || []
      );

      res.json({
        success: true,
        data: {
          companion: result.updatedCompanion,
          response: result.response
        }
      });

    } catch (error: any) {
      logger.error({
        message: 'Error handling companion interaction',
        error: error.message,
        companionId: req.params.companionId
      });
      res.status(500).json({
        error: 'Failed to handle interaction'
      });
    }
  }

  /**
   * Update companion personality
   */
  public static async updatePersonality(req: Request, res: Response): Promise<void> {
    try {
      const { companionId } = req.params;
      const { personality, companion } = req.body;

      if (!personality || !companion) {
        res.status(400).json({
          error: 'Personality traits and companion data are required'
        });
        return;
      }

      const updatedCompanion = PageCompanionService.updatePersonality(
        companion,
        personality
      );

      res.json({
        success: true,
        data: updatedCompanion
      });

    } catch (error: any) {
      logger.error({
        message: 'Error updating companion personality',
        error: error.message,
        companionId: req.params.companionId
      });
      res.status(500).json({
        error: 'Failed to update personality'
      });
    }
  }

  /**
   * Update companion appearance
   */
  public static async updateAppearance(req: Request, res: Response): Promise<void> {
    try {
      const { companionId } = req.params;
      const { appearance, companion } = req.body;

      if (!appearance || !companion) {
        res.status(400).json({
          error: 'Appearance settings and companion data are required'
        });
        return;
      }

      const updatedCompanion = PageCompanionService.updateAppearance(
        companion,
        appearance
      );

      res.json({
        success: true,
        data: updatedCompanion
      });

    } catch (error: any) {
      logger.error({
        message: 'Error updating companion appearance',
        error: error.message,
        companionId: req.params.companionId
      });
      res.status(500).json({
        error: 'Failed to update appearance'
      });
    }
  }

  /**
   * Get companion status and insights
   */
  public static async getCompanionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { companionId } = req.params;
      const { companion, knowledgeBase } = req.body;

      if (!companion) {
        res.status(400).json({
          error: 'Companion data is required'
        });
        return;
      }

      const status = PageCompanionService.getCompanionStatus(
        companion,
        knowledgeBase || []
      );

      res.json({
        success: true,
        data: status
      });

    } catch (error: any) {
      logger.error({
        message: 'Error getting companion status',
        error: error.message,
        companionId: req.params.companionId
      });
      res.status(500).json({
        error: 'Failed to get companion status'
      });
    }
  }

  /**
   * Analyze interaction history
   */
  public static async analyzeInteractionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { companionId } = req.params;
      const { companion } = req.body;

      if (!companion) {
        res.status(400).json({
          error: 'Companion data is required'
        });
        return;
      }

      const analysis = PageCompanionService.analyzeInteractionHistory(companion);

      res.json({
        success: true,
        data: analysis
      });

    } catch (error: any) {
      logger.error({
        message: 'Error analyzing interaction history',
        error: error.message,
        companionId: req.params.companionId
      });
      res.status(500).json({
        error: 'Failed to analyze interaction history'
      });
    }
  }

  /**
   * Add knowledge to user's knowledge base
   */
  public static async addKnowledge(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { category, key, value, source, confidence, expiresAt } = req.body;

      if (!category || !key || value === undefined || !source) {
        res.status(400).json({
          error: 'Category, key, value, and source are required'
        });
        return;
      }

      const knowledgeItem = KnowledgeBaseService.addKnowledge(
        userId,
        category as KnowledgeCategory,
        key,
        value,
        source as KnowledgeSource,
        confidence,
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.status(201).json({
        success: true,
        data: knowledgeItem
      });

    } catch (error: any) {
      logger.error({
        message: 'Error adding knowledge',
        error: error.message,
        userId: req.params.userId
      });
      res.status(500).json({
        error: 'Failed to add knowledge'
      });
    }
  }

  /**
   * Query knowledge base
   */
  public static async queryKnowledge(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { knowledgeBase, categories, keys, minConfidence, includeExpired, limit } = req.body;

      if (!knowledgeBase) {
        res.status(400).json({
          error: 'Knowledge base data is required'
        });
        return;
      }

      const results = KnowledgeBaseService.queryKnowledge(knowledgeBase, {
        categories,
        keys,
        minConfidence,
        includeExpired,
        limit
      });

      res.json({
        success: true,
        data: results
      });

    } catch (error: any) {
      logger.error({
        message: 'Error querying knowledge',
        error: error.message,
        userId: req.params.userId
      });
      res.status(500).json({
        error: 'Failed to query knowledge'
      });
    }
  }

  /**
   * Get learning preferences from knowledge base
   */
  public static async getLearningPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { knowledgeBase } = req.body;

      if (!knowledgeBase) {
        res.status(400).json({
          error: 'Knowledge base data is required'
        });
        return;
      }

      const preferences = KnowledgeBaseService.getLearningPreferences(knowledgeBase);

      res.json({
        success: true,
        data: preferences
      });

    } catch (error: any) {
      logger.error({
        message: 'Error getting learning preferences',
        error: error.message,
        userId: req.params.userId
      });
      res.status(500).json({
        error: 'Failed to get learning preferences'
      });
    }
  }

  /**
   * Health check endpoint
   */
  public static async healthCheck(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'healthy',
      service: 'page-companion-service',
      timestamp: new Date().toISOString()
    });
  }
}