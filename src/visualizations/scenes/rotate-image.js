// Rotate Image. A square photo made of tiles turned a quarter turn clockwise in place: flip it over the main
// diagonal (top-left to bottom-right), then mirror every row. Also narrates the layer-by-layer four-way rotation.
import { options, row } from './util.js';

// the square grid: the parameter, else the first array of equal-length rows in scope
function gridOf(vars, name) {
  const ok = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length === v.length);
  if (ok(vars[name])) return [name, vars[name]];
  return Object.entries(vars).find(([, v]) => ok(v)) || [];
}
// cells [r, c] that differ between two same-shape grids
function diff(a, b) {
  if (!b || b.length !== a.length || !b.every((r, i) => row(r) && r.length === a[i].length)) return null;
  const out = [];
  a.forEach((r, i) => r.forEach((x, j) => x !== b[i][j] && out.push([i, j])));
  return out;
}
const same = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
const mirrored = (now, was) => now.length > 1 && same(now, [...was].reverse()) && !same(now, was);

export default {
  id: 'rotate-image',
  metaphor: 'Turning a tiled photo a quarter turn',
  caption: 'First flip the photo over its diagonal (top-left to bottom-right): tile (r, c) trades with (c, r). Then mirror every row left to right. The two flips together turn it 90° clockwise.',
  narrate(ctx) {
    const [name, a] = gridOf(ctx.vars, ctx.params[0]);
    if (!a) return null;
    const b = ctx.prev[name];
    const d = diff(a, b);
    if (!d || !d.length) return null;
    const n = a.length;
    const rows = [...new Set(d.map(([r]) => r))];
    if (rows.length === 1 && mirrored(a[rows[0]], b[rows[0]])) {
      const r = rows[0];
      return `row ${r} is mirrored: [${b[r].join(', ')}] → [${a[r].join(', ')}]`;
    }
    if (d.length === 2) {
      const [[r1, c1], [r2, c2]] = d;
      if (r1 === c2 && c1 === r2 && a[r1][c1] === b[r2][c2] && a[r2][c2] === b[r1][c1]) return `tiles ${b[r1][c1]} at (${r1}, ${c1}) and ${b[r2][c2]} at (${r2}, ${c2}) trade places across the diagonal`;
    }
    if (d.length !== 1) return null;
    const [r, c] = d[0];
    const v = a[r][c];
    const both = c === n - 1 - c; // middle column: the diagonal partner is also the quarter-turn source
    if (b[n - 1 - c][r] === v && !both) return `tile ${v} moves a quarter turn: from (${n - 1 - c}, ${r}) to (${r}, ${c})`;
    if (r === c) return null;
    // second half of a temp swap: the partner was just overwritten with this cell's value, the saved one comes back
    if (b[c][r] === b[r][c] && a[c][r] === b[r][c]) return `the saved tile ${v} goes into (${r}, ${c}): (${c}, ${r}) and (${r}, ${c}) have traded across the diagonal`;
    if (b[c][r] === v && !both) return `tile ${v} is copied from (${c}, ${r}) to its mirror spot (${r}, ${c}) across the diagonal (the old ${b[r][c]} is saved)`;
    if (b[c][r] === v) return `tile ${v} moves from (${c}, ${r}) to (${r}, ${c})`;
    return null;
  },
  // before a tile moves: which value lands there? before a row is mirrored: what does it read?
  predict(ctx) {
    if (!ctx.next) return null;
    const [name, a] = gridOf(ctx.vars, ctx.params[0]);
    if (!a || a.length < 2) return null;
    const after = ctx.next.vars[name];
    const d = diff(after || [], a);
    const was = diff(a, ctx.prev[name]);
    if (!d || !d.length) return null;
    const n = a.length;
    const rows = [...new Set(d.map(([r]) => r))];
    if (rows.length === 1 && mirrored(after[rows[0]], a[rows[0]])) {
      const r = rows[0];
      if (r !== 0) return null;
      const show = (x) => `[${x.join(', ')}]`;
      const col = a.map((x) => x[r]);
      return options(`The diagonal flip is done and row ${r} reads ${show(a[r])}. What does row ${r} read next?`, show(after[r]), [show(a[r]), show(col), show([...col].reverse())], 'Mirroring a row reverses it left to right; after the diagonal flip that is exactly the quarter turn.');
    }
    if (d.length > 2 || (was && was.length)) return null; // mid-swap: the partner tile was just written
    const [r, c] = d[0];
    if (Math.max(r, c) > 2 || Math.min(r, c) > 0) return null; // only the first couple of tiles in the top row
    const v = after[r][c];
    const wrong = [a[r][c], a[n - 1 - r][c], a[r][n - 1 - c], a[n - 1 - c][r], a[c][r]].filter((x) => x !== v);
    const diag = a[c][r] === v && c !== n - 1 - c;
    return options(`Tile (${r}, ${c}) shows ${a[r][c]}. Which tile moves into this spot?`, v, wrong.slice(0, 3), diag ? `The diagonal flip swaps (${r}, ${c}) with (${c}, ${r}), so it takes ${v}.` : `In a quarter turn, (${r}, ${c}) is filled from (${n - 1 - c}, ${r}), which holds ${v}.`);
  },
  bugs: [
    {
      label: 'Transpose with j from 0',
      find: 'let j = i + 1',
      replace: 'let j = 0',
      explain: 'Every pair is swapped twice (once from each side), so the diagonal flip undoes itself and only the row mirror remains.',
    },
    {
      label: 'Reverse the order of rows instead of each row',
      find: 'for (const row of matrix) row.reverse();',
      replace: 'matrix.reverse();',
      explain: 'Flipping the photo upside down after the diagonal flip turns it a quarter turn counter-clockwise, not clockwise.',
    },
  ],
};
