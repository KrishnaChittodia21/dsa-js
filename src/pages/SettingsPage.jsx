import { Link } from 'react-router-dom';
import { ACCENTS, useTheme } from '../state/ThemeContext.jsx';
import { saveUiPrefs, useUiPrefs } from '../lib/uiPrefs.js';
import { openGuide } from '../lib/appEvents.js';

// Pen names for the accent keys (keys are stored in saved preferences, so they never change).
const PEN = {
  indigo: { label: 'Red pen', note: 'the default' },
  default: { label: 'Red pen', note: 'the default' },
  teal: { label: 'Sea ink' },
  rose: { label: 'Oxblood' },
  amber: { label: 'Ochre' },
};

/** Appearance (theme + accent colour), the guide (coach tips, replay the tour) and a pointer to progress data. */
export default function SettingsPage() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const ui = useUiPrefs();
  return (
    <div className="page page-narrow st ink-in">
      <header className="page-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>How the page looks</h1>
          <p>Saved in this browser only. Your study record lives on the Progress page.</p>
        </div>
      </header>

      <section className="st-group" aria-labelledby="set-appearance">
        <h2 id="set-appearance" className="st-group-h">
          Appearance
        </h2>
        <div className="st-field">
          <span className="st-label" id="theme-label">
            Theme
          </span>
          <div className="st-control">
            <div className="st-seg" role="group" aria-labelledby="theme-label">
              {[
                ['light', 'Day — paper'],
                ['dark', 'Night — desk lamp'],
              ].map(([v, label]) => (
                <button key={v} type="button" aria-pressed={theme === v} onClick={() => setTheme(v)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="st-field">
          <span className="st-label" id="accent-label">
            Pen colour
          </span>
          <div className="st-control">
            <div className="st-pens" role="group" aria-labelledby="accent-label">
              {ACCENTS.map((a) => {
                const on = accent === a.id;
                const pen = PEN[a.id] || { label: a.label };
                return (
                  <button key={a.id} type="button" className="st-pen" data-value={a.id} aria-pressed={on} onClick={() => setAccent(a.id)}>
                    <span className="st-pen-ink" aria-hidden="true" />
                    <span className="st-pen-name">{pen.label}</span>
                    {pen.note && <span className="st-pen-note">{pen.note}</span>}
                    <span className="st-pen-tick" aria-hidden="true">
                      {on ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="st-help">Used for links, buttons and corrections. Charts keep their own inks so they stay comparable.</p>
          </div>
        </div>
      </section>

      <section className="st-group" aria-labelledby="set-guide">
        <h2 id="set-guide" className="st-group-h">
          Guide
        </h2>
        <div className="st-field">
          <span className="st-label">Coach tips</span>
          <div className="st-control">
            <label className="st-check">
              <input type="checkbox" checked={ui.showCoachTips} onChange={(e) => saveUiPrefs({ showCoachTips: e.target.checked })} />
              <span>Show a short how-to the first time you open each topic tab and question.</span>
            </label>
            <div className="st-actions">
              <button type="button" className="btn" onClick={openGuide}>
                Replay the welcome tour
              </button>
              <button type="button" className="rf-textbtn" onClick={() => saveUiPrefs({ coachDismissed: {}, showCoachTips: true })}>
                Bring back dismissed tips
              </button>
            </div>
          </div>
        </div>
        <div className="st-field">
          <span className="st-label">Shortcuts</span>
          <div className="st-control">
            <dl className="st-keys">
              <div>
                <dt>
                  <kbd>⌘</kbd>/<kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd>
                </dt>
                <dd>search</dd>
              </div>
              <div>
                <dt>
                  <kbd>?</kbd>
                </dt>
                <dd>open the guide</dd>
              </div>
              <div>
                <dt>
                  <kbd>Ctrl</kbd> <kbd>Enter</kbd>
                </dt>
                <dd>run your code</dd>
              </div>
              <div>
                <dt>
                  <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Enter</kbd>
                </dt>
                <dd>submit</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="st-group" aria-labelledby="set-data">
        <h2 id="set-data" className="st-group-h">
          Your record
        </h2>
        <div className="st-field">
          <span className="st-label">Progress</span>
          <div className="st-control">
            <p className="st-help">Export a backup, bring one in from another device, or start over — all on the Progress page.</p>
            <Link to="/progress" className="btn">
              Open the report card
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
