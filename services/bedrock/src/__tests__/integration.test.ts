import { config } from '../config';

describe('Bedrock Service Integration', () => {
  it('should have valid configuration', () => {
    expect(config).toBeDefined();
    expect(config.region).toBeDefined();
    expect(config.models).toBeDefined();
    expect(config.models.claude).toBeDefined();
    expect(config.models.titan).toBeDefined();
    expect(config.models.stableDiffusion).toBeDefined();
    expect(config.models.cohere).toBeDefined();
  });

  it('should have cost limits configured', () => {
    expect(config.costLimits.dailyLimit).toBeGreaterThan(0);
    expect(config.costLimits.monthlyLimit).toBeGreaterThan(0);
    expect(config.costLimits.warningThreshold).toBeGreaterThanOrEqual(0);
    expect(config.costLimits.warningThreshold).toBeLessThanOrEqual(100);
  });

  it('should have caching configuration', () => {
    expect(typeof config.caching.enabled).toBe('boolean');
    expect(config.caching.ttl).toBeGreaterThan(0);
    expect(config.caching.maxSize).toBeGreaterThan(0);
  });

  it('should have retry policy configured', () => {
    expect(config.retryPolicy.maxRetries).toBeGreaterThanOrEqual(0);
    expect(config.retryPolicy.baseDelay).toBeGreaterThan(0);
    expect(config.retryPolicy.maxDelay).toBeGreaterThan(0);
    expect(config.retryPolicy.maxDelay).toBeGreaterThanOrEqual(config.retryPolicy.baseDelay);
  });
});