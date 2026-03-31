import { describe, it, expect } from 'vitest';
import { THEME_DEFINITIONS, type ThemeId } from '@utils/themes';

/**
 * Theme Visual Tests
 *
 * Unit tests validate theme data integrity.
 * For automated browser testing, use Chrome DevTools MCP or Playwright.
 *
 * Theme preview URLs (dev server must be running):
 *   http://localhost:3005/{theme-id}
 *   e.g. http://localhost:3005/industrial-furnace
 */

const THEME_IDS = Object.keys(THEME_DEFINITIONS) as ThemeId[];

describe('theme definitions', () => {
  it('all theme IDs are valid URL-safe slugs', () => {
    THEME_IDS.forEach((id) => {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    });
  });

  it('all themes have preview colors', () => {
    THEME_IDS.forEach((id) => {
      const theme = THEME_DEFINITIONS[id];
      expect(theme.previewColors.bg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.previewColors.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.previewColors.text).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('all themes have unique cssClass', () => {
    const classes = THEME_IDS.map(id => THEME_DEFINITIONS[id].cssClass);
    expect(new Set(classes).size).toBe(classes.length);
  });

  it('all themes have fonts defined', () => {
    THEME_IDS.forEach((id) => {
      const theme = THEME_DEFINITIONS[id];
      expect(theme.fonts.display).toBeTruthy();
      expect(theme.fonts.body).toBeTruthy();
    });
  });
});
