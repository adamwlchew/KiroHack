import { PoolClient } from 'pg';
import { logger } from '@pageflow/utils/src/logging/logger';

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  readOnly?: boolean;
  deferrable?: boolean;
}

/**
 * Execute a function within a transaction
 * @param client PostgreSQL client
 * @param fn Function to execute within the transaction
 * @param options Transaction options
 * @returns Result of the function
 */
export async function executeTransaction<T>(
  client: PoolClient,
  fn: (client: PoolClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  // Build transaction start command
  let beginCommand = 'BEGIN';
  
  if (options.isolationLevel) {
    beginCommand += ` ISOLATION LEVEL ${options.isolationLevel}`;
  }
  
  if (options.readOnly) {
    beginCommand += ' READ ONLY';
  }
  
  if (options.deferrable) {
    beginCommand += ' DEFERRABLE';
  }
  
  try {
    // Start transaction
    await client.query(beginCommand);
    
    // Execute function
    const result = await fn(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    // Rollback transaction on error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logger.error({
        message: 'Error rolling back transaction',
        error: rollbackError
      });
    }
    
    logger.error({
      message: 'Transaction rolled back due to error',
      error
    });
    
    throw error;
  }
}

/**
 * Execute multiple functions within a transaction
 * @param client PostgreSQL client
 * @param fns Functions to execute within the transaction
 * @param options Transaction options
 * @returns Results of the functions
 */
export async function executeTransactionBatch<T>(
  client: PoolClient,
  fns: ((client: PoolClient) => Promise<T>)[],
  options: TransactionOptions = {}
): Promise<T[]> {
  return executeTransaction(
    client,
    async (client) => {
      const results: T[] = [];
      
      for (const fn of fns) {
        const result = await fn(client);
        results.push(result);
      }
      
      return results;
    },
    options
  );
}

/**
 * Create a savepoint within a transaction
 * @param client PostgreSQL client
 * @param name Savepoint name
 */
export async function createSavepoint(client: PoolClient, name: string): Promise<void> {
  await client.query(`SAVEPOINT ${name}`);
}

/**
 * Rollback to a savepoint within a transaction
 * @param client PostgreSQL client
 * @param name Savepoint name
 */
export async function rollbackToSavepoint(client: PoolClient, name: string): Promise<void> {
  await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
}

/**
 * Release a savepoint within a transaction
 * @param client PostgreSQL client
 * @param name Savepoint name
 */
export async function releaseSavepoint(client: PoolClient, name: string): Promise<void> {
  await client.query(`RELEASE SAVEPOINT ${name}`);
}