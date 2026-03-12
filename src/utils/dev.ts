import { DailyRecord } from '../types';
import { DEV_MODE_QUERY_PARAM } from '../constants';

/**
 * Checks if the application is currently running in Developer Mode.
 * Dev mode is activated by appending `?devMode=true` to the URL payload.
 */
export const isDevModeEnabled = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get(DEV_MODE_QUERY_PARAM) === 'true';
};

/**
 * Generates a randomized set of fake daily records for the past 14 days.
 * Incredibly useful for testing UI changes in the Stats and History tabs without manual logging.
 */
export const generateDummyData = (): Record<string, DailyRecord> => {
  const dummy: Record<string, DailyRecord> = {};
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const up = Math.floor(Math.random() * 20) + 5; // 5 to 24
    const down = Math.floor(Math.random() * 10); // 0 to 9
    dummy[dateStr] = {
      dateStr,
      up,
      down,
      total: up * 1 + down * 0.5
    };
  }
  return dummy;
};

/**
 * Simple wrapper around the browser's native confirm dialog.
 * Prompts the user before destructively wiping all their local and cloud data.
 */
export const confirmResetData = (): boolean => {
  return window.confirm("Are you sure you want to delete all data on this device?");
};
