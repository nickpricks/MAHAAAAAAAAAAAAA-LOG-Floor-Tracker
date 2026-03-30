import { describe, it, expect, vi } from 'vitest';
import { calculateTapUpdate, sortRecordsDesc } from '@utils/appHelpers';

// Mock firebase sync (fire-and-forget, don't need real Firebase)
vi.mock('../firebase', () => ({
  syncRecordToCloud: vi.fn(),
}));

describe('calculateTapUpdate', () => {
  it('creates a new record for today if none exists', () => {
    const result = calculateTapUpdate({}, 'up', 'user-1');
    const keys = Object.keys(result);
    expect(keys).toHaveLength(1);
    const record = Object.values(result)[0];
    expect(record.up).toBe(1);
    expect(record.down).toBe(0);
    expect(record.total).toBe(1);
  });

  it('increments down with 0.5 scoring', () => {
    const result = calculateTapUpdate({}, 'down', 'user-1');
    const record = Object.values(result)[0];
    expect(record.up).toBe(0);
    expect(record.down).toBe(1);
    expect(record.total).toBe(0.5);
  });

  it('accumulates on existing record', () => {
    const today = Object.keys(calculateTapUpdate({}, 'up', null))[0];
    const existing = {
      [today]: { dateStr: today, up: 5, down: 3, total: 5 + 3 * 0.5 },
    };
    const result = calculateTapUpdate(existing, 'up', null);
    expect(result[today].up).toBe(6);
    expect(result[today].down).toBe(3);
    expect(result[today].total).toBe(6 + 3 * 0.5);
  });
});

describe('sortRecordsDesc', () => {
  it('sorts by date descending', () => {
    const records = {
      '2026-03-16': { dateStr: '2026-03-16', up: 1, down: 0, total: 1 },
      '2026-03-18': { dateStr: '2026-03-18', up: 2, down: 0, total: 2 },
      '2026-03-17': { dateStr: '2026-03-17', up: 3, down: 0, total: 3 },
    };
    const sorted = sortRecordsDesc(records);
    expect(sorted[0].dateStr).toBe('2026-03-18');
    expect(sorted[2].dateStr).toBe('2026-03-16');
  });
});
