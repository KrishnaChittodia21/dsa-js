// Renderers for visualization frames. All colours come from CSS variables (theme-aware).
const cellClass = (state) => (state ? `viz-cell viz-${state}` : 'viz-cell');

export function ArrayPanel({ panel }) {
  const { values, highlights = {}, range, pointers = [], label, showIndices = true } = panel;
  const byIndex = {};
  for (const p of pointers) (byIndex[p.index] ||= []).push(p);
  return (
    <div className="viz-panel">
      {label && <div className="viz-label">{label}</div>}
      <div className="viz-array" role="list">
        {values.length === 0 && <div className="viz-empty">empty</div>}
        {values.map((v, i) => {
          const inRange = range && i >= range[0] && i <= range[1];
          const edge = inRange ? `${i === range[0] ? ' range-start' : ''}${i === range[1] ? ' range-end' : ''}` : '';
          return (
            <div key={i} className={`viz-col${inRange ? ' in-range' + edge : ''}`} role="listitem">
              <div className={cellClass(highlights[i])}>{String(v)}</div>
              {showIndices && <div className="viz-index">{i}</div>}
              <div className="viz-pointers">
                {(byIndex[i] || []).map((p) => (
                  <span key={p.label} className={`viz-pointer ptr-${p.color || 'a'}`}>
                    ▲ {p.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StackPanel({ panel }) {
  const items = [...panel.values].reverse();
  return (
    <div className="viz-panel">
      <div className="viz-label">{panel.label || 'stack'}</div>
      <div className="viz-stack">
        {items.length === 0 && <div className="viz-empty">empty</div>}
        {items.map((v, i) => (
          <div key={items.length - i} className={`viz-cell viz-stack-cell${i === 0 ? ' viz-active' : ''}`}>
            {String(v)}
            {i === 0 && <span className="viz-top">top</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function QueuePanel({ panel }) {
  return (
    <div className="viz-panel">
      <div className="viz-label">{panel.label || 'queue'}</div>
      <div className="viz-queue">
        {panel.values.length === 0 ? <div className="viz-empty">empty</div> : <span className="viz-queue-end">front</span>}
        {panel.values.map((v, i) => (
          <div key={i} className={`viz-cell viz-queue-cell${i === 0 ? ' viz-visited' : ''}`}>
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
    <div className="viz-panel viz-vars">
      {Object.entries(panel.vars).map(([k, v]) => (
        <span key={k} className="viz-var">
          <span className="viz-var-k">{k}</span>
          <span className="viz-var-v">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
        </span>
      ))}
    </div>
  );
}

export function ListPanel({ panel }) {
  const { values, next, pointers = [], highlights = {} } = panel;
  const byIndex = {};
  for (const p of pointers) (byIndex[p.index] ||= []).push(p);
  return (
    <div className="viz-panel">
      <div className="viz-list">
        {next[0] === null && values.length > 0 && <span className="viz-null">∅ ←</span>}
        {values.map((v, i) => {
          let link = null;
          if (i < values.length - 1) {
            const fwd = next[i] === i + 1;
            const back = next[i + 1] === i;
            link = <span className={`viz-link${fwd || back ? '' : ' viz-link-none'}`}>{fwd ? '→' : back ? '←' : ' '}</span>;
          }
          return (
            <div key={i} className="viz-list-item">
              <div className="viz-col">
                <div className={`${cellClass(highlights[i])} viz-node-box`}>{String(v)}</div>
                <div className="viz-pointers">
                  {(byIndex[i] || []).map((p) => (
                    <span key={p.label} className={`viz-pointer ptr-${p.color || 'a'}`}>
                      ▲ {p.label}
                    </span>
                  ))}
                </div>
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
  const pad = 30;
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
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--viz-edge)" />
          </marker>
        </defs>
        {panel.edges.map((e, i) => {
          if (hidden.has(e.from) || hidden.has(e.to)) return null;
          const a = pos[e.from];
          const b = pos[e.to];
          if (!a || !b) return null;
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
          return (
            <g key={n.id} className={`viz-node ${n.state ? `viz-node-${n.state}` : ''}`}>
              {long ? <rect x={p.x - Math.max(r, n.label.length * 4.2)} y={p.y - 14} width={Math.max(2 * r, n.label.length * 8.4)} height={28} rx={8} /> : <circle cx={p.x} cy={p.y} r={r} />}
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
      <div className="viz-grid" style={{ gridTemplateColumns: `repeat(${panel.cells[0]?.length || 1}, 38px)` }}>
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
    <div className="viz-panel">
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

export function Panel({ panel }) {
  switch (panel.kind) {
    case 'array':
      return <ArrayPanel panel={panel} />;
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
