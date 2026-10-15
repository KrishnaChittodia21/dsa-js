import { Link } from 'react-router-dom';
import { BarChart3, Check, Compass, Moon, Sun } from 'lucide-react';
import { ACCENTS, useTheme } from '../state/ThemeContext.jsx';
import { saveUiPrefs, useUiPrefs } from '../lib/uiPrefs.js';
import { openGuide } from '../lib/appEvents.js';

/** Appearance (theme + accent colour), the guide (coach tips, replay the tour) and a pointer to progress data. */
export default function SettingsPage() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const ui = useUiPrefs();
  return (
    <div className="page page-narrow settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Saved in this browser. Your study progress lives on the Progress page.</p>
        </div>
      </div>

      <section className="card form" aria-labelledby="set-appearance">
        <h3 id="set-appearance">Appearance</h3>
        <div className="field">
          <span className="field-label" id="theme-label">
            Theme
          </span>
          <div className="row-wrap" role="group" aria-labelledby="theme-label">
            {[
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
            ].map(([v, label, Icon]) => (
              <button key={v} type="button" className="chip" aria-pressed={theme === v} onClick={() => setTheme(v)}>
                <Icon size={14} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field-label" id="accent-label">
            Accent colour
          </span>
          <div className="accent-picker" role="group" aria-labelledby="accent-label">
            {ACCENTS.map((a) => {
              const on = accent === a.id;
              return (
                <button key={a.id} type="button" className={`accent-swatch ${on ? 'on' : ''}`} data-value={a.id} aria-pressed={on} onClick={() => setAccent(a.id)}>
                  <span className="accent-dot" aria-hidden="true">
                    {on && <Check size={14} strokeWidth={3} />}
                  </span>
                  {a.label}
                </button>
              );
            })}
          </div>
          <span className="muted small">Buttons, links and highlights. Charts keep their own colours so they stay comparable.</span>
        </div>
      </section>

      <section className="card form" aria-labelledby="set-guide">
        <h3 id="set-guide">Guide</h3>
        <label className="check">
          <input type="checkbox" checked={ui.showCoachTips} onChange={(e) => saveUiPrefs({ showCoachTips: e.target.checked })} />
          <span>Show coach tips (a short how-to the first time you open each topic tab and question)</span>
        </label>
        <div className="row-wrap">
          <button type="button" className="btn" onClick={openGuide}>
            <Compass size={16} aria-hidden="true" /> Replay the welcome tour
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => saveUiPrefs({ coachDismissed: {}, showCoachTips: true })}>
            Show dismissed tips again
          </button>
        </div>
        <p className="muted small">
          Shortcuts: <kbd>⌘</kbd>/<kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd> search · <kbd>?</kbd> guide · <kbd>Ctrl</kbd> <kbd>Enter</kbd> run code ·{' '}
          <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Enter</kbd> submit.
        </p>
      </section>

      <section className="card form" aria-labelledby="set-data">
        <h3 id="set-data">Your progress</h3>
        <p className="muted small">Export a backup, import one from another device, or reset everything on the Progress page.</p>
        <div>
          <Link to="/progress" className="btn">
            <BarChart3 size={16} aria-hidden="true" /> Open Progress
          </Link>
        </div>
      </section>
    </div>
  );
}
