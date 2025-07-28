import { BedrockConfig } from '../config';

describe('Bedrock Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration Validation', () => {
    it('should validate successfully with default configuration', () => {
      // This test ensures the default config passes validation
      expect(() => {
        require('../config');
      }).not.toThrow();
    });

    it('should throw error for invalid daily limit', () => {
      process.env.BEDROCK_DAILY_LIMIT = '-10';
      
      expect(() => {
        jest.resetModules();
        require('../config');
      }).toThrow('Daily cost limit must be positive');
    });

    it('should throw error for invalid monthly limit', () => {
      process.env.BEDROCK_MONTHLY_LIMIT = '0';
      
      expect(() => {
        jest.resetModules();
        require('../config');
      }).toThrow('Monthly cost limit must be positive');
    });

    it('should throw error for invalid warning threshold', () => {
      process.env.BEDROCK_WARNING_THRESHOLD = '150';
      
      expect(() => {
        jest.resetModules();
        require('../config');
      }).toThrow('Warning threshold must be between 0 and 100');
    });

    it('should use default region when AWS_REGION is not set', () => {
      delete process.env.AWS_REGION;
      
      jest.resetModules();
      const { config } = require('../config');
      
      expect(config.region).toBe('ap-southeast-2');
    });
  });

  describe('Environment Variable Parsing', () => {
    it('should parse numeric environment variables correctly', () => {
      process.env.CLAUDE_MAX_TOKENS = '5000';
      process.env.CLAUDE_TEMPERATURE = '0.8';
      process.env.BEDROCK_CACHE_TTL = '7200';
      
      jest.resetModules();
      const { config } = require('../config');
      
      expect(config.models.claude.maxTokens).toBe(5000);
      expect(config.models.claude.temperature).toBe(0.8);
      expect(config.caching.ttl).toBe(7200);
    });

    it('should parse boolean environment variables correctly', () => {
      process.env.BEDROCK_CACHE_ENABLED = 'false';
      
      jest.resetModules();
      const { config } = require('../config');
      
      expect(config.caching.enabled).toBe(false);
    });

    it('should use fallback values when environment variables are not set', () => {
      // Clear relevant env vars
      delete process.env.CLAUDE_MODEL_ID;
      delete process.env.TITAN_MAX_TOKENS;
      
      jest.resetModules();
      const { config } = require('../config');
      
      expect(config.models.claude.modelId).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
      expect(config.models.titan.maxTokens).toBe(3000);
    });
  });

  describe('Model Configuration', () => {
    it('should have all required model configurations', () => {
      const { config } = require('../config');
      
      expect(config.models.claude).toBeDefined();
      expect(config.models.titan).toBeDefined();
      expect(config.models.stableDiffusion).toBeDefined();
      expect(config.models.cohere).toBeDefined();
    });

    it('should have fallback models configured for critical models', () => {
      const { config } = require('../config');
      
      expect(config.models.claude.fallbackModelId).toBeDefined();
      expect(config.models.titan.fallbackModelId).toBeDefined();
      expect(config.models.cohere.fallbackModelId).toBeDefined();
    });
  });
});