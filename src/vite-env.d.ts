/**
 * Vite environment type declarations.
 * Provides TypeScript intellisense for Vite client features and PWA plugin.
 */
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}
