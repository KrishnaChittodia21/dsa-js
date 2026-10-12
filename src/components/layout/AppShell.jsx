import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import SearchBox from './SearchBox.jsx';
import { useTheme } from '../../state/ThemeContext.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { recommendations, streak, overallStats } from '../../state/selectors.js';
import { ProgressBar } from '../ui/primitives.jsx';

const NAV = [
  { section: 'Learn' },
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/path', label: 'Learning Path', icon: 'map' },
  { to: '/patterns', label: 'Patterns', icon: 'puzzle' },
  { to: '/finder', label: 'Pattern Finder', icon: 'target' },
  { to: '/visualize', label: 'Visualizer', icon: 'play' },
  { to: '/questions', label: 'Questions', icon: 'list' },
  { to: '/companies', label: 'Companies', icon: 'building' },
  { section: 'JavaScript' },
  { to: '/toolkit', label: 'JS DSA Toolkit', icon: 'box' },
  { to: '/js', label: 'JavaScript for DSA', icon: 'code' },
  { to: '/playground', label: 'Playground', icon: 'terminal' },
  { section: 'Review' },
  { to: '/progress', label: 'Progress', icon: 'chart' },
  { to: '/revision', label: 'Revision', icon: 'refresh' },
  { to: '/cheatsheet', label: 'Cheat Sheet', icon: 'file' },
];

export default function AppShell() {
  const { theme, toggle } = useTheme();
  const { progress } = useProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const rec = recommendations(progress);
  const st = streak(progress);
  const overall = overallStats(progress).overall;

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="app-shell">
      <a href="#main" className="sr-only">
        Skip to content
      </a>
      <Link to="/" className="brand">
        <span className="brand-mark">{'{ }'}</span> DSA Journey
      </Link>
      <header className="topbar">
        <button type="button" className="btn btn-ghost btn-icon menu-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Open navigation">
          <Icon name="menu" />
        </button>
        <SearchBox />
        <span className="spacer" />
        {st.current > 0 && (
          <span className="badge badge-warning" title={`Longest streak: ${st.longest} days`}>
            <Icon name="flame" size={13} /> {st.current} day{st.current > 1 ? 's' : ''}
          </span>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} /> <span className="theme-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </header>
      <div className={`sidebar-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      <nav className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        {NAV.map((n, i) =>
          n.section ? (
            <div key={i} className="nav-section">
              {n.section}
            </div>
          ) : (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon name={n.icon} size={17} /> {n.label}
            </NavLink>
          ),
        )}
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
      </nav>
      <main className="main" id="main">
        <Outlet />
      </main>
    </div>
  );
}
