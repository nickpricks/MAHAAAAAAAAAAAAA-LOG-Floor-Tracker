/**
 * Global application constants.
 * Defines configuration values like storage keys, metrics, and climbing challenges.
 */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Floor Tracker';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'v0.0.1';
export const DEV_MODE_QUERY_PARAM = 'devMode';
export const LOCAL_STORAGE_KEY = 'floorTrackerData';
export const METERS_PER_FLOOR = 3;
export const CHALLENGES = [
  { id: 'eiffel', name: 'Eiffel Tower', meters: 330, emoji: '🗼' },
  { id: 'burj', name: 'Burj Khalifa', meters: 828, emoji: '🏢' },
  { id: 'fuji', name: 'Mount Fuji', meters: 3776, emoji: '🗻' },
  { id: 'kilimanjaro', name: 'Mount Kilimanjaro', meters: 5895, emoji: '🏔️' },
  { id: 'everest', name: 'Mount Everest', meters: 8848, emoji: '⛰️' },
  { id: 'mariana', name: 'Mariana Trench Depth', meters: 10984, emoji: '🌊' },
];

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

export const DEFAULT_CHALLENGE_ID = 'everest';

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;
