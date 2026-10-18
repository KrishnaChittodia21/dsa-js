import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  Code2,
  Compass,
  FileText,
  Flame,
  House,
  Layers,
  LayoutGrid,
  ListTree,
  Moon,
  RotateCcw,
  Route,
  Search,
  Settings,
  Sun,
  Target,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import SiteFooter from './SiteFooter.jsx';
import Toaster from './Toaster.jsx';
import { useCelebrations } from './useCelebrations.js';
import { useAchievementDetection } from '../../state/useAchievements.js';
import { achievementById, TIER_LABEL } from '../../content/achievements.js';
import { useTheme } from '../../state/ThemeContext.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { mistakeQuestions, overallStats, streak, topicStats, topicStatus } from '../../state/selectors.js';
import { questionById, stages, topicById } from '../../content/index.js';
import { ProgressBar } from '../ui/primitives.jsx';
import LogoMark from '../ui/LogoMark.jsx';
import { on } from '../../lib/appEvents.js';
import { getUiPrefs, saveUiPrefs } from '../../lib/uiPrefs.js';

// overlays are lazy so cmdk and the tour stay out of the main bundle until first use
const CommandPalette = lazy(() => import('./CommandPalette.jsx'));
const WelcomeTour = lazy(() => import('../guide/WelcomeTour.jsx'));
const AchievementCelebration = lazy(() => import('../achievements/AchievementCelebration.jsx'));

/*
 * Kinetic Voxel shell: a slim mono STATUS LINE on top, a floating bottom DOCK (desktop) / touch TAB DOCK
 * (≤900px), a "More" popover/sheet with every other route, and a SYLLABUS drawer (the old sidebar's
 * stage → topic tree). <main> is the scroll container (TopicPage scrolls `.main`).
 * Layout vars live in tokens.css: --status-h, --dock-h, --dock-gap, --dock-space (see shell.css).
 */

/** primary routes in the desktop dock (order follows the mockup). `match` decides the active key. */
const DOCK = [
  { k: 'home', to: '/', label: 'Dashboard', icon: House, match: (p) => p === '/' },
  { k: 'path', to: '/path', label: 'Learning path', icon: Route, match: (p) => p.startsWith('/path') },
  { k: 'topics', to: '/contents', label: 'Topics & contents', icon: ListTree, match: (p) => p.startsWith('/contents') || (p.startsWith('/topic/') && !p.includes('/q/')) },
  { k: 'patterns', to: '/patterns', label: 'Patterns', icon: Layers, match: (p) => p.startsWith('/patterns') },
  { k: 'practice', to: '/questions', label: 'Practice · questions', icon: Code2, match: (p) => p.startsWith('/questions') || /^\/topic\/[^/]+\/q\//.test(p) },
  { k: 'visualize', to: '/visualize', label: 'Visualizer', icon: Activity, match: (p) => p.startsWith('/visualize') },
  { k: 'revision', to: '/revision', label: 'Revision', icon: RotateCcw, match: (p) => p.startsWith('/revision') },
  { k: 'companies', to: '/companies', label: 'Companies', icon: Building2, match: (p) => p.startsWith('/companies') },
  { k: 'toolkit', to: '/toolkit', label: 'JS DSA toolkit', icon: Wrench, match: (p) => p.startsWith('/toolkit') },
  { k: 'achievements', to: '/achievements', label: 'Achievements', icon: Award, match: (p) => p.startsWith('/achievements') },
];
/** touch tab dock: Home / Path / Practice / Revise / More */
const TABS = ['home', 'path', 'practice', 'revision'];
const TAB_LABEL = { home: 'Home', path: 'Path', practice: 'Practice', revision: 'Revise' };
/** routes only reachable from "More" on desktop (the sheet on touch also lists the dock routes that aren't tabs) */
const MORE = [
  { to: '/finder', label: 'Pattern Finder', icon: Target, sub: 'which pattern?' },
  { to: '/progress', label: 'Progress', icon: BarChart3, sub: 'stats' },
  { to: '/cheatsheet', label: 'Cheat Sheet', icon: FileText, sub: 'all patterns' },
  { to: '/js', label: 'JavaScript for DSA', icon: Code2, sub: 'reference' },
  { to: '/playground', label: 'Playground', icon: Terminal, sub: 'scratch pad' },
  { to: '/settings', label: 'Settings', icon: Settings, sub: 'theme · data' },
];
const MORE_MATCH = (p) => MORE.some((m) => p.startsWith(m.to));

const STATUS_TEXT = { locked: 'locked', available: 'not started', 'in-progress': 'in progress', completed: 'completed' };
/** pages worth offering under "Continue where you left off" */
const STUDY_PAGE = /^\/(topic|visualize|playground|finder|patterns|toolkit|js)(\/|$)/;
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
const SEARCH_KEY = IS_MAC ? '⌘K' : 'Ctrl K';

/** true when a keystroke is going into a text field or code editor */
function typingInField(e) {
  const t = e.target;
  return !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || !!t.closest?.('.cm-editor'));
}

/** status-line breadcrumb (~/journey/<crumb>) + context segment for the current route */
function describeRoute(pathname, stats) {
  let m = matchPath('/topic/:topicId/q/:questionId', pathname);
  if (m) {
    const t = topicById[m.params.topicId];
    const q = questionById[m.params.questionId];
    return { crumb: `${m.params.topicId}/${m.params.questionId}`, ctx: [t?.title, q ? `${q.title} · ${q.difficulty}` : null].filter(Boolean).join(' › ') || 'question' };
  }
  m = matchPath('/topic/:topicId', pathname);
  if (m) {
    const t = topicById[m.params.topicId];
    return { crumb: `topics/${m.params.topicId}`, ctx: t ? `${t.stageTitle ? `${t.stageTitle} › ` : ''}${t.title}` : 'topic' };
  }
  if (matchPath('/companies/:companyId', pathname)) return { crumb: pathname.slice(1), ctx: 'company question list' };
  if (matchPath('/toolkit/:toolId', pathname)) return { crumb: pathname.slice(1), ctx: 'toolkit structure' };
  const seg = pathname.split('/')[1] || '';
  const map = {
    '': ['dashboard', `${stats.topicsCompleted} / ${stats.topicsTotal} topics complete`],
    path: ['path', `${stages.length} stages · ${stats.topicsTotal} topics`],
    contents: ['contents', `${stats.topicsTotal} topics · ${stats.total} problems`],
    patterns: ['patterns', `${stats.totalPatterns} patterns`],
    finder: ['patterns/finder', 'which pattern fits?'],
    questions: ['practice', `${stats.total} problems`],
    visualize: ['visualize', 'step-through animations'],
    revision: ['revision', 'weak areas · mistakes'],
    progress: ['progress', `${stats.overall}% overall mastery`],
    companies: ['companies', 'interview questions by company'],
    toolkit: ['toolkit', 'JS data structures'],
    js: ['js-reference', 'JavaScript for DSA'],
    playground: ['playground', 'scratch pad'],
    achievements: ['achievements', 'badges'],
    cheatsheet: ['cheatsheet', 'every pattern on one page'],
    settings: ['settings', 'appearance · guide · data'],
  };
  const [crumb, ctx] = map[seg] || ['404', 'page not found'];
  return { crumb, ctx };
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const day = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return { label: `${day} · ${time}`, iso: now.toISOString() };
}

/** fixed stage background: two hard-edged light beams, horizon, perspective dot-matrix floor, grain */
function StageBackground() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-beam bg-beam--a" />
      <div className="bg-beam bg-beam--b" />
      <div className="bg-horizon" />
      <div className="bg-floor" />
      <div className="bg-grain" />
    </div>
  );
}

function ThemeSwitch({ theme, setTheme, className = 'sl-theme' }) {
  return (
    <div className={className} role="group" aria-label="Theme">
      <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')} title="Graphite (dark)" aria-label="Graphite (dark theme)">
        <Moon aria-hidden="true" />
      </button>
      <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')} title="Porcelain (light)" aria-label="Porcelain (light theme)">
        <Sun aria-hidden="true" />
      </button>
    </div>
  );
}

/** "More": a popover above the dock (desktop) / a bottom sheet (≤900px). */
function MorePanel({ open, onClose, triggerRef, onSearch, onGuide, onSyllabus, theme, setTheme, pathname }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    ref.current?.querySelector('a, button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose(true);
      }
    };
    const onDown = (e) => {
      if (!ref.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) onClose(false);
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, onClose, triggerRef]);
  if (!open) return null;
  const dockOnly = DOCK.filter((d) => !TABS.includes(d.k));
  return (
    <>
      <div className="more-scrim" aria-hidden="true" />
      <div
        ref={ref}
        className="more-panel"
        role="dialog"
        aria-label="More pages"
        onBlur={(e) => {
          if (e.relatedTarget && !ref.current?.contains(e.relatedTarget) && !triggerRef.current?.contains(e.relatedTarget)) onClose(false);
        }}
      >
        <div className="more-grab" aria-hidden="true" />
        <button type="button" className="more-search" onClick={onSearch}>
          <Search aria-hidden="true" />
          <span>Find a problem, topic or pattern…</span>
          <span className="kbd" aria-hidden="true">
            {SEARCH_KEY}
          </span>
        </button>
        <div className="more-grid">
          {dockOnly.map((d) => {
            const Icon = d.icon;
            return (
              <Link key={d.to} to={d.to} className="more-item more-item--dock" aria-current={d.match(pathname) ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                <span>{d.label}</span>
              </Link>
            );
          })}
          {MORE.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.to} to={m.to} className="more-item" aria-current={pathname.startsWith(m.to) ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                <span>{m.label}</span>
                <small>{m.sub}</small>
              </Link>
            );
          })}
          <button type="button" className="more-item" onClick={onSyllabus}>
            <BookOpen aria-hidden="true" />
            <span>Syllabus</span>
            <small>all topics</small>
          </button>
        </div>
        <button type="button" className="more-guide" onClick={onGuide}>
          <span className="more-guide-q" aria-hidden="true">
            ?
          </span>
          <span className="more-guide-t">
            <b>Guide</b>
            <small>
              how the study loop works<span className="more-guide-key"> · press ?</span>
            </small>
          </span>
          <Compass aria-hidden="true" />
        </button>
        <div className="more-foot">
          <span>theme</span>
          <ThemeSwitch theme={theme} setTheme={setTheme} className="sl-theme more-theme" />
        </div>
      </div>
    </>
  );
}

/** the old sidebar's syllabus: stage → topic tree with status dots and mastery bars, as a drawer */
function SyllabusDrawer({ open, onClose, progress, collapsedStages, setCollapsedStages }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="scrim" className="drawer-scrim" aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.nav
            key="drawer"
            className="syllabus"
            aria-label="Syllabus"
            initial={{ x: '-104%' }}
            animate={{ x: 0 }}
            exit={{ x: '-104%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
          >
            <div className="syllabus-head">
              <span className="eyebrow">
                <span className="pip" /> Syllabus
              </span>
              <button ref={closeRef} type="button" className="iconbtn" onClick={onClose} aria-label="Close the syllabus">
                <X aria-hidden="true" />
              </button>
            </div>
            {stages.map((stage, si) => {
              const closed = !!collapsedStages[stage.id];
              const done = stage.topics.filter((t) => topicStatus(t, progress) === 'completed').length;
              return (
                <div key={stage.id} className="side-stage">
                  <button type="button" className="side-stage-title" aria-expanded={!closed} onClick={() => setCollapsedStages((c) => ({ ...c, [stage.id]: !closed }))}>
                    <span className="side-stage-name">
                      <span className="side-stage-num">{String(si + 1).padStart(2, '0')}</span>
                      {stage.title}
                    </span>
                    <span className="side-stage-meta">
                      {done}/{stage.topics.length}
                      <ChevronDown size={14} aria-hidden="true" className={`chev-icon ${closed ? 'closed' : ''}`} />
                    </span>
                  </button>
                  {!closed && (
                    <div className="side-stage-list">
                      {stage.topics.map((t) => {
                        const s = topicStatus(t, progress);
                        const mastery = topicStats(t, progress).mastery;
                        return (
                          <NavLink key={t.id} to={`/topic/${t.id}`} className={({ isActive }) => `nav-link side-topic ${isActive ? 'active' : ''}`}>
                            <span className={`dot dot-${s}`} aria-hidden="true" />
                            <span className="side-topic-title">{t.title}</span>
                            <span className="side-topic-bar" title={`${mastery}% mastered`}>
                              <ProgressBar value={mastery} size="sm" variant={s === 'completed' ? 'success' : ''} label={`${t.title}: ${mastery}% mastered`} />
                            </span>
                            <span className="sr-only">, {STATUS_TEXT[s]}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AppShell() {
  const { theme, setTheme } = useTheme();
  const { progress, dispatch } = useProgress();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const loc = pathname + location.search;
  const st = streak(progress);
  const stats = useMemo(() => overallStats(progress), [progress]);
  // questions to redo (mistakes not yet solved) — the badge on the Revise key
  const reviseCount = useMemo(() => mistakeQuestions(progress).filter((q) => progress.questions[q.id]?.status !== 'solved').length, [progress]);
  const { crumb, ctx } = describeRoute(pathname, stats);
  const clock = useClock();
  const fill = !!matchPath('/topic/:topicId/q/:questionId', pathname);
  useCelebrations(progress);
  const { queue: unlocked, dismiss: dismissUnlocked } = useAchievementDetection(progress, dispatch);
  const viewAllAchievements = useCallback(() => {
    dismissUnlocked();
    navigate('/achievements');
  }, [dismissUnlocked, navigate]);

  // ---- More popover/sheet + syllabus drawer ----
  const [moreOpen, setMoreOpen] = useState(false);
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [collapsedStages, setCollapsedStages] = useState(() => getUiPrefs().collapsedStages);
  const moreBtnRef = useRef(null);
  const moreTabRef = useRef(null);
  const moreTrigger = useRef(null);
  const syllabusReturn = useRef(null);
  const closeMore = useCallback((restoreFocus) => {
    setMoreOpen(false);
    if (restoreFocus) moreTrigger.current?.focus();
  }, []);
  const toggleMore = (ref) => {
    moreTrigger.current = ref.current;
    setMoreOpen((o) => !o);
  };
  const openSyllabus = () => {
    syllabusReturn.current = moreTrigger.current;
    setMoreOpen(false);
    setSyllabusOpen(true);
  };
  const closeSyllabus = useCallback(() => {
    setSyllabusOpen(false);
    syllabusReturn.current?.focus?.();
  }, []);
  useEffect(() => {
    setMoreOpen(false);
    setSyllabusOpen(false);
  }, [pathname]);
  useEffect(() => saveUiPrefs({ collapsedStages }), [collapsedStages]);
  useEffect(() => {
    if (STUDY_PAGE.test(pathname)) saveUiPrefs({ lastStudyLocation: loc });
  }, [loc, pathname]);

  // ---- guide (welcome tour) and command palette ----
  const [tourOpen, setTourOpen] = useState(() => !getUiPrefs().tourSeen);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const showPalette = useCallback(() => {
    setMoreOpen(false);
    setPaletteLoaded(true);
    setPaletteOpen(true);
  }, []);
  const openTour = useCallback(() => {
    setMoreOpen(false);
    setTourOpen(true);
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
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !typingInField(e) && !paletteOpen && !tourOpen) {
        e.preventDefault();
        showPalette();
      } else if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey && !typingInField(e) && !paletteOpen) {
        e.preventDefault();
        openTour();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, tourOpen, showPalette, openTour]);

  const streakLabel = st.current > 0 ? `${st.current}-day streak` : 'no streak yet';
  const moreActive = MORE_MATCH(pathname);

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <StageBackground />

      {/* ---------- status line ---------- */}
      <header className="sl">
        <Link to="/" className="sl-brand" aria-label="DSA Journey — dashboard">
          <LogoMark />
          <b>
            DSA&nbsp;Journey<i>.js</i>
          </b>
        </Link>
        <div className="sl-seg sl-path" title={`~/journey/${crumb}`}>
          <em>~/journey/</em>
          <strong>{crumb}</strong>
        </div>
        <div className="sl-seg sl-ctx sl-hide-md" title={ctx}>
          {ctx}
        </div>
        <div className="sl-spacer" />
        <div className={`sl-seg sl-streak ${st.current > 0 ? '' : 'is-off'}`} title={`${streakLabel} · longest ${st.longest} day${st.longest === 1 ? '' : 's'}`}>
          {st.activeToday ? <span className="sl-live" aria-hidden="true" /> : <Flame aria-hidden="true" />}
          <span className="sl-streak-long">{streakLabel}</span>
          <span className="sl-streak-short" aria-hidden="true">
            {st.current}d
          </span>
        </div>
        <div className="sl-seg sl-hide-md">
          {stats.solved} / {stats.total} solved
        </div>
        <div className="sl-seg sl-hide-lg">
          <time dateTime={clock.iso}>{clock.label}</time>
        </div>
        <button type="button" className="sl-seg sl-guide" onClick={openTour} aria-label="Open the guide" title="Guide (press ?)">
          <Compass aria-hidden="true" />
          <span className="sl-label">guide</span>
          <span className="kbd" aria-hidden="true">
            ?
          </span>
        </button>
        <button type="button" className="sl-seg sl-search" onClick={showPalette} aria-label={`Search (${SEARCH_KEY})`} title={`Search (${SEARCH_KEY} or /)`}>
          <Search aria-hidden="true" className="sl-search-ico" />
          <span className="sl-label">search</span>
          <span className="kbd sl-kbd" aria-hidden="true">
            {SEARCH_KEY}
          </span>
        </button>
        <div className="sl-seg sl-tail">
          <ThemeSwitch theme={theme} setTheme={setTheme} />
          <NavLink to="/settings" className="sl-settings" aria-label="Settings" title="Settings">
            <Settings aria-hidden="true" />
          </NavLink>
        </div>
      </header>

      <main className={`main ${fill ? 'main-fill' : ''}`} id="main" tabIndex={-1}>
        <AnimatePresence initial={false}>
          <motion.div
            key={pathname}
            className="route"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        {!fill && <SiteFooter />}
      </main>

      {/* ---------- floating dock (desktop) ---------- */}
      <div className="dock-wrap">
        <nav className="dock" aria-label="Primary">
          {DOCK.map((d) => {
            const Icon = d.icon;
            return (
              <Link key={d.k} to={d.to} className="dock-item" data-k={d.k} aria-current={d.match(pathname) ? 'page' : undefined} aria-label={d.label}>
                <Icon aria-hidden="true" />
                {d.k === 'revision' && reviseCount > 0 && (
                  <span className="dock-badge" aria-hidden="true">
                    {reviseCount > 99 ? '99+' : reviseCount}
                  </span>
                )}
                <span className="dock-tip" aria-hidden="true">
                  {d.label}
                </span>
              </Link>
            );
          })}
          <button
            ref={moreBtnRef}
            type="button"
            className="dock-item"
            data-k="more"
            aria-label="More pages"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-current={moreActive ? 'page' : undefined}
            onClick={() => toggleMore(moreBtnRef)}
          >
            <LayoutGrid aria-hidden="true" />
            <span className="dock-tip" aria-hidden="true">
              More
            </span>
          </button>
          <span className="dock-sep" aria-hidden="true" />
          <button type="button" className="dock-item dock-guide" onClick={openTour} aria-label="Guide (press ?)">
            <span className="dock-q" aria-hidden="true">
              ?
            </span>
            <span className="dock-tip" aria-hidden="true">
              Guide · press ?
            </span>
          </button>
          <button type="button" className="dock-search" onClick={showPalette} aria-label={`Search (${SEARCH_KEY})`}>
            <Search aria-hidden="true" />
            <span>Find a problem…</span>
            <span className="kbd" aria-hidden="true">
              {SEARCH_KEY}
            </span>
          </button>
        </nav>
      </div>

      {/* ---------- touch tab dock (≤900px) ---------- */}
      <nav className="tabdock" aria-label="Primary (touch)">
        {TABS.map((k) => {
          const d = DOCK.find((x) => x.k === k);
          const Icon = d.icon;
          return (
            <Link key={k} to={d.to} className="tabdock-item" aria-current={d.match(pathname) ? 'page' : undefined}>
              <span className="tabdock-ico">
                <Icon aria-hidden="true" />
                {k === 'revision' && reviseCount > 0 && (
                  <span className="dock-badge" aria-hidden="true">
                    {reviseCount > 99 ? '99+' : reviseCount}
                  </span>
                )}
              </span>
              <span className="tabdock-label">{TAB_LABEL[k]}</span>
            </Link>
          );
        })}
        <button
          ref={moreTabRef}
          type="button"
          className="tabdock-item"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-current={moreOpen || moreActive || DOCK.some((d) => !TABS.includes(d.k) && d.match(pathname)) ? 'page' : undefined}
          onClick={() => toggleMore(moreTabRef)}
        >
          <span className="tabdock-ico">
            <LayoutGrid aria-hidden="true" />
          </span>
          <span className="tabdock-label">More</span>
        </button>
      </nav>

      <MorePanel
        open={moreOpen}
        onClose={closeMore}
        triggerRef={moreTrigger}
        onSearch={showPalette}
        onGuide={openTour}
        onSyllabus={openSyllabus}
        theme={theme}
        setTheme={setTheme}
        pathname={pathname}
      />
      <SyllabusDrawer open={syllabusOpen} onClose={closeSyllabus} progress={progress} collapsedStages={collapsedStages} setCollapsedStages={setCollapsedStages} />

      <Toaster />
      <Suspense fallback={null}>
        {paletteLoaded && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onOpenGuide={openTour} />}
        {tourOpen && <WelcomeTour onClose={closeTour} />}
        {/* achievement unlocks wait until the guide is closed */}
        {unlocked.length > 0 && !tourOpen && <AchievementCelebration items={unlocked} onClose={dismissUnlocked} onViewAll={viewAllAchievements} />}
      </Suspense>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {tourOpen
          ? ''
          : unlocked.length === 1
          ? `Achievement unlocked: ${achievementById[unlocked[0].id]?.name}${TIER_LABEL[unlocked[0].tier] ? `, ${TIER_LABEL[unlocked[0].tier]} tier` : ''}`
          : unlocked.length > 1
            ? `You've earned ${unlocked.length} achievements`
            : ''}
      </div>
    </div>
  );
}
