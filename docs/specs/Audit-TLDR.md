# Audit TL;DR: MAHA LOG — Floor Tracker (v0.0.3)

## 🛠️ Technical Health Summary
The system has been hardened and refactored. Most high-priority technical debt from the initial audit has been resolved.

### ✅ Resolved Technical Debt
1.  **Dependency Bloat**: Pruned unused backend/template dependencies from `package.json`.
2.  **Brittle Routing**: Migrated to `react-router-dom` for robust UUID handling.
3.  **Persistence Bottleneck**: Implemented 2s throttled `localStorage` writes.
4.  **Logic Entanglement**: Extracted 10+ business logic helpers into `utils/` (appHelpers, statsHelpers).
5.  **Real-Time listeners**: Added `onSnapshot` for instant multi-device updates.
6.  **PWA Strategy**: Switched to `prompt` update method to prevent silent session loss.

### ⚠️ Reopened by 2026-03-18 Audit

A full code review on 2026-03-18 found that several items previously marked as resolved still have bugs or were incompletely implemented:

#### Critical
| ID | Issue | Why It Matters |
|----|-------|----------------|
| C1 | **Firestore rules not enforced** — No `firestore.rules` in repo. UUID-based paths are decoupled from Firebase `user.uid`, so rules can't enforce ownership. | Any authenticated user can write to any UUID's data. |
| C2 | **Merge logic loses data** — OR-based comparison in `useAppInitialization.ts:68` replaces entire records instead of taking per-field max. | Multi-device users silently lose floor counts. |
| C3 | **Initial cloud fetch discarded** — `initializeFirebaseSession()` return value is never used; redundant `getDocs` call. | Wasted bandwidth + race condition on first render. |

#### Important
| ID | Issue |
|----|-------|
| I1 | `syncAllLocalToCloud` batch exceeds Firestore 500-op limit for power users |
| I2 | Firestore offline persistence not enabled (requires explicit opt-in on web) |
| I3 | Dark mode broken — only root div has `dark:` variants, all child components hardcoded light |
| I4 | `todayKey` never refreshes past midnight |
| I5 | `last7Days` useMemo has empty deps, freezes on mount |
| I6 | Zero test coverage |
| I7 | Unused `registerSW` import in main.tsx |
| I8 | ~979KB JS chunk (Firebase dominates) |

#### Minor
Unused imports (`getDoc`, `METERS_PER_FLOOR`, `calculateTapUpdate`, `TabType`), `as any` cast, `%VITE_APP_NAME%` in deployed title, package name `react-example`, no `strict` mode, unused `user` variable.

### 🕒 Future Considerations (P4+)
- **Memory Management**: Currently loads all history into RAM. In 3-5 years of daily logging, consider a paginated IndexedDB/Dexie.js approach.
- **Enhanced Data Recovery**: Further improvements to "Ghost User" recovery (e.g., direct JSON export/import).
- **Firebase UID Migration**: Switch document paths from local UUID to `request.auth.uid` for enforceable security rules.
- **Code Splitting**: Lazy-load Firebase to reduce initial bundle size.

## 🚀 Execution Status
Phase 1-2 items addressed as of Sweep E. Phase 3 (Hardening) tracked in [2026-03-18-audit-hardening.md](2026-03-18-audit-hardening.md).
