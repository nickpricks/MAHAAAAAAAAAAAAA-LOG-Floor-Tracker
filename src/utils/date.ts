/**
 * Generates a consistent string key for the current day in YYYY-MM-DD format.
 * Used as the primary key for storing daily floor records.
 */
export const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Generates an array of date keys for the past 7 days (including today).
 * Used primarily for historical charts and trend calculations.
 */
export const getLast7DaysKeys = (): string[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
};

/**
 * Converts a YYYY-MM-DD string into a human-readable day name (e.g., 'Monday').
 * Useful for displaying friendly labels in the history table.
 */
export const getDayName = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Converts a YYYY-MM-DD string into a standard DD/MM/YYYY format.
 * Used for detailed date displays in the UI.
 */
export const getFormattedDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};
