import { DatabaseSync } from 'node:sqlite';
import { createDatabaseAdapter } from '../../src/database/adapter';
export function openDatabase(path = ':memory:') {
  const sqlite = new DatabaseSync(path);
  return createDatabaseAdapter(
    (sql, parameters = []) => {
      const query = sqlite.prepare(sql);
      if (query.columns().length) {
        return { rows: query.all(...parameters), rowsAffected: 0 };
      }
      const result = query.run(...parameters);
      return { rows: [], rowsAffected: Number(result.changes) };
    },
    () => sqlite.close(),
  );
}
