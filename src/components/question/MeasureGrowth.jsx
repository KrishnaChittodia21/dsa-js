// "Measure my time and space": run your code and the reference on generated inputs of size 8 … 4,096, count steps and
// peak extra memory (growth.js), fit a class to each, and show where you sit next to the reference.
import { useEffect, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import CodeLines from './CodeLines.jsx';
import { jobInWorker } from '../../runner/runInWorker.js';
import { CLASSES, fitClass, measurable } from '../../runner/growth.js';

const RANK = Object.fromEntries(CLASSES.map(([n], i) => [n, i]));
const fmt = (n) => Number(n).toLocaleString('en');
const reduce = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Chart({ mine, theirs, field, k }) {
  const W = 640,
    H = 270,
    L = 56,
    R = 16,
    T = 12,
    B = 36;
  const all = [...mine.points, ...theirs.points].map((p) => p[field]).filter((v) => v > 0);
  const top = Math.max(1, Math.ceil(Math.log10(Math.max(...all, 10)) + 0.15));
  const lx = (n) => L + ((Math.log2(n) - 3) / 9) * (W - L - R);
  const ly = (v) => H - B - (Math.log10(Math.max(1, v)) / top) * (H - T - B);
  const line = (pts, color) => {
    const p = pts.slice(0, k).map((d) => [lx(d.n), ly(d[field])]);
    if (!p.length) return null;
    return (
      <g>
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" points={p.map((x) => x.join(',')).join(' ')} />
        {p.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill={color} />
        ))}
      </g>
    );
  };
  return (
    <svg className="qp-mg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={field === 'calls' ? 'Steps by input size, log scales' : 'Peak extra memory by input size, log scales'}>
      <line className="ax" x1={L} y1={H - B} x2={W - R} y2={H - B} />
      <line className="ax" x1={L} y1={T} x2={L} y2={H - B} />
      {Array.from({ length: top + 1 }, (_, e) => (
        <g key={e}>
          <line className="ax" x1={L} x2={W - R} y1={ly(10 ** e)} y2={ly(10 ** e)} strokeDasharray="2 4" />
          <text x={L - 8} y={ly(10 ** e) + 3} textAnchor="end">
            {e ? `10^${e}` : '1'}
          </text>
        </g>
      ))}
      {[8, 64, 512, 4096].map((n) => (
        <text key={n} x={lx(n)} y={H - B + 16} textAnchor={n === 4096 ? 'end' : 'middle'}>
          {fmt(n)}
        </text>
      ))}
      <text x={(W + L) / 2} y={H - 4} textAnchor="middle">
        n (input size)
      </text>
      {line(theirs.points, 'var(--uv)')}
      {line(mine.points, 'var(--plasma)')}
    </svg>
  );
}

function TradeMap({ you, theirs }) {
  const cols = CLASSES.map(([n]) => n).filter((n, i) => i <= Math.max(4, RANK[you[0]], RANK[theirs[0]]));
  const rows = CLASSES.map(([n]) => n)
    .filter((n, i) => i <= Math.max(2, RANK[you[1]], RANK[theirs[1]]))
    .reverse();
  return (
    <div
      className="qp-mg-map"
      style={{
        gridTemplateColumns: `54px repeat(${cols.length}, minmax(0, 1fr))`,
      }}>
      <span />
      {cols.map((c) => (
        <span key={c} className="h">
          {c}
        </span>
      ))}
      {rows.map((r) => (
        <div key={r} style={{ display: 'contents' }}>
          <span className="rh">{r}</span>
          {cols.map((c) => (
            <span key={c} className={`c${RANK[c] <= 2 && RANK[r] === 0 ? ' best' : ''}`}>
              {theirs[0] === c && theirs[1] === r && <span className="qp-mg-mk ref">reference</span>}
              {you[0] === c && you[1] === r && <span className="qp-mg-mk you">yours</span>}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function tradeText(you, theirs) {
  const dt = RANK[you[0]] - RANK[theirs[0]];
  const ds = RANK[you[1]] - RANK[theirs[1]];
  if (!dt && !ds) return 'Same classes as the reference on both axes.';
  if (dt > 0 && ds >= 0) return 'Slower and it saves no memory: not a trade, just a cost.';
  if (dt > 0 && ds < 0) return 'A real trade: you spend time to save memory.';
  if (dt < 0 && ds > 0) return 'A real trade: you spend memory to save time.';
  if (!dt && ds > 0) return 'Same time, but more memory than you need.';
  return 'You beat the reference on at least one axis.';
}

export default function MeasureGrowth({ question, code }) {
  const [m, setM] = useState(null);
  const [busy, setBusy] = useState(false);
  const [field, setField] = useState('calls');
  const [k, setK] = useState(0);
  const n = m && !m.error ? Math.max(m.mine.points.length, m.ref.points.length) : 0;

  useEffect(() => {
    if (!n) return undefined;
    if (reduce()) {
      setK(n);
      return undefined;
    }
    setK(1);
    const t = setInterval(() => setK((x) => (x >= n ? (clearInterval(t), x) : x + 1)), 170);
    return () => clearInterval(t);
  }, [m, n]);

  if (!measurable(question)) return <p className="qp-faint">Measuring growth needs generated inputs; this question's input types (or a class to design) aren't supported yet.</p>;

  const go = async () => {
    setBusy(true);
    setM(null);
    const [mine, ref] = await Promise.all([
      jobInWorker('measure', { question, code, role: 'your code' }, 20000),
      jobInWorker('measure', { question, code: question.solution.code, role: 'the reference' }, 20000),
    ]);
    const error = ref.error ? "Automatic inputs don't fit this question's rules yet (the reference rejected them)." : mine.error;
    setM(error ? { error } : { mine, ref, code });
    setBusy(false);
  };

  const done = m && !m.error && k >= n;
  const fit = (r, f) => fitClass(r.points, f);
  const f = done
    ? {
        yt: fit(m.mine, 'calls'),
        ys: fit(m.mine, 'space'),
        rt: fit(m.ref, 'calls'),
        rs: fit(m.ref, 'space'),
      }
    : null;
  const ok = f && f.yt && f.ys && f.rt && f.rs;
  const lastMine = done && m.mine.points[m.mine.points.length - 1];
  const lastRef = done && m.ref.points[m.ref.points.length - 1];
  const sameN = done && lastMine && m.ref.points.find((p) => p.n === lastMine.n);
  const hot = lastMine ? lastMine.hot.filter(([, s]) => s >= 0.15).slice(0, 3) : [];

  return (
    <div className="qp-mg">
      <div className="qp-row">
        <b>Measure my growth</b>
        <span className="qp-sp" />
        <div className="seg" role="group" aria-label="What to chart">
          <button type="button" aria-pressed={field === 'calls'} onClick={() => setField('calls')}>
            Time · steps
          </button>
          <button type="button" aria-pressed={field === 'space'} onClick={() => setField('space')}>
            Space · extra slots
          </button>
        </div>
        <button type="button" className="btn btn--plasma btn--sm" onClick={go} disabled={busy}>
          <Icon name="zap" size={14} /> Measure
        </button>
      </div>
      {!m && !busy && <p className="qp-faint">Runs your code and the reference on the same generated inputs, n = 8 … 4,096.</p>}
      {busy && (
        <div className="qp-running">
          <span className="qp-running-dot" aria-hidden="true" /> Measuring your code and the reference…
        </div>
      )}
      {m?.error && <div className="qp-err">{m.error}</div>}
      <div className="qp-mg-body">
        {m && !m.error && (
          <div className="qp-mg-plot">
            <Chart mine={m.mine} theirs={m.ref} field={field} k={k} />
            <div className="qp-mg-legend">
              <span>
                <i style={{ background: 'var(--plasma)' }} />
                yours
              </span>
              <span>
                <i style={{ background: 'var(--uv)' }} />
                reference
              </span>
              {m.mine.stoppedAt && (
                <span className="qp-faint" title={m.mine.reason}>
                  yours stopped at n = {fmt(m.mine.stoppedAt)}
                </span>
              )}
            </div>
          </div>
        )}
        {done && !ok && <p className="qp-faint">Too few sizes finished to name a class.</p>}
        {ok && (
          <div className="qp-mg-card">
            {field === 'calls' ? (
              <p>
                <b>Time:</b> yours grows like <span className={RANK[f.yt.name] > RANK[f.rt.name] ? 'qp-val qp-val--bad' : 'qp-val qp-val--ok'}>{f.yt.name}</span> (slope {f.yt.slope}); the reference
                like <span className="qp-val qp-val--ok">{f.rt.name}</span> (slope {f.rt.slope}).
                {sameN && (
                  <>
                    {' '}
                    At n = {fmt(lastMine.n)}: {fmt(lastMine.calls)} vs {fmt(sameN.calls)} steps.
                  </>
                )}
                {hot.length > 0 && <> Most steps: {hot.map(([l, s]) => `line ${l} (${Math.round(s * 100)}%)`).join(', ')}.</>}
              </p>
            ) : (
              <p>
                <b>Space:</b> yours holds <span className={RANK[f.ys.name] > RANK[f.rs.name] ? 'qp-val qp-val--bad' : 'qp-val qp-val--ok'}>O({f.ys.name})</span> extra (peak {fmt(lastMine.space)} slots
                at n = {fmt(lastMine.n)}
                ); the reference <span className="qp-val qp-val--ok">O({f.rs.name})</span> (peak {fmt(lastRef.space)} at n = {fmt(lastRef.n)}).
              </p>
            )}
            {field === 'calls' && hot.length > 0 && (
              <CodeLines code={m.code} only={hot.map(([l]) => l)} marks={Object.fromEntries(hot.map(([l]) => [l, 'hot']))} />
            )}
            <span className="lbl-mono">Where you sit</span>
            <TradeMap you={[f.yt.name, f.ys.name]} theirs={[f.rt.name, f.rs.name]} />
            <p>{tradeText([f.yt.name, f.ys.name], [f.rt.name, f.rs.name])}</p>
            {m.code !== code && <p className="qp-faint">The editor changed since this measurement. Press Measure again.</p>}
            <details className="qp-mg-how">
              <summary>How this is measured</summary>
              Both axes of the chart are logarithmic, so a straight line's slope is the power of n. The map puts time across and extra space up; bottom-left is best.
              {m.mine.stoppedAt ? ` Your run stopped at n = ${fmt(m.mine.stoppedAt)}: ${m.mine.reason}.` : ''} Steps count your own statements; work inside built-ins (sort, includes…) is not counted. Space counts your variables and the collections you create, not the input. Inputs are generated,
              so they may not hit a question's worst case.
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
