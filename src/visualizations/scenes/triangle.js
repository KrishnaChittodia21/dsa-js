// Triangle: best(i, j) = triangle[i][j] + the cheaper of the two numbers below it. Works bottom-up with a rolling
// row (`dp[j] = t[i][j] + min(dp[j], dp[j + 1])`), bottom-up or top-down on a 2-D table (also in place on the
// triangle), and top-down with a rolling row (parents j − 1 and j).
import { firstInt, options, row } from './util.js';

const ROW = ['i', 'r', 'row', 'level', 'y', 'lvl'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const WRITE2 = /(\w+)\[(\w+)\]\[(\w+)\]\s*(?:\+|-)?=(?!=)/;
const WRITE1 = /(\w+)\[(\w+)\]\s*(?:\+|-)?=(?!=)/;
const idx = (vars, t) => (/^\d+$/.test(t) ? Number(t) : Number.isInteger(vars[t]) ? vars[t] : undefined);
const num = (x) => (typeof x === 'number' ? x : Infinity);

/**
 * the cell the statement on `src` wrote and the two cells it chose from:
 * { i, j, v, t (the triangle's number), a, b, down (true = bottom-up: a, b are below; false: parents above) }
 */
function written(vars, prev, src, params, T) {
  if (!isGrid(T)) return null;
  const m2 = WRITE2.exec(src || '');
  let i;
  let j;
  let v;
  let opts;
  if (m2) {
    const g = vars[m2[1]];
    [i, j] = [idx(vars, m2[2]), idx(vars, m2[3])];
    if (!isGrid(g) || !g[i] || !T[i] || !(j >= 0 && j < T[i].length)) return null;
    v = g[i][j];
    opts = [
      [true, num(g[i + 1]?.[j]), num(g[i + 1]?.[j + 1])],
      [false, num(g[i - 1]?.[j - 1]), num(g[i - 1]?.[j])],
    ];
  } else {
    const m1 = WRITE1.exec(src || '');
    if (!m1 || params.includes(m1[1])) return null;
    const d = row(vars[m1[1]]);
    const before = row(prev[m1[1]]);
    j = idx(vars, m1[2]);
    [, i] = firstInt(vars, ROW.filter((k) => !params.includes(k)));
    if (!d || !before || !T[i] || !(j >= 0 && j < T[i].length)) return null;
    v = d[j];
    opts = [
      [true, num(before[j]), num(before[j + 1])],
      [false, j > 0 ? num(before[j - 1]) : Infinity, j < i ? num(before[j]) : Infinity],
    ];
  }
  const t = T[i][j];
  if (typeof v !== 'number' || typeof t !== 'number') return null;
  // the last row has no row below: only top-down fits there
  const hit = opts.find(([down, a, b]) => !(down && i === T.length - 1) && Math.min(a, b) !== Infinity && t + Math.min(a, b) === v);
  return hit ? { i, j, v, t, down: hit[0], a: hit[1], b: hit[2] } : null;
}

const both = (a, b) => [a, b].filter((x) => x !== Infinity).join(', ');

export default {
  id: 'triangle',
  metaphor: 'Climbing down a pyramid of tolls',
  caption: 'Each number is a toll; a step goes to one of the two numbers just below. Filling from the bottom up, a cell holds the cheapest total from there to the bottom: its toll plus the cheaper of the two cells below.',
  pointers: ['j', 'c', 'col', 'k'],
  narrate(ctx) {
    const T = ctx.input?.[0];
    if (ctx.ret && !ctx.next && typeof ctx.value === 'number') return `the cheapest way from the top to the bottom costs ${ctx.value}`;
    if (!isGrid(T)) return null;
    const fresh = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && !(k in ctx.prev) && row(ctx.vars[k]));
    if (fresh && JSON.stringify(ctx.vars[fresh]) === JSON.stringify(T[T.length - 1])) return `start at the bottom row: from there a path costs just its own toll (${T[T.length - 1].join(', ')})`;
    const w = written(ctx.vars, ctx.prev, ctx.src, ctx.params, T);
    if (!w) return null;
    if (w.down) return `toll ${w.t} (row ${w.i}): + the cheaper way down, min(${both(w.a, w.b)}) = ${Math.min(w.a, w.b)} → ${w.v}`;
    if (w.a === Infinity || w.b === Infinity) return `toll ${w.t} (row ${w.i}) on the edge: only one way in from above (${both(w.a, w.b)}) → ${w.v}`;
    return `toll ${w.t} (row ${w.i}): + the cheaper path from above, min(${both(w.a, w.b)}) = ${Math.min(w.a, w.b)} → ${w.v}`;
  },
  // before the first cell of each row with a real choice (two cells to pick from) is filled: what is its best total?
  predict(ctx) {
    if (!ctx.next) return null;
    const w = written(ctx.next.vars, ctx.vars, ctx.lines[ctx.next.line - 1], ctx.params, ctx.input?.[0]);
    if (!w || w.j !== (w.down ? 0 : 1) || w.a === w.b || w.a === Infinity || w.b === Infinity) return null;
    const [lo, hi] = [Math.min(w.a, w.b), Math.max(w.a, w.b)];
    const where = w.down ? 'down to the bottom' : 'from the top';
    return options(
      `Toll ${w.t} in row ${w.i}: what is the cheapest total ${where} through it?`,
      w.v,
      [w.t + hi, lo, w.t + lo + hi, hi, w.v + 1].filter((x) => x !== w.v),
      `The two choices ${w.down ? 'below' : 'above'} cost ${w.a} and ${w.b}; take the cheaper ${lo} and add the toll ${w.t}: ${w.v}.`,
    );
  },
  bugs: [
    {
      label: 'Look at the wrong two cells below',
      find: 'Math.min(dp[j], dp[j + 1])',
      replace: 'Math.min(dp[j - 1], dp[j])',
      explain: 'From (i, j) a step goes to (i + 1, j) or (i + 1, j + 1). Reading j − 1 instead picks an unreachable cell, and at j = 0 there is nothing there at all (NaN).',
    },
    {
      label: 'Start one row too low',
      find: 'let i = n - 2',
      replace: 'let i = n - 1',
      explain: 'The bottom row has no row below it; processing it reads past the end of dp (undefined → NaN) and adds its tolls twice.',
    },
  ],
};
