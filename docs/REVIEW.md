# REVIEW.md — MAHA LOG Floor Tracker

Consolidated summary of all completed audits, reviews, and hardening passes.

---

## 1. Audit TL;DR — v0.0.3 (2026-03-18)

> Full document: [specs/Audit-TLDR.md](specs/Audit-TLDR.md)

### 🛠️ Technical Health
The system has been hardened and refactored. Most high-priority technical debt from the initial audit has been resolved.

**Resolved (Phase 1-3 Sweep E):**
- Dependency bloat pruned from `package.json`
- Routing migrated to `react-router-dom` (UUID handling)
- `localStorage` writes throttled (2s)
- 10+ business logic helpers extracted into `utils/`
- `onSnapshot` real-time listeners added
- PWA update strategy switched to `prompt`

**2026-03-18 Hardening — All 11 items fixed:**

| Severity | ID | Issue | Fix |
|----------|----|-------|-----|
| Critical | C1 | Firestore rules not enforced | `firestore.rules` added to repo |
| Critical | C2 | Merge logic loses data (OR-based) | `mergeCloudIntoLocal` with `Math.max` per-field + 5 unit tests |
| Critical | C3 | Initial cloud fetch discarded | `initializeFirebaseSession` simplified to auth-only |
| Important | I1 | Batch exceeds 500-op limit | Chunked into 499-op batches |
| Important | I2 | Offline persistence not enabled | `initializeFirestore` with `persistentLocalCache` |
| Important | I3 | Dark mode broken | `dark:` variants added to all 6 components |
| Important | I4 | `todayKey` stale past midnight | 60s interval rollover via `useState`/`useEffect` |
| Important | I5 | `last7Days` frozen on mount | `useMemo` deps fixed to include `todayKey` |
| Important | I6 | Zero test coverage | 21 tests across 4 suites |
| Important | I7 | Unused `registerSW` import | Removed |
| Deferred | I8 | ~979KB JS chunk (Firebase) | Deferred to Phase 4 (optimization, not correctness) |

**Future (P4+):** Memory management (IndexedDB/Dexie.js), enhanced data recovery, Firebase UID migration, code splitting.

---

## 2. Security Posture Review — v0.0.4 (2026-03-17)

> Full document: [SecurityGuide.md](SecurityGuide.md)

| Area | Status | Notes |
|------|--------|-------|
| Firebase config keys | ✅ Intentional | Public identifiers, not secrets; HTTP Referrer Restrictions recommended |
| Firestore rules | ✅ In repo | Auth required; rules deployed via `firebase deploy --only firestore:rules` |
| Document path auth | ⚠️ Known gap | Uses UUID (unguessable), NOT `request.auth.uid` — security-by-obscurity |
| Anonymous auth | ✅ In use | Ghost User risk documented; intentional trade-off for privacy |
| Admin secrets | ✅ Clean | No Service Account keys in repo |

**Known open item:** Firebase UID migration — tracked in WORKPLAN as P4+.

---

## 3. Audit Hardening Implementation Plan (2026-03-18)

> Execution plan file removed after completion — summary retained below.

**Goal:** Fix all Critical, Important, and Minor issues from the 2026-03-18 full app audit to bring MAHA LOG to production quality.  
**Approach:** TDD-first — Vitest introduced before any fix, so each change was covered by tests before being merged.  
**Stack:** React 19, Vite 6, TypeScript 5.8, Firebase 12, Vitest, Tailwind CSS v4, vite-plugin-pwa  
**Outcome:** All 11 tasks completed ✅

---

### Phase 1 — Critical Fixes

| Task | ID | What was done |
|------|----|---------------|
| 1 | — | **Vitest setup** — installed, configured with `@` alias, `test` + `test:watch` scripts added |
| 2 | C2 | **Merge logic** — extracted `mergeCloudIntoLocal` (pure fn, `Math.max` per-field); replaced OR-logic in `useAppInitialization`; 5 unit tests |
| 3 | C3 | **Discarded cloud fetch** — removed redundant `getDocs` from `initializeFirebaseSession`; simplified to auth-only; `onSnapshot` handles initial load |
| 4 | C1 | **Firestore rules** — added `firestore.rules` + `firebase.json` to repo; `SecurityGuide.md` updated with honest posture |

### Phase 2 — Important Fixes

| Task | ID | What was done |
|------|----|---------------|
| 5 | I1 | **Batch chunking** — `syncAllLocalToCloud` now loops in 499-op chunks; safe for 500+ day users |
| 6 | I2 | **Offline persistence** — replaced `getFirestore` with `initializeFirestore` + `persistentLocalCache` + `persistentMultipleTabManager` |
| 7 | I3 | **Dark mode** — `dark:` variants added to all 6 components; `as any` cast fixed with typed `themes` array in `ProfileTab`; unused `TabType` import removed |
| 8 | I4+I5 | **Stale date keys** — `todayKey` converted to `useState` with 60s rollover interval; `last7Days` `useMemo` dep fixed to include `todayKey`; date util unit tests added |
| 9 | I6 | **Test coverage** — 21 tests across `appHelpers`, `statsHelpers`, `date`, `mergeRecords` |

### Phase 3 — Minor Cleanup

| Task | What was done |
|------|---------------|
| 10 | Removed unused imports (`registerSW`, `getDoc`, `METERS_PER_FLOOR`); hardcoded `<title>Floor Tracker</title>` in `index.html`; added `VITE_APP_NAME`/`VITE_APP_VERSION` to CI env; renamed package `react-example` → `maha-log-floor-tracker`; enabled `strict: true` in `tsconfig.json` |
| 11 | Updated `Audit-TLDR.md` to reflect reopened/fixed findings; marked completed items in `WORKPLAN.md` |

---

**New files created:**

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest config with `@` alias |
| `src/utils/mergeRecords.ts` | Pure merge function (`Math.max` strategy) |
| `src/utils/__tests__/mergeRecords.test.ts` | 5 merge tests |
| `src/utils/__tests__/appHelpers.test.ts` | Tap logic + sort tests |
| `src/utils/__tests__/statsHelpers.test.ts` | Metrics + progress + format tests |
| `src/utils/__tests__/date.test.ts` | Date key format + range tests |
| `firestore.rules` | Version-controlled Firestore security rules |
| `firebase.json` | Firebase project config for rules deployment |

---

*Last updated: 2026-03-19*
