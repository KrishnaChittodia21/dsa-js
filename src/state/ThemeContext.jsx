import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'dsa-journey:theme';
const ACCENT_KEY = 'dsa-journey:accent';

export const ACCENTS = [
  { id: 'indigo', label: 'Indigo' },
  { id: 'teal', label: 'Teal' },
  { id: 'rose', label: 'Rose' },
  { id: 'amber', label: 'Amber' },
];
const ACCENT_IDS = ACCENTS.map((a) => a.id);

const ThemeContext = createContext({ theme: 'light', toggle: () => {}, setTheme: () => {}, accent: 'indigo', setAccent: () => {} });

function initialTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function initialAccent() {
  const attr = document.documentElement.getAttribute('data-accent');
  return ACCENT_IDS.includes(attr) ? attr : 'indigo';
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
  const setAccent = useCallback((a) => setAccentState(ACCENT_IDS.includes(a) ? a : 'indigo'), []);
  return <ThemeContext.Provider value={{ theme, toggle, setTheme, accent, setAccent }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
