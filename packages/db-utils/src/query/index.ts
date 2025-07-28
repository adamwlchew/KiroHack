import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '@pageflow/utils/src/logging/logger';

/**
 * Query builder for PostgreSQL
 */
export class QueryBuilder {
  private selectClause: string[] = [];
  private fromClause: string = '';
  private joinClauses: string[] = [];
  private whereConditions: string[] = [];
  private groupByClause: string[] = [];
  private havingConditions: string[] = [];
  private orderByClause: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private params: any[] = [];

  /**
   * Add SELECT clause
   * @param columns Columns to select
   * @returns This query builder
   */
  select(...columns: string[]): QueryBuilder {
    this.selectClause = columns.length > 0 ? columns : ['*'];
    return this;
  }

  /**
   * Add FROM clause
   * @param table Table name
   * @param alias Table alias
   * @returns This query builder
   */
  from(table: string, alias?: string): QueryBuilder {
    this.fromClause = alias ? `${table} AS ${alias}` : table;
    return this;
  }

  /**
   * Add JOIN clause
   * @param table Table to join
   * @param condition Join condition
   * @param type Join type
   * @returns This query builder
   */
  join(table: string, condition: string, type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'): QueryBuilder {
    this.joinClauses.push(`${type} JOIN ${table} ON ${condition}`);
    return this;
  }

  /**
   * Add WHERE condition
   * @param condition Where condition
   * @param params Query parameters
   * @returns This query builder
   */
  where(condition: string, ...params: any[]): QueryBuilder {
    this.whereConditions.push(condition);
    this.params.push(...params);
    return this;
  }

  /**
   * Add GROUP BY clause
   * @param columns Columns to group by
   * @returns This query builder
   */
  groupBy(...columns: string[]): QueryBuilder {
    this.groupByClause.push(...columns);
    return this;
  }

  /**
   * Add HAVING condition
   * @param condition Having condition
   * @param params Query parameters
   * @returns This query builder
   */
  having(condition: string, ...params: any[]): QueryBuilder {
    this.havingConditions.push(condition);
    this.params.push(...params);
    return this;
  }

  /**
   * Add ORDER BY clause
   * @param column Column to order by
   * @param direction Sort direction
   * @returns This query builder
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderByClause.push(`${column} ${direction}`);
    return this;
  }

  /**
   * Add LIMIT clause
   * @param limit Limit value
   * @returns This query builder
   */
  limit(limit: number): QueryBuilder {
    this.limitValue = limit;
    return this;
  }

  /**
   * Add OFFSET clause
   * @param offset Offset value
   * @returns This query builder
   */
  offset(offset: number): QueryBuilder {
    this.offsetValue = offset;
    return this;
  }

  /**
   * Build the SQL query
   * @returns SQL query
   */
  build(): { text: string; params: any[] } {
    const parts: string[] = [];

    // SELECT clause
    parts.push(`SELECT ${this.selectClause.join(', ')}`);

    // FROM clause
    parts.push(`FROM ${this.fromClause}`);

    // JOIN clauses
    if (this.joinClauses.length > 0) {
      parts.push(this.joinClauses.join(' '));
    }

    // WHERE clause
    if (this.whereConditions.length > 0) {
      parts.push(`WHERE ${this.whereConditions.join(' AND ')}`);
    }

    // GROUP BY clause
    if (this.groupByClause.length > 0) {
      parts.push(`GROUP BY ${this.groupByClause.join(', ')}`);
    }

    // HAVING clause
    if (this.havingConditions.length > 0) {
      parts.push(`HAVING ${this.havingConditions.join(' AND ')}`);
    }

    // ORDER BY clause
    if (this.orderByClause.length > 0) {
      parts.push(`ORDER BY ${this.orderByClause.join(', ')}`);
    }

    // LIMIT clause
    if (this.limitValue !== undefined) {
      parts.push(`LIMIT ${this.limitValue}`);
    }

    // OFFSET clause
    if (this.offsetValue !== undefined) {
      parts.push(`OFFSET ${this.offsetValue}`);
    }

    return {
      text: parts.join(' '),
      params: this.params
    };
  }

  /**
   * Execute the query
   * @param client PostgreSQL client
   * @returns Query result
   */
  async execute<T extends QueryResultRow = any>(client: PoolClient): Promise<QueryResult<T>> {
    const { text, params } = this.build();
    
    try {
      return await client.query<T>(text, params);
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
}

/**
 * Create a new query builder
 * @returns Query builder
 */
export function createQueryBuilder(): QueryBuilder {
  return new QueryBuilder();
}

/**
 * Execute a raw SQL query
 * @param client PostgreSQL client
 * @param text SQL query text
 * @param params Query parameters
 * @returns Query result
 */
export async function executeRawQuery<T extends QueryResultRow = any>(
  client: PoolClient,
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  try {
    return await client.query<T>(text, params) as QueryResult<T>;
  } catch (error) {
    logger.error({
      message: 'Error executing raw query',
      query: text,
      params,
      error
    });
    throw error;
  }
}