# 🛗 MAHA LOG — Floor Tracker

**v0.0.3** · [Live App](https://nickpricks.github.io/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker/)

A minimalist web application to track the number of floors you've climbed. Tap the elevator buttons. Watch the number grow.

## Current Features
- **One-Tap Tracking:** Instantly log a floor with a single tap.
- **Local Storage:** Your progress is saved locally on your device so you never lose your count.
- **Minimalist UI:** Distraction-free, clean interface designed for quick interactions.
- **Everest Challenge:** Track your progress towards climbing Mount Everest (8,848m). *Note: We calculate 1 floor as approximately 3 meters.*

---

## Future Roadmap 🚀

### Phase 1: Tech Stack & Foundation (Completed ✅)
- [x] **React Migration:** Built on a robust React + Vite foundation.
- [x] **Tailwind CSS:** Modern, responsive styling system.
- [x] **Data Model:** Core application state configured and persisted via `localStorage`.

### Phase 1.5: Persistence & Gamification (In Progress 👷)
- [ ] **PWA (Progressive Web App):** Configure manifesting and service workers to make the app installable with an offline-first feel.
- [ ] **Frictionless Anonymous Login:** Automatically generate a UUID via Hash Routing (`/#/[uuid]`) for secure, shareable bookmarking.
- [ ] **Cloud Sync:** Integrate an offline-first database (like Firebase or Supabase) to sync user records via their UUID.
- [ ] **Dynamic Challenges:** Allow users to choose different vertical targets (e.g., Eiffel Tower, Burj Khalifa) instead of just Everest.
- [ ] **Stats Context:** Add completion percentages (`%`) and an info modal (`ℹ️`) filled with quirky comparison metrics.
- [ ] **Feedback Loop:** Simple `mailto:` or contact form integration.

### Phase 2: Analytics & Insights
- [ ] **Unified Dashboard:** Move beyond simple history and implement a dedicated dashboard.
- [ ] **Visualizations:** Introduce aesthetic charts (e.g., using Recharts) for weekly and monthly trends.
- [ ] **Journey Maps:** Develop stylized maps to visually represent the user's progress up their current landmark target.

### Phase 3: The "Total Health" Ecosystem
- [ ] **Modular Tracking:** Allow users to toggle tracking modules for water, food, calories, and weight alongside their floors climbed.
- [ ] **Contextual Advice:** Generate smart suggestions (e.g., "You climbed X floors, drink water!")
- [ ] **Social Connection:** Implement friend-only micro-leaderboards and achievement sharing (e.g., weekly summary cards).