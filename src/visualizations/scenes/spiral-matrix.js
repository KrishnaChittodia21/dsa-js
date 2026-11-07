// Spiral Matrix: a walker goes round the edge of the unvisited rectangle, clockwise, and fences move inward after
// each side. The true spiral is recomputed from the matrix, so any correct walk (boundaries or direction vectors)
// gets its cell, side and corner turns named; boundary notes need top/bottom/left/right-like names.
import { options, row } from './util.js';

const QUADS = [
  ['top', 'bottom', 'left', 'right'],
  ['rowStart', 'rowEnd', 'colStart', 'colEnd'],
  ['startRow', 'endRow', 'startCol', 'endCol'],
  ['r1', 'r2', 'c1', 'c2'],
  ['t', 'b', 'l', 'r'],
];
const SIDE = { '0,1': 'right along the top edge', '1,0': 'down the right edge', '0,-1': 'left along the bottom edge', '-1,0': 'up the left edge' };

const grid = (m) => (Array.isArray(m) && m.length && m.every((r) => row(r) && r.length === m[0].length && r.length) ? m : null);

// the matrix: under the parameter name, else the first grid in vars (parameters are recorded first)
function matrixOf(ctx) {
  const name = ctx.params[0];
  if (grid(ctx.vars[name])) return [name, ctx.vars[name]];
  const e = Object.entries(ctx.vars).find(([, v]) => grid(v));
  return e || [];
}

/** [r, c] cells in spiral order */
function spiral(m) {
  const out = [];
  let t = 0;
  let b = m.length - 1;
  let l = 0;
  let r = m[0].length - 1;
  while (t <= b && l <= r) {
    for (let c = l; c <= r; c++) out.push([t, c]);
    t++;
    for (let i = t; i <= b; i++) out.push([i, r]);
    r--;
    if (t <= b) {
      for (let c = r; c >= l; c--) out.push([b, c]);
      b--;
    }
    if (l <= r) {
      for (let i = b; i >= t; i--) out.push([i, l]);
      l++;
    }
  }
  return out;
}
const dir = (cells, k) => (k === 0 ? '0,1' : `${cells[k][0] - cells[k - 1][0]},${cells[k][1] - cells[k - 1][1]}`);

/** [name, array] of a flat array (not the matrix) that grew by exactly one item at the end */
function grown(vars, prev, skip) {
  for (const [k, v] of Object.entries(vars)) {
    const b = k !== skip && row(v) && row(prev[k]);
    if (b && v.length === b.length + 1 && b.every((x, i) => x === v[i])) return [k, v];
  }
  return null;
}

export default {
  id: 'spiral-matrix',
  metaphor: 'Mowing a lawn from the edge inward',
  caption: 'The walker mows round the edge of the unmown rectangle, clockwise. After each side that row or column is done and its fence moves one step in; the walk ends when the fences cross.',
  compare: 'out',
  narrate(ctx) {
    const [mName, m] = matrixOf(ctx);
    if (!m) return null;
    const cells = spiral(m);
    const total = cells.length;
    const g = grown(ctx.vars, ctx.prev, mName);
    if (g) {
      const out = g[1];
      const k = out.length - 1;
      if (k >= total) return `${out[k]} is added again, but all ${total} cells were already visited: a side was walked twice`;
      const [r, c] = cells[k];
      if (m[r][c] !== out[k]) return `${out[k]} is added, but the spiral's next cell is ${m[r][c]} (row ${r}, col ${c})`;
      const done = k + 1 === total ? ' — every cell visited' : '';
      if (k === 0) return `start at the top-left corner: ${out[k]} · 1 of ${total} visited${done}`;
      const d = dir(cells, k);
      const turn = d !== dir(cells, k - 1) ? 'turn: ' : '';
      return `${turn}walk ${SIDE[d]}: ${out[k]} (row ${r}, col ${c}) · ${k + 1} of ${total} visited${done}`;
    }
    const q = QUADS.find((names) => names.every((n) => Number.isInteger(ctx.vars[n]) && Number.isInteger(ctx.prev[n])));
    if (!q) return null;
    const moved = q.findIndex((n) => ctx.vars[n] !== ctx.prev[n]);
    if (moved < 0) return null;
    const [t, b, l, r] = q.map((n) => ctx.vars[n]);
    const rows = Math.max(0, b - t + 1);
    const cols = Math.max(0, r - l + 1);
    const left = rows && cols ? `${rows} × ${cols} cells still unmown` : 'the fences crossed: nothing is left inside';
    const what = [
      `the top row is done: the top fence moves down to row ${t}`,
      `the bottom row is done: the bottom fence moves up to row ${b}`,
      `the left column is done: the left fence moves right to column ${l}`,
      `the right column is done: the right fence moves left to column ${r}`,
    ][moved];
    return `${what} · ${left}`;
  },
  // at a corner: which value does the walk take after turning?
  predict(ctx) {
    if (!ctx.next) return null;
    const [mName, m] = matrixOf(ctx);
    if (!m) return null;
    const g = grown(ctx.next.vars, ctx.vars, mName);
    if (!g) return null;
    const cells = spiral(m);
    const out = g[1];
    const k = out.length - 1;
    if (k < 2 || k >= cells.length) return null;
    const [r, c] = cells[k];
    const d = dir(cells, k);
    const was = dir(cells, k - 1);
    if (m[r][c] !== out[k] || d === was) return null;
    const [pr, pc] = cells[k - 1];
    const [dr, dc] = was.split(',').map(Number);
    const wrong = [m[pr + dr]?.[pc + dc], m[pr - dc]?.[pc + dr], m[pr - dr]?.[pc - dc], cells[k + 1] && m[cells[k + 1][0]][cells[k + 1][1]]].filter((x) => x !== undefined && x !== out[k]);
    return options(
      `The walker is at ${m[pr][pc]} (row ${pr}, col ${pc}) after going ${SIDE[was]}. Which value comes next?`,
      out[k],
      wrong,
      `That side is done (the edge or a fence blocks the way), so the walk turns to go ${SIDE[d]}: ${out[k]} at row ${r}, col ${c}.`,
    );
  },
  bugs: [
    {
      label: 'No re-check before the bottom row',
      find: 'if (top <= bottom) {',
      replace: 'if (true) {',
      explain: 'With a single row left, the top row was already walked, and walking "the bottom row" goes back over the same cells, so values appear twice.',
    },
    {
      label: 'No re-check before the left column',
      find: 'if (left <= right) {',
      replace: 'if (true) {',
      explain: 'With a single column left, the right column was already walked down, and walking "the left column" up repeats it.',
    },
  ],
};
