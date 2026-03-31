import { describe, it, expect } from 'vitest';
import { validateUsername, generateAutoUsername } from '@utils/usernames';

type FailResult = { valid: false; error: string };

describe('validateUsername', () => {
  it('accepts valid usernames', () => {
    expect(validateUsername('climber-7f3a')).toEqual({ valid: true });
    expect(validateUsername('alice')).toEqual({ valid: true });
    expect(validateUsername('my-name-123')).toEqual({ valid: true });
    expect(validateUsername('abc')).toEqual({ valid: true });
  });

  it('rejects too short', () => {
    const result = validateUsername('ab') as FailResult;
    expect(result.valid).toBe(false);
    expect(result.error).toContain('3');
  });

  it('rejects too long', () => {
    const result = validateUsername('a'.repeat(21)) as FailResult;
    expect(result.valid).toBe(false);
    expect(result.error).toContain('20');
  });

  it('rejects uppercase', () => {
    const result = validateUsername('Alice') as FailResult;
    expect(result.valid).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('rejects starting with hyphen', () => {
    const result = validateUsername('-alice');
    expect(result.valid).toBe(false);
  });

  it('rejects ending with hyphen', () => {
    const result = validateUsername('alice-');
    expect(result.valid).toBe(false);
  });

  it('rejects special characters', () => {
    const result = validateUsername('alice@bob');
    expect(result.valid).toBe(false);
  });

  it('rejects spaces', () => {
    const result = validateUsername('alice bob');
    expect(result.valid).toBe(false);
  });
});

describe('generateAutoUsername', () => {
  it('returns climber-XXXX format', () => {
    const name = generateAutoUsername();
    expect(name).toMatch(/^climber-[0-9a-f]{4}$/);
  });

  it('returns different values on successive calls', () => {
    const names = new Set(Array.from({ length: 10 }, () => generateAutoUsername()));
    expect(names.size).toBeGreaterThan(1);
  });
});
