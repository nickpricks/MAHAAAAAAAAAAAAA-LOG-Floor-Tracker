# Phase 5: Identity & Theming — Design Spec

**Date:** 2026-03-30
**Status:** Approved
**Scope:** Theme system architecture, Night City elevator theme, username/email identity, dual routing

---

## 1. Theme System

### Architecture

- CSS custom properties define each theme's tokens (`--bg-primary`, `--bg-card`, `--bg-surface`, `--text-primary`, `--text-muted`, `--accent`, `--accent-secondary`, `--glow`, etc.)
- Theme class applied to `<html>` element (e.g. `class="theme-night-city-elevator"`)
- Tokens consumed via Tailwind v4 `@theme` configuration in `index.css`
- **Tracker tab** gets component-level variants per theme (elevator diamond buttons for Night City, brass button for Summit, etc.)
- **Stats / Profile / Help** share layout structure — colors swap via CSS vars only
- Theme preference stored in Firestore at `users/{uuid}/settings/profile` as `theme` field (replaces current light/dark/system value)

### Themes — This Phase

| ID | Name | Family | Description |
|----|------|--------|-------------|
| `night-city-elevator` | Night City: Elevator | Cyberpunk | Void black (#0a0a0f), brushed metal texture, cyan (#00f0ff) primary glow, violet (#b14eff) secondary, flame orange (#ff6b2e) hot accent. Chrome-framed diamond buttons. Orbitron display font, JetBrains Mono body. Dark-only. |
| `summit-instrument` | Summit Instrument | Summit | Existing warm stone palette, amber/gold accent, Syne display font. Refactored to use CSS var system with no visual change. Supports light + dark. |

### Themes — Future (Documented, Not Built)

| ID | Name | Family | Concept | Mode |
|----|------|--------|---------|------|
| `night-city-apartment` | Night City: Apartment | Cyberpunk | Futuristic living room control panel, smart-home aesthetic | Dark-only |
| `night-city-skyline` | Night City: Skyline | Cyberpunk | City rooftop, neon horizon glow | Dark-only |
| `night-city-tokyo` | Tokyo Midnight | Cyberpunk | Rain-slick streets, pink/purple neon, kanji signage feel | Dark-only |
| `summit-everest` | Summit: Everest | Summit | Snow/ice palette, cold whites and blues | Light + Dark |
| `summit-fuji` | Summit: Fuji | Summit | Cherry blossom pink + volcanic grey | Light + Dark |
| `summit-himalaya` | Himalayan Dawn | Summit | Misty lavender, golden sunrise, snow peaks | Light + Dark |
| `landmark-burj` | Landmark: Burj Khalifa | Landmark | Gold, glass, desert sand | Light + Dark |
| `corporate-glass` | Corporate Glass Tower | Corporate | Cool blue-grey glass, frosted panels, clean minimal | Light + Dark |
| `industrial-furnace` | Industrial Furnace | Industrial | Molten orange, slag grey, riveted steel, heat shimmer | Dark-only |
| `deep-mariana` | Deep: Mariana | Deep | Ocean navy, bioluminescent greens | Dark-only |
| `space-station` | Space Station | Space | Orbital white/grey, status-light blues, zero-G clinical | Dark-only |

### Theme Ambient Effects

Each theme can optionally declare a subtle CSS-only ambient effect — atmospheric particles or overlays that reinforce the theme's identity. These are barely-there background details, not screensavers.

**Implementation:** CSS `@keyframes` with pseudo-elements or small repeated divs. No canvas, no JS particle libraries. Effects are scoped via `.theme-{id} .fx-ambient` selectors in a shared `effects.css` (or a section in `index.css`).

| Theme | Effect | Technique |
|-------|--------|-----------|
| Summit: Everest | Slow drifting snowflakes | Small white dots, `@keyframes fall` with slight horizontal sway |
| Summit: Fuji | Falling cherry blossom petals | Pink dots/shapes, gentle diagonal drift |
| Himalayan Dawn | Faint mist wisps | Semi-transparent gradient bands, slow horizontal float |
| Tokyo Midnight | Rain drops | Thin vertical streaks, fast downward fall |
| Deep: Mariana | Rising air bubbles | Small circles, slow upward float with wobble |
| Industrial Furnace | Heat fumes / rising embers | Orange specks, upward drift with subtle flicker opacity |
| Space Station | Drifting stars / micro-debris | Tiny white dots, very slow multi-direction drift |

Themes without effects listed (Summit Instrument, Night City: Elevator/Apartment/Skyline, Burj Khalifa, Corporate Glass) use background patterns only (topo lines, brushed metal, etc.) — no particle effects.

**Performance:** Effects use `will-change: transform` and `pointer-events: none`. Max ~15-20 particles at any time. `prefers-reduced-motion` media query disables all ambient effects.

### Light/Dark Handling

- Night City, Deep, Industrial, and Space themes are **dark-only** — light/dark/system toggle is hidden or disabled
- Summit, Landmark, and Corporate themes support **light + dark + system** — toggle remains available
- If a user switches from a light-capable theme to a dark-only theme, the toggle state is preserved in settings but not applied until they switch back

### Theme Picker (Profile Tab)

- Grid of theme cards in Profile, each showing a small preview swatch
- Active theme highlighted
- Selecting a theme: updates `<html>` class, saves to Firestore
- Only built themes are shown (Night City: Elevator + Summit Instrument this phase)

---

## 2. Night City: Elevator Theme — Visual Spec

Reference mockup: `.superpowers/brainstorm/158-1774881469/content/elevator-panel-concept.html`
Inspiration image: Gemini-generated cyberpunk elevator panel (cyan glow, chrome frames, dark metal)

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0f` | Page background |
| `--bg-card` | `#12121f` | Card / panel surfaces |
| `--bg-surface` | `#1a1a2e` | Elevated surfaces, inputs |
| `--border` | `#1e1e3a` | Card borders |
| `--border-subtle` | `#2a2a3a` | Subtle dividers |
| `--text-primary` | `#c0c0c8` | Body text |
| `--text-muted` | `#555` | Labels, secondary text |
| `--text-heading` | `#e0e0e8` | Headings |
| `--accent` | `#00f0ff` | Primary accent (cyan) |
| `--accent-glow` | `rgba(0,240,255,0.3)` | Glow/shadow for accent |
| `--accent-secondary` | `#b14eff` | Secondary accent (violet) |
| `--accent-hot` | `#ff6b2e` | Warning/highlight (orange) |
| `--metal-grain` | Repeating linear gradient | Brushed metal texture overlay |

### Typography

| Role | Font | Weight |
|------|------|--------|
| Display (floor count, stat values) | Orbitron | 700-900 |
| Body / labels | JetBrains Mono | 400-700 |
| Navigation | JetBrains Mono | 700 |

### Tracker Tab — Elevator Panel

- **Up button**: Diamond-rotated frame (45deg), chrome border (`--border-subtle`), inner cyan glow, chevron icon. Hover: border glows cyan, outer shadow.
- **Floor display**: Orbitron 80px, `--accent` color, text-shadow glow. Sub-label shows up/down breakdown.
- **Down button**: Diamond-rotated frame, darker blue inner glow (#3a6a8a), subdued compared to up.
- **Progress bar**: Thin 3px track, fill gradient cyan→violet, violet dot at leading edge.
- **Background**: Brushed metal grain texture, subtle vertical center seam line with faint cyan.

### Stats Tab — Data Readout

- Dark cards (`--bg-card`) with `--border` borders
- Stat values in Orbitron, cyan glow
- 7-day bar chart: cyan gradient bars, today highlighted brighter
- No layout changes from current — just color/font token swap

### Profile Tab — Terminal Interface

- Sections styled as terminal blocks: dark background, monospace text
- Section headers: violet color with `>` prefix
- Key-value rows: muted keys, light values
- Editable fields: violet with dashed underline
- Theme picker grid in this section

### Header & Nav

- Header: minimal strip — "MAHA LOG" in Orbitron small caps, cyan sync dot
- Nav: bottom bar, items in uppercase JetBrains Mono 9px, active tab: cyan text + subtle cyan border/background

---

## 3. First-Launch Username Popup

### Trigger

First visit: no `maha_user_id` in localStorage. Shows **after** the onboarding warning is accepted.

### Popup Content

- Title: "Choose your identity"
- **Username field** (optional): text input with live validation
- **Email field** (optional): for future account recovery
- **"Claim Username" button**: primary action
- **"Skip" link**: dismisses popup, auto-generates username

### Username Rules

- Lowercase alphanumeric + hyphens only
- 3-20 characters
- Must not start or end with a hyphen
- Unique across all users (checked against `usernames` collection)
- Basic offensive word blocklist

### Flow — User Fills In Username

1. Client validates format locally
2. Check `usernames/{username}` doc exists in Firestore
3. If available: write `usernames/{username} → { uuid, createdAt }` doc
4. Save username + email to `users/{uuid}/settings/profile`
5. Save UUID to localStorage as `maha_user_id`
6. Redirect to `/:username`

### Flow — User Skips

1. Auto-generate username: `climber-{4-char-hex}` (e.g. `climber-7f3a`)
2. Claim auto-generated name in `usernames` collection (same as above)
3. Save UUID to localStorage
4. Continue to `/:uuid`

### Component

New component: `UsernamePopup.tsx`. Rendered in `MainApp` conditionally (first visit + warning accepted). Modal overlay, themed to active theme.

---

## 4. Username & Email in Profile

### Editable Fields

- Username: inline editable in Profile tab. On change:
  1. Validate new username (same rules as first-launch)
  2. Check uniqueness
  3. Delete old `usernames/{old}` doc
  4. Write new `usernames/{new}` doc
  5. Update `users/{uuid}/settings/profile`
  6. Navigate to `/:newUsername`
- Email: inline editable, saved to `users/{uuid}/settings/profile`. No validation beyond format check.

### Firestore Schema Addition

```
usernames/{username}        # Top-level collection
  → { uuid: string, createdAt: number }

users/{uuid}/settings/profile   # Existing doc, new fields
  → { ..., username: string, email?: string }
```

### Firestore Rules Addition

```
match /usernames/{username} {
  // Anyone can read (for uniqueness checks and routing lookups)
  allow read: if request.auth != null;
  // Only the owner can create/update (uuid must match)
  allow create: if request.auth != null
                && request.resource.data.uuid == request.auth.uid; // Note: requires UID migration (Phase 4 #2) for proper enforcement. Until then, client-side only.
  allow delete: if request.auth != null;
}
```

**Note:** Until Firebase UID migration (Phase 4 #2) is complete, username ownership enforcement is client-side only. The UUID in the `usernames` doc is the URL UUID, not `auth.uid`. This is a known gap carried forward from the existing security posture.

---

## 5. Dual Routing

### Routes

| Pattern | Behavior |
|---------|----------|
| `/:username` | Look up UUID from `usernames/{username}`, load that user's data |
| `/:uuid` | Direct UUID access (existing behavior, still works) |
| `/` | Redirect to `/:username` if username set in settings, else `/:uuid` |
| `*` | Redirect same as `/` |

### Route Resolution

In `App.tsx`, the `:uuid` param becomes a **generic identifier**. Resolution logic:
1. If param looks like a UUID (regex: 8-4-4-4-12 hex pattern) → use directly as UUID
2. Otherwise → treat as username, query `usernames/{param}` for the UUID
3. If username lookup fails → 404 or redirect to `/`

### Caching

Username → UUID mappings can be cached in memory for the session to avoid repeated Firestore reads on navigation.

---

## 6. What's Deferred

| Item | Phase |
|------|-------|
| Shareable profile URLs (prefer `/:username` in copy link) | Next |
| Find Your User recovery feature | Next |
| Additional themes (Apartment, Skyline, Everest, Fuji, Burj, Mariana) | Future |
| Firebase UID migration (proper security rule enforcement) | Phase 4 #2 (existing) |
| Deploy Firestore rules | Phase 4 #1 (existing) |

---

## 7. Files Expected to Change

| File | Change |
|------|--------|
| `index.css` | CSS custom property definitions per theme, `@theme` rewiring |
| `App.tsx` | Route resolution logic (UUID vs username), username popup rendering |
| `ProfileTab.tsx` | Theme picker, editable username/email fields |
| `TrackerTab.tsx` | Theme-variant tracker layouts (elevator vs brass button) |
| `StatsTab.tsx` | Token-based color swap (no layout change) |
| `NavigationTabs.tsx` | Token-based color swap |
| `constants.ts` | Theme IDs, username regex, auto-gen prefix |
| `firebase.ts` | `usernames` collection helpers (claim, release, lookup) |
| `useAppInitialization.ts` | Username resolution on mount |
| `firestore.rules` | `usernames` collection rules |
| **New:** `UsernamePopup.tsx` | First-launch username/email modal |
| **New:** `src/utils/themes.ts` | Theme definitions, token maps, switcher logic |
