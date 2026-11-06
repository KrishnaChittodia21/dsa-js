// The "Steps" view of a lesson section (M2): Watch steps play hand-written frames drawn with the Visualizer's own
// panels (array, stack, nodes, table…), and Your-turn steps ask one small task about the picture. Format and rules:
// content/stepSchema.js. Every task is plain buttons, so it works by keyboard, screen reader and on a phone.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Check } from 'lucide-react';
import { Panel } from '../../visualizations/panels.jsx';
import { useFitZoom } from '../../visualizations/useFitZoom.js';

const FRAME_MS = 2200;
const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** plain text with **bold** and `code` */
function rich(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** a fixed shuffle that never returns the right order (so "order" always has something to do) */
function shuffled(items) {
  const out = items.map((t, i) => ({ t, k: (i * 7 + 3) % (items.length + 2) })).sort((a, b) => a.k - b.k).map((x) => x.t);
  return out.every((t, i) => t === items[i]) ? [...out.slice(1), out[0]] : out;
}

/** choose options in a fixed rotation picked from the question text, so the right one is not always first or last
 *  wherever the author put it (stable across renders; `answer` stays the index as written) */
function rotated(list, seed) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const k = h % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
}

function Stage({ panels, note }) {
  const [stageRef, zoom] = useFitZoom(panels);
  return (
    <div className="viz st-viz">
      <div className="viz-stage st-stage" ref={stageRef} style={zoom < 1 ? { zoom } : undefined}>
        {panels.map((p, i) => (
          <Panel key={i} panel={p} />
        ))}
      </div>
      {note && (
        <p className="st-note" aria-live="polite">
          {rich(note)}
        </p>
      )}
    </div>
  );
}

/** plays frames (looping) with prev / play-pause / next; reduced motion starts paused */
function Player({ frames, onSay, frameMs = FRAME_MS }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(() => !reducedMotion() && frames.length > 1);
  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => setI((x) => (x + 1) % frames.length), i === frames.length - 1 ? frameMs * 1.6 : frameMs);
    return () => clearTimeout(t);
  }, [playing, i, frames.length, frameMs]);
  const f = frames[Math.min(i, frames.length - 1)];
  useEffect(() => onSay?.(f.say), [f, onSay]);
  return (
    <>
      <Stage panels={f.panels} note={f.note} />
      {frames.length > 1 && (
        <div className="st-ctrl">
          <button type="button" className="btn btn--ghost btn--sm" aria-label="Previous frame" onClick={() => { setPlaying(false); setI((x) => (x - 1 + frames.length) % frames.length); }}>
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button type="button" className="btn btn--ghost btn--sm" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
          </button>
          <button type="button" className="btn btn--ghost btn--sm" aria-label="Next frame" onClick={() => { setPlaying(false); setI((x) => (x + 1) % frames.length); }}>
            <ChevronRight size={15} aria-hidden="true" />
          </button>
          <span className="st-count mono">
            {i + 1} / {frames.length}
          </span>
        </div>
      )}
    </>
  );
}

function Task({ task, panels, onSolved }) {
  const [msg, setMsg] = useState(null);
  const [picked, setPicked] = useState([]);
  const missed = useRef(false); // any wrong answer before the right one (Shorts record first-try answers)
  const solve = () => onSolved(!missed.current);
  const pool = useMemo(() => (task.type === 'order' ? shuffled(task.items) : []), [task]);
  const wrong = (text) => {
    missed.current = true;
    setMsg({ ok: false, text });
  };

  if (task.type === 'choose')
    return (
      <TaskBox q={task.question} msg={msg}>
        {rotated(task.options.map((o, i) => [o, i]), task.question).map(([o, i]) => (
          <button key={i} type="button" className="st-opt" onClick={() => (i === task.answer ? solve() : wrong(o.why))}>
            {/* one span, so text and `code` stay one wrapping line inside the flex button */}
            <span>{rich(o.text)}</span>
          </button>
        ))}
      </TaskBox>
    );
  if (task.type === 'number')
    return (
      <TaskBox q={task.question} msg={msg}>
        {task.options.map((n) => (
          <button key={n} type="button" className="st-opt st-opt--n mono" onClick={() => (n === task.answer ? solve() : wrong(task.hint))}>
            {n}
          </button>
        ))}
      </TaskBox>
    );
  if (task.type === 'cell') {
    const { values, indexBase = 0 } = panels[task.panel || 0];
    return (
      <TaskBox q={task.question} msg={msg}>
        {values.map((v, i) => (
          <button key={i} type="button" className="st-opt st-opt--n mono" aria-label={`index ${i + indexBase}, value ${v}`} onClick={() => (i === task.answer ? solve() : wrong(task.hints?.[i] || 'Not that one. Look at the picture again.'))}>
            <small>[{i + indexBase}]</small> {String(v)}
          </button>
        ))}
      </TaskBox>
    );
  }
  // order: tap the items in the right sequence; a wrong tap explains and keeps what was right so far
  const tap = (t) => {
    if (t !== task.items[picked.length]) return wrong(task.hint);
    const next = [...picked, t];
    setPicked(next);
    setMsg(null);
    if (next.length === task.items.length) solve();
  };
  return (
    <TaskBox q={task.question} msg={msg}>
      {pool.map((t) => {
        const at = picked.indexOf(t);
        return (
          <button key={t} type="button" className={`st-opt ${at >= 0 ? 'st-opt--done' : ''}`} disabled={at >= 0} onClick={() => tap(t)}>
            {at >= 0 && <span className="st-ord mono">{at + 1}</span>}
            <span>{rich(t)}</span>
          </button>
        );
      })}
    </TaskBox>
  );
}

function TaskBox({ q, msg, children }) {
  return (
    <div className="st-task">
      <p className="st-q">{rich(q)}</p>
      <div className="st-opts">{children}</div>
      {msg && (
        <p className="st-msg st-msg--no" role="status">
          {rich(msg.text)}
        </p>
      )}
    </div>
  );
}

/** `frameMs`: reading speed (ms per frame); `onSolve(stepIndex, firstTry)`: a task was answered (Shorts record it) */
export default function StepLesson({ steps, frameMs, onSolve }) {
  const [at, setAt] = useState(0);
  const [say, setSay] = useState(undefined);
  const [solved, setSolved] = useState({});
  const s = steps[at];
  const isSolved = !!solved[at];
  const go = (n) => {
    setAt(n);
    setSay(undefined);
  };

  return (
    <section className="st" aria-label="Step lesson">
      <ol className="st-tabs">
        {steps.map((x, i) => (
          <li key={i}>
            <button type="button" aria-current={i === at ? 'step' : undefined} className={`st-tab ${i === at ? 'on' : ''} ${solved[i] ? 'solved' : ''}`} onClick={() => go(i)}>
              <span className="mono">{i + 1}</span>
              {x.kind === 'turn' ? 'Your turn' : 'Watch'}
              {solved[i] && <Check size={12} aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ol>

      <div className="st-body">
        <div className="st-text">
          <h4 className="st-title">{rich(s.title)}</h4>
          <ol className="st-lines">
            {s.lines.map((l, i) => (
              <li key={i} className={say === undefined ? '' : i === say ? 'on' : i < say ? 'done' : ''}>
                {rich(l)}
              </li>
            ))}
          </ol>
          {s.kind === 'turn' &&
            (isSolved ? (
              <p className="st-msg st-msg--ok" role="status">
                <Check size={14} aria-hidden="true" /> {rich(s.solved)}
              </p>
            ) : (
              <Task key={at} task={s.task} panels={s.panels} onSolved={(firstTry) => {
                setSolved((m) => ({ ...m, [at]: true }));
                onSolve?.(at, firstTry);
              }} />
            ))}
        </div>
        <div className="st-pic">
          {s.kind === 'watch' ? (
            <Player key={at} frames={s.frames} onSay={setSay} frameMs={frameMs} />
          ) : isSolved && s.then ? (
            <Player key={`${at}-then`} frames={s.then} onSay={setSay} frameMs={frameMs} />
          ) : (
            <Stage panels={s.panels} />
          )}
        </div>
      </div>

      <div className="st-foot">
        <button type="button" className="btn btn--ghost btn--sm" disabled={at === 0} onClick={() => go(at - 1)}>
          <ChevronLeft size={15} aria-hidden="true" /> Back
        </button>
        <span className="st-count mono">
          step {at + 1} of {steps.length}
        </span>
        <button type="button" className="btn btn--ghost btn--sm" disabled={at === steps.length - 1} onClick={() => go(at + 1)}>
          Next <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
