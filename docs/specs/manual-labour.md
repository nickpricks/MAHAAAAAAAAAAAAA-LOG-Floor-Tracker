# Manual Review

## The Big Decision
- Readme says app name is Floor Tracker - A minimalist web application to track the number of floors you've climbed. Tap the elevator buttons. Watch the number grow.
- Op 1 
- we continue down this path 
- We have a clean build 
- NEXT we can upgrade it as a cli, desktop and android app 
- use cases ? we already using as a web app 
- why android (learning curve - expo or android studio) 
- Thoughts?
- why desktop (learning curve - maybe we gonna use a fyne.io or something) 
- Thoughts?
- cli ? cobra (golang) - again where is the learning in that
- either setup everything from scratch
- Thoughts?
- Op 2 
- we don't continue this path 
- we add more features - alpha, beta & gamma
- we introduce steps tracking 
- we introduce fluids tracking 
- we introduce food tracking 
- we introduce sleep tracking 
- we turn it into a monster - floor -> body -> life
- we make it a habit tracker - floor -> body -> life -> habits -> goals
- faakkkkk - but not to worrier - we might still need a strong backend - maybe convert to golang (use fresh or something for web)
- use cases ? now we may need actual public deployment
- actual android/desktop app - maybe play store dev console (25$ fee) - don't even think about apple dev store
- why
- why not
- why not also embed this youtube playlist with autoplay on - https://www.youtube.com/watch?v=w_3hALBro5c&list=RDw_3hALBro5c&start_radio=1
- Time to make that BIG decision - Op1 or OP2

## Root files
list of all root files here
- .env -- Local environment variables ( not tracked in git - one can copy .env.example to .env and fill it )
- .env.example -- Template for environment variables
- .gemini/ -- Agent configuration and memory
- .github/ -- GitHub Actions and templates
- .vscode/ -- VS Code workspace settings
- [Claude](../../CLAUDE.md) -- Project instructions for AI
- [Readme](../../README.md) -- Main project documentation
- bun.lock -- Bun dependency lockfile
- index.html -- Main entry point HTML
- metadata.json -- App manifest and metadata
- node_modules/ -- Installed npm packages
- package.json -- Project dependencies and scripts
- tsconfig.json -- TypeScript configuration
- [x] needs comments on each line
- [ ] *RULE_ADD_GLOBAL* Always do like this -- (1. tsc --init 2. whatever boilerplate 3. If boilerplate comes first rename file preserve boiler plate settings then tsc init and set boilplate ts settings and remove renamed file)
- vite.config.ts -- Vite build tool configuration

## src 
main source files
- App.tsx -- Root React application component
- [Readme](src/README.md) -- Source directory overview
- constants.ts -- Global application constants
- index.css -- Global stylesheet
- main.tsx -- React DOM render entry
- types.ts -- Shared TypeScript interfaces
- vite-env.d.ts -- Vite type definitions

### components
- HelpTab.tsx -- Help and instructions view
- NavigationTabs.tsx -- Bottom navigation bar
- OnboardingWarning.tsx -- First-time user disclaimer
- ProfileTab.tsx -- User settings and profile
- README.md -- Components directory overview
- StatsTab.tsx -- Analytics and history view
- TrackerTab.tsx -- Main floor button interface
- UpdatePrompt.tsx -- PWA update notification

### utils
- README.md -- Utilities directory overview
- appHelpers.ts -- General application logic helpers
- date.ts -- Date formatting and manipulation
- dev.ts -- Development mode utilities
- firebase.ts -- Firebase initialization and logic
- statsHelpers.ts -- Analytics calculation logic
- storage.ts -- LocalStorage wrapper utilities
- useAppInitialization.ts -- App startup logic hook

## public
- [Readme](public/README.md) -- Public assets overview
- favicon.ico -- Small browser tab icon
- icon.png -- App icon for PWA
- pwa-192x192.png -- PWA manifest icon small
- pwa-512x512.png -- PWA manifest icon large