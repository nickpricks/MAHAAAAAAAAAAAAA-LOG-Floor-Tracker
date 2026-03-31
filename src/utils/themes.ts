import { useState, useEffect } from 'react';

export type ThemeId = 'summit-instrument' | 'night-city-elevator' | 'deep-mariana' | 'night-city-apartment' | 'industrial-furnace' | 'corporate-glass';

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  family: string;
  darkOnly: boolean;
  fonts: { display: string; body: string };
  cssClass: string;
  previewColors: { bg: string; accent: string; text: string };
};

export const THEME_DEFINITIONS: Record<ThemeId, ThemeDefinition> = {
  'summit-instrument': {
    id: 'summit-instrument',
    name: 'Summit Instrument',
    family: 'Summit',
    darkOnly: false,
    fonts: { display: 'Syne', body: 'system-ui' },
    cssClass: 'theme-summit-instrument',
    previewColors: { bg: '#faf7f2', accent: '#f59e0b', text: '#1a1613' },
  },
  'night-city-elevator': {
    id: 'night-city-elevator',
    name: 'Night City: Elevator',
    family: 'Cyberpunk',
    darkOnly: true,
    fonts: { display: 'Orbitron', body: 'JetBrains Mono' },
    cssClass: 'theme-night-city-elevator',
    previewColors: { bg: '#0a0a0f', accent: '#00f0ff', text: '#c0c0c8' },
  },
  'deep-mariana': {
    id: 'deep-mariana',
    name: 'Deep: Mariana',
    family: 'Deep',
    darkOnly: true,
    fonts: { display: 'Syne', body: 'JetBrains Mono' },
    cssClass: 'theme-deep-mariana',
    previewColors: { bg: '#030b12', accent: '#00e89a', text: '#8cb4c8' },
  },
  'night-city-apartment': {
    id: 'night-city-apartment',
    name: 'Night City: Apartment',
    family: 'Cyberpunk',
    darkOnly: true,
    fonts: { display: 'Orbitron', body: 'JetBrains Mono' },
    cssClass: 'theme-night-city-apartment',
    previewColors: { bg: '#0d0505', accent: '#ffb803', text: '#d0d0d0' },
  },
  'industrial-furnace': {
    id: 'industrial-furnace',
    name: 'Industrial Furnace',
    family: 'Industrial',
    darkOnly: true,
    fonts: { display: 'Syne', body: 'JetBrains Mono' },
    cssClass: 'theme-industrial-furnace',
    previewColors: { bg: '#100804', accent: '#ff6820', text: '#c8a888' },
  },
  'corporate-glass': {
    id: 'corporate-glass',
    name: 'Corporate Glass',
    family: 'Corporate',
    darkOnly: false,
    fonts: { display: 'Syne', body: 'system-ui' },
    cssClass: 'theme-corporate-glass',
    previewColors: { bg: '#f0f4f8', accent: '#0070c0', text: '#1a2836' },
  },
};

export function getThemeDefinition(id: ThemeId): ThemeDefinition {
  return THEME_DEFINITIONS[id];
}

export function isValidThemeId(value: string): value is ThemeId {
  return value in THEME_DEFINITIONS;
}

export function applyTheme(themeId: ThemeId, colorMode: 'light' | 'dark' | 'system') {
  const theme = THEME_DEFINITIONS[themeId];
  const root = document.documentElement;

  // Remove all theme classes
  Object.values(THEME_DEFINITIONS).forEach(t => root.classList.remove(t.cssClass));

  // Apply new theme class
  root.classList.add(theme.cssClass);

  // Handle dark mode
  if (theme.darkOnly) {
    root.classList.add('dark');
  } else if (colorMode === 'dark') {
    root.classList.add('dark');
  } else if (colorMode === 'light') {
    root.classList.remove('dark');
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  }
}

export function useActiveThemeId(): ThemeId {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const root = document.documentElement;
    for (const theme of Object.values(THEME_DEFINITIONS)) {
      if (root.classList.contains(theme.cssClass)) return theme.id;
    }
    return 'summit-instrument';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      for (const theme of Object.values(THEME_DEFINITIONS)) {
        if (root.classList.contains(theme.cssClass)) {
          setThemeId(theme.id);
          return;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return themeId;
}
