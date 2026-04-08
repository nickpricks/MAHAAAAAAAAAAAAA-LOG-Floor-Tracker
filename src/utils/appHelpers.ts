import { DailyRecord } from '@/types';
import { getTodayKey } from '@utils/date';
import { syncRecordToCloud } from '@utils/firebase';

/**
 * Scoring formula: up = 1 point, down = 0.5 points.
 */
export const calculateTotal = (up: number, down: number): number => up + down * 0.5;

/**
 * Calculates the new state for a tap event.
 */
export const calculateTapUpdate = (
  prev: Record<string, DailyRecord>,
  type: 'up' | 'down',
  userId: string | null,
  targetDate?: string
): Record<string, DailyRecord> => {
  const dateKey = targetDate ?? getTodayKey();
  const existing = prev[dateKey] || { dateStr: dateKey, up: 0, down: 0, total: 0 };
  const newUp = type === 'up' ? existing.up + 1 : existing.up;
  const newDown = type === 'down' ? existing.down + 1 : existing.down;
  const newTotal = calculateTotal(newUp, newDown);

  const updatedRecord = {
    ...existing,
    up: newUp,
    down: newDown,
    total: newTotal
  };

  // Fire and forget sync to cloud
  if (userId) {
    syncRecordToCloud(userId, dateKey, updatedRecord);
  }

  return {
    ...prev,
    [dateKey]: updatedRecord
  };
};

/**
 * Updates a specific day's up/down counts to exact values.
 * Used for inline editing of historical records.
 */
export const updateRecordValues = (
  prev: Record<string, DailyRecord>,
  dateStr: string,
  up: number,
  down: number,
  userId: string | null
): Record<string, DailyRecord> => {
  const newTotal = calculateTotal(up, down);
  const updatedRecord = { dateStr, up, down, total: newTotal };

  if (userId) {
    syncRecordToCloud(userId, dateStr, updatedRecord);
  }

  return { ...prev, [dateStr]: updatedRecord };
};

/**
 * Returns records sorted by date descending.
 */
export const sortRecordsDesc = (records: Record<string, DailyRecord>): DailyRecord[] => {
  return Object.values(records).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
};
