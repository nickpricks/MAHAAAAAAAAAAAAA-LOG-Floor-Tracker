# Challenge System Revamp — Design Spec

**Date:** 2026-03-31
**Status:** Approved
**Scope:** Expanded challenge catalog, resettable periods with history, challenge picker UI, floor height presets

---

## 1. Challenge Catalog

All distances stored internally as meters. Display auto-switches between m and km based on scale (< 1000m shows meters, >= 1000m shows km).

### Featured (shown by default)

| ID | Name | Category | Distance | Emoji |
|----|------|----------|----------|-------|
| `eiffel` | Eiffel Tower | Landmarks | 330 m | `🗼` |
| `burj` | Burj Khalifa | Landmarks | 828 m | `🏢` |
| `everest` | Mount Everest | Mountains | 8,848 m | `⛰️` |

### Full Catalog (revealed on "Show all")

**Landmarks** — Weekly targets

| ID | Name | Distance (m) | Emoji |
|----|------|-------------|-------|
| `pisa` | Leaning Tower of Pisa | 56 | `🏛️` |
| `arc` | Arc de Triomphe | 50 | `🇫🇷` |
| `liberty` | Statue of Liberty | 93 | `🗽` |
| `bigben` | Big Ben | 96 | `🔔` |
| `eiffel` | Eiffel Tower | 330 | `🗼` |

**Towers** — Monthly targets

| ID | Name | Distance (m) | Emoji |
|----|------|-------------|-------|
| `empire` | Empire State Building | 443 | `🏙️` |
| `taipei` | Taipei 101 | 508 | `🏯` |
| `cn` | CN Tower | 553 | `📡` |
| `burj` | Burj Khalifa | 828 | `🏢` |

**Mountains** — Monthly to quarterly targets

| ID | Name | Distance (m) | Emoji |
|----|------|-------------|-------|
| `halfdome` | Half Dome | 1,444 | `🧗` |
| `fuji` | Mount Fuji | 3,776 | `🗻` |
| `montblanc` | Mont Blanc | 4,808 | `🏔️` |
| `kilimanjaro` | Mount Kilimanjaro | 5,895 | `🏔️` |
| `denali` | Denali | 6,190 | `🏔️` |
| `everest` | Mount Everest | 8,848 | `⛰️` |
| `mariana` | Mariana Trench | 10,984 | `🌊` |

**Milestones** — Yearly stretch goals

| ID | Name | Distance (m) | Emoji |
|----|------|-------------|-------|
| `double-everest` | Double Everest | 17,696 | `⛰️⛰️` |
| `marathon` | Marathon | 42,195 | `🏃` |
| `100km` | 100 km Club | 100,000 | `💯` |

**Journeys** — Lifetime / aspirational (future tracking modes will make these reachable)

| ID | Name | Distance (m) | Emoji |
|----|------|-------------|-------|
| `channel` | English Channel | 34,000 | `🏊` |
| `himalaya` | Himalayan Range | 2,400,000 | `🏔️` |
| `sahara` | Sahara Crossing | 1,800,000 | `🏜️` |
| `kashmir-kanyakumari` | Kashmir to Kanyakumari | 3,500,000 | `🇮🇳` |
| `brahmaputra` | Brahmaputra River | 3,848,000 | `🏞️` |
| `pct` | Pacific Crest Trail | 4,265,000 | `🥾` |
| `amazon` | Amazon River | 6,400,000 | `🌿` |
| `equator` | Around the Equator | 40,075,000 | `🌍` |

**Space** — Dream tier

| ID | Name | Distance (m) | Emoji |
|----|------|-------------|-------|
| `moon` | Earth to Moon | 384,400,000 | `🌙` |
| `mars` | Earth to Mars | 225,000,000,000 | `🔴` |

Categories exist purely for visual grouping in the picker — no functional difference. The suggested reset period per category is a UI hint, not enforced — users can set any period for any challenge.

---

## 2. Reset Periods

### Options

| ID | Label | Calendar alignment |
|----|-------|-------------------|
| `week` | Weekly | Monday 00:00 local time |
| `month` | Monthly | 1st of month 00:00 local time |
| `3month` | Quarterly | Jan 1, Apr 1, Jul 1, Oct 1 |
| `year` | Yearly | Jan 1 00:00 local time |
| `lifetime` | Never | No reset |

### Default

1 month. Applied automatically if user doesn't explicitly choose.

### When Chosen

At challenge selection time only. When a user taps a challenge in the picker, a secondary prompt shows reset period options. Tapping "Set Goal" confirms both challenge and period. If user doesn't interact with the period selector, the current period (or default) carries forward.

### Period Key Format

Used as Firestore document IDs and for period boundary detection:

| Period | Key format | Example |
|--------|-----------|---------|
| Week | `YYYY-WNN` | `2026-W14` |
| Month | `YYYY-MM` | `2026-03` |
| Quarter | `YYYY-QN` | `2026-Q1` |
| Year | `YYYY` | `2026` |
| Lifetime | `lifetime` | `lifetime` |

---

## 3. Period History

### What Gets Saved

When a new period starts (detected on app load or at midnight rollover), the previous period's progress is archived:

```
users/{uuid}/challengeHistory/{periodKey-challengeId}
  → {
      challengeId: string,
      challengeName: string,
      period: string,         // e.g. "2026-03"
      resetPeriod: string,    // e.g. "month"
      metersClimbed: number,
      targetMeters: number,
      percent: number,
      completed: boolean,     // percent >= 100
      archivedAt: number      // timestamp
    }
```

### Display

Stats tab shows below the current progress:

- "Previous periods" section with last 3-5 entries
- Each entry: period label, challenge name, percent bar, completed badge if 100%+

### When Archiving Happens

On app initialization, compare current period key with the stored `activeChallenge.currentPeriodKey`. If different, archive the old period and reset the counter. This is a client-side check — no cloud functions needed.

---

## 4. Challenge Picker UI

Replaces the current dropdown in Stats tab.

### Collapsed State (default)

A card showing:
- Current challenge name + emoji
- Progress bar + percentage
- Period info: "March 2026 · Monthly"
- "Change Goal" button

### Expanded State (picker)

Triggered by "Change Goal":

1. **Featured row** — 3 large pill/bubble cards (Burj Khalifa, Everest, Marathon). Each shows emoji + name + distance. Active challenge highlighted with accent ring.

2. **"Show all" toggle** — Expands to full grid.

3. **Full grid** — Grouped by category headers (Landmarks / Mountains / Journeys / Space). Each challenge is a rounded pill card: emoji + name + formatted distance. Smaller than featured cards. Active challenge highlighted.

4. **Period selector** — Appears inline below the selected challenge. Row of pills: `[1w] [1m] [3m] [1y] [∞]`. Current/default is pre-selected.

5. **"Set Goal" button** — Confirms selection. Closes picker.

### Selection Flow

Tap challenge → period selector appears → optionally change period → "Set Goal" → picker collapses → progress resets for new challenge/period.

---

## 5. Floor Height Presets

### UI

In Profile tab, new section between Theme and Default Goal:

```
FLOOR HEIGHT
[Residential 2.5m]  [Standard 3.0m]  [Commercial 3.5m]
```

Three buttons, same style as Light/Dark/System toggle. Default: Standard (3.0m).

### Storage

`UserSettings.floorHeight: 2.5 | 3.0 | 3.5` — stored in Firestore settings.

### Usage

All distance calculations use `settings.floorHeight || 3.0` instead of the constant `METERS_PER_FLOOR`. The constant remains as the fallback default but is no longer the sole source.

Affected calculations:
- StatsTab: `todayMeters`, `weekMeters`, `monthMeters`, `totalMeters`
- Challenge progress: meters climbed toward target
- History archiving: meters recorded per period

---

## 6. Data Model Changes

### UserSettings (modified fields)

```ts
type UserSettings = {
  // ... existing fields (theme, colorMode, username, email)

  floorHeight?: 2.5 | 3.0 | 3.5;          // default 3.0

  activeChallenge?: {
    id: string;                              // challenge ID from catalog
    resetPeriod: 'week' | 'month' | '3month' | 'year' | 'lifetime';
    currentPeriodKey: string;                // e.g. "2026-03", used to detect rollovers
  };

  // REMOVED: defaultChallenge?: string      // replaced by activeChallenge
};
```

### New Firestore Path

```
users/{uuid}/challengeHistory/{periodKey-challengeId}
```

### Challenge Definition Type

```ts
type Challenge = {
  id: string;
  name: string;
  category: 'landmarks' | 'mountains' | 'journeys' | 'space';
  meters: number;
  emoji: string;
  featured: boolean;
};
```

Replaces the current `CHALLENGES` array in `constants.ts`. Same location, richer type.

---

## 7. Migration

Existing users have `defaultChallenge: 'everest'` (or similar ID). On settings load:

1. If `activeChallenge` is undefined but `defaultChallenge` exists:
   - Set `activeChallenge: { id: defaultChallenge, resetPeriod: 'month', currentPeriodKey: getCurrentPeriodKey('month') }`
   - Remove `defaultChallenge` from settings
   - Persist migration to Firestore

2. If neither exists, default to `{ id: 'everest', resetPeriod: 'month', currentPeriodKey: ... }`.

---

## 8. Files Expected to Change

| File | Change |
|------|--------|
| `src/constants.ts` | Replace `CHALLENGES` array with expanded catalog using `Challenge` type. Remove `DEFAULT_CHALLENGE_ID`. Add `FLOOR_HEIGHT_PRESETS`, `RESET_PERIODS`, `FEATURED_CHALLENGE_IDS`. |
| `src/components/StatsTab.tsx` | Replace dropdown with challenge picker UI, add period history section, use dynamic floor height. |
| `src/components/ProfileTab.tsx` | Replace challenge dropdown with floor height preset selector. Remove "Default Goal" section (moved to Stats). |
| `src/utils/statsHelpers.ts` | Accept `floorHeight` parameter instead of using constant. |
| `src/utils/firebase.ts` | Update `UserSettings` type. Add `archiveChallengePeriod` and `loadChallengeHistory` helpers. |
| `src/utils/useAppInitialization.ts` | Add period rollover detection + archiving on init. Add `defaultChallenge` migration. |
| `src/App.tsx` | Pass `floorHeight` from settings to StatsTab. |
| `HELP.md` | Update challenges section. |
| **New:** `src/utils/challenges.ts` | Challenge catalog, period key utilities, `getCurrentPeriodKey()`, `formatDistance()`. |
| **New:** `src/utils/__tests__/challenges.test.ts` | Tests for period keys, distance formatting, migration. |

---

## 9. What's Deferred

| Item | Reason |
|------|--------|
| Per-tap floor height | Breaks one-tap simplicity |
| Custom numeric floor height | Three presets cover 95% of buildings |
| Rolling window periods (Option C) | History model supports future extension |
| Challenge streaks / badges | Future gamification phase |
| Firestore rules for challengeHistory | Same auth-only pattern as existing collections |
