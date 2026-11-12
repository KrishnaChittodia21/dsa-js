// "Ghost of past me": race one of your saved attempts (src/lib/attempts.js) against the code in the editor on the same
// test, both runs recorded and played in step, then compare their step counts on a big generated input.
import { useEffect, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Panel } from '../../visualizations/panels.jsx';
import { buildRunFrames } from '../../visualizations/runFrames.js';
import { jobInWorker, recordInWorker } from '../../runner/runInWorker.js';
import { measurable } from '../../runner/growth.js';

const SIDE = new Set(['vars', 'stack']);
const fmt = (n) => Number(n).toLocaleString('en');
const day = (iso) => new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });
const reduce = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Lane({ label, sub, frames, k }) {
  const last = frames.length - 1;
  const i = Math.min(k, last);
  const f = frames[i];
  const side = f.panels.filter((p) => SIDE.has(p.kind));
  const stage = f.panels.filter((p) => !SIDE.has(p.kind));
  return (
    <figure className="viz viz--compact qp-gh-lane">
      <div className="viz-head">
        <div className="viz-head-txt">
          <span className="eyebrow">
            <i className="pip pip--uv" />
            {label}
          </span>
          <div className="viz-title">{sub}</div>
        </div>
        <span className={`qp-gh-done${i === last ? ' is-on' : ''}`}>done</span>
      </div>
      <div className={`viz-body${side.length ? ' viz-body--side' : ''}`}>
        <div className="viz-stage">
          {stage.map((p, j) => (
            <Panel key={j} panel={p} />
          ))}
        </div>
        {side.length > 0 && (
          <div className="viz-side">
            {side.map((p, j) => (
              <Panel key={j} panel={p} />
            ))}
          </div>
        )}
      </div>
      <div className="viz-note">
        <span className="viz-note-n">
          {i + 1}/{frames.length}
        </span>
        <span>{f.note}</span>
      </div>
    </figure>
  );
}

export default function Attempts({ question, code, attempts, tests }) {
  const raceable = tests.map((t, i) => [t, i]).filter(([t]) => !t.argsGen && !t.opsGen);
  const [sel, setSel] = useState(Math.max(0, attempts.length - 1));
  const [ti, setTi] = useState(raceable[0]?.[1] ?? 0);
  const [race, setRace] = useState(null);
  const [busy, setBusy] = useState(false);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const max = race ? Math.max(race.old.frames.length, race.now.frames.length) - 1 : 0;
  const params = question.harness ? [] : question.paramNames || [];

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setK((x) => Math.min(max, x + 1)), reduce() ? 900 : 420);
    return () => clearInterval(t);
  }, [playing, max]);
  useEffect(() => {
    if (k >= max) setPlaying(false);
  }, [k, max]);

  if (!attempts.length)
    return (
      <div className="qp-empty">
        <b>Submit</b> saves an attempt here (your last 5, in this browser). Come back after you improve your solution and race the old one against it.
      </div>
    );

  const go = async () => {
    const old = attempts[Math.min(sel, attempts.length - 1)];
    setBusy(true);
    setPlaying(false);
    const test = tests[ti];
    const big = measurable(question) ? Promise.all([old.code, code].map((c) => jobInWorker('measure', { question, code: c, sizes: [1024] }))) : Promise.resolve(null);
    const [a, b, sizes] = await Promise.all([recordInWorker({ code: old.code, question, test }), recordInWorker({ code, question, test }), big]);
    setRace({ old: { run: a, frames: buildRunFrames(a, old.code, {}, params), at: old.at }, now: { run: b, frames: buildRunFrames(b, code, {}, params) }, big: sizes });
    setBusy(false);
    setK(0);
    setPlaying(true);
  };

  const ended = race && k >= max;
  const steps = (r) => fmt(r.run.calls ?? 0);
  const big = (i) => race?.big?.[i]?.points?.[0]?.calls;
  return (
    <div className="qp-stack">
      <div className="qp-gh-atts" role="group" aria-label="Your saved attempts">
        {attempts.map((a, i) => (
          <button key={a.at} type="button" className="qp-gh-att" aria-pressed={sel === i} onClick={() => setSel(i)}>
            <b>{day(a.at)}</b>
            {a.passed}/{a.total} tests passed
          </button>
        ))}
        <div className="qp-gh-att is-now">
          <b>Now</b>the code in the editor
        </div>
      </div>
      <div className="qp-row">
        <label className="qp-faint" htmlFor={`gh-${question.id}`}>
          Race on
        </label>
        <select id={`gh-${question.id}`} className="select qp-gh-test" value={ti} onChange={(e) => setTi(Number(e.target.value))}>
          {raceable.map(([t, i]) => (
            <option key={i} value={i}>
              Test {i + 1}
              {t.scenario ? ` · ${t.scenario}` : ''}
            </option>
          ))}
        </select>
        <span className="qp-sp" />
        <button type="button" className="btn btn--plasma btn--sm" onClick={go} disabled={busy || !raceable.length}>
          <Icon name="play" size={14} /> Race
        </button>
      </div>
      {busy && (
        <div className="qp-running">
          <span className="qp-running-dot" aria-hidden="true" /> Recording both runs…
        </div>
      )}
      {race && (
        <>
          <div className="qp-gh-lanes">
            <Lane label={`${day(race.old.at)} · ${steps(race.old)} steps`} sub="your earlier attempt" frames={race.old.frames} k={k} />
            <Lane label={`Now · ${steps(race.now)} steps`} sub="the code in the editor" frames={race.now.frames} k={k} />
          </div>
          <div className="qp-row">
            <button type="button" className="iconbtn" onClick={() => (k >= max ? (setK(0), setPlaying(true)) : setPlaying((p) => !p))} aria-label={playing ? 'Pause' : 'Play'}>
              <Icon name={playing ? 'pause' : 'play'} size={16} />
            </button>
            <button type="button" className="iconbtn" onClick={() => (setPlaying(false), setK((x) => Math.min(max, x + 1)))} disabled={k >= max} aria-label="Next step">
              <Icon name="skipForward" size={16} />
            </button>
            <button type="button" className="iconbtn" onClick={() => (setPlaying(false), setK(0))} aria-label="Restart">
              <Icon name="rotate" size={16} />
            </button>
            <span className="qp-faint">
              step {k + 1} of {max + 1}
            </span>
          </div>
          {ended && (
            <div className={`qp-gh-verdict${race.now.run.passed ? ' is-ok' : ''}`}>
              <p>
                {race.old.run.outputText === race.now.run.outputText ? <>Same answer ({race.now.run.outputText}). </> : <>Different answers: then {race.old.run.outputText}, now {race.now.run.outputText}. </>}
                Then: <b>{steps(race.old)}</b> steps · now: <b>{steps(race.now)}</b> steps on this test.
              </p>
              {big(0) !== undefined && big(1) !== undefined && (
                <p>
                  On 1,024 generated inputs: <b>{fmt(big(0))}</b> vs <b>{fmt(big(1))}</b> steps
                  {big(0) > big(1) ? <> · {fmt(Math.round(big(0) / big(1)))}× fewer now</> : big(1) > big(0) ? <> · {fmt(Math.round(big(1) / big(0)))}× more now</> : null}.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
