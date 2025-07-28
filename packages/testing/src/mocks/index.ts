import { mock } from 'jest-mock-extended';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Pool, PoolClient } from 'pg';

/**
 * Create a mock DynamoDB document client
 * @returns Mock DynamoDB document client
 */
export function createMockDynamoDbClient() {
  return mock<DynamoDBDocumentClient>();
}

/**
 * Create a mock PostgreSQL pool
 * @returns Mock PostgreSQL pool
 */
export function createMockPgPool() {
  return mock<Pool>();
}

/**
 * Create a mock PostgreSQL client
 * @returns Mock PostgreSQL client
 */
export function createMockPgClient() {
  return mock<PoolClient>();
}

/**
 * Create a mock Express request
 * @param overrides Request overrides
 * @returns Mock Express request
 */
export function createMockExpressRequest(overrides: Record<string, any> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    session: {},
    user: undefined,
    ...overrides
  };
}

/**
 * Create a mock Express response
 * @returns Mock Express response
 */
export function createMockExpressResponse() {
  const res: any = {};
  
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  
  return res;
}

/**
 * Create a mock Express next function
 * @returns Mock Express next function
 */
export function createMockExpressNext() {
  return jest.fn();
}

/**
 * Create a mock AWS Bedrock client
 * @returns Mock AWS Bedrock client
 */
export function createMockBedrockClient() {
  return {
    invokeClaudeModel: jest.fn(),
    invokeTitanModel: jest.fn(),
    invokeStableDiffusionModel: jest.fn(),
    invokeCohereModel: jest.fn()
  };
}

/**
 * Create a mock logger
 * @returns Mock logger
 */
export function createMockLogger() {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    setCorrelationId: jest.fn(),
    setUserId: jest.fn(),
    child: jest.fn().mockReturnThis()
  };
}