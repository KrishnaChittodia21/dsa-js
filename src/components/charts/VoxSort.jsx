import { useId, useMemo } from 'react';
import { Link } from 'react-router-dom';

/**
 * mastery[] as voxel columns that bubble-sort themselves weakest → strongest (Dashboard hero).
 * The keyframes are generated from the real data: every swap the bubble sort performs is one
 * step of the animation, and the comparison window (j, j+1) slides with it. Under reduced motion
 * the columns sit in their final, sorted order (each column's static transform is its sorted slot).
 *
 * cols: { id, title, label, mini? (phone label), value (0–100), solved, total, current, href }[]   (course order)
 */
const T0 = 1.2;
const STEP = 0.5;
const MOVE = 0.36;
const HOLD = 4.2;
const FADE = 0.7;

export const cubesFor = (value) => Math.max(1, Math.round(value / 10));
export const toneFor = (c) => (c.current ? 'cur' : c.value >= 75 ? 'hot' : c.value >= 35 ? 'warm' : 'cold');

/** bubble sort by cube height, ascending; returns the final order and every swap performed */
export function bubbleSwaps(heights) {
  const order = heights.map((_, i) => i);
  const swaps = [];
  for (let i = 0; i < order.length; i++)
    for (let k = 0; k < order.length - 1 - i; k++) {
      const a = order[k];
      const b = order[k + 1];
      if (heights[a] > heights[b]) {
        order[k] = b;
        order[k + 1] = a;
        swaps.push([k, a, b]);
      }
    }
  return { order, swaps };
}

function keyframes(prefix, n, swaps) {
  const tLast = T0 + (swaps.length - 1) * STEP + MOVE;
  const total = tLast + HOLD + FADE + 0.4;
  const pct = (t) => `${((t / total) * 100).toFixed(3)}%`;
  const css = [];
  for (let c = 0; c < n; c++) {
    const keys = [[0, c, 0]];
    let pos = c;
    swaps.forEach(([, right, left], s) => {
      const t = T0 + s * STEP;
      if (c === right) {
        keys.push([t, pos, 0], [t + MOVE * 0.5, pos + 0.5, -30], [t + MOVE, pos + 1, 0]);
        pos += 1;
      } else if (c === left) {
        keys.push([t, pos, 0], [t + MOVE * 0.5, pos - 0.5, 6], [t + MOVE, pos - 1, 0]);
        pos -= 1;
      }
    });
    keys.push([tLast + HOLD, pos, 0], [tLast + HOLD + FADE, pos, 0], [tLast + HOLD + FADE + 0.01, c, 0], [total, c, 0]);
    css.push(`@keyframes ${prefix}-c${c}{${keys.map(([t, p, lift]) => `${pct(t)}{transform:translate(calc(${p} * 100%),${lift}px)}`).join('')}}`);
  }
  const first = swaps[0][0];
  const bk = [`0%{transform:translateX(${first * 50}%);opacity:0}`, `${pct(T0 - 0.3)}{transform:translateX(${first * 50}%);opacity:1}`];
  swaps.forEach(([k], s) => {
    const t = T0 + s * STEP;
    bk.push(`${pct(t - 0.08)}{transform:translateX(${k * 50}%);opacity:1}`, `${pct(t + MOVE)}{transform:translateX(${k * 50}%);opacity:1}`);
  });
  bk.push(`${pct(tLast + 0.4)}{transform:translateX(${swaps[swaps.length - 1][0] * 50}%);opacity:0}`, `100%{transform:translateX(${first * 50}%);opacity:0}`);
  css.push(`@keyframes ${prefix}-bracket{${bk.join('')}}`);
  css.push(`@keyframes ${prefix}-fade{0%{opacity:0}${pct(0.5)}{opacity:1}${pct(tLast + HOLD)}{opacity:1}${pct(tLast + HOLD + FADE)}{opacity:0}100%{opacity:0}}`);
  css.push(
    `@keyframes ${prefix}-done{0%,${pct(tLast + 0.1)}{opacity:0;transform:translateY(6px)}${pct(tLast + 0.6)},${pct(tLast + HOLD)}{opacity:1;transform:none}${pct(tLast + HOLD + FADE)},100%{opacity:0}}`,
  );
  css.push(`@keyframes ${prefix}-busy{0%,${pct(tLast + 0.1)}{opacity:1}${pct(tLast + 0.5)},${pct(tLast + HOLD + FADE)}{opacity:0}100%{opacity:1}}`);
  return { css: css.join(''), total };
}

export default function VoxSort({ cols }) {
  const rawId = useId();
  const prefix = `vs${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const n = cols.length;
  const model = useMemo(() => {
    const heights = cols.map((c) => cubesFor(c.value));
    const { order, swaps } = bubbleSwaps(heights);
    const finalPos = {};
    order.forEach((c, p) => (finalPos[c] = p));
    const anim = swaps.length ? keyframes(prefix, cols.length, swaps) : null;
    return { heights, order, swaps, finalPos, anim };
  }, [cols, prefix]);

  const { heights, order, swaps, finalPos, anim } = model;
  const weakest = cols[order[0]];
  const strongest = cols[order[n - 1]];

  return (
    <div
      className={`vs ${anim ? 'vs--anim' : 'vs--static'}`}
      style={{ '--n': n, '--dur': anim ? `${anim.total.toFixed(2)}s` : undefined }}
      role="group"
      aria-label={`Your mastery per topic as voxel columns, bubble-sorting themselves weakest to strongest. Weakest: ${weakest.label} ${weakest.value}%; strongest: ${strongest.label} ${strongest.value}%.`}
    >
      {anim && <style>{anim.css}</style>}
      <div className="vs-track" style={anim ? { animationName: `${prefix}-fade` } : undefined}>
        {anim && (
          <div className="vs-bracket" style={{ animationName: `${prefix}-bracket` }} aria-hidden="true">
            <span>j</span>
            <span>j+1</span>
          </div>
        )}
        {cols.map((c, i) => (
          <Link
            key={c.id}
            to={c.href}
            className={`vs-col vs-${toneFor(c)}`}
            style={{ '--kf': finalPos[i], animationName: anim ? `${prefix}-c${i}` : 'none' }}
            aria-label={`${c.title}: mastery ${c.value}%, ${c.solved} of ${c.total} questions solved${c.current ? ', current topic' : ''}`}
            title={`${c.title} · mastery ${c.value}% · ${c.solved}/${c.total} solved`}
          >
            <span className="vs-stack">
              <span className="vox" style={{ '--h': heights[i] }} />
              <span className="vs-val">{c.value}%</span>
            </span>
            <span className="vs-lab">
              <b className="vs-lab-l">{c.label}</b>
              <b className="vs-lab-s" aria-hidden="true">
                {c.mini || c.label}
              </b>
            </span>
          </Link>
        ))}
      </div>
      <div className="vs-floor" aria-hidden="true" />
      <div className="vs-idx" style={anim ? { animationName: `${prefix}-fade` } : undefined} aria-hidden="true">
        {cols.map((c, i) => (
          <span key={c.id}>[{i}]</span>
        ))}
      </div>
      <div className="vs-cap" aria-hidden="true">
        {anim && (
          <span className="vs-busy" style={{ animationName: `${prefix}-busy` }}>
            <i className="pip pip--uv" />
            bubbleSort(mastery, asc) · {swaps.length} swap{swaps.length === 1 ? '' : 's'}
          </span>
        )}
        <span className="vs-done" style={anim ? { animationName: `${prefix}-done` } : undefined}>
          <i className="pip pip--acid" />
          sorted — revise <b>{weakest.label}</b> first
        </span>
      </div>
    </div>
  );
}
