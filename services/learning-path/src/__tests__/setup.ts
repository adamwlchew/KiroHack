import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DB = 'pageflow_test';
process.env.POSTGRES_USER = 'postgres';
process.env.POSTGRES_PASSWORD = 'postgres';

// Mock logger to avoid console output during tests
jest.mock('@pageflow/utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    }))
  },
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number, public errorCode: string) {
      super(message);
      this.name = 'AppError';
    }
  }
}));

// Global test timeout
jest.setTimeout(10000); 