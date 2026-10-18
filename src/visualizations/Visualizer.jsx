import { useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS } from './scenarios/index.js';
import { Panel } from './panels.jsx';
import { SCENARIO_COMPLEXITY, bigoClass } from './complexity.js';
import Icon from '../components/ui/Icon.jsx';

const PREDICT_KEY = 'dsa-journey:predict-mode';
function loadPredictPref() {
  try {
    return localStorage.getItem(PREDICT_KEY) !== 'off';
  } catch {
    return true;
  }
}
function savePredictPref(on) {
  try {
    localStorage.setItem(PREDICT_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

const LETTERS = 'ABCD';
// Sorting animations draw arrays as value-tall voxel columns (other arrays are single cubes).
const BAR_SCENARIOS = new Set(['merge-sort', 'quick-sort', 'counting-sort', 'cyclic-sort', 'dutch-flag']);
// Panels that read as "state" go to the side column (a variables grid, stacks as voxel towers).
const SIDE_KINDS = new Set(['vars', 'stack']);
const SPEEDS = [
  [1800, '0.5×'],
  [1100, '1×'],
  [600, '2×'],
  [300, '4×'],
];

// Shown instead of the step note when the player pauses to ask "what happens next?".
function PredictCard({ predict, answer, onChoose, onReveal }) {
  const answeredNow = answer !== null;
  const correct = answeredNow && answer === predict.answer;
  return (
    <div className={`viz-predict ${answeredNow ? (correct ? 'is-correct' : 'is-wrong') : ''}`} role="group" aria-label="Predict the next step">
      <div className="viz-predict-main">
        <div className="viz-predict-q">
          <i className="pip pip--uv" aria-hidden="true" />
          <span>
            <span className="viz-predict-k">Predict</span> {predict.question}
          </span>
        </div>
        <div className="viz-predict-options">
          {predict.options.map((o, i) => {
            let state = '';
            if (answeredNow && i === predict.answer) state = 'correct';
            else if (answeredNow && i === answer) state = 'wrong';
            return (
              <button key={i} type="button" className={`option option-compact ${state}`} disabled={answeredNow} onClick={() => onChoose(i)}>
                <span className="option-letter">{LETTERS[i]}</span>
                <span className="option-text">{o}</span>
              </button>
            );
          })}
        </div>
      </div>
      {answeredNow && (
        <div className="viz-verdict">
          <b className={correct ? 'is-ok' : 'is-no'}>{correct ? 'Correct.' : `Not quite — it's ${LETTERS[predict.answer]}.`}</b> {predict.explain}
          <div className="viz-verdict-act">
            <button type="button" className="btn btn--plasma btn--sm" onClick={onReveal} autoFocus>
              Show the step <Icon name="chevronRight" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComplexityReadout({ scenario, frames }) {
  const c = SCENARIO_COMPLEXITY[scenario];
  if (!c) return null;
  return (
    <div className="viz-panel viz-cx">
      <div className="viz-label">complexity</div>
      <div className="viz-cx-row">
        <span className="viz-cx-k">time</span>
        <span className={`bigo ${bigoClass(c.time)}`}>{c.time}</span>
      </div>
      <div className="viz-cx-row">
        <span className="viz-cx-k">space</span>
        <span className={`bigo ${bigoClass(c.space)}`}>{c.space}</span>
      </div>
      <p className="viz-cx-note">{c.note}</p>
      <div className="viz-cx-run">
        this run · <b>{frames}</b> steps
      </div>
    </div>
  );
}

const toText = (field, value) => {
  if (field.type === 'numbers' || field.type === 'strings') return (value || []).join(', ');
  if (field.type === 'json') return JSON.stringify(value);
  return String(value ?? '');
};

const parse = (field, text) => {
  switch (field.type) {
    case 'numbers': {
      const out = text.split(/[\s,]+/).filter(Boolean).map(Number);
      if (out.some(Number.isNaN)) throw new Error(`${field.label}: numbers separated by commas`);
      return out;
    }
    case 'strings':
      return text.split(',').map((s) => s.trim()).filter(Boolean);
    case 'number': {
      const v = Number(text);
      if (Number.isNaN(v)) throw new Error(`${field.label}: must be a number`);
      return v;
    }
    case 'json':
      return JSON.parse(text);
    default:
      return text;
  }
};

/**
 * Step-through player. `compact` = embedded in lessons/questions; `wide` = the Visualize page
 * (state column + complexity readout beside the stage once the player is wide enough); `eyebrow`
 * replaces the default "step-through" label.
 */
export default function Visualizer({ scenario, input, caption, compact = false, wide = false, eyebrow }) {
  const def = SCENARIOS[scenario];
  const initial = useMemo(() => ({ ...(def?.defaultInput || {}), ...(input || {}) }), [def, input]);
  const [data, setData] = useState(initial);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1100);
  const [predictMode, setPredictMode] = useState(loadPredictPref);
  const [pending, setPending] = useState(null); // frame index waiting for a prediction
  const [answer, setAnswer] = useState(null); // chosen option index for the pending prediction
  const [answered, setAnswered] = useState(() => new Set()); // frame indexes already predicted this run
  const [verdicts, setVerdicts] = useState({}); // frame index → answered correctly (scrubber ticks)
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const timer = useRef(null);

  const frames = useMemo(() => {
    if (!def) return [];
    try {
      return def.generate(structuredClone(data));
    } catch (e) {
      return [{ note: `Could not run this input: ${e.message}`, panels: [] }];
    }
  }, [def, data]);

  const totalPredicts = useMemo(() => frames.filter((f) => f.predict).length, [frames]);
  const restart = () => {
    setStep(0);
    setPlaying(false);
    setPending(null);
    setAnswer(null);
    setAnswered(new Set());
    setVerdicts({});
    setScore({ correct: 0, total: 0 });
  };
  useEffect(restart, [frames]);

  // Every forward move goes through here so predictions can interrupt it.
  const next = () => {
    if (pending !== null) return;
    const target = step + 1;
    if (target >= frames.length) {
      setPlaying(false);
      return;
    }
    if (predictMode && frames[target].predict && !answered.has(target)) {
      setPlaying(false);
      setPending(target);
      setAnswer(null);
      return;
    }
    setStep(target);
  };

  const choose = (i) => {
    if (answer !== null) return;
    setAnswer(i);
    const correct = i === frames[pending].predict.answer;
    setVerdicts((v) => ({ ...v, [pending]: correct }));
    setScore((sc) => ({ correct: sc.correct + (correct ? 1 : 0), total: sc.total + 1 }));
  };
  const reveal = () => {
    setAnswered((a) => new Set(a).add(pending));
    setStep(pending);
    setPending(null);
    setAnswer(null);
  };

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setTimeout(next, speed);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step, speed]);

  if (!def) return <div className="card muted small">Unknown visualization “{scenario}”.</div>;
  const frame = frames[Math.min(step, frames.length - 1)] || { note: '', panels: [] };
  const last = frames.length - 1;
  const bars = BAR_SCENARIOS.has(scenario);
  const stagePanels = frame.panels.filter((p) => !SIDE_KINDS.has(p.kind));
  const sidePanels = frame.panels.filter((p) => SIDE_KINDS.has(p.kind));
  const showCx = wide && !!SCENARIO_COMPLEXITY[scenario];
  const pct = last > 0 ? (Math.min(step, last) / last) * 100 : 0;

  const onKey = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (pending !== null) return;
    if (e.key === 'ArrowRight') {
      next();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setStep((s) => Math.max(0, s - 1));
      e.preventDefault();
    } else if (e.key === ' ' && e.target === e.currentTarget) {
      setPlaying((p) => !p);
      e.preventDefault();
    }
  };

  const applyDraft = () => {
    try {
      const nextData = { ...data };
      for (const f of def.fields || []) nextData[f.key] = parse(f, draft[f.key]);
      setData(nextData);
      setDraft(null);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const togglePredict = () => {
    const on = !predictMode;
    setPredictMode(on);
    savePredictPref(on);
    setPending(null);
  };

  return (
    <figure className={`viz ${compact ? 'viz--compact' : ''} ${wide ? 'viz--wide' : ''}`} tabIndex={0} onKeyDown={onKey} aria-label={`Visualization: ${def.title}`}>
      <div className="viz-head">
        <div className="viz-head-txt">
          <span className="eyebrow">
            <i className="pip pip--uv" />
            {eyebrow || 'step-through'}
          </span>
          <div className="viz-title">{def.title}</div>
          <p className="viz-desc">{caption || def.description}</p>
        </div>
        <div className="viz-head-act">
          {totalPredicts > 0 && (
            <span className="viz-predict-toggle" title="Pause at key steps and ask what happens next">
              <span className="viz-predict-l" id={`pm-${scenario}`}>
                Predict mode
              </span>
              <button type="button" className="toggle" role="switch" aria-checked={predictMode} aria-labelledby={`pm-${scenario}`} onClick={togglePredict} />
              {score.total > 0 && (
                <span className="tag viz-score">
                  {score.correct} / {score.total} right
                </span>
              )}
            </span>
          )}
          {def.fields?.length > 0 && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setDraft(draft ? null : Object.fromEntries(def.fields.map((f) => [f.key, toText(f, data[f.key])])))}
            >
              <Icon name="code" size={14} /> {draft ? 'Cancel' : 'Try your own input'}
            </button>
          )}
        </div>
      </div>

      {draft && (
        <div className="viz-input">
          {def.fields.map((f) => (
            <label key={f.key} className="viz-field">
              <span className="viz-field-l">{f.label}</span>
              {f.type === 'select' ? (
                <select className="select" value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}>
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input className="input mono" value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && applyDraft()} />
              )}
            </label>
          ))}
          <div className="viz-input-act">
            <button type="button" className="btn btn--plasma btn--sm" onClick={applyDraft}>
              Visualize
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setData(initial); setDraft(null); setError(null); }}>
              Reset to example
            </button>
            {error && <span className="viz-error">{error}</span>}
          </div>
        </div>
      )}

      <div className={`viz-body${sidePanels.length || showCx ? ' viz-body--side' : ''}`}>
        <div className="viz-stage">
          {stagePanels.map((p, i) => (
            <Panel key={i} panel={p} bars={bars} />
          ))}
        </div>
        {(sidePanels.length > 0 || showCx) && (
          <div className="viz-side">
            {sidePanels.map((p, i) => (
              <Panel key={i} panel={p} />
            ))}
            {showCx && <ComplexityReadout scenario={scenario} frames={frames.length} />}
          </div>
        )}
      </div>

      {pending !== null ? (
        <PredictCard predict={frames[pending].predict} answer={answer} onChoose={choose} onReveal={reveal} />
      ) : (
        <div className="viz-note" aria-live="polite">
          <span className="viz-note-n">
            {step + 1}/{frames.length}
          </span>
          <span>{frame.note}</span>
        </div>
      )}
      <div className="viz-controls">
        <div className="viz-ctrls">
          <button type="button" className="iconbtn" onClick={restart} disabled={step === 0 && pending === null} aria-label="First step">
            <Icon name="skipBack" size={16} />
          </button>
          <button type="button" className="iconbtn" onClick={() => { setPending(null); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0} aria-label="Previous step">
            <Icon name="chevronLeft" size={16} />
          </button>
          <button
            type="button"
            className="iconbtn viz-go"
            disabled={pending !== null}
            onClick={() => {
              if (step >= last) restart();
              setPlaying((p) => !p);
            }}
            aria-label={playing ? 'Pause' : step >= last ? 'Replay' : 'Play'}
          >
            <Icon name={playing ? 'pause' : step >= last ? 'rotate' : 'play'} size={16} />
          </button>
          <button type="button" className="iconbtn" onClick={next} disabled={step >= last || pending !== null} aria-label="Next step">
            <Icon name="chevronRight" size={16} />
          </button>
          <button type="button" className="iconbtn" onClick={() => { setPending(null); setStep(last); }} disabled={step >= last} aria-label="Last step">
            <Icon name="skipForward" size={16} />
          </button>
        </div>
        <div className="viz-track" style={{ '--p': `${pct}%` }}>
          <span className="viz-rail" aria-hidden="true" />
          <span className="viz-fill" aria-hidden="true" />
          {last > 0 &&
            frames.map((f, i) =>
              f.predict ? (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`viz-tick${verdicts[i] === true ? ' is-ok' : verdicts[i] === false ? ' is-no' : ''}`}
                  style={{ left: `${(i / last) * 100}%` }}
                />
              ) : null,
            )}
          <input type="range" min={0} max={last} value={step} onChange={(e) => { setPending(null); setStep(Number(e.target.value)); }} className="viz-scrub" aria-label="Step" />
        </div>
        <div className="viz-ctl-end">
          <span className="viz-stepno">
            step <b>{step + 1}</b> / {frames.length}
          </span>
          <div className="seg viz-speed" role="group" aria-label="Speed">
            {SPEEDS.map(([ms, l]) => (
              <button key={ms} type="button" aria-pressed={speed === ms} onClick={() => setSpeed(ms)}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
