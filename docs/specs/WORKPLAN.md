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

> Full plan: [2026-03-18-audit-hardening.md](2026-03-18-audit-hardening.md)

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

## Mission: Phase 4 - Analytics & Insights - Priority 2

### Tasks
- [ ] 1. **Dashboard**: Build a simple unified dashboard view for richer analytics.
