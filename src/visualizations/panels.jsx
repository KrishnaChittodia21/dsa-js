// Renderers for visualization frames in the Kinetic Voxel language: array cells are voxel cubes
// (or value-tall voxel columns for sorting), pointers are hard-edged beams from above, a range is a
// bracket on the floor, stacks are slab towers. All colours come from CSS variables (viz.css).
const cellClass = (state) => (state ? `viz-cell viz-${state}` : 'viz-cell');

/** Value-tall columns only make sense for small non-negative integers. */
function barsFor(values) {
  if (!values.length || values.length > 16) return null;
  if (!values.every((v) => typeof v === 'number' && Number.isInteger(v) && v >= 0)) return null;
  const max = Math.max(...values, 1);
  if (max > 40) return null;
  return { unit: Math.max(4, Math.min(16, Math.floor(150 / max))) };
}

function Pointers({ list }) {
  if (!list?.length) return null;
  return (
    <div className="viz-ptrs">
      {list.map((p) => (
        <span key={p.label} className={`viz-pointer ptr-${p.color || 'a'}`}>
          {p.label}
        </span>
      ))}
      <span className={`viz-beam ptr-${list[0].color || 'a'}`} aria-hidden="true" />
    </div>
  );
}

export function ArrayPanel({ panel, bars: allowBars }) {
  const { values, highlights = {}, range, pointers = [], label, showIndices = true } = panel;
  const byIndex = {};
  for (const p of pointers) (byIndex[p.index] ||= []).push(p);
  const bars = allowBars ? barsFor(values) : null;
  return (
    <div className="viz-panel viz-panel--array">
      {label && <div className="viz-label">{label}</div>}
      <div className={`viz-array${bars ? ' viz-array--bars' : ''}`} role="list" style={bars ? { '--u': `${bars.unit}px` } : undefined}>
        {values.length === 0 && <div className="viz-empty">empty</div>}
        {values.map((v, i) => {
          const inRange = range && i >= range[0] && i <= range[1];
          const edge = inRange ? `${i === range[0] ? ' range-start' : ''}${i === range[1] ? ' range-end' : ''}` : '';
          const st = highlights[i];
          return (
            <div key={i} className={`viz-col${inRange ? ' in-range' + edge : ''}`} role="listitem">
              <Pointers list={byIndex[i]} />
              {bars ? (
                <>
                  <span className={`viz-bar-val${st ? ` viz-${st}` : ''}`}>{String(v)}</span>
                  <div className={`vox viz-vox${st ? ` viz-${st}` : ''}`} style={{ '--h': Math.max(v, 0.3) }} aria-label={String(v)} />
                </>
              ) : (
                <div className={cellClass(st)}>{String(v)}</div>
              )}
              {showIndices && <div className="viz-index">{i}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The stack as a voxel tower: slabs grow upward, the top slab glows (uv = current). */
export function StackPanel({ panel }) {
  const items = [...panel.values].reverse();
  return (
    <div className="viz-panel viz-panel--stack">
      <div className="viz-label">
        {panel.label || 'stack'} <span className="viz-label-sub">· grows up</span>
      </div>
      <div className="viz-tower">
        {items.length === 0 && <div className="viz-slab viz-slab--ghost">empty</div>}
        {items.map((v, i) => (
          <div key={items.length - i} className={`viz-slab${i === 0 ? ' viz-slab--top' : ''}${i === items.length - 1 ? ' viz-slab--base' : ''}`}>
            <span className="viz-slab-d">#{items.length - 1 - i}</span>
            <span className="viz-slab-v">{String(v)}</span>
            {i === 0 && <span className="viz-slab-t">top</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function QueuePanel({ panel }) {
  return (
    <div className="viz-panel viz-panel--queue">
      <div className="viz-label">{panel.label || 'queue'}</div>
      <div className="viz-queue">
        {panel.values.length === 0 ? <div className="viz-empty">empty</div> : <span className="viz-queue-end">front</span>}
        {panel.values.map((v, i) => (
          <div key={i} className={`viz-cell viz-queue-cell${i === 0 ? ' viz-window' : ''}`}>
            {String(v)}
          </div>
        ))}
        {panel.values.length > 0 && <span className="viz-queue-end">back</span>}
      </div>
    </div>
  );
}

export function VarsPanel({ panel }) {
  return (
    <div className="viz-panel viz-panel--vars">
      <div className="viz-label">variables</div>
      <div className="viz-vars">
        {Object.entries(panel.vars).map(([k, v]) => {
          const text = typeof v === 'object' ? JSON.stringify(v) : String(v);
          return (
            <span key={k} className={`viz-var${text.length > 7 ? ' viz-var--wide' : ''}`}>
              <span className="viz-var-k">{k}</span>
              <span className="viz-var-v">{text}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function ListPanel({ panel }) {
  // doubly: forward links are drawn as ⇄ (each node also points back to its prev).
  const { values, next, pointers = [], highlights = {}, doubly = false } = panel;
  const byIndex = {};
  for (const p of pointers) (byIndex[p.index] ||= []).push(p);
  return (
    <div className="viz-panel viz-panel--list">
      <div className="viz-list">
        {next[0] === null && values.length > 0 && <span className="viz-null">∅ ←</span>}
        {values.map((v, i) => {
          let link = null;
          if (i < values.length - 1) {
            const fwd = next[i] === i + 1;
            const back = next[i + 1] === i;
            link = <span className={`viz-link${fwd || back ? '' : ' viz-link-none'}`}>{fwd ? (doubly ? '⇄' : '→') : back ? '←' : ' '}</span>;
          }
          return (
            <div key={i} className="viz-list-item">
              <div className="viz-col">
                <Pointers list={byIndex[i]} />
                <div className={`${cellClass(highlights[i])} viz-node-box`}>{String(v)}</div>
              </div>
              {link}
            </div>
          );
        })}
        {values.length > 0 && next[values.length - 1] === null && <span className="viz-null">→ ∅</span>}
      </div>
    </div>
  );
}

export function NodesPanel({ panel }) {
  const visible = panel.nodes.filter((n) => n.state !== 'hidden');
  if (!visible.length) return <div className="viz-panel viz-empty">empty</div>;
  const free = panel.freeLayout;
  const sx = free ? 70 : 52;
  const sy = free ? 70 : 64;
  const r = 18;
  // Self-loops (from === to) are drawn as a small arc pointing away from the diagram's centre.
  const hasLoop = panel.edges.some((e) => e.from === e.to);
  const pad = hasLoop ? 62 : 30;
  const xs = panel.nodes.map((n) => n.x * sx);
  const ys = panel.nodes.map((n) => n.y * sy);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX + pad * 2;
  const height = Math.max(...ys) - minY + pad * 2;
  const pos = Object.fromEntries(panel.nodes.map((n) => [n.id, { x: n.x * sx - minX + pad, y: n.y * sy - minY + pad, n }]));
  const hidden = new Set(panel.nodes.filter((n) => n.state === 'hidden').map((n) => n.id));
  const markerId = `arrow-${Math.round(width)}-${Math.round(height)}-${panel.nodes.length}`;
  return (
    <div className="viz-panel viz-svg-wrap">
      {panel.label && <div className="viz-label">{panel.label}</div>}
      <svg viewBox={`0 0 ${width} ${height}`} width={Math.min(width, 900)} style={{ maxWidth: '100%', height: 'auto' }} role="img" aria-label="diagram">
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="viz-arrowhead" />
          </marker>
        </defs>
        {panel.edges.map((e, i) => {
          if (hidden.has(e.from) || hidden.has(e.to)) return null;
          const a = pos[e.from];
          const b = pos[e.to];
          if (!a || !b) return null;
          if (e.from === e.to) {
            const cx = width / 2;
            const cy = height / 2;
            const ang = Math.hypot(a.x - cx, a.y - cy) < 1 ? -Math.PI / 2 : Math.atan2(a.y - cy, a.x - cx);
            const at = (t, d) => [a.x + Math.cos(t) * d, a.y + Math.sin(t) * d];
            const [x1, y1] = at(ang - 0.55, r);
            const [x2, y2] = at(ang + 0.55, r + 3);
            const [c1x, c1y] = at(ang - 0.95, r * 3.4);
            const [c2x, c2y] = at(ang + 0.95, r * 3.4);
            const [lx, ly] = at(ang, r * 2.9 + Math.abs(Math.cos(ang)) * 14);
            return (
              <g key={i}>
                <path d={`M ${x1} ${y1} C ${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`} fill="none" className={`viz-edge ${e.state ? `viz-edge-${e.state}` : ''}`} markerEnd={panel.directed ? `url(#${markerId})` : undefined} />
                {e.label && (
                  <text x={lx} y={ly + 4} className="viz-edge-label" textAnchor="middle">
                    {e.label}
                  </text>
                )}
              </g>
            );
          }
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const x1 = a.x + (dx / len) * r;
          const y1 = a.y + (dy / len) * r;
          const x2 = b.x - (dx / len) * (r + (panel.directed ? 3 : 0));
          const y2 = b.y - (dy / len) * (r + (panel.directed ? 3 : 0));
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={`viz-edge ${e.state ? `viz-edge-${e.state}` : ''}`} markerEnd={panel.directed ? `url(#${markerId})` : undefined} />
              {e.label && (
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} className="viz-edge-label" textAnchor="middle">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        {panel.nodes.map((n) => {
          if (n.state === 'hidden') return null;
          const p = pos[n.id];
          const long = n.label.length > 3;
          const w = Math.max(2 * r, n.label.length * 8.4);
          return (
            <g key={n.id} className={`viz-node ${n.state ? `viz-node-${n.state}` : ''}`}>
              {/* the puck's side: an offset copy underneath gives each node voxel depth */}
              {long ? (
                <rect className="viz-node-side" x={p.x - w / 2 + 3} y={p.y - 14 + 4} width={w} height={28} rx={8} />
              ) : (
                <circle className="viz-node-side" cx={p.x + 2.5} cy={p.y + 4} r={r} />
              )}
              {long ? <rect className="viz-node-face" x={p.x - w / 2} y={p.y - 14} width={w} height={28} rx={8} /> : <circle className="viz-node-face" cx={p.x} cy={p.y} r={r} />}
              <text x={p.x} y={p.y + 4.5} textAnchor="middle">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function GridPanel({ panel }) {
  return (
    <div className="viz-panel">
      {panel.label && <div className="viz-label">{panel.label}</div>}
      <div className="viz-grid" style={{ gridTemplateColumns: `repeat(${panel.cells[0]?.length || 1}, var(--viz-gc, 38px))` }}>
        {panel.cells.flatMap((row, r) =>
          row.map((v, c) => (
            <div key={`${r}-${c}`} className={`viz-grid-cell viz-${panel.states?.[r]?.[c] || 'none'}`}>
              {String(v)}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

export function TablePanel({ panel }) {
  return (
    <div className="viz-panel viz-table-wrap">
      {panel.label && <div className="viz-label">{panel.label}</div>}
      <table className="viz-table">
        <thead>
          <tr>
            <th />
            {panel.colLabels.map((c, j) => (
              <th key={j}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {panel.cells.map((row, i) => (
            <tr key={i}>
              <th>{panel.rowLabels[i]}</th>
              {row.map((v, j) => (
                <td key={j} className={`viz-${panel.states?.[i]?.[j] || 'none'}`}>
                  {String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IntervalsPanel({ panel }) {
  const span = Math.max(1, panel.max - panel.min);
  const ticks = [];
  const step = Math.max(1, Math.ceil(span / 12));
  for (let t = panel.min; t <= panel.max; t += step) ticks.push(t);
  return (
    <div className="viz-panel viz-panel--intervals">
      <div className="viz-label">{panel.label}</div>
      <div className="viz-intervals">
        {panel.items.length === 0 && <div className="viz-empty">none yet</div>}
        {panel.items.map((it, i) => (
          <div key={i} className="viz-interval-row">
            <div
              className={`viz-interval viz-${it.state || 'none'}`}
              style={{ left: `${((it.start - panel.min) / span) * 100}%`, width: `${Math.max(1.5, ((it.end - it.start) / span) * 100)}%` }}
            >
              [{it.start}, {it.end}]
            </div>
          </div>
        ))}
        <div className="viz-axis">
          {ticks.map((t) => (
            <span key={t} style={{ left: `${((t - panel.min) / span) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Panel({ panel, bars }) {
  switch (panel.kind) {
    case 'array':
      return <ArrayPanel panel={panel} bars={bars} />;
    case 'stack':
      return <StackPanel panel={panel} />;
    case 'queue':
      return <QueuePanel panel={panel} />;
    case 'vars':
      return <VarsPanel panel={panel} />;
    case 'list':
      return <ListPanel panel={panel} />;
    case 'nodes':
      return <NodesPanel panel={panel} />;
    case 'grid':
      return <GridPanel panel={panel} />;
    case 'table':
      return <TablePanel panel={panel} />;
    case 'intervals':
      return <IntervalsPanel panel={panel} />;
    default:
      return null;
  }
}
