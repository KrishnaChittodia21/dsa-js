// A Short's thumbnail, drawn from its own first frame (no image files) — the card style of system-design-learn's
// Shorts page (components/ShortThumb.tsx there): topic kicker, pattern name, a still "glimpse" of the opening panel.
import { Check, Lock, Play } from 'lucide-react';

const TONES = ['var(--ice)', 'var(--uv-t)', 'var(--volt-t)', 'var(--plasma-t)', 'var(--good)'];
const STATE = { active: 'var(--plasma)', done: 'var(--good)', bad: 'var(--bad)', visited: 'var(--uv)', window: 'var(--ice)', muted: 'var(--faint)' };
const DIM = 'var(--line-3)';
const fill = (st) => STATE[st] || DIM;
const short3 = (v) => String(v ?? '').slice(0, 3);

/** a row (or grid) of labelled cells inside the 100 × 60 box */
function Cells({ rows, state = () => '' }) {
  const r = rows.slice(0, 5).map((row) => row.slice(0, 8));
  const cols = Math.max(...r.map((row) => row.length), 1);
  const s = Math.min(100 / cols, 60 / r.length) - 2;
  const x0 = (100 - cols * (s + 2)) / 2;
  const y0 = (60 - r.length * (s + 2)) / 2;
  return r.flatMap((row, i) =>
    row.map((v, j) => (
      <g key={`${i}-${j}`}>
        <rect x={x0 + j * (s + 2)} y={y0 + i * (s + 2)} width={s} height={s} rx={2} style={{ fill: fill(state(i, j)) }} />
        {s >= 9 && (
          <text x={x0 + j * (s + 2) + s / 2} y={y0 + i * (s + 2) + s / 2} dy="0.35em" textAnchor="middle" fontSize={Math.min(7, s / 2)} style={{ fill: 'var(--text)' }}>
            {short3(v)}
          </text>
        )}
      </g>
    )),
  );
}

function Glimpse({ panel, tone }) {
  switch (panel.kind) {
    case 'array':
    case 'stack':
    case 'queue':
    case 'list':
      return <Cells rows={[panel.values]} state={(_, j) => panel.highlights?.[j]} />;
    case 'grid':
      return <Cells rows={panel.cells} state={(i, j) => panel.states?.[i]?.[j]} />;
    case 'table':
      return <Cells rows={panel.cells} />;
    case 'nodes': {
      const ns = panel.nodes.slice(0, 12);
      const xs = ns.map((n) => n.x);
      const ys = ns.map((n) => n.y);
      const [mx, my] = [Math.min(...xs), Math.min(...ys)];
      const k = Math.min(88 / (Math.max(...xs) - mx || 1), 48 / (Math.max(...ys) - my || 1), 22);
      const pos = Object.fromEntries(ns.map((n) => [n.id, [6 + (n.x - mx) * k, 6 + (n.y - my) * k]]));
      return (
        <>
          {panel.edges.map((e, i) => pos[e.from] && pos[e.to] && <path key={i} d={`M${pos[e.from]} L${pos[e.to]}`} strokeWidth={1.2} style={{ stroke: DIM }} />)}
          {ns.map((n) => (
            <circle key={n.id} cx={pos[n.id][0]} cy={pos[n.id][1]} r={4.5} style={{ fill: n.state ? fill(n.state) : tone }} />
          ))}
        </>
      );
    }
    case 'intervals': {
      const items = panel.items.slice(0, 6);
      const span = panel.max - panel.min || 1;
      const h = 60 / items.length;
      return items.map((it, i) => (
        <rect key={i} x={((it.start - panel.min) / span) * 100} y={i * h + h * 0.25} width={Math.max(3, ((it.end - it.start) / span) * 100)} height={h * 0.5} rx={h * 0.25} style={{ fill: it.state ? fill(it.state) : tone }} />
      ));
    }
    case 'vars':
      return Object.entries(panel.vars)
        .slice(0, 3)
        .map(([key, v], i) => (
          <text key={key} x={0} y={14 + i * 18} fontSize={11} className="mono" style={{ fill: i ? 'var(--text-2)' : tone }}>
            {`${key} = ${String(v).slice(0, 8)}`}
          </text>
        ));
    default:
      return null;
  }
}

/** decorative: everything it shows is also in the card's text */
export default function ShortThumb({ short, topicTitle, done = false, locked = false }) {
  const tone = TONES[[...short.id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  const panels = short.steps[0]?.frames?.[0]?.panels || [];
  const panel = panels.find((p) => p.kind !== 'vars') || panels[0];
  return (
    <span className={`sh-thumb${locked ? ' locked' : ''}`} style={{ '--tone': tone }} aria-hidden="true">
      <span className="sh-thumb-kicker mono">{topicTitle}</span>
      <span className="sh-thumb-main">
        <span className="sh-thumb-big">{short.pattern.name}</span>
        {panel && (
          <svg className="sh-thumb-glimpse" viewBox="-2 -2 104 64">
            <Glimpse panel={panel} tone={tone} />
          </svg>
        )}
      </span>
      <span className="sh-thumb-play">{locked ? <Lock size={15} /> : <Play size={16} fill="currentColor" />}</span>
      {done && (
        <span className="sh-thumb-seen">
          <Check size={12} /> Done
        </span>
      )}
    </span>
  );
}
