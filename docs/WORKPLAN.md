# WORKPLAN

## Current Mission: Phase 1.5 - Data Persistence & Gamification

### Tasks
- [ ] 1. **PWA Setup**: Add `vite-plugin-pwa`, `manifest.json`, and icons to make the app installable.
- [ ] 2. **Anonymous Login & Onboarding**: 
  - Leverage Firebase's actual "Anonymous Auth" to silently generate a UUID in the background. Ensure the URL reflects the user's personal ID (`/#/uuid`).
  - Add an "Onboarding Tour" (simple popup) on first visit.
  - Show a red "Unsaved changes - Please bookmark or Create an account" warning to mitigate the risk of lost progress.
- [ ] 3. **Database Integration (Firebase)**: Integrate Firebase Firestore for Phase 1.5. Leverage its built-in offline sync. (We will migrate to Postgres/Supabase later once we hit scale).
- [ ] 4. **StatsTab Enhancements**: 
  - Add a progress percentage (%).
  - Add an info tooltip ("i" icon) for more stats.
  - Add quirky/funny metrics (e.g., "You've climbed the equivalent of 14 giraffes stacked").
- [ ] 5. **Randomized Challenges**: Allow users to select different targets (e.g., Eiffel Tower, Burj Khalifa, Empire State) instead of just Everest.
- [ ] 6. **Feedback/Contact**: Add a simple feedback button (mailto or form link) in the Help tab or footer.
- [ ] 7. **Dashboard**: Build a simple unified dashboard view for richer analytics.
