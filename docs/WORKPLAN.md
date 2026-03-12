# WORKPLAN

## Current Mission: Phase 1.5 - Data Persistence & Gamification

### Tasks
- [x] 1. **PWA Setup**: Add `vite-plugin-pwa`, `manifest.json`, and icons to make the app installable.
- [x] 2. **Anonymous Login & Onboarding**: 
  - Leverage Firebase's actual "Anonymous Auth" to silently generate a UUID in the background. Ensure the URL reflects the user's personal ID (`/#/uuid`).
  - Add an "Onboarding Tour" (simple popup) on first visit.
  - Show a red "Unsaved changes - Please bookmark or Create an account" warning to mitigate the risk of lost progress.
- [x] 3. **Database Integration (Firebase)**: Integrate Firebase Firestore for Phase 1.5. Leverage its built-in offline sync. (We will migrate to Postgres/Supabase later once we hit scale).
- [ ] 3.1 Move DEV_MODE_QUERY_PARAM in App.tsx to utils
- [ ] 3.2 Move helper functions in App.tsx to utils
- [ ] 3.3 Move helper func in StatsTab.tsx and TrackerTabs to utils
- [ ] 3.4 Verify all files for variables and eveything taht can move to constants and utils and move them
- [ ] 3.5 Before git push, make sure we are not in main branch. Creata a new feature branch and push to it.
- [x] 4. **StatsTab Enhancements**: 
  - Add a progress percentage (%).
  - Add an info tooltip ("i" icon) for more stats.
  - Add quirky/funny metrics (e.g., "You've climbed the equivalent of 14 giraffes stacked").
- [x] 5. **Randomized Challenges**: Allow users to select different targets (e.g., Eiffel Tower, Burj Khalifa, Empire State) instead of just Everest.
- [x] 6. **Feedback/Contact**: Add a simple feedback button (mailto or form link) in the Help tab or footer. Feedback email comes from config. or env or constants

### Phase 2 Preparation & Refactoring
- [ ] 0. **Routing Migration**: Remove Hash Routing (`/#/uuid`) and revert back to Standard Routing (`/uuid`), setting up a 404 redirect script for GitHub Pages compatibility.
- [ ] 1. Move DEV_MODE_QUERY_PARAM in App.tsx to utils
- [ ] 2. Move helper functions in App.tsx to utils
- [ ] 3. Move helper func in StatsTab.tsx and TrackerTabs to utils
- [ ] 4. Verify all files for variables and eveything taht can move to constants and utils and move them
- [ ] 5. Before git push, make sure we are not in main branch. Creata a new feature branch and push to it.
- [ ] 6. **Dashboard**: Build a simple unified dashboard view for richer analytics.
