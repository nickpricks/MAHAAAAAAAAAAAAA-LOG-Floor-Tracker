# 🛗 Floor Tracker
<!-- Origin: src/constants.ts (APP_NAME) -->

**v0.0.3** <!-- Origin: src/constants.ts (APP_VERSION) --> · [Live App](https://nickpricks.github.io/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker/)

A minimalist web application to track the number of floors you've climbed. Tap the elevator buttons. Watch the number grow.

## Current Features
- **One-Tap Tracking**: Instantly log a floor with a single tap.
- **Real-time Cloud Sync**: Multi-device synchronization with additive conflict resolution via Firebase.
- **Personalized Experience**: Profile management with Theme support (Dark/Light/System) and customizable challenges.
- **PWA & Offline-First**: Installable application that works seamlessly even without an internet connection.
- **Minimalist Aesthetic**: A premium, distraction-free interface designed for speed and clarity.

---

## 🔒 Security Architecture

This project follows a "Security through Rules" approach, enforcing data safety directly on the Firebase backend using Firestore Security Rules.

For a detailed technical breakdown of our security decisions (including why API keys are in-source), see the **[Security Guide](docs/SecurityGuide.md)**.

---

## Project Vision 🔭

Floor Tracker is designed to be the most frictionless way to log activity. Our core principles are:
- **Instant Identity**: No sign-up required. Your URL *is* your account.
- **Reliable Sync**: Automated real-time cloud backup with conflict resolution.
- **Install Everywhere**: A first-class PWA experience that works offline and feels native.
- **Growth Ready**: A modular architecture designed to evolve from a floor counter into a total health log.

---

## Future Roadmap 🚀

| Phase | Status | Key Features |
| :--- | :--- | :--- |
| **Phase 1: Foundation** | ✅ Completed | React + Vite, Tailwind CSS, LocalStorage, PWA, Anonymous UUID Routing |
| **Phase 2: Sync & Personalization** | ✅ Completed | Real-time Firestore Sync, Profile Tab (Themes/Settings), Performance Benchmarks |
| **Phase 3: Analytics & Insights** | 🗓️ Planned | Dashboard, Advanced Data Visualization (Recharts), Historical Trends, Visual Journey Maps |
| **Phase 4: "Total Health" Ecosystem** | 🗓️ Planned | Modular Health Logging (Water/Macros), Social Competitions, Contextual Health Advice |