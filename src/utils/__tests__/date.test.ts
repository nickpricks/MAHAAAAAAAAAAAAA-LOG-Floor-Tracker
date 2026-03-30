import { describe, it, expect } from 'vitest';
import { getTodayKey, getLast7DaysKeys, getDayName, getFormattedDate } from '@utils/date';

describe('getTodayKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getLast7DaysKeys', () => {
  it('returns 7 keys', () => {
    expect(getLast7DaysKeys()).toHaveLength(7);
  });

  it('starts with today', () => {
    const keys = getLast7DaysKeys();
    expect(keys[0]).toBe(getTodayKey());
  });
});

describe('getDayName', () => {
  it('returns a weekday name', () => {
    const name = getDayName('2026-03-18');
    expect(name).toBe('Wednesday');
  });
});

describe('getFormattedDate', () => {
  it('returns DD/MM/YYYY', () => {
    expect(getFormattedDate('2026-03-18')).toBe('18/03/2026');
  });
});
