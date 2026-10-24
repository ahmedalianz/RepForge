export type SqlValue = string | number | null;
export type SqlRow = Record<string, unknown>;
/** Small synchronous boundary: transactions must never contain await or UI work. */
export type Database = {
  execute(
    sql: string,
    parameters?: SqlValue[],
  ): { rows: SqlRow[]; rowsAffected: number };
  transaction<T>(work: (database: Database) => T): T;
  close(): void;
};
