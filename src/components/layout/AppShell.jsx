import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, matchPath, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  Box,
  Building2,
  ChevronDown,
  Code2,
  Compass,
  FileText,
  Flame,
  LayoutDashboard,
  List,
  ListTree,
  Map as MapIcon,
  Menu,
  Moon,
  Network,
  PlayCircle,
  Puzzle,
  RefreshCw,
  Settings,
  Sun,
  Target,
  Terminal,
} from 'lucide-react';
import SiteFooter from './SiteFooter.jsx';
import Toaster from './Toaster.jsx';
import { useCelebrations } from './useCelebrations.js';
import { useTheme } from '../../state/ThemeContext.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { recommendations, streak, overallStats, topicStatus } from '../../state/selectors.js';
import { stages } from '../../content/index.js';
import { ProgressBar } from '../ui/primitives.jsx';
import { on } from '../../lib/appEvents.js';
import { getUiPrefs, saveUiPrefs } from '../../lib/uiPrefs.js';

// overlays are lazy so cmdk and the tour stay out of the main bundle until first use
const CommandPalette = lazy(() => import('./CommandPalette.jsx'));
const WelcomeTour = lazy(() => import('../guide/WelcomeTour.jsx'));

const NAV = [
  {
    section: 'Learn',
    links: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/contents', label: 'Contents', icon: ListTree },
      { to: '/path', label: 'Learning Path', icon: MapIcon },
      { to: '/patterns', label: 'Patterns', icon: Puzzle },
      { to: '/finder', label: 'Pattern Finder', icon: Target },
      { to: '/visualize', label: 'Visualizer', icon: PlayCircle },
      { to: '/questions', label: 'Questions', icon: List },
      { to: '/companies', label: 'Companies', icon: Building2 },
    ],
  },
  {
    section: 'JavaScript',
    links: [
      { to: '/toolkit', label: 'JS DSA Toolkit', icon: Box },
      { to: '/js', label: 'JavaScript for DSA', icon: Code2 },
      { to: '/playground', label: 'Playground', icon: Terminal },
    ],
  },
  {
    section: 'Review',
    links: [
      { to: '/progress', label: 'Progress', icon: BarChart3 },
      { to: '/revision', label: 'Revision', icon: RefreshCw },
      { to: '/cheatsheet', label: 'Cheat Sheet', icon: FileText },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const STATUS_TEXT = { locked: 'locked', available: 'not started', 'in-progress': 'in progress', completed: 'completed' };
/** pages worth offering under "Continue where you left off" */
const STUDY_PAGE = /^\/(topic|visualize|playground|finder|patterns|toolkit|js)(\/|$)/;

/** true when a keystroke is going into a text field or code editor */
function typingInField(e) {
  const t = e.target;
  return !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || !!t.closest?.('.cm-editor'));
}

const isMobile = () => window.matchMedia('(max-width: 960px)').matches;

/** Sidebar link with the shared active pill that slides between items (motion layoutId). */
function SideLink({ to, end, className = '', children }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-link ${className} ${isActive ? 'active' : ''}`}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="side-active" className="side-active" aria-hidden="true" transition={{ type: 'spring', stiffness: 520, damping: 42 }} />}
          {children}
        </>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const { theme, toggle } = useTheme();
  const { progress } = useProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getUiPrefs().sidebarCollapsed);
  const [collapsedStages, setCollapsedStages] = useState(() => getUiPrefs().collapsedStages);
  const location = useLocation();
  const loc = location.pathname + location.search;
  const rec = recommendations(progress);
  const st = streak(progress);
  const overall = overallStats(progress).overall;
  const fill = !!matchPath('/topic/:topicId/q/:questionId', location.pathname);
  useCelebrations(progress);

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => saveUiPrefs({ sidebarCollapsed }), [sidebarCollapsed]);
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
  }, [paletteOpen, tourOpen, showPalette]);

  const toggleNav = () => {
    if (isMobile()) setMenuOpen((o) => !o);
    else setSidebarCollapsed((c) => !c);
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <button
          type="button"
          className="btn btn-ghost btn-icon menu-toggle"
          onClick={toggleNav}
          aria-label="Toggle navigation"
          aria-expanded={isMobile() ? menuOpen : !sidebarCollapsed}
          title={sidebarCollapsed ? 'Show the sidebar' : 'Hide the sidebar'}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <Link to="/" className="brand">
          <span className="brand-tile" aria-hidden="true">
            <Network size={16} strokeWidth={2.4} />
          </span>
          <span className="brand-name">DSA Journey</span>
          <span className="brand-sub">JavaScript · patterns · practice</span>
        </Link>
        <div className="topbar-right">
          {st.current > 0 && (
            <span className="badge badge-warning topbar-streak" title={`Longest streak: ${st.longest} days`}>
              <Flame size={13} aria-hidden="true" /> {st.current} day{st.current > 1 ? 's' : ''}
            </span>
          )}
          <button type="button" className="btn btn-ghost guide-btn" onClick={() => setTourOpen(true)} aria-label="Open the guide" title="Guide (press ?)">
            <Compass size={18} aria-hidden="true" />
            <span className="guide-btn-text">Guide</span>
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <NavLink to="/settings" className="btn btn-ghost btn-icon" aria-label="Settings" title="Settings">
            <Settings size={18} aria-hidden="true" />
          </NavLink>
        </div>
      </header>

      <div className={`sidebar-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      <motion.nav layoutScroll className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        {NAV.map((g) => (
          <div key={g.section} className="nav-group">
            <div className="nav-section">{g.section}</div>
            {g.links.map((n) => {
              const Icon = n.icon;
              return (
                <SideLink key={n.to} to={n.to} end={n.end}>
                  <Icon size={16} aria-hidden="true" className="side-icon" /> {n.label}
                </SideLink>
              );
            })}
          </div>
        ))}

        <div className="nav-group">
          <div className="nav-section">
            <BookOpen size={12} aria-hidden="true" /> Topics
          </div>
          {stages.map((stage, si) => {
            const closed = !!collapsedStages[stage.id];
            const done = stage.topics.filter((t) => topicStatus(t, progress) === 'completed').length;
            return (
              <div key={stage.id} className="side-stage">
                <button
                  type="button"
                  className="side-stage-title"
                  aria-expanded={!closed}
                  onClick={() => setCollapsedStages((c) => ({ ...c, [stage.id]: !closed }))}
                >
                  <span className="side-stage-name">
                    <span className="side-stage-num">{si + 1}</span>
                    {stage.title}
                  </span>
                  <span className="side-stage-meta">
                    {done}/{stage.topics.length}
                    <ChevronDown size={14} aria-hidden="true" className={`chev-icon ${closed ? 'closed' : ''}`} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {!closed && (
                    <motion.div
                      className="side-stage-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      {stage.topics.map((t) => {
                        const s = topicStatus(t, progress);
                        return (
                          <SideLink key={t.id} to={`/topic/${t.id}`} className="side-topic">
                            <span className={`dot dot-${s}`} aria-hidden="true" />
                            <span className="side-topic-title">{t.title}</span>
                            <span className="sr-only">, {STATUS_TEXT[s]}</span>
                          </SideLink>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="nav-current">
          <div className="small muted">Overall progress</div>
          <div className="row" style={{ margin: '0.25rem 0 0.5rem' }}>
            <div style={{ flex: 1 }}>
              <ProgressBar value={overall} label="Overall progress" />
            </div>
            <span className="small mono">{overall}%</span>
          </div>
          <div className="small muted">Current topic</div>
          <Link to={`/topic/${rec.current.id}`} className="small" style={{ fontWeight: 600 }}>
            {rec.current.title}
          </Link>
        </div>
      </motion.nav>

      <main className={`main ${fill ? 'main-fill' : ''}`} id="main">
        <AnimatePresence initial={false}>
          <motion.div
            key={location.pathname}
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

      <Toaster />
      <Suspense fallback={null}>
        {paletteLoaded && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onOpenGuide={() => setTourOpen(true)} />}
        {tourOpen && <WelcomeTour onClose={closeTour} />}
      </Suspense>
    </div>
  );
}
