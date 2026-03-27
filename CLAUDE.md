# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Package manager:** bun (not npm/yarn)
- **Install:** `bun install`
- **Dev server:** `bun run dev`
- **Build:** `bun run build` (copies index.html → 404.html for SPA routing on GitHub Pages)
- **Type check:** `bun run lint` (runs `tsc --noEmit`)
- **Run all tests:** `bun run test` (vitest)
- **Run tests in watch mode:** `bun run test:watch`
- **Run a single test file:** `bunx vitest run src/utils/__tests__/appHelpers.test.ts`
- **Verify build:** `bun run verify`
- **Preview production build:** `bun run preview`

## CI Pipeline

GitHub Actions (`.github/workflows/deploy.yml`): lint → test → build → deploy to GitHub Pages on push to `main`. Uses `bun install --frozen-lockfile`. Vite `base` is set to `/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker/` in production for correct asset paths.

## Architecture

React 19 + Vite + TypeScript SPA for tracking floors climbed. Tailwind CSS v4 (plugin-based via `@tailwindcss/vite`), class-based dark mode via `@custom-variant dark` in `index.css`.

### Design System ("Summit Instrument")

Warm earthy palette (stone grays, parchment whites, volcanic blacks) with amber/gold accent. Typography: Syne (display headings), JetBrains Mono (data/numbers), system sans-serif (body). Topographic contour-line background pattern. Custom CSS classes: `.btn-brass`, `.altitude-readout`, `.altitude-glow`, `.bg-topo`. Tailwind's zinc scale is overridden to warm tones via `@theme` in `index.css`.

### State & Data Flow

`App.tsx` (`MainApp`) owns all state, tab routing, sync status, and manual sync handler. Child components are pure presentational — they receive data and callbacks via props only. State is `Record<string, DailyRecord>` keyed by `YYYY-MM-DD` date strings.

Data flows through three layers:
1. **React state** — authoritative in-memory state in `MainApp`
2. **localStorage** — throttled persistence via `useThrottledPersistence` (2s debounce)
3. **Firestore** — real-time cloud sync with additive conflict resolution (per-field max in `mergeRecords.ts`)

`useAppInitialization` hook orchestrates Firebase anonymous auth (awaited before listeners), initial data fetch, real-time subscriptions, and dev mode detection.

### Scoring

`calculateTotal(up, down)` in `appHelpers.ts` is the single source of truth: `up + down * 0.5`. Imported by `mergeRecords.ts` and `dev.ts`.

### Routing

`react-router-dom` with UUID-based routes (`/:uuid`). `/` redirects to a stored or freshly generated UUID. The UUID is the user's identity — no sign-up flow.

### Firebase

Anonymous auth + Firestore. Config is hardcoded in `src/utils/firebase.ts` (public identifiers, not secrets — security is via Firestore rules in `firestore.rules`). `initializeFirebaseSession` returns `boolean` and sets sync status to `error` on failure. Data paths:
- `users/{uuid}/logs/{dateKey}` — daily records
- `users/{uuid}/settings/profile` — user settings (theme, default challenge, email)

### Key Conventions

- **Path alias:** `@/*` maps to the project root (not `src/`), configured in `tsconfig.json` and `vite.config.ts`
- **Tests:** vitest with `globals: true` — tests live in `src/utils/__tests__/`. Firebase is mocked via `vi.mock`.
- **PWA:** `vite-plugin-pwa` with `registerType: 'prompt'`. `UpdatePrompt` component shows when a new service worker is available. Icon generation: open `scripts/generate-icons.html` in a browser.
- **Dev mode:** Append `?devMode=true` to URL for developer tools (dummy data, reset, 1000-day benchmark, raw JSON).
- **Tabs:** tracker / stats / help / profile — defined in `src/constants.ts` as `TABS`.
