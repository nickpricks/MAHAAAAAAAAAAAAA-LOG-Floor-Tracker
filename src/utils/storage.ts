import { LOCAL_STORAGE_KEY } from '../constants';
import { DailyRecord } from '../types';

export const loadRecords = (): Record<string, DailyRecord> => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse local storage", e);
    }
  }
  return {};
};

export const saveRecords = (records: Record<string, DailyRecord>) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
};
