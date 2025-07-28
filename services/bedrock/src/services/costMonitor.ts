import { logger } from '@pageflow/utils';
import { config } from '../config';

export interface CostEntry {
  timestamp: Date;
  modelId: string;
  operation: 'text_generation' | 'image_generation' | 'embedding' | 'summarization';
  inputTokens?: number;
  outputTokens?: number;
  imageCount?: number;
  estimatedCost: number;
  requestId: string;
  userId?: string;
}

export interface CostSummary {
  totalCost: number;
  dailyCost: number;
  monthlyCost: number;
  costByModel: Record<string, number>;
  costByOperation: Record<string, number>;
  requestCount: number;
  averageCostPerRequest: number;
}

export interface CostAlert {
  type: 'daily_warning' | 'daily_limit' | 'monthly_warning' | 'monthly_limit';
  threshold: number;
  currentAmount: number;
  percentage: number;
  timestamp: Date;
}

/**
 * Approximate cost per 1000 tokens for different models (in USD)
 * These are estimates and should be updated based on actual AWS pricing
 */
const MODEL_COSTS = {
  // Claude models
  'anthropic.claude-3-sonnet-20240229-v1:0': { input: 0.003, output: 0.015 },
  'anthropic.claude-3-haiku-20240307-v1:0': { input: 0.00025, output: 0.00125 },
  'anthropic.claude-3-opus-20240229-v1:0': { input: 0.015, output: 0.075 },
  
  // Titan models
  'amazon.titan-text-express-v1': { input: 0.0008, output: 0.0016 },
  'amazon.titan-text-lite-v1': { input: 0.0003, output: 0.0004 },
  'amazon.titan-embed-text-v1': { input: 0.0001, output: 0 },
  
  // Stable Diffusion (per image)
  'stability.stable-diffusion-xl-v1': { perImage: 0.04 },
  
  // Cohere models
  'cohere.command-text-v14': { input: 0.0015, output: 0.002 },
  'cohere.command-light-text-v14': { input: 0.0003, output: 0.0006 },
  'cohere.embed-english-v3': { input: 0.0001, output: 0 },
};

export class CostMonitor {
  private costEntries: CostEntry[] = [];
  private alertCallbacks: ((alert: CostAlert) => void)[] = [];
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Clean up old entries periodically
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldEntries();
      }, 60 * 60 * 1000); // Every hour
    }
  }

  /**
   * Record a cost entry for a Bedrock operation
   */
  recordCost(entry: Omit<CostEntry, 'timestamp' | 'estimatedCost'> & { estimatedCost?: number }): void {
    const costEntry: CostEntry = {
      ...entry,
      timestamp: new Date(),
      estimatedCost: entry.estimatedCost || this.calculateCost(entry),
    };

    this.costEntries.push(costEntry);

    logger.debug({
      message: 'Recorded cost entry',
      modelId: costEntry.modelId,
      operation: costEntry.operation,
      estimatedCost: costEntry.estimatedCost,
      requestId: costEntry.requestId,
    });

    // Check for cost alerts
    this.checkCostAlerts();
  }

  /**
   * Calculate estimated cost for an operation
   */
  private calculateCost(entry: Omit<CostEntry, 'timestamp' | 'estimatedCost'>): number {
    const modelCost = MODEL_COSTS[entry.modelId as keyof typeof MODEL_COSTS];
    
    if (!modelCost) {
      logger.warn({ message: 'Unknown model for cost calculation', modelId: entry.modelId });
      return 0;
    }

    let cost = 0;

    if (entry.operation === 'image_generation' && 'perImage' in modelCost) {
      cost = (entry.imageCount || 1) * modelCost.perImage;
    } else if ('input' in modelCost && 'output' in modelCost) {
      const inputCost = ((entry.inputTokens || 0) / 1000) * modelCost.input;
      const outputCost = ((entry.outputTokens || 0) / 1000) * modelCost.output;
      cost = inputCost + outputCost;
    }

    return cost;
  }

  /**
   * Get cost summary for a specific time period
   */
  getCostSummary(startDate?: Date, endDate?: Date): CostSummary {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
    const end = endDate || now;

    const relevantEntries = this.costEntries.filter(entry => 
      entry.timestamp >= start && entry.timestamp <= end
    );

    const totalCost = relevantEntries.reduce((sum, entry) => sum + entry.estimatedCost, 0);
    
    // Daily cost (last 24 hours)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dailyEntries = this.costEntries.filter(entry => entry.timestamp >= dayAgo);
    const dailyCost = dailyEntries.reduce((sum, entry) => sum + entry.estimatedCost, 0);

    // Monthly cost (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEntries = this.costEntries.filter(entry => entry.timestamp >= monthStart);
    const monthlyCost = monthlyEntries.reduce((sum, entry) => sum + entry.estimatedCost, 0);

    // Cost by model
    const costByModel: Record<string, number> = {};
    relevantEntries.forEach(entry => {
      costByModel[entry.modelId] = (costByModel[entry.modelId] || 0) + entry.estimatedCost;
    });

    // Cost by operation
    const costByOperation: Record<string, number> = {};
    relevantEntries.forEach(entry => {
      costByOperation[entry.operation] = (costByOperation[entry.operation] || 0) + entry.estimatedCost;
    });

    return {
      totalCost,
      dailyCost,
      monthlyCost,
      costByModel,
      costByOperation,
      requestCount: relevantEntries.length,
      averageCostPerRequest: relevantEntries.length > 0 ? totalCost / relevantEntries.length : 0,
    };
  }

  /**
   * Check for cost alerts and trigger callbacks
   */
  private checkCostAlerts(): void {
    const summary = this.getCostSummary();
    const alerts: CostAlert[] = [];

    // Check daily limits
    const dailyWarningThreshold = config.costLimits.dailyLimit * (config.costLimits.warningThreshold / 100);
    if (summary.dailyCost >= dailyWarningThreshold && summary.dailyCost < config.costLimits.dailyLimit) {
      alerts.push({
        type: 'daily_warning',
        threshold: dailyWarningThreshold,
        currentAmount: summary.dailyCost,
        percentage: (summary.dailyCost / config.costLimits.dailyLimit) * 100,
        timestamp: new Date(),
      });
    }

    if (summary.dailyCost >= config.costLimits.dailyLimit) {
      alerts.push({
        type: 'daily_limit',
        threshold: config.costLimits.dailyLimit,
        currentAmount: summary.dailyCost,
        percentage: (summary.dailyCost / config.costLimits.dailyLimit) * 100,
        timestamp: new Date(),
      });
    }

    // Check monthly limits
    const monthlyWarningThreshold = config.costLimits.monthlyLimit * (config.costLimits.warningThreshold / 100);
    if (summary.monthlyCost >= monthlyWarningThreshold && summary.monthlyCost < config.costLimits.monthlyLimit) {
      alerts.push({
        type: 'monthly_warning',
        threshold: monthlyWarningThreshold,
        currentAmount: summary.monthlyCost,
        percentage: (summary.monthlyCost / config.costLimits.monthlyLimit) * 100,
        timestamp: new Date(),
      });
    }

    if (summary.monthlyCost >= config.costLimits.monthlyLimit) {
      alerts.push({
        type: 'monthly_limit',
        threshold: config.costLimits.monthlyLimit,
        currentAmount: summary.monthlyCost,
        percentage: (summary.monthlyCost / config.costLimits.monthlyLimit) * 100,
        timestamp: new Date(),
      });
    }

    // Trigger alert callbacks
    alerts.forEach(alert => {
      logger.warn({ message: 'Cost alert triggered', ...alert });
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          logger.error({ message: 'Error in cost alert callback', error });
        }
      });
    });
  }

  /**
   * Add a callback for cost alerts
   */
  onAlert(callback: (alert: CostAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Check if we're within cost limits
   */
  isWithinLimits(): { daily: boolean; monthly: boolean } {
    const summary = this.getCostSummary();
    return {
      daily: summary.dailyCost < config.costLimits.dailyLimit,
      monthly: summary.monthlyCost < config.costLimits.monthlyLimit,
    };
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): { daily: number; monthly: number } {
    const summary = this.getCostSummary();
    return {
      daily: Math.max(0, config.costLimits.dailyLimit - summary.dailyCost),
      monthly: Math.max(0, config.costLimits.monthlyLimit - summary.monthlyCost),
    };
  }

  /**
   * Clean up old cost entries (older than 3 months)
   */
  private cleanupOldEntries(): void {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const initialCount = this.costEntries.length;
    this.costEntries = this.costEntries.filter(entry => entry.timestamp >= threeMonthsAgo);
    const removedCount = initialCount - this.costEntries.length;

    if (removedCount > 0) {
      logger.info({ message: 'Cleaned up old cost entries', removedCount, remainingCount: this.costEntries.length });
    }
  }

  /**
   * Export cost data for analysis
   */
  exportCostData(startDate?: Date, endDate?: Date): CostEntry[] {
    if (!startDate && !endDate) {
      return [...this.costEntries];
    }

    return this.costEntries.filter(entry => {
      if (startDate && entry.timestamp < startDate) return false;
      if (endDate && entry.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Get cost trends over time
   */
  getCostTrends(days: number = 30): Array<{ date: string; cost: number; requests: number }> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const trends: Array<{ date: string; cost: number; requests: number }> = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const dayEntries = this.costEntries.filter(entry => 
        entry.timestamp >= date && entry.timestamp < nextDate
      );
      
      const cost = dayEntries.reduce((sum, entry) => sum + entry.estimatedCost, 0);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        cost,
        requests: dayEntries.length,
      });
    }
    
    return trends;
  }

  /**
   * Cleanup method for tests
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const costMonitor = new CostMonitor();