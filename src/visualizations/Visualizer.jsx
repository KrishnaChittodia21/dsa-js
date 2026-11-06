import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS } from './scenarios/index.js';
import { Panel } from './panels.jsx';
import { useFitZoom } from './useFitZoom.js';
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
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Tween between frames: pointers ([data-flip], remounted in a new column) slide from where they were
 * (FLIP via the `translate` property, so CSS transforms on the element still apply), and cells whose
 * text changed ([data-pop]) pop. Keys are per panel index, so two arrays can both have an `i`.
 */
function useFrameMotion(ref, frame) {
  const prev = useRef(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const seen = new Map();
    const reduce = reducedMotion();
    root.querySelectorAll('.viz-panel').forEach((panel, pi) => {
      for (const el of panel.querySelectorAll('[data-flip]')) {
        const k = `${pi}f${el.dataset.flip}`;
        const r = el.getBoundingClientRect();
        seen.set(k, r);
        const was = prev.current?.get(k);
        if (reduce || !was || !el.animate) continue;
        const z = el.offsetWidth ? r.width / el.offsetWidth : 1; // the stage may be CSS-zoomed to fit
        const dx = (was.left - r.left) / z;
        const dy = (was.top - r.top) / z;
        if (Math.abs(dx) + Math.abs(dy) > 0.5) el.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: 240, easing: EASE });
      }
      for (const el of panel.querySelectorAll('[data-pop]')) {
        const k = `${pi}p${el.dataset.pop}`;
        seen.set(k, el.textContent);
        const was = prev.current?.get(k);
        if (!reduce && was !== undefined && was !== el.textContent && el.animate) el.animate([{ scale: 1.14 }, { scale: 1 }], { duration: 220, easing: EASE });
      }
    });
    prev.current = seen;
  }, [ref, frame]);
}
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
  const first = useRef(null);
  useEffect(() => {
    // the card disables Next: move a keyboard user to the options, unless they are working elsewhere on the page
    const at = document.activeElement;
    if (!at || at === document.body || first.current?.closest('figure')?.contains(at)) first.current?.focus({ preventScroll: true });
  }, []);
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
              <button key={i} ref={i === 0 ? first : undefined} type="button" className={`option option-compact ${state}`} disabled={answeredNow} onClick={() => onChoose(i)}>
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
/** A scene by id, or ready-made `frames` (with `title`): "Animate my run" plays a recorded run in the same player. */
export default function Visualizer({ scenario, input, caption, compact = false, wide = false, eyebrow, frames: given, title, autoPlay = false, autoFocus = false, bars: barsProp }) {
  const def = useMemo(() => (given ? { title, description: caption } : SCENARIOS[scenario]), [given, title, caption, scenario]);
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
  const fill = useRef(null);
  const elapsed = useRef(0); // ms played into the current step (kept across pause, so resume continues)
  const body = useRef(null);
  const fig = useRef(null);
  useEffect(() => {
    // a new player replaced the button that was pressed: keep a keyboard user's place instead of dropping focus to the page
    if (autoFocus && (!document.activeElement || document.activeElement === document.body)) fig.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frames = useMemo(() => {
    if (given) return given;
    if (!def) return [];
    try {
      return def.generate(structuredClone(data));
    } catch (e) {
      return [{ note: `Could not run this input: ${e.message}`, panels: [] }];
    }
  }, [def, data, given]);

  const totalPredicts = useMemo(() => frames.filter((f) => f.predict).length, [frames]);
  const restart = () => {
    elapsed.current = 0;
    setStep(0);
    setPlaying(false);
    setPending(null);
    setAnswer(null);
    setAnswered(new Set());
    setVerdicts({});
    setScore({ correct: 0, total: 0 });
  };
  useEffect(() => {
    restart();
    // a fresh recorded run plays by itself, unless the reader asked for reduced motion
    if (autoPlay && frames.length > 1 && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

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
    fig.current?.focus({ preventScroll: true }); // the card (and its focused button) goes away
    setAnswered((a) => new Set(a).add(pending));
    setStep(pending);
    setPending(null);
    setAnswer(null);
  };

  useEffect(() => {
    elapsed.current = 0;
  }, [step, frames]);
  // One rAF loop both times the steps and glides the progress fill through the current step
  // (written straight to the DOM: no re-render per frame). Paused or stepped by hand, it sits still.
  useEffect(() => {
    const draw = () => fill.current?.style.setProperty('--f', reducedMotion() ? '0' : String(Math.min(elapsed.current / speed, 1)));
    draw();
    if (!playing) return undefined;
    let before = performance.now();
    let raf;
    const tick = (now) => {
      elapsed.current += now - before;
      before = now;
      if (elapsed.current >= speed) {
        next();
        return;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step, speed]);
  useFrameMotion(body, frames[step]);

  const [stageRef, zoom] = useFitZoom(frames[step]); // before the early return: hooks run in the same order
  if (!def) return <div className="card muted small">Unknown visualization “{scenario}”.</div>;
  const frame = frames[Math.min(step, frames.length - 1)] || { note: '', panels: [] };
  const last = frames.length - 1;
  const bars = barsProp ?? BAR_SCENARIOS.has(scenario);
  const stagePanels = frame.panels.filter((p) => !SIDE_KINDS.has(p.kind));
  const sidePanels = frame.panels.filter((p) => SIDE_KINDS.has(p.kind));
  const showCx = wide && !!SCENARIO_COMPLEXITY[scenario];
  const at = last > 0 ? Math.min(step, last) / last : 0; // fill = at + seg × (fraction of this step played)
  const seg = last > 0 && step < last ? 1 / last : 0;

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
    <figure ref={fig} className={`viz ${compact ? 'viz--compact' : ''} ${wide ? 'viz--wide' : ''}`} tabIndex={0} onKeyDown={onKey} aria-label={`Visualization: ${def.title}`}>
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

      <div ref={body} className={`viz-body${sidePanels.length || showCx ? ' viz-body--side' : ''}`}>
        <div className="viz-stage" ref={stageRef} style={zoom < 1 ? { zoom } : undefined}>
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
        <div className="viz-track" style={{ '--p': at, '--seg': seg }}>
          <span className="viz-rail" aria-hidden="true" />
          <span ref={fill} className="viz-fill" aria-hidden="true" />
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
