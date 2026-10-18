import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, Compass, Moon, RotateCcw, Sun } from 'lucide-react';
import { ACCENTS, useTheme } from '../state/ThemeContext.jsx';
import { saveUiPrefs, useUiPrefs } from '../lib/uiPrefs.js';
import { openGuide } from '../lib/appEvents.js';
import { showToast } from '../lib/celebrate.js';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl';

const THEMES = [
  { id: 'dark', label: 'Graphite', sub: 'dark', Icon: Moon },
  { id: 'light', label: 'Porcelain', sub: 'light', Icon: Sun },
];
const ACCENT_NOTE = { plasma: 'default', volt: 'hot pink', uv: 'ultraviolet', ice: 'cool cyan' };

const SHORTCUTS = [
  [[MOD, 'K'], 'search anything'],
  [['/'], 'search (when not typing)'],
  [['?'], 'open the guide'],
  [['←', '→'], 'step the tour or an animation'],
  [['Ctrl', 'Enter'], 'run code'],
  [['Ctrl', 'Shift', 'Enter'], 'submit'],
  [['Esc'], 'close a dialog'],
];

/** Appearance (theme + accent), the guide (coach tips, replay the tour), shortcuts and a pointer to progress data. */
export default function SettingsPage() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const ui = useUiPrefs();
  const dismissed = Object.keys(ui.coachDismissed || {}).length;

  return (
    <div className="page page-narrow set-page">
      <header className="set-hero rise">
        <span className="eyebrow">
          <i className="pip" aria-hidden="true" />
          ~/journey/settings
        </span>
        <h1 className="display display--s chrome">Settings</h1>
        <p className="lead">Saved in this browser. Your study progress lives on the Progress page.</p>
      </header>

      {/* ---------- appearance ---------- */}
      <section className="tile set-panel rise" style={{ '--i': 1 }} aria-labelledby="set-appearance">
        <div className="set-panel-head">
          <span className="eyebrow" id="set-appearance">
            <i className="pip pip--uv" aria-hidden="true" />
            Appearance
          </span>
        </div>

        <div className="set-row">
          <div className="set-row-text">
            <b id="set-theme-label">Theme</b>
            <span>Graphite is the dark stage; Porcelain the light one.</span>
          </div>
          <div className="seg set-theme" role="group" aria-labelledby="set-theme-label">
            {THEMES.map(({ id, label, sub, Icon }) => (
              <button key={id} type="button" aria-pressed={theme === id} onClick={() => setTheme(id)} aria-label={`${label} (${sub} theme)`}>
                <Icon aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="set-row set-row--stack">
          <div className="set-row-text">
            <b id="set-accent-label">Accent</b>
            <span>The primary button, links and highlights. Charts keep their own colours so they stay comparable.</span>
          </div>
          <div className="set-swatches" role="group" aria-labelledby="set-accent-label">
            {ACCENTS.map((a) => {
              const on = accent === a.id;
              return (
                <button key={a.id} type="button" className="set-swatch" data-value={a.id} aria-pressed={on} onClick={() => setAccent(a.id)} aria-label={`${a.label} accent (${a.id})`}>
                  <span className="set-swatch-cube" aria-hidden="true">
                    {on && <Check strokeWidth={3} />}
                  </span>
                  <span className="set-swatch-text" aria-hidden="true">
                    <b>{a.label}</b>
                    <code>{a.id}</code>
                    <small>{ACCENT_NOTE[a.id]}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- guide ---------- */}
      <section className="tile set-panel rise" style={{ '--i': 2 }} aria-labelledby="set-guide">
        <div className="set-panel-head">
          <span className="eyebrow" id="set-guide">
            <i className="pip pip--ice" aria-hidden="true" />
            Guide
          </span>
        </div>
        <div className="set-row">
          <div className="set-row-text">
            <b id="set-coach-label">Show coach tips</b>
            <span>A short how-to the first time you open each topic tab and question.</span>
          </div>
          <button
            type="button"
            className="toggle"
            role="switch"
            aria-checked={ui.showCoachTips}
            aria-labelledby="set-coach-label"
            onClick={() => saveUiPrefs({ showCoachTips: !ui.showCoachTips })}
          />
        </div>
        <div className="set-row">
          <div className="set-row-text">
            <b>Dismissed tips</b>
            <span>
              <span className="mono">{dismissed}</span> tip{dismissed === 1 ? '' : 's'} dismissed. Bring them all back.
            </span>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              saveUiPrefs({ coachDismissed: {}, showCoachTips: true });
              showToast('Coach tips are back', dismissed ? `${dismissed} dismissed tip${dismissed === 1 ? '' : 's'} will show again.` : 'Every tip will show the first time.');
            }}
          >
            <RotateCcw aria-hidden="true" /> Show dismissed tips again
          </button>
        </div>
        <div className="set-row">
          <div className="set-row-text">
            <b>Welcome tour</b>
            <span>
              Five steps: what this is, the study loop, where things are, how progress saves, your next step. Press <span className="kbd">?</span> any time.
            </span>
          </div>
          <button type="button" className="btn btn--chrome btn--sm" onClick={openGuide}>
            <Compass aria-hidden="true" /> Replay the welcome tour
          </button>
        </div>
      </section>

      {/* ---------- shortcuts ---------- */}
      <section className="tile set-panel rise" style={{ '--i': 3 }} aria-labelledby="set-keys">
        <div className="set-panel-head">
          <span className="eyebrow" id="set-keys">
            <i className="pip pip--volt" aria-hidden="true" />
            Keyboard
          </span>
        </div>
        <dl className="set-keys">
          {SHORTCUTS.map(([keys, what]) => (
            <div key={what}>
              <dt>
                {keys.map((k) => (
                  <span key={k} className="kbd">
                    {k}
                  </span>
                ))}
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- progress ---------- */}
      <section className="tile set-panel rise" style={{ '--i': 4 }} aria-labelledby="set-data">
        <div className="set-panel-head">
          <span className="eyebrow" id="set-data">
            <i className="pip pip--acid" aria-hidden="true" />
            Your progress
          </span>
        </div>
        <div className="set-row">
          <div className="set-row-text">
            <b>Back up, move or reset</b>
            <span>Export a backup, import one from another device, or reset everything on the Progress page.</span>
          </div>
          <Link to="/progress" className="btn btn--ghost btn--sm">
            <BarChart3 aria-hidden="true" /> Open Progress <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
