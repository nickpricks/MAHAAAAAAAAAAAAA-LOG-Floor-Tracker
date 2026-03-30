/**
 * Browser LocalStorage utility functions.
 * Manages persisting active session data offline.
 */
import { LOCAL_STORAGE_KEY } from '@/constants';
import { DailyRecord } from '@/types';

/**
 * Parses the user's saved floor climbing history from the browser's LocalStorage.
 * Returns an empty object if no history exists or if the JSON payload is corrupted.
 */
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

/**
 * Serializes the user's active session history directly into the browser's LocalStorage.
 * This ensures data persists across hard page refreshes even without an internet connection.
 */
export const saveRecords = (records: Record<string, DailyRecord>): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
};

/**
 * Custom hook to throttle/debounce localStorage writes.
 * Prevents excessive disk I/O on rapid interactions.
 */
import { useEffect, useRef } from 'react';

export const useThrottledPersistence = (records: Record<string, DailyRecord>, delay = 2000) => {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      saveRecords(records);
    }, delay);

    return () => clearTimeout(handler);
  }, [records, delay]);
};
