/**
 * PostgreSQL client
 */

import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { logger } from '@pageflow/utils/src/logging/logger';

/**
 * PostgreSQL client configuration
 */
export interface PostgresClientConfig extends PoolConfig {
  /** Application name */
  applicationName?: string;
  /** Maximum query execution time in milliseconds */
  statementTimeout?: number;
  /** Maximum connection idle time in milliseconds */
  idleTimeout?: number;
}

/**
 * Default PostgreSQL client configuration
 */
const defaultConfig: PostgresClientConfig = {
  applicationName: 'pageflow',
  statementTimeout: 30000, // 30 seconds
  idleTimeout: 10000, // 10 seconds
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Connection timeout after 5 seconds
};

/**
 * PostgreSQL client wrapper
 */
export class PostgresClient {
  private pool: Pool;
  private logger = logger.child({ serviceName: 'postgres-client' });

  /**
   * Creates a new PostgreSQL client
   * 
   * @param config Client configuration
   */
  constructor(config: PostgresClientConfig = {}) {
    const mergedConfig = { ...defaultConfig, ...config };
    
    // Create connection pool
    this.pool = new Pool(mergedConfig);
    
    // Set up event handlers
    this.pool.on('error', (err) => {
      this.logger.error({
        message: 'Unexpected error on idle client',
        error: err
      });
    });
    
    this.logger.info({
      message: 'PostgreSQL client initialized',
      host: mergedConfig.host || 'localhost',
      database: mergedConfig.database,
      applicationName: mergedConfig.applicationName,
    });
  }

  /**
   * Gets the connection pool
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Acquires a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Executes a query
   * 
   * @param text Query text
   * @param params Query parameters
   */
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    this.logger.debug({
      message: 'Executing query',
      query: text
    });
    return this.pool.query<T>(text, params);
  }

  /**
   * Executes a query and returns the first row
   * 
   * @param text Query text
   * @param params Query parameters
   */
  async queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Executes a query and returns all rows
   * 
   * @param text Query text
   * @param params Query parameters
   */
  async queryAll<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  }

  /**
   * Executes a query within a transaction
   * 
   * @param callback Transaction callback
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Closes the connection pool
   */
  async close(): Promise<void> {
    this.logger.info('Closing PostgreSQL connection pool');
    await this.pool.end();
  }
}

/**
 * Creates a new PostgreSQL client
 * 
 * @param config Client configuration
 */
export function createPostgresClient(config?: PostgresClientConfig): PostgresClient {
  return new PostgresClient(config);
}