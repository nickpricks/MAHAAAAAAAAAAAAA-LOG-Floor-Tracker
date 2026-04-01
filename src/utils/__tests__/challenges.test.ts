import { describe, it, expect } from 'vitest';
import {
  CHALLENGES,
  FEATURED_IDS,
  getChallengeById,
  getChallengesByCategory,
  formatDistance,
  FLOOR_HEIGHT_PRESETS,
  DEFAULT_FLOOR_HEIGHT,
  migrateDefaultChallenge,
} from '@utils/challenges';

describe('challenge catalog', () => {
  it('has 30 challenges', () => {
    expect(CHALLENGES).toHaveLength(30);
  });

  it('every challenge has required fields', () => {
    CHALLENGES.forEach((c) => {
      expect(c.id).toMatch(/^[a-z0-9-]+$/);
      expect(c.name).toBeTruthy();
      expect(c.category).toMatch(/^(landmarks|towers|mountains|milestones|journeys|space)$/);
      expect(c.meters).toBeGreaterThan(0);
      expect(c.emoji).toBeTruthy();
      expect(typeof c.featured).toBe('boolean');
    });
  });

  it('has unique IDs', () => {
    const ids = CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('FEATURED_IDS references valid challenge IDs', () => {
    FEATURED_IDS.forEach((id) => {
      expect(CHALLENGES.find((c) => c.id === id)).toBeDefined();
    });
  });

  it('has exactly 3 featured challenges', () => {
    expect(FEATURED_IDS).toHaveLength(3);
  });
});

describe('getChallengeById', () => {
  it('returns challenge for valid ID', () => {
    const c = getChallengeById('everest');
    expect(c).toBeDefined();
    expect(c!.name).toBe('Mount Everest');
    expect(c!.meters).toBe(8848);
  });

  it('returns undefined for invalid ID', () => {
    expect(getChallengeById('nonexistent')).toBeUndefined();
  });
});

describe('getChallengesByCategory', () => {
  it('returns only challenges matching category', () => {
    const mountains = getChallengesByCategory('mountains');
    mountains.forEach((c) => {
      expect(c.category).toBe('mountains');
    });
    expect(mountains.length).toBeGreaterThan(0);
  });

  it('returns empty array for invalid category', () => {
    expect(getChallengesByCategory('invalid' as any)).toEqual([]);
  });
});

describe('formatDistance', () => {
  it('shows meters for values under 1000', () => {
    expect(formatDistance(330)).toBe('330 m');
  });

  it('shows km with one decimal for values >= 1000', () => {
    expect(formatDistance(8848)).toBe('8.8 km');
  });

  it('shows km without decimal when even', () => {
    expect(formatDistance(100000)).toBe('100 km');
  });

  it('shows large km values with comma separators', () => {
    expect(formatDistance(40075000)).toBe('40,075 km');
  });

  it('handles 0', () => {
    expect(formatDistance(0)).toBe('0 m');
  });

  it('handles exact 1000', () => {
    expect(formatDistance(1000)).toBe('1 km');
  });
});

describe('floor height presets', () => {
  it('has 3 presets', () => {
    expect(FLOOR_HEIGHT_PRESETS).toHaveLength(3);
  });

  it('each preset has id, label, and meters', () => {
    FLOOR_HEIGHT_PRESETS.forEach((p) => {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect([2.5, 3.0, 3.5]).toContain(p.meters);
    });
  });

  it('default floor height is 3.0', () => {
    expect(DEFAULT_FLOOR_HEIGHT).toBe(3.0);
  });
});

describe('migrateDefaultChallenge', () => {
  it('converts a valid defaultChallenge string to ActiveChallenge', () => {
    const result = migrateDefaultChallenge('everest');
    expect(result).toEqual({
      id: 'everest',
      resetPeriod: 'lifetime',
      currentPeriodKey: 'lifetime',
    });
  });

  it('falls back to everest for unknown challenge ID', () => {
    const result = migrateDefaultChallenge('nonexistent');
    expect(result).toEqual({
      id: 'everest',
      resetPeriod: 'lifetime',
      currentPeriodKey: 'lifetime',
    });
  });

  it('falls back to everest for undefined input', () => {
    const result = migrateDefaultChallenge(undefined);
    expect(result).toEqual({
      id: 'everest',
      resetPeriod: 'lifetime',
      currentPeriodKey: 'lifetime',
    });
  });
});
