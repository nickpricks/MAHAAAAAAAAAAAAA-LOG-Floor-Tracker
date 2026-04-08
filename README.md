# Floor Tracker

**v0.0.7** · [Live App](https://nickpricks.github.io/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker/)

A minimalist web app for tracking floors climbed. Tap up, watch the number grow, sync across devices.

---

## Features

- **One-Tap Tracking** — Log a floor with a single tap. Haptic feedback on supported devices.
- **Real-time Cloud Sync** — Multi-device sync via Firebase with additive conflict resolution (per-field max merge).
- **6 Switchable Themes** — Live theme switching with per-theme buttons, icons, and ambient effects:
  - **Summit Instrument** — Warm stone, brass accents, topographic background (light + dark)
  - **Night City: Elevator** — Cyberpunk void black, cyan glow, diamond buttons (dark-only)
  - **Deep: Mariana** — Ocean navy, bioluminescent green, rising bubbles (dark-only)
  - **Night City: Apartment** — Noir black, warning gold, scanline CRT overlay (dark-only)
  - **Industrial Furnace** — Molten orange, slag brown, rising embers (dark-only)
  - **Corporate Glass** — Cool blue-grey, frosted panels (light + dark)
- **Username Identity** — Optional username (e.g. `climber-7f3a`) with dual routing: access your data via `/:username` or `/:uuid`.
- **PWA & Offline-First** — Installable, works offline, data syncs when reconnected.
- **Challenge Progress** — Track cumulative floors against real-world landmarks (Eiffel Tower through Mariana Trench).
- **Edit Past Days** — Tap any log row to redirect +/- buttons to that date. Add missing days via date picker. Delete entries with 10-second undo.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 with CSS custom property theme tokens |
| Backend | Firebase Anonymous Auth + Firestore (real-time) |
| PWA | vite-plugin-pwa with prompt update strategy |
| Animation | Motion (Framer Motion) |
| Routing | react-router-dom v7 |
| Testing | Vitest |
| Package Manager | Bun |

---

## Theme System

Themes use CSS custom properties mapped through Tailwind v4's `@theme` directive. Components reference semantic utility classes (`bg-surface`, `text-fg`, `text-accent`) — the visual identity is entirely in the CSS layer.

Adding a new theme requires:
1. A new CSS file in `src/themes/` with custom property values
2. Import it in `src/index.css`
3. One entry in `THEME_DEFINITIONS` in `src/utils/themes.ts`
4. Zero component changes

---

## Security

Firebase API keys are in-source (public identifiers, not secrets). Security is enforced via Firestore rules. See the [Security Guide](docs/SecurityGuide.md) for the full technical breakdown.

---

## Development

```bash
bun install          # Install dependencies
bun run dev          # Dev server on :3000
bun run test         # Run tests (vitest)
bun run lint         # Type check (tsc --noEmit)
bun run build        # Production build
bun run test:themes  # Theme visual E2E tests (Playwright)
```

Append `?devMode=true` to any URL for developer tools (dummy data, reset, benchmarks).
Visit `/{theme-id}` to preview any theme (e.g. `/industrial-furnace`).

---

## Roadmap

| Phase | Status | Highlights |
|-------|--------|-----------|
| 1 — Foundation | Done | React + Vite SPA, localStorage, PWA, UUID routing |
| 2 — Sync & Personalization | Done | Firestore real-time sync, profile tab, theme toggle |
| 3 — Audit Hardening | Done | Vitest framework, merge logic TDD, batch sync, offline persistence |
| 3.5 — Post-Hardening + UI | Done | Summit Instrument design system, dark mode fix, mobile nav |
| 4 — Security | In Progress | Firestore rules auto-deployed via CI; UID migration pending |
| 5 — Identity & Theming | Done | CSS token theme system, Night City elevator theme, username identity, dual routing |
| 6 — Challenge Revamp | Done | 30-challenge catalog, category picker, floor height presets |
| 7 — Edit Past Days | Done | Tappable log rows, past day picker, delete with undo toast |
| Next | Planned | UID migration, drop localStorage, loading animation, shareable profile URLs |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding guidelines and import conventions.
