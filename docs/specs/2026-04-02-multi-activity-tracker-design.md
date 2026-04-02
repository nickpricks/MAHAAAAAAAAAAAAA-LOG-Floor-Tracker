# Multi-Activity Tracker Evolution

> **Status:** Approved  
> **Date:** 2026-04-02  
> **Summary:** Evolve Floor Tracker from a floor-only MVP into a multi-activity product tracking floors, steps, walks, and runs.

## Vision

Floor Tracker graduates from MVP to product. Floors remain the default activity. Users opt-in to steps, walks, and runs via Profile. One focus activity front and center on the tracker screen, others accessible via a switcher menu. Health API auto-sync as baseline (via Firebase Cloud Functions), manual session logging for overrides and backdating.

## Data Model

### Unified `activities/` Collection

Replaces the current `logs/` subcollection. Every entry is typed via a discriminated union.

**Firestore path:** `users/{uid}/activities/{autoId}`

```typescript
type ActivityType = 'floor' | 'walk' | 'run' | 'steps';
type ActivitySource = 'manual' | 'healthkit' | 'googlefit';

type BaseActivity = {
  id: string;              // Firestore auto-id
  type: ActivityType;
  date: string;            // YYYY-MM-DD
  source: ActivitySource;
  createdAt: Timestamp;
};

type FloorActivity = BaseActivity & {
  type: 'floor';
  up: number;
  down: number;
  total: number;           // up + down * 0.5
};

type MovementActivity = BaseActivity & {
  type: 'walk' | 'run';
  meters: number;
  duration?: number;       // minutes, optional
  steps?: number;          // if available from health API
};

type StepsActivity = BaseActivity & {
  type: 'steps';
  count: number;
  meters?: number;         // estimated distance if available
};

type Activity = FloorActivity | MovementActivity | StepsActivity;
```

### Key Data Model Decisions

| Decision | Choice | ETA |
|----------|--------|-----|
| Floor activity shape | Keeps `up`/`down`/`total` tap model — not forced into a generic shape | P1 |
| Floor docs per day | One per day (same as today, just in the new collection) | P1 |
| Walk/run granularity | Multiple sessions per day allowed | P1 |
| Steps granularity | One daily rollup (typically from Health API, or manual entry) | P1 |
| Source tracking | `source` field distinguishes manual vs auto-synced data | P1 |
| Distance for challenges | Floors: `total * floorHeight`. Walk/run: `meters`. Steps: `count * strideLength` | P1 |

## Architecture

```
+---------------------------------------------+
|  Client (React SPA)                         |
|  +----------+ +----------+ +-------------+  |
|  | Tracker  | |  Stats   | |   Profile   |  |
|  | (focus   | | (unified | | (activities |  |
|  | activity)| | metrics) | |  toggle,    |  |
|  +----+-----+ +----+-----+ |  stride,    |  |
|       |             |       |  defaults)  |  |
|       v             v       +------+------+  |
|  +----------------------------------+        |
|  |  Firestore (real-time listeners) |        |
|  |  users/{uid}/activities/{id}     |        |
|  |  users/{uid}/settings/profile    |        |
|  +----------------+-----------------+        |
+-------------------|--------------------------+
                    |
+-------------------|--------------------------+
|  Firebase Cloud Functions                    |
|  +----------------v----------------+         |
|  |  Health Sync Function           |         |
|  |  - OAuth callback handler       |         |
|  |  - Scheduled pull (daily)       |         |
|  |  - Writes to activities/        |         |
|  +---------------------------------+         |
|  +---------------------------------+         |
|  |  Migration Script               |         |
|  |  - One-time logs/ -> activities/|         |
|  +---------------------------------+         |
+----------------------------------------------+
```

### What Stays the Same

- Real-time Firestore listeners (existing `onSnapshot` pattern)
- Theme system, challenge system, settings sync
- All existing UI components (rewired to new data)
- PWA, service worker, offline support
- Username system (`usernames/` collection, dual UUID/username routing)
- `users/{uid}/settings/profile` path (extended, not replaced)

### What Changes

| Change | Description | ETA |
|--------|-------------|-----|
| Data model | `DailyRecord` -> `Activity` discriminated union | P1 |
| Firestore collection | `logs/` -> `activities/` subcollection | P1 |
| Firestore queries | Filter by `type` and `date` range | P1 |
| Tracker screen | Activity switcher (focus activity + kebab menu) | P1 |
| Profile tab | Activity toggles, stride length, default activity | P1 |
| UserSettings | Adds `enabledActivities`, `defaultActivity`, `strideLength`, `healthSync` | P1 |
| Authentication | Anonymous -> Google Sign-In (real auth) | P1 |
| Cloud Functions | New `functions/` directory in repo | P2 |
| Health API sync | Apple Health / Google Fit OAuth + daily pull | P2 |
| Additional auth providers | Email/password + Apple Sign-In | P3 |

## Authentication

### Upgrade from Anonymous Auth

Anonymous auth was fine for the MVP. With Health API OAuth, cloud functions, and product ambitions, real auth is required.

**Auth plan:**
- **Phase 1:** Google Sign-In (ship first, simplest)
- **Phase 3:** Email/password + Apple Sign-In (layered in later)

Firebase Auth supports multiple providers per account, so adding providers is non-breaking.

### Existing User Migration

Firebase supports linking anonymous accounts to a permanent provider via `linkWithCredential()`. Existing users:
1. See a sign-in prompt (Google button)
2. Their anonymous UID gets linked to the Google account
3. All data stays at the same Firestore path — zero data migration needed for auth

### Firestore Rules

UID ownership enforced from the start — resolves the deferred Phase 4 problem:

```
match /users/{userId}/activities/{actId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## User Settings

### Updated `UserSettings` Type

```typescript
type UserSettings = {
  // Existing
  theme: ThemeId;
  colorMode: 'light' | 'dark' | 'system';
  activeChallenge: ActiveChallenge;
  floorHeight: number;
  username?: string;
  email?: string;

  // New
  defaultActivity: ActivityType;          // shown on tracker, default: 'floor'
  enabledActivities: ActivityType[];      // default: ['floor']
  strideLength: number;                   // meters, default: 0.762
  healthSync?: {
    provider: 'apple' | 'google' | null;
    connectedAt?: Timestamp;
    lastSyncAt?: Timestamp;
  };
};
```

### Profile Tab Additions

| Feature | Description | ETA |
|---------|-------------|-----|
| Activity toggles | Checkboxes for steps, walk, run (floor always on) | P1 |
| Default activity | Dropdown from enabled activities | P1 |
| Stride length | Preset options (short/average/tall) + custom input | P1 |
| Google Sign-In | Sign-in button replacing anonymous state | P1 |
| Health sync | Connect Apple Health / Google Fit button | P2 |
| Email/password | Additional auth provider option | P3 |
| Apple Sign-In | Additional auth provider option | P3 |

## Tracker Screen

### Focus Activity Model

The tracker shows the user's `defaultActivity` full-screen. A small icon in the top corner (kebab or activity icon) reveals other enabled activities. Selecting one swaps the tracker view.

### Per-Activity Tracker Views

| Activity | Input | Display | ETA |
|----------|-------|---------|-----|
| **Floor** | Up/Down tap buttons (unchanged) | Today's total, altitude readout | P1 |
| **Walk** | "Log Walk" -> distance (m/km) + optional duration | Today's walk distance | P1 |
| **Run** | "Log Run" -> distance (m/km) + optional duration | Today's run distance | P1 |
| **Steps** | Manual step count entry (auto-sync overrides when connected) | Today's step count | P1 (manual), P2 (auto-sync) |

### Manual Session Entry

For walks and runs: a simple bottom sheet with distance input, optional duration, and a date picker (defaults to today, allows backdating). No start/stop timer — this isn't Strava.

### Theme Compatibility

Each activity tracker uses the same semantic tokens (`bg-surface`, `text-fg`, `text-accent`, etc.). Themed variants (ElevatorTracker diamond buttons, etc.) apply to whichever activity is shown.

## Stats & Challenges

### Stats Tab

- Metric cards adapt to enabled activities — if only floors enabled, looks exactly like today
- As activities are enabled, cards appear for each
- **Universal distance** total across all activities feeds into challenge progress:
  `(floors * floorHeight) + walkMeters + runMeters + (steps * strideLength)`
- Fun facts scale with new data

### Challenge System

| Decision | Choice | ETA |
|----------|--------|-----|
| Existing 30 challenges | Stay as-is, all distance-based, all universal | P1 |
| Activity contribution | Every activity contributes meters to the same goal | P1 |
| Activity-specific challenges | Deferred (future phase) | TBD |

## Firestore Queries & Indexes

### Key Queries

```
// Today's activities (tracker screen)
activities/ WHERE date == "2026-04-02"

// Date range (stats, charts)
activities/ WHERE date >= "2026-03-01" AND date <= "2026-03-31"

// By type + date (activity-specific views)
activities/ WHERE type == "run" AND date >= "2026-03-01"
```

### Composite Indexes

| Index | Fields | ETA |
|-------|--------|-----|
| Date index | `(date)` | P1 |
| Type + date index | `(type, date)` | P1 |

## Migration

### Data Migration (One-Time Script)

Run after shipping, before users switch. Executed against Firestore directly.

```
For each user in users/{uid}/logs/:
  For each doc {dateKey}:
    -> Write to users/{uid}/activities/{autoId}:
       { type: "floor", date: dateKey, up, down, total,
         source: "manual", createdAt: now }
    -> Delete original doc (or archive)
```

### Auth Migration

- Existing anonymous users prompted to sign in with Google
- Firebase `linkWithCredential()` preserves their UID
- Data stays at the same Firestore path — zero data migration needed

## Implementation Phases

| Phase | Scope | Backend | ETA |
|-------|-------|---------|-----|
| **P1** | Real auth (Google sign-in), unified data model, manual logging for all activity types, tracker switcher, updated Profile | No | TBD |
| **P2** | Firebase Cloud Functions, Apple Health / Google Fit OAuth + daily sync | Yes | TBD |
| **P3** | Email/password + Apple Sign-In auth providers | No | TBD |
| **P4** | Migration script (`logs/` -> `activities/`), anonymous account linking | Script only | TBD |
| **P5** | Analytics dashboard, richer stats across activity types | No | TBD |
