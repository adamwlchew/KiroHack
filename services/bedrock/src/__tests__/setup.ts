// Test setup file
import { logger } from '@pageflow/utils';

// Mock logger to prevent console output during tests
jest.mock('@pageflow/utils', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.BEDROCK_DAILY_LIMIT = '10';
process.env.BEDROCK_MONTHLY_LIMIT = '100';
process.env.BEDROCK_CACHE_ENABLED = 'true';

// Global test timeout
jest.setTimeout(10000);