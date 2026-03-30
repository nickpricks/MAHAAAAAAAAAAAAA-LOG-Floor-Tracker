import { describe, it, expect } from 'vitest';
import { mergeCloudIntoLocal } from '@utils/mergeRecords';
import { DailyRecord } from '@/types';

const makeRecord = (dateStr: string, up: number, down: number): DailyRecord => ({
  dateStr,
  up,
  down,
  total: up + down * 0.5,
});

describe('mergeCloudIntoLocal', () => {
  it('adds cloud-only records to local', () => {
    const local: Record<string, DailyRecord> = {};
    const cloud: Record<string, DailyRecord> = {
      '2026-03-18': makeRecord('2026-03-18', 5, 3),
    };
    const result = mergeCloudIntoLocal(local, cloud);
    expect(result['2026-03-18']).toEqual(cloud['2026-03-18']);
  });

  it('preserves local-only records', () => {
    const local: Record<string, DailyRecord> = {
      '2026-03-17': makeRecord('2026-03-17', 10, 2),
    };
    const cloud: Record<string, DailyRecord> = {};
    const result = mergeCloudIntoLocal(local, cloud);
    expect(result['2026-03-17']).toEqual(local['2026-03-17']);
  });

  it('takes per-field max when both exist', () => {
    const local: Record<string, DailyRecord> = {
      '2026-03-18': makeRecord('2026-03-18', 10, 2),
    };
    const cloud: Record<string, DailyRecord> = {
      '2026-03-18': makeRecord('2026-03-18', 5, 7),
    };
    const result = mergeCloudIntoLocal(local, cloud);
    expect(result['2026-03-18'].up).toBe(10);    // local wins
    expect(result['2026-03-18'].down).toBe(7);    // cloud wins
    expect(result['2026-03-18'].total).toBe(10 + 7 * 0.5); // recalculated
  });

  it('keeps local when local is higher on all fields', () => {
    const local: Record<string, DailyRecord> = {
      '2026-03-18': makeRecord('2026-03-18', 10, 5),
    };
    const cloud: Record<string, DailyRecord> = {
      '2026-03-18': makeRecord('2026-03-18', 8, 3),
    };
    const result = mergeCloudIntoLocal(local, cloud);
    expect(result['2026-03-18'].up).toBe(10);
    expect(result['2026-03-18'].down).toBe(5);
  });

  it('returns same reference if nothing changed', () => {
    const local: Record<string, DailyRecord> = {
      '2026-03-18': makeRecord('2026-03-18', 10, 5),
    };
    const cloud: Record<string, DailyRecord> = {
      '2026-03-18': makeRecord('2026-03-18', 10, 5),
    };
    const result = mergeCloudIntoLocal(local, cloud);
    expect(result).toBe(local); // no unnecessary re-render
  });
});
