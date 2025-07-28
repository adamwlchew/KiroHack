import { logger } from '@pageflow/utils';
import {
  Progress,
  ProgressReport,
  ReportType,
  ProgressMetrics,
  Milestone,
  Achievement
} from '@pageflow/types';
import { ProgressRepository } from '../repositories/progressRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { AchievementRepository } from '../repositories/achievementRepository';

export interface ProgressVisualizationData {
  userId: string;
  pathId: string;
  generatedAt: Date;
  completionOverTime: Array<{
    date: string;
    completion: number;
    timeSpent: number;
  }>;
  moduleBreakdown: Array<{
    moduleId: string;
    moduleName: string;
    completion: number;
    timeSpent: number;
    unitsCompleted: number;
    totalUnits: number;
  }>;
  learningVelocity: Array<{
    week: string;
    contentCompleted: number;
    timeSpent: number;
    averageSessionLength: number;
  }>;
  performanceMetrics: {
    totalTimeSpent: number;
    averageSessionLength: number;
    completionRate: number;
    consistencyScore: number;
    engagementScore: number;
  };
  strengthsAndWeaknesses: {
    strengths: Array<{
      area: string;
      score: number;
      description: string;
    }>;
    improvementAreas: Array<{
      area: string;
      score: number;
      description: string;
      recommendations: string[];
    }>;
  };
}

export interface ComprehensiveAnalysisReport {
  userId: string;
  pathId?: string;
  reportType: ReportType;
  generatedAt: Date;
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalPathsStarted: number;
    totalPathsCompleted: number;
    totalTimeSpent: number;
    averageCompletionRate: number;
    milestonesAchieved: number;
    achievementsEarned: number;
  };
  detailedMetrics: ProgressMetrics;
  learningPatterns: {
    preferredLearningTimes: Array<{
      hour: number;
      activityLevel: number;
    }>;
    sessionLengthDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    contentTypePreferences: Array<{
      type: string;
      engagementScore: number;
      completionRate: number;
    }>;
  };
  progressTrends: {
    weeklyProgress: Array<{
      week: string;
      completion: number;
      timeSpent: number;
      trend: 'improving' | 'stable' | 'declining';
    }>;
    monthlyComparison: Array<{
      month: string;
      completion: number;
      timeSpent: number;
      milestonesAchieved: number;
    }>;
  };
  recommendations: Array<{
    category: 'engagement' | 'completion' | 'consistency' | 'challenge';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
  }>;
  achievements: Achievement[];
  milestones: Milestone[];
}

export class ProgressReportingService {
  private progressRepository: ProgressRepository;
  private milestoneRepository: MilestoneRepository;
  private achievementRepository: AchievementRepository;
  private logger: any;

  constructor(
    progressRepository: ProgressRepository,
    milestoneRepository: MilestoneRepository,
    achievementRepository: AchievementRepository
  ) {
    this.progressRepository = progressRepository;
    this.milestoneRepository = milestoneRepository;
    this.achievementRepository = achievementRepository;
    this.logger = logger.child({ service: 'ProgressReportingService' });
  }

  /**
   * Generate progress visualization data for a specific learning path
   */
  async generateProgressVisualization(
    userId: string,
    pathId: string,
    timeframeDays: number = 30
  ): Promise<ProgressVisualizationData> {
    try {
      this.logger.info('Generating progress visualization', { userId, pathId, timeframeDays });

      const progress = await this.progressRepository.getProgress(userId, pathId);
      if (!progress) {
        throw new Error('Progress not found');
      }

      // Generate completion over time data (simplified - would need historical data)
      const completionOverTime = this.generateCompletionOverTime(progress, timeframeDays);

      // Generate module breakdown
      const moduleBreakdown = this.generateModuleBreakdown(progress);

      // Generate learning velocity data
      const learningVelocity = this.generateLearningVelocity(progress, timeframeDays);

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(progress);

      // Analyze strengths and weaknesses
      const strengthsAndWeaknesses = this.analyzeStrengthsAndWeaknesses(progress);

      const visualization: ProgressVisualizationData = {
        userId,
        pathId,
        generatedAt: new Date(),
        completionOverTime,
        moduleBreakdown,
        learningVelocity,
        performanceMetrics,
        strengthsAndWeaknesses
      };

      this.logger.info('Progress visualization generated successfully', {
        userId,
        pathId,
        modulesAnalyzed: moduleBreakdown.length
      });

      return visualization;
    } catch (error) {
      this.logger.error({ message: 'Failed to generate progress visualization', userId, pathId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateComprehensiveReport(
    userId: string,
    reportType: ReportType,
    pathId?: string,
    customTimeframe?: { startDate: Date; endDate: Date }
  ): Promise<ComprehensiveAnalysisReport> {
    try {
      this.logger.info({ message: 'Generating comprehensive analysis report', userId, reportType, pathId });

      // Determine timeframe based on report type
      const timeframe = customTimeframe || this.getTimeframeForReportType(reportType);

      // Get user progress data
      const progressData = pathId
        ? [await this.progressRepository.getProgress(userId, pathId)].filter((p): p is Progress => p !== null)
        : (await this.progressRepository.getUserProgress({ userId })).progress;

      // Get milestones and achievements
      const milestones = await this.milestoneRepository.getUserMilestones(userId, pathId);
      const achievements = await this.achievementRepository.getUserAchievements(userId);

      // Filter by timeframe
      const filteredMilestones = milestones.filter(m =>
        m.achievedAt && m.achievedAt >= timeframe.startDate && m.achievedAt <= timeframe.endDate
      );
      const filteredAchievements = achievements.filter(a =>
        a.awardedAt >= timeframe.startDate && a.awardedAt <= timeframe.endDate
      );

      // Generate summary
      const summary = this.generateReportSummary(progressData, filteredMilestones, filteredAchievements);

      // Calculate detailed metrics
      const detailedMetrics = this.calculateDetailedMetrics(progressData);

      // Analyze learning patterns
      const learningPatterns = this.analyzeLearningPatterns(progressData);

      // Generate progress trends
      const progressTrends = this.generateProgressTrends(progressData, timeframe);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        progressData,
        detailedMetrics,
        learningPatterns
      );

      const report: ComprehensiveAnalysisReport = {
        userId,
        pathId,
        reportType,
        generatedAt: new Date(),
        timeframe,
        summary,
        detailedMetrics,
        learningPatterns,
        progressTrends,
        recommendations,
        achievements: filteredAchievements,
        milestones: filteredMilestones
      };

      this.logger.info({ message: 'Comprehensive analysis report generated successfully', userId, reportType, pathsAnalyzed: progressData.length, recommendationsGenerated: recommendations.length });

      return report;
    } catch (error) {
      this.logger.error({ message: 'Failed to generate comprehensive analysis report', userId, reportType, pathId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Detect strength and improvement areas
   */
  async detectStrengthsAndImprovements(
    userId: string,
    pathId?: string
  ): Promise<{
    strengths: string[];
    improvementAreas: string[];
    recommendations: string[];
  }> {
    try {
      this.logger.info('Detecting strengths and improvement areas', { userId, pathId });

      const progressData = pathId
        ? [await this.progressRepository.getProgress(userId, pathId)].filter(Boolean)
        : (await this.progressRepository.getUserProgress({ userId })).progress;

      const strengths: string[] = [];
      const improvementAreas: string[] = [];
      const recommendations: string[] = [];

      for (const progress of progressData) {
        if (!progress) continue;
        const analysis = this.analyzeStrengthsAndWeaknesses(progress);
        
        strengths.push(...analysis.strengths.map(s => s.area));
        improvementAreas.push(...analysis.improvementAreas.map(i => i.area));
        
        // Add specific recommendations
        analysis.improvementAreas.forEach(area => {
          recommendations.push(...area.recommendations);
        });
      }

      // Remove duplicates and prioritize
      const uniqueStrengths = [...new Set(strengths)];
      const uniqueImprovementAreas = [...new Set(improvementAreas)];
      const uniqueRecommendations = [...new Set(recommendations)];

      this.logger.info('Strengths and improvements detected', {
        userId,
        strengthsCount: uniqueStrengths.length,
        improvementAreasCount: uniqueImprovementAreas.length,
        recommendationsCount: uniqueRecommendations.length
      });

      return {
        strengths: uniqueStrengths,
        improvementAreas: uniqueImprovementAreas,
        recommendations: uniqueRecommendations
      };
    } catch (error) {
      this.logger.error('Failed to detect strengths and improvements', {
        userId,
        pathId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate completion over time data (simplified implementation)
   */
  private generateCompletionOverTime(progress: Progress, days: number): Array<{
    date: string;
    completion: number;
    timeSpent: number;
  }> {
    const data = [];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // This is a simplified implementation
    // In a real system, you would have historical progress snapshots
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const completion = Math.min(progress.overallCompletion, (i / days) * progress.overallCompletion);
      
      data.push({
        date: date.toISOString().split('T')[0],
        completion,
        timeSpent: this.calculateTotalTimeSpent(progress) * (completion / 100)
      });
    }

    return data;
  }

  /**
   * Generate module breakdown data
   */
  private generateModuleBreakdown(progress: Progress): Array<{
    moduleId: string;
    moduleName: string;
    completion: number;
    timeSpent: number;
    unitsCompleted: number;
    totalUnits: number;
  }> {
    return progress.moduleProgress.map(module => {
      const timeSpent = module.unitProgress.reduce((total, unit) => {
        return total + unit.contentProgress.reduce((unitTotal, content) => {
          return unitTotal + content.timeSpent;
        }, 0);
      }, 0);

      const unitsCompleted = module.unitProgress.filter(unit => unit.completion === 100).length;

      return {
        moduleId: module.moduleId,
        moduleName: `Module ${module.moduleId}`, // Would get actual name from content service
        completion: module.completion,
        timeSpent,
        unitsCompleted,
        totalUnits: module.unitProgress.length
      };
    });
  }

  /**
   * Generate learning velocity data
   */
  private generateLearningVelocity(progress: Progress, days: number): Array<{
    week: string;
    contentCompleted: number;
    timeSpent: number;
    averageSessionLength: number;
  }> {
    const weeks = Math.ceil(days / 7);
    const data = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(Date.now() - (weeks - i) * 7 * 24 * 60 * 60 * 1000);
      const weekLabel = `Week ${i + 1}`;
      
      // Simplified calculation - would need actual session data
      const contentCompleted = Math.floor(Math.random() * 10) + 1;
      const timeSpent = Math.floor(Math.random() * 3600) + 1800; // 30min to 90min
      const averageSessionLength = timeSpent / Math.max(contentCompleted, 1);

      data.push({
        week: weekLabel,
        contentCompleted,
        timeSpent,
        averageSessionLength
      });
    }

    return data;
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(progress: Progress): {
    totalTimeSpent: number;
    averageSessionLength: number;
    completionRate: number;
    consistencyScore: number;
    engagementScore: number;
  } {
    const totalTimeSpent = this.calculateTotalTimeSpent(progress);
    const totalContent = this.getTotalContentCount(progress);
    const completedContent = this.getCompletedContentCount(progress);
    
    return {
      totalTimeSpent,
      averageSessionLength: totalContent > 0 ? totalTimeSpent / totalContent : 0,
      completionRate: totalContent > 0 ? (completedContent / totalContent) * 100 : 0,
      consistencyScore: this.calculateConsistencyScore(progress),
      engagementScore: this.calculateEngagementScore(progress)
    };
  }

  /**
   * Analyze strengths and weaknesses
   */
  private analyzeStrengthsAndWeaknesses(progress: Progress): {
    strengths: Array<{
      area: string;
      score: number;
      description: string;
    }>;
    improvementAreas: Array<{
      area: string;
      score: number;
      description: string;
      recommendations: string[];
    }>;
  } {
    const strengths = [];
    const improvementAreas = [];

    // Analyze completion rate
    if (progress.overallCompletion >= 80) {
      strengths.push({
        area: 'Completion Rate',
        score: progress.overallCompletion,
        description: 'Excellent progress with high completion rates'
      });
    } else if (progress.overallCompletion < 50) {
      improvementAreas.push({
        area: 'Completion Rate',
        score: progress.overallCompletion,
        description: 'Low completion rate indicates need for more engagement',
        recommendations: [
          'Set smaller, achievable daily goals',
          'Break down complex topics into smaller chunks',
          'Consider adjusting learning pace'
        ]
      });
    }

    // Analyze consistency
    const consistencyScore = this.calculateConsistencyScore(progress);
    if (consistencyScore >= 80) {
      strengths.push({
        area: 'Learning Consistency',
        score: consistencyScore,
        description: 'Maintains regular learning habits'
      });
    } else if (consistencyScore < 60) {
      improvementAreas.push({
        area: 'Learning Consistency',
        score: consistencyScore,
        description: 'Irregular learning patterns detected',
        recommendations: [
          'Establish a regular learning schedule',
          'Set up learning reminders',
          'Start with shorter, more frequent sessions'
        ]
      });
    }

    // Analyze engagement
    const engagementScore = this.calculateEngagementScore(progress);
    if (engagementScore >= 75) {
      strengths.push({
        area: 'Content Engagement',
        score: engagementScore,
        description: 'High engagement with learning materials'
      });
    } else if (engagementScore < 50) {
      improvementAreas.push({
        area: 'Content Engagement',
        score: engagementScore,
        description: 'Low engagement with content materials',
        recommendations: [
          'Try different content formats (video, interactive, etc.)',
          'Focus on topics that align with personal interests',
          'Take breaks to avoid learning fatigue'
        ]
      });
    }

    return { strengths, improvementAreas };
  }

  /**
   * Calculate total time spent across all content
   */
  private calculateTotalTimeSpent(progress: Progress): number {
    return progress.moduleProgress.reduce((total, module) => {
      return total + module.unitProgress.reduce((moduleTotal, unit) => {
        return moduleTotal + unit.contentProgress.reduce((unitTotal, content) => {
          return unitTotal + content.timeSpent;
        }, 0);
      }, 0);
    }, 0);
  }

  /**
   * Get total content count
   */
  private getTotalContentCount(progress: Progress): number {
    return progress.moduleProgress.reduce((total, module) => {
      return total + module.unitProgress.reduce((moduleTotal, unit) => {
        return moduleTotal + unit.contentProgress.length;
      }, 0);
    }, 0);
  }

  /**
   * Get completed content count
   */
  private getCompletedContentCount(progress: Progress): number {
    return progress.moduleProgress.reduce((total, module) => {
      return total + module.unitProgress.reduce((moduleTotal, unit) => {
        return moduleTotal + unit.contentProgress.filter(c => c.status === 'completed').length;
      }, 0);
    }, 0);
  }

  /**
   * Calculate consistency score (simplified)
   */
  private calculateConsistencyScore(progress: Progress): number {
    // This would typically analyze learning patterns over time
    // For now, return a score based on completion distribution
    const moduleCompletions = progress.moduleProgress.map(m => m.completion);
    const variance = this.calculateVariance(moduleCompletions);
    return Math.max(0, 100 - variance);
  }

  /**
   * Calculate engagement score (simplified)
   */
  private calculateEngagementScore(progress: Progress): number {
    const totalTime = this.calculateTotalTimeSpent(progress);
    const totalContent = this.getTotalContentCount(progress);
    const averageTimePerContent = totalContent > 0 ? totalTime / totalContent : 0;
    
    // Score based on time spent per content item
    // Assuming 5 minutes (300 seconds) is optimal engagement time
    const optimalTime = 300;
    const engagementRatio = Math.min(averageTimePerContent / optimalTime, 2);
    return Math.min(100, engagementRatio * 50);
  }

  /**
   * Calculate variance for consistency scoring
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get timeframe for report type
   */
  private getTimeframeForReportType(reportType: ReportType): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate: Date;

    switch (reportType) {
      case ReportType.DAILY:
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case ReportType.WEEKLY:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case ReportType.MONTHLY:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  /**
   * Generate report summary
   */
  private generateReportSummary(
    progressData: Progress[],
    milestones: Milestone[],
    achievements: Achievement[]
  ): ComprehensiveAnalysisReport['summary'] {
    const completedPaths = progressData.filter(p => p.overallCompletion === 100).length;
    const totalTimeSpent = progressData.reduce((total, progress) => {
      return total + this.calculateTotalTimeSpent(progress);
    }, 0);
    const averageCompletion = progressData.length > 0
      ? progressData.reduce((sum, p) => sum + p.overallCompletion, 0) / progressData.length
      : 0;

    return {
      totalPathsStarted: progressData.length,
      totalPathsCompleted: completedPaths,
      totalTimeSpent,
      averageCompletionRate: averageCompletion,
      milestonesAchieved: milestones.length,
      achievementsEarned: achievements.length
    };
  }

  /**
   * Calculate detailed metrics
   */
  private calculateDetailedMetrics(progressData: Progress[]): ProgressMetrics {
    const totalTimeSpent = progressData.reduce((total, progress) => {
      return total + this.calculateTotalTimeSpent(progress);
    }, 0);

    const completionRates = progressData.map(p => p.overallCompletion);
    const averageScore = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length || 0;

    return {
      totalTimeSpent,
      completionRate: averageScore,
      averageScore,
      streakDays: 0, // Would calculate from activity data
      modulesCompleted: progressData.reduce((total, p) => {
        return total + p.moduleProgress.filter(m => m.completion === 100).length;
      }, 0),
      achievementsEarned: 0, // Passed separately
      strugglingAreas: [], // Would analyze from performance data
      strongAreas: [] // Would analyze from performance data
    };
  }

  /**
   * Analyze learning patterns (simplified)
   */
  private analyzeLearningPatterns(progressData: Progress[]): ComprehensiveAnalysisReport['learningPatterns'] {
    // This would analyze actual usage patterns
    // For now, return mock data structure
    return {
      preferredLearningTimes: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        activityLevel: Math.random() * 100
      })),
      sessionLengthDistribution: [
        { range: '0-15 min', count: 10, percentage: 25 },
        { range: '15-30 min', count: 15, percentage: 37.5 },
        { range: '30-60 min', count: 12, percentage: 30 },
        { range: '60+ min', count: 3, percentage: 7.5 }
      ],
      contentTypePreferences: [
        { type: 'video', engagementScore: 85, completionRate: 90 },
        { type: 'text', engagementScore: 70, completionRate: 75 },
        { type: 'interactive', engagementScore: 95, completionRate: 85 },
        { type: 'quiz', engagementScore: 80, completionRate: 88 }
      ]
    };
  }

  /**
   * Generate progress trends
   */
  private generateProgressTrends(
    progressData: Progress[],
    timeframe: { startDate: Date; endDate: Date }
  ): ComprehensiveAnalysisReport['progressTrends'] {
    // This would analyze historical data
    // For now, return mock trend data
    return {
      weeklyProgress: [
        { week: 'Week 1', completion: 20, timeSpent: 3600, trend: 'improving' },
        { week: 'Week 2', completion: 45, timeSpent: 4200, trend: 'improving' },
        { week: 'Week 3', completion: 60, timeSpent: 3800, trend: 'stable' },
        { week: 'Week 4', completion: 75, timeSpent: 4500, trend: 'improving' }
      ],
      monthlyComparison: [
        { month: 'Current', completion: 75, timeSpent: 16100, milestonesAchieved: 3 },
        { month: 'Previous', completion: 60, timeSpent: 12000, milestonesAchieved: 2 }
      ]
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    progressData: Progress[],
    metrics: ProgressMetrics,
    patterns: ComprehensiveAnalysisReport['learningPatterns']
  ): ComprehensiveAnalysisReport['recommendations'] {
    const recommendations = [];

    // Completion rate recommendations
    if (metrics.completionRate < 70) {
      recommendations.push({
        category: 'completion' as const,
        priority: 'high' as const,
        title: 'Improve Completion Rate',
        description: 'Your completion rate could be improved with better learning strategies',
        actionItems: [
          'Set smaller daily learning goals',
          'Use the Pomodoro technique for focused sessions',
          'Review and adjust your learning schedule'
        ]
      });
    }

    // Engagement recommendations
    const interactivePreference = patterns.contentTypePreferences.find(p => p.type === 'interactive');
    if (interactivePreference && interactivePreference.engagementScore > 90) {
      recommendations.push({
        category: 'engagement' as const,
        priority: 'medium' as const,
        title: 'Leverage Interactive Content',
        description: 'You show high engagement with interactive content',
        actionItems: [
          'Prioritize interactive learning modules',
          'Seek out hands-on practice opportunities',
          'Consider project-based learning approaches'
        ]
      });
    }

    return recommendations;
  }
}