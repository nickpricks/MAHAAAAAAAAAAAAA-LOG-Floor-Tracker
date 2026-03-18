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

### ✅ Resolved by 2026-03-18 Audit Hardening

A full code review on 2026-03-18 found critical bugs and incomplete implementations. All items below have been fixed:

#### Critical (Fixed)
| ID | Issue | Fix |
|----|-------|-----|
| C1 | Firestore rules not enforced | Added `firestore.rules` to repo, updated SecurityGuide.md with honest posture |
| C2 | Merge logic loses data (OR-based) | Extracted `mergeCloudIntoLocal` with per-field `Math.max`, 5 unit tests |
| C3 | Initial cloud fetch discarded | Simplified `initializeFirebaseSession` to auth-only, removed redundant `getDocs` |

#### Important (Fixed)
| ID | Issue | Fix |
|----|-------|-----|
| I1 | Batch exceeds 500-op limit | Chunked into 499-op batches |
| I2 | Offline persistence not enabled | Switched to `initializeFirestore` with `persistentLocalCache` |
| I3 | Dark mode broken | Added `dark:` variants to all 6 components |
| I4 | `todayKey` stale past midnight | Added 60s interval rollover via `useState`/`useEffect` |
| I5 | `last7Days` frozen on mount | Fixed useMemo deps to include `todayKey` |
| I6 | Zero test coverage | 21 tests across 4 suites (mergeRecords, appHelpers, statsHelpers, date) |
| I7 | Unused `registerSW` import | Removed |

#### Minor (Fixed)
All unused imports removed, `as any` cast fixed with proper typing, `%VITE_APP_NAME%` hardcoded in HTML + CI env, package renamed to `maha-log-floor-tracker`, `strict: true` enabled in tsconfig.

#### Deferred
| ID | Issue | Reason |
|----|-------|--------|
| I8 | ~979KB JS chunk (Firebase) | Optimization, not correctness — deferred to Phase 4 |

### 🕒 Future Considerations (P4+)
- **Memory Management**: Currently loads all history into RAM. In 3-5 years of daily logging, consider a paginated IndexedDB/Dexie.js approach.
- **Enhanced Data Recovery**: Further improvements to "Ghost User" recovery (e.g., direct JSON export/import).
- **Firebase UID Migration**: Switch document paths from local UUID to `request.auth.uid` for enforceable security rules.
- **Code Splitting**: Lazy-load Firebase to reduce initial bundle size (~I8).

## 🚀 Execution Status
Phase 1-2 addressed as of Sweep E. **Phase 3 (Hardening) complete** — all 11 tasks done. See [2026-03-18-audit-hardening.md](2026-03-18-audit-hardening.md).
