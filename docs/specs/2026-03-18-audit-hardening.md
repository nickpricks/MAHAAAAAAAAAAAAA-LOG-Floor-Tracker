# Audit Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Critical, Important, and Minor issues identified in the 2026-03-18 full app audit to bring MAHA LOG to production quality.

**Architecture:** Fixes are grouped into three phases: (1) Critical data-integrity and security fixes, (2) Important reliability and UX fixes, (3) Minor code cleanup. A test framework (Vitest) is introduced first so all subsequent fixes are TDD.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Firebase 12 (Auth + Firestore), Vitest, Tailwind CSS v4, vite-plugin-pwa

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `vitest.config.ts` | Vitest configuration |
| `src/utils/__tests__/appHelpers.test.ts` | Tests for tap update + sort logic |
| `src/utils/__tests__/statsHelpers.test.ts` | Tests for metrics + progress calculations |
| `src/utils/__tests__/date.test.ts` | Tests for date key helpers |
| `src/utils/__tests__/mergeRecords.test.ts` | Tests for cloud merge logic |
| `src/utils/mergeRecords.ts` | Extracted merge logic (pure function) |
| `firestore.rules` | Firestore security rules (version-controlled) |
| `firebase.json` | Firebase project config for rules deployment |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Add vitest dev dep + test script |
| `src/utils/firebase.ts` | Enable offline persistence, remove unused imports, chunk batch writes |
| `src/utils/useAppInitialization.ts` | Use extracted merge function, remove discarded fetch, remove unused import |
| `src/App.tsx` | Add midnight date rollover check |
| `src/components/StatsTab.tsx:43` | Fix `last7Days` useMemo dependency |
| `src/components/ProfileTab.tsx:59` | Fix `as any` cast |
| `src/components/ProfileTab.tsx` | Add `dark:` variants |
| `src/components/TrackerTab.tsx` | Add `dark:` variants, remove unused import |
| `src/components/StatsTab.tsx` | Add `dark:` variants |
| `src/components/NavigationTabs.tsx` | Add `dark:` variants |
| `src/components/OnboardingWarning.tsx` | Add `dark:` variants |
| `src/components/HelpTab.tsx` | Add `dark:` variants |
| `src/main.tsx:5` | Remove unused `registerSW` import |
| `index.html:8` | Hardcode fallback title |
| `.github/workflows/deploy.yml` | Set `VITE_APP_NAME` env var |
| `tsconfig.json` | Enable `strict` mode |
| `docs/SecurityGuide.md` | Update to reflect actual security posture |
| `docs/specs/Audit-TLDR.md` | Update to reflect reopened findings |

---

## Phase 1: Critical Fixes

### Task 1: Set Up Vitest

All subsequent tasks use TDD. This must come first.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install vitest**

```bash
bun add -d vitest
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs**

```bash
bun run test
```

Expected: No test suites found (exit 0 or warning).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json bun.lock
git commit -m "chore: add vitest test framework"
```

---

### Task 2: Fix Merge Logic (C2 — Data Loss Bug)

The current merge in `useAppInitialization.ts:68` uses OR logic that replaces entire records, losing whichever field was higher locally. Extract merge into a pure, testable function.

**Files:**
- Create: `src/utils/mergeRecords.ts`
- Create: `src/utils/__tests__/mergeRecords.test.ts`
- Modify: `src/utils/useAppInitialization.ts:63-73`

- [ ] **Step 1: Write failing tests for merge logic**

Create `src/utils/__tests__/mergeRecords.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mergeCloudIntoLocal } from '../mergeRecords';
import { DailyRecord } from '../../types';

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/utils/__tests__/mergeRecords.test.ts
```

Expected: FAIL — `mergeRecords` module not found.

- [ ] **Step 3: Implement mergeCloudIntoLocal**

Create `src/utils/mergeRecords.ts`:

```typescript
import { DailyRecord } from '../types';

/**
 * Merges cloud records into local state using per-field max strategy.
 * Returns the same reference if nothing changed (avoids unnecessary re-renders).
 */
export const mergeCloudIntoLocal = (
  local: Record<string, DailyRecord>,
  cloud: Record<string, DailyRecord>
): Record<string, DailyRecord> => {
  let changed = false;
  const merged = { ...local };

  for (const [date, cloudRecord] of Object.entries(cloud)) {
    const localRecord = local[date];

    if (!localRecord) {
      merged[date] = cloudRecord;
      changed = true;
      continue;
    }

    const maxUp = Math.max(localRecord.up, cloudRecord.up);
    const maxDown = Math.max(localRecord.down, cloudRecord.down);

    if (maxUp !== localRecord.up || maxDown !== localRecord.down) {
      merged[date] = {
        dateStr: date,
        up: maxUp,
        down: maxDown,
        total: maxUp + maxDown * 0.5,
      };
      changed = true;
    }
  }

  return changed ? merged : local;
};
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
bun run test src/utils/__tests__/mergeRecords.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Wire into useAppInitialization**

In `src/utils/useAppInitialization.ts`, replace lines 63-73:

```typescript
// OLD:
const unsubscribeLogs = subscribeToUserLogs(activeId, (cloudData) => {
  setRecords((prev) => {
    const merged = { ...prev };
    Object.entries(cloudData).forEach(([date, cloudRecord]) => {
      const localRecord = prev[date];
      if (!localRecord || localRecord.up < cloudRecord.up || localRecord.down < cloudRecord.down) {
        merged[date] = cloudRecord;
      }
    });
    return merged;
  });
});

// NEW:
const unsubscribeLogs = subscribeToUserLogs(activeId, (cloudData) => {
  setRecords((prev) => mergeCloudIntoLocal(prev, cloudData));
});
```

Add the import at top:
```typescript
import { mergeCloudIntoLocal } from './mergeRecords';
```

Remove unused import: `calculateTapUpdate` (line 5).

- [ ] **Step 6: Run full test suite + type check**

```bash
bun run test && bun run lint
```

Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/utils/mergeRecords.ts src/utils/__tests__/mergeRecords.test.ts src/utils/useAppInitialization.ts
git commit -m "fix: use per-field max merge to prevent data loss on multi-device sync"
```

---

### Task 3: Fix Discarded Cloud Fetch (C3 — Race Condition)

`initializeFirebaseSession` fetches docs via `getDocs` but the return value is never used. The `onSnapshot` listener fires with the initial snapshot anyway, making `getDocs` redundant. Remove the wasted call.

**Files:**
- Modify: `src/utils/firebase.ts:30-57`
- Modify: `src/utils/useAppInitialization.ts:60`

- [ ] **Step 1: Simplify `initializeFirebaseSession` to auth-only**

In `src/utils/firebase.ts`, replace `initializeFirebaseSession` (lines 30-57):

```typescript
/**
 * Initializes an anonymous Firebase session.
 * Data loading is handled by the onSnapshot real-time listener, not here.
 */
export const initializeFirebaseSession = async (): Promise<void> => {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Firebase Auth Error:", error);
  }
};
```

Remove unused imports from line 7: both `getDoc` and `getDocs` (neither is used after this change). Keep `collection` — it's still used by `syncAllLocalToCloud` and `subscribeToUserLogs`.

- [ ] **Step 2: Update call site**

In `src/utils/useAppInitialization.ts`, line 60 — the call already ignores the return value, so just update the import signature if it changed. The call `initializeFirebaseSession(activeId)` becomes `initializeFirebaseSession()` since the userId param is no longer needed for data fetching.

Since the `userId` param was only used for the now-removed `getDocs` path, the call simplifies:

```typescript
// Line 60: was
initializeFirebaseSession(activeId);
// becomes
initializeFirebaseSession();
```

- [ ] **Step 3: Type check**

```bash
bun run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/utils/firebase.ts src/utils/useAppInitialization.ts
git commit -m "fix: remove redundant getDocs fetch, rely on onSnapshot for initial data"
```

---

### Task 4: Add Firestore Security Rules (C1)

The app uses the URL UUID as the Firestore document path, decoupled from Firebase `user.uid`. This means Firestore rules can't enforce "only write your own data" via auth UID matching. The pragmatic fix: version-control the rules file and document the actual security model. A full fix (switching to `user.uid`) would require a data migration and is tracked separately.

**Files:**
- Create: `firestore.rules`
- Create: `firebase.json`
- Modify: `docs/SecurityGuide.md`

- [ ] **Step 1: Create firestore.rules**

Create `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // User logs: authenticated users can read/write their own UUID path
    match /users/{userId}/logs/{logId} {
      allow read, write: if request.auth != null;
    }

    // User settings: authenticated users can read/write their own UUID path
    match /users/{userId}/settings/{settingId} {
      allow read, write: if request.auth != null;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

> **NOTE:** These rules require authentication but do NOT enforce `request.auth.uid == userId` because the app uses a local UUID (not Firebase UID) for document paths. This is a known limitation — see SecurityGuide.md. A full fix requires migrating to Firebase UID-based paths.

- [ ] **Step 2: Create firebase.json**

Create `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

- [ ] **Step 3: Update SecurityGuide.md**

In `docs/SecurityGuide.md`, update section 2 to be honest about the current state:

Replace lines 16-19:
```markdown
### 2. Data Integrity (Firestore Rules)
All data security is handled at the database level. Our Firestore Security Rules (defined in the Firebase Console) ensure:
*   **Write Restriction:** A user can only write to a document if the `userId` in the path matches their authenticated session.
*   **Read Restriction:** Users can only query their own floor logs.
*   **Validation:** Data must conform to the `DailyRecord` schema.
```

With:
```markdown
### 2. Data Integrity (Firestore Rules)
Security rules are version-controlled in `firestore.rules` and should be deployed via `firebase deploy --only firestore:rules`.

**Current posture (v0.0.3):**
*   **Authentication Required:** All reads/writes require an anonymous Firebase session (`request.auth != null`).
*   **Known Limitation:** Document paths use a local UUID from the URL, NOT `request.auth.uid`. This means an authenticated user could theoretically read/write another user's data if they know the UUID. The UUID is a 128-bit random value (effectively unguessable), but this is security-by-obscurity, not enforcement.

**Future hardening (tracked in WORKPLAN):**
*   Migrate document paths to use `request.auth.uid` and enforce `request.auth.uid == userId` in rules.
*   Add schema validation rules for `DailyRecord` fields.
```

- [ ] **Step 4: Commit**

```bash
git add firestore.rules firebase.json docs/SecurityGuide.md
git commit -m "security: add version-controlled Firestore rules, document actual security posture"
```

---

## Phase 2: Important Fixes

> **Out of scope:** I8 (Firebase bundle size / code splitting) is deferred to Phase 4. It's an optimization, not a correctness issue.

### Task 5: Chunk Batch Writes (I1)

`syncAllLocalToCloud` will fail silently for users with 500+ days of history due to Firestore's batch limit.

**Files:**
- Modify: `src/utils/firebase.ts:80-95`
- Create: `src/utils/__tests__/firebase.test.ts` (optional — hard to unit test Firebase calls without mocking, skip for now)

- [ ] **Step 1: Replace batch logic with chunked batches**

In `src/utils/firebase.ts`, replace `syncAllLocalToCloud` (lines 80-95):

```typescript
const FIRESTORE_BATCH_LIMIT = 499;

export async function syncAllLocalToCloud(uuid: string, records: Record<string, DailyRecord>) {
  if (!uuid || Object.keys(records).length === 0) return;
  setSyncStatus('syncing');
  try {
    const entries = Object.values(records);
    for (let i = 0; i < entries.length; i += FIRESTORE_BATCH_LIMIT) {
      const chunk = entries.slice(i, i + FIRESTORE_BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach(record => {
        const recordRef = doc(db, `users/${uuid}/logs`, record.dateStr);
        batch.set(recordRef, record, { merge: true });
      });
      await batch.commit();
    }
    setSyncStatus('synced');
  } catch (error) {
    console.error("Firebase Batch Sync Error:", error);
    setSyncStatus('error');
  }
}
```

- [ ] **Step 2: Type check**

```bash
bun run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/firebase.ts
git commit -m "fix: chunk batch writes to respect Firestore 500-op limit"
```

---

### Task 6: Enable Firestore Offline Persistence (I2)

The code comments claim offline resilience, but `getFirestore` does not enable it by default on web.

**Files:**
- Modify: `src/utils/firebase.ts:20-22`

- [ ] **Step 1: Replace `getFirestore` with persistent cache**

In `src/utils/firebase.ts`, replace lines 20-22:

```typescript
// OLD:
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// NEW:
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
```

Remove the `getFirestore` import from the existing import line (line 7). Add `initializeFirestore`, `persistentLocalCache`, `persistentMultipleTabManager` to the import.

- [ ] **Step 2: Type check + dev server smoke test**

```bash
bun run lint && bun run build
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/firebase.ts
git commit -m "fix: enable Firestore persistent offline cache for true offline-first"
```

---

### Task 7: Fix Dark Mode (I3)

All child components use hardcoded light-mode colors. Add `dark:` variants to every component.

**Files:**
- Modify: `src/components/TrackerTab.tsx`
- Modify: `src/components/StatsTab.tsx`
- Modify: `src/components/ProfileTab.tsx`
- Modify: `src/components/NavigationTabs.tsx`
- Modify: `src/components/OnboardingWarning.tsx`
- Modify: `src/components/HelpTab.tsx`

- [ ] **Step 1: TrackerTab dark mode**

Key classes to update in `TrackerTab.tsx`:
- `bg-white` → `bg-white dark:bg-zinc-900`
- `border-zinc-200` → `border-zinc-200 dark:border-zinc-800`
- `text-zinc-800` → `text-zinc-800 dark:text-zinc-100`
- `text-zinc-700` → `text-zinc-700 dark:text-zinc-300`
- `text-zinc-500` → `text-zinc-500 dark:text-zinc-400`
- `text-zinc-400` → `text-zinc-400 dark:text-zinc-500`
- `bg-zinc-50` → `bg-zinc-50 dark:bg-zinc-800`
- `hover:bg-zinc-50` → `hover:bg-zinc-50 dark:hover:bg-zinc-800`
- `divide-zinc-100` → `divide-zinc-100 dark:divide-zinc-800`

Remove unused `METERS_PER_FLOOR` import (M6).

- [ ] **Step 2: StatsTab dark mode**

Same pattern as TrackerTab. Key additions:
- Card backgrounds: `bg-white dark:bg-zinc-900`
- Stats rows: `bg-zinc-50 dark:bg-zinc-800/50`
- Borders: `border-zinc-200 dark:border-zinc-800`
- Info modal: `bg-white/90 dark:bg-zinc-900/90`
- Colored info cards: keep the colored backgrounds (they work in both modes)

- [ ] **Step 3: ProfileTab dark mode**

Same pattern. Also fix the `as any` cast on line 59:

```typescript
// OLD:
onClick={() => updateSettings({ theme: t.id as any })}

// NEW:
onClick={() => updateSettings({ theme: t.id })}
```

This requires widening the `themes` array type. Change line 16:
```typescript
const themes: { id: UserSettings['theme'], name: string, icon: typeof Sun }[] = [
```

This gives `t.id` the correct type `'light' | 'dark' | 'system' | undefined`, and `updateSettings` accepts `UserSettings` which has `theme?: 'light' | 'dark' | 'system'`. No `as any` needed.

Remove unused `TabType` import (M8).

- [ ] **Step 4: NavigationTabs dark mode**

- Tab bar: `bg-white dark:bg-zinc-900`
- Active tab: `bg-zinc-900 dark:bg-white text-white dark:text-zinc-900`
- Inactive tab: `text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800`
- Sync icon container: `bg-white dark:bg-zinc-900`

- [ ] **Step 5: OnboardingWarning dark mode**

The red warning banner works in both modes. Just add:
- `bg-red-100 dark:bg-red-900/30`
- `border-red-200 dark:border-red-800`
- `text-red-800 dark:text-red-200`

- [ ] **Step 6: Type check + visual verification**

```bash
bun run lint
```

Then manually test: `bun run dev`, go to Profile, select Dark mode. All components should have dark backgrounds.

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "fix: add dark mode support to all components"
```

---

### Task 8: Fix Stale Date Keys (I4 + I5)

`todayKey` and `last7Days` never refresh past midnight.

**Files:**
- Modify: `src/App.tsx:54`
- Modify: `src/components/StatsTab.tsx:43`
- Create: `src/utils/__tests__/date.test.ts`

- [ ] **Step 1: Write date util tests**

Create `src/utils/__tests__/date.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getTodayKey, getLast7DaysKeys, getDayName, getFormattedDate } from '../date';

describe('getTodayKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getLast7DaysKeys', () => {
  it('returns 7 keys', () => {
    expect(getLast7DaysKeys()).toHaveLength(7);
  });

  it('starts with today', () => {
    const keys = getLast7DaysKeys();
    expect(keys[0]).toBe(getTodayKey());
  });
});

describe('getDayName', () => {
  it('returns a weekday name', () => {
    const name = getDayName('2026-03-18');
    expect(name).toBe('Wednesday');
  });
});

describe('getFormattedDate', () => {
  it('returns DD/MM/YYYY', () => {
    expect(getFormattedDate('2026-03-18')).toBe('18/03/2026');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
bun run test src/utils/__tests__/date.test.ts
```

Expected: PASS.

- [ ] **Step 3: Add midnight rollover to App.tsx**

In `src/App.tsx`, after line 54 (`const todayKey = getTodayKey()`), add a `useEffect` that checks for date change every 60 seconds:

```typescript
const [todayKey, setTodayKey] = React.useState(getTodayKey);

React.useEffect(() => {
  const interval = setInterval(() => {
    const newKey = getTodayKey();
    if (newKey !== todayKey) {
      setTodayKey(newKey);
    }
  }, 60_000);
  return () => clearInterval(interval);
}, [todayKey]);
```

Remove the old `const todayKey = getTodayKey()` line.

- [ ] **Step 4: Fix StatsTab `last7Days` dependency**

In `src/components/StatsTab.tsx:43`, change:

```typescript
// OLD:
const last7Days = React.useMemo(() => getLast7DaysKeys(), []);

// NEW:
const last7Days = React.useMemo(() => getLast7DaysKeys(), [todayKey]);
```

- [ ] **Step 5: Type check**

```bash
bun run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/StatsTab.tsx src/utils/__tests__/date.test.ts
git commit -m "fix: refresh todayKey and last7Days on midnight rollover"
```

---

### Task 9: Add Core Utility Tests (I6)

Cover `appHelpers.ts` and `statsHelpers.ts` with unit tests.

**Files:**
- Create: `src/utils/__tests__/appHelpers.test.ts`
- Create: `src/utils/__tests__/statsHelpers.test.ts`

- [ ] **Step 1: Write appHelpers tests**

Create `src/utils/__tests__/appHelpers.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { calculateTapUpdate, sortRecordsDesc } from '../appHelpers';

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
```

- [ ] **Step 2: Write statsHelpers tests**

Create `src/utils/__tests__/statsHelpers.test.ts`:

```typescript
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
    expect(result.monthFloors).toBe(18); // only March records
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
```

- [ ] **Step 3: Run all tests**

```bash
bun run test
```

Expected: All suites pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/__tests__/
git commit -m "test: add unit tests for appHelpers, statsHelpers, and date utils"
```

---

## Phase 3: Minor Cleanup

### Task 10: Code Cleanup Sweep

Fix all minor issues in one pass.

**Files:**
- Modify: `src/main.tsx:5` — remove unused `registerSW` import
- Modify: `src/utils/firebase.ts:7` — remove unused `getDoc` import (if not already removed in Task 3)
- Modify: `src/utils/firebase.ts:33` — remove unused `user` variable
- Modify: `index.html:8` — hardcode fallback title
- Modify: `.github/workflows/deploy.yml` — add `VITE_APP_NAME` env
- Modify: `package.json:2` — rename from `react-example`
- Modify: `tsconfig.json` — enable `strict: true`

- [ ] **Step 1: Fix unused imports**

`src/main.tsx` — delete line 5: `import { registerSW } from 'virtual:pwa-register';`

`src/utils/firebase.ts` — remove `getDoc` from imports (line 7). Remove `const user = userCredential.user;` (line 33, if still present after Task 3).

`src/components/TrackerTab.tsx` — remove `METERS_PER_FLOOR` from import on line 5 (if not already done in Task 7).

- [ ] **Step 2: Fix index.html title**

In `index.html:8`, change:
```html
<title>%VITE_APP_NAME%</title>
```
to:
```html
<title>Floor Tracker</title>
```

The env var substitution only works at build time when `.env` is present. A hardcoded default is more reliable.

- [ ] **Step 3: Set VITE_APP_NAME in CI**

In `.github/workflows/deploy.yml`, add an env var to the build step (after line 29):

```yaml
      - run: bun run build
        env:
          VITE_APP_NAME: "Floor Tracker"
          VITE_APP_VERSION: "v0.0.3"
```

- [ ] **Step 4: Rename package**

In `package.json:2`, change:
```json
"name": "react-example"
```
to:
```json
"name": "maha-log-floor-tracker"
```

- [ ] **Step 5: Enable strict TypeScript**

In `tsconfig.json`, add after `"target"` line:
```json
"strict": true,
```

Then run `bun run lint` and fix any new type errors. Common fixes:
- Add explicit return types where implicit `any` was used
- Add null checks where needed

- [ ] **Step 6: Run full check**

```bash
bun run test && bun run lint && bun run build
```

Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/main.tsx src/utils/firebase.ts src/components/TrackerTab.tsx index.html .github/workflows/deploy.yml package.json tsconfig.json
git commit -m "chore: code cleanup — unused imports, strict TS, package rename, CI env vars"
```

---

### Task 11: Update Documentation

**Files:**
- Modify: `docs/specs/Audit-TLDR.md`
- Modify: `docs/specs/WORKPLAN.md`

- [ ] **Step 1: Update Audit-TLDR to reflect reopened items**

The current Audit-TLDR says merge logic is resolved. Update to reflect that C2 (merge) and C3 (fetch) were bugs found in the "resolved" code, now actually fixed.

- [ ] **Step 2: Update WORKPLAN with completed items**

Mark all completed tasks from this plan in the WORKPLAN.

- [ ] **Step 3: Commit**

```bash
git add docs/specs/
git commit -m "docs: update audit findings and workplan with hardening results"
```
