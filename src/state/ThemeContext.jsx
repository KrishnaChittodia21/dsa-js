import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'dsa-journey:theme';
const ACCENT_KEY = 'dsa-journey:accent';

// Kinetic Voxel accents (tokens.css section 4). The default, plasma, is the design's primary-action colour.
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

const ThemeContext = createContext({ theme: 'dark', pref: 'system', toggle: () => {}, setTheme: () => {}, accent: 'plasma', setAccent: () => {} });

const LIGHT_QUERY = '(prefers-color-scheme: light)';
const deviceTheme = () => {
  try {
    return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};
/** the saved choice: 'light', 'dark' or 'system' (anything else, including nothing saved, means system) */
function initialPref() {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

function initialAccent() {
  return normalizeAccent(document.documentElement.getAttribute('data-accent'));
}

/**
 * Theme and accent colour, mirrored onto <html data-theme data-accent> and saved locally. `pref` is the choice
 * (light, dark or system); `theme` is what is on screen, following the device while `pref` is system.
 */
export function ThemeProvider({ children }) {
  const [pref, setTheme] = useState(initialPref);
  const [device, setDevice] = useState(deviceTheme);
  const [accent, setAccentState] = useState(initialAccent);
  const theme = pref === 'system' ? device : pref;
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia(LIGHT_QUERY);
    } catch {
      return undefined;
    }
    const on = () => setDevice(mq.matches ? 'light' : 'dark');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      /* ignore */
    }
  }, [pref]);
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* ignore */
    }
  }, [accent]);
  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme]);
  const setAccent = useCallback((a) => setAccentState(normalizeAccent(a)), []);
  return <ThemeContext.Provider value={{ theme, pref, toggle, setTheme, accent, setAccent }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
