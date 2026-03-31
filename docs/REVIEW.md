# REVIEW.md — Floor Tracker

Consolidated summary of all audits, reviews, and known issues.

---

## 1. Audit TL;DR — v0.0.3 (2026-03-18)

> Full document: [specs/Audit-TLDR.md](specs/Audit-TLDR.md)

11 issues fixed: Firestore rules, merge logic (TDD), auth-only init, batch chunking, offline persistence, dark mode, stale date keys, test coverage (21 tests across 4 suites).

---

## 2. Security Posture — v0.0.4 (2026-03-17)

> Full document: [SecurityGuide.md](SecurityGuide.md)

| Area | Status | Notes |
|------|--------|-------|
| Firebase config keys | In-source (public identifiers, not secrets) | HTTP Referrer Restrictions recommended |
| Firestore rules | Version-controlled in `firestore.rules` | Auth required; not yet deployed |
| Document path auth | Uses UUID (unguessable), not `request.auth.uid` | Security-by-obscurity — UID migration pending |
| Username ownership | Client-side only | Firestore rules can't enforce until UID migration |

**Open:** Firebase UID migration — tracked as Phase 4 #2 in WORKPLAN.

---

## 3. Phase 3 Hardening — v0.0.4 (2026-03-18)

All 11 tasks completed. TDD-first approach — Vitest introduced before any fix.

---

## 4. Phase 5 Code Review — v0.0.5 (2026-03-31)

> Full reports: `.final-countdown-reports/report.md` and `report.html`

5-agent parallel review of commit `5ef485e` (41 files, 4,879 additions). Theme system, 6 themes, username identity, dual routing, Playwright E2E tests.

### Fixed in this session (11 items)

| # | Severity | Fix |
|---|----------|-----|
| 1 | CRITICAL | Username claim now uses `runTransaction` (atomic check-and-set) |
| 2 | CRITICAL | Release-before-claim reordered — new username claimed first, old released after |
| 4 | HIGH | Theme preview URLs no longer create Firebase subscriptions |
| 5 | HIGH | localStorage no longer stores theme IDs as usernames |
| 6 | HIGH | Night City Apartment preview colors corrected to match CSS |
| 10 | HIGH | `test:design` references updated to `test:themes` in CLAUDE.md + README |
| 11 | HIGH | Dead `.btn-brass` CSS and unused `--btn-up-bg`/`--btn-down-bg` vars removed |
| 19 | MEDIUM | HELP.md future themes list updated (Apartment removed, already built) |
| 20 | MEDIUM | WORKPLAN Phase 5 tasks checked off, deferred list updated |
| 22 | LOW | ProfileTab version uses `APP_VERSION` constant instead of hardcoded string |
| 27 | LOW | Makefile duplicate description line removed |

### Known issues — deferred with rationale

| # | Severity | Issue | Why deferred | Tracked in |
|---|----------|-------|-------------|------------|
| 3 | CRITICAL | Firestore rules allow any user to delete any username | Requires UID migration — app uses random UUIDs, not Firebase Auth UIDs. Rules can't distinguish owner from attacker until `request.auth.uid` matches doc paths. | WORKPLAN Phase 4 #2 |
| 7 | HIGH | `saveUserSettings` silently swallows errors | Needs UX design decision: return boolean? toast notification? sync indicator color? Current behavior matches pre-Phase-5 pattern. | Future: error handling sweep |
| 8 | HIGH | `lookupUsername` returns null for both "not found" and "error" | Needs error UI component + return type redesign. Network errors currently redirect to `/` silently. | Future: error handling sweep |
| 9 | HIGH | No unit tests for Firebase username functions | Needs mock setup for `runTransaction`, `getDoc`, `deleteDoc`. ~20 min effort, not a quick fix. | Future: test coverage sprint |
| 12 | MEDIUM | `handleSkip` silently drops user on 3 failed auto-names | Low probability (65K namespace). Fix: show error instead of silent `onComplete('')`. | Future: username UX polish |
| 13 | MEDIUM | Settings migration write failure creates retry loop | `saveUserSettings` failure means migration re-triggers on every load. Fix: track migration attempt in local state. | Future: error handling sweep |
| 14 | MEDIUM | Route resolver `.then()` has no `.catch()` | Unhandled rejection leaves infinite spinner. Fix: add `.catch()` with error state. | Future: error handling sweep |
| 15 | MEDIUM | `useActiveThemeId` uses MutationObserver | Works but heavyweight for a React-controlled value. Could be React context instead. | Future: architecture cleanup |
| 16 | MEDIUM | `generateAutoUsername` collision space is only 65K | Use `crypto.randomUUID().slice(0,8)` for larger space. Low risk until significant adoption. | Future: username UX polish |
| 17 | MEDIUM | E2E test uses non-deterministic random click counts | Failures not reproducible. Use fixed seed or deterministic count. | Future: test stability |
| 18 | MEDIUM | Playwright config missing `webServer` auto-start | Dev server must be manually started on port 3005 before running E2E. | Future: DX improvement |
| 23 | LOW | NavigationTabs sync indicators use hardcoded colors | Status colors (green/blue/red) are semantic, not themed — intentional. | No action needed |
| 24 | LOW | StatsTab Fun Facts modal uses light-mode-only colors | Decorative cards with orange/yellow/blue backgrounds look jarring on dark themes. | Future: theme polish |
| 25 | LOW | `ThemeDefinition.fonts` field unused at runtime | Font switching is CSS-only via `--font-theme-display`. Field exists for metadata/documentation. | Consider removing |
| 26 | LOW | Theme preview always forces dark mode | Light-capable themes (Summit, Corporate) preview in dark only. Document or add color mode param. | Future: DX improvement |

### Positive consensus (all 5 agents)

- CSS token architecture is well-designed and extensible
- Settings migration handles legacy values correctly
- `prefers-reduced-motion` respected in effects and buttons
- Username validation has thorough test coverage
- CLAUDE.md Gotchas section is genuinely useful
- Discriminated union pattern on `validateUsername()` is excellent TypeScript

---

*Last updated: 2026-03-31*
