# Multi-Activity Tracker P1 — Resume Prompt

> **Purpose:** Drop this into a new Claude Code session to resume implementation exactly where we left off.
> **Created:** 2026-04-02
> **Status:** Plan written, no tasks started yet.

---

## Session Log (2026-04-02)

### How We Got Here

User asked "next to do" -> reviewed WORKPLAN.md -> all phases 1-6 complete. User initially wanted a **dashboard** feature (listed as deferred in workplan). During brainstorming, user pivoted: "I have another idea - floor -> steps, walk and run."

### Brainstorming Flow (Questions -> Answers)

1. **Is this a redesign of Floor Tracker or for AFP?** -> "Floor Tracker was always a MVP but it can become a product" -> **Evolve Floor Tracker itself (option B)**

2. **How does data get in?** -> **(C) Both** — auto-sync from health APIs as baseline, manual logging for corrections/extras

3. **Primary metric?** -> **(D) All** — steps, distance, and activity classification together

4. **How granular?** -> **(C) Hybrid** — auto-synced data as daily rollups, manual entries as sessions. Plus backdating for previous days.

5. **Relationship to existing floor data?** -> "Default will be floors (subset) and other activities enabled in profile" -> Progressive disclosure: app starts as Floor Tracker, grows as user enables activities.

6. **Tracker screen UX?** -> **(B) Activity tabs** but with a twist: one default activity chosen in Profile shown full-screen, others behind a kebab/overflow menu. Not cluttered.

7. **Where does it live?** -> **(B) Evolve Floor Tracker** — "it was a MVP but it can become a product"

8. **Challenge system?** -> **(A) Distance stays universal** — all activities contribute meters to same challenges. Existing 30 challenges work as-is.

9. **Data model approach?** -> Saw examples of A (fatten DailyRecord), B (separate streams), C (unified replace). Chose **(C) Unified** — `activities/` replaces `logs/`, every entry typed.

10. **Migration timing?** -> **(D) One-time script** — run after finalizing, not on-the-fly

11. **Backend for health API sync?** -> **(A) Firebase Cloud Functions** — plan for it now, build later. Might switch to B (dedicated backend) or C (defer) later.

12. **Anonymous auth still?** -> **No** — upgrading to real auth. Google Sign-In first (P1), email/password + Apple later (P3).

13. **Auth providers?** -> **(C + D)** — Email/password + Google + Apple as full plan, ship Google first.

### Design Sections Approved
- Data model (Activity discriminated union)
- Architecture (client SPA + Firebase Cloud Functions planned)
- Authentication (Google Sign-In, anonymous linking)
- User settings expansion (enabledActivities, defaultActivity, strideLength)
- Tracker screen (focus activity + kebab switcher)
- Stats & challenges (universal distance)
- Firestore queries & indexes
- Migration strategy (one-time script, deferred)
- Implementation phases (P1-P5)

### Key User Quotes
- "Floor Tracker was always a MVP but it can become a product"
- "Its just an idea - idea can be built or sometimes they just become spider food"
- "Default will be floors (subset) and other activities enabled in profile"
- "See only one by default - one's main focus - others are there just somewhere in a kebab menu"
- On stride length, floor taps: "seems like we are needing a backend"
- On anonymous auth: "still?" (prompted the auth upgrade)

### Artifacts Produced
1. `docs/specs/2026-04-02-multi-activity-tracker-design.md` — approved design spec
2. `docs/specs/2026-04-02-multi-activity-tracker-plan.md` — 13-task implementation plan with full code
3. This file — resume prompt

### Other Work Done This Session
- Built inline record editing + paginated log on `feat/tracker-edit-pagination` branch (committed as `163625b`)
- `updateRecordValues()` added to `appHelpers.ts` with 3 tests
- TrackerTab log table: edit any day's up/down inline, "Load More" pagination (10 per page)

### Current Git State
- Branch: `feat/tracker-edit-pagination`
- Last commit: `163625b` — "feat: add inline record editing and paginated log in TrackerTab"
- Spec/plan docs recreated on this branch (not yet committed)
- Multi-activity plan: no tasks started yet

---

## Key Documents
- **Design spec:** `docs/specs/2026-04-02-multi-activity-tracker-design.md`
- **Implementation plan:** `docs/specs/2026-04-02-multi-activity-tracker-plan.md`
- **Existing workplan:** `docs/specs/WORKPLAN.md` — phases 1-6 complete, this is phase 7

## Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data model | Unified `activities/` collection, discriminated union | Clean long-term model, every entry typed |
| Backwards compat | `DailyRecord` kept in `types.ts` during transition | Existing floor-tap code works unchanged |
| Auth | Google Sign-In (P1), email+Apple (P3) | Firebase `linkWithCredential()` preserves anonymous user data |
| UX | Floor default, others opt-in via Profile | Progressive disclosure — app starts simple |
| Tracker | One focus activity + kebab switcher | User's main focus front-and-center, no clutter |
| Challenges | Universal distance, all activities contribute | Existing 30 challenges work unchanged |
| Health API | Firebase Cloud Functions (planned, not built in P1) | Architecture accounts for it, implementation deferred |
| Migration | One-time Firestore script (P4) | Ship new model first, migrate after |
| Firestore rules | UID-enforced on `activities/` from day one | Resolves long-deferred Phase 4 security item |

---

## Resume Instructions

```
Read the implementation plan at docs/specs/2026-04-02-multi-activity-tracker-plan.md and the design spec at docs/specs/2026-04-02-multi-activity-tracker-design.md.

Execute the plan using superpowers:subagent-driven-development (preferred) or superpowers:executing-plans. Start from Task 1. All 13 tasks are pending — none have been started.

Key context:
- Branch: create a feature branch (e.g., feat/multi-activity-p1) before starting
- Package manager: bun (not npm/yarn)
- Test runner: vitest (bun run test)
- Type check: bun run lint (tsc --noEmit)
- The plan has complete code for every step — follow it exactly
- DailyRecord is kept alongside the new Activity types during transition
- Existing tests must continue to pass throughout
- User preference: squash to 1-2 commits before PR to main
- User preference: don't push to remote (user pushes via GitHub Desktop)
- User preference: always ask before git commit/push/reset/rebase
- The CLAUDE.md in the repo has full project conventions — read it
```

---

## Task Checklist (for progress tracking)

Update this as tasks are completed:

- [ ] Task 1: Activity type definitions + helpers (TDD) — `types.ts`, `activities.ts`
- [ ] Task 2: Constants + UserSettings expansion — `constants.ts`, `firebase.ts`
- [ ] Task 3: Activity Firestore operations (TDD) — `firebase.ts`
- [ ] Task 4: Google Sign-In + anonymous linking — `firebase.ts`, `GoogleSignIn.tsx`
- [ ] Task 5: Firestore rules + indexes — `firestore.rules`, `firestore.indexes.json`
- [ ] Task 6: ProfileTab — toggles, stride, sign-in — `ProfileTab.tsx`
- [ ] Task 7: WalkRunTracker + StepsTracker — two new components
- [ ] Task 8: ActivitySwitcher kebab menu — `ActivitySwitcher.tsx`
- [ ] Task 9: TrackerTab multi-activity wiring — `TrackerTab.tsx`
- [ ] Task 10: App.tsx activities state + handlers — `App.tsx`, `useAppInitialization.ts`
- [ ] Task 11: StatsTab universal distance — `StatsTab.tsx`
- [ ] Task 12: Documentation updates — `HELP.md`, `CLAUDE.md`, `WORKPLAN.md`
- [ ] Task 13: Final verification — build + smoke test
