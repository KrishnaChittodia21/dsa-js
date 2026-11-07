import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, matchPath, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  Award,
  CalendarClock,
  ChartNoAxesColumn,
  Building2,
  Code2,
  Bookmark,
  Clapperboard,
  Compass,
  Flame,
  House,
  Layers,
  LayoutGrid,
  ListTree,
  Moon,
  RotateCcw,
  Search,
  Settings,
  Sun,
  Target,
  Wrench,
} from 'lucide-react';
import SiteFooter from './SiteFooter.jsx';
import Toaster from './Toaster.jsx';
import { useCelebrations } from './useCelebrations.js';
import { useAchievementDetection } from '../../state/useAchievements.js';
import { achievementById, TIER_LABEL } from '../../content/achievements.js';
import { useTheme } from '../../state/ThemeContext.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { mistakeQuestions, overallStats, streak } from '../../state/selectors.js';
import { questionById, stages, topicById } from '../../content/index.js';
import LogoMark from '../ui/LogoMark.jsx';
import { on } from '../../lib/appEvents.js';
import { getUiPrefs, saveUiPrefs } from '../../lib/uiPrefs.js';
import { guideFor } from '../guide/pageGuides.js';

// overlays are lazy so cmdk and the tour stay out of the main bundle until first use
const CommandPalette = lazy(() => import('./CommandPalette.jsx'));
const WelcomeTour = lazy(() => import('../guide/WelcomeTour.jsx'));
const PageGuide = lazy(() => import('../guide/PageGuide.jsx'));
const AchievementCelebration = lazy(() => import('../achievements/AchievementCelebration.jsx'));

/*
 * Kinetic Voxel shell: a slim mono STATUS LINE on top, a floating bottom DOCK (desktop) / touch TAB DOCK
 * (≤900px), a "More" popover/sheet with every other route, a Back button at the top of the page content and a floating
 * "Guide me" button. <main> is the scroll container (TopicPage scrolls `.main`).
 * Layout vars live in tokens.css: --status-h, --dock-h, --dock-gap, --dock-space (see shell.css).
 */

/** primary routes in the desktop dock (order follows the mockup). `match` decides the active key. */
const DOCK = [
  { k: 'home', to: '/', label: 'Dashboard', icon: House, match: (p) => p === '/' },
  { k: 'progress', to: '/progress', label: 'Progress', icon: ChartNoAxesColumn, match: (p) => p.startsWith('/progress') },
  { k: 'plan', to: '/plan', label: 'Plan your journey', icon: CalendarClock, match: (p) => p.startsWith('/plan') },
  { k: 'topics', to: '/contents', label: 'Topics & contents', icon: ListTree, match: (p) => p.startsWith('/contents') || (p.startsWith('/topic/') && !p.includes('/q/')) },
  { k: 'patterns', to: '/patterns', label: 'Patterns', icon: Layers, match: (p) => p.startsWith('/patterns') },
  { k: 'visualize', to: '/visualize', label: 'Visualizer', icon: Activity, match: (p) => p.startsWith('/visualize') },
  { k: 'revision', to: '/revision', label: 'Revision', icon: RotateCcw, match: (p) => p.startsWith('/revision') },
  { k: 'shorts', to: '/shorts', label: 'Shorts', icon: Clapperboard, match: (p) => p.startsWith('/shorts') },
  { k: 'companies', to: '/companies', label: 'Companies', icon: Building2, match: (p) => p.startsWith('/companies') },
  { k: 'achievements', to: '/achievements', label: 'Achievements', icon: Award, match: (p) => p.startsWith('/achievements') },
];
/** touch tab dock: Home / Plan / Progress / Revise / More */
const TABS = ['home', 'plan', 'progress', 'revision'];
const TAB_LABEL = { home: 'Home', plan: 'Plan', progress: 'Progress', revision: 'Revise' };
/** routes only reachable from "More" on desktop (the sheet on touch also lists the dock routes that aren't tabs) */
const MORE = [
  { to: '/questions', label: 'Practice', icon: Code2, sub: 'all questions' },
  { to: '/tools', label: 'Tools', icon: Wrench, sub: 'cheat sheet · JS · playground' },
  { to: '/finder', label: 'Pattern Finder', icon: Target, sub: 'which pattern?' },
  { to: '/saved', label: 'Saved', icon: Bookmark, sub: 'for later' },
  { to: '/settings', label: 'Settings', icon: Settings, sub: 'theme · data' },
];
const MORE_MATCH = (p) => p.startsWith('/toolkit/') || MORE.some((m) => p.startsWith(m.to));
/** the status-line page chip: name + icon of the dock / More entry the route belongs to */
function pageOf(p) {
  const hit = DOCK.find((d) => d.match(p)) || MORE.find((m) => p.startsWith(m.to));
  if (hit) return hit;
  if (p.startsWith('/topic/')) return { label: 'Practice', icon: Code2 }; // question pages
  if (p.startsWith('/toolkit/')) return MORE.find((m) => m.to === '/tools');
  return { label: 'Not found', icon: Compass };
}

/** pages worth offering under "Continue where you left off" */
const STUDY_PAGE = /^\/(topic|visualize|tools|finder|patterns|toolkit)(\/|$)/;
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
  if (matchPath('/shorts/:id', pathname)) return { crumb: pathname.slice(1), ctx: 'Short' };
  const seg = pathname.split('/')[1] || '';
  const map = {
    '': ['dashboard', `${stats.topicsCompleted} / ${stats.topicsTotal} topics complete`],
    plan: ['plan', `${stages.length} stages · your pace and dates`],
    contents: ['contents', `${stats.topicsTotal} topics · ${stats.total} problems`],
    patterns: ['patterns', `${stats.totalPatterns} patterns`],
    finder: ['patterns/finder', 'which pattern fits?'],
    questions: ['practice', `${stats.total} problems`],
    visualize: ['visualize', 'step-through animations'],
    revision: ['revision', 'weak areas · mistakes'],
    saved: ['saved', 'bookmarked for later'],
    shorts: ['shorts', 'two-minute pattern stories'],
    progress: ['progress', `${stats.overall}% overall mastery`],
    companies: ['companies', 'interview questions by company'],
    tools: ['tools', 'cheat sheet · toolkit · JS · playground'],
    achievements: ['achievements', 'badges'],
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
  const opts = [
    ['dark', 'Dark', Moon],
    ['light', 'Light', Sun],
  ];
  return (
    <div className={className} role="group" aria-label={`Theme: ${theme === 'light' ? 'Light' : 'Dark'}`}>
      {opts.map(([id, name, Icon]) => {
        const tip = theme === id ? `Theme: ${name} (current)` : `Theme: ${theme === 'light' ? 'Light' : 'Dark'} — switch to ${name.toLowerCase()}`;
        return (
          <button key={id} type="button" aria-pressed={theme === id} onClick={() => setTheme(id)} aria-label={tip} data-tip={tip}>
            <Icon aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/** "More": a popover above the dock (desktop) / a bottom sheet (≤900px). */
function MorePanel({ open, onClose, triggerRef, onSearch, onGuide, theme, setTheme, pathname }) {
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

/** where the Back button goes when there is no in-app history (deep link / fresh tab): the route's logical parent */
export function parentOf(pathname) {
  let m = matchPath('/topic/:topicId/q/:questionId', pathname);
  if (m) return { to: `/topic/${m.params.topicId}#questions`, label: topicById[m.params.topicId]?.title || 'topic' };
  if (matchPath('/topic/:topicId', pathname)) return { to: '/contents', label: 'Topics & contents' };
  if (matchPath('/shorts/:id', pathname)) return { to: '/shorts', label: 'Shorts' };
  if (matchPath('/toolkit/:toolId', pathname)) return { to: '/tools?tab=toolkit', label: 'JS DSA toolkit' };
  if (matchPath('/companies/:companyId', pathname)) return { to: '/companies', label: 'Companies' };
  if (pathname === '/finder') return { to: '/patterns', label: 'Patterns' };
  return { to: '/', label: 'Dashboard' };
}
/** pages without a Back button: the dashboard and the touch tab roots (always one tap away in the tab dock) */
const NO_BACK = new Set(['/', '/plan', '/progress', '/revision']);
/** pages whose own content already opens with a back link (All Shorts, JS DSA Toolkit) */
const OWN_BACK = ['/shorts/:id', '/toolkit/:toolId'];

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
  const page = pageOf(pathname);
  const PageIcon = page.icon;
  const clock = useClock();
  const fill = !!matchPath('/topic/:topicId/q/:questionId', pathname);
  useCelebrations(progress);
  const { queue: unlocked, dismiss: dismissUnlocked } = useAchievementDetection(progress, dispatch);
  const viewAllAchievements = useCallback(() => {
    dismissUnlocked();
    navigate('/achievements');
  }, [dismissUnlocked, navigate]);

  // ---- More popover/sheet ----
  const [moreOpen, setMoreOpen] = useState(false);
  const moreBtnRef = useRef(null);
  const moreTabRef = useRef(null);
  const moreTrigger = useRef(null);
  const closeMore = useCallback((restoreFocus) => {
    setMoreOpen(false);
    if (restoreFocus) moreTrigger.current?.focus();
  }, []);
  const toggleMore = (ref) => {
    moreTrigger.current = ref.current;
    setMoreOpen((o) => !o);
  };
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);
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
  // first visit: when the welcome tour closes, the dock's glow pulses twice so the menu is noticed
  const firstVisit = useRef(!getUiPrefs().tourSeen);
  const [dockHello, setDockHello] = useState(false);
  const closeTour = useCallback(() => {
    setTourOpen(false);
    if (!firstVisit.current) return;
    firstVisit.current = false;
    setDockHello(true);
    setTimeout(() => setDockHello(false), 2600);
  }, []);
  // M11: `?` and the Guide keys open this page's guide where there is one, else the welcome tour
  const [pageGuide, setPageGuide] = useState(null);
  const openGuideHere = useCallback(() => {
    const g = guideFor(pathname);
    if (!g) return openTour();
    setMoreOpen(false);
    setPageGuide(g);
  }, [pathname, openTour]);
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
        openGuideHere();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, tourOpen, showPalette, openGuideHere]);

  const parent = parentOf(pathname);
  const canGoBack = location.key !== 'default';
  const showBack = !NO_BACK.has(pathname) && !OWN_BACK.some((p) => matchPath(p, pathname));
  const goBack = () => (canGoBack ? navigate(-1) : navigate(parent.to));
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
        <div className="sl-seg sl-page" title={`~/journey/${crumb}`}>
          <span className="sl-page-chip">
            <PageIcon aria-hidden="true" />
            <span className="sr-only">Current page: </span>
            <strong>{page.label}</strong>
          </span>
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
            {showBack && (
              <div className="page-back">
                <button type="button" className="btn btn--ghost btn--sm" onClick={goBack} title={canGoBack ? 'Back' : `Back to ${parent.label}`}>
                  <ArrowLeft size={15} aria-hidden="true" />
                  {canGoBack ? 'Back' : `Back to ${parent.label}`}
                </button>
              </div>
            )}
            <Outlet />
          </motion.div>
        </AnimatePresence>
        {!fill && <SiteFooter />}
      </main>

      {/* ---------- floating dock (desktop) ---------- */}
      <div className="dock-wrap">
        <nav className={`dock${dockHello ? ' dock--hello' : ''}`} aria-label="Primary">
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

      <button type="button" className="guide-fab" onClick={openGuideHere} aria-label="Guide me: what each part of this page does (press ?)">
        <span className="guide-fab-q" aria-hidden="true">
          ?
        </span>
        <span className="guide-fab-t">Guide me</span>
      </button>

      <MorePanel
        open={moreOpen}
        onClose={closeMore}
        triggerRef={moreTrigger}
        onSearch={showPalette}
        onGuide={openTour}
        theme={theme}
        setTheme={setTheme}
        pathname={pathname}
      />

      <Toaster />
      <Suspense fallback={null}>
        {paletteLoaded && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onOpenGuide={openTour} />}
        {tourOpen && <WelcomeTour onClose={closeTour} />}
        {pageGuide && (
          <PageGuide
            guide={pageGuide}
            onClose={() => setPageGuide(null)}
            onOpenTour={() => {
              setPageGuide(null);
              openTour();
            }}
          />
        )}
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
