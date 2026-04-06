# Edit Past Days & Delete Logs — Design Spec

**Date:** 2026-04-06
**Status:** Draft

## Problem

The tracker only allows tapping +/- for today. Users who forgot to log floors on previous days, or who made mistakes, have no way to add or correct past entries. The log table is read-only.

## Solution

Add three capabilities:
1. **Edit mode** — tap a log row to redirect the +/- buttons to that date
2. **Add past day** — date picker to create entries for days not yet in the log
3. **Delete a day** — remove an entry with a 10-second undo toast

## Design

### Edit Mode

A new `editingDate: string | null` state in `MainApp`. When `null`, buttons target today (current behavior). When set to a `YYYY-MM-DD` string, buttons target that date.

**Entering edit mode:**
- Tap any row in the log table to set `editingDate` to that row's `dateStr`
- The counter displays the targeted date's total (not today's)
- Tapping today's row normalizes `editingDate` to `null`

**Visual indicator:**
- Header text changes from "Today's Altitude" / "Floor Indicator" to the formatted date (e.g., "Wed, Apr 2") with an accent-colored background pill
- A "Back to Today" button appears near the header
- The active log row gets accent highlight (left border or background tint)

**Exiting edit mode:**
- Tap "Back to Today"
- Switch tabs
- Page refresh (state is not persisted — React state only)

### Log Table Changes

- Rows become tappable (`cursor-pointer`, hover/active states already exist)
- The row for the currently-edited date gets a visual indicator (accent left border or subtle background tint)
- Button behavior remains identical in edit mode — up adds an "up" floor, down adds a "down" floor. No behavior change per date.

### Add Past Day

- A "+ Add Past Day" button/link below the log table
- Opens a native `<input type="date">` picker, max = today (no future dates)
- If the picked date already exists in records, enters edit mode for it
- If new, creates `{ dateStr, up: 0, down: 0, total: 0 }` and enters edit mode
- Does not sync the blank record to cloud until the user taps +/- at least once

### Delete with Undo Toast

**Flow:**
1. Delete button visible in the edit mode header (trash icon, only shown when `editingDate` is set)
2. Tap delete: record is **immediately removed** from UI (optimistic)
3. Toast slides up from bottom: "Deleted Wed, Apr 2 — **Undo**"
4. Toast auto-dismisses after **10 seconds**
5. Undo: record restored to state, no cloud action
6. Timeout/dismiss: `deleteRecordFromCloud()` fires, localStorage updates via normal throttled persistence
7. Edit mode exits to today on delete

**State:**
```ts
type PendingDelete = {
  dateKey: string;
  record: DailyRecord;
  timeoutId: number;
} | null;
```

- Stored in MainApp as `pendingDelete` state
- Only one pending delete at a time — deleting another day while one is pending commits the first immediately
- Navigating away (tab switch) commits the pending delete

**Toast styling:**
- Fixed bottom-center, rounded pill
- Themed: `bg-surface-card`, `text-fg`, `border-line`, accent "Undo" link
- Framer Motion slide-up/fade animation
- No separate toast system — inline element in MainApp controlled by `pendingDelete`

### Firestore Changes

**New function:** `deleteRecordFromCloud(userId: string, dateKey: string)` in `firebase.ts`
- Calls `deleteDoc(doc(db, 'users', userId, 'logs', dateKey))`
- Fire-and-forget, same pattern as `syncRecordToCloud`

**Existing `calculateTapUpdate` changes:**
- Accept a `targetDate: string` parameter instead of hardcoding `getTodayKey()`
- Caller (`MainApp.handleTap`) passes `editingDate ?? todayKey`

**Merge conflict handling:**
- `mergeCloudIntoLocal` already uses per-field max — no changes needed
- A deleted record that reappears via cloud sync (from another device) will reappear in the log, which is correct

## Props Changes

### TrackerTab

```ts
// Before
type Props = {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  sortedRecords: DailyRecord[];
};

// After
type Props = {
  displayTotal: number;
  editingDate: string | null;
  handleTap: (type: 'up' | 'down') => void;
  onSelectDate: (dateStr: string | null) => void;
  onDelete: () => void;
  sortedRecords: DailyRecord[];
};
```

- `todayTotal` renamed to `displayTotal` (shows targeted date's total)
- `editingDate` drives the header text and row highlight
- `onSelectDate` called when a log row is tapped (or "Back to Today" / "Add Past Day")
- `onDelete` called when delete button is tapped (MainApp handles the undo toast logic)

### TrackerVariantProps

- Add `editingDate: string | null` and `onBackToToday: () => void` so the header and back button can render inside the tracker card

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `editingDate`, `pendingDelete` state, wire new handlers, render undo toast |
| `src/components/TrackerTab.tsx` | Tappable rows, edit mode header, delete button, "Add Past Day" button |
| `src/utils/appHelpers.ts` | `calculateTapUpdate` accepts `targetDate` param |
| `src/utils/firebase.ts` | Add `deleteRecordFromCloud` |
| `src/utils/date.ts` | Add date formatting helper for edit mode header if needed |

## Out of Scope

- Editing individual up/down counts directly (number input) — the +/- tap interaction is the only input method
- Bulk edit/delete operations
- Undo for edits (only delete has undo)
- Future date entries
