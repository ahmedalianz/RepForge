import type { Database } from '../types';
import { initialSchema } from './001_initial';
import { dashboardSchema } from './002_dashboard';
import { workoutEditorSchema } from './003_workout_editor';
export const migrations = [
  { version: 1, statements: initialSchema },
  { version: 2, statements: dashboardSchema },
  { version: 3, statements: workoutEditorSchema },
] as const;
export function migrateDatabase(database: Database): void {
  database.execute('PRAGMA foreign_keys = ON');
  database.execute('PRAGMA journal_mode = WAL');
  // FULL sync favors preserving acknowledged sets through power loss.
  database.execute('PRAGMA synchronous = FULL');
  database.transaction(tx => {
    const version = Number(
      tx.execute('PRAGMA user_version').rows[0]?.user_version ?? 0,
    );
    const latestVersion = migrations[migrations.length - 1]?.version ?? 0;
    if (version > latestVersion) {
      throw new Error(
        'Database is newer than this app. Install the latest app version.',
      );
    }
    for (const migration of migrations) {
      if (migration.version > version) {
        for (const statement of migration.statements) {
          tx.execute(statement);
        }
        tx.execute(`PRAGMA user_version = ${migration.version}`);
      }
    }
  });
}
