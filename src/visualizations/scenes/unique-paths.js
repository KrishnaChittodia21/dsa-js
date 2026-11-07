// Unique Paths: paths(r, c) = paths from above + paths from the left, since the robot only moves right or down.
// Works with a rolling row (`dp[c] += dp[c - 1]`), a full 2-D table, or a memo Map keyed "r,c" (recursion).
import { entriesOf, firstInt, options, row } from './util.js';

const ROW = ['r', 'i', 'row', 'y'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const WRITE2 = /(\w+)\[(\w+)\]\[(\w+)\]\s*(?:\+|-)?=(?!=)/;
const WRITE1 = /(\w+)\[(\w+)\]\s*(?:\+|-)?=(?!=)/;
const idx = (vars, t) => (/^\d+$/.test(t) ? Number(t) : Number.isInteger(vars[t]) ? vars[t] : undefined);

/** the cell the statement on `src` wrote: { r, c, v, above, left } (r undefined when a rolling row hides it) */
function written(vars, prev, src, params) {
  const m2 = WRITE2.exec(src || '');
  if (m2 && !params.includes(m2[1])) {
    const g = vars[m2[1]];
    const [r, c] = [idx(vars, m2[2]), idx(vars, m2[3])];
    if (!isGrid(g) || !g[r] || !(c >= 0 && c < g[r].length) || typeof g[r][c] !== 'number') return null;
    return { r, c, v: g[r][c], above: r > 0 ? g[r - 1][c] : 0, left: c > 0 ? g[r][c - 1] : 0, cols: g[0].length };
  }
  const m1 = !m2 && WRITE1.exec(src || '');
  if (!m1 || params.includes(m1[1])) return null;
  const d = row(vars[m1[1]]);
  const before = row(prev[m1[1]]);
  const c = idx(vars, m1[2]);
  if (!d || !before || before.length !== d.length || !(c >= 0 && c < d.length) || typeof d[c] !== 'number') return null;
  const [, r] = firstInt(vars, ROW.filter((k) => !params.includes(k)));
  return { r, c, v: d[c], above: before[c], left: c > 0 ? d[c - 1] : 0, cols: d.length };
}

const at = (r, c) => (Number.isInteger(r) ? `square (${r}, ${c})` : `column ${c}`);
const memoOf = (vars, params) => Object.keys(vars).filter((k) => !params.includes(k)).map((k) => entriesOf(vars[k])).find(Boolean);

export default {
  id: 'unique-paths',
  metaphor: 'A robot counting routes across a grid',
  caption: 'Each number is how many right/down routes reach that square. A square is entered from above or from the left, so its count is the sum of those two; the top row and left column have exactly one route.',
  pointers: ['c', 'j', 'col', 'x'],
  narrate(ctx) {
    const [mName, nName] = ctx.params;
    const [m, n] = [ctx.vars[mName], ctx.vars[nName]];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the goal corner${Number.isInteger(m) && Number.isInteger(n) ? ` (${m - 1}, ${n - 1})` : ''} is reached by ${ctx.value} different routes`;
    const fresh = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && !(k in ctx.prev) && (row(ctx.vars[k]) || isGrid(ctx.vars[k])));
    if (fresh) {
      const v = ctx.vars[fresh];
      if (row(v) && v.length && v.every((x) => x === 1)) return 'the top row: only right moves reach these squares, so one route each';
      if (isGrid(v)) return 'a cell for every square: how many routes reach it';
    }
    const w = written(ctx.vars, ctx.prev, ctx.src, ctx.params);
    if (w) {
      if (w.r === 0 && w.c === 0 && w.v === 1) return 'the start square: one route, stay where you are';
      if ((w.r === 0 || w.c === 0) && w.v === 1) return `${at(w.r, w.c)} is on the edge: one straight route reaches it`;
      if (w.c > 0 && w.r !== 0 && w.above + w.left === w.v) return `${at(w.r, w.c)}: routes from above ${w.above} + from the left ${w.left} = ${w.v}`;
      return null;
    }
    const memo = memoOf(ctx.vars, ctx.params);
    const was = memoOf(ctx.prev, ctx.params) || [];
    if (memo && memo.length === was.length + 1) {
      const [key, v] = memo[memo.length - 1];
      return Number.isInteger(v) ? `square (${key}): ${v} routes, remembered so it is never counted again` : null;
    }
    return null;
  },
  // before an inner square is filled (first inner column and the last column): how many routes?
  predict(ctx) {
    if (!ctx.next) return null;
    const w = written(ctx.next.vars, ctx.vars, ctx.lines[ctx.next.line - 1], ctx.params);
    if (!w || !(w.c >= 1) || w.r === 0 || w.above + w.left !== w.v || !(w.c === 1 || w.c === w.cols - 1)) return null;
    return options(
      `How many routes reach ${at(w.r, w.c)}?`,
      w.v,
      [w.above, w.left, w.v + 1, w.above * w.left + 1].filter((x) => x !== w.v),
      `Every route enters from above (${w.above} routes) or from the left (${w.left} routes): ${w.above} + ${w.left} = ${w.v}.`,
    );
  },
  bugs: [
    {
      label: 'Start the top row at 0 routes',
      find: 'new Array(n).fill(1)',
      replace: 'new Array(n).fill(0)',
      explain: 'The top row has exactly one route per square (keep going right). Starting it at 0 makes every sum 0, so even a 1×1 grid reports no route.',
    },
    {
      label: 'Fill the row right to left',
      find: 'for (let c = 1; c < n; c++)',
      replace: 'for (let c = n - 1; c >= 1; c--)',
      explain: 'The left neighbour must already hold this row’s count. Going right to left adds the old row’s value instead, so the counts come out too small.',
    },
  ],
};
