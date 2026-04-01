# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Package manager:** bun (not npm/yarn)
- **Install:** `bun install`
- **Dev server:** `bun run dev` (port 3000) or `make dev port=3005`
- **Build:** `bun run build` (copies index.html -> 404.html for SPA routing on GitHub Pages)
- **Type check:** `bun run lint` (runs `tsc --noEmit`)
- **Run all tests:** `bun run test` (vitest)
- **Run tests in watch mode:** `bun run test:watch`
- **Run a single test file:** `bunx vitest run src/utils/__tests__/appHelpers.test.ts`
- **Verify build:** `bun run verify`
- **Preview production build:** `bun run preview`
- **Clean all artifacts:** `make clean`

All `bun run` commands have `make` equivalents (e.g. `make lint`, `make test`, `make build`). `make dev` also supports `host=` for network binding.

## CI Pipeline

GitHub Actions (`.github/workflows/deploy.yml`): lint -> test -> build -> deploy to GitHub Pages on push to `main`. Uses `bun install --frozen-lockfile`. Vite `base` is set to `/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker/` in production for correct asset paths.

## Architecture

React 19 + Vite + TypeScript SPA for tracking floors climbed. Tailwind CSS v4 (plugin-based via `@tailwindcss/vite`).

### Theme System

CSS custom properties per theme, mapped through Tailwind v4 `@theme` as semantic utility classes. Theme class on `<html>` (e.g. `class="theme-night-city-elevator dark"`).

**Six themes:**
- **Summit Instrument** — Warm stone palette, amber/gold accent, Syne font, topographic background. Light + dark.
- **Night City: Elevator** — Void black, cyan/violet, Orbitron font, diamond buttons, brushed metal. Dark-only.
- **Deep: Mariana** — Ocean navy, bioluminescent green, bubble ambient effect. Dark-only.
- **Night City: Apartment** — Noir black, warning gold, terminal green, scanline CRT overlay. Dark-only.
- **Industrial Furnace** — Molten orange, slag brown, riveted steel grid, ember ambient effect. Dark-only.
- **Corporate Glass** — Cool blue-grey, frosted panels, professional feel. Light + dark.

**Token classes:** Components use semantic classes (`bg-surface`, `bg-surface-card`, `text-fg`, `text-fg-muted`, `text-accent`, `border-line`) instead of raw palette classes. Buttons use `.btn-uniform` (shared subdued style, glow on click). Night City: Elevator has unique `.btn-elevator` diamond buttons. Ambient effects via `.fx-ambient` div. Per-theme icons via `THEME_ICONS` map in `TrackerTab.tsx`.

**Key files:** Theme definitions in `src/utils/themes.ts`. Per-theme CSS in `src/themes/*.css`. Shared button/effect CSS in `src/themes/buttons.css` and `src/themes/effects.css`. `src/index.css` imports all theme files and defines Tailwind `@theme` semantic mappings. Theme applied via `applyTheme()`, read via `useActiveThemeId()`.

**Adding a new theme:** (1) New CSS file in `src/themes/` with custom property values, (2) import it in `src/index.css`, (3) one entry in `THEME_DEFINITIONS` in `themes.ts`, (4) zero component changes.

**Theme preview URLs:** Visit `/{theme-id}` to preview any theme (e.g. `/industrial-furnace`, `/deep-mariana`). Works while dev server is running.

### State & Data Flow

`App.tsx` (`MainApp`) owns all state, tab routing, sync status, and manual sync handler. Child components are pure presentational — they receive data and callbacks via props only. State is `Record<string, DailyRecord>` keyed by `YYYY-MM-DD` date strings.

Data flows through three layers:
1. **React state** — authoritative in-memory state in `MainApp`
2. **localStorage** — throttled persistence via `useThrottledPersistence` (2s debounce)
3. **Firestore** — real-time cloud sync with additive conflict resolution (per-field max in `mergeRecords.ts`)

`useAppInitialization` hook orchestrates Firebase anonymous auth (awaited before listeners), initial data fetch, real-time subscriptions, settings migration, and dev mode detection.

### Scoring

`calculateTotal(up, down)` in `appHelpers.ts` is the single source of truth: `up + down * 0.5`. Imported by `mergeRecords.ts` and `dev.ts`.

### Routing

`react-router-dom` with dual routing via `/:identifier`. The identifier resolves as either:
- **UUID** (regex: 8-4-4-4-12 hex) — used directly
- **Username** — looked up in `usernames/{name}` Firestore collection to get the UUID

`/` redirects to stored username (preferred) or stored UUID or a freshly generated UUID. Username popup shown on first visit after onboarding.

### Firebase

Anonymous auth + Firestore. Config is hardcoded in `src/utils/firebase.ts` (public identifiers, not secrets — security is via Firestore rules in `firestore.rules`). `initializeFirebaseSession` returns `boolean` and sets sync status to `error` on failure.

Data paths:
- `users/{uuid}/logs/{dateKey}` — daily records (`DailyRecord`)
- `users/{uuid}/settings/profile` — user settings (theme, colorMode, defaultChallenge, username, email)
- `usernames/{username}` — username-to-UUID mapping (`{ uuid, createdAt }`)

### Key Conventions

- **Path aliases:** `@/*` -> `src/*`, `@components/*` -> `src/components/*`, `@utils/*` -> `src/utils/*` — configured in `tsconfig.json` and `vite.config.ts`
- **Import order:** React first, then external libs, then internal components, then types/constants, then utils/root files **always last**. See `CONTRIBUTING.md`.
- **Tests:** vitest with `globals: true` — tests live in `src/utils/__tests__/`. Firebase is mocked via `vi.mock`.
- **Animations:** `motion` (Framer Motion v12) is available for animation. Used in components for transitions.
- **PWA:** `vite-plugin-pwa` with `registerType: 'prompt'`. `UpdatePrompt` component shows when a new service worker is available.
- **Dev mode:** Append `?devMode=true` to URL for developer tools (dummy data, reset, 1000-day benchmark, raw JSON).
- **Tabs:** tracker / stats / help / profile — defined in `src/constants.ts` as `TABS`.
- **Theme-aware components:** Use semantic token classes, not hardcoded zinc/amber. TrackerTab has per-theme variants (`DefaultTracker` / `ElevatorTracker`) selected via `useActiveThemeId()`. Per-theme icons defined in `THEME_ICONS` map.
- **Visual theme testing:** `bun run test:themes` (headless Playwright) or `bun run test:themes:debug` (visible browser + inspector). Or visit `/{theme-id}` URLs directly (e.g. `/deep-mariana`).

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | GitHub-facing project overview |
| `HELP.md` | In-app Help tab content (rendered via react-markdown) |
| `CONTRIBUTING.md` | Coding guidelines, import conventions |
| `docs/SecurityGuide.md` | Security architecture ("Security through Rules") |
| `docs/specs/WORKPLAN.md` | Master workplan / task tracker |
| `docs/specs/2026-03-30-identity-theming-design.md` | Phase 5 identity/theming design spec |
| `docs/specs/2026-03-31-challenge-revamp-design.md` | Challenge system revamp design spec |
| `docs/specs/2026-03-31-identity-theming.md` | Phase 5 implementation plan |

## Gotchas

- **HELP.md, not README.md:** `HelpTab.tsx` renders `HELP.md?raw` via react-markdown. No GFM table support — use lists, not markdown tables.
- **Fonts in index.html:** Google Fonts are loaded via `<link>` in `index.html`, not CSS `@import`. Adding a font means editing that file.
- **Settings migration:** `useAppInitialization.ts` migrates legacy Firestore settings on read (e.g., old `theme: 'dark'` -> `theme: ThemeId` + `colorMode`). New schema changes should follow this pattern.
- **Discriminated unions:** `validateUsername()` returns `{ valid: true } | { valid: false; error: string }`. Narrow with `if (!result.valid)` before accessing `.error`.
- **Dual path alias config:** `vitest.config.ts` and `tsconfig.json` both define `@/`, `@components/`, `@utils/` aliases independently. Adding a new alias requires updating both files (`vite.config.ts` uses `vite-tsconfig-paths` to read from `tsconfig.json`, but vitest does not).
- **E2e tests need port 3005:** Theme e2e tests default to `http://localhost:3005`. Start the dev server with `make dev port=3005` in a separate terminal before running `bun run test:themes`.
