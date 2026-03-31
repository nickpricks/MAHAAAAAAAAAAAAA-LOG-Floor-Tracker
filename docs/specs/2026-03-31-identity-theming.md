# Phase 5: Identity & Theming — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded Tailwind color classes with a CSS custom property theme system, implement the Night City: Elevator cyberpunk theme alongside the refactored Summit Instrument theme, add username-based identity with first-launch popup, and enable dual routing (UUID or username).

**Architecture:** CSS custom properties per theme set on `<html>` via theme class, consumed through Tailwind v4 `@theme` semantic color mappings. Components use semantic utility classes (`bg-surface`, `text-fg`, `text-accent`) instead of raw palette classes. TrackerTab has per-theme visual variants. Username system uses a top-level `usernames` Firestore collection for uniqueness and routing lookups.

**Tech Stack:** React 19, Tailwind CSS v4, Vite, Firebase/Firestore, react-router-dom v7, Vitest

**Spec:** `docs/specs/2026-03-30-identity-theming-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `src/utils/themes.ts` | Theme definitions (token maps, metadata), `applyTheme()` function |
| `src/utils/usernames.ts` | Username validation, auto-generation, Firestore helpers (claim/release/lookup) |
| `src/components/UsernamePopup.tsx` | First-launch modal for username + email |
| `src/utils/__tests__/themes.test.ts` | Theme utility tests |
| `src/utils/__tests__/usernames.test.ts` | Username validation tests |

### Modified Files
| File | Changes |
|------|---------|
| `src/index.css` | CSS custom property tokens per theme class, Tailwind `@theme` semantic mappings, theme-specific utility classes |
| `src/constants.ts` | Rename `THEMES` → `COLOR_MODES`, add `DEFAULT_THEME_ID`, username regex/constants |
| `src/utils/firebase.ts` | Update `UserSettings` type (theme → ThemeId, add darkMode, username), add username collection helpers |
| `src/App.tsx` | Theme application from settings, username popup rendering, dual route resolution |
| `src/components/TrackerTab.tsx` | Semantic token classes + Night City elevator variant (diamond buttons) |
| `src/components/NavigationTabs.tsx` | Semantic token classes |
| `src/components/StatsTab.tsx` | Semantic token classes |
| `src/components/ProfileTab.tsx` | Theme picker grid, editable username/email, semantic tokens |
| `src/components/HelpTab.tsx` | Semantic token classes |
| `src/components/OnboardingWarning.tsx` | Semantic token classes |
| `src/utils/useAppInitialization.ts` | Username resolution on mount, settings migration |
| `index.html` | Add Orbitron font to Google Fonts link |
| `firestore.rules` | Add `usernames` collection rules |

---

## Semantic Token Reference

This table maps CSS custom properties to Tailwind utility classes. All components use the Tailwind classes; the CSS vars resolve per theme.

| CSS Variable | Tailwind Class | Purpose |
|---|---|---|
| `--bg-primary` | `bg-surface` | Page background |
| `--bg-card` | `bg-surface-card` | Card/panel background |
| `--bg-surface` | `bg-surface-raised` | Elevated surface within cards |
| `--bg-hover` | `bg-surface-hover` | Hover state background |
| `--text-primary` | `text-fg` | Main body text |
| `--text-heading` | `text-fg-heading` | Headings |
| `--text-muted` | `text-fg-muted` | Secondary text |
| `--text-subtle` | `text-fg-subtle` | Labels, tiny text |
| `--accent` | `text-accent`, `bg-accent` | Primary accent color |
| `--accent-dim` | `text-accent-dim` | Dimmer accent variant |
| `--accent-secondary` | `text-accent-secondary` | Secondary accent (Night City violet) |
| `--border-color` | `border-line` | Card/panel borders |
| `--border-subtle` | `border-line-subtle` | Subtle dividers |

---

## Track A: Theme System

### Task 1: Theme Foundation — Types, Constants, and Theme Definitions

**Files:**
- Modify: `src/constants.ts`
- Create: `src/utils/themes.ts`
- Create: `src/utils/__tests__/themes.test.ts`
- Modify: `src/utils/firebase.ts` (UserSettings type only)

- [ ] **Step 1: Write failing tests for theme definitions**

Create `src/utils/__tests__/themes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { THEME_DEFINITIONS, type ThemeId, applyTheme, getThemeDefinition } from '@utils/themes';

describe('themes', () => {
  it('exports summit-instrument theme', () => {
    const theme = getThemeDefinition('summit-instrument');
    expect(theme).toBeDefined();
    expect(theme.name).toBe('Summit Instrument');
    expect(theme.darkOnly).toBe(false);
    expect(theme.cssClass).toBe('theme-summit-instrument');
  });

  it('exports night-city-elevator theme', () => {
    const theme = getThemeDefinition('night-city-elevator');
    expect(theme).toBeDefined();
    expect(theme.name).toBe('Night City: Elevator');
    expect(theme.darkOnly).toBe(true);
    expect(theme.cssClass).toBe('theme-night-city-elevator');
  });

  it('every theme has required preview colors', () => {
    Object.values(THEME_DEFINITIONS).forEach((theme) => {
      expect(theme.previewColors.bg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.previewColors.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.previewColors.text).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('every theme has a unique cssClass', () => {
    const classes = Object.values(THEME_DEFINITIONS).map(t => t.cssClass);
    expect(new Set(classes).size).toBe(classes.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/utils/__tests__/themes.test.ts`
Expected: FAIL — module `@utils/themes` does not exist

- [ ] **Step 3: Update constants.ts**

In `src/constants.ts`, rename `THEMES` to `COLOR_MODES` and add theme/username constants:

```ts
// Replace:
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// With:
export const COLOR_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type ColorMode = typeof COLOR_MODES[keyof typeof COLOR_MODES];

export const DEFAULT_THEME_ID = 'summit-instrument';

// Username constants
export const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_AUTO_PREFIX = 'climber-';
```

- [ ] **Step 4: Update ProfileTab.tsx import**

In `src/components/ProfileTab.tsx`, change:
```ts
// Old:
import { CHALLENGES, THEMES } from '@/constants';
// New:
import { CHALLENGES, COLOR_MODES } from '@/constants';
```

And replace all `THEMES.LIGHT` → `COLOR_MODES.LIGHT`, `THEMES.DARK` → `COLOR_MODES.DARK`, `THEMES.SYSTEM` → `COLOR_MODES.SYSTEM` in the same file.

- [ ] **Step 5: Create themes.ts**

Create `src/utils/themes.ts`:

```ts
export type ThemeId = 'summit-instrument' | 'night-city-elevator';

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  family: string;
  darkOnly: boolean;
  fonts: { display: string; body: string };
  cssClass: string;
  previewColors: { bg: string; accent: string; text: string };
};

export const THEME_DEFINITIONS: Record<ThemeId, ThemeDefinition> = {
  'summit-instrument': {
    id: 'summit-instrument',
    name: 'Summit Instrument',
    family: 'Summit',
    darkOnly: false,
    fonts: { display: 'Syne', body: 'system-ui' },
    cssClass: 'theme-summit-instrument',
    previewColors: { bg: '#faf7f2', accent: '#f59e0b', text: '#1a1613' },
  },
  'night-city-elevator': {
    id: 'night-city-elevator',
    name: 'Night City: Elevator',
    family: 'Cyberpunk',
    darkOnly: true,
    fonts: { display: 'Orbitron', body: 'JetBrains Mono' },
    cssClass: 'theme-night-city-elevator',
    previewColors: { bg: '#0a0a0f', accent: '#00f0ff', text: '#c0c0c8' },
  },
};

export function getThemeDefinition(id: ThemeId): ThemeDefinition {
  return THEME_DEFINITIONS[id];
}

export function isValidThemeId(value: string): value is ThemeId {
  return value in THEME_DEFINITIONS;
}

export function applyTheme(themeId: ThemeId, colorMode: 'light' | 'dark' | 'system') {
  const theme = THEME_DEFINITIONS[themeId];
  const root = document.documentElement;

  // Remove all theme classes
  Object.values(THEME_DEFINITIONS).forEach(t => root.classList.remove(t.cssClass));

  // Apply new theme class
  root.classList.add(theme.cssClass);

  // Handle dark mode
  if (theme.darkOnly) {
    root.classList.add('dark');
  } else if (colorMode === 'dark') {
    root.classList.add('dark');
  } else if (colorMode === 'light') {
    root.classList.remove('dark');
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  }
}
```

- [ ] **Step 6: Update UserSettings type in firebase.ts**

In `src/utils/firebase.ts`, update the `UserSettings` type:

```ts
// Old:
export type UserSettings = {
  theme?: 'light' | 'dark' | 'system';
  defaultChallenge?: string;
  email?: string;
  updatedAt?: number;
};

// New:
import type { ThemeId } from '@utils/themes';

export type UserSettings = {
  theme?: ThemeId | 'light' | 'dark' | 'system'; // ThemeId preferred; legacy values migrated on read
  colorMode?: 'light' | 'dark' | 'system';
  defaultChallenge?: string;
  email?: string;
  username?: string;
  updatedAt?: number;
};
```

Note: The union with legacy values (`'light' | 'dark' | 'system'`) allows reading old settings without breaking. Migration logic is in Task 7.

- [ ] **Step 7: Run tests to verify they pass**

Run: `bunx vitest run src/utils/__tests__/themes.test.ts`
Expected: PASS (all 4 tests)

Also run type check: `bun run lint`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/utils/themes.ts src/utils/__tests__/themes.test.ts src/constants.ts src/utils/firebase.ts src/components/ProfileTab.tsx
git commit -m "feat(themes): add theme type definitions, constants, and theme registry"
```

---

### Task 2: CSS Custom Property System — Summit Instrument Tokens

**Files:**
- Modify: `src/index.css`

This task defines the CSS custom property layer for the Summit Instrument theme (light + dark) and wires it into Tailwind v4's `@theme` as semantic color utilities. No components are changed yet — this task only sets up the token infrastructure.

- [ ] **Step 1: Replace the @theme block and add theme token system**

Replace the full contents of `src/index.css` with:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

/* ═══════════════════════════════════════════════════════════════
   Theme Token System
   Each theme class defines CSS custom properties.
   Tailwind @theme maps these to semantic utility classes.
   ═══════════════════════════════════════════════════════════════ */

/* ── Summit Instrument — Light ─────────────────────────────── */

.theme-summit-instrument {
  --bg-primary: #faf7f2;
  --bg-card: #ffffff;
  --bg-surface: #faf7f2;
  --bg-hover: #f0ebe1;
  --text-primary: #1a1613;
  --text-heading: #2a2520;
  --text-muted: #847766;
  --text-subtle: #a6997f;
  --accent: #f59e0b;
  --accent-dim: #d97706;
  --accent-secondary: #d97706;
  --accent-glow: rgba(245, 158, 11, 0.3);
  --border-color: #e0d8ca;
  --border-subtle: #f0ebe1;
  --font-theme-display: 'Syne', ui-sans-serif, system-ui, sans-serif;
  --font-theme-mono: 'JetBrains Mono', ui-monospace, monospace;
}

/* ── Summit Instrument — Dark ──────────────────────────────── */

.theme-summit-instrument.dark {
  --bg-primary: #0c0a09;
  --bg-card: #1a1613;
  --bg-surface: #2a2520;
  --bg-hover: #2a2520;
  --text-primary: #f0ebe1;
  --text-heading: #faf7f2;
  --text-muted: #a6997f;
  --text-subtle: #635850;
  --accent: #fbbf24;
  --accent-dim: #f59e0b;
  --accent-secondary: #f59e0b;
  --accent-glow: rgba(251, 191, 36, 0.4);
  --border-color: #2a2520;
  --border-subtle: #453d36;
}

/* ── Night City: Elevator (dark-only) ──────────────────────── */

.theme-night-city-elevator {
  --bg-primary: #0a0a0f;
  --bg-card: #12121f;
  --bg-surface: #1a1a2e;
  --bg-hover: #1e1e3a;
  --text-primary: #c0c0c8;
  --text-heading: #e0e0e8;
  --text-muted: #666680;
  --text-subtle: #44445a;
  --accent: #00f0ff;
  --accent-dim: #00c0cc;
  --accent-secondary: #b14eff;
  --accent-glow: rgba(0, 240, 255, 0.3);
  --accent-hot: #ff6b2e;
  --border-color: #1e1e3a;
  --border-subtle: #2a2a3a;
  --font-theme-display: 'Orbitron', ui-sans-serif, system-ui, sans-serif;
  --font-theme-mono: 'JetBrains Mono', ui-monospace, monospace;
}

/* ═══════════════════════════════════════════════════════════════
   Tailwind v4 @theme — Semantic Token Mappings
   ═══════════════════════════════════════════════════════════════ */

@theme {
  /* Semantic surface colors */
  --color-surface: var(--bg-primary);
  --color-surface-card: var(--bg-card);
  --color-surface-raised: var(--bg-surface);
  --color-surface-hover: var(--bg-hover);

  /* Semantic foreground (text) colors */
  --color-fg: var(--text-primary);
  --color-fg-heading: var(--text-heading);
  --color-fg-muted: var(--text-muted);
  --color-fg-subtle: var(--text-subtle);

  /* Accent colors */
  --color-accent: var(--accent);
  --color-accent-dim: var(--accent-dim);
  --color-accent-secondary: var(--accent-secondary);

  /* Border colors */
  --color-line: var(--border-color);
  --color-line-subtle: var(--border-subtle);

  /* Theme-aware fonts */
  --font-display: var(--font-theme-display);
  --font-mono: var(--font-theme-mono);

  /* Keep zinc overrides for non-themed contexts (dev panel, etc.) */
  --color-zinc-50:  #faf7f2;
  --color-zinc-100: #f0ebe1;
  --color-zinc-200: #e0d8ca;
  --color-zinc-300: #c7bbaa;
  --color-zinc-400: #a6997f;
  --color-zinc-500: #847766;
  --color-zinc-600: #635850;
  --color-zinc-700: #453d36;
  --color-zinc-800: #2a2520;
  --color-zinc-900: #1a1613;
  --color-zinc-950: #0c0a09;

  /* Amber accent (kept for non-themed contexts) */
  --color-amber-400: #fbbf24;
  --color-amber-500: #f59e0b;
  --color-amber-600: #d97706;

  /* Animations */
  --animate-spin-slow: spin 3s linear infinite;
  --animate-glow: glow 2s ease-in-out infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* ── Background Patterns (per-theme) ──────────────────────────── */

.theme-summit-instrument .bg-topo {
  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='topo' width='200' height='200' patternUnits='userSpaceOnUse'%3E%3Cpath d='M100 20 Q130 40 120 80 Q110 100 140 120 Q170 140 150 170 Q130 200 100 180 Q70 160 60 130 Q50 100 80 80 Q100 60 100 20Z' fill='none' stroke='%23a6997f' stroke-width='0.5' opacity='0.08'/%3E%3Cpath d='M40 10 Q60 30 50 60 Q40 80 70 100 Q100 120 80 150 Q60 180 30 160 Q0 140 10 110 Q20 80 0 60 Q-10 40 40 10Z' fill='none' stroke='%23a6997f' stroke-width='0.5' opacity='0.06'/%3E%3Cpath d='M160 0 Q190 20 180 50 Q170 70 190 90 Q210 110 190 140 Q170 170 150 150 Q130 130 140 100 Q150 70 130 50 Q120 30 160 0Z' fill='none' stroke='%23a6997f' stroke-width='0.5' opacity='0.05'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23topo)'/%3E%3C/svg%3E");
}

.theme-summit-instrument.dark .bg-topo {
  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='topo' width='200' height='200' patternUnits='userSpaceOnUse'%3E%3Cpath d='M100 20 Q130 40 120 80 Q110 100 140 120 Q170 140 150 170 Q130 200 100 180 Q70 160 60 130 Q50 100 80 80 Q100 60 100 20Z' fill='none' stroke='%23453d36' stroke-width='0.5' opacity='0.3'/%3E%3Cpath d='M40 10 Q60 30 50 60 Q40 80 70 100 Q100 120 80 150 Q60 180 30 160 Q0 140 10 110 Q20 80 0 60 Q-10 40 40 10Z' fill='none' stroke='%23453d36' stroke-width='0.5' opacity='0.2'/%3E%3Cpath d='M160 0 Q190 20 180 50 Q170 70 190 90 Q210 110 190 140 Q170 170 150 150 Q130 130 140 100 Q150 70 130 50 Q120 30 160 0Z' fill='none' stroke='%23453d36' stroke-width='0.5' opacity='0.15'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23topo)'/%3E%3C/svg%3E");
}

.theme-night-city-elevator .bg-topo {
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 3px,
    rgba(255,255,255,0.015) 3px,
    rgba(255,255,255,0.015) 4px
  );
}

/* ── Theme-Aware Utility Classes ──────────────────────────────── */

.font-display { font-family: var(--font-theme-display); }
.font-mono    { font-family: var(--font-theme-mono); }

.altitude-readout {
  font-family: var(--font-theme-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}

.altitude-glow {
  text-shadow: 0 0 40px var(--accent-glow), 0 0 80px color-mix(in srgb, var(--accent-glow) 33%, transparent);
}

/* ── Summit: Brass Button ─────────────────────────────────────── */

.btn-brass {
  background: linear-gradient(145deg, #f59e0b, #d97706);
  box-shadow:
    0 1px 0 0 rgba(255,255,255,0.15) inset,
    0 4px 12px rgba(217, 119, 6, 0.3),
    0 1px 3px rgba(0,0,0,0.2);
  transition: all 0.15s ease;
}

.btn-brass:hover {
  background: linear-gradient(145deg, #fbbf24, #f59e0b);
  box-shadow:
    0 1px 0 0 rgba(255,255,255,0.2) inset,
    0 6px 20px rgba(217, 119, 6, 0.4),
    0 2px 6px rgba(0,0,0,0.2);
}

.btn-brass:active {
  transform: scale(0.95);
  box-shadow:
    0 1px 0 0 rgba(255,255,255,0.1) inset,
    0 2px 6px rgba(217, 119, 6, 0.3);
}

/* ── Night City: Diamond Elevator Buttons ─────────────────────── */

.btn-elevator {
  transform: rotate(45deg);
  border: 2px solid #2a2a3a;
  background: linear-gradient(135deg, #1a1a2e, #0a0a0f);
  box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.1);
  transition: all 0.2s ease;
}

.btn-elevator > * {
  transform: rotate(-45deg);
}

.btn-elevator-up:hover {
  border-color: #00f0ff;
  box-shadow:
    inset 0 0 20px rgba(0, 240, 255, 0.15),
    0 0 20px rgba(0, 240, 255, 0.2);
}

.btn-elevator-down {
  box-shadow: inset 0 0 20px rgba(58, 106, 138, 0.15);
}

.btn-elevator-down:hover {
  border-color: #3a6a8a;
  box-shadow:
    inset 0 0 20px rgba(58, 106, 138, 0.2),
    0 0 15px rgba(58, 106, 138, 0.15);
}

.btn-elevator:active {
  transform: rotate(45deg) scale(0.92);
}

/* ── Night City: Seam Line ────────────────────────────────────── */

.elevator-seam {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 240, 255, 0.1) 30%,
    rgba(0, 240, 255, 0.05) 70%,
    transparent 100%
  );
  pointer-events: none;
}

/* ── Markdown styles ──────────────────────────────────────────── */

@layer utilities {
  .markdown-body h1 { @apply text-3xl font-black mb-6 text-fg-heading; }
  .markdown-body h2 { @apply text-xl font-bold mt-8 mb-4 text-fg-heading; }
  .markdown-body h3 { @apply text-lg font-bold mt-6 mb-3 text-fg-heading; }
  .markdown-body p { @apply mb-4 text-fg-muted leading-relaxed; }
  .markdown-body ul { @apply list-disc pl-5 mb-6 text-fg-muted space-y-2; }
  .markdown-body li { @apply pl-1; }
  .markdown-body hr { @apply my-8 border-line; }
  .markdown-body strong { @apply font-bold text-fg; }
}
```

- [ ] **Step 2: Verify CSS compiles and dev server starts**

Run: `bun run lint`
Expected: PASS

Run: `bun run build`
Expected: PASS (CSS compiles without errors)

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(themes): add CSS custom property token system with Summit + Night City definitions"
```

---

### Task 3: Component Token Migration — NavigationTabs and App Shell

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/NavigationTabs.tsx`

This task migrates the app shell and navigation from hardcoded Tailwind palette classes to semantic token classes. The visual result is identical when `theme-summit-instrument` class is on `<html>`.

**Class migration reference** (used in this and subsequent tasks):

| Old Class | New Class |
|---|---|
| `bg-zinc-50 dark:bg-zinc-950` | `bg-surface` |
| `bg-white dark:bg-zinc-900` | `bg-surface-card` |
| `bg-zinc-50 dark:bg-zinc-800` | `bg-surface-raised` |
| `hover:bg-zinc-100 dark:hover:bg-zinc-800` | `hover:bg-surface-hover` |
| `border-zinc-200 dark:border-zinc-800` | `border-line` |
| `border-zinc-100 dark:border-zinc-700` | `border-line-subtle` |
| `text-zinc-900 dark:text-zinc-100` | `text-fg` |
| `text-zinc-800 dark:text-zinc-200` or `text-zinc-800 dark:text-zinc-100` | `text-fg-heading` |
| `text-zinc-500 dark:text-zinc-400` | `text-fg-muted` |
| `text-zinc-400 dark:text-zinc-500` | `text-fg-subtle` |
| `text-zinc-300 dark:text-zinc-600` | `text-fg-subtle` |
| `text-amber-600 dark:text-amber-400` | `text-accent` |
| `bg-amber-500` | `bg-accent` |
| `shadow-amber-500/20` | `shadow-accent/20` |

- [ ] **Step 1: Update App.tsx — add theme class on mount + migrate shell classes**

In `src/App.tsx`, the `MainApp` component's theme effect and outer div need updating.

Replace the theme monitoring effect:
```tsx
// Old:
React.useEffect(() => {
  const theme = settings.theme || 'system';
  const root = window.document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  }
}, [settings.theme]);

// New:
import { applyTheme, isValidThemeId } from '@utils/themes';
import { DEFAULT_THEME_ID } from '@/constants';

React.useEffect(() => {
  const themeId = isValidThemeId(settings.theme ?? '') ? settings.theme! as import('@utils/themes').ThemeId : DEFAULT_THEME_ID;
  const colorMode = settings.colorMode || 'system';
  applyTheme(themeId, colorMode);
}, [settings.theme, settings.colorMode]);
```

Replace the outer div classes:
```tsx
// Old:
<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 bg-topo flex flex-col items-center py-8 px-4 font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-300">

// New:
<div className="min-h-screen bg-surface bg-topo flex flex-col items-center py-8 px-4 font-sans text-fg transition-colors duration-300">
```

- [ ] **Step 2: Update App.tsx — root element default theme class**

In the `App()` component (not MainApp), ensure theme class is set early. Add to the top of the `App` function:

```tsx
export default function App() {
  // Set default theme class on <html> before first render
  React.useEffect(() => {
    const root = document.documentElement;
    if (!root.className.includes('theme-')) {
      root.classList.add('theme-summit-instrument');
    }
  }, []);

  const storedId = localStorage.getItem('maha_user_id');
  // ... rest unchanged
```

- [ ] **Step 3: Update NavigationTabs.tsx**

Replace the full component with semantic token classes:

```tsx
import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, User } from 'lucide-react';
import { TABS, TabType } from '@/constants';
import type { SyncStatus } from '@utils/firebase';

type Props = {
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  syncStatus: SyncStatus;
};

const syncDot: Record<SyncStatus, string> = {
  synced: 'bg-emerald-400',
  syncing: 'bg-blue-400 animate-pulse',
  error: 'bg-red-400',
  offline: 'bg-zinc-400',
};

export default function NavigationTabs({ activeTab, setActiveTab, syncStatus }: Props) {

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'offline':
        return <CloudOff className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Cloud className="w-3.5 h-3.5 text-fg-subtle" />;
    }
  };

  const tabClass = (tab: TabType) =>
    `px-3 sm:px-5 py-2 rounded-full text-sm font-display font-bold transition-all whitespace-nowrap ${
      activeTab === tab
        ? 'bg-accent text-surface shadow-md shadow-accent/20'
        : 'text-fg-muted hover:text-fg hover:bg-surface-hover'
    }`;

  return (
    <div className="flex items-center gap-1.5 bg-surface-card p-1.5 rounded-full shadow-sm border border-line mb-8 max-w-full">
      {/* Sync status indicator — compact dot on mobile, icon on larger screens */}
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        title={`Sync: ${syncStatus}`}
      >
        <span className="sm:hidden relative flex h-2.5 w-2.5">
          {syncStatus === 'syncing' && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${syncDot[syncStatus]}`} />
        </span>
        <span className="hidden sm:flex">
          {getSyncIcon()}
        </span>
      </div>

      <button onClick={() => setActiveTab(TABS.TRACKER)} className={tabClass(TABS.TRACKER)}>
        Tracker
      </button>
      <button onClick={() => setActiveTab(TABS.STATS)} className={tabClass(TABS.STATS)}>
        Stats
      </button>
      <button onClick={() => setActiveTab(TABS.HELP)} className={tabClass(TABS.HELP)}>
        Help
      </button>
      <button
        onClick={() => setActiveTab(TABS.PROFILE)}
        className={`${tabClass(TABS.PROFILE)} flex items-center gap-1.5`}
      >
        <User size={14} />
        <span className="hidden sm:inline">Profile</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Verify type check and build**

Run: `bun run lint`
Expected: PASS

Run: `bun run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/NavigationTabs.tsx
git commit -m "feat(themes): migrate App shell and NavigationTabs to semantic token classes"
```

---

### Task 4: Component Token Migration — StatsTab, HelpTab, OnboardingWarning

**Files:**
- Modify: `src/components/StatsTab.tsx`
- Modify: `src/components/HelpTab.tsx`
- Modify: `src/components/OnboardingWarning.tsx`

This task migrates remaining components to semantic token classes. **TrackerTab and ProfileTab are NOT migrated here** — they get complete rewrites in Task 5 (TrackerTab + elevator variant) and Task 7 (ProfileTab + theme picker) respectively, which include the token migration. Only color/border/text classes change; layout, spacing, and animation classes are untouched.

- [ ] **Step 1: Migrate StatsTab.tsx**

Apply these replacements:
- `bg-white dark:bg-zinc-900` → `bg-surface-card`
- `border-zinc-200 dark:border-zinc-800` → `border-line`
- `text-zinc-800 dark:text-zinc-100` → `text-fg-heading`
- `text-zinc-500 dark:text-zinc-400` → `text-fg-muted`
- `bg-zinc-50 dark:bg-zinc-800` → `bg-surface-raised`
- `border-zinc-100 dark:border-zinc-800` → `border-line-subtle`
- `text-zinc-600 dark:text-zinc-300` → `text-fg`
- `text-zinc-400 dark:text-zinc-500` → `text-fg-subtle`
- `text-amber-600 dark:text-amber-400` → `text-accent`
- `border-zinc-200 dark:border-zinc-700` → `border-line`
- `border-zinc-100 dark:border-zinc-800` (divider) → `border-line-subtle`
- `bg-zinc-100 dark:bg-zinc-800` (progress track) → `bg-surface-raised`
- `border-zinc-200/50 dark:border-zinc-700/50` → `border-line/50`
- `bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500` → `bg-gradient-to-r from-accent via-accent to-accent`
- `hover:text-blue-500 hover:border-blue-200` → keep as-is (action buttons, not themed)
- Info modal: `bg-white/90 dark:bg-zinc-900/90` → `bg-surface-card/90`
- Fun facts cards (orange/yellow/blue backgrounds): keep as-is (these are decorative/semantic, not theme-token)

- [ ] **Step 3: Migrate HelpTab.tsx**

Read the file first, then apply the same pattern: all `dark:` zinc/amber classes become semantic tokens. The markdown-body classes were already updated in the CSS (Task 2), so only the component wrapper/container classes need updating.

- [ ] **Step 4: Migrate OnboardingWarning.tsx**

Read the file first, then apply the same pattern.

- [ ] **Step 5: Verify type check, tests, and build**

Run: `bun run lint`
Expected: PASS

Run: `bun run test`
Expected: PASS (no test changes, just class changes)

Run: `bun run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/StatsTab.tsx src/components/HelpTab.tsx src/components/OnboardingWarning.tsx
git commit -m "feat(themes): migrate StatsTab, HelpTab, OnboardingWarning to semantic token classes"
```

---

### Task 5: Night City: Elevator — Fonts and TrackerTab Variant

**Files:**
- Modify: `index.html`
- Modify: `src/components/TrackerTab.tsx`
- Modify: `src/utils/themes.ts`

- [ ] **Step 1: Add Orbitron font to index.html**

In `index.html`, update the Google Fonts link to include Orbitron:

```html
<!-- Old: -->
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

<!-- New: -->
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Add useActiveThemeId hook to themes.ts**

Add to `src/utils/themes.ts`:

```ts
import { useState, useEffect } from 'react';

export function useActiveThemeId(): ThemeId {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const root = document.documentElement;
    for (const theme of Object.values(THEME_DEFINITIONS)) {
      if (root.classList.contains(theme.cssClass)) return theme.id;
    }
    return 'summit-instrument';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      for (const theme of Object.values(THEME_DEFINITIONS)) {
        if (root.classList.contains(theme.cssClass)) {
          setThemeId(theme.id);
          return;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return themeId;
}
```

- [ ] **Step 3: Add Night City TrackerTab variant**

In `src/components/TrackerTab.tsx`, add the theme-aware tracker. The component conditionally renders based on the active theme:

```tsx
import { motion, useAnimationControls } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { DailyRecord } from '@/types';
import { getDayName, getFormattedDate } from '@utils/date';
import { TRACKER_UI } from '@/constants';
import { useActiveThemeId } from '@utils/themes';

type Props = {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  sortedRecords: DailyRecord[];
};

function SummitTracker({ todayTotal, handleTap, counterControls, upControls, downControls, fontSize }: {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  counterControls: ReturnType<typeof useAnimationControls>;
  upControls: ReturnType<typeof useAnimationControls>;
  downControls: ReturnType<typeof useAnimationControls>;
  fontSize: string;
}) {
  const onTap = (type: 'up' | 'down') => {
    navigator.vibrate?.(20);
    counterControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.2, ease: 'easeOut' } });
    const btnControls = type === 'up' ? upControls : downControls;
    btnControls.start({ scale: [1, 0.92, 1], transition: { duration: 0.25 } });
    handleTap(type);
  };

  return (
    <div className="relative bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
      {/* Decorative contour rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
        <div className="w-[500px] h-[500px] rounded-full border border-accent" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-accent" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-accent" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-accent" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
          Today&rsquo;s Altitude
        </div>

        <motion.button
          onClick={() => onTap('up')}
          animate={upControls}
          className="btn-brass w-16 h-16 rounded-full flex items-center justify-center text-zinc-900"
        >
          <ChevronUp size={26} strokeWidth={2.5} />
        </motion.button>

        <div className="h-40 flex items-center justify-center my-3">
          <motion.div
            animate={counterControls}
            style={{ fontSize }}
            className="altitude-readout altitude-glow leading-none font-bold text-fg-heading transition-all duration-300"
          >
            {todayTotal}
          </motion.div>
        </div>

        <motion.button
          onClick={() => onTap('down')}
          animate={downControls}
          className="w-16 h-16 bg-surface-raised hover:bg-surface-hover rounded-full flex items-center justify-center text-fg-muted transition-colors shadow-sm border border-line-subtle"
        >
          <ChevronDown size={26} strokeWidth={2.5} />
        </motion.button>

        <div className="mt-6 font-mono text-[10px] text-fg-subtle tracking-widest uppercase">
          floors
        </div>
      </div>
    </div>
  );
}

function ElevatorTracker({ todayTotal, handleTap, counterControls, upControls, downControls, fontSize }: {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  counterControls: ReturnType<typeof useAnimationControls>;
  upControls: ReturnType<typeof useAnimationControls>;
  downControls: ReturnType<typeof useAnimationControls>;
  fontSize: string;
}) {
  const onTap = (type: 'up' | 'down') => {
    navigator.vibrate?.(20);
    counterControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.2, ease: 'easeOut' } });
    const btnControls = type === 'up' ? upControls : downControls;
    btnControls.start({ scale: [1, 0.92, 1], transition: { duration: 0.25 } });
    handleTap(type);
  };

  return (
    <div className="relative bg-surface-card p-8 rounded-2xl shadow-lg border border-line flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
      {/* Brushed metal texture + elevator seam */}
      <div className="absolute inset-0 bg-topo pointer-events-none" />
      <div className="elevator-seam" />

      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
          Floor Indicator
        </div>

        {/* Diamond Up Button */}
        <motion.button
          onClick={() => onTap('up')}
          animate={upControls}
          className="btn-elevator btn-elevator-up w-14 h-14 flex items-center justify-center text-accent"
        >
          <ChevronUp size={24} strokeWidth={2.5} />
        </motion.button>

        {/* Floor Count Display */}
        <div className="h-40 flex items-center justify-center my-3">
          <motion.div
            animate={counterControls}
            style={{ fontSize }}
            className="altitude-readout altitude-glow leading-none font-bold text-accent transition-all duration-300"
          >
            {todayTotal}
          </motion.div>
        </div>

        {/* Diamond Down Button */}
        <motion.button
          onClick={() => onTap('down')}
          animate={downControls}
          className="btn-elevator btn-elevator-down w-14 h-14 flex items-center justify-center text-accent-secondary"
        >
          <ChevronDown size={24} strokeWidth={2.5} />
        </motion.button>

        <div className="mt-6 font-mono text-[10px] text-fg-subtle tracking-widest uppercase">
          floors
        </div>
      </div>
    </div>
  );
}

export default function TrackerTab({ todayTotal, handleTap, sortedRecords }: Props) {
  const counterControls = useAnimationControls();
  const upControls = useAnimationControls();
  const downControls = useAnimationControls();
  const themeId = useActiveThemeId();

  const { MIN_FONT_REM, MAX_FONT_REM, MAX_SCALE_FLOORS } = TRACKER_UI;
  const fontSize = `${MIN_FONT_REM + (MAX_FONT_REM - MIN_FONT_REM) * (Math.min(todayTotal, MAX_SCALE_FLOORS) / MAX_SCALE_FLOORS)}rem`;

  const trackerProps = { todayTotal, handleTap, counterControls, upControls, downControls, fontSize };

  return (
    <>
      {themeId === 'night-city-elevator'
        ? <ElevatorTracker {...trackerProps} />
        : <SummitTracker {...trackerProps} />
      }

      {/* History List */}
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
                {sortedRecords.map((record) => (
                  <tr key={record.dateStr} className="hover:bg-surface-hover transition-colors">
                    <td className="p-4 text-sm font-medium text-fg">{getDayName(record.dateStr)}</td>
                    <td className="p-4 text-sm text-fg-muted font-mono">{getFormattedDate(record.dateStr)}</td>
                    <td className="p-4 text-base font-bold text-accent text-right font-mono tabular-nums">{record.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Verify type check and build**

Run: `bun run lint`
Expected: PASS

Run: `bun run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.html src/components/TrackerTab.tsx src/utils/themes.ts
git commit -m "feat(themes): add Night City elevator tracker variant with diamond buttons and Orbitron font"
```

---

### Task 6: Theme Application Logic and Settings Migration

**Files:**
- Modify: `src/utils/useAppInitialization.ts`

This task adds settings migration logic so that existing users with `theme: 'light'|'dark'|'system'` get migrated to the new schema (`theme: ThemeId` + `colorMode`).

- [ ] **Step 1: Add migration logic in useAppInitialization.ts**

In `src/utils/useAppInitialization.ts`, update the settings subscription handler:

```ts
import { isValidThemeId } from '@utils/themes';
import { DEFAULT_THEME_ID } from '@/constants';

// Inside the init() function, update the settings subscription:
unsubscribeSettings = subscribeToUserSettings(activeId, (cloudSettings) => {
  // Migrate legacy theme values (light/dark/system) to new schema
  const migrated = { ...cloudSettings };
  if (migrated.theme && !isValidThemeId(migrated.theme)) {
    // Old value was a color mode, not a theme ID
    migrated.colorMode = migrated.theme as 'light' | 'dark' | 'system';
    migrated.theme = DEFAULT_THEME_ID;
    // Persist migration
    saveUserSettings(activeId, { theme: migrated.theme, colorMode: migrated.colorMode });
  }
  setSettings(prev => ({ ...prev, ...migrated }));
});
```

- [ ] **Step 2: Verify type check**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/utils/useAppInitialization.ts
git commit -m "feat(themes): add settings migration from legacy theme values to new theme+colorMode schema"
```

---

### Task 7: Theme Picker and Color Mode Toggle in ProfileTab

**Files:**
- Modify: `src/components/ProfileTab.tsx`

This task replaces the old Light/Dark/Device toggle with a theme picker grid and a separate color mode toggle (visible only for themes that support light/dark).

- [ ] **Step 1: Rewrite ProfileTab with theme picker**

```tsx
import React from 'react';
import { User, Moon, Sun, Monitor, Hash, ShieldCheck, Trophy, Palette } from 'lucide-react';
import { CHALLENGES, COLOR_MODES, DEFAULT_THEME_ID, type ColorMode } from '@/constants';
import { UserSettings } from '@utils/firebase';
import { THEME_DEFINITIONS, type ThemeId, isValidThemeId, getThemeDefinition } from '@utils/themes';

type Props = {
  userId: string | null;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
};

export default function ProfileTab({ userId, settings, updateSettings }: Props) {
  const currentThemeId: ThemeId = isValidThemeId(settings.theme ?? '') ? settings.theme as ThemeId : DEFAULT_THEME_ID;
  const currentColorMode: ColorMode = settings.colorMode || COLOR_MODES.SYSTEM;
  const currentChallenge = settings.defaultChallenge || CHALLENGES[4].id;
  const currentTheme = getThemeDefinition(currentThemeId);

  const colorModes: { id: ColorMode; name: string; icon: typeof Sun }[] = [
    { id: COLOR_MODES.LIGHT, name: 'Light', icon: Sun },
    { id: COLOR_MODES.DARK, name: 'Dark', icon: Moon },
    { id: COLOR_MODES.SYSTEM, name: 'Device', icon: Monitor },
  ];

  return (
    <div className="w-full max-w-sm bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <div className="w-20 h-20 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4 border border-line text-fg-subtle">
          <User size={40} />
        </div>
        <h2 className="text-2xl font-display font-extrabold text-fg-heading">Your Profile</h2>
        <p className="text-sm text-fg-muted mt-1">Synced across your devices</p>
      </div>

      {/* User ID Section */}
      <div className="bg-surface-raised p-4 rounded-2xl border border-line-subtle">
        <div className="flex items-center gap-2 mb-2 text-fg-subtle">
          <Hash size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Unique Identifier</span>
        </div>
        <code className="text-[10px] break-all text-fg font-mono bg-surface p-2 rounded-lg border border-line block">
          {userId || 'Loading...'}
        </code>
        <div className="flex items-center gap-1.5 mt-3 text-green-600">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold">Cloud Synced & Anonymous</span>
        </div>
      </div>

      {/* Theme Selection */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
          <Palette size={14} /> Theme
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(THEME_DEFINITIONS).map((theme) => {
            const active = currentThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  active
                    ? 'border-accent shadow-md shadow-accent/20 ring-1 ring-accent'
                    : 'border-line hover:border-line-subtle bg-surface-card'
                }`}
              >
                {/* Theme preview swatch */}
                <div
                  className="w-full h-12 rounded-lg border border-line/50 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: theme.previewColors.bg }}
                >
                  <span
                    className="text-lg font-bold font-display"
                    style={{ color: theme.previewColors.accent }}
                  >
                    42
                  </span>
                </div>
                <span className="text-[11px] font-bold text-fg" style={active ? { color: 'var(--accent)' } : undefined}>
                  {theme.name}
                </span>
                <span className="text-[9px] text-fg-subtle">{theme.family}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Color Mode — only for themes that support light/dark */}
      {!currentTheme.darkOnly && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
            <Monitor size={14} /> Appearance
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {colorModes.map((m) => {
              const Icon = m.icon;
              const active = currentColorMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => updateSettings({ colorMode: m.id })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    active
                      ? 'bg-accent border-accent text-surface shadow-md shadow-accent/20'
                      : 'bg-surface-card border-line text-fg-muted hover:border-line'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] font-bold">{m.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Default Challenge */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
          <Trophy size={14} /> Default Goal
        </h3>
        <select
          value={currentChallenge}
          onChange={(e) => updateSettings({ defaultChallenge: e.target.value })}
          className="w-full bg-surface-raised border border-line text-fg text-sm font-bold rounded-xl focus:ring-accent focus:border-accent block p-3 cursor-pointer shadow-sm"
        >
          {CHALLENGES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name} ({c.meters}m)
            </option>
          ))}
        </select>
        <p className="text-[10px] text-fg-subtle mt-2 px-1">
          This challenge will be shown by default on your stats dashboard.
        </p>
      </section>

      <div className="mt-4 pt-6 border-t border-line-subtle text-center">
        <p className="text-[10px] text-fg-subtle font-medium">
          Floor Tracker v0.0.5 • Open Source
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type check and build**

Run: `bun run lint`
Expected: PASS

Run: `bun run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ProfileTab.tsx
git commit -m "feat(themes): add theme picker grid and color mode toggle to ProfileTab"
```

---

### Task 8: Visual Verification — Track A Checkpoint

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `bun run test`
Expected: ALL PASS

- [ ] **Step 2: Run type check**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Manual visual check**

Run: `bun run dev`

Verify in browser:
1. Navigate to `http://localhost:3000`
2. Confirm Summit Instrument theme renders identically to before (warm stone, amber accent)
3. Open Profile tab → verify theme picker shows two themes
4. Select "Night City: Elevator" → verify:
   - Page background turns void black (#0a0a0f)
   - Cards turn dark (#12121f)
   - Text turns light (#c0c0c8)
   - Accent turns cyan (#00f0ff)
   - Tracker shows diamond buttons with cyan/violet glow
   - Light/Dark toggle disappears (dark-only theme)
   - Fonts switch to Orbitron (display) and JetBrains Mono (body)
5. Switch back to Summit Instrument → verify everything returns to normal
6. Test Light/Dark/System toggle on Summit theme

If issues found, fix them before proceeding.

- [ ] **Step 5: Commit any visual fixes**

Only if fixes were needed:
```bash
git add -A
git commit -m "fix(themes): visual adjustments from manual theme verification"
```

---

## Track B: Identity System

### Task 9: Username Validation Utilities

**Files:**
- Create: `src/utils/usernames.ts`
- Create: `src/utils/__tests__/usernames.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/__tests__/usernames.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateUsername, generateAutoUsername } from '@utils/usernames';

describe('validateUsername', () => {
  it('accepts valid usernames', () => {
    expect(validateUsername('climber-7f3a')).toEqual({ valid: true });
    expect(validateUsername('alice')).toEqual({ valid: true });
    expect(validateUsername('my-name-123')).toEqual({ valid: true });
    expect(validateUsername('abc')).toEqual({ valid: true });
  });

  it('rejects too short', () => {
    const result = validateUsername('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('3');
  });

  it('rejects too long', () => {
    const result = validateUsername('a'.repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('20');
  });

  it('rejects uppercase', () => {
    const result = validateUsername('Alice');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('rejects starting with hyphen', () => {
    const result = validateUsername('-alice');
    expect(result.valid).toBe(false);
  });

  it('rejects ending with hyphen', () => {
    const result = validateUsername('alice-');
    expect(result.valid).toBe(false);
  });

  it('rejects special characters', () => {
    const result = validateUsername('alice@bob');
    expect(result.valid).toBe(false);
  });

  it('rejects spaces', () => {
    const result = validateUsername('alice bob');
    expect(result.valid).toBe(false);
  });
});

describe('generateAutoUsername', () => {
  it('returns climber-XXXX format', () => {
    const name = generateAutoUsername();
    expect(name).toMatch(/^climber-[0-9a-f]{4}$/);
  });

  it('returns different values on successive calls', () => {
    const names = new Set(Array.from({ length: 10 }, () => generateAutoUsername()));
    expect(names.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/utils/__tests__/usernames.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement usernames.ts**

Create `src/utils/usernames.ts`:

```ts
import { USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_REGEX, USERNAME_AUTO_PREFIX } from '@/constants';

type ValidationResult = { valid: true } | { valid: false; error: string };

export function validateUsername(username: string): ValidationResult {
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters` };
  }
  if (username !== username.toLowerCase()) {
    return { valid: false, error: 'Username must be lowercase' };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens (not at start/end)' };
  }
  return { valid: true };
}

export function generateAutoUsername(): string {
  const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${USERNAME_AUTO_PREFIX}${hex}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/utils/__tests__/usernames.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/usernames.ts src/utils/__tests__/usernames.test.ts
git commit -m "feat(identity): add username validation and auto-generation utilities"
```

---

### Task 10: Username Firestore Helpers

**Files:**
- Modify: `src/utils/firebase.ts`

- [ ] **Step 1: Add username Firestore helpers to firebase.ts**

Add these functions to the end of `src/utils/firebase.ts` (before the `useSyncStatus` hook):

```ts
import { getDoc, deleteDoc } from "firebase/firestore";

/**
 * Check if a username is available in the `usernames` collection.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const docRef = doc(db, 'usernames', username);
  const snap = await getDoc(docRef);
  return !snap.exists();
}

/**
 * Claim a username for a user. Returns true if successful.
 * Fails silently if already claimed (race condition).
 */
export async function claimUsername(username: string, uuid: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'usernames', username);
    await setDoc(docRef, { uuid, createdAt: Date.now() });
    return true;
  } catch (error) {
    console.error('Error claiming username:', error);
    return false;
  }
}

/**
 * Release a previously claimed username.
 */
export async function releaseUsername(username: string): Promise<void> {
  try {
    const docRef = doc(db, 'usernames', username);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error releasing username:', error);
  }
}

/**
 * Look up a username and return the associated UUID, or null if not found.
 */
export async function lookupUsername(username: string): Promise<string | null> {
  try {
    const docRef = doc(db, 'usernames', username);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return (snap.data() as { uuid: string }).uuid;
    }
    return null;
  } catch (error) {
    console.error('Error looking up username:', error);
    return null;
  }
}
```

Also update the Firestore import at the top of the file to include `getDoc` and `deleteDoc`:

```ts
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, getDoc, deleteDoc, collection, writeBatch, onSnapshot, query, Unsubscribe } from "firebase/firestore";
```

- [ ] **Step 2: Verify type check**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/utils/firebase.ts
git commit -m "feat(identity): add username Firestore helpers (claim, release, lookup, availability check)"
```

---

### Task 11: UsernamePopup Component

**Files:**
- Create: `src/components/UsernamePopup.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create UsernamePopup component**

Create `src/components/UsernamePopup.tsx`:

```tsx
import React from 'react';
import { UserPlus } from 'lucide-react';
import { validateUsername, generateAutoUsername } from '@utils/usernames';
import { isUsernameAvailable, claimUsername, saveUserSettings } from '@utils/firebase';

type Props = {
  userId: string;
  onComplete: (username: string) => void;
};

export default function UsernamePopup({ userId, onComplete }: Props) {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [checking, setChecking] = React.useState(false);

  const handleClaim = async () => {
    const validation = validateUsername(username);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setChecking(true);
    setError('');

    const available = await isUsernameAvailable(username);
    if (!available) {
      setError('Username is already taken');
      setChecking(false);
      return;
    }

    const claimed = await claimUsername(username, userId);
    if (!claimed) {
      setError('Failed to claim username. Try again.');
      setChecking(false);
      return;
    }

    await saveUserSettings(userId, { username, ...(email ? { email } : {}) });
    setChecking(false);
    onComplete(username);
  };

  const handleSkip = async () => {
    setChecking(true);
    const autoName = generateAutoUsername();
    // Try up to 3 times in case of collision
    for (let i = 0; i < 3; i++) {
      const name = i === 0 ? autoName : generateAutoUsername();
      const available = await isUsernameAvailable(name);
      if (available) {
        await claimUsername(name, userId);
        await saveUserSettings(userId, { username: name });
        setChecking(false);
        onComplete(name);
        return;
      }
    }
    // Fallback: use UUID route, no username
    setChecking(false);
    onComplete('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface-card p-8 rounded-2xl shadow-xl border border-line">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4 border border-line">
            <UserPlus size={28} className="text-accent" />
          </div>
          <h2 className="text-xl font-display font-extrabold text-fg-heading">Choose your identity</h2>
          <p className="text-sm text-fg-muted mt-2">Pick a username for your shareable profile</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle block mb-1.5">
              Username (optional)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                setError('');
              }}
              placeholder="climber-7f3a"
              maxLength={20}
              className="w-full bg-surface-raised border border-line text-fg text-sm font-mono rounded-xl p-3 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
            />
            {error && <p className="text-red-500 text-[11px] mt-1.5 font-medium">{error}</p>}
            <p className="text-[10px] text-fg-subtle mt-1.5">Lowercase letters, numbers, hyphens. 3-20 chars.</p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle block mb-1.5">
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="for future account recovery"
              className="w-full bg-surface-raised border border-line text-fg text-sm rounded-xl p-3 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
            />
          </div>

          <button
            onClick={handleClaim}
            disabled={checking || !username}
            className="w-full bg-accent text-surface font-bold py-3 rounded-xl shadow-md shadow-accent/20 transition-all disabled:opacity-50 hover:opacity-90"
          >
            {checking ? 'Claiming...' : 'Claim Username'}
          </button>

          <button
            onClick={handleSkip}
            disabled={checking}
            className="text-fg-muted text-sm hover:text-fg transition-colors"
          >
            Skip — I'll pick one later
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render UsernamePopup in App.tsx**

In `src/App.tsx`, add state and rendering for the popup. In the `MainApp` component:

Add state:
```tsx
const [showUsernamePopup, setShowUsernamePopup] = React.useState(false);
```

Add import:
```tsx
import UsernamePopup from '@components/UsernamePopup';
```

Show popup when onboarding warning is dismissed AND no username exists. Add this effect:
```tsx
// Show username popup after onboarding warning is dismissed (first-time users only)
React.useEffect(() => {
  if (!showWarning && userId && !settings.username && localStorage.getItem('maha_user_id') === userId) {
    // Only show for brand-new users who just dismissed the warning
    const isNewUser = !localStorage.getItem('maha_username_prompted');
    if (isNewUser) {
      setShowUsernamePopup(true);
    }
  }
}, [showWarning, userId, settings.username]);
```

Add popup rendering after `<UpdatePrompt />`:
```tsx
{showUsernamePopup && userId && (
  <UsernamePopup
    userId={userId}
    onComplete={(username) => {
      setShowUsernamePopup(false);
      localStorage.setItem('maha_username_prompted', 'true');
      if (username) {
        navigate(`/${username}`, { replace: true });
      }
    }}
  />
)}
```

- [ ] **Step 3: Verify type check and build**

Run: `bun run lint`
Expected: PASS

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/UsernamePopup.tsx src/App.tsx
git commit -m "feat(identity): add first-launch username popup with validation and Firestore claiming"
```

---

### Task 12: Username & Email Editing in ProfileTab

**Files:**
- Modify: `src/components/ProfileTab.tsx`

- [ ] **Step 1: Add username and email editing to ProfileTab**

In `src/components/ProfileTab.tsx`, add editable fields. Insert this section between the User ID section and the Theme Selection section:

```tsx
import { validateUsername } from '@utils/usernames';
import { isUsernameAvailable, claimUsername, releaseUsername } from '@utils/firebase';
import { useNavigate } from 'react-router-dom';
import { AtSign, Edit3, Check, X as XIcon } from 'lucide-react';
```

Add props: update the Props type to include `onNavigate`:
```tsx
type Props = {
  userId: string | null;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
};
```

Add these state variables and handlers inside the component function:

```tsx
const navigate = useNavigate();
const [editingUsername, setEditingUsername] = React.useState(false);
const [newUsername, setNewUsername] = React.useState('');
const [usernameError, setUsernameError] = React.useState('');
const [savingUsername, setSavingUsername] = React.useState(false);

const [editingEmail, setEditingEmail] = React.useState(false);
const [newEmail, setNewEmail] = React.useState('');

const handleSaveUsername = async () => {
  if (!userId) return;
  const validation = validateUsername(newUsername);
  if (!validation.valid) {
    setUsernameError(validation.error);
    return;
  }

  setSavingUsername(true);
  setUsernameError('');

  const available = await isUsernameAvailable(newUsername);
  if (!available) {
    setUsernameError('Username is already taken');
    setSavingUsername(false);
    return;
  }

  // Release old username if exists
  if (settings.username) {
    await releaseUsername(settings.username);
  }

  const claimed = await claimUsername(newUsername, userId);
  if (!claimed) {
    setUsernameError('Failed to claim username');
    setSavingUsername(false);
    return;
  }

  updateSettings({ username: newUsername });
  setEditingUsername(false);
  setSavingUsername(false);
  navigate(`/${newUsername}`, { replace: true });
};

const handleSaveEmail = () => {
  updateSettings({ email: newEmail });
  setEditingEmail(false);
};
```

Insert this JSX after the User ID section (before Theme Selection):

```tsx
{/* Username Section */}
<div className="bg-surface-raised p-4 rounded-2xl border border-line-subtle">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2 text-fg-subtle">
      <AtSign size={14} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Username</span>
    </div>
    {!editingUsername && (
      <button
        onClick={() => {
          setNewUsername(settings.username || '');
          setEditingUsername(true);
          setUsernameError('');
        }}
        className="text-fg-subtle hover:text-accent transition-colors"
      >
        <Edit3 size={14} />
      </button>
    )}
  </div>

  {editingUsername ? (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={newUsername}
        onChange={(e) => {
          setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
          setUsernameError('');
        }}
        maxLength={20}
        className="w-full bg-surface border border-line text-fg text-sm font-mono rounded-lg p-2 focus:ring-accent focus:border-accent"
        autoFocus
      />
      {usernameError && <p className="text-red-500 text-[11px] font-medium">{usernameError}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSaveUsername}
          disabled={savingUsername || !newUsername}
          className="flex items-center gap-1 text-[11px] font-bold text-accent hover:opacity-80 disabled:opacity-50"
        >
          <Check size={12} /> {savingUsername ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => setEditingUsername(false)}
          className="flex items-center gap-1 text-[11px] font-bold text-fg-muted hover:text-fg"
        >
          <XIcon size={12} /> Cancel
        </button>
      </div>
    </div>
  ) : (
    <p className="text-sm font-mono text-fg font-medium">
      {settings.username || <span className="text-fg-subtle italic">No username set</span>}
    </p>
  )}
</div>

{/* Email Section */}
<div className="bg-surface-raised p-4 rounded-2xl border border-line-subtle">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2 text-fg-subtle">
      <AtSign size={14} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
    </div>
    {!editingEmail && (
      <button
        onClick={() => {
          setNewEmail(settings.email || '');
          setEditingEmail(true);
        }}
        className="text-fg-subtle hover:text-accent transition-colors"
      >
        <Edit3 size={14} />
      </button>
    )}
  </div>

  {editingEmail ? (
    <div className="flex flex-col gap-2">
      <input
        type="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="for future recovery"
        className="w-full bg-surface border border-line text-fg text-sm rounded-lg p-2 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleSaveEmail}
          className="flex items-center gap-1 text-[11px] font-bold text-accent hover:opacity-80"
        >
          <Check size={12} /> Save
        </button>
        <button
          onClick={() => setEditingEmail(false)}
          className="flex items-center gap-1 text-[11px] font-bold text-fg-muted hover:text-fg"
        >
          <XIcon size={12} /> Cancel
        </button>
      </div>
    </div>
  ) : (
    <p className="text-sm text-fg font-medium">
      {settings.email || <span className="text-fg-subtle italic">Not set</span>}
    </p>
  )}
</div>
```

- [ ] **Step 2: Verify type check and build**

Run: `bun run lint`
Expected: PASS

Run: `bun run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ProfileTab.tsx
git commit -m "feat(identity): add editable username and email fields to ProfileTab"
```

---

### Task 13: Dual Routing — UUID and Username Resolution

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/utils/useAppInitialization.ts`

- [ ] **Step 1: Update App.tsx route resolution**

The existing `/:uuid` route parameter becomes a generic `:identifier` that resolves to either a UUID or a username.

In `src/App.tsx`, update the `App` component:

```tsx
import { lookupUsername } from '@utils/firebase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function MainApp() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [resolvedUuid, setResolvedUuid] = React.useState<string | null>(null);
  const [resolving, setResolving] = React.useState(true);

  // Resolve identifier to UUID
  React.useEffect(() => {
    if (!identifier) return;

    if (UUID_REGEX.test(identifier)) {
      setResolvedUuid(identifier);
      setResolving(false);
    } else {
      // Treat as username, look up UUID
      lookupUsername(identifier).then((uuid) => {
        if (uuid) {
          setResolvedUuid(uuid);
        } else {
          // Username not found — redirect to home
          navigate('/', { replace: true });
        }
        setResolving(false);
      });
    }
  }, [identifier, navigate]);

  // Use resolvedUuid instead of uuid for all downstream logic
  const uuid = resolvedUuid;

  // ... rest of MainApp uses `uuid` as before
```

Update the Routes in the `App` component:

```tsx
export default function App() {
  React.useEffect(() => {
    const root = document.documentElement;
    if (!root.className.includes('theme-')) {
      root.classList.add('theme-summit-instrument');
    }
  }, []);

  const storedId = localStorage.getItem('maha_user_id');
  const storedUsername = localStorage.getItem('maha_username');
  const tempId = React.useMemo(() => crypto.randomUUID(), []);
  const defaultRoute = storedUsername || storedId || tempId;

  return (
    <Routes>
      <Route path="/:identifier" element={<MainApp />} />
      <Route path="/" element={<Navigate to={`/${defaultRoute}`} replace />} />
      <Route path="*" element={<Navigate to={`/${defaultRoute}`} replace />} />
    </Routes>
  );
}
```

- [ ] **Step 2: Cache username→UUID mapping and update localStorage**

In the `MainApp` component, after resolving the UUID from a username, cache the mapping:

```tsx
// After successful username lookup, cache for the session
React.useEffect(() => {
  if (resolvedUuid && identifier && !UUID_REGEX.test(identifier)) {
    // Store username in localStorage for future redirects
    localStorage.setItem('maha_username', identifier);
  }
}, [resolvedUuid, identifier]);
```

- [ ] **Step 3: Show loading state while resolving**

In `MainApp`, before the main content return, add:

```tsx
if (resolving) {
  return (
    <div className="min-h-screen bg-surface bg-topo flex items-center justify-center text-fg-muted">
      <div className="font-mono text-sm animate-pulse">Loading...</div>
    </div>
  );
}
```

- [ ] **Step 4: Update useAppInitialization to accept resolved UUID**

No changes needed to `useAppInitialization` — it already receives `uuid` as a parameter. In MainApp, just pass `resolvedUuid` to it instead of the raw route param:

```tsx
const { isDevUrl, userId, showWarning, setShowWarning, settings, updateSettings } = useAppInitialization(setRecords, resolvedUuid ?? undefined);
```

- [ ] **Step 5: Verify type check and build**

Run: `bun run lint`
Expected: PASS

Run: `bun run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(identity): add dual routing — resolve UUID or username from route parameter"
```

---

### Task 14: Firestore Rules Update

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add usernames collection rules**

Update `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // User logs: any authenticated user can read/write. Does NOT enforce uid == userId — see SecurityGuide.md.
    match /users/{userId}/logs/{logId} {
      allow read, write: if request.auth != null;
    }

    // User settings: any authenticated user can read/write. Does NOT enforce uid == userId — see SecurityGuide.md.
    match /users/{userId}/settings/{settingId} {
      allow read, write: if request.auth != null;
    }

    // Usernames: authenticated users can read (for lookups), create, and delete.
    // Note: proper ownership enforcement (uuid == auth.uid) deferred to UID migration (Phase 4 #2).
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat(identity): add Firestore rules for usernames collection"
```

---

### Task 15: Integration Verification and Final Cleanup

**Files:** Various (fixes only)

- [ ] **Step 1: Run all tests**

Run: `bun run test`
Expected: ALL PASS

- [ ] **Step 2: Run type check**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Full manual verification**

Run: `bun run dev`

**Theme System:**
1. Fresh visit → Summit Instrument loads by default
2. Switch to Night City: Elevator → full visual transform
3. Switch back to Summit → no visual regressions
4. Summit Light/Dark/System toggle works
5. Night City hides Light/Dark toggle
6. Theme preference persists on page reload

**Identity System:**
7. Clear localStorage → fresh visit triggers onboarding warning
8. Dismiss warning → username popup appears
9. Enter valid username → claims and redirects to `/:username`
10. Profile tab shows editable username and email
11. Change username → navigates to new `/:newUsername`
12. Visit `/:uuid` → still works for existing data
13. Visit `/:username` → resolves to correct UUID's data

- [ ] **Step 5: Fix any issues found**

If issues found, fix and commit each fix individually.

- [ ] **Step 6: Update WORKPLAN.md**

Mark completed items in `docs/specs/WORKPLAN.md`:

```markdown
### Theming
- [x] 1. **Theme System Architecture**
- [x] 2. **Night City: Elevator Theme**
- [x] 3. **Rewire Summit Instrument**
- [x] 4. **Theme Picker**

### Identity
- [x] 5. **First-Launch Username Popup**
- [x] 6. **Username & Email in Profile**
- [x] 7. **Dual Routing**
- [x] 8. **Firestore Rules for Usernames**
```

- [ ] **Step 7: Final commit**

```bash
git add docs/specs/WORKPLAN.md
git commit -m "docs: mark Phase 5 Identity & Theming tasks as complete"
```

---

## Summary

| Track | Tasks | Key Deliverables |
|-------|-------|-----------------|
| **A: Theme System** | 1–8 | CSS custom property tokens, Tailwind semantic classes, Summit Instrument refactor (no visual change), Night City: Elevator (diamond buttons, cyan glow, Orbitron), theme picker in Profile, dark-only theme handling |
| **B: Identity** | 9–14 | Username validation, Firestore username collection (claim/release/lookup), first-launch popup, editable username/email in Profile, dual routing (UUID or username), Firestore rules |
| **Integration** | 15 | Full test suite, type check, build verification, manual QA |

**Total: 15 tasks, ~75 steps**
