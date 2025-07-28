// Test setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.COGNITO_USER_POOL_ID = 'test-user-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.AWS_REGION = 'us-east-1';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock AWS SDK globally for tests
jest.mock('@aws-sdk/client-cognito-identity-provider');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');