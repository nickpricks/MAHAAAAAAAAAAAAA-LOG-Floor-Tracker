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
  userId: string | null
): Record<string, DailyRecord> => {
  const today = getTodayKey();
  const todayRecord = prev[today] || { dateStr: today, up: 0, down: 0, total: 0 };
  const newUp = type === 'up' ? todayRecord.up + 1 : todayRecord.up;
  const newDown = type === 'down' ? todayRecord.down + 1 : todayRecord.down;
  const newTotal = calculateTotal(newUp, newDown);

  const updatedRecord = {
    ...todayRecord,
    up: newUp,
    down: newDown,
    total: newTotal
  };

  // Fire and forget sync to cloud
  if (userId) {
    syncRecordToCloud(userId, today, updatedRecord);
  }

  return {
    ...prev,
    [today]: updatedRecord
  };
};

/**
 * Returns records sorted by date descending.
 */
export const sortRecordsDesc = (records: Record<string, DailyRecord>): DailyRecord[] => {
  return Object.values(records).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
};
