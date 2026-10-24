import type { Database } from './types';
/** Generate local UUID v4 IDs with SQLite's secure random source, without a JS dependency. */
export function createLocalId(database: Database): string {
  const id = database.execute(
    `SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',(random() & 3)+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))) AS id`,
  ).rows[0]?.id;
  if (typeof id !== 'string') {
    throw new Error('Could not generate a local identifier');
  }
  return id;
}
