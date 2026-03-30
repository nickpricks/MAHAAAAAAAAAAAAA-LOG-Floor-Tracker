# Audit TL;DR: MAHA LOG — Floor Tracker (v0.0.4)

---
Last updated: 2026-03-19

## 🛠️ Technical Health Summary
The system has been hardened and refactored. Most high-priority technical debt from the initial audit has been resolved.

## Open Items

| Priority | ID | Issue | Source |
|----------|----|-------|--------|
| P4 | I8 | ~979KB JS chunk (Firebase) — lazy-load / code-split | 2026-03-18 audit |
| P4 | F1 | Firebase UID Migration — switch doc paths from URL UUID to `request.auth.uid` for enforceable security rules | 2026-03-18 audit, all 5 reviewers flagged |
| P4 | F2 | Memory Management — all history loaded into RAM; paginated IndexedDB for 3-5yr users | 2026-03-18 audit |
| P4 | F3 | Data Recovery — JSON export/import for "Ghost User" recovery | 2026-03-18 audit |
| P5 | F4 | Firestore schema validation rules for `DailyRecord` fields | SecurityGuide.md |
| P5 | F5 | Generate PNG PWA icons — open `scripts/generate-icons.html` in browser, save to `public/` | 2026-03-27 UI refresh |

---

## Resolved — Phase 1-2 (Initial Build)

1. **Dependency Bloat**: Pruned unused backend/template dependencies from `package.json`.
2. **Brittle Routing**: Migrated to `react-router-dom` for robust UUID handling.
3. **Persistence Bottleneck**: Implemented 2s throttled `localStorage` writes.
4. **Logic Entanglement**: Extracted 10+ business logic helpers into `utils/`.
5. **Real-Time listeners**: Added `onSnapshot` for instant multi-device updates.
6. **PWA Strategy**: Switched to `prompt` update method to prevent silent session loss.

## Resolved — Phase 3: Audit Hardening (2026-03-18)

> Full plan: [2026-03-18-audit-hardening-resolved.md](2026-03-18-audit-hardening-resolved.md) (11 tasks, all complete)

| ID | Sev | Issue | Fix |
|----|-----|-------|-----|
| C1 | Crit | Firestore rules not enforced | Added `firestore.rules`, updated SecurityGuide.md |
| C2 | Crit | Merge logic loses data (OR-based) | `mergeCloudIntoLocal` with per-field `Math.max`, 5 tests |
| C3 | Crit | Initial cloud fetch discarded | Simplified `initializeFirebaseSession` to auth-only |
| I1 | Imp | Batch exceeds 500-op limit | Chunked into 499-op batches |
| I2 | Imp | Offline persistence not enabled | `initializeFirestore` with `persistentLocalCache` |
| I3 | Imp | Dark mode broken | Added `dark:` variants to all 6 components |
| I4 | Imp | `todayKey` stale past midnight | 60s interval rollover |
| I5 | Imp | `last7Days` frozen on mount | Fixed useMemo deps |
| I6 | Imp | Zero test coverage | 21 tests across 4 suites |
| I7 | Minor | Unused `registerSW` import | Removed |
| — | Minor | Cleanup sweep | Strict TS, package rename, CI env, title fallback, unused imports |

## Resolved — Phase 3.5: Post-Hardening Review (2026-03-27)

> Full review: [2026-03-27-audit-review-resolved.md](2026-03-27-audit-review-resolved.md) (9 findings + 2 bonus fixes)

| ID | Sev | Issue | Fix |
|----|-----|-------|-----|
| N1 | High | Gemini API key injected into client bundle | Removed `define` block from `vite.config.ts` |
| N2 | High | Auth failure silently swallowed | Returns `boolean`, sets `setSyncStatus('error')` |
| N3 | High | Listeners race authentication | `useAppInitialization` awaits auth before subscribing |
| N4 | Med | StatsTab violates presentational convention | Lifted to `App.tsx`, passed as `onManualSync` prop |
| N5 | Med | NavigationTabs violates presentational convention | Lifted `useSyncStatus()` to `App.tsx` |
| N6 | Med | Scoring formula duplicated 3x | Extracted `calculateTotal()` in `appHelpers.ts` |
| N7 | Low | `confirmResetData` JSDoc claims cloud wipe | Updated comment |
| N8 | Low | Firestore rules comments misleading | Updated to reflect actual behavior |
| N9 | Low | Dead `docs/CLAUDE.md` redirect | Deleted |
| — | Bug | Tailwind v4 class-based dark mode never worked | Added `@custom-variant dark` to `index.css` |
| — | Bug | Nav bar overflows on mobile (375px) | Redesigned: sync dot inside bar, responsive padding |

## Resolved — Phase 3.5: UI Refresh (2026-03-27)

"Summit Instrument" design system: warm stone palette, Syne + JetBrains Mono typography, topographic background, amber brass accent, altitude readout glow. SVG favicon with ascending staircase motif.
## 🚀 Execution Status
Phase 1-2 addressed as of Sweep E. **Phase 3 (Hardening) complete** — all 11 tasks done. Full execution summary in [docs/REVIEW.md](../REVIEW.md#3-audit-hardening-implementation-plan-2026-03-18).
