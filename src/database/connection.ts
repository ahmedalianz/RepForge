import { open } from 'react-native-nitro-sqlite';
import { createDatabaseAdapter } from './adapter';
import { migrateDatabase } from './migrations';
import type { Database } from './types';
let connection: Database | undefined;
export function getDatabase(): Database {
  if (connection) {
    return connection;
  }
  // Keep the original filename: a display-name change must not reset local history.
  const native = open({ name: 'muscleforge.sqlite' });
  const database = createDatabaseAdapter(
    (sql, parameters) => {
      const result = native.execute(sql, parameters);
      return { rows: result.rows._array, rowsAffected: result.rowsAffected };
    },
    () => native.close(),
  );
  try {
    migrateDatabase(database);
  } catch (error) {
    database.close();
    throw error;
  }
  connection = database;
  return database;
}
