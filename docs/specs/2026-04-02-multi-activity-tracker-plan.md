# Multi-Activity Tracker P1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Floor Tracker from a floor-only MVP into a multi-activity product tracking floors, steps, walks, and runs. Ship P1: real auth (Google Sign-In), unified `activities/` data model, manual logging for all activity types, tracker switcher, updated Profile.

**Architecture:** Replace `DailyRecord` + `logs/` with `Activity` discriminated union + `activities/` Firestore subcollection. Swap anonymous auth for Google Sign-In. TrackerTab gets a focus-activity model with kebab switcher. ProfileTab gets activity toggles, stride length presets, and Google Sign-In. Stats/challenges compute universal distance across all activity types.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Firebase Auth (Google provider), Firestore, Vitest

**Design Spec:** `docs/specs/2026-04-02-multi-activity-tracker-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/types.ts` (expanded) | `Activity` discriminated union (`BaseActivity`, `FloorActivity`, `MovementActivity`, `StepsActivity`), `ActivityType`, `ActivitySource`. Keep existing `DailyRecord` for backward compat during migration. |
| `src/utils/activities.ts` | `createFloorActivity()`, `createMovementActivity()`, `createStepsActivity()`, `calculateTotalMeters()`, `getActivitiesForDate()`, `getActivitiesByType()` |
| `src/utils/__tests__/activities.test.ts` | Tests for all activity helper functions |
| `src/utils/__tests__/activityFirestore.test.ts` | Tests for Firestore activity operations (mocked) |
| `src/components/ActivitySwitcher.tsx` | Kebab menu for switching between enabled activities on tracker screen |
| `src/components/WalkRunTracker.tsx` | Manual walk/run logging form with distance, optional duration, date picker |
| `src/components/StepsTracker.tsx` | Manual step count entry form with date picker |
| `src/components/GoogleSignIn.tsx` | Google Sign-In button and signed-in state display |

### Modified Files

| File | Changes |
|------|---------|
| `src/types.ts` | Add `ActivityType`, `ActivitySource`, `BaseActivity`, `FloorActivity`, `MovementActivity`, `StepsActivity`, `Activity` union |
| `src/constants.ts` | Add `ACTIVITY_TYPES`, `ACTIVITY_LABELS`, `ACTIVITY_ICONS`, `DEFAULT_ACTIVITY`, `DEFAULT_STRIDE_LENGTH`, `DEFAULT_ENABLED_ACTIVITIES`, `LOCAL_STORAGE_ACTIVITIES_KEY` |
| `src/utils/firebase.ts` | Add `GoogleAuthProvider`, `signInWithPopup`, `linkWithCredential` imports. Add `signInWithGoogle()`, `linkAnonymousToGoogle()`, `saveActivity()`, `buildActivitiesQuery()`, `subscribeToUserActivities()`. Update `UserSettings` with `defaultActivity`, `enabledActivities`, `strideLength`. |
| `src/utils/appHelpers.ts` | Keep existing floor functions. No changes — floor tap logic stays as-is. |
| `src/utils/statsHelpers.ts` | Add `calculateActivityMeters()` that computes universal distance from `Activity[]` |
| `src/utils/mergeRecords.ts` | Keep existing floor merge. Add `mergeActivities()` for activity-level merge. |
| `src/utils/storage.ts` | Add `loadActivities()`, `saveActivities()` for localStorage caching of activities |
| `src/utils/useAppInitialization.ts` | Subscribe to `activities/` collection. Return activities in hook result. Migrate settings with new defaults. |
| `src/App.tsx` | Add `activities` state. Wire `handleLogMovement`, `handleLogSteps` handlers. Pass new props to TrackerTab, StatsTab. |
| `src/components/TrackerTab.tsx` | Add `activeActivity` state. Render correct tracker variant via switch. Show `ActivitySwitcher` above tracker. |
| `src/components/ProfileTab.tsx` | Add activity toggles (checkboxes), default activity dropdown, stride length presets, `GoogleSignIn` component. |
| `src/components/StatsTab.tsx` | Add `activities` and `strideLength` props. Compute universal distance from all activity types. |
| `src/components/NavigationTabs.tsx` | No structural changes — just verify tabs still work with new data flow. |
| `firestore.rules` | Add `activities/` subcollection rules with UID enforcement. |
| `package.json` | No new dependencies needed — Firebase Auth already includes Google provider. |

---

## Task 1: Activity Type Definitions

**Files:**
- Create: `src/utils/__tests__/activities.test.ts`
- Modify: `src/types.ts`
- Create: `src/utils/activities.ts`

- [ ] **Step 1: Write failing tests for activity types and helpers**

In `src/utils/__tests__/activities.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  createFloorActivity,
  createMovementActivity,
  createStepsActivity,
  calculateTotalMeters,
  getActivitiesForDate,
  getActivitiesByType,
} from '@utils/activities';
import type { Activity, FloorActivity, MovementActivity, StepsActivity } from '@/types';

describe('createFloorActivity', () => {
  it('creates a floor activity with correct total', () => {
    const activity = createFloorActivity({
      date: '2026-04-02',
      up: 10,
      down: 5,
    });
    expect(activity.type).toBe('floor');
    expect(activity.up).toBe(10);
    expect(activity.down).toBe(5);
    expect(activity.total).toBe(12.5); // 10 + 5 * 0.5
    expect(activity.date).toBe('2026-04-02');
    expect(activity.source).toBe('manual');
    expect(activity.id).toBeTruthy();
  });

  it('defaults to zero up/down', () => {
    const activity = createFloorActivity({ date: '2026-04-02' });
    expect(activity.up).toBe(0);
    expect(activity.down).toBe(0);
    expect(activity.total).toBe(0);
  });
});

describe('createMovementActivity', () => {
  it('creates a walk activity', () => {
    const activity = createMovementActivity({
      type: 'walk',
      date: '2026-04-02',
      meters: 5000,
      duration: 60,
    });
    expect(activity.type).toBe('walk');
    expect(activity.meters).toBe(5000);
    expect(activity.duration).toBe(60);
    expect(activity.source).toBe('manual');
  });

  it('creates a run activity without duration', () => {
    const activity = createMovementActivity({
      type: 'run',
      date: '2026-04-02',
      meters: 10000,
    });
    expect(activity.type).toBe('run');
    expect(activity.meters).toBe(10000);
    expect(activity.duration).toBeUndefined();
  });
});

describe('createStepsActivity', () => {
  it('creates a steps activity', () => {
    const activity = createStepsActivity({
      date: '2026-04-02',
      count: 8000,
    });
    expect(activity.type).toBe('steps');
    expect(activity.count).toBe(8000);
    expect(activity.meters).toBeUndefined();
    expect(activity.source).toBe('manual');
  });

  it('creates a steps activity with estimated meters', () => {
    const activity = createStepsActivity({
      date: '2026-04-02',
      count: 10000,
      meters: 7620,
    });
    expect(activity.count).toBe(10000);
    expect(activity.meters).toBe(7620);
  });
});

describe('calculateTotalMeters', () => {
  it('calculates floor meters using floorHeight', () => {
    const floor = createFloorActivity({ date: '2026-04-02', up: 10, down: 5 });
    const meters = calculateTotalMeters([floor], { floorHeight: 3.0, strideLength: 0.762 });
    expect(meters).toBe(12.5 * 3.0); // total * floorHeight
  });

  it('calculates walk/run meters directly', () => {
    const walk = createMovementActivity({ type: 'walk', date: '2026-04-02', meters: 5000 });
    const run = createMovementActivity({ type: 'run', date: '2026-04-02', meters: 3000 });
    const meters = calculateTotalMeters([walk, run], { floorHeight: 3.0, strideLength: 0.762 });
    expect(meters).toBe(8000);
  });

  it('calculates steps meters using strideLength', () => {
    const steps = createStepsActivity({ date: '2026-04-02', count: 10000 });
    const meters = calculateTotalMeters([steps], { floorHeight: 3.0, strideLength: 0.762 });
    expect(meters).toBe(10000 * 0.762);
  });

  it('sums across all activity types', () => {
    const floor = createFloorActivity({ date: '2026-04-02', up: 10, down: 0 }); // total = 10
    const walk = createMovementActivity({ type: 'walk', date: '2026-04-02', meters: 2000 });
    const steps = createStepsActivity({ date: '2026-04-02', count: 5000 });

    const meters = calculateTotalMeters([floor, walk, steps], { floorHeight: 3.0, strideLength: 0.762 });
    // (10 * 3.0) + 2000 + (5000 * 0.762) = 30 + 2000 + 3810 = 5840
    expect(meters).toBe(5840);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalMeters([], { floorHeight: 3.0, strideLength: 0.762 })).toBe(0);
  });
});

describe('getActivitiesForDate', () => {
  it('filters activities by date', () => {
    const a1 = createFloorActivity({ date: '2026-04-01', up: 5, down: 0 });
    const a2 = createFloorActivity({ date: '2026-04-02', up: 10, down: 0 });
    const a3 = createMovementActivity({ type: 'walk', date: '2026-04-02', meters: 1000 });

    const result = getActivitiesForDate([a1, a2, a3], '2026-04-02');
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.date === '2026-04-02')).toBe(true);
  });

  it('returns empty array for no matches', () => {
    const a1 = createFloorActivity({ date: '2026-04-01', up: 1, down: 0 });
    expect(getActivitiesForDate([a1], '2026-04-02')).toHaveLength(0);
  });
});

describe('getActivitiesByType', () => {
  it('filters activities by type', () => {
    const floor = createFloorActivity({ date: '2026-04-02', up: 5, down: 0 });
    const walk = createMovementActivity({ type: 'walk', date: '2026-04-02', meters: 1000 });
    const run = createMovementActivity({ type: 'run', date: '2026-04-02', meters: 2000 });

    const walks = getActivitiesByType([floor, walk, run], 'walk');
    expect(walks).toHaveLength(1);
    expect(walks[0].type).toBe('walk');
  });
});
```

- [ ] **Step 2: Verify tests fail** (modules don't exist yet)

```bash
bunx vitest run src/utils/__tests__/activities.test.ts
```

Expected: compilation errors — `@utils/activities` and types don't exist.

- [ ] **Step 3: Add Activity types to `src/types.ts`**

Replace `src/types.ts` with:

```ts
/**
 * Shared TypeScript type definitions used across the application.
 */

// ---------------------------------------------------------------------------
// Legacy — kept for backward compatibility during migration
// ---------------------------------------------------------------------------

export type DailyRecord = {
  dateStr: string; // YYYY-MM-DD
  up: number;
  down: number;
  total: number;
};

// ---------------------------------------------------------------------------
// Multi-Activity Types (P1)
// ---------------------------------------------------------------------------

export type ActivityType = 'floor' | 'walk' | 'run' | 'steps';
export type ActivitySource = 'manual' | 'healthkit' | 'googlefit';

export type BaseActivity = {
  id: string;              // Firestore auto-id or client-generated
  type: ActivityType;
  date: string;            // YYYY-MM-DD
  source: ActivitySource;
  createdAt: number;       // Date.now() timestamp
};

export type FloorActivity = BaseActivity & {
  type: 'floor';
  up: number;
  down: number;
  total: number;           // up + down * 0.5
};

export type MovementActivity = BaseActivity & {
  type: 'walk' | 'run';
  meters: number;
  duration?: number;       // minutes, optional
  steps?: number;          // if available from health API
};

export type StepsActivity = BaseActivity & {
  type: 'steps';
  count: number;
  meters?: number;         // estimated distance if available
};

export type Activity = FloorActivity | MovementActivity | StepsActivity;
```

- [ ] **Step 4: Implement `src/utils/activities.ts`**

```ts
/**
 * Activity creation helpers and query utilities.
 * All activity types flow through these factory functions.
 */
import type { Activity, FloorActivity, MovementActivity, StepsActivity, ActivityType } from '@/types';
import { calculateTotal } from '@utils/appHelpers';

// ---------------------------------------------------------------------------
// Factory Functions
// ---------------------------------------------------------------------------

type CreateFloorInput = {
  date: string;
  up?: number;
  down?: number;
  id?: string;
};

export const createFloorActivity = (input: CreateFloorInput): FloorActivity => {
  const up = input.up ?? 0;
  const down = input.down ?? 0;
  return {
    id: input.id ?? crypto.randomUUID(),
    type: 'floor',
    date: input.date,
    source: 'manual',
    createdAt: Date.now(),
    up,
    down,
    total: calculateTotal(up, down),
  };
};

type CreateMovementInput = {
  type: 'walk' | 'run';
  date: string;
  meters: number;
  duration?: number;
  steps?: number;
  id?: string;
};

export const createMovementActivity = (input: CreateMovementInput): MovementActivity => {
  return {
    id: input.id ?? crypto.randomUUID(),
    type: input.type,
    date: input.date,
    source: 'manual',
    createdAt: Date.now(),
    meters: input.meters,
    ...(input.duration !== undefined && { duration: input.duration }),
    ...(input.steps !== undefined && { steps: input.steps }),
  };
};

type CreateStepsInput = {
  date: string;
  count: number;
  meters?: number;
  id?: string;
};

export const createStepsActivity = (input: CreateStepsInput): StepsActivity => {
  return {
    id: input.id ?? crypto.randomUUID(),
    type: 'steps',
    date: input.date,
    source: 'manual',
    createdAt: Date.now(),
    count: input.count,
    ...(input.meters !== undefined && { meters: input.meters }),
  };
};

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

type MetersConfig = {
  floorHeight: number;
  strideLength: number;
};

/**
 * Computes universal distance in meters across all activity types.
 * - Floors: total * floorHeight
 * - Walk/Run: meters directly
 * - Steps: count * strideLength
 */
export const calculateTotalMeters = (activities: Activity[], config: MetersConfig): number => {
  return activities.reduce((sum, activity) => {
    switch (activity.type) {
      case 'floor':
        return sum + activity.total * config.floorHeight;
      case 'walk':
      case 'run':
        return sum + activity.meters;
      case 'steps':
        return sum + activity.count * config.strideLength;
      default:
        return sum;
    }
  }, 0);
};

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export const getActivitiesForDate = (activities: Activity[], date: string): Activity[] => {
  return activities.filter((a) => a.date === date);
};

export const getActivitiesByType = (activities: Activity[], type: ActivityType): Activity[] => {
  return activities.filter((a) => a.type === type);
};
```

- [ ] **Step 5: Verify tests pass**

```bash
bunx vitest run src/utils/__tests__/activities.test.ts
```

- [ ] **Step 6: Type check**

```bash
bun run lint
```

- [ ] **Step 7: Commit**

```
feat: add Activity type definitions and helper functions

Introduce ActivityType discriminated union (floor, walk, run, steps)
alongside existing DailyRecord. Factory functions for each activity
type, universal meters calculation, and date/type filters.
```

---

## Task 2: Constants and Settings

**Files:**
- Modify: `src/constants.ts`
- Modify: `src/utils/firebase.ts`

- [ ] **Step 1: Add activity constants to `src/constants.ts`**

Append to `src/constants.ts`:

```ts
import type { ActivityType } from '@/types';

// Multi-Activity constants (P1)
export const ACTIVITY_TYPES: ActivityType[] = ['floor', 'walk', 'run', 'steps'];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  floor: 'Floors',
  walk: 'Walk',
  run: 'Run',
  steps: 'Steps',
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  floor: 'Building2',    // lucide-react icon name
  walk: 'Footprints',
  run: 'Zap',
  steps: 'TrendingUp',
};

export const DEFAULT_ACTIVITY: ActivityType = 'floor';
export const DEFAULT_STRIDE_LENGTH = 0.762; // meters (average adult)
export const DEFAULT_ENABLED_ACTIVITIES: ActivityType[] = ['floor'];

export const LOCAL_STORAGE_ACTIVITIES_KEY = 'floorTrackerActivities';
```

- [ ] **Step 2: Update `UserSettings` in `src/utils/firebase.ts`**

Add to the `UserSettings` type:

```ts
export type UserSettings = {
  // Existing
  theme?: ThemeId | 'light' | 'dark' | 'system';
  colorMode?: 'light' | 'dark' | 'system';
  defaultChallenge?: string;
  activeChallenge?: {
    id: string;
    resetPeriod: 'week' | 'month' | '3month' | 'year' | 'lifetime';
    currentPeriodKey: string;
  };
  floorHeight?: 2.5 | 3.0 | 3.5;
  email?: string;
  username?: string;
  updatedAt?: number;

  // Multi-Activity (P1)
  defaultActivity?: ActivityType;
  enabledActivities?: ActivityType[];
  strideLength?: number;
};
```

Add the `ActivityType` import at the top of `firebase.ts`:

```ts
import type { ActivityType } from '@/types';
```

- [ ] **Step 3: Type check**

```bash
bun run lint
```

- [ ] **Step 4: Commit**

```
feat: add multi-activity constants and UserSettings fields

ACTIVITY_TYPES, labels, icons, defaults in constants.ts. UserSettings
extended with defaultActivity, enabledActivities, strideLength.
```

---

## Task 3: Activity Firestore Operations

**Files:**
- Create: `src/utils/__tests__/activityFirestore.test.ts`
- Modify: `src/utils/firebase.ts`

- [ ] **Step 1: Write failing tests for Firestore activity operations**

In `src/utils/__tests__/activityFirestore.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase modules
const mockAddDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOnSnapshot = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: mockCollection,
  writeBatch: vi.fn(() => ({ set: vi.fn(), commit: vi.fn() })),
  onSnapshot: mockOnSnapshot,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  runTransaction: vi.fn(),
  addDoc: mockAddDoc,
  Unsubscribe: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInAnonymously: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  linkWithCredential: vi.fn(),
}));

import { saveActivity, buildActivitiesQuery, subscribeToUserActivities } from '@utils/firebase';
import { createFloorActivity } from '@utils/activities';

describe('saveActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls addDoc with correct collection path', async () => {
    mockAddDoc.mockResolvedValue({ id: 'auto-id-1' });
    mockCollection.mockReturnValue('activities-ref');

    const activity = createFloorActivity({ date: '2026-04-02', up: 5, down: 3 });
    await saveActivity('user-123', activity);

    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users/user-123/activities');
    expect(mockAddDoc).toHaveBeenCalledWith('activities-ref', expect.objectContaining({
      type: 'floor',
      date: '2026-04-02',
      up: 5,
      down: 3,
    }));
  });
});

describe('buildActivitiesQuery', () => {
  it('builds query with date filter', () => {
    mockCollection.mockReturnValue('activities-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');

    buildActivitiesQuery('user-123', { date: '2026-04-02' });

    expect(mockWhere).toHaveBeenCalledWith('date', '==', '2026-04-02');
  });

  it('builds query with type filter', () => {
    mockCollection.mockReturnValue('activities-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');

    buildActivitiesQuery('user-123', { type: 'floor' });

    expect(mockWhere).toHaveBeenCalledWith('type', '==', 'floor');
  });

  it('builds query with both type and date filters', () => {
    mockCollection.mockReturnValue('activities-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');

    buildActivitiesQuery('user-123', { type: 'walk', date: '2026-04-02' });

    expect(mockWhere).toHaveBeenCalledWith('type', '==', 'walk');
    expect(mockWhere).toHaveBeenCalledWith('date', '==', '2026-04-02');
  });
});

describe('subscribeToUserActivities', () => {
  it('calls onSnapshot and returns unsubscribe', () => {
    const unsub = vi.fn();
    mockOnSnapshot.mockReturnValue(unsub);
    mockCollection.mockReturnValue('activities-ref');
    mockQuery.mockReturnValue('query-ref');

    const onUpdate = vi.fn();
    const result = subscribeToUserActivities('user-123', onUpdate);

    expect(mockOnSnapshot).toHaveBeenCalled();
    expect(result).toBe(unsub);
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
bunx vitest run src/utils/__tests__/activityFirestore.test.ts
```

Expected: `saveActivity`, `buildActivitiesQuery`, `subscribeToUserActivities` not exported from firebase.ts.

- [ ] **Step 3: Implement Firestore activity operations in `src/utils/firebase.ts`**

Add these imports to the existing firebase import line:

```ts
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, getDoc, deleteDoc, collection, writeBatch, onSnapshot, query, where, orderBy, runTransaction, addDoc, Unsubscribe } from "firebase/firestore";
```

Add these functions after the existing `subscribeToUserLogs`:

```ts
/**
 * Saves an activity document to the activities subcollection.
 * Uses addDoc for auto-generated IDs.
 */
export const saveActivity = async (userId: string, activity: Activity) => {
  if (!userId) return;
  setSyncStatus('syncing');
  try {
    const activitiesRef = collection(db, `users/${userId}/activities`);
    await addDoc(activitiesRef, activity);
    setSyncStatus('synced');
  } catch (error) {
    console.error("Error saving activity:", error);
    setSyncStatus('error');
  }
};

/**
 * Builds a Firestore query for the activities subcollection with optional filters.
 */
export const buildActivitiesQuery = (
  userId: string,
  filters: { type?: ActivityType; date?: string } = {}
) => {
  const activitiesRef = collection(db, `users/${userId}/activities`);
  const constraints = [];

  if (filters.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters.date) {
    constraints.push(where('date', '==', filters.date));
  }

  return query(activitiesRef, ...constraints);
};

/**
 * Real-time subscription to a user's activities.
 * Returns an unsubscribe function.
 */
export const subscribeToUserActivities = (
  userId: string,
  onUpdate: (activities: Activity[]) => void
): Unsubscribe => {
  const q = query(collection(db, `users/${userId}/activities`));
  return onSnapshot(q, (snapshot) => {
    const activities: Activity[] = [];
    snapshot.forEach((doc) => {
      activities.push({ ...doc.data(), id: doc.id } as Activity);
    });
    onUpdate(activities);
  }, (error) => {
    console.error("Activities Listen Error:", error);
    setSyncStatus('error');
  });
};
```

Add the `Activity` import at the top of `firebase.ts` (update the existing import):

```ts
import { DailyRecord, Activity } from '@/types';
import type { ActivityType } from '@/types';
```

Also add `where`, `orderBy`, and `addDoc` to the Firestore imports (update the existing import line).

- [ ] **Step 4: Verify tests pass**

```bash
bunx vitest run src/utils/__tests__/activityFirestore.test.ts
```

- [ ] **Step 5: Type check**

```bash
bun run lint
```

- [ ] **Step 6: Commit**

```
feat: add Firestore activity operations

saveActivity (addDoc), buildActivitiesQuery (type/date filters),
subscribeToUserActivities (real-time listener) for the new
activities/ subcollection.
```

---

## Task 4: Google Sign-In

**Files:**
- Modify: `src/utils/firebase.ts`
- Create: `src/components/GoogleSignIn.tsx`

- [ ] **Step 1: Add Google auth functions to `src/utils/firebase.ts`**

Update the Firebase Auth import:

```ts
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, linkWithCredential } from "firebase/auth";
```

Add after `initializeFirebaseSession`:

```ts
const googleProvider = new GoogleAuthProvider();

/**
 * Signs in with Google. If the user is currently anonymous,
 * links the anonymous account to Google via linkWithCredential().
 * Returns the user or null on failure.
 */
export const signInWithGoogle = async () => {
  try {
    const currentUser = auth.currentUser;

    if (currentUser?.isAnonymous) {
      // Link anonymous account to Google
      return await linkAnonymousToGoogle();
    }

    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    return null;
  }
};

/**
 * Links the current anonymous Firebase user to a Google account.
 * Preserves the anonymous UID so all Firestore data stays intact.
 */
export const linkAnonymousToGoogle = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) return null;

    const linked = await linkWithCredential(currentUser, credential);
    return linked.user;
  } catch (error: unknown) {
    // If the Google account is already linked to another anonymous account,
    // the user needs to sign in directly instead of linking.
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'auth/credential-already-in-use') {
      console.warn("Google account already linked to another user. Sign in directly.");
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
    console.error("Link Anonymous Error:", error);
    return null;
  }
};
```

- [ ] **Step 2: Create `src/components/GoogleSignIn.tsx`**

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { LogIn, CheckCircle2 } from 'lucide-react';
import { auth, signInWithGoogle } from '@utils/firebase';

type Props = {
  onSignIn?: () => void;
};

export default function GoogleSignIn({ onSignIn }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const currentUser = auth.currentUser;
  const isSignedInWithGoogle = currentUser?.providerData.some(
    (p) => p.providerId === 'google.com'
  );

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const user = await signInWithGoogle();
    setLoading(false);

    if (user) {
      onSignIn?.();
    } else {
      setError('Sign-in failed. Please try again.');
    }
  };

  if (isSignedInWithGoogle) {
    const googleProfile = currentUser?.providerData.find(
      (p) => p.providerId === 'google.com'
    );
    return (
      <div className="bg-surface-raised p-4 rounded-2xl border border-line-subtle">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-fg">Signed in with Google</p>
            <p className="text-xs text-fg-muted truncate">
              {googleProfile?.email || googleProfile?.displayName || 'Connected'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised p-4 rounded-2xl border border-line-subtle">
      <div className="flex items-center gap-2 mb-3 text-fg-subtle">
        <LogIn size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Account</span>
      </div>
      <p className="text-xs text-fg-muted mb-3">
        Sign in with Google to secure your data and sync across devices.
      </p>
      <motion.button
        onClick={handleSignIn}
        disabled={loading}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-center gap-2 bg-surface border border-line text-fg font-bold text-sm rounded-xl p-3 hover:border-accent/40 transition-all disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </motion.button>
      {error && (
        <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
bun run lint
```

- [ ] **Step 4: Commit**

```
feat: add Google Sign-In with anonymous account linking

signInWithGoogle() and linkAnonymousToGoogle() in firebase.ts.
GoogleSignIn component shows sign-in button or signed-in state.
Existing anonymous users get their UID linked to Google — zero
data migration needed.
```

---

## Task 5: Firestore Rules + Indexes

**Files:**
- Modify: `firestore.rules`
- Create: `firestore.indexes.json`

- [ ] **Step 1: Update `firestore.rules`**

Replace `firestore.rules` with:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // User logs (legacy): any authenticated user can read/write.
    match /users/{userId}/logs/{logId} {
      allow read, write: if request.auth != null;
    }

    // User activities: UID ownership enforced.
    match /users/{userId}/activities/{actId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User settings: any authenticated user can read/write.
    match /users/{userId}/settings/{settingId} {
      allow read, write: if request.auth != null;
    }

    // Usernames: authenticated users can read, create, and delete.
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Create `firestore.indexes.json`**

```json
{
  "indexes": [
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 3: Commit**

```
feat: add Firestore rules and indexes for activities

activities/ subcollection gets UID ownership enforcement
(request.auth.uid == userId). Composite indexes for date and
(type, date) queries.
```

---

## Task 6: ProfileTab — Activity Toggles, Stride, Google Sign-In

**Files:**
- Modify: `src/components/ProfileTab.tsx`

- [ ] **Step 1: Update ProfileTab imports**

Add to existing imports:

```ts
import { Activity, Footprints, Zap, TrendingUp, Building2 } from 'lucide-react';
import { ACTIVITY_TYPES, ACTIVITY_LABELS, DEFAULT_ACTIVITY, DEFAULT_STRIDE_LENGTH, DEFAULT_ENABLED_ACTIVITIES } from '@/constants';
import type { ActivityType } from '@/types';
import GoogleSignIn from '@components/GoogleSignIn';
```

- [ ] **Step 2: Update Props type**

```ts
type Props = {
  userId: string | null;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
  floorHeight: number;
};
```

Props stay the same — `enabledActivities`, `defaultActivity`, and `strideLength` come from `settings`.

- [ ] **Step 3: Add Activity Toggles section**

Insert after the Floor Height section and before the footer:

```tsx
{/* Activity Toggles */}
<section>
  <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
    <Activity size={14} /> Activities
  </h3>
  <div className="flex flex-col gap-2">
    {ACTIVITY_TYPES.map((actType) => {
      const enabled = (settings.enabledActivities ?? DEFAULT_ENABLED_ACTIVITIES).includes(actType);
      const isFloor = actType === 'floor';
      const IconMap: Record<ActivityType, typeof Building2> = {
        floor: Building2,
        walk: Footprints,
        run: Zap,
        steps: TrendingUp,
      };
      const Icon = IconMap[actType];

      return (
        <label
          key={actType}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
            enabled
              ? 'bg-accent/10 border-accent/30 text-fg'
              : 'bg-surface-raised border-line text-fg-muted'
          } ${isFloor ? 'opacity-80 cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            checked={enabled}
            disabled={isFloor}
            onChange={() => {
              if (isFloor) return;
              const current = settings.enabledActivities ?? DEFAULT_ENABLED_ACTIVITIES;
              const next = enabled
                ? current.filter((t) => t !== actType)
                : [...current, actType];
              updateSettings({ enabledActivities: next });

              // If disabling the default activity, reset to floor
              if (enabled && settings.defaultActivity === actType) {
                updateSettings({ enabledActivities: next, defaultActivity: 'floor' });
              } else {
                updateSettings({ enabledActivities: next });
              }
            }}
            className="rounded border-line text-accent focus:ring-accent"
          />
          <Icon size={16} />
          <span className="text-sm font-bold">{ACTIVITY_LABELS[actType]}</span>
          {isFloor && <span className="text-[9px] text-fg-subtle ml-auto">Always on</span>}
        </label>
      );
    })}
  </div>
</section>

{/* Default Activity */}
{(settings.enabledActivities ?? DEFAULT_ENABLED_ACTIVITIES).length > 1 && (
  <section>
    <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
      <Activity size={14} /> Default Activity
    </h3>
    <select
      value={settings.defaultActivity ?? DEFAULT_ACTIVITY}
      onChange={(e) => updateSettings({ defaultActivity: e.target.value as ActivityType })}
      className="w-full bg-surface-raised border border-line text-fg text-sm font-bold rounded-xl focus:ring-accent focus:border-accent block p-3 cursor-pointer shadow-sm"
    >
      {(settings.enabledActivities ?? DEFAULT_ENABLED_ACTIVITIES).map((actType) => (
        <option key={actType} value={actType}>
          {ACTIVITY_LABELS[actType]}
        </option>
      ))}
    </select>
    <p className="text-[10px] text-fg-subtle mt-2 px-1">
      Shown first when you open the tracker.
    </p>
  </section>
)}

{/* Stride Length */}
<section>
  <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
    <Footprints size={14} /> Stride Length
  </h3>
  <div className="grid grid-cols-3 gap-2">
    {[
      { id: 'short', label: 'Short', meters: 0.6 },
      { id: 'average', label: 'Average', meters: 0.762 },
      { id: 'tall', label: 'Tall', meters: 0.9 },
    ].map((preset) => {
      const active = (settings.strideLength ?? DEFAULT_STRIDE_LENGTH) === preset.meters;
      return (
        <button
          key={preset.id}
          onClick={() => updateSettings({ strideLength: preset.meters })}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
            active
              ? 'bg-accent border-accent text-surface shadow-md shadow-accent/20'
              : 'bg-surface-card border-line text-fg-muted hover:border-line'
          }`}
        >
          <span className="text-sm font-bold">{preset.meters}m</span>
          <span className="text-[9px] font-medium">{preset.label}</span>
        </button>
      );
    })}
  </div>
  <p className="text-[10px] text-fg-subtle mt-2 px-1">
    Used to convert steps into distance for challenges.
  </p>
</section>

{/* Google Sign-In */}
<GoogleSignIn />
```

- [ ] **Step 4: Type check**

```bash
bun run lint
```

- [ ] **Step 5: Commit**

```
feat: add activity toggles, stride length, and Google Sign-In to Profile

Checkboxes for steps/walk/run (floor always on), default activity
dropdown when multiple enabled, stride length presets (short 0.6m /
average 0.762m / tall 0.9m), GoogleSignIn component.
```

---

## Task 7: WalkRunTracker + StepsTracker Components

**Files:**
- Create: `src/components/WalkRunTracker.tsx`
- Create: `src/components/StepsTracker.tsx`

- [ ] **Step 1: Create `src/components/WalkRunTracker.tsx`**

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Footprints, Zap, Calendar, Plus } from 'lucide-react';
import { getTodayKey } from '@utils/date';

type Props = {
  activityType: 'walk' | 'run';
  todayMeters: number;
  onLog: (meters: number, duration: number | undefined, date: string) => void;
};

export default function WalkRunTracker({ activityType, todayMeters, onLog }: Props) {
  const [distance, setDistance] = React.useState('');
  const [unit, setUnit] = React.useState<'m' | 'km'>('km');
  const [duration, setDuration] = React.useState('');
  const [date, setDate] = React.useState(getTodayKey());

  const Icon = activityType === 'walk' ? Footprints : Zap;
  const label = activityType === 'walk' ? 'Walk' : 'Run';

  const handleLog = () => {
    const raw = parseFloat(distance);
    if (isNaN(raw) || raw <= 0) return;

    const meters = unit === 'km' ? raw * 1000 : raw;
    const mins = duration ? parseInt(duration, 10) : undefined;

    onLog(meters, mins && !isNaN(mins) ? mins : undefined, date);
    setDistance('');
    setDuration('');
    setDate(getTodayKey());
  };

  const displayMeters = todayMeters >= 1000
    ? `${(todayMeters / 1000).toFixed(1)} km`
    : `${Math.round(todayMeters)} m`;

  return (
    <div className="relative bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
          Log {label}
        </div>

        {/* Today's total */}
        <div className="flex items-center gap-2 mb-6">
          <Icon size={20} className="text-accent" />
          <span className="text-3xl font-bold text-fg-heading font-mono tabular-nums">
            {displayMeters}
          </span>
        </div>

        {/* Distance input */}
        <div className="w-full flex gap-2 mb-3">
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="Distance"
            min="0"
            step="0.1"
            className="flex-1 bg-surface border border-line text-fg text-sm font-mono rounded-xl p-3 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'm' | 'km')}
            className="bg-surface-raised border border-line text-fg text-sm font-bold rounded-xl px-3 cursor-pointer focus:ring-accent focus:border-accent"
          >
            <option value="km">km</option>
            <option value="m">m</option>
          </select>
        </div>

        {/* Duration input (optional) */}
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Duration (minutes, optional)"
          min="0"
          className="w-full bg-surface border border-line text-fg text-sm font-mono rounded-xl p-3 mb-3 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
        />

        {/* Date picker */}
        <div className="w-full flex items-center gap-2 mb-4">
          <Calendar size={14} className="text-fg-subtle shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getTodayKey()}
            className="flex-1 bg-surface border border-line text-fg text-sm font-mono rounded-xl p-3 focus:ring-accent focus:border-accent"
          />
        </div>

        {/* Log button */}
        <motion.button
          onClick={handleLog}
          whileTap={{ scale: 0.95 }}
          disabled={!distance || parseFloat(distance) <= 0}
          className="w-full flex items-center justify-center gap-2 bg-accent text-surface font-bold text-sm rounded-xl p-3 shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Plus size={16} />
          Log {label}
        </motion.button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/StepsTracker.tsx`**

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, Plus } from 'lucide-react';
import { getTodayKey } from '@utils/date';

type Props = {
  todaySteps: number;
  onLog: (count: number, date: string) => void;
};

export default function StepsTracker({ todaySteps, onLog }: Props) {
  const [steps, setSteps] = React.useState('');
  const [date, setDate] = React.useState(getTodayKey());

  const handleLog = () => {
    const count = parseInt(steps, 10);
    if (isNaN(count) || count <= 0) return;

    onLog(count, date);
    setSteps('');
    setDate(getTodayKey());
  };

  return (
    <div className="relative bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
          Log Steps
        </div>

        {/* Today's total */}
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={20} className="text-accent" />
          <span className="text-3xl font-bold text-fg-heading font-mono tabular-nums">
            {todaySteps.toLocaleString()}
          </span>
          <span className="text-sm text-fg-subtle font-bold">steps</span>
        </div>

        {/* Steps input */}
        <input
          type="number"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="Step count"
          min="0"
          className="w-full bg-surface border border-line text-fg text-sm font-mono rounded-xl p-3 mb-3 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
        />

        {/* Date picker */}
        <div className="w-full flex items-center gap-2 mb-4">
          <Calendar size={14} className="text-fg-subtle shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getTodayKey()}
            className="flex-1 bg-surface border border-line text-fg text-sm font-mono rounded-xl p-3 focus:ring-accent focus:border-accent"
          />
        </div>

        {/* Log button */}
        <motion.button
          onClick={handleLog}
          whileTap={{ scale: 0.95 }}
          disabled={!steps || parseInt(steps, 10) <= 0}
          className="w-full flex items-center justify-center gap-2 bg-accent text-surface font-bold text-sm rounded-xl p-3 shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Plus size={16} />
          Log Steps
        </motion.button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
bun run lint
```

- [ ] **Step 4: Commit**

```
feat: add WalkRunTracker and StepsTracker components

WalkRunTracker: distance input (m/km toggle), optional duration,
date picker, Log button. StepsTracker: step count input, date
picker, Log button. Both use motion animations and semantic theme
tokens.
```

---

## Task 8: ActivitySwitcher Component

**Files:**
- Create: `src/components/ActivitySwitcher.tsx`

- [ ] **Step 1: Create `src/components/ActivitySwitcher.tsx`**

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Building2, Footprints, Zap, TrendingUp, type LucideIcon } from 'lucide-react';
import { ACTIVITY_LABELS } from '@/constants';
import type { ActivityType } from '@/types';

type Props = {
  activeActivity: ActivityType;
  enabledActivities: ActivityType[];
  onSwitch: (activity: ActivityType) => void;
};

const ICON_MAP: Record<ActivityType, LucideIcon> = {
  floor: Building2,
  walk: Footprints,
  run: Zap,
  steps: TrendingUp,
};

export default function ActivitySwitcher({ activeActivity, enabledActivities, onSwitch }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Hide switcher when only one activity is enabled
  if (enabledActivities.length <= 1) return null;

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const ActiveIcon = ICON_MAP[activeActivity];
  const otherActivities = enabledActivities.filter((a) => a !== activeActivity);

  return (
    <div ref={ref} className="relative mb-4 self-end">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-surface-card border border-line rounded-xl px-3 py-2 text-fg-muted hover:text-fg hover:border-accent/40 transition-all shadow-sm"
      >
        <ActiveIcon size={16} className="text-accent" />
        <span className="text-xs font-bold">{ACTIVITY_LABELS[activeActivity]}</span>
        <MoreVertical size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-surface-card border border-line rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]"
          >
            {otherActivities.map((actType) => {
              const Icon = ICON_MAP[actType];
              return (
                <button
                  key={actType}
                  onClick={() => {
                    onSwitch(actType);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-fg hover:bg-surface-hover transition-colors text-sm font-bold"
                >
                  <Icon size={16} className="text-fg-muted" />
                  {ACTIVITY_LABELS[actType]}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Type check**

```bash
bun run lint
```

- [ ] **Step 3: Commit**

```
feat: add ActivitySwitcher kebab menu component

Shows current activity icon + name, dropdown of other enabled
activities. Closes on outside click. Hidden when only one activity
is enabled. Uses AnimatePresence for smooth open/close.
```

---

## Task 9: TrackerTab Wiring

**Files:**
- Modify: `src/components/TrackerTab.tsx`

- [ ] **Step 1: Update TrackerTab Props**

Replace the `Props` type:

```ts
import type { ActivityType, Activity } from '@/types';
import { DEFAULT_ACTIVITY, DEFAULT_ENABLED_ACTIVITIES } from '@/constants';
import ActivitySwitcher from '@components/ActivitySwitcher';
import WalkRunTracker from '@components/WalkRunTracker';
import StepsTracker from '@components/StepsTracker';
import { getActivitiesForDate, getActivitiesByType } from '@utils/activities';

type Props = {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  sortedRecords: DailyRecord[];
  onUpdateRecord: (dateStr: string, up: number, down: number) => void;
  // Multi-activity props
  activities: Activity[];
  todayKey: string;
  floorHeight: number;
  strideLength: number;
  defaultActivity: ActivityType;
  enabledActivities: ActivityType[];
  onLogMovement: (type: 'walk' | 'run', meters: number, duration: number | undefined, date: string) => void;
  onLogSteps: (count: number, date: string) => void;
};
```

- [ ] **Step 2: Add activeActivity state and tracker switching**

Inside the `TrackerTab` function, add:

```ts
const [activeActivity, setActiveActivity] = React.useState<ActivityType>(defaultActivity);

// Reset to default if it gets disabled
React.useEffect(() => {
  if (!enabledActivities.includes(activeActivity)) {
    setActiveActivity(defaultActivity);
  }
}, [enabledActivities, activeActivity, defaultActivity]);

// Calculate today's metrics for non-floor activities
const todayActivities = getActivitiesForDate(activities, todayKey);
const todayWalkMeters = getActivitiesByType(todayActivities, 'walk')
  .reduce((sum, a) => sum + (a.type === 'walk' || a.type === 'run' ? a.meters : 0), 0);
const todayRunMeters = getActivitiesByType(todayActivities, 'run')
  .reduce((sum, a) => sum + (a.type === 'walk' || a.type === 'run' ? a.meters : 0), 0);
const todaySteps = getActivitiesByType(todayActivities, 'steps')
  .reduce((sum, a) => sum + (a.type === 'steps' ? a.count : 0), 0);
```

- [ ] **Step 3: Update the return JSX to switch between trackers**

Replace the tracker render section:

```tsx
return (
  <>
    {/* Activity Switcher */}
    <ActivitySwitcher
      activeActivity={activeActivity}
      enabledActivities={enabledActivities}
      onSwitch={setActiveActivity}
    />

    {/* Active tracker */}
    {activeActivity === 'floor' && (
      themeId === 'night-city-elevator'
        ? <ElevatorTracker {...trackerProps} />
        : <DefaultTracker {...trackerProps} themeId={themeId} />
    )}

    {(activeActivity === 'walk' || activeActivity === 'run') && (
      <WalkRunTracker
        activityType={activeActivity}
        todayMeters={activeActivity === 'walk' ? todayWalkMeters : todayRunMeters}
        onLog={(meters, duration, date) => onLogMovement(activeActivity, meters, duration, date)}
      />
    )}

    {activeActivity === 'steps' && (
      <StepsTracker
        todaySteps={todaySteps}
        onLog={onLogSteps}
      />
    )}

    {/* Log table (floor records, shown only when floor is active) */}
    {activeActivity === 'floor' && (
      <div className="w-full max-w-sm">
        {/* ... existing log table code stays unchanged ... */}
      </div>
    )}
  </>
);
```

- [ ] **Step 4: Type check**

```bash
bun run lint
```

- [ ] **Step 5: Commit**

```
feat: wire TrackerTab with activity switcher and multi-tracker views

activeActivity state drives which tracker renders. ActivitySwitcher
above the tracker for switching between enabled activities. Floor
tracker unchanged, walk/run/steps trackers wired to new components.
```

---

## Task 10: App.tsx Wiring

**Files:**
- Modify: `src/utils/useAppInitialization.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `useAppInitialization` to subscribe to activities**

Update the hook return type:

```ts
import type { Activity } from '@/types';

type UseAppInitializationResult = {
  isDevUrl: boolean;
  userId: string | null;
  showWarning: boolean;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
  activities: Activity[];
};
```

Add activities state and subscription inside the hook:

```ts
const [activities, setActivities] = React.useState<Activity[]>([]);
```

Inside the `init` async function, after `unsubscribeSettings`:

```ts
let unsubscribeActivities: (() => void) | undefined;

// Inside init():
unsubscribeActivities = subscribeToUserActivities(activeId, (cloudActivities) => {
  setActivities(cloudActivities);
});
```

Update the cleanup:

```ts
return () => {
  unsubscribeLogs?.();
  unsubscribeSettings?.();
  unsubscribeActivities?.();
};
```

Update the return:

```ts
return { isDevUrl, userId, showWarning, setShowWarning, settings, updateSettings: updateSettingsLocal, activities };
```

Add `subscribeToUserActivities` to the firebase import.

- [ ] **Step 2: Update App.tsx with activity handlers**

Add imports:

```ts
import type { Activity, ActivityType } from '@/types';
import { DEFAULT_ACTIVITY, DEFAULT_ENABLED_ACTIVITIES, DEFAULT_STRIDE_LENGTH } from '@/constants';
import { createMovementActivity, createStepsActivity } from '@utils/activities';
import { saveActivity } from '@utils/firebase';
```

Destructure activities from the hook:

```ts
const { isDevUrl, userId, showWarning, setShowWarning, settings, updateSettings, activities } = useAppInitialization(setRecords, themePreview ? undefined : resolvedUuid ?? undefined);
```

Add derived values:

```ts
const defaultActivity: ActivityType = settings.defaultActivity ?? DEFAULT_ACTIVITY;
const enabledActivities: ActivityType[] = settings.enabledActivities ?? DEFAULT_ENABLED_ACTIVITIES;
const strideLength = settings.strideLength ?? DEFAULT_STRIDE_LENGTH;
```

Add handlers:

```ts
const handleLogMovement = (type: 'walk' | 'run', meters: number, duration: number | undefined, date: string) => {
  if (!userId) return;
  const activity = createMovementActivity({ type, date, meters, duration });
  saveActivity(userId, activity);
};

const handleLogSteps = (count: number, date: string) => {
  if (!userId) return;
  const activity = createStepsActivity({ date, count });
  saveActivity(userId, activity);
};
```

Update the TrackerTab render:

```tsx
{activeTab === TABS.TRACKER && (
  <TrackerTab
    todayTotal={todayTotal}
    handleTap={handleTap}
    sortedRecords={sortedRecords}
    onUpdateRecord={handleUpdateRecord}
    activities={activities}
    todayKey={todayKey}
    floorHeight={floorHeight}
    strideLength={strideLength}
    defaultActivity={defaultActivity}
    enabledActivities={enabledActivities}
    onLogMovement={handleLogMovement}
    onLogSteps={handleLogSteps}
  />
)}
```

- [ ] **Step 3: Type check**

```bash
bun run lint
```

- [ ] **Step 4: Commit**

```
feat: wire App.tsx with activity state, handlers, and subscriptions

useAppInitialization subscribes to activities/ collection. App.tsx
creates movement and step activities via saveActivity(). New props
passed to TrackerTab for multi-activity support.
```

---

## Task 11: StatsTab Update — Universal Distance

**Files:**
- Modify: `src/components/StatsTab.tsx`

- [ ] **Step 1: Update StatsTab Props**

```ts
import type { Activity } from '@/types';
import { calculateTotalMeters, getActivitiesForDate } from '@utils/activities';
import { DEFAULT_STRIDE_LENGTH } from '@/constants';

type Props = {
  records: Record<string, DailyRecord>;
  todayKey: string;
  floorHeight: number;
  activeChallenge: ActiveChallenge;
  onChallengeChange: (ac: ActiveChallenge) => void;
  onManualSync: () => Promise<void>;
  // Multi-activity props
  activities: Activity[];
  strideLength: number;
};
```

- [ ] **Step 2: Add universal distance calculation**

After the existing meter calculations, add:

```ts
// Activity-based meters (walk, run, steps — excludes floors to avoid double-counting)
const activityMeters = React.useMemo(() => {
  const nonFloorActivities = activities.filter((a) => a.type !== 'floor');
  return calculateTotalMeters(nonFloorActivities, { floorHeight, strideLength });
}, [activities, floorHeight, strideLength]);

// Universal distance: floors (from records) + other activities
const universalTotalMeters = totalMeters + activityMeters;
```

Replace `totalMeters` with `universalTotalMeters` in the challenge progress calculation:

```ts
const { remainingMeters, progressPercent } = calculateProgress(universalTotalMeters, challenge.meters);
```

And in the progress display:

```ts
({formatDistance(universalTotalMeters)} / {formatDistance(challenge.meters)})
```

- [ ] **Step 3: Update App.tsx to pass new props to StatsTab**

```tsx
{activeTab === TABS.STATS && (
  <StatsTab
    records={records}
    todayKey={todayKey}
    floorHeight={floorHeight}
    activeChallenge={activeChallenge}
    onChallengeChange={(ac: ActiveChallenge) => updateSettings({ activeChallenge: ac })}
    onManualSync={handleManualSync}
    activities={activities}
    strideLength={strideLength}
  />
)}
```

- [ ] **Step 4: Type check**

```bash
bun run lint
```

- [ ] **Step 5: Commit**

```
feat: add universal distance calculation to StatsTab

Non-floor activities (walk, run, steps) contribute meters to
challenge progress alongside floor-based distance. Universal
distance = (floors * floorHeight) + walkMeters + runMeters +
(steps * strideLength).
```

---

## Task 12: Documentation Updates

**Files:**
- Modify: `HELP.md`
- Modify: `docs/specs/WORKPLAN.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `HELP.md`**

Add a new section after the existing content:

```md
## Multi-Activity Tracking

Floor Tracker now supports multiple activity types beyond floors:

- **Floors** — The original tap-to-count floors (always enabled)
- **Walk** — Log walking distance in meters or kilometers
- **Run** — Log running distance with optional duration
- **Steps** — Log daily step count

### Enabling Activities

Go to **Profile** and check the activities you want to track. Floor is always on.

### Switching Activities

When you have multiple activities enabled, a switcher menu appears at the top of the Tracker screen. Tap it to switch between your enabled activities.

### How Distance Works

All activities contribute to your challenge progress:
- Floors: total floors multiplied by your floor height setting
- Walk/Run: distance logged directly in meters
- Steps: step count multiplied by your stride length setting

### Stride Length

Set your stride length in Profile (Short 0.6m / Average 0.762m / Tall 0.9m). This converts steps into distance for challenge calculations.

### Google Sign-In

You can now sign in with Google in Profile to secure your data. Your existing anonymous data is automatically linked to your Google account.
```

- [ ] **Step 2: Update `docs/specs/WORKPLAN.md`**

Add Phase 7 entry:

```md
## Phase 7: Multi-Activity Tracker (P1)

- [x] Activity type definitions (floor, walk, run, steps)
- [x] Activity constants and UserSettings expansion
- [x] Firestore activity operations (saveActivity, subscribe)
- [x] Google Sign-In with anonymous account linking
- [x] Firestore rules with UID enforcement for activities
- [x] ProfileTab: activity toggles, stride length, Google Sign-In
- [x] WalkRunTracker and StepsTracker components
- [x] ActivitySwitcher kebab menu
- [x] TrackerTab multi-activity wiring
- [x] App.tsx activity state and handlers
- [x] StatsTab universal distance calculation
- [x] Documentation updates
```

- [ ] **Step 3: Update `CLAUDE.md`**

Add under the **Architecture** section:

```md
### Multi-Activity Tracking

Activities are stored in `users/{uid}/activities/{autoId}` Firestore subcollection. The `Activity` type is a discriminated union: `FloorActivity | MovementActivity | StepsActivity`. Factory functions in `src/utils/activities.ts` create typed activities. `calculateTotalMeters()` computes universal distance across all types for challenge progress.

Tracker screen uses a focus-activity model: one activity shown full-screen, others accessible via `ActivitySwitcher` kebab menu. `defaultActivity` and `enabledActivities` configured in Profile settings.

### Authentication

Google Sign-In via Firebase Auth (`signInWithGoogle()` in `firebase.ts`). Existing anonymous users are linked via `linkWithCredential()` — their UID and all Firestore data stay intact. `GoogleSignIn` component in ProfileTab.
```

- [ ] **Step 4: Commit**

```
docs: update HELP.md, WORKPLAN.md, and CLAUDE.md for multi-activity

Add multi-activity tracking documentation, Phase 7 task list,
and architecture notes for Activity types and Google Sign-In.
```

---

## Task 13: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
bun run test
```

All tests must pass including new `activities.test.ts` and `activityFirestore.test.ts`.

- [ ] **Step 2: Type check**

```bash
bun run lint
```

Zero errors.

- [ ] **Step 3: Production build**

```bash
bun run build
```

Build must succeed with no errors.

- [ ] **Step 4: Manual smoke test checklist**

Start dev server (`bun run dev`) and verify:

- [ ] App loads at `/` and redirects to UUID
- [ ] Floor tracker works as before (tap up/down, counter updates)
- [ ] Profile tab shows activity toggles (floor checked and disabled)
- [ ] Enabling "Walk" adds it to enabled activities
- [ ] Switcher appears on Tracker when >1 activity enabled
- [ ] Switching to Walk shows WalkRunTracker
- [ ] Logging a walk creates an activity in Firestore
- [ ] Stats tab shows challenge progress (floors + other activities)
- [ ] Stride length presets work in Profile
- [ ] Google Sign-In button appears in Profile
- [ ] All 6 themes render correctly (no broken layouts)
- [ ] Theme preview URLs still work (e.g., `/deep-mariana`)

- [ ] **Step 5: Commit final verification notes**

```
chore: verify multi-activity P1 — all tests pass, build clean

Full test suite green, tsc clean, production build verified.
Manual smoke test passed for floor tracker, activity switcher,
walk/run/steps logging, stats universal distance, and Google
Sign-In.
```
