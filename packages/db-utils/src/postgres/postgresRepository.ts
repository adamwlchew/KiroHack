import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '@pageflow/utils/src/logging/logger';

/**
 * PostgreSQL connection configuration
 */
export interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
  max?: number; // Maximum number of clients in the pool
  idleTimeoutMillis?: number; // How long a client is allowed to remain idle before being closed
}

/**
 * Base PostgreSQL repository
 */
export class PostgresRepository {
  protected pool: Pool;
  protected tableName: string;

  /**
   * Create a new PostgreSQL repository
   * @param tableName Table name
   * @param config PostgreSQL configuration (optional)
   */
  constructor(tableName: string, config?: PostgresConfig) {
    this.tableName = tableName;
    
    const poolConfig: PostgresConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
      database: process.env.POSTGRES_DB || 'pageflow',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      ...config
    };

    // Enable SSL in production
    if (process.env.NODE_ENV === 'production') {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    this.pool = new Pool(poolConfig);

    // Log pool errors
    this.pool.on('error', (err) => {
      logger.error({
        message: 'Unexpected error on idle PostgreSQL client',
        error: err
      });
    });

    logger.info({
      message: 'PostgreSQL repository initialized',
      tableName: this.tableName,
      host: poolConfig.host,
      database: poolConfig.database
    });
  }

  /**
   * Execute a query
   * @param text SQL query text
   * @param params Query parameters
   * @returns Query result
   */
  async query<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const start = Date.now();
    
    try {
      const result = await this.pool.query<T>(text, params);
      
      const duration = Date.now() - start;
      logger.debug({
        message: 'Executed query',
        query: text,
        duration,
        rowCount: result.rowCount
      });
      
      return result;
    } catch (error) {
      logger.error({
        message: 'Error executing query',
        query: text,
        params,
        error
      });
      throw error;
    }
  }

  /**
   * Execute a query within a transaction
   * @param callback Callback function that receives a client and executes queries
   * @returns Result of the callback
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
      logger.error({
        message: 'Transaction rolled back',
        error
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find all records
   * @param options Query options
   * @returns Array of records
   */
  async findAll<T extends QueryResultRow>(options: {
    columns?: string[];
    where?: string;
    params?: any[];
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<T[]> {
    const columns = options.columns?.join(', ') || '*';
    const whereClause = options.where ? `WHERE ${options.where}` : '';
    const orderByClause = options.orderBy ? `ORDER BY ${options.orderBy}` : '';
    const limitClause = options.limit ? `LIMIT ${options.limit}` : '';
    const offsetClause = options.offset ? `OFFSET ${options.offset}` : '';
    
    const query = `
      SELECT ${columns}
      FROM ${this.tableName}
      ${whereClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `;
    
    const result = await this.query<T>(query, options.params || []);
    return result.rows;
  }

  /**
   * Find a record by ID
   * @param id Record ID
   * @param idColumn ID column name
   * @returns Record or null if not found
   */
  async findById<T extends QueryResultRow>(id: string | number, idColumn: string = 'id'): Promise<T | null> {
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE ${idColumn} = $1
    `;
    
    const result = await this.query<T>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find a record by a field
   * @param field Field name
   * @param value Field value
   * @returns Record or null if not found
   */
  async findByField<T extends QueryResultRow>(field: string, value: any): Promise<T | null> {
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE ${field} = $1
    `;
    
    const result = await this.query<T>(query, [value]);
    return result.rows[0] || null;
  }

  /**
   * Create a record
   * @param data Record data
   * @returns Created record
   */
  async create<T extends QueryResultRow>(data: Record<string, any>): Promise<T> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query<T>(query, values);
    return result.rows[0];
  }

  /**
   * Update a record
   * @param id Record ID
   * @param data Record data
   * @param idColumn ID column name
   * @returns Updated record
   */
  async update<T extends QueryResultRow>(id: string | number, data: Record<string, any>, idColumn: string = 'id'): Promise<T | null> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE ${idColumn} = $${fields.length + 1}
      RETURNING *
    `;
    
    const result = await this.query<T>(query, [...values, id]);
    return result.rows[0] || null;
  }

  /**
   * Delete a record
   * @param id Record ID
   * @param idColumn ID column name
   * @returns Deleted record
   */
  async delete<T extends QueryResultRow>(id: string | number, idColumn: string = 'id'): Promise<T | null> {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE ${idColumn} = $1
      RETURNING *
    `;
    
    const result = await this.query<T>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Count records
   * @param where Where clause
   * @param params Query parameters
   * @returns Record count
   */
  async count(where?: string, params: any[] = []): Promise<number> {
    const whereClause = where ? `WHERE ${where}` : '';
    
    const query = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
    `;
    
    const result = await this.query<{ count: string }>(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    logger.info({
      message: 'PostgreSQL connection pool closed',
      tableName: this.tableName
    });
  }
}