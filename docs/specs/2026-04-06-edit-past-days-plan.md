# Edit Past Days & Delete Logs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to add/edit floors for past days and delete day entries with undo.

**Architecture:** Add `editingDate` and `pendingDelete` state to MainApp. Refactor `calculateTapUpdate` to accept a target date. TrackerTab becomes interactive — log rows are tappable to enter edit mode, and a date picker allows adding missing days. Delete uses an optimistic removal with a 10-second undo toast.

**Tech Stack:** React 19, TypeScript, Framer Motion, Firestore (`deleteDoc`), Vitest, Lucide icons

**Spec:** `docs/specs/2026-04-06-edit-past-days-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/appHelpers.ts` | Modify | Add `targetDate` param to `calculateTapUpdate` |
| `src/utils/__tests__/appHelpers.test.ts` | Modify | Tests for targeted date tap updates |
| `src/utils/firebase.ts` | Modify | Add `deleteRecordFromCloud` |
| `src/utils/date.ts` | Modify | Add `getShortDate` formatter for edit mode header |
| `src/utils/__tests__/date.test.ts` | Modify | Test for `getShortDate` |
| `src/components/TrackerTab.tsx` | Modify | Tappable rows, edit mode header, delete button, "Add Past Day" |
| `src/App.tsx` | Modify | `editingDate`, `pendingDelete` state, undo toast, new handlers |

---

### Task 1: Refactor `calculateTapUpdate` to accept a target date

**Files:**
- Modify: `src/utils/appHelpers.ts:13-40`
- Modify: `src/utils/__tests__/appHelpers.test.ts`
- Modify: `src/App.tsx:102-103`

- [ ] **Step 1: Write failing tests for targeted date**

Add to `src/utils/__tests__/appHelpers.test.ts` inside the existing `describe('calculateTapUpdate')` block:

```ts
it('targets a specific date when targetDate is provided', () => {
  const result = calculateTapUpdate({}, 'up', null, '2026-03-20');
  expect(result['2026-03-20']).toBeDefined();
  expect(result['2026-03-20'].up).toBe(1);
  expect(result['2026-03-20'].down).toBe(0);
  expect(result['2026-03-20'].total).toBe(1);
  expect(result['2026-03-20'].dateStr).toBe('2026-03-20');
});

it('increments existing record for a past date', () => {
  const existing = {
    '2026-03-20': { dateStr: '2026-03-20', up: 3, down: 2, total: 4 },
  };
  const result = calculateTapUpdate(existing, 'down', null, '2026-03-20');
  expect(result['2026-03-20'].up).toBe(3);
  expect(result['2026-03-20'].down).toBe(3);
  expect(result['2026-03-20'].total).toBe(3 + 3 * 0.5);
});

it('defaults to today when targetDate is undefined', () => {
  const result = calculateTapUpdate({}, 'up', null);
  const keys = Object.keys(result);
  expect(keys).toHaveLength(1);
  // Should be today's key
  const todayKey = keys[0];
  expect(todayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(result[todayKey].up).toBe(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/utils/__tests__/appHelpers.test.ts`
Expected: FAIL — `calculateTapUpdate` doesn't accept a 4th argument yet, but the existing tests still pass. The new tests fail because the function ignores the target date.

- [ ] **Step 3: Update `calculateTapUpdate` signature and implementation**

In `src/utils/appHelpers.ts`, replace the entire `calculateTapUpdate` function:

```ts
export const calculateTapUpdate = (
  prev: Record<string, DailyRecord>,
  type: 'up' | 'down',
  userId: string | null,
  targetDate?: string
): Record<string, DailyRecord> => {
  const dateKey = targetDate ?? getTodayKey();
  const existing = prev[dateKey] || { dateStr: dateKey, up: 0, down: 0, total: 0 };
  const newUp = type === 'up' ? existing.up + 1 : existing.up;
  const newDown = type === 'down' ? existing.down + 1 : existing.down;
  const newTotal = calculateTotal(newUp, newDown);

  const updatedRecord = {
    ...existing,
    up: newUp,
    down: newDown,
    total: newTotal
  };

  // Fire and forget sync to cloud
  if (userId) {
    syncRecordToCloud(userId, dateKey, updatedRecord);
  }

  return {
    ...prev,
    [dateKey]: updatedRecord
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/utils/__tests__/appHelpers.test.ts`
Expected: All tests PASS (existing + new).

- [ ] **Step 5: Update call site in App.tsx**

No changes needed yet — the `targetDate` param is optional and defaults to today. The call in `App.tsx:102-103` continues working as-is. We'll pass `editingDate` in Task 5.

- [ ] **Step 6: Run type check**

Run: `bun run lint`
Expected: No errors.

- [ ] **Step 7: Commit**

```
feat: make calculateTapUpdate accept optional target date
```

---

### Task 2: Add `deleteRecordFromCloud` to Firebase utils

**Files:**
- Modify: `src/utils/firebase.ts`

- [ ] **Step 1: Add `deleteRecordFromCloud` function**

In `src/utils/firebase.ts`, add after the `syncRecordToCloud` function (after line 58):

```ts
/**
 * Fire-and-forget deletion of a single day's record from the cloud database.
 */
export const deleteRecordFromCloud = async (userId: string, dateKey: string) => {
  if (!userId) return;
  setSyncStatus('syncing');
  try {
    const recordRef = doc(db, `users/${userId}/logs`, dateKey);
    await deleteDoc(recordRef);
    setSyncStatus('synced');
  } catch (error) {
    console.error("Firebase Delete Error:", error);
    setSyncStatus('error');
  }
};
```

Note: `deleteDoc` is already imported on line 8.

- [ ] **Step 2: Run type check**

Run: `bun run lint`
Expected: No errors.

- [ ] **Step 3: Commit**

```
feat: add deleteRecordFromCloud firebase utility
```

---

### Task 3: Add `getShortDate` formatter

**Files:**
- Modify: `src/utils/date.ts`
- Modify: `src/utils/__tests__/date.test.ts`

- [ ] **Step 1: Write failing test**

Add to `src/utils/__tests__/date.test.ts`:

```ts
import { getShortDate } from '@utils/date';

describe('getShortDate', () => {
  it('formats a date string as "Wed, Apr 2"', () => {
    expect(getShortDate('2026-04-02')).toBe('Thu, Apr 2');
  });

  it('formats another date correctly', () => {
    expect(getShortDate('2026-01-15')).toBe('Thu, Jan 15');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/utils/__tests__/date.test.ts`
Expected: FAIL — `getShortDate` is not exported.

- [ ] **Step 3: Add `getShortDate` to date.ts**

Append to `src/utils/date.ts`:

```ts
/**
 * Formats a YYYY-MM-DD string as a short display like "Wed, Apr 2".
 * Used for the edit mode header in TrackerTab.
 */
export const getShortDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/utils/__tests__/date.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```
feat: add getShortDate date formatter
```

---

### Task 4: Update TrackerTab with edit mode UI

**Files:**
- Modify: `src/components/TrackerTab.tsx`

This is the largest task. TrackerTab gets new props, tappable log rows, an edit mode header, delete button, and "Add Past Day" date picker.

- [ ] **Step 1: Update the Props type**

Replace the `Props` type at the top of `TrackerTab.tsx`:

```ts
type Props = {
  displayTotal: number;
  editingDate: string | null;
  handleTap: (type: 'up' | 'down') => void;
  onSelectDate: (dateStr: string | null) => void;
  onDelete: () => void;
  sortedRecords: DailyRecord[];
};
```

Update `TrackerVariantProps` to include edit mode info:

```ts
type TrackerVariantProps = {
  displayTotal: number;
  editingDate: string | null;
  onBackToToday: () => void;
  onDelete: () => void;
  handleTap: (type: 'up' | 'down') => void;
  counterControls: ReturnType<typeof useAnimationControls>;
  upControls: ReturnType<typeof useAnimationControls>;
  downControls: ReturnType<typeof useAnimationControls>;
  fontSize: string;
};
```

- [ ] **Step 2: Add imports**

Add to the existing imports at the top:

```ts
import { Trash2, RotateCcw } from 'lucide-react';
import { getShortDate, getTodayKey } from '@utils/date';
```

- [ ] **Step 3: Update DefaultTracker to show edit mode header**

Replace the `DefaultTracker` function. The key changes are:
- Props destructuring includes `editingDate`, `onBackToToday`, `onDelete`
- Header text switches between "Today's Altitude" and the formatted date
- "Back to Today" and delete buttons appear in edit mode

```ts
function DefaultTracker({ displayTotal, editingDate, onBackToToday, onDelete, handleTap, counterControls, upControls, downControls, fontSize, themeId }: TrackerVariantProps & { themeId: ThemeId }) {
  const { upRef, downRef, triggerGlow } = useClickGlow();
  const icons = THEME_ICONS[themeId] || THEME_ICONS['summit-instrument'];
  const UpIcon = icons.up;
  const DownIcon = icons.down;

  const onTap = (type: 'up' | 'down') => {
    navigator.vibrate?.(20);
    counterControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.2, ease: 'easeOut' } });
    const btnControls = type === 'up' ? upControls : downControls;
    btnControls.start({ scale: [1, 0.92, 1], transition: { duration: 0.25 } });
    triggerGlow(type === 'up' ? upRef : downRef);
    handleTap(type);
  };

  return (
    <div className="relative bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
      {/* Decorative accent rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
        <div className="w-[500px] h-[500px] rounded-full border border-accent" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-accent" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-accent" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-accent" />
      </div>
      <div className="relative z-10 flex flex-col items-center w-full">
        {editingDate ? (
          <div className="flex items-center gap-2 mb-6">
            <span className="font-display text-[10px] font-bold tracking-[0.3em] uppercase bg-accent/15 text-accent px-3 py-1 rounded-full">
              {getShortDate(editingDate)}
            </span>
            <button onClick={onBackToToday} className="text-fg-muted hover:text-fg transition-colors" title="Back to Today">
              <RotateCcw size={14} />
            </button>
            <button onClick={onDelete} className="text-fg-muted hover:text-red-400 transition-colors" title="Delete this day">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
            Today&rsquo;s Altitude
          </div>
        )}
        <motion.button
          ref={upRef}
          onClick={() => onTap('up')}
          animate={upControls}
          className="btn-theme-up btn-uniform w-16 h-16 rounded-full flex items-center justify-center text-fg-muted"
        >
          <UpIcon size={26} strokeWidth={2.5} />
        </motion.button>
        <div className="h-40 flex items-center justify-center my-3">
          <motion.div
            animate={counterControls}
            style={{ fontSize }}
            className="altitude-readout altitude-glow leading-none font-bold text-fg-heading transition-all duration-300"
          >
            {displayTotal}
          </motion.div>
        </div>
        <motion.button
          ref={downRef}
          onClick={() => onTap('down')}
          animate={downControls}
          className="btn-theme-down btn-uniform w-16 h-16 rounded-full flex items-center justify-center text-fg-muted"
        >
          <DownIcon size={26} strokeWidth={2.5} />
        </motion.button>
        <div className="mt-6 font-mono text-[10px] text-fg-subtle tracking-widest uppercase">floors</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update ElevatorTracker similarly**

Replace the `ElevatorTracker` function with edit mode support:

```ts
function ElevatorTracker({ displayTotal, editingDate, onBackToToday, onDelete, handleTap, counterControls, upControls, downControls, fontSize }: TrackerVariantProps) {
  const { upRef, downRef, triggerGlow } = useClickGlow();

  const onTap = (type: 'up' | 'down') => {
    navigator.vibrate?.(20);
    counterControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.2, ease: 'easeOut' } });
    const btnControls = type === 'up' ? upControls : downControls;
    btnControls.start({ scale: [1, 0.92, 1], transition: { duration: 0.25 } });
    triggerGlow(type === 'up' ? upRef : downRef);
    handleTap(type);
  };

  return (
    <div className="relative bg-surface-card p-8 rounded-2xl shadow-lg border border-line flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-topo pointer-events-none" />
      <div className="elevator-seam" />
      <div className="relative z-10 flex flex-col items-center w-full">
        {editingDate ? (
          <div className="flex items-center gap-2 mb-6">
            <span className="font-display text-[10px] font-bold tracking-[0.3em] uppercase bg-accent/15 text-accent px-3 py-1 rounded-full">
              {getShortDate(editingDate)}
            </span>
            <button onClick={onBackToToday} className="text-fg-muted hover:text-fg transition-colors" title="Back to Today">
              <RotateCcw size={14} />
            </button>
            <button onClick={onDelete} className="text-fg-muted hover:text-red-400 transition-colors" title="Delete this day">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
            Floor Indicator
          </div>
        )}
        <motion.button
          ref={upRef}
          onClick={() => onTap('up')}
          animate={upControls}
          className="btn-elevator btn-elevator-up w-14 h-14 flex items-center justify-center text-accent"
        >
          <ChevronUp size={24} strokeWidth={2.5} />
        </motion.button>
        <div className="h-40 flex items-center justify-center my-3">
          <motion.div
            animate={counterControls}
            style={{ fontSize }}
            className="altitude-readout altitude-glow leading-none font-bold text-accent transition-all duration-300"
          >
            {displayTotal}
          </motion.div>
        </div>
        <motion.button
          ref={downRef}
          onClick={() => onTap('down')}
          animate={downControls}
          className="btn-elevator btn-elevator-down w-14 h-14 flex items-center justify-center text-accent-secondary"
        >
          <ChevronDown size={24} strokeWidth={2.5} />
        </motion.button>
        <div className="mt-6 font-mono text-[10px] text-fg-subtle tracking-widest uppercase">floors</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update the main TrackerTab component**

Replace the `TrackerTab` export default function:

```ts
export default function TrackerTab({ displayTotal, editingDate, handleTap, onSelectDate, onDelete, sortedRecords }: Props) {
  const counterControls = useAnimationControls();
  const upControls = useAnimationControls();
  const downControls = useAnimationControls();
  const themeId = useActiveThemeId();
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const { MIN_FONT_REM, MAX_FONT_REM, MAX_SCALE_FLOORS } = TRACKER_UI;
  const fontSize = `${MIN_FONT_REM + (MAX_FONT_REM - MIN_FONT_REM) * (Math.min(displayTotal, MAX_SCALE_FLOORS) / MAX_SCALE_FLOORS)}rem`;

  const onBackToToday = () => onSelectDate(null);

  const trackerProps = {
    displayTotal,
    editingDate,
    onBackToToday,
    onDelete,
    handleTap,
    counterControls,
    upControls,
    downControls,
    fontSize,
  };

  const handleAddPastDay = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDatePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // YYYY-MM-DD
    if (value) {
      onSelectDate(value);
    }
    e.target.value = ''; // reset so same date can be re-picked
  };

  // Get today's key for comparison (to normalize tapping today's row)
  const todayStr = getTodayKey();

  return (
    <>
      {themeId === 'night-city-elevator'
        ? <ElevatorTracker {...trackerProps} />
        : <DefaultTracker {...trackerProps} themeId={themeId} />
      }

      <div className="w-full max-w-sm">
        <h2 className="font-display text-sm font-bold text-fg-muted mb-4 px-2 tracking-wide uppercase">Log</h2>
        <div className="bg-surface-card rounded-2xl shadow-sm border border-line overflow-hidden">
          {sortedRecords.length === 0 && (
            <div className="p-6 text-center text-fg-subtle text-sm font-mono">No entries yet.</div>
          )}
          {sortedRecords.length !== 0 && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-raised border-b border-line text-[10px] uppercase tracking-wider text-fg-muted">
                  <th className="p-4 font-semibold font-display">Day</th>
                  <th className="p-4 font-semibold font-display">Date</th>
                  <th className="p-4 font-semibold font-display text-right">Floors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {sortedRecords.map((record) => {
                  const isActive = editingDate === record.dateStr;
                  return (
                    <tr
                      key={record.dateStr}
                      onClick={() => onSelectDate(record.dateStr === todayStr ? null : record.dateStr)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-accent/10 border-l-2 border-l-accent'
                          : 'hover:bg-surface-hover'
                      }`}
                    >
                      <td className="p-4 text-sm font-medium text-fg">{getDayName(record.dateStr)}</td>
                      <td className="p-4 text-sm text-fg-muted font-mono">{getFormattedDate(record.dateStr)}</td>
                      <td className="p-4 text-base font-bold text-accent text-right font-mono tabular-nums">{record.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Past Day */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleAddPastDay}
            className="text-xs text-fg-muted hover:text-accent transition-colors font-mono tracking-wide"
          >
            + Add Past Day
          </button>
          <input
            ref={dateInputRef}
            type="date"
            max={getTodayKey()}
            onChange={handleDatePicked}
            className="sr-only"
            tabIndex={-1}
            aria-label="Pick a past date"
          />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Run type check**

Run: `bun run lint`
Expected: Errors in `App.tsx` because the props changed — that's expected. TrackerTab itself should be clean.

- [ ] **Step 7: Commit (will be amended in Task 5 when App.tsx is updated)**

Do not commit yet — wait for Task 5 which wires everything together.

---

### Task 5: Wire edit mode and undo toast in MainApp

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports**

Add to `App.tsx` imports:

```ts
import { AnimatePresence, motion } from 'motion/react';
import { deleteRecordFromCloud } from '@utils/firebase';
import { getShortDate } from '@utils/date';
```

Note: `motion` may already be available via the existing dep. `AnimatePresence` is new.

- [ ] **Step 2: Add `PendingDelete` type and new state**

Inside `MainApp`, after the existing state declarations (around line 34), add:

```ts
const [editingDate, setEditingDate] = React.useState<string | null>(null);
const [pendingDelete, setPendingDelete] = React.useState<{
  dateKey: string;
  record: DailyRecord;
  timeoutId: number;
} | null>(null);
```

- [ ] **Step 3: Add helper to commit a pending delete**

After the state declarations, add:

```ts
const commitPendingDelete = React.useCallback((pd: { dateKey: string; record: DailyRecord; timeoutId: number }) => {
  clearTimeout(pd.timeoutId);
  if (userId) {
    deleteRecordFromCloud(userId, pd.dateKey);
  }
  setPendingDelete(null);
}, [userId]);
```

- [ ] **Step 4: Update `handleTap` to pass editingDate**

Replace the existing `handleTap`:

```ts
const handleTap = (type: 'up' | 'down') => {
  setRecords((prev) => calculateTapUpdate(prev, type, userId, editingDate ?? undefined));
};
```

- [ ] **Step 5: Add `handleSelectDate`**

```ts
const handleSelectDate = (dateStr: string | null) => {
  setEditingDate(dateStr);
  // If selecting a date that doesn't exist yet, create a blank record
  if (dateStr && !records[dateStr]) {
    setRecords((prev) => ({
      ...prev,
      [dateStr]: { dateStr, up: 0, down: 0, total: 0 },
    }));
  }
};
```

- [ ] **Step 6: Add `handleDelete`**

```ts
const handleDelete = () => {
  if (!editingDate) return;
  const dateKey = editingDate;
  const record = records[dateKey];
  if (!record) return;

  // If there's already a pending delete, commit it first
  if (pendingDelete) {
    commitPendingDelete(pendingDelete);
  }

  // Optimistically remove from state
  setRecords((prev) => {
    const next = { ...prev };
    delete next[dateKey];
    return next;
  });

  // Exit edit mode
  setEditingDate(null);

  // Start undo timer
  const timeoutId = window.setTimeout(() => {
    if (userId) {
      deleteRecordFromCloud(userId, dateKey);
    }
    setPendingDelete(null);
  }, 10_000);

  setPendingDelete({ dateKey, record, timeoutId });
};
```

- [ ] **Step 7: Add `handleUndo`**

```ts
const handleUndo = () => {
  if (!pendingDelete) return;
  clearTimeout(pendingDelete.timeoutId);
  // Restore the record
  setRecords((prev) => ({
    ...prev,
    [pendingDelete.dateKey]: pendingDelete.record,
  }));
  setPendingDelete(null);
};
```

- [ ] **Step 8: Clear edit mode on tab switch**

Update the `setActiveTab` usage. Replace the NavigationTabs line:

```ts
<NavigationTabs activeTab={activeTab} setActiveTab={(tab) => { setEditingDate(null); setActiveTab(tab); }} syncStatus={syncStatus} />
```

- [ ] **Step 9: Commit pending delete on tab switch**

Add an effect after the state declarations:

```ts
React.useEffect(() => {
  if (activeTab !== TABS.TRACKER && pendingDelete) {
    commitPendingDelete(pendingDelete);
  }
}, [activeTab, pendingDelete, commitPendingDelete]);
```

- [ ] **Step 10: Update `displayTotal` derivation**

Replace the existing `todayTotal` line:

```ts
const displayTotal = editingDate
  ? (records[editingDate]?.total || 0)
  : (records[todayKey]?.total || 0);
```

- [ ] **Step 11: Update TrackerTab props in the render**

Replace the TrackerTab JSX:

```tsx
<TrackerTab
  displayTotal={displayTotal}
  editingDate={editingDate}
  handleTap={handleTap}
  onSelectDate={handleSelectDate}
  onDelete={handleDelete}
  sortedRecords={sortedRecords}
/>
```

- [ ] **Step 12: Add the undo toast**

Add just before the closing `</div>` of the main wrapper (before the dev mode section, around line 210):

```tsx
{/* Undo Delete Toast */}
<AnimatePresence>
  {pendingDelete && (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-card border border-line rounded-full px-5 py-3 shadow-lg flex items-center gap-3 text-sm"
    >
      <span className="text-fg">
        Deleted <span className="font-semibold">{getShortDate(pendingDelete.dateKey)}</span>
      </span>
      <button
        onClick={handleUndo}
        className="font-bold text-accent hover:text-accent/80 transition-colors"
      >
        Undo
      </button>
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 13: Run type check**

Run: `bun run lint`
Expected: No errors.

- [ ] **Step 14: Run all tests**

Run: `bun run test`
Expected: All tests PASS.

- [ ] **Step 15: Commit**

```
feat: add edit past days, delete with undo toast, add past day picker
```

---

### Task 6: Manual smoke test

- [ ] **Step 1: Start dev server**

Run: `bun run dev`

- [ ] **Step 2: Test edit mode**

1. Tap up/down a few times to create today's entry
2. Tap a log row — verify the header changes to the date pill with back/delete icons
3. Tap up/down — verify the counter changes for that date, not today
4. Tap "Back to Today" (rotate icon) — verify it returns to today's counter

- [ ] **Step 3: Test "Add Past Day"**

1. Tap "+ Add Past Day" below the log table
2. Pick a date that doesn't exist in the log
3. Verify the tracker enters edit mode for that date with total 0
4. Tap up a few times — verify it saves

- [ ] **Step 4: Test delete with undo**

1. Enter edit mode for a day
2. Tap the trash icon — verify the row disappears and the undo toast appears
3. Wait and watch the toast auto-dismiss after 10 seconds
4. Repeat: delete another day, but this time tap "Undo" — verify the row reappears

- [ ] **Step 5: Test tab switching**

1. Enter edit mode, then switch to Stats tab — verify edit mode is cleared when returning to Tracker
2. Delete a day, then switch tabs before 10s — verify the delete commits (row stays gone)

- [ ] **Step 6: Test page refresh**

1. Enter edit mode, refresh the page — verify it returns to today
