# Challenge Revamp (B1 + B3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the challenge system from 6 hardcoded challenges to a 30-challenge categorized catalog with a picker UI and configurable floor height presets.

**Architecture:** TDD with Vitest. New `challenges.ts` utility owns the catalog, types, and formatting. `statsHelpers.ts` accepts `floorHeight` as a parameter instead of using the `METERS_PER_FLOOR` constant. StatsTab gets a picker UI replacing the `<select>` dropdown. ProfileTab loses the "Default Goal" section and gains floor height presets. Data flows top-down: `App.tsx` reads settings, passes `floorHeight` and `activeChallenge` as props.

**Tech Stack:** React 19, TypeScript, Vitest, Tailwind CSS v4 semantic tokens

**Design Spec:** `docs/specs/2026-03-31-challenge-revamp-design.md`

**Scope:** B1 (catalog + floor height) and B3 (picker UI). Reset periods (B2) are deferred — all challenges default to `resetPeriod: 'lifetime'`.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/utils/challenges.ts` | **Create** | Challenge catalog, `Challenge` type, `ActiveChallenge` type, `CHALLENGES` array, `FEATURED_IDS`, `FLOOR_HEIGHT_PRESETS`, `formatDistance()`, `getChallengeById()`, `getChallengesByCategory()`, `migrateDefaultChallenge()` |
| `src/utils/__tests__/challenges.test.ts` | **Create** | Tests for all challenge utility functions |
| `src/constants.ts` | **Modify** | Remove `CHALLENGES`, `DEFAULT_CHALLENGE_ID`, `METERS_PER_FLOOR`. All replaced by `src/utils/challenges.ts`. |
| `src/utils/statsHelpers.ts` | **No change** | `calculateMetrics` returns floors (not meters). Meter conversion (`floors * floorHeight`) happens in StatsTab. |
| `src/utils/firebase.ts` | **Modify** | Update `UserSettings` type: add `floorHeight`, `activeChallenge`, keep `defaultChallenge` for migration. |
| `src/utils/useAppInitialization.ts` | **Modify** | Add `defaultChallenge` → `activeChallenge` migration on settings load. |
| `src/App.tsx` | **Modify** | Pass `floorHeight` and `activeChallenge` props to StatsTab. Pass `floorHeight` to ProfileTab. |
| `src/components/StatsTab.tsx` | **Modify** | Replace `<select>` with challenge picker UI. Accept `floorHeight` and `activeChallenge` props. Use `formatDistance()`. |
| `src/components/ProfileTab.tsx` | **Modify** | Remove "Default Goal" section. Add floor height preset buttons. |
| `HELP.md` | **Modify** | Update challenges section with new catalog and picker description. |

---

## Task 1: Challenge Catalog — Types and Data

**Files:**
- Create: `src/utils/challenges.ts`
- Create: `src/utils/__tests__/challenges.test.ts`

- [ ] **Step 1: Write failing tests for Challenge type and catalog**

In `src/utils/__tests__/challenges.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  CHALLENGES,
  FEATURED_IDS,
  type Challenge,
  getChallengeById,
  getChallengesByCategory,
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/utils/__tests__/challenges.test.ts`
Expected: FAIL — module `@utils/challenges` does not exist.

- [ ] **Step 3: Implement challenge catalog**

Create `src/utils/challenges.ts`:

```ts
export type ChallengeCategory = 'landmarks' | 'towers' | 'mountains' | 'milestones' | 'journeys' | 'space';

export type Challenge = {
  id: string;
  name: string;
  category: ChallengeCategory;
  meters: number;
  emoji: string;
  featured: boolean;
};

export type ActiveChallenge = {
  id: string;
  resetPeriod: 'week' | 'month' | '3month' | 'year' | 'lifetime';
  currentPeriodKey: string;
};

export const FEATURED_IDS = ['burj', 'everest', 'marathon'] as const;

export const CHALLENGES: Challenge[] = [
  // Landmarks
  { id: 'arc', name: 'Arc de Triomphe', category: 'landmarks', meters: 50, emoji: '🇫🇷', featured: false },
  { id: 'pisa', name: 'Leaning Tower of Pisa', category: 'landmarks', meters: 56, emoji: '🏛️', featured: false },
  { id: 'liberty', name: 'Statue of Liberty', category: 'landmarks', meters: 93, emoji: '🗽', featured: false },
  { id: 'bigben', name: 'Big Ben', category: 'landmarks', meters: 96, emoji: '🔔', featured: false },
  { id: 'eiffel', name: 'Eiffel Tower', category: 'landmarks', meters: 330, emoji: '🗼', featured: false },
  // Towers
  { id: 'empire', name: 'Empire State Building', category: 'towers', meters: 443, emoji: '🏙️', featured: false },
  { id: 'taipei', name: 'Taipei 101', category: 'towers', meters: 508, emoji: '🏯', featured: false },
  { id: 'cn', name: 'CN Tower', category: 'towers', meters: 553, emoji: '📡', featured: false },
  { id: 'burj', name: 'Burj Khalifa', category: 'towers', meters: 828, emoji: '🏢', featured: true },
  // Mountains
  { id: 'halfdome', name: 'Half Dome', category: 'mountains', meters: 1444, emoji: '🧗', featured: false },
  { id: 'fuji', name: 'Mount Fuji', category: 'mountains', meters: 3776, emoji: '🗻', featured: false },
  { id: 'montblanc', name: 'Mont Blanc', category: 'mountains', meters: 4808, emoji: '🏔️', featured: false },
  { id: 'kilimanjaro', name: 'Mount Kilimanjaro', category: 'mountains', meters: 5895, emoji: '🏔️', featured: false },
  { id: 'denali', name: 'Denali', category: 'mountains', meters: 6190, emoji: '🏔️', featured: false },
  { id: 'everest', name: 'Mount Everest', category: 'mountains', meters: 8848, emoji: '⛰️', featured: true },
  { id: 'mariana', name: 'Mariana Trench', category: 'mountains', meters: 10984, emoji: '🌊', featured: false },
  // Milestones
  { id: 'double-everest', name: 'Double Everest', category: 'milestones', meters: 17696, emoji: '⛰️⛰️', featured: false },
  { id: 'marathon', name: 'Marathon', category: 'milestones', meters: 42195, emoji: '🏃', featured: true },
  { id: '100km', name: '100 km Club', category: 'milestones', meters: 100000, emoji: '💯', featured: false },
  // Journeys
  { id: 'channel', name: 'English Channel', category: 'journeys', meters: 34000, emoji: '🏊', featured: false },
  { id: 'himalaya', name: 'Himalayan Range', category: 'journeys', meters: 2400000, emoji: '🏔️', featured: false },
  { id: 'sahara', name: 'Sahara Crossing', category: 'journeys', meters: 1800000, emoji: '🏜️', featured: false },
  { id: 'kashmir-kanyakumari', name: 'Kashmir to Kanyakumari', category: 'journeys', meters: 3500000, emoji: '🇮🇳', featured: false },
  { id: 'brahmaputra', name: 'Brahmaputra River', category: 'journeys', meters: 3848000, emoji: '🏞️', featured: false },
  { id: 'pct', name: 'Pacific Crest Trail', category: 'journeys', meters: 4265000, emoji: '🥾', featured: false },
  { id: 'amazon', name: 'Amazon River', category: 'journeys', meters: 6400000, emoji: '🌿', featured: false },
  { id: 'equator', name: 'Around the Equator', category: 'journeys', meters: 40075000, emoji: '🌍', featured: false },
  // Space
  { id: 'moon', name: 'Earth to Moon', category: 'space', meters: 384400000, emoji: '🌙', featured: false },
  { id: 'mars', name: 'Earth to Mars', category: 'space', meters: 225000000000, emoji: '🔴', featured: false },
];

export const getChallengeById = (id: string): Challenge | undefined =>
  CHALLENGES.find((c) => c.id === id);

export const getChallengesByCategory = (category: ChallengeCategory): Challenge[] =>
  CHALLENGES.filter((c) => c.category === category);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/utils/__tests__/challenges.test.ts`
Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/challenges.ts src/utils/__tests__/challenges.test.ts
git commit -m "feat: add challenge catalog with 30 challenges and lookup utilities"
```

---

## Task 2: formatDistance Utility

**Files:**
- Modify: `src/utils/challenges.ts`
- Modify: `src/utils/__tests__/challenges.test.ts`

- [ ] **Step 1: Write failing tests for formatDistance**

Append to `src/utils/__tests__/challenges.test.ts`:

```ts
import { formatDistance } from '@utils/challenges';

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/utils/__tests__/challenges.test.ts`
Expected: FAIL — `formatDistance` is not exported.

- [ ] **Step 3: Implement formatDistance**

Add to `src/utils/challenges.ts`:

```ts
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = meters / 1000;
  if (km === Math.floor(km)) {
    return `${km.toLocaleString()} km`;
  }
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/utils/__tests__/challenges.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/challenges.ts src/utils/__tests__/challenges.test.ts
git commit -m "feat: add formatDistance utility for challenge distances"
```

---

## Task 3: Floor Height Presets

**Files:**
- Modify: `src/utils/challenges.ts`
- Modify: `src/utils/__tests__/challenges.test.ts`

- [ ] **Step 1: Write failing tests for floor height presets**

Append to `src/utils/__tests__/challenges.test.ts`:

```ts
import { FLOOR_HEIGHT_PRESETS, DEFAULT_FLOOR_HEIGHT } from '@utils/challenges';

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/utils/__tests__/challenges.test.ts`
Expected: FAIL — `FLOOR_HEIGHT_PRESETS` not exported.

- [ ] **Step 3: Implement floor height presets**

Add to `src/utils/challenges.ts`:

```ts
export type FloorHeightPreset = {
  id: string;
  label: string;
  meters: 2.5 | 3.0 | 3.5;
};

export const DEFAULT_FLOOR_HEIGHT = 3.0;

export const FLOOR_HEIGHT_PRESETS: FloorHeightPreset[] = [
  { id: 'residential', label: 'Residential 2.5m', meters: 2.5 },
  { id: 'standard', label: 'Standard 3.0m', meters: 3.0 },
  { id: 'commercial', label: 'Commercial 3.5m', meters: 3.5 },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/utils/__tests__/challenges.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/challenges.ts src/utils/__tests__/challenges.test.ts
git commit -m "feat: add floor height presets (2.5/3.0/3.5m)"
```

---

## Task 4: Migration Utility

**Files:**
- Modify: `src/utils/challenges.ts`
- Modify: `src/utils/__tests__/challenges.test.ts`

- [ ] **Step 1: Write failing tests for migrateDefaultChallenge**

Append to `src/utils/__tests__/challenges.test.ts`:

```ts
import { migrateDefaultChallenge, type ActiveChallenge } from '@utils/challenges';

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/utils/__tests__/challenges.test.ts`
Expected: FAIL — `migrateDefaultChallenge` not exported.

- [ ] **Step 3: Implement migrateDefaultChallenge**

Add to `src/utils/challenges.ts`:

```ts
const DEFAULT_CHALLENGE_ID = 'everest';

export const migrateDefaultChallenge = (defaultChallenge?: string): ActiveChallenge => {
  const id = defaultChallenge && getChallengeById(defaultChallenge)
    ? defaultChallenge
    : DEFAULT_CHALLENGE_ID;
  return {
    id,
    resetPeriod: 'lifetime',
    currentPeriodKey: 'lifetime',
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/utils/__tests__/challenges.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/challenges.ts src/utils/__tests__/challenges.test.ts
git commit -m "feat: add migration utility for defaultChallenge -> activeChallenge"
```

---

## Task 5: Update UserSettings Type and constants.ts

**Files:**
- Modify: `src/utils/firebase.ts:110-117`
- Modify: `src/constants.ts`

- [ ] **Step 1: Update UserSettings type in firebase.ts**

Replace the `UserSettings` type (lines 110-117 of `src/utils/firebase.ts`):

```ts
export type UserSettings = {
  theme?: ThemeId | 'light' | 'dark' | 'system';
  colorMode?: 'light' | 'dark' | 'system';
  defaultChallenge?: string;           // legacy — migrated to activeChallenge on read
  activeChallenge?: {
    id: string;
    resetPeriod: 'week' | 'month' | '3month' | 'year' | 'lifetime';
    currentPeriodKey: string;
  };
  floorHeight?: 2.5 | 3.0 | 3.5;
  email?: string;
  username?: string;
  updatedAt?: number;
};
```

- [ ] **Step 2: Clean up constants.ts**

In `src/constants.ts`, remove the `CHALLENGES` array (lines 10-17), `DEFAULT_CHALLENGE_ID` (line 36), and `METERS_PER_FLOOR` (line 9). These are replaced by `src/utils/challenges.ts`.

After removal, `constants.ts` should look like:

```ts
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Floor Tracker';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'v0.0.1';
export const DEV_MODE_QUERY_PARAM = 'devMode';
export const LOCAL_STORAGE_KEY = 'floorTrackerData';
export const CHALLENGES = []; // REMOVED — see src/utils/challenges.ts
// DELETE the above line, it's just illustrative. Remove CHALLENGES entirely.

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
```

- [ ] **Step 3: Fix all imports that reference removed constants**

Files that import from `@/constants` and need updating:

1. `src/components/StatsTab.tsx` — remove `CHALLENGES`, `METERS_PER_FLOOR`, `DEFAULT_CHALLENGE_ID` imports. Add imports from `@utils/challenges`.
2. `src/components/ProfileTab.tsx` — remove `CHALLENGES` import. (Will be reworked in Task 8.)
3. `src/utils/dev.ts` — if it references `METERS_PER_FLOOR`, update to import `DEFAULT_FLOOR_HEIGHT` from `@utils/challenges`.

For now, do minimal import fixes to keep TypeScript compiling. StatsTab and ProfileTab will be fully reworked in Tasks 7 and 8.

- [ ] **Step 4: Run type check**

Run: `bun run lint`
Expected: No type errors.

- [ ] **Step 5: Run all tests**

Run: `bun run test`
Expected: All tests pass. (Some StatsTab logic may need the import fixes from Step 3.)

- [ ] **Step 6: Commit**

```bash
git add src/utils/firebase.ts src/constants.ts src/components/StatsTab.tsx src/components/ProfileTab.tsx
git commit -m "refactor: update UserSettings type, move challenges out of constants.ts"
```

---

## Task 6: Wire Migration into useAppInitialization

**Files:**
- Modify: `src/utils/useAppInitialization.ts`

- [ ] **Step 1: Add migration logic to settings subscription**

In `src/utils/useAppInitialization.ts`, import the migration utility:

```ts
import { migrateDefaultChallenge } from '@utils/challenges';
```

Inside the `subscribeToUserSettings` callback (around line 73), after the existing theme migration block, add challenge migration:

```ts
// Migrate defaultChallenge -> activeChallenge
if (!migrated.activeChallenge && migrated.defaultChallenge) {
  migrated.activeChallenge = migrateDefaultChallenge(migrated.defaultChallenge);
  delete migrated.defaultChallenge;
  saveUserSettings(activeId, {
    activeChallenge: migrated.activeChallenge,
    defaultChallenge: undefined,
  });
}
```

- [ ] **Step 2: Run type check**

Run: `bun run lint`
Expected: No type errors. (`saveUserSettings` accepts `UserSettings` which now includes `activeChallenge`.)

- [ ] **Step 3: Run all tests**

Run: `bun run test`
Expected: All pass. The `useAppInitialization` tests (if any) should still work since Firebase is mocked.

- [ ] **Step 4: Commit**

```bash
git add src/utils/useAppInitialization.ts
git commit -m "feat: migrate defaultChallenge to activeChallenge on settings load"
```

---

## Task 7: StatsTab — Floor Height Props and Challenge Picker UI

**Files:**
- Modify: `src/components/StatsTab.tsx`
- Modify: `src/App.tsx`

This is the largest task — it replaces the StatsTab challenge dropdown with the full picker UI and wires floor height through props.

- [ ] **Step 1: Update App.tsx to pass new props to StatsTab**

In `src/App.tsx`, add imports:

```ts
import { getChallengeById, migrateDefaultChallenge, DEFAULT_FLOOR_HEIGHT, type ActiveChallenge } from '@utils/challenges';
```

Derive `activeChallenge` and `floorHeight` from settings (add after the existing settings-related code, around line 67):

```ts
const activeChallenge: ActiveChallenge = settings.activeChallenge ?? migrateDefaultChallenge(settings.defaultChallenge);
const floorHeight = settings.floorHeight ?? DEFAULT_FLOOR_HEIGHT;
```

Update the StatsTab JSX (around line 179) to pass new props:

```tsx
<StatsTab
  records={records}
  todayKey={todayKey}
  floorHeight={floorHeight}
  activeChallenge={activeChallenge}
  onChallengeChange={(ac: ActiveChallenge) => updateSettings({ activeChallenge: ac })}
  onManualSync={handleManualSync}
/>
```

Remove the old `defaultChallengeId` prop.

- [ ] **Step 2: Rewrite StatsTab.tsx**

Replace the entire content of `src/components/StatsTab.tsx` with:

```tsx
import React from 'react';
import { Info, X, Share2, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { DailyRecord } from '@/types';
import { getLast7DaysKeys } from '@utils/date';
import { calculateMetrics, calculateProgress, formatMeters } from '@utils/statsHelpers';
import {
  CHALLENGES,
  FEATURED_IDS,
  getChallengeById,
  getChallengesByCategory,
  formatDistance,
  type ActiveChallenge,
  type ChallengeCategory,
} from '@utils/challenges';

type Props = {
  records: Record<string, DailyRecord>;
  todayKey: string;
  floorHeight: number;
  activeChallenge: ActiveChallenge;
  onChallengeChange: (ac: ActiveChallenge) => void;
  onManualSync: () => Promise<void>;
};

const CATEGORY_ORDER: ChallengeCategory[] = ['landmarks', 'towers', 'mountains', 'milestones', 'journeys', 'space'];
const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  landmarks: 'Landmarks',
  towers: 'Towers',
  mountains: 'Mountains',
  milestones: 'Milestones',
  journeys: 'Journeys',
  space: 'Space',
};

export default function StatsTab({ records, todayKey, floorHeight, activeChallenge, onChallengeChange, onManualSync }: Props) {
  const [showPicker, setShowPicker] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [showInfo, setShowInfo] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await onManualSync();
    setIsSyncing(false);
  };

  const handleSelectChallenge = (id: string) => {
    setPendingId(id);
  };

  const handleSetGoal = () => {
    if (!pendingId) return;
    onChallengeChange({
      id: pendingId,
      resetPeriod: 'lifetime',
      currentPeriodKey: 'lifetime',
    });
    setPendingId(null);
    setShowPicker(false);
    setShowAll(false);
  };

  const currentMonthPrefix = todayKey.substring(0, 7);
  const last7Days = React.useMemo(() => getLast7DaysKeys(), [todayKey]);

  const { todayFloors, weekFloors, monthFloors, totalFloors } = React.useMemo(
    () => calculateMetrics(records, todayKey, last7Days, currentMonthPrefix),
    [records, todayKey, last7Days, currentMonthPrefix],
  );

  const todayMeters = todayFloors * floorHeight;
  const weekMeters = weekFloors * floorHeight;
  const monthMeters = monthFloors * floorHeight;
  const totalMeters = totalFloors * floorHeight;

  const challenge = getChallengeById(activeChallenge.id) ?? getChallengeById('everest')!;
  const { remainingMeters, progressPercent } = calculateProgress(totalMeters, challenge.meters);
  const selectedId = pendingId ?? activeChallenge.id;

  const featuredChallenges = FEATURED_IDS.map((id) => getChallengeById(id)!);

  return (
    <div className="w-full max-w-sm bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col gap-6">
      <div className="text-center relative">
        <div className="absolute -top-2 -right-2 flex gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`p-2 bg-surface-raised border border-line rounded-full text-fg-subtle hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm ${isSyncing ? 'animate-spin' : ''}`}
            title="Sync all data to cloud"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 bg-surface-raised border border-line rounded-full text-fg-subtle hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm"
            title="Copy shareable link"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
          </button>
        </div>
        <div className="text-5xl mb-2">{challenge.emoji}</div>
        <h2 className="text-2xl font-display font-extrabold text-fg-heading">Leaderboard</h2>
        <p className="text-sm text-fg-muted mt-1 font-mono">1 floor ≈ {floorHeight} meters</p>
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-4 mt-2">
        {[
          { label: 'Today', value: todayMeters },
          { label: 'This Week', value: weekMeters },
          { label: 'This Month', value: monthMeters },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center p-4 bg-surface-raised rounded-2xl border border-line-subtle">
            <span className="font-bold text-fg">{label}</span>
            <span className="text-xl font-bold font-mono text-fg-heading tabular-nums">
              {formatMeters(value)} <span className="text-sm text-fg-subtle font-bold">m</span>
            </span>
          </div>
        ))}
      </div>

      {/* Challenge Progress */}
      <div className="mt-4 pt-6 border-t border-line-subtle relative">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => { setShowPicker(!showPicker); setPendingId(null); setShowAll(false); }}
            className="flex items-center gap-2 bg-surface-raised border border-line text-fg text-sm font-bold rounded-lg p-2 shadow-sm hover:border-accent transition-colors"
          >
            <span>{challenge.emoji} {challenge.name}</span>
            {showPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className="text-fg-subtle hover:text-blue-500 transition-colors p-1"
          >
            <Info size={20} />
          </button>
        </div>

        {/* Challenge Picker */}
        {showPicker && (
          <div className="mb-6 bg-surface-raised rounded-2xl border border-line p-4 flex flex-col gap-4">
            {/* Featured */}
            <div className="flex gap-2">
              {featuredChallenges.map((fc) => (
                <button
                  key={fc.id}
                  onClick={() => handleSelectChallenge(fc.id)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center ${
                    selectedId === fc.id
                      ? 'border-accent bg-accent/10 shadow-sm'
                      : 'border-line-subtle hover:border-line'
                  }`}
                >
                  <span className="text-2xl">{fc.emoji}</span>
                  <span className="text-[10px] font-bold text-fg-muted leading-tight">{fc.name}</span>
                  <span className="text-[9px] text-fg-subtle">{formatDistance(fc.meters)}</span>
                </button>
              ))}
            </div>

            {/* Show All Toggle */}
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[11px] font-bold text-accent hover:opacity-80 transition-opacity"
            >
              {showAll ? 'Show less' : 'Show all challenges'}
            </button>

            {/* Full Category Grid */}
            {showAll && (
              <div className="flex flex-col gap-4 max-h-64 overflow-y-auto">
                {CATEGORY_ORDER.map((cat) => {
                  const items = getChallengesByCategory(cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle mb-2">
                        {CATEGORY_LABELS[cat]}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectChallenge(c.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              selectedId === c.id
                                ? 'border-accent bg-accent/10 text-fg'
                                : 'border-line-subtle text-fg-muted hover:border-line'
                            }`}
                          >
                            <span>{c.emoji}</span>
                            <span>{c.name}</span>
                            <span className="text-fg-subtle text-[9px]">{formatDistance(c.meters)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Set Goal Button */}
            {pendingId && pendingId !== activeChallenge.id && (
              <button
                onClick={handleSetGoal}
                className="w-full py-2.5 bg-accent text-surface font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Set Goal
              </button>
            )}
          </div>
        )}

        {/* Progress Display */}
        <div className="flex justify-between items-end mb-2">
          <span className="font-bold text-fg-muted text-sm">Progress</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-accent tracking-tighter">{progressPercent.toFixed(1)}%</span>
            <span className="text-sm font-bold text-fg-subtle tabular-nums">({formatMeters(totalMeters)} / {formatDistance(challenge.meters)})</span>
          </div>
        </div>

        <div className="w-full bg-surface-raised rounded-full h-6 mb-3 overflow-hidden shadow-inner border border-line/50">
          <div
            className="bg-gradient-to-r from-accent via-accent to-accent h-6 rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          >
            {progressPercent >= 10 && (
              <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">🚀</span>
            )}
          </div>
        </div>

        <p className="text-sm font-medium text-fg-muted text-center mt-4">
          {remainingMeters > 0
            ? `${formatDistance(remainingMeters)} remaining to summit!`
            : '🎉 You reached the top!'}
        </p>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute inset-0 bg-surface-card/90 backdrop-blur-sm z-10 rounded-[2rem] p-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setShowInfo(false)}
            className="absolute top-6 right-6 text-fg-subtle hover:text-fg p-2 bg-surface-raised rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <h3 className="text-2xl font-black text-fg-heading mb-6 text-center">Fun Facts 💡</h3>

          <div className="flex flex-col gap-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-4">
              <span className="text-3xl">🦒</span>
              <div>
                <p className="font-bold text-orange-900">Adult Giraffes</p>
                <p className="text-sm text-orange-700">You've climbed the equivalent of <b>{formatMeters(Math.floor(totalMeters / 5))}</b> stacked giraffes.</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center gap-4">
              <span className="text-3xl">🍕</span>
              <div>
                <p className="font-bold text-yellow-900">Pizza Boxes</p>
                <p className="text-sm text-yellow-700">That's about <b>{formatMeters(Math.floor(totalMeters / 0.045))}</b> stacked pizza boxes!</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
              <span className="text-3xl">🗽</span>
              <div>
                <p className="font-bold text-blue-900">Statue of Liberty</p>
                <p className="text-sm text-blue-700">You've scaled lady liberty <b>{(totalMeters / 93).toFixed(1)}</b> times.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run type check**

Run: `bun run lint`
Expected: No type errors.

- [ ] **Step 4: Run all tests**

Run: `bun run test`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatsTab.tsx src/App.tsx
git commit -m "feat: challenge picker UI with featured row, category grid, and Set Goal flow"
```

---

## Task 8: ProfileTab — Floor Height Presets and Remove Default Goal

**Files:**
- Modify: `src/components/ProfileTab.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx to pass floorHeight to ProfileTab**

Update the ProfileTab JSX in `src/App.tsx` (around line 193):

```tsx
<ProfileTab
  userId={userId}
  settings={settings}
  updateSettings={updateSettings}
  floorHeight={floorHeight}
/>
```

- [ ] **Step 2: Update ProfileTab**

In `src/components/ProfileTab.tsx`:

1. Update the imports — remove `CHALLENGES` from `@/constants`, add:

```ts
import { FLOOR_HEIGHT_PRESETS, DEFAULT_FLOOR_HEIGHT } from '@utils/challenges';
```

2. Update `Props` type:

```ts
type Props = {
  userId: string | null;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
  floorHeight: number;
};
```

3. Replace the "Default Goal" `<section>` (lines 271-290) with floor height presets:

```tsx
{/* Floor Height */}
<section>
  <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
    <Trophy size={14} /> Floor Height
  </h3>
  <div className="grid grid-cols-3 gap-2">
    {FLOOR_HEIGHT_PRESETS.map((preset) => {
      const active = floorHeight === preset.meters;
      return (
        <button
          key={preset.id}
          onClick={() => updateSettings({ floorHeight: preset.meters })}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
            active
              ? 'bg-accent border-accent text-surface shadow-md shadow-accent/20'
              : 'bg-surface-card border-line text-fg-muted hover:border-line'
          }`}
        >
          <span className="text-sm font-bold">{preset.meters}m</span>
          <span className="text-[9px] font-medium">{preset.label.split(' ')[0]}</span>
        </button>
      );
    })}
  </div>
  <p className="text-[10px] text-fg-subtle mt-2 px-1">
    Height per floor used for distance calculations.
  </p>
</section>
```

4. Remove the `currentChallenge` variable (line 19) since the "Default Goal" section is gone.

- [ ] **Step 3: Run type check**

Run: `bun run lint`
Expected: No type errors.

- [ ] **Step 4: Run all tests**

Run: `bun run test`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProfileTab.tsx src/App.tsx
git commit -m "feat: replace Default Goal with floor height presets in ProfileTab"
```

---

## Task 9: Update HELP.md

**Files:**
- Modify: `HELP.md`

- [ ] **Step 1: Update the Challenges section**

Replace the current "Challenges" section in `HELP.md` with:

```markdown
## Challenges

Track your cumulative climb against 30 real-world landmarks, mountains, and destinations:

- **Landmarks** — Arc de Triomphe, Statue of Liberty, Eiffel Tower, and more
- **Towers** — Empire State Building, Taipei 101, CN Tower, Burj Khalifa
- **Mountains** — Half Dome, Mount Fuji, Mont Blanc, Kilimanjaro, Everest, Mariana Trench
- **Milestones** — Double Everest, Marathon distance, 100 km Club
- **Journeys** — English Channel, Sahara Crossing, Pacific Crest Trail, Amazon River
- **Space** — Earth to Moon, Earth to Mars

Tap "Change Goal" in the **Stats** tab to browse and pick your challenge.

## Floor Height

Different buildings have different floor heights. Set yours in the **Profile** tab:

- **Residential** — 2.5 m per floor
- **Standard** — 3.0 m per floor (default)
- **Commercial** — 3.5 m per floor
```

- [ ] **Step 2: Also update the "Set your default challenge" line**

Remove the line "Set your default challenge in the **Profile** tab." since goal selection has moved to Stats.

- [ ] **Step 3: Commit**

```bash
git add HELP.md
git commit -m "docs: update HELP.md with expanded challenge catalog and floor height"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests pass.

- [ ] **Step 2: Run type check**

Run: `bun run lint`
Expected: No type errors.

- [ ] **Step 3: Run build**

Run: `bun run build`
Expected: Build succeeds, `dist/index.html` exists.

- [ ] **Step 4: Verify no broken imports**

Run: `bun run verify`
Expected: "Build verified" message.

- [ ] **Step 5: Update WORKPLAN.md**

In `docs/specs/WORKPLAN.md`, add a new section or mark the relevant items as done:

```markdown
## Mission: Phase 6 - Challenge Revamp (B1 + B3)

> Full spec: [2026-03-31-challenge-revamp-design.md](2026-03-31-challenge-revamp-design.md)
> Implementation plan: [2026-04-01-challenge-revamp-plan.md](2026-04-01-challenge-revamp-plan.md)

### B1: Challenge Catalog + Floor Height
- [x] 1. Challenge catalog (30 challenges, 7 categories)
- [x] 2. formatDistance utility
- [x] 3. Floor height presets (2.5/3.0/3.5m)
- [x] 4. Migration: defaultChallenge -> activeChallenge
- [x] 5. UserSettings type update
- [x] 6. Wire migration into useAppInitialization

### B3: Challenge Picker UI
- [x] 7. StatsTab picker (featured row, category grid, Set Goal)
- [x] 8. ProfileTab floor height presets (replace Default Goal)
- [x] 9. HELP.md update

### Deferred (B2)
- [ ] Reset periods (week/month/quarter/year/lifetime)
- [ ] Period history archiving
- [ ] Period selector in picker UI
```

- [ ] **Step 6: Commit**

```bash
git add docs/specs/WORKPLAN.md
git commit -m "docs: update WORKPLAN with Phase 6 challenge revamp progress"
```
