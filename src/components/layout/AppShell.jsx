import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, matchPath, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import SiteFooter from './SiteFooter.jsx';
import Toaster from './Toaster.jsx';
import { useCelebrations } from './useCelebrations.js';
import { useTheme } from '../../state/ThemeContext.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { recommendations, streak, overallStats, topicStatus } from '../../state/selectors.js';
import { stages } from '../../content/index.js';
import { on } from '../../lib/appEvents.js';
import { getUiPrefs, saveUiPrefs } from '../../lib/uiPrefs.js';

// overlays are lazy so cmdk and the tour stay out of the main bundle until first use
const CommandPalette = lazy(() => import('./CommandPalette.jsx'));
const WelcomeTour = lazy(() => import('../guide/WelcomeTour.jsx'));

/** The six places you go every day — shown in the masthead (desktop) and bottom bar (mobile). */
const PRIMARY = [
  { to: '/', label: 'Today', end: true },
  { to: '/contents', label: 'Contents' },
  { to: '/path', label: 'Path' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/questions', label: 'Practice' },
  { to: '/visualize', label: 'Visualizer' },
];
const MOBILE_BAR = [
  { to: '/', label: 'Today', end: true },
  { to: '/path', label: 'Path' },
  { to: '/questions', label: 'Practice' },
  { to: '/finder', label: 'Finder' },
];

/** Everything else lives in the Index drawer, grouped like a book's back matter. */
const INDEX = [
  {
    section: 'Learn',
    links: [
      { to: '/', label: 'Today', end: true },
      { to: '/contents', label: 'Contents' },
      { to: '/path', label: 'Learning path' },
      { to: '/patterns', label: 'Patterns' },
      { to: '/finder', label: 'Pattern finder' },
      { to: '/visualize', label: 'Visualizer' },
      { to: '/questions', label: 'Practice questions' },
      { to: '/companies', label: 'Company questions' },
    ],
  },
  {
    section: 'JavaScript',
    links: [
      { to: '/toolkit', label: 'DSA toolkit' },
      { to: '/js', label: 'JavaScript for DSA' },
      { to: '/playground', label: 'Playground' },
    ],
  },
  {
    section: 'Review',
    links: [
      { to: '/progress', label: 'Progress' },
      { to: '/revision', label: 'Revision' },
      { to: '/cheatsheet', label: 'Cheat sheet' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

const STATUS_MARK = { locked: '·', available: '○', 'in-progress': '◐', completed: '✓' };
const STATUS_TEXT = { locked: 'locked', available: 'not started', 'in-progress': 'in progress', completed: 'completed' };
/** pages worth offering under "Continue where you left off" */
const STUDY_PAGE = /^\/(topic|visualize|playground|finder|patterns|toolkit|js)(\/|$)/;

/** true when a keystroke is going into a text field or code editor */
function typingInField(e) {
  const t = e.target;
  return !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || !!t.closest?.('.cm-editor'));
}

/** Masthead link: the active page gets an ink underline that slides between items. */
function MastLink({ to, end, children, layoutId = 'mast-active' }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `mast-link ${isActive ? 'active' : ''}`}>
      {({ isActive }) => (
        <>
          {children}
          {isActive && <motion.span layoutId={layoutId} className="mast-underline" aria-hidden="true" transition={{ type: 'spring', stiffness: 520, damping: 42 }} />}
        </>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const { theme, toggle } = useTheme();
  const { progress } = useProgress();
  const [indexOpen, setIndexOpen] = useState(false);
  const [collapsedStages, setCollapsedStages] = useState(() => getUiPrefs().collapsedStages);
  const location = useLocation();
  const loc = location.pathname + location.search;
  const rec = recommendations(progress);
  const st = streak(progress);
  const overall = overallStats(progress).overall;
  const fill = !!matchPath('/topic/:topicId/q/:questionId', location.pathname);
  const indexBtn = useRef(null);
  const drawerRef = useRef(null);
  useCelebrations(progress);

  useEffect(() => setIndexOpen(false), [location.pathname]);
  useEffect(() => saveUiPrefs({ collapsedStages }), [collapsedStages]);
  useEffect(() => {
    if (STUDY_PAGE.test(location.pathname)) saveUiPrefs({ lastStudyLocation: loc });
  }, [loc, location.pathname]);

  // ---- guide (welcome tour) and command palette ----
  const [tourOpen, setTourOpen] = useState(() => !getUiPrefs().tourSeen);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const showPalette = useCallback(() => {
    setPaletteLoaded(true);
    setPaletteOpen(true);
  }, []);
  const closeTour = useCallback(() => setTourOpen(false), []);
  useEffect(() => {
    if (tourOpen) saveUiPrefs({ tourSeen: true });
  }, [tourOpen]);
  useEffect(() => on('open-guide', () => setTourOpen(true)), []);
  useEffect(() => on('open-palette', showPalette), [showPalette]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (paletteOpen) setPaletteOpen(false);
        else showPalette();
      } else if (e.key === 'Escape' && indexOpen) {
        setIndexOpen(false);
        indexBtn.current?.focus();
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !typingInField(e) && !paletteOpen && !tourOpen) {
        e.preventDefault();
        showPalette();
      } else if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey && !typingInField(e) && !paletteOpen) {
        e.preventDefault();
        setTourOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, tourOpen, indexOpen, showPalette]);

  // move focus into the drawer when it opens
  useEffect(() => {
    if (indexOpen) drawerRef.current?.querySelector('a, button')?.focus();
  }, [indexOpen]);

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="masthead">
        <div className="mast-row">
          <Link to="/" className="wordmark" aria-label="DSA Journey — today">
            <span className="wordmark-dsa">dsa</span>
            <span className="wordmark-journey">Journey</span>
            <span className="wordmark-ed">in JavaScript</span>
          </Link>

          <nav className="mast-nav" aria-label="Main">
            {PRIMARY.map((n) => (
              <MastLink key={n.to} to={n.to} end={n.end}>
                {n.label}
              </MastLink>
            ))}
          </nav>

          <div className="mast-tools">
            <button type="button" className="mast-search" onClick={showPalette} aria-label="Search everything (Command K)">
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            {st.current > 0 && (
              <span className="mast-streak" title={`Longest streak: ${st.longest} days`}>
                day {st.current}
              </span>
            )}
            <button type="button" className="mast-text-btn hide-sm" onClick={() => setTourOpen(true)} title="Guide (press ?)">
              Guide
            </button>
            <button type="button" className="mast-text-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? 'Day' : 'Night'}
            </button>
            <button
              ref={indexBtn}
              type="button"
              className="mast-index-btn"
              onClick={() => setIndexOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={indexOpen}
              aria-controls="index-drawer"
            >
              Index
            </button>
          </div>
        </div>
        <div className="mast-rule" role="progressbar" aria-label="Overall progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overall} title={`Overall progress: ${overall}%`}>
          <span style={{ width: `${overall}%` }} />
        </div>
      </header>

      <AnimatePresence>
        {indexOpen && (
          <>
            <motion.div className="index-backdrop" onClick={() => setIndexOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              id="index-drawer"
              ref={drawerRef}
              className="index-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Index — every page and topic"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.26, ease: [0.3, 0.7, 0.1, 1] }}
            >
              <div className="index-head">
                <span className="eyebrow">Index</span>
                <button type="button" className="mast-text-btn" onClick={() => { setIndexOpen(false); indexBtn.current?.focus(); }}>
                  Close <kbd>esc</kbd>
                </button>
              </div>
              <div className="index-pages">
                {INDEX.map((g) => (
                  <div key={g.section} className="index-group">
                    <div className="eyebrow">{g.section}</div>
                    {g.links.map((n) => (
                      <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `index-link ${isActive ? 'active' : ''}`}>
                        {n.label}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>

              <div className="index-topics">
                <div className="eyebrow">Topics</div>
                {stages.map((stage, si) => {
                  const closed = !!collapsedStages[stage.id];
                  const done = stage.topics.filter((t) => topicStatus(t, progress) === 'completed').length;
                  return (
                    <div key={stage.id} className="index-stage">
                      <button type="button" className="index-stage-title" aria-expanded={!closed} onClick={() => setCollapsedStages((c) => ({ ...c, [stage.id]: !closed }))}>
                        <span className="folio">{String(si + 1).padStart(2, '0')}</span>
                        <span className="index-stage-name">{stage.title}</span>
                        <span className="folio">
                          {done}/{stage.topics.length} {closed ? '+' : '−'}
                        </span>
                      </button>
                      {!closed && (
                        <ol className="index-stage-list">
                          {stage.topics.map((t) => {
                            const s = topicStatus(t, progress);
                            return (
                              <li key={t.id}>
                                <NavLink to={`/topic/${t.id}`} className={({ isActive }) => `index-topic status-${s} ${isActive ? 'active' : ''}`}>
                                  <span className="index-mark" aria-hidden="true">
                                    {STATUS_MARK[s]}
                                  </span>
                                  <span>{t.title}</span>
                                  <span className="sr-only">, {STATUS_TEXT[s]}</span>
                                </NavLink>
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="index-foot">
                <span className="folio">{overall}% of the book</span>
                <span>
                  Now reading <Link to={`/topic/${rec.current.id}`}>{rec.current.title}</Link>
                </span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className={`main ${fill ? 'main-fill' : ''}`} id="main">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={location.pathname}
            className="route"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.3, 0.7, 0.1, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        {!fill && <SiteFooter />}
      </main>

      <nav className="bottom-bar" aria-label="Main (mobile)">
        {MOBILE_BAR.map((n) => (
          <MastLink key={n.to} to={n.to} end={n.end} layoutId="bottom-active">
            {n.label}
          </MastLink>
        ))}
        <button type="button" className="mast-link" onClick={() => setIndexOpen(true)} aria-haspopup="dialog">
          Index
        </button>
      </nav>

      <Toaster />
      <Suspense fallback={null}>
        {paletteLoaded && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onOpenGuide={() => setTourOpen(true)} />}
        {tourOpen && <WelcomeTour onClose={closeTour} />}
      </Suspense>
    </div>
  );
}
