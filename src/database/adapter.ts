import type { Database, SqlValue } from './types';
type SqlExecutor = (
  sql: string,
  parameters?: SqlValue[],
) => ReturnType<Database['execute']>;
export function createDatabaseAdapter(
  execute: SqlExecutor,
  close: () => void,
): Database {
  const database: Database = {
    execute,
    close,
    transaction: work => {
      execute('BEGIN IMMEDIATE');
      try {
        const result = work(database);
        if (result instanceof Promise) {
          throw new Error('Database transactions must be synchronous');
        }
        execute('COMMIT');
        return result;
      } catch (error) {
        try {
          execute('ROLLBACK');
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            'Transaction and rollback failed',
          );
        }
        throw error;
      }
    },
  };
  return database;
}
