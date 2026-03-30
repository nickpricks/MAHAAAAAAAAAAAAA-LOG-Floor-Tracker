# Contributing Guidelines

## 🤝 Contributing Rules

### Import Order Convention
To maintain a clean and readable codebase, all imports must follow this strict ordering:

1. **React**: Always import React first (`import React, ... from 'react';`).
2. **External Libraries**: Third-party packages (e.g., `react-router-dom`, `firebase`, `lucide-react`).
3. **Internal Components**: Project UI components (`./components/...`).
4. **Types & Constants**: Shared definitions (`../types`, `../constants`).
5. **Utils & Root Files** 🛑: Helper functions and root config files **must ALWAYS be at the absolute bottom** of the import block.

*Note: We use `vite-tsconfig-paths` to resolve path aliases (like `@/*`). This is used for the sole purpose of avoiding duplicate configurations between `tsconfig.json` and `vite.config.ts`.*
