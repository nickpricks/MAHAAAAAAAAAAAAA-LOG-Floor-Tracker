import { DailyRecord } from '../types';
import { DEV_MODE_QUERY_PARAM } from '../constants';

/** Check if dev mode is enabled */
export const isDevModeEnabled = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get(DEV_MODE_QUERY_PARAM) === 'true';
};

/** Generate dummy data for testing */
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

/** Confirm reset data */
export const confirmResetData = (): boolean => {
  return window.confirm("Are you sure you want to delete all data on this device?");
};
