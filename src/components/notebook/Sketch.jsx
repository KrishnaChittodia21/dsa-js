// The Notebook's sketch board: boxes, nodes, arrows, labels and a pen on the dot grid, saved as a list of shapes
// (lib/notes.js Shape) and drawn as SVG both here and as a thumbnail on the note card.
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Circle, Eraser, PenLine, Square, Type, Undo2, Workflow, X } from 'lucide-react';
import { INKS } from '../../lib/notes.js';

const W = 720;
const H = 440;
// ink names → the app's tokens (Key idea plasma, Remember ice, Confusing volt, My take uv)
const INK_VAR = { ink: 'var(--text)', blue: 'var(--info)', cyan: 'var(--ice)', amber: 'var(--plasma)', rose: 'var(--volt)', mag: 'var(--uv)' };
const col = (c) => INK_VAR[c] ?? INK_VAR.ink;
const snap = (v) => Math.round(v / 20) * 20;

export function ShapeEl({ s, i }) {
  const data = i === undefined ? {} : { 'data-i': i };
  const stroke = col(s.c);
  const fill = `color-mix(in srgb, ${stroke} 13%, transparent)`;
  if (s.t === 'box') return <rect {...data} className="ntb-sk" x={s.x} y={s.y} width={s.w} height={s.h} rx={14} style={{ stroke, fill }} />;
  if (s.t === 'node') return <ellipse {...data} className="ntb-sk" cx={s.x + s.w / 2} cy={s.y + s.h / 2} rx={s.w / 2} ry={s.h / 2} style={{ stroke, fill }} />;
  if (s.t === 'arrow') {
    const a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    const p = (d) => `${s.x2 - 13 * Math.cos(a + d)},${s.y2 - 13 * Math.sin(a + d)}`;
    return (
      <g {...data} className="ntb-sk" style={{ stroke }}>
        <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
        <path d={`M${p(0.45)} L${s.x2},${s.y2} L${p(-0.45)}`} />
      </g>
    );
  }
  if (s.t === 'pen') {
    const p = s.pts;
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let k = 1; k < p.length - 1; k++) d += ` Q${p[k][0]},${p[k][1]} ${(p[k][0] + p[k + 1][0]) / 2},${(p[k][1] + p[k + 1][1]) / 2}`;
    if (p.length > 1) d += ` L${p[p.length - 1][0]},${p[p.length - 1][1]}`;
    return <path {...data} className="ntb-sk" d={d} style={{ stroke }} />;
  }
  return (
    <text {...data} className="ntb-sk-t" x={s.x} y={s.y} style={{ fill: stroke }}>
      {s.s}
    </text>
  );
}

function bbox(shapes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => ((x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y)));
  for (const s of shapes) {
    if (s.t === 'box' || s.t === 'node') (add(s.x, s.y), add(s.x + s.w, s.y + s.h));
    else if (s.t === 'arrow') (add(s.x1, s.y1), add(s.x2, s.y2));
    else if (s.t === 'pen') s.pts.forEach(([x, y]) => add(x, y));
    else (add(s.x - s.s.length * 5.5, s.y - 14), add(s.x + s.s.length * 5.5, s.y + 14));
  }
  return `${x0 - 18} ${y0 - 18} ${x1 - x0 + 36} ${y1 - y0 + 36}`;
}

export function SketchThumb({ shapes }) {
  const labels = shapes.flatMap((s) => (s.t === 'text' ? [s.s] : []));
  return (
    <figure className="ntb-thumb">
      <svg viewBox={bbox(shapes)} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Sketch${labels.length ? ': ' + labels.join(', ') : ''}`}>
        {shapes.map((s, i) => (
          <ShapeEl key={i} s={s} />
        ))}
      </svg>
    </figure>
  );
}

const cell = (i, v, c) => [{ t: 'box', x: 60 + 100 * i, y: 160, w: 80, h: 70, c }, { t: 'text', x: 100 + 100 * i, y: 195, s: String(v), c: 'ink' }];
const node = (cx, cy, v, c) => [{ t: 'node', x: cx - 30, y: cy - 30, w: 60, h: 60, c }, { t: 'text', x: cx, y: cy, s: String(v), c: 'ink' }];
const TPL = {
  'Two pointers': [
    ...[1, 2, 4, 7, 11, 15].flatMap((v, i) => cell(i, v, i === 1 ? 'amber' : i === 4 ? 'cyan' : 'ink')),
    { t: 'text', x: 360, y: 100, s: '2 + 11 = 13 < 15  →  left++', c: 'ink' },
    { t: 'arrow', x1: 200, y1: 320, x2: 200, y2: 240, c: 'amber' }, { t: 'text', x: 200, y: 345, s: 'left', c: 'amber' },
    { t: 'arrow', x1: 500, y1: 320, x2: 500, y2: 240, c: 'cyan' }, { t: 'text', x: 500, y: 345, s: 'right', c: 'cyan' },
  ],
  Tree: [
    ...node(360, 70, 8, 'mag'), ...node(220, 190, 3, 'cyan'), ...node(500, 190, 10, 'cyan'),
    ...node(140, 310, 1, 'ink'), ...node(300, 310, 6, 'ink'), ...node(580, 310, 14, 'ink'),
    { t: 'arrow', x1: 340, y1: 95, x2: 245, y2: 167, c: 'ink' }, { t: 'arrow', x1: 380, y1: 95, x2: 475, y2: 167, c: 'ink' },
    { t: 'arrow', x1: 202, y1: 215, x2: 160, y2: 285, c: 'ink' }, { t: 'arrow', x1: 238, y1: 215, x2: 280, y2: 285, c: 'ink' },
    { t: 'arrow', x1: 518, y1: 215, x2: 560, y2: 285, c: 'ink' },
  ],
};
const TOOLS = [
  { id: 'box', label: 'Box', k: 'b', Icon: Square },
  { id: 'node', label: 'Node', k: 'o', Icon: Circle },
  { id: 'arrow', label: 'Arrow', k: 'a', Icon: ArrowUpRight },
  { id: 'text', label: 'Label', k: 't', Icon: Type },
  { id: 'pen', label: 'Pen', k: 'p', Icon: PenLine },
  { id: 'erase', label: 'Eraser', k: 'e', Icon: Eraser },
];

/** A modal sketch board; `onDone` gets the shapes (empty array = no sketch). */
export function SketchDialog({ initial, onDone, onClose }) {
  const dlg = useRef(null);
  const svg = useRef(null);
  const stage = useRef(null);
  const [shapes, setShapes] = useState(initial);
  const [draft, setDraft] = useState(null);
  const [tool, setTool] = useState('box');
  const [ink, setInk] = useState('cyan');
  const [label, setLabel] = useState(null);

  useEffect(() => {
    dlg.current?.showModal();
  }, []);

  const pt = (e) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current.getScreenCTM().inverse());
    return [p.x, p.y];
  };
  const down = (e) => {
    const [x, y] = pt(e);
    if (tool === 'erase') {
      const i = e.target.closest('[data-i]')?.getAttribute('data-i');
      if (i != null) setShapes((s) => s.filter((_, j) => j !== Number(i)));
      return;
    }
    if (tool === 'text') {
      e.preventDefault();
      const r = stage.current.getBoundingClientRect();
      setLabel({ x: Math.round(x), y: Math.round(y), left: e.clientX - r.left, top: e.clientY - r.top });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === 'pen') setDraft({ t: 'pen', pts: [[Math.round(x), Math.round(y)]], c: ink });
    else if (tool === 'arrow') setDraft({ t: 'arrow', x1: snap(x), y1: snap(y), x2: snap(x), y2: snap(y), c: ink });
    else setDraft({ t: tool, x: snap(x), y: snap(y), w: 0, h: 0, c: ink, ox: snap(x), oy: snap(y) });
  };
  const move = (e) => {
    if (!draft) return;
    const [x, y] = pt(e);
    if (draft.t === 'pen') setDraft({ ...draft, pts: [...draft.pts, [Math.round(x), Math.round(y)]] });
    else if (draft.t === 'arrow') setDraft({ ...draft, x2: snap(x), y2: snap(y) });
    else {
      const sx = snap(x), sy = snap(y);
      setDraft({ ...draft, x: Math.min(draft.ox, sx), y: Math.min(draft.oy, sy), w: Math.abs(sx - draft.ox), h: Math.abs(sy - draft.oy) });
    }
  };
  const up = () => {
    const d = draft;
    setDraft(null);
    if (!d) return;
    const ok = d.t === 'pen' ? d.pts.length > 2 : d.t === 'arrow' ? Math.hypot(d.x2 - d.x1, d.y2 - d.y1) >= 20 : d.w >= 20 && d.h >= 20;
    if (!ok) return;
    const { ox: _ox, oy: _oy, ...shape } = d;
    setShapes((s) => [...s, shape]);
  };
  const commitLabel = (text) => {
    if (label && text.trim()) setShapes((s) => [...s, { t: 'text', x: label.x, y: label.y, s: text.trim().slice(0, 80), c: ink }]);
    setLabel(null);
  };

  return (
    <dialog
      ref={dlg}
      className="ntb-dlg"
      aria-label="Sketch"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.target.tagName === 'INPUT') return;
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
          e.preventDefault();
          setShapes((s) => s.slice(0, -1));
          return;
        }
        const t = TOOLS.find((x) => x.k === e.key.toLowerCase());
        if (t && !e.metaKey && !e.ctrlKey) setTool(t.id);
      }}
    >
      <div className="ntb-dlg-head">
        <Workflow size={16} aria-hidden="true" className="ntb-dlg-ic" />
        <h3>Sketch</h3>
        <span className="ntb-faint">snaps to the grid</span>
        <span className="ntb-sp" />
        <button type="button" className="ntb-ib" aria-label="Undo" onClick={() => setShapes((s) => s.slice(0, -1))}>
          <Undo2 size={16} aria-hidden="true" />
        </button>
        <button type="button" className="ntb-ib" aria-label="Close sketch" onClick={() => dlg.current?.close()}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="ntb-dlg-body">
        <div className="ntb-tools" role="toolbar" aria-label="Sketch tools">
          {TOOLS.map(({ id, label: l, k, Icon }) => (
            <button key={id} type="button" className="ntb-tool" aria-pressed={tool === id} aria-label={`${l} (${k.toUpperCase()})`} title={`${l} · ${k.toUpperCase()}`} onClick={() => setTool(id)}>
              <Icon size={18} aria-hidden="true" />
              <span className="ntb-tool-k" aria-hidden="true">
                {k.toUpperCase()}
              </span>
            </button>
          ))}
          <span className="ntb-tools-sep" aria-hidden="true" />
          {INKS.map((c) => (
            <button key={c} type="button" className="ntb-ink" style={{ '--hc': col(c) }} aria-pressed={ink === c} aria-label={`${c} ink`} onClick={() => setInk(c)} />
          ))}
        </div>
        <div>
          <div ref={stage} className={`ntb-stage${tool === 'erase' ? ' is-erase' : ''}`}>
            <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} aria-label="Sketch board">
              {shapes.map((s, i) => (
                <ShapeEl key={i} s={s} i={i} />
              ))}
              {draft && <ShapeEl s={draft} />}
            </svg>
            {label && (
              <input
                className="ntb-label-in"
                style={{ left: label.left, top: label.top }}
                placeholder="Label"
                maxLength={80}
                autoFocus
                onKeyDown={(e) => {
                  e.stopPropagation();
                  // blur is the one place a label commits, so Enter can't add it twice
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    e.currentTarget.value = '';
                    e.currentTarget.blur();
                  }
                }}
                onBlur={(e) => commitLabel(e.currentTarget.value)}
              />
            )}
          </div>
          <div className="ntb-dlg-foot">
            <span className="eyebrow">Start from</span>
            {Object.keys(TPL).map((k) => (
              <button key={k} type="button" className="btn btn--ghost btn--sm" onClick={() => setShapes(structuredClone(TPL[k]))}>
                {k}
              </button>
            ))}
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShapes([])}>
              Blank
            </button>
            <span className="ntb-sp" />
            <button
              type="button"
              className="btn btn--plasma btn--sm"
              onClick={() => {
                onDone(shapes);
                dlg.current?.close();
              }}
            >
              Add to note
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
