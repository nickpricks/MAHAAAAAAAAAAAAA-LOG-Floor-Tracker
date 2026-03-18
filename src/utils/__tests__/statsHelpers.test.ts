import { describe, it, expect } from 'vitest';
import { calculateMetrics, calculateProgress, formatMeters } from '../statsHelpers';

describe('calculateMetrics', () => {
  const records = {
    '2026-03-18': { dateStr: '2026-03-18', up: 10, down: 4, total: 12 },
    '2026-03-17': { dateStr: '2026-03-17', up: 5, down: 2, total: 6 },
    '2026-02-15': { dateStr: '2026-02-15', up: 3, down: 1, total: 3.5 },
  };

  it('computes today floors', () => {
    const result = calculateMetrics(records, '2026-03-18', ['2026-03-18', '2026-03-17'], '2026-03');
    expect(result.todayFloors).toBe(12);
  });

  it('computes week floors', () => {
    const result = calculateMetrics(records, '2026-03-18', ['2026-03-18', '2026-03-17'], '2026-03');
    expect(result.weekFloors).toBe(18);
  });

  it('computes month floors (excludes other months)', () => {
    const result = calculateMetrics(records, '2026-03-18', ['2026-03-18', '2026-03-17'], '2026-03');
    expect(result.monthFloors).toBe(18);
  });

  it('computes total across all months', () => {
    const result = calculateMetrics(records, '2026-03-18', ['2026-03-18', '2026-03-17'], '2026-03');
    expect(result.totalFloors).toBe(21.5);
  });
});

describe('calculateProgress', () => {
  it('returns 0 remaining when goal exceeded', () => {
    const result = calculateProgress(10000, 8848);
    expect(result.remainingMeters).toBe(0);
    expect(result.progressPercent).toBe(100);
  });

  it('calculates partial progress', () => {
    const result = calculateProgress(4424, 8848);
    expect(result.progressPercent).toBe(50);
    expect(result.remainingMeters).toBe(4424);
  });
});

describe('formatMeters', () => {
  it('formats numbers with locale separators', () => {
    const result = formatMeters(1234);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });
});
