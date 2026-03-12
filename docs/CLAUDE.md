# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install:** `bun install`
- **Dev server:** `bun run dev` (runs on port 3000, accessible on all interfaces)
- **Build:** `bun run build`
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

All state lives in `Record<string, DailyRecord>` keyed by `YYYY-MM-DD` date strings. `DailyRecord` has `up`, `down`, and `total` fields. Scoring: up = 1 point, down = 0.5 points. Data persists to localStorage under the key defined in `src/constants.ts`.

### App Structure

`App.tsx` owns all state and tab routing (tracker / stats / help). Child components are pure presentational—they receive data and callbacks via props:

- **TrackerTab** — tap buttons to log floors, displays history table
- **StatsTab** — computed stats (today/week/month/total meters), Everest progress bar
- **HelpTab** — renders README.md as markdown via `react-markdown`

### Path Alias

`@/*` maps to the project root (not `src/`), configured in both `tsconfig.json` and `vite.config.ts`.

### Dev Mode

Append `?devMode=true` to the URL to show developer tools (inject dummy data, reset data, view raw JSON state).

### Origin

Originally scaffolded for Google AI Studio (hence `metadata.json`, Gemini API key in `.env.example`, and HMR disable flag). The Gemini integration is wired in `vite.config.ts` but not actively used in the app code.
