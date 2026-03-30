import { DailyRecord } from '@/types';
import { DEV_MODE_QUERY_PARAM } from '@/constants';
import { calculateTotal } from '@utils/appHelpers';

/**
 * Checks if the application is currently running in Developer Mode.
 * Dev mode is activated by appending `?devMode=true` to the URL payload.
 */
export const isDevModeEnabled = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get(DEV_MODE_QUERY_PARAM) === 'true';
};

/**
 * Generates a randomized set of fake daily records for a specified number of days.
 * 
 * @param count The number of days of history to generate (default 30)
 */
export const generateDummyData = (count: number = 30): Record<string, DailyRecord> => {
  const dummy: Record<string, DailyRecord> = {};
  const today = new Date();
  
  // Faster loop for large generation
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const up = Math.floor(Math.random() * 20) + 5; 
    const down = Math.floor(Math.random() * 10);
    dummy[dateStr] = {
      dateStr,
      up,
      down,
      total: calculateTotal(up, down)
    };
  }
  return dummy;
};

/**
 * Simple wrapper around the browser's native confirm dialog.
 * Prompts the user before wiping local data. Cloud data is not affected.
 */
export const confirmResetData = (): boolean => {
  return window.confirm("Are you sure you want to delete all data on this device?");
};
