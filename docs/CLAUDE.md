# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install:** `bun install`
- **Dev server:** `bun run dev` (runs on port 3000, accessible on all interfaces)
- **Build:** `bun run build` (also copies index.html → 404.html for SPA routing on GH Pages)
- **Type check:** `bun run lint` (runs `tsc --noEmit`)
- **Verify build:** `bun run verify` (builds and checks dist/index.html exists)
- **Clean:** `bun run clean` (removes dist/)
- **Preview production build:** `bun run preview`

No test framework is configured. Package manager is bun (not npm).

## Deployment

GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`). Auto-deploys on push to `main`, also supports manual `workflow_dispatch`. Vite `base` is set to `/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker/` for correct asset paths on gh-pages. First-time setup: repo Settings → Pages → Source → "GitHub Actions".

## Architecture

React + Vite + TypeScript app for tracking floors climbed. Uses Tailwind CSS v4 (plugin-based via `@tailwindcss/vite`, imported as `@import "tailwindcss"` in index.css).

### Data Model

All state lives in `Record<string, DailyRecord>` keyed by `YYYY-MM-DD` date strings. `DailyRecord` has `dateStr`, `up`, `down`, and `total` fields. Scoring: up = 1 point, down = 0.5 points. Data persists to localStorage under the key defined in `src/constants.ts` and syncs to Firestore in real time. `UserSettings` (theme, default challenge, email) is stored per-user in Firestore.

### App Structure

`App.tsx` owns all state and tab routing (tracker / stats / help / profile). Uses `react-router-dom` with UUID-based routes (`/:uuid`). `/` redirects to stored or generated UUID. Child components are pure presentational—they receive data and callbacks via props:

- **TrackerTab** — tap buttons to log floors, displays history table
- **StatsTab** — computed stats (today/week/month/total meters), challenge progress bar (Eiffel Tower, Burj Khalifa, Fuji, Kilimanjaro, Everest, Mariana Trench)
- **HelpTab** — renders README.md as markdown via `react-markdown`
- **ProfileTab** — user settings (theme, default challenge, email)
- **NavigationTabs** — tab bar
- **OnboardingWarning** — first-visit prompt
- **UpdatePrompt** — PWA service worker update prompt

Key utilities in `src/utils/`:

- **firebase.ts** — Firebase init, anonymous auth, Firestore CRUD, real-time subscriptions, sync status
- **storage.ts** — localStorage read/write with throttled persistence hook
- **useAppInitialization.ts** — orchestrates auth, data fetch, real-time sync, and dev mode
- **appHelpers.ts** — tap update logic, record sorting
- **statsHelpers.ts** — stats computation
- **dev.ts** — dummy data generation, reset confirmation
- **date.ts** — date key helpers

### Path Alias

`@/*` maps to the project root (not `src/`), configured in both `tsconfig.json` and `vite.config.ts`.

### Firebase & Cloud Sync

Firebase (anonymous auth + Firestore) provides real-time cloud sync. Config is in `src/utils/firebase.ts` with hardcoded public Firebase identifiers (not secrets—security is via Firestore rules). Data path: `users/{uuid}/logs/{dateKey}` for records, `users/{uuid}/settings/profile` for user settings. `useAppInitialization` hook manages auth, initial data fetch, and real-time subscriptions.

### PWA

`vite-plugin-pwa` with `registerType: 'prompt'`. Users see an `UpdatePrompt` component when a new service worker is available. Manifest is configured in `vite.config.ts`.

### Dev Mode

Append `?devMode=true` to the URL to show developer tools (inject dummy data, reset data, run 1000-day benchmark, view raw JSON state).

### Environment

Copy `.env.example` to `.env`. Key vars: `VITE_APP_NAME`, `VITE_APP_VERSION`. Firebase config vars are in `.env.example` but currently hardcoded in `firebase.ts`. `GEMINI_API_KEY` is wired in `vite.config.ts` but not actively used.

### Key Dependencies

- **motion** (Framer Motion) — animations
- **lucide-react** — icons
- **react-markdown** — markdown rendering
- **react-router-dom** — UUID-based routing

### Origin

Originally scaffolded for Google AI Studio (hence `metadata.json`, Gemini API key in `.env.example`, and HMR disable flag).
