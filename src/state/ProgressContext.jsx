import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { initialProgress, migrate, progressReducer, STORAGE_KEY } from './progressReducer.js';

const ProgressContext = createContext(null);

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrate(JSON.parse(raw)) : initialProgress();
  } catch {
    // unreadable store: keep a copy (it could still be recovered by hand) and start fresh instead of crashing
    try {
      if (raw) localStorage.setItem(`${STORAGE_KEY}:corrupt`, raw);
    } catch {
      /* storage unavailable */
    }
    return initialProgress();
  }
}

export function ProgressProvider({ children }) {
  const [state, dispatch] = useReducer(progressReducer, undefined, load);
  const timer = useRef(null);

  // Debounced persistence.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage full or unavailable — progress stays in memory */
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [state]);

  const value = useMemo(() => ({ progress: state, dispatch }), [state]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
