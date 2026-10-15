// UI preferences (guide/coach flags, sidebar state, last study page, palette history).
// Kept separate from study progress (own localStorage key) so Reset / Import / Export of
// progress never touches layout preferences, and the progress file format is unchanged.
import { useSyncExternalStore } from 'react';

const KEY = 'dsa-journey:ui:v1';

const DEFAULT = {
  /** desktop: sidebar hidden with the ☰ button */
  sidebarCollapsed: false,
  /** sidebar stage groups the learner collapsed, keyed by stage id */
  collapsedStages: {},
  /** last study page (topic / question / visualizer / playground) for "Continue where you left off" */
  lastStudyLocation: '',
  /** the welcome tour has been shown (opened automatically only once) */
  tourSeen: false,
  /** coach tips the learner dismissed, keyed by tip id (e.g. "tab:learn") */
  coachDismissed: {},
  showCoachTips: true,
  /** topic tabs the learner has opened, e.g. { arrays: ['visualize'] } (study-path ticks for untracked steps) */
  visitedTabs: {},
  /** command palette: most recently chosen items ({ id, title, to, group }), newest first */
  recentCommands: [],
};

let cache = null;
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function getUiPrefs() {
  if (!cache) cache = read();
  return cache;
}

export function saveUiPrefs(patch) {
  cache = { ...getUiPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage blocked — preferences just won't persist
  }
  listeners.forEach((l) => l());
}

/** Reactive UI prefs, for components that render from them (coach tips, settings, stepper). */
export function useUiPrefs() {
  return useSyncExternalStore((fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, getUiPrefs);
}

/** Remember that a topic tab was opened (no-op when already recorded). */
export function markTabVisited(topicId, tab) {
  const prefs = getUiPrefs();
  const list = prefs.visitedTabs[topicId] || [];
  if (list.includes(tab)) return;
  saveUiPrefs({ visitedTabs: { ...prefs.visitedTabs, [topicId]: [...list, tab] } });
}
