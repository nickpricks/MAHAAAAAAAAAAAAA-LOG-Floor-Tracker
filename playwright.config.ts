import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3005',
    screenshot: 'on',
    viewport: { width: 768, height: 1024 }, // Tablet — ensures all nav labels visible
  },
  outputDir: './e2e/results',
});
