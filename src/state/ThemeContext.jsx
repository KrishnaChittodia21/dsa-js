import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'dsa-journey:theme';
const ACCENT_KEY = 'dsa-journey:accent';

// Kinetic Voxel accents (tokens.css § 4). The default, plasma, is the design's primary-action colour.
export const ACCENTS = [
  { id: 'plasma', label: 'Plasma' },
  { id: 'volt', label: 'Volt' },
  { id: 'uv', label: 'Ultraviolet' },
  { id: 'ice', label: 'Ice' },
];
const ACCENT_IDS = ACCENTS.map((a) => a.id);
/** accents saved by earlier versions of the app → their Kinetic Voxel counterpart */
const LEGACY_ACCENT = { indigo: 'plasma', amber: 'plasma', rose: 'volt', teal: 'ice' };
const normalizeAccent = (a) => (ACCENT_IDS.includes(a) ? a : LEGACY_ACCENT[a] || 'plasma');

const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, setTheme: () => {}, accent: 'plasma', setAccent: () => {} });

function initialTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function initialAccent() {
  return normalizeAccent(document.documentElement.getAttribute('data-accent'));
}

/** Theme (light/dark) and accent colour, mirrored onto <html data-theme data-accent> and saved locally. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  const [accent, setAccentState] = useState(initialAccent);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* ignore */
    }
  }, [accent]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const setAccent = useCallback((a) => setAccentState(normalizeAccent(a)), []);
  return <ThemeContext.Provider value={{ theme, toggle, setTheme, accent, setAccent }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
