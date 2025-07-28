import { AppError, logger } from '@pageflow/utils';
import { LearningPathRepository } from '../repositories/learningPathRepository';
import { RecommendationService } from './recommendationService';
import { PersonalizationService } from './personalizationService';

export interface LearningPathFilters {
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

export interface PersonalizedPathRequest {
  userId: string;
  goals: string[];
  preferences: Record<string, any>;
  priorKnowledge: Record<string, any>;
}

export interface PathAdaptationRequest {
  userId: string;
  progress: Record<string, any>;
  feedback: Record<string, any>;
}

export interface OptimizationCriteria {
  efficiency?: boolean;
  engagement?: boolean;
  completion?: boolean;
  difficulty?: string;
}

export class LearningPathService {
  private learningPathRepository: LearningPathRepository;
  private recommendationService: RecommendationService;
  private personalizationService: PersonalizationService;
  private logger = logger.child({ component: 'LearningPathService' });

  constructor() {
    this.learningPathRepository = new LearningPathRepository();
    this.recommendationService = new RecommendationService();
    this.personalizationService = new PersonalizationService();
  }

  /**
   * Create a new learning path
   */
  async createLearningPath(learningPathData: any): Promise<any> {
    try {
      this.logger.info({
        message: 'Creating learning path',
        title: learningPathData.title
      });

      const learningPath = await this.learningPathRepository.createLearningPath(learningPathData);
      
      return learningPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error creating learning path',
        error: error.message
      });
      throw new AppError('Failed to create learning path', 500, 'LEARNING_PATH_CREATION_ERROR');
    }
  }

  /**
   * Get all learning paths with optional filtering
   */
  async getAllLearningPaths(filters: LearningPathFilters = {}): Promise<any[]> {
    try {
      this.logger.info({
        message: 'Getting all learning paths',
        filters
      });

      const learningPaths = await this.learningPathRepository.getAllLearningPaths(filters);
      
      return learningPaths;
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning paths',
        error: error.message
      });
      throw new AppError('Failed to get learning paths', 500, 'LEARNING_PATHS_RETRIEVAL_ERROR');
    }
  }

  /**
   * Get learning path by ID
   */
  async getLearningPathById(id: string): Promise<any | null> {
    try {
      this.logger.info({
        message: 'Getting learning path by ID',
        learningPathId: id
      });

      const learningPath = await this.learningPathRepository.getLearningPathById(id);
      
      return learningPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning path by ID',
        learningPathId: id,
        error: error.message
      });
      throw new AppError('Failed to get learning path', 500, 'LEARNING_PATH_RETRIEVAL_ERROR');
    }
  }

  /**
   * Update learning path
   */
  async updateLearningPath(id: string, updateData: any): Promise<any | null> {
    try {
      this.logger.info({
        message: 'Updating learning path',
        learningPathId: id
      });

      const updatedPath = await this.learningPathRepository.updateLearningPath(id, updateData);
      
      return updatedPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating learning path',
        learningPathId: id,
        error: error.message
      });
      throw new AppError('Failed to update learning path', 500, 'LEARNING_PATH_UPDATE_ERROR');
    }
  }

  /**
   * Delete learning path
   */
  async deleteLearningPath(id: string): Promise<boolean> {
    try {
      this.logger.info({
        message: 'Deleting learning path',
        learningPathId: id
      });

      const deleted = await this.learningPathRepository.deleteLearningPath(id);
      
      return deleted;
    } catch (error: any) {
      this.logger.error({
        message: 'Error deleting learning path',
        learningPathId: id,
        error: error.message
      });
      throw new AppError('Failed to delete learning path', 500, 'LEARNING_PATH_DELETION_ERROR');
    }
  }

  /**
   * Generate personalized learning path
   */
  async generatePersonalizedPath(request: PersonalizedPathRequest): Promise<any> {
    try {
      this.logger.info({
        message: 'Generating personalized learning path',
        userId: request.userId
      });

      // Get user's learning style and preferences
      const learningStyle = await this.personalizationService.getLearningStyle(request.userId);
      const preferences = await this.personalizationService.getLearningPreferences(request.userId);

      // Generate personalized path using AI
      const personalizedPath = await this.generateAIPersonalizedPath({
        ...request,
        learningStyle,
        preferences
      });

      // Save the generated path
      const savedPath = await this.learningPathRepository.createLearningPath(personalizedPath);
      
      return savedPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error generating personalized learning path',
        userId: request.userId,
        error: error.message
      });
      throw new AppError('Failed to generate personalized learning path', 500, 'PERSONALIZED_PATH_GENERATION_ERROR');
    }
  }

  /**
   * Adapt learning path for user
   */
  async adaptLearningPath(pathId: string, request: PathAdaptationRequest): Promise<any> {
    try {
      this.logger.info({
        message: 'Adapting learning path',
        learningPathId: pathId,
        userId: request.userId
      });

      // Get current learning path
      const currentPath = await this.learningPathRepository.getLearningPathById(pathId);
      if (!currentPath) {
        throw new AppError('Learning path not found', 404, 'LEARNING_PATH_NOT_FOUND');
      }

      // Analyze user progress and feedback
      const adaptation = await this.analyzeAndAdaptPath(currentPath, request);

      // Update the learning path
      const adaptedPath = await this.learningPathRepository.updateLearningPath(pathId, adaptation);
      
      return adaptedPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error adapting learning path',
        learningPathId: pathId,
        userId: request.userId,
        error: error.message
      });
      throw new AppError('Failed to adapt learning path', 500, 'LEARNING_PATH_ADAPTATION_ERROR');
    }
  }

  /**
   * Optimize learning path
   */
  async optimizeLearningPath(pathId: string, criteria: OptimizationCriteria): Promise<any> {
    try {
      this.logger.info({
        message: 'Optimizing learning path',
        learningPathId: pathId,
        criteria
      });

      // Get current learning path
      const currentPath = await this.learningPathRepository.getLearningPathById(pathId);
      if (!currentPath) {
        throw new AppError('Learning path not found', 404, 'LEARNING_PATH_NOT_FOUND');
      }

      // Optimize the path based on criteria
      const optimization = await this.optimizePath(currentPath, criteria);

      // Update the learning path
      const optimizedPath = await this.learningPathRepository.updateLearningPath(pathId, optimization);
      
      return optimizedPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error optimizing learning path',
        learningPathId: pathId,
        error: error.message
      });
      throw new AppError('Failed to optimize learning path', 500, 'LEARNING_PATH_OPTIMIZATION_ERROR');
    }
  }

  /**
   * Get user progress for learning path
   */
  async getUserProgress(pathId: string, userId: string): Promise<any> {
    try {
      this.logger.info({
        message: 'Getting user progress',
        learningPathId: pathId,
        userId
      });

      const progress = await this.learningPathRepository.getUserProgress(pathId, userId);
      
      return progress;
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting user progress',
        learningPathId: pathId,
        userId,
        error: error.message
      });
      throw new AppError('Failed to get user progress', 500, 'USER_PROGRESS_RETRIEVAL_ERROR');
    }
  }

  /**
   * Update user progress for learning path
   */
  async updateUserProgress(pathId: string, userId: string, progressData: any): Promise<any> {
    try {
      this.logger.info({
        message: 'Updating user progress',
        learningPathId: pathId,
        userId
      });

      const updatedProgress = await this.learningPathRepository.updateUserProgress(pathId, userId, progressData);
      
      return updatedProgress;
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating user progress',
        learningPathId: pathId,
        userId,
        error: error.message
      });
      throw new AppError('Failed to update user progress', 500, 'USER_PROGRESS_UPDATE_ERROR');
    }
  }

  /**
   * Get learning path analytics
   */
  async getLearningPathAnalytics(pathId: string): Promise<any> {
    try {
      this.logger.info({
        message: 'Getting learning path analytics',
        learningPathId: pathId
      });

      const analytics = await this.learningPathRepository.getLearningPathAnalytics(pathId);
      
      return analytics;
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning path analytics',
        learningPathId: pathId,
        error: error.message
      });
      throw new AppError('Failed to get learning path analytics', 500, 'LEARNING_PATH_ANALYTICS_ERROR');
    }
  }

  /**
   * Get learning path modules
   */
  async getLearningPathModules(pathId: string): Promise<any[]> {
    try {
      this.logger.info({
        message: 'Getting learning path modules',
        learningPathId: pathId
      });

      const modules = await this.learningPathRepository.getLearningPathModules(pathId);
      
      return modules;
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning path modules',
        learningPathId: pathId,
        error: error.message
      });
      throw new AppError('Failed to get learning path modules', 500, 'LEARNING_PATH_MODULES_ERROR');
    }
  }

  /**
   * Add module to learning path
   */
  async addModuleToPath(pathId: string, moduleData: any): Promise<any> {
    try {
      this.logger.info({
        message: 'Adding module to learning path',
        learningPathId: pathId,
        moduleId: moduleData.id
      });

      const updatedPath = await this.learningPathRepository.addModuleToPath(pathId, moduleData);
      
      return updatedPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error adding module to learning path',
        learningPathId: pathId,
        error: error.message
      });
      throw new AppError('Failed to add module to learning path', 500, 'MODULE_ADDITION_ERROR');
    }
  }

  /**
   * Update module in learning path
   */
  async updateModuleInPath(pathId: string, moduleId: string, updateData: any): Promise<any> {
    try {
      this.logger.info({
        message: 'Updating module in learning path',
        learningPathId: pathId,
        moduleId
      });

      const updatedPath = await this.learningPathRepository.updateModuleInPath(pathId, moduleId, updateData);
      
      return updatedPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating module in learning path',
        learningPathId: pathId,
        moduleId,
        error: error.message
      });
      throw new AppError('Failed to update module in learning path', 500, 'MODULE_UPDATE_ERROR');
    }
  }

  /**
   * Remove module from learning path
   */
  async removeModuleFromPath(pathId: string, moduleId: string): Promise<any> {
    try {
      this.logger.info({
        message: 'Removing module from learning path',
        learningPathId: pathId,
        moduleId
      });

      const updatedPath = await this.learningPathRepository.removeModuleFromPath(pathId, moduleId);
      
      return updatedPath;
    } catch (error: any) {
      this.logger.error({
        message: 'Error removing module from learning path',
        learningPathId: pathId,
        moduleId,
        error: error.message
      });
      throw new AppError('Failed to remove module from learning path', 500, 'MODULE_REMOVAL_ERROR');
    }
  }

  /**
   * Get path recommendations for user
   */
  async getPathRecommendations(pathId: string, userId: string): Promise<any[]> {
    try {
      this.logger.info({
        message: 'Getting path recommendations',
        learningPathId: pathId,
        userId
      });

      const recommendations = await this.recommendationService.getLearningPathRecommendations(userId, {
        currentPath: pathId
      });
      
      return recommendations;
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting path recommendations',
        learningPathId: pathId,
        userId,
        error: error.message
      });
      throw new AppError('Failed to get path recommendations', 500, 'PATH_RECOMMENDATIONS_ERROR');
    }
  }

  /**
   * Update user preferences for learning path
   */
  async updateUserPreferences(pathId: string, userId: string, preferences: any): Promise<any> {
    try {
      this.logger.info({
        message: 'Updating user preferences',
        learningPathId: pathId,
        userId
      });

      const updatedPreferences = await this.personalizationService.updateLearningPreferences(userId, preferences);
      
      return updatedPreferences;
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating user preferences',
        learningPathId: pathId,
        userId,
        error: error.message
      });
      throw new AppError('Failed to update user preferences', 500, 'USER_PREFERENCES_UPDATE_ERROR');
    }
  }

  /**
   * Generate AI-powered personalized learning path
   */
  private async generateAIPersonalizedPath(data: any): Promise<any> {
    // This would integrate with AWS Bedrock or similar AI service
    // For now, return a mock personalized path
    return {
      title: `Personalized Path for ${data.userId}`,
      description: 'AI-generated personalized learning path',
      modules: [],
      estimatedDuration: 120,
      difficulty: 'intermediate',
      learningStyle: data.learningStyle?.type || 'visual',
      goals: data.goals,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Analyze and adapt learning path based on user progress and feedback
   */
  private async analyzeAndAdaptPath(currentPath: any, request: PathAdaptationRequest): Promise<any> {
    // This would analyze user progress and feedback to adapt the path
    // For now, return the current path with minor adaptations
    return {
      ...currentPath,
      adaptations: {
        difficultyAdjustment: 'slight_increase',
        moduleReordering: true,
        additionalResources: []
      },
      updatedAt: new Date()
    };
  }

  /**
   * Optimize learning path based on criteria
   */
  private async optimizePath(currentPath: any, criteria: OptimizationCriteria): Promise<any> {
    // This would optimize the path based on the given criteria
    // For now, return the current path with optimization metadata
    return {
      ...currentPath,
      optimization: {
        criteria,
        changes: [],
        efficiencyScore: 0.85,
        engagementScore: 0.78
      },
      updatedAt: new Date()
    };
  }
} 