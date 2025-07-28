import { Pool } from 'pg';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Run a test with a PostgreSQL pool
 * @param fn Test function
 * @param config PostgreSQL configuration
 */
export async function runWithPgPool<T>(
  fn: (pool: Pool) => Promise<T>,
  config: any = {}
): Promise<T> {
  // Use test database configuration
  const testConfig = {
    host: process.env.TEST_POSTGRES_HOST || 'localhost',
    port: process.env.TEST_POSTGRES_PORT ? parseInt(process.env.TEST_POSTGRES_PORT, 10) : 5432,
    database: process.env.TEST_POSTGRES_DB || 'pageflow_test',
    user: process.env.TEST_POSTGRES_USER || 'postgres',
    password: process.env.TEST_POSTGRES_PASSWORD || 'postgres',
    ...config
  };
  
  const pool = new Pool(testConfig);
  
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

/**
 * Run a test with a DynamoDB client
 * @param fn Test function
 * @param config DynamoDB configuration
 */
export async function runWithDynamoDbClient<T>(
  fn: (client: DynamoDBDocumentClient) => Promise<T>,
  config: any = {}
): Promise<T> {
  // Import here to avoid circular dependencies
  const { createDynamoDbClient } = require('@pageflow/db-utils');
  
  // Use test DynamoDB configuration
  const testConfig = {
    region: process.env.TEST_AWS_REGION || 'us-east-1',
    endpoint: process.env.TEST_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    ...config
  };
  
  const client = createDynamoDbClient(testConfig);
  
  try {
    return await fn(client);
  } finally {
    // No need to close DynamoDB client
  }
}

/**
 * Run a test with a clean database
 * @param fn Test function
 * @param tables Tables to clean
 */
export async function runWithCleanDatabase<T>(
  fn: () => Promise<T>,
  tables: string[] = []
): Promise<T> {
  // Clean tables before test
  await cleanTables(tables);
  
  try {
    return await fn();
  } finally {
    // Clean tables after test
    await cleanTables(tables);
  }
}

/**
 * Clean database tables
 * @param tables Tables to clean
 */
async function cleanTables(tables: string[]): Promise<void> {
  if (tables.length === 0) {
    return;
  }
  
  await runWithPgPool(async (pool) => {
    for (const table of tables) {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
  });
}

/**
 * Run a test with a transaction
 * @param fn Test function
 */
export async function runWithTransaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  return runWithPgPool(async (pool) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('ROLLBACK'); // Always rollback in tests
      return result;
    } finally {
      client.release();
    }
  });
}