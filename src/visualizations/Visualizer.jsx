import { useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS } from './scenarios/index.js';
import { Panel } from './panels.jsx';
import Icon from '../components/ui/Icon.jsx';
import '../styles/viz.css';

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

// Shown instead of the step note when the player pauses to ask "what happens next?".
function PredictCard({ predict, answer, onChoose, onReveal }) {
  const answeredNow = answer !== null;
  const correct = answeredNow && answer === predict.answer;
  return (
    <div className={`viz-predict ${answeredNow ? (correct ? 'is-correct' : 'is-wrong') : ''}`} role="group" aria-label="Predict the next step">
      <div className="viz-predict-q">
        <Icon name="help" size={15} /> <strong>Predict:</strong> {predict.question}
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
      {answeredNow && (
        <div className="row-wrap" style={{ marginTop: '0.5rem' }}>
          <span className="small" style={{ color: correct ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
            {correct ? 'Correct!' : `Not quite — it's ${LETTERS[predict.answer]}.`}
          </span>
          {predict.explain && <span className="small">{predict.explain}</span>}
          <span className="spacer" />
          <button type="button" className="btn btn-primary btn-sm" onClick={onReveal} autoFocus>
            Show the step <Icon name="chevronRight" size={14} />
          </button>
        </div>
      )}
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

export default function Visualizer({ scenario, input, caption, compact = false }) {
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

  const onKey = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (pending !== null) return;
    if (e.key === 'ArrowRight') {
      next();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setStep((s) => Math.max(0, s - 1));
      e.preventDefault();
    } else if (e.key === ' ') {
      setPlaying((p) => !p);
      e.preventDefault();
    }
  };

  const applyDraft = () => {
    try {
      const next = { ...data };
      for (const f of def.fields || []) next[f.key] = parse(f, draft[f.key]);
      setData(next);
      setDraft(null);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <figure className={`viz ${compact ? 'viz-compact' : ''}`} tabIndex={0} onKeyDown={onKey} aria-label={`Visualization: ${def.title}`}>
      <div className="viz-head">
        <div>
          <div className="viz-title">
            <Icon name="play" size={14} /> {def.title}
          </div>
          <div className="small muted">{caption || def.description}</div>
        </div>
        <span className="spacer" />
        {totalPredicts > 0 && (
          <label className="viz-predict-toggle small" title="Pause at key steps and ask what happens next">
            <input
              type="checkbox"
              checked={predictMode}
              onChange={(e) => {
                setPredictMode(e.target.checked);
                savePredictPref(e.target.checked);
                setPending(null);
              }}
            />
            Predict mode
            {score.total > 0 && <span className="badge badge-accent mono">{score.correct}/{score.total}</span>}
          </label>
        )}
        {def.fields?.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setDraft(draft ? null : Object.fromEntries(def.fields.map((f) => [f.key, toText(f, data[f.key])])))}
          >
            <Icon name="code" size={14} /> {draft ? 'Cancel' : 'Try your own input'}
          </button>
        )}
      </div>

      {draft && (
        <div className="viz-input">
          {def.fields.map((f) => (
            <label key={f.key} className="viz-field">
              <span className="small muted">{f.label}</span>
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
          <div className="row">
            <button type="button" className="btn btn-primary btn-sm" onClick={applyDraft}>
              Visualize
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setData(initial); setDraft(null); setError(null); }}>
              Reset to example
            </button>
            {error && <span className="small" style={{ color: 'var(--danger)' }}>{error}</span>}
          </div>
        </div>
      )}

      <div className="viz-stage">
        {frame.panels.map((p, i) => (
          <Panel key={i} panel={p} />
        ))}
      </div>
      {pending !== null ? (
        <PredictCard predict={frames[pending].predict} answer={answer} onChoose={choose} onReveal={reveal} />
      ) : (
        <div className="viz-note" aria-live="polite">
          <span className="badge badge-accent mono">
            {step + 1}/{frames.length}
          </span>
          <span>{frame.note}</span>
        </div>
      )}
      <div className="viz-controls">
        <button type="button" className="btn btn-icon btn-sm" onClick={restart} disabled={step === 0 && pending === null} aria-label="First step">
          <Icon name="skipBack" size={15} />
        </button>
        <button type="button" className="btn btn-icon btn-sm" onClick={() => { setPending(null); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0} aria-label="Previous step">
          <Icon name="chevronLeft" size={15} />
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={pending !== null}
          onClick={() => {
            if (step >= last) restart();
            setPlaying((p) => !p);
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          <Icon name={playing ? 'pause' : 'play'} size={14} /> {playing ? 'Pause' : step >= last ? 'Replay' : 'Play'}
        </button>
        <button type="button" className="btn btn-icon btn-sm" onClick={next} disabled={step >= last || pending !== null} aria-label="Next step">
          <Icon name="chevronRight" size={15} />
        </button>
        <button type="button" className="btn btn-icon btn-sm" onClick={() => { setPending(null); setStep(last); }} disabled={step >= last} aria-label="Last step">
          <Icon name="skipForward" size={15} />
        </button>
        <input type="range" min={0} max={last} value={step} onChange={(e) => { setPending(null); setStep(Number(e.target.value)); }} className="viz-scrub" aria-label="Step" />
        <select className="select btn-sm" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Speed">
          <option value={1800}>0.5×</option>
          <option value={1100}>1×</option>
          <option value={600}>2×</option>
          <option value={300}>4×</option>
        </select>
      </div>
    </figure>
  );
}
