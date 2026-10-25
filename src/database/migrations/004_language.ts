/** Display language only: no workout, exercise, routine or metric values change. */
export const languageSchema = [
  "ALTER TABLE app_preferences ADD COLUMN language TEXT NOT NULL DEFAULT 'ar-EG' CHECK(language IN ('ar-EG','en-US'))",
];
