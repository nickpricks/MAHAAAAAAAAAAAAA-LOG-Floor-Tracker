/** Get today's date in YYYY-MM-DD format */
export const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Get last 7 days keys in YYYY-MM-DD format */
export const getLast7DaysKeys = (): string[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
};

/** Get day name from date string */
export const getDayName = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/** Get formatted date in DD/MM/YYYY format */
export const getFormattedDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};
