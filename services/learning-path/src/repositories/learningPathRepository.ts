import { AppError, logger } from '@pageflow/utils';
import { PostgresRepository } from '@pageflow/db-utils';

export interface LearningPathFilters {
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

export interface LearningPathData {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  modules: any[];
  learningObjectives: string[];
  prerequisites: string[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class LearningPathRepository extends PostgresRepository {
  private logger = logger.child({ component: 'LearningPathRepository' });

  constructor() {
    super('learning_paths');
  }

  /**
   * Create a new learning path
   */
  async createLearningPath(data: LearningPathData): Promise<LearningPathData> {
    try {
      this.logger.info({
        message: 'Creating learning path',
        title: data.title
      });

      const query = `
        INSERT INTO learning_paths (
          id, title, description, category, difficulty, estimated_duration,
          modules, learning_objectives, prerequisites, tags, is_public, created_by,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const id = data.id || this.generateId();
      const now = new Date();

      const values = [
        id,
        data.title,
        data.description,
        data.category,
        data.difficulty,
        data.estimatedDuration,
        JSON.stringify(data.modules),
        JSON.stringify(data.learningObjectives),
        JSON.stringify(data.prerequisites),
        JSON.stringify(data.tags),
        data.isPublic,
        data.createdBy,
        now,
        now
      ];

      const result = await this.query(query, values);
      return this.mapRowToLearningPath(result.rows[0]);
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
  async getAllLearningPaths(filters: LearningPathFilters = {}): Promise<LearningPathData[]> {
    try {
      this.logger.info({
        message: 'Getting all learning paths',
        filters
      });

      let query = 'SELECT * FROM learning_paths WHERE is_public = true';
      const values: any[] = [];
      let valueIndex = 1;

      if (filters.category) {
        query += ` AND category = $${valueIndex}`;
        values.push(filters.category);
        valueIndex++;
      }

      if (filters.difficulty) {
        query += ` AND difficulty = $${valueIndex}`;
        values.push(filters.difficulty);
        valueIndex++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${valueIndex}`;
        values.push(filters.limit);
        valueIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${valueIndex}`;
        values.push(filters.offset);
      }

      const result = await this.query(query, values);
      return result.rows.map(row => this.mapRowToLearningPath(row));
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
  async getLearningPathById(id: string): Promise<LearningPathData | null> {
    try {
      this.logger.info({
        message: 'Getting learning path by ID',
        learningPathId: id
      });

      const query = 'SELECT * FROM learning_paths WHERE id = $1';
      const result = await this.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToLearningPath(result.rows[0]);
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
  async updateLearningPath(id: string, updateData: Partial<LearningPathData>): Promise<LearningPathData | null> {
    try {
      this.logger.info({
        message: 'Updating learning path',
        learningPathId: id
      });

      const setClauses: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      if (updateData.title !== undefined) {
        setClauses.push(`title = $${valueIndex}`);
        values.push(updateData.title);
        valueIndex++;
      }

      if (updateData.description !== undefined) {
        setClauses.push(`description = $${valueIndex}`);
        values.push(updateData.description);
        valueIndex++;
      }

      if (updateData.category !== undefined) {
        setClauses.push(`category = $${valueIndex}`);
        values.push(updateData.category);
        valueIndex++;
      }

      if (updateData.difficulty !== undefined) {
        setClauses.push(`difficulty = $${valueIndex}`);
        values.push(updateData.difficulty);
        valueIndex++;
      }

      if (updateData.estimatedDuration !== undefined) {
        setClauses.push(`estimated_duration = $${valueIndex}`);
        values.push(updateData.estimatedDuration);
        valueIndex++;
      }

      if (updateData.modules !== undefined) {
        setClauses.push(`modules = $${valueIndex}`);
        values.push(JSON.stringify(updateData.modules));
        valueIndex++;
      }

      if (updateData.learningObjectives !== undefined) {
        setClauses.push(`learning_objectives = $${valueIndex}`);
        values.push(JSON.stringify(updateData.learningObjectives));
        valueIndex++;
      }

      if (updateData.prerequisites !== undefined) {
        setClauses.push(`prerequisites = $${valueIndex}`);
        values.push(JSON.stringify(updateData.prerequisites));
        valueIndex++;
      }

      if (updateData.tags !== undefined) {
        setClauses.push(`tags = $${valueIndex}`);
        values.push(JSON.stringify(updateData.tags));
        valueIndex++;
      }

      if (updateData.isPublic !== undefined) {
        setClauses.push(`is_public = $${valueIndex}`);
        values.push(updateData.isPublic);
        valueIndex++;
      }

      setClauses.push(`updated_at = $${valueIndex}`);
      values.push(new Date());
      valueIndex++;

      values.push(id);

      const query = `
        UPDATE learning_paths 
        SET ${setClauses.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;

      const result = await this.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToLearningPath(result.rows[0]);
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

      const query = 'DELETE FROM learning_paths WHERE id = $1 RETURNING id';
      const result = await this.query(query, [id]);

      return result.rows.length > 0;
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
   * Get user progress for learning path
   */
  async getUserProgress(pathId: string, userId: string): Promise<any> {
    try {
      this.logger.info({
        message: 'Getting user progress',
        learningPathId: pathId,
        userId
      });

      const query = `
        SELECT * FROM user_learning_progress 
        WHERE learning_path_id = $1 AND user_id = $2
      `;
      const result = await this.query(query, [pathId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUserProgress(result.rows[0]);
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

      const query = `
        INSERT INTO user_learning_progress (
          learning_path_id, user_id, progress_data, completed_modules,
          current_module, score, time_spent, last_accessed, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (learning_path_id, user_id) 
        DO UPDATE SET 
          progress_data = EXCLUDED.progress_data,
          completed_modules = EXCLUDED.completed_modules,
          current_module = EXCLUDED.current_module,
          score = EXCLUDED.score,
          time_spent = EXCLUDED.time_spent,
          last_accessed = EXCLUDED.last_accessed,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const now = new Date();
      const values = [
        pathId,
        userId,
        JSON.stringify(progressData.progressData || {}),
        JSON.stringify(progressData.completedModules || []),
        progressData.currentModule || null,
        progressData.score || 0,
        progressData.timeSpent || 0,
        now,
        now
      ];

      const result = await this.query(query, values);
      return this.mapRowToUserProgress(result.rows[0]);
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

      const query = `
        SELECT 
          COUNT(*) as total_enrollments,
          AVG(score) as average_score,
          AVG(time_spent) as average_time_spent,
          COUNT(CASE WHEN score >= 80 THEN 1 END) as high_performers,
          COUNT(CASE WHEN score < 60 THEN 1 END) as struggling_learners
        FROM user_learning_progress 
        WHERE learning_path_id = $1
      `;

      const result = await this.query(query, [pathId]);
      return result.rows[0];
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

      const query = 'SELECT modules FROM learning_paths WHERE id = $1';
      const result = await this.query(query, [pathId]);

      if (result.rows.length === 0) {
        return [];
      }

      const modules = result.rows[0].modules;
      return Array.isArray(modules) ? modules : [];
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
  async addModuleToPath(pathId: string, moduleData: any): Promise<LearningPathData | null> {
    try {
      this.logger.info({
        message: 'Adding module to learning path',
        learningPathId: pathId,
        moduleId: moduleData.id
      });

      const currentPath = await this.getLearningPathById(pathId);
      if (!currentPath) {
        throw new AppError('Learning path not found', 404, 'LEARNING_PATH_NOT_FOUND');
      }

      const updatedModules = [...currentPath.modules, moduleData];
      return await this.updateLearningPath(pathId, { modules: updatedModules });
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
  async updateModuleInPath(pathId: string, moduleId: string, updateData: any): Promise<LearningPathData | null> {
    try {
      this.logger.info({
        message: 'Updating module in learning path',
        learningPathId: pathId,
        moduleId
      });

      const currentPath = await this.getLearningPathById(pathId);
      if (!currentPath) {
        throw new AppError('Learning path not found', 404, 'LEARNING_PATH_NOT_FOUND');
      }

      const updatedModules = currentPath.modules.map(module => 
        module.id === moduleId ? { ...module, ...updateData } : module
      );

      return await this.updateLearningPath(pathId, { modules: updatedModules });
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
  async removeModuleFromPath(pathId: string, moduleId: string): Promise<LearningPathData | null> {
    try {
      this.logger.info({
        message: 'Removing module from learning path',
        learningPathId: pathId,
        moduleId
      });

      const currentPath = await this.getLearningPathById(pathId);
      if (!currentPath) {
        throw new AppError('Learning path not found', 404, 'LEARNING_PATH_NOT_FOUND');
      }

      const updatedModules = currentPath.modules.filter(module => module.id !== moduleId);
      return await this.updateLearningPath(pathId, { modules: updatedModules });
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
   * Map database row to LearningPathData
   */
  private mapRowToLearningPath(row: any): LearningPathData {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty,
      estimatedDuration: row.estimated_duration,
      modules: Array.isArray(row.modules) ? row.modules : [],
      learningObjectives: Array.isArray(row.learning_objectives) ? row.learning_objectives : [],
      prerequisites: Array.isArray(row.prerequisites) ? row.prerequisites : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
      isPublic: row.is_public,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map database row to user progress
   */
  private mapRowToUserProgress(row: any): any {
    return {
      learningPathId: row.learning_path_id,
      userId: row.user_id,
      progressData: row.progress_data,
      completedModules: row.completed_modules,
      currentModule: row.current_module,
      score: row.score,
      timeSpent: row.time_spent,
      lastAccessed: row.last_accessed,
      updatedAt: row.updated_at
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 