import { useState, useEffect } from 'react';

const DEFAULT_THEME = {
  primary: '#2563eb',
  accent: '#10b981',
  bg: '#ffffff',
  fg: '#111827',
  font: 'Inter',
  border: '#e5e7eb',
  danger: '#dc2626',
};

export type Theme = typeof DEFAULT_THEME;

const PRESETS: Record<string, Partial<Theme>> = {
  default: DEFAULT_THEME,
  medical: { primary: '#0891b2' },
  food:    { primary: '#16a34a' },
  fitness: { primary: '#ea580c' },
  finance: { primary: '#7c3aed' },
  school:  { primary: '#0284c7' },
  retail:  { primary: '#db2777' },
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const preset = localStorage.getItem('theme_preset') ?? 'default';
      const overrides = JSON.parse(localStorage.getItem('theme_overrides') ?? '{}');
      return { ...DEFAULT_THEME, ...PRESETS[preset], ...overrides };
    } catch { return DEFAULT_THEME; }
  });
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--fg', theme.fg);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--danger', theme.danger);
    root.style.setProperty('--font', theme.font);
  }, [theme]);
  function applyPreset(name: string) {
    localStorage.setItem('theme_preset', name);
    setTheme({ ...DEFAULT_THEME, ...PRESETS[name] });
  }
  return { theme, setTheme, applyPreset, presets: Object.keys(PRESETS) };
}
