import { useId } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Isometric "pattern city": one tower per topic, one row per stage. Height = topic mastery,
 * colour = status (completed = plasma heat, in progress = uv, unlocked = ice outline, locked = graphite).
 * The current topic carries a beacon. Towers are keyboard-focusable links to their topic.
 *
 * stages: { id, number, title, topics: { id, title, status: 'completed'|'in-progress'|'available'|'locked', mastery (0–100), current }[] }[]
 */
const A = 40;
const DX = A * Math.cos(Math.PI / 6);
const DY = A * 0.5;
const GAP = 0.78;
const MAXH = 120;
const COLS = 6;

const P = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const ST = { completed: 'done', 'in-progress': 'prog', available: 'avail', locked: 'lock' };
const WORD = { completed: 'completed', 'in-progress': 'in progress', available: 'unlocked', locked: 'locked' };

export default function VoxCity({ stages }) {
  const nav = useNavigate();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rows = stages.length;
  const ox = (rows - 1) * DX + DX + 12;
  const oy = DY + MAXH + 18;
  const W = ox + (COLS - 1) * DX + DX + 150;
  const H = oy + (rows - 1 + COLS - 1) * DY + DY + 16;

  const cells = [];
  stages.forEach((st, r) => {
    for (let c = 0; c < COLS; c++) cells.push({ depth: r + c, c, r, topic: st.topics[c] || null });
  });
  cells.sort((a, b) => a.depth - b.depth || a.c - b.c);

  let beacon = null;
  const towers = cells.map(({ c, r, topic }) => {
    const X = ox + (c - r) * DX;
    const Y = oy + (c + r) * DY;
    if (!topic) {
      return <polygon key={`v${r}-${c}`} className="vc-void" points={P([[X, Y - DY * GAP], [X + DX * GAP, Y], [X, Y + DY * GAP], [X - DX * GAP, Y]])} />;
    }
    const m = Math.max(0, Math.min(100, topic.mastery)) / 100;
    const st = topic.current ? 'cur' : ST[topic.status] || 'lock';
    const h = st === 'done' ? 30 + m * 90 : st === 'prog' || st === 'cur' ? 14 + m * 90 : st === 'avail' ? 6 + m * 90 : 3;
    const top = [[X, Y - DY * GAP - h], [X + DX * GAP, Y - h], [X, Y + DY * GAP - h], [X - DX * GAP, Y - h]];
    const left = [[X - DX * GAP, Y - h], [X, Y + DY * GAP - h], [X, Y + DY * GAP], [X - DX * GAP, Y]];
    const right = [[X, Y + DY * GAP - h], [X + DX * GAP, Y - h], [X + DX * GAP, Y], [X, Y + DY * GAP]];
    const seams = [];
    if (h > 18) for (let yy = 15; yy < h - 4; yy += 15) seams.push(`M${(X - DX * GAP).toFixed(1)},${(Y - yy).toFixed(1)} L${X.toFixed(1)},${(Y + DY * GAP - yy).toFixed(1)} L${(X + DX * GAP).toFixed(1)},${(Y - yy).toFixed(1)}`);
    const label = `${topic.title}: ${WORD[topic.status]}${topic.status !== 'locked' ? `, mastery ${topic.mastery}%` : ''}${topic.current ? ', you are here' : ''}. Open topic`;
    if (st === 'cur')
      beacon = (
        <g className="vc-beacon" aria-hidden="true">
          <polygon points={P([[X - DX * GAP * 0.55, Y - h], [X + DX * GAP * 0.55, Y - h], [X + 2, 6], [X - 2, 6]])} fill={`url(#${uid}beam)`} opacity=".55" />
          <circle cx={X} cy={Y - h} r="5" className="vc-ping" />
        </g>
      );
    const go = () => nav(`/topic/${topic.id}`);
    return (
      <g
        key={topic.id}
        className={`vc vc-${st}`}
        tabIndex={0}
        role="link"
        aria-label={label}
        onClick={go}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            go();
          }
        }}
      >
        <title>{label.replace('. Open topic', '')}</title>
        <polygon className="vc-l" points={P(left)} style={{ fill: fillFor(st, 'l', uid) }} />
        <polygon className="vc-r" points={P(right)} style={{ fill: fillFor(st, 'r', uid) }} />
        {seams.map((d) => (
          <path key={d} className="vc-seam" d={d} />
        ))}
        <polygon className="vc-t" points={P(top)} />
      </g>
    );
  });

  return (
    <svg className="vcity" viewBox={`0 0 ${W.toFixed(0)} ${H.toFixed(0)}`} role="group" aria-label={`Pattern city: ${stages.reduce((n, s) => n + s.topics.length, 0)} topics in ${rows} stages, tower height shows mastery`}>
      <defs>
        <linearGradient id={`${uid}beam`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#7B5CFF" stopOpacity=".85" />
          <stop offset="1" stopColor="#7B5CFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}hotL`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF7A3D" />
          <stop offset="1" stopColor="#E0306F" />
        </linearGradient>
        <linearGradient id={`${uid}hotR`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B8336A" />
          <stop offset="1" stopColor="#6A1640" />
        </linearGradient>
        <linearGradient id={`${uid}uvL`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9B82FF" />
          <stop offset="1" stopColor="#5B3FE0" />
        </linearGradient>
        <linearGradient id={`${uid}uvR`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A33B8" />
          <stop offset="1" stopColor="#2A1D70" />
        </linearGradient>
      </defs>
      {towers}
      {beacon}
      {stages.map((st, r) => (
        <text key={st.id} className="vc-lbl" x={(ox + (COLS - 0.35 - r) * DX).toFixed(1)} y={(oy + (COLS - 0.35 + r) * DY + 4).toFixed(1)} aria-hidden="true">
          S{String(st.number).padStart(2, '0')} {st.title}
        </text>
      ))}
    </svg>
  );
}

/** gradient faces for heat / uv towers (ids are per-instance); other states are styled in CSS */
function fillFor(st, face, uid) {
  if (st === 'done') return `url(#${uid}hot${face.toUpperCase()})`;
  if (st === 'prog' || st === 'cur') return `url(#${uid}uv${face.toUpperCase()})`;
  return undefined;
}
