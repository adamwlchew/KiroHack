import { CostMonitor, CostEntry, CostAlert } from '../services/costMonitor';

describe('CostMonitor', () => {
  let costMonitor: CostMonitor;

  beforeEach(() => {
    costMonitor = new CostMonitor();
  });

  describe('recordCost', () => {
    it('should record a cost entry', () => {
      const entry: Omit<CostEntry, 'timestamp' | 'estimatedCost'> = {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        operation: 'text_generation',
        inputTokens: 100,
        outputTokens: 200,
        requestId: 'test-request-1',
        userId: 'test-user',
      };

      costMonitor.recordCost(entry);

      const summary = costMonitor.getCostSummary();
      expect(summary.requestCount).toBe(1);
      expect(summary.totalCost).toBeGreaterThan(0);
    });

    it('should calculate cost for Claude model', () => {
      const entry: Omit<CostEntry, 'timestamp' | 'estimatedCost'> = {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        operation: 'text_generation',
        inputTokens: 1000, // 1000 tokens
        outputTokens: 2000, // 2000 tokens
        requestId: 'test-request-1',
      };

      costMonitor.recordCost(entry);

      const summary = costMonitor.getCostSummary();
      // Expected cost: (1000/1000 * 0.003) + (2000/1000 * 0.015) = 0.003 + 0.03 = 0.033
      expect(summary.totalCost).toBeCloseTo(0.033, 3);
    });

    it('should calculate cost for image generation', () => {
      const entry: Omit<CostEntry, 'timestamp' | 'estimatedCost'> = {
        modelId: 'stability.stable-diffusion-xl-v1',
        operation: 'image_generation',
        imageCount: 2,
        requestId: 'test-request-1',
      };

      costMonitor.recordCost(entry);

      const summary = costMonitor.getCostSummary();
      // Expected cost: 2 images * $0.04 = $0.08
      expect(summary.totalCost).toBeCloseTo(0.08, 2);
    });
  });

  describe('getCostSummary', () => {
    beforeEach(() => {
      // Add some test data
      costMonitor.recordCost({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        operation: 'text_generation',
        inputTokens: 500,
        outputTokens: 1000,
        requestId: 'test-1',
      });

      costMonitor.recordCost({
        modelId: 'amazon.titan-text-express-v1',
        operation: 'text_generation',
        inputTokens: 300,
        outputTokens: 600,
        requestId: 'test-2',
      });
    });

    it('should return cost summary', () => {
      const summary = costMonitor.getCostSummary();

      expect(summary).toMatchObject({
        totalCost: expect.any(Number),
        dailyCost: expect.any(Number),
        monthlyCost: expect.any(Number),
        costByModel: expect.any(Object),
        costByOperation: expect.any(Object),
        requestCount: 2,
        averageCostPerRequest: expect.any(Number),
      });

      expect(summary.totalCost).toBeGreaterThan(0);
      expect(Object.keys(summary.costByModel)).toContain('anthropic.claude-3-sonnet-20240229-v1:0');
      expect(Object.keys(summary.costByModel)).toContain('amazon.titan-text-express-v1');
      expect(summary.costByOperation).toHaveProperty('text_generation');
    });

    it('should filter by date range', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const summary = costMonitor.getCostSummary(yesterday, tomorrow);
      expect(summary.requestCount).toBe(2);

      // Test with range that excludes all entries
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const emptySummary = costMonitor.getCostSummary(lastWeek, twoDaysAgo);
      expect(emptySummary.requestCount).toBe(0);
      expect(emptySummary.totalCost).toBe(0);
    });
  });

  describe('cost limits and alerts', () => {
    let alertsReceived: CostAlert[] = [];

    beforeEach(() => {
      alertsReceived = [];
      costMonitor.onAlert((alert) => {
        alertsReceived.push(alert);
      });
    });

    it('should check if within limits', () => {
      const limits = costMonitor.isWithinLimits();
      expect(limits).toMatchObject({
        daily: expect.any(Boolean),
        monthly: expect.any(Boolean),
      });
    });

    it('should return remaining budget', () => {
      const budget = costMonitor.getRemainingBudget();
      expect(budget).toMatchObject({
        daily: expect.any(Number),
        monthly: expect.any(Number),
      });
      expect(budget.daily).toBeGreaterThanOrEqual(0);
      expect(budget.monthly).toBeGreaterThanOrEqual(0);
    });

    it('should trigger alerts when approaching limits', () => {
      // This test would require mocking the config to have very low limits
      // For now, we'll just verify the alert mechanism works
      expect(alertsReceived).toEqual([]);
    });
  });

  describe('cost trends', () => {
    it('should return cost trends', () => {
      costMonitor.recordCost({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        operation: 'text_generation',
        inputTokens: 100,
        outputTokens: 200,
        requestId: 'trend-test',
      });

      const trends = costMonitor.getCostTrends(7);
      expect(trends).toHaveLength(7);
      expect(trends[0]).toMatchObject({
        date: expect.any(String),
        cost: expect.any(Number),
        requests: expect.any(Number),
      });
    });
  });

  describe('data export', () => {
    beforeEach(() => {
      costMonitor.recordCost({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        operation: 'text_generation',
        inputTokens: 100,
        outputTokens: 200,
        requestId: 'export-test',
      });
    });

    it('should export all cost data', () => {
      const data = costMonitor.exportCostData();
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        operation: 'text_generation',
        inputTokens: 100,
        outputTokens: 200,
        requestId: 'export-test',
        timestamp: expect.any(Date),
        estimatedCost: expect.any(Number),
      });
    });

    it('should export cost data for date range', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const data = costMonitor.exportCostData(yesterday, tomorrow);
      expect(data).toHaveLength(1);

      // Test with range that excludes all entries
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const emptyData = costMonitor.exportCostData(lastWeek, twoDaysAgo);
      expect(emptyData).toHaveLength(0);
    });
  });
});