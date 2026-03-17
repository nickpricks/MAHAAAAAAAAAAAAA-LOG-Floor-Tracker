import { DailyRecord } from '../types';

/**
 * Calculates metrics (today, week, month, total) from records.
 */
export const calculateMetrics = (
  records: Record<string, DailyRecord>,
  todayKey: string,
  last7Days: string[],
  currentMonthPrefix: string
) => {
  let todayFloors = 0;
  let weekFloors = 0;
  let monthFloors = 0;
  let totalFloors = 0;

  Object.values(records).forEach(record => {
    totalFloors += record.total;
    if (record.dateStr === todayKey) todayFloors += record.total;
    if (last7Days.includes(record.dateStr)) weekFloors += record.total;
    if (record.dateStr.startsWith(currentMonthPrefix)) monthFloors += record.total;
  });

  return { todayFloors, weekFloors, monthFloors, totalFloors };
};

/**
 * Formats a number of meters into a localized string.
 */
export const formatMeters = (meters: number): string => {
  return meters.toLocaleString();
};

/**
 * Calculates challenge progress.
 */
export const calculateProgress = (totalMeters: number, goalMeters: number) => {
  const remainingMeters = Math.max(0, goalMeters - totalMeters);
  const progressPercent = Math.min(100, (totalMeters / goalMeters) * 100);
  return { remainingMeters, progressPercent };
};
