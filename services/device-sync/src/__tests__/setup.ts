// Test setup for device-sync service
import { jest } from '@jest/globals';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Mock logger
jest.mock('@pageflow/utils/src/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
    setCorrelationId: jest.fn(),
    setUserId: jest.fn(),
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';

// Global test timeout
jest.setTimeout(10000);