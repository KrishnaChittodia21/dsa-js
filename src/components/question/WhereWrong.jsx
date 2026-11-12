// "Where did I go wrong": from a failing test, shrink the input to the smallest one that still fails, record your run
// and the reference on it, and stop at the first step where a shared variable differs (growth.js).
import { lazy, Suspense, useEffect, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import CodeLines from './CodeLines.jsx';
import { jobInWorker, recordInWorker } from '../../runner/runInWorker.js';
import { describeTest } from '../../runner/core.js';
import { divergence } from '../../runner/growth.js';
import { buildRunFrames, text } from '../../visualizations/runFrames.js';

const Visualizer = lazy(() => import('../../visualizations/Visualizer.jsx'));
const oneLine = (q, args) => describeTest(q, { args }).replace(/\n/g, ', ');
const show = (v) => (typeof v === 'string' && /^\w*Error: /.test(v) ? v : text(v));
const reduce = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function WhereWrong({ question, code, test }) {
  const [st, setSt] = useState({ phase: 'idle' });
  const [shown, setShown] = useState(0); // shrink lines revealed so far
  const log = st.r?.log || [];

  useEffect(() => {
    if (!log.length) return undefined;
    if (reduce()) {
      setShown(log.length);
      return undefined;
    }
    setShown(1);
    const t = setInterval(() => setShown((k) => (k >= log.length ? (clearInterval(t), k) : k + 1)), 260);
    return () => clearInterval(t);
  }, [st.r]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = async () => {
    setSt({ phase: 'shrinking' });
    const r = await jobInWorker('shrink', { question, code, refCode: question.solution.code, args: test.args });
    if (r.error || r.note) return setSt({ phase: 'error', msg: r.error || r.note });
    setSt({ phase: 'recording', r });
    const small = { args: r.args, expected: r.log[r.log.length - 1].want };
    const [mine, ref] = await Promise.all([recordInWorker({ code, question, test: small }), recordInWorker({ code: question.solution.code, question, test: small })]);
    if (mine.compileError) return setSt({ phase: 'error', msg: mine.compileError });
    setSt({ phase: 'done', r, mine, ref, d: divergence(mine.steps, ref.steps), watch: false });
  };

  if (st.phase === 'idle')
    return (
      <button type="button" className="qp-ww-go" onClick={go}>
        <span className="qp-ww-ico" aria-hidden="true">
          <Icon name="search" size={16} />
        </span>
        <span className="qp-ww-txt">
          <b>Find where it went wrong</b>
          <span>Shrinks this input, then stops at the first line where your run leaves the correct one</span>
        </span>
        <Icon name="chevronRight" size={16} className="qp-ww-arrow" />
      </button>
    );
  if (st.phase === 'error') return <div className="qp-ww qp-ww--err">{st.msg}</div>;

  const last = log[log.length - 1];
  const all = shown >= log.length;
  const ret = st.mine && [...st.mine.steps].reverse().find((s) => s.ret);
  return (
    <div className="qp-ww">
      <span className="lbl-mono">Where it went wrong</span>
      {st.phase === 'shrinking' && <p className="qp-faint">Shrinking the input…</p>}
      {log.length > 0 && (
        <pre className="qp-ww-log" aria-live="polite">
          {log.slice(0, shown).map((e, i) => (
            <div key={i} className={i === log.length - 1 && all ? 'is-last' : ''}>
              {i ? '          ' : 'shrinking '}
              {oneLine(question, e.args)} · yours {show(e.got)} · correct {show(e.want)}
              {i === log.length - 1 && all ? '  ← smallest' : ''}
            </div>
          ))}
        </pre>
      )}
      {st.phase === 'recording' && all && <p className="qp-faint">Recording your run and the reference…</p>}
      {st.phase === 'done' && all && (
        <>
          <p className="qp-faint">
            {st.r.runs} runs · smallest failing input: <span className="mono">{oneLine(question, last.args)}</span>
          </p>
          {st.d ? (
            <>
              <p className="qp-ww-say">
                <b>
                  Step {st.d.at + 1} · line {st.d.line}:
                </b>{' '}
                your <code>{st.d.name}</code> is <span className="qp-val qp-val--bad">{text(st.d.mine)}</span>
                {st.d.ended ? (
                  <> but the correct run never gets here</>
                ) : (
                  <>
                    {' '}
                    where the correct run has <span className="qp-val qp-val--ok">{text(st.d.want)}</span>
                  </>
                )}
                .
              </p>
              <CodeLines code={code} marks={{ [st.d.line]: 'hot' }} around={st.d.line} />
            </>
          ) : (
            <p className="qp-ww-say">
              Every variable you share with the reference matches, but you return <span className="qp-val qp-val--bad">{show(last.got)}</span> instead of{' '}
              <span className="qp-val qp-val--ok">{show(last.want)}</span>
              {ret ? <> at line {ret.line}</> : null}. Look at what you return.
            </p>
          )}
          <div className="qp-row">
            <button type="button" className="btn btn--plasma btn--sm" onClick={() => setSt((s) => ({ ...s, watch: !s.watch }))}>
              <Icon name="play" size={14} /> {st.watch ? 'Hide the run' : 'Watch from here'}
            </button>
            <span className="qp-faint">
              your run: {(st.mine.calls ?? 0).toLocaleString('en')} steps · reference: {(st.ref.calls ?? 0).toLocaleString('en')} steps
            </span>
          </div>
          {st.watch && (
            <Suspense fallback={<div className="qp-faint">Loading…</div>}>
              <Visualizer
                scenario="where-wrong"
                frames={buildRunFrames(st.mine, code, {}, question.harness ? [] : question.paramNames || []).slice(Math.max(0, (st.d?.at ?? 0) - 1))}
                title={`Your run on ${oneLine(question, last.args)}`}
                caption={st.d && st.d.at > 0 ? `Starts one step before line ${st.d.line}, where ${st.d.name} first differs from the reference.` : 'Your run on the smallest failing input.'}
                eyebrow="from the first wrong step"
                compact
              />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}
