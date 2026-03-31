# WORKPLAN


## Current : Mission: Debt Clearance - Priority 1

This workplan tracks the resolution of liabilities identified during the `/march-in` analysis.

### High Priority (P1 - Mission Critical)
- [x] **Security Guide**: Create `docs/SecurityGuide.md` to document the "Security through Rules" architecture and key handling decisions to aid future audits.

### Medium Priority (P2 - Architecture & Reliability)
- [x] 1. **Routing Lib**: Replace manual pathname parsing with `react-router-dom`. (Ref: Liability #2)
- [x] 2. **Throttled Persistence**: Implement debounce/throttle for `localStorage` writes. (Ref: Liability #3)
- [x] 3. **Conflict Resolution**: Refactor `useAppInitialization` to merge `up`/`down` counts (additive). (Ref: Failure #2)
- [x] 4. **Sync Feedback**: Add a "Cloud Sync Status" icon/indicator to the Header/Footer. (Ref: Failure #3)
- [x] 4.5 **Manual Sync**: Add a "Sync Now" button in Stats/Help to force reconciliation. (Ref: Failure #5)


### Low Priority (P3 - Cleanup & Stability)
- [x] 5. **Prune Package**: Remove `better-sqlite3`, `express`, `genai`, `tsx`. (Ref: Audit 2.1)
- [x] 6. **PWA Prompt**: Switch to `prompt` update strategy in `vite.config.ts`. (Ref: Audit 5.2)
- [-] 7. **Firebase Env Config**: (Deferred/Owner Preference) Keep keys in source. (Ref: Audit 4.3)
- [x] 7.1 **Issue Link**: Replace dummy feedback email with GitHub Issue Link in `HelpTab.tsx`. (Ref: Audit 5.3)
- [x] 7.2 **Fix Template**: Debug and fix "name is required" error in `.github/ISSUE_TEMPLATE/feedback.md`.
- [x] 7.3 **Copy URL**: Add "Copy Unique URL" button in `StatsTab.tsx`.

### Maintenance (P4 - Code Quality)
- [x] 8. **Logic Extraction**: Move metrics calculation from `StatsTab.tsx` to memoized hooks/selectors. (Ref: Liability #4)
- [x] 9. **Type Safety**: Audit `DailyRecord` and related types for consistency. (Ref: Linting pass)

### Phase 2: Personalization & Real-time Sync (Sweep E) ✅
- [x] 10 Day/night/device mode
- [x] 10.0 A quick profile tab - user info - email (optional) - default challenge (saves to cloud) and day/night mode (saved to cloud)
- [x] 10.1. Move DEV_MODE_QUERY_PARAM in App.tsx to utils
- [x] 10.2. Move helper functions in App.tsx to utils
- [x] 10.3. Move helper func in StatsTab.tsx and TrackerTabs to utils
- [x] 10.4. Verify all files for variables and everything that can move to constants and utils and move them
- [x] 10.5. Before git push, make sure we are not in main branch. Create a new feature branch and push to it.
- [x] 11. **Real-time Sync**: Replace `getDocs` with `onSnapshot` for instant multi-device updates.
- [x] 12. **Profile Tab**: Create `ProfileTab.tsx` for User Info & Settings.
- [x] 13. **Sync'd Settings**: Store `theme` (day/night) and `defaultChallenge` in Firestore `/users/{uid}/settings`.
- [x] 14. **Fix Onboarding**: Delay `localStorage` set until after warning is triggered/shown.

## Mission: Phase 3 - Audit Hardening - Priority 1

> Full plan: [2026-03-18-audit-hardening-resolved.md](2026-03-18-audit-hardening-resolved.md)

### Critical (Must Fix)
- [x] 1. **Test Framework**: Set up Vitest (`vitest.config.ts`, test script)
- [x] 2. **Merge Logic (C2)**: Extract `mergeCloudIntoLocal` with per-field max, TDD
- [x] 3. **Discarded Fetch (C3)**: Simplify `initializeFirebaseSession` to auth-only, remove redundant `getDocs`
- [x] 4. **Firestore Rules (C1)**: Version-control `firestore.rules`, update SecurityGuide.md

### Important (Should Fix)
- [x] 5. **Batch Limit (I1)**: Chunk `syncAllLocalToCloud` into 499-op batches
- [x] 6. **Offline Persistence (I2)**: Enable `persistentLocalCache` in Firestore init
- [x] 7. **Dark Mode (I3)**: Add `dark:` variants to all components
- [x] 8. **Stale Dates (I4+I5)**: Midnight rollover for `todayKey`, fix `last7Days` deps
- [x] 9. **Core Tests (I6)**: Unit tests for appHelpers, statsHelpers, date utils

### Cleanup
- [x] 10. **Code Sweep**: Unused imports, strict TS, package rename, CI env vars, title fallback
- [x] 11. **Documentation**: Update Audit-TLDR and WORKPLAN with results

## Mission: Phase 3.5 - Post-Hardening Review + UI Polish

> Full review: [2026-03-27-audit-review.md](2026-03-27-audit-review.md)

### Audit Fixes (N1-N9)
- [x] 1. **Gemini Key (N1)**: Remove dead `GEMINI_API_KEY` define from `vite.config.ts`
- [x] 2. **Auth Failure (N2)**: `initializeFirebaseSession` returns boolean, sets sync status on error
- [x] 3. **Auth Race (N3)**: Await auth before setting up Firestore listeners in `useAppInitialization`
- [x] 4. **StatsTab Convention (N4)**: Lift `syncAllLocalToCloud` + `uuid` to `App.tsx`, pass as `onManualSync` prop
- [x] 5. **NavigationTabs Convention (N5)**: Lift `useSyncStatus()` to `App.tsx`, pass as `syncStatus` prop
- [x] 6. **DRY Scoring (N6)**: Extract `calculateTotal()` in `appHelpers.ts`, import in `mergeRecords.ts` + `dev.ts`
- [x] 7. **Comment Fixes (N7-N9)**: Fix JSDoc, firestore.rules comments, delete dead `docs/CLAUDE.md`

### Bug Fixes
- [x] 8. **Dark Mode (Tailwind v4)**: Add `@custom-variant dark` — class-based dark mode was never working
- [x] 9. **Mobile Nav Overflow**: Redesign NavigationTabs — sync indicator inside tab bar, responsive padding

### UI Redesign ("Summit Instrument")
- [x] 10. **Design System**: Warm stone palette, Syne + JetBrains Mono fonts, topographic background
- [x] 11. **Tracker**: Brass amber button, altitude readout with glow, contour ring decorations
- [x] 12. **Accent System**: Amber active tabs, progress bar, theme buttons, history totals
- [x] 13. **PWA Icons**: SVG favicon (ascending staircase), icon generation utility
- [x] 14. **Documentation**: Update CLAUDE.md, Audit-TLDR, WORKPLAN

## Mission: Phase 4 - Security - Priority 2

### Security
- [ ] 1. **Deploy Firestore Rules**: Run `firebase deploy --only firestore:rules` (rules are version-controlled in `firestore.rules` but never deployed)
- [ ] 2. **Firebase UID Migration (F1)**: Switch Firestore doc paths from URL UUID to `request.auth.uid`, enforce `request.auth.uid == userId` in rules. Requires data migration for existing users.

## Mission: Phase 5 - Identity & Theming - Priority 1

> Full spec: [2026-03-30-identity-theming-design.md](2026-03-30-identity-theming-design.md)

### Theming
- [x] 1. **Theme System Architecture**: CSS custom property tokens per theme, theme class on `<html>`, Tailwind v4 `@theme` integration. `src/utils/themes.ts` + `src/themes/*.css`.
- [x] 2. **Night City: Elevator Theme**: Cyberpunk design — void black, cyan glow, chrome diamond buttons, Orbitron font, brushed metal texture.
- [x] 3. **Rewire Summit Instrument**: Refactored to CSS var token system (no visual change).
- [x] 4. **Theme Picker**: Select dropdown in Profile tab. 6 themes total.
- [x] 4.1 **Additional Themes**: Deep Mariana, Night City Apartment, Industrial Furnace, Corporate Glass.
- [x] 4.2 **Per-theme Buttons**: Uniform subdued buttons with click glow, per-theme icons, ambient effects (bubbles, embers, scanlines).
- [x] 4.3 **Theme Preview URLs**: Visit `/{theme-id}` to preview any theme.
- [x] 4.4 **Playwright E2E Tests**: `bun run test:themes` for headless, `bun run test:themes:debug` for inspector.

### Identity
- [x] 5. **First-Launch Username Popup**: Modal after onboarding — optional username + email. Auto-generates `climber-{hex}` if skipped.
- [x] 6. **Username & Email in Profile**: Editable fields. Username claim uses Firestore transaction (atomic).
- [x] 7. **Dual Routing**: `/:identifier` resolves as UUID or username. `/` prefers stored username.
- [x] 8. **Firestore Rules for Usernames**: Read/create/delete for authenticated. Ownership enforcement deferred to UID migration (Phase 4).

### Deferred (Future Phases)
- [ ] **Shareable Profile URLs**: Update "Copy shareable link" to prefer `/:username` when set.
- [ ] **Find Your User**: Recovery feature in Profile — search by username or UUID to reconnect to lost account.
- [ ] **Additional Themes**: Tokyo Midnight, Skyline, Everest, Fuji, Himalayan Dawn, Space Station.
- [ ] **Challenge Revamp**: Resettable periods, 30 challenges, floor height presets. See `docs/specs/2026-03-31-challenge-revamp-design.md`.
- [ ] **Analytics Dashboard**: Build a simple unified dashboard view for richer analytics.
