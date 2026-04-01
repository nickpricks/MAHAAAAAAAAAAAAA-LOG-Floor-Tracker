/**
 * Global application constants.
 * Defines configuration values like storage keys, metrics, and climbing challenges.
 */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Floor Tracker';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'v0.0.1';
export const DEV_MODE_QUERY_PARAM = 'devMode';
export const LOCAL_STORAGE_KEY = 'floorTrackerData';

export const TRACKER_UI = {
  MIN_FONT_REM: 4,
  MAX_FONT_REM: 9,
  MAX_SCALE_FLOORS: 25,
};

export const BENCHMARK_UUID = 'bench-1000-days';

export const TABS = {
  TRACKER: 'tracker',
  STATS: 'stats',
  HELP: 'help',
  PROFILE: 'profile',
} as const;

export type TabType = typeof TABS[keyof typeof TABS];

export const COLOR_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type ColorMode = typeof COLOR_MODES[keyof typeof COLOR_MODES];

export const DEFAULT_THEME_ID = 'summit-instrument';

// Username constants
export const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_AUTO_PREFIX = 'climber-';
