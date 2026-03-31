import { describe, it, expect } from 'vitest';
import { THEME_DEFINITIONS, type ThemeId, applyTheme, getThemeDefinition } from '@utils/themes';

describe('themes', () => {
  it('exports summit-instrument theme', () => {
    const theme = getThemeDefinition('summit-instrument');
    expect(theme).toBeDefined();
    expect(theme.name).toBe('Summit Instrument');
    expect(theme.darkOnly).toBe(false);
    expect(theme.cssClass).toBe('theme-summit-instrument');
  });

  it('exports night-city-elevator theme', () => {
    const theme = getThemeDefinition('night-city-elevator');
    expect(theme).toBeDefined();
    expect(theme.name).toBe('Night City: Elevator');
    expect(theme.darkOnly).toBe(true);
    expect(theme.cssClass).toBe('theme-night-city-elevator');
  });

  it('every theme has required preview colors', () => {
    Object.values(THEME_DEFINITIONS).forEach((theme) => {
      expect(theme.previewColors.bg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.previewColors.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.previewColors.text).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('every theme has a unique cssClass', () => {
    const classes = Object.values(THEME_DEFINITIONS).map(t => t.cssClass);
    expect(new Set(classes).size).toBe(classes.length);
  });
});
