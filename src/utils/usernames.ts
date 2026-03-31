import { USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_REGEX, USERNAME_AUTO_PREFIX } from '@/constants';

type ValidationResult = { valid: true } | { valid: false; error: string };

export function validateUsername(username: string): ValidationResult {
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters` };
  }
  if (username !== username.toLowerCase()) {
    return { valid: false, error: 'Username must be lowercase' };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens (not at start/end)' };
  }
  return { valid: true };
}

export function generateAutoUsername(): string {
  const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${USERNAME_AUTO_PREFIX}${hex}`;
}
