/**
 * Shared TypeScript type definitions used across the application.
 */
export type DailyRecord = {
  dateStr: string; // YYYY-MM-DD
  up: number;
  down: number;
  total: number;
};
