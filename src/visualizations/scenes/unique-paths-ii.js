// Unique Paths II: like Unique Paths, but a rock (1) holds 0 routes, so nothing flows through it. Works with a
// rolling row (`dp[c] += dp[c - 1]`, row number often hidden by `for (const row of grid)`) or a full 2-D table
// (also written in place into the grid).
import { firstInt, options, row } from './util.js';

const ROW = ['r', 'i', 'row', 'y'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const WRITE2 = /(\w+)\[(\w+)\]\[(\w+)\]\s*(?:\+|-)?=(?!=)/;
const WRITE1 = /(\w+)\[(\w+)\]\s*(?:\+|-)?=(?!=)/;
const idx = (vars, t) => (/^\d+$/.test(t) ? Number(t) : Number.isInteger(vars[t]) ? vars[t] : undefined);

/** the grid row on screen when the row number is hidden: a loop variable equal to one of the grid's rows */
function rowOf(vars, grid, params) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !row(v) || v.length !== grid[0].length) continue;
    if (grid.some((g) => JSON.stringify(g) === JSON.stringify(v))) return v;
  }
  return null;
}

/** the cell the statement on `src` wrote: { r, c, v, above, left, rock, changed, cond, fresh } (r may be unknown) */
function written(vars, prev, src, params, grid) {
  if (!isGrid(grid)) return null;
  const m2 = WRITE2.exec(src || '');
  const m = m2 || WRITE1.exec(src || '');
  if (!m) return null;
  const cond = /\bif\s*\(/.test(src.slice(0, m.index));
  const plus = /^\s*\+=/.test(src.slice(m.index + m[0].length - 2));
  if (m2) {
    const g = vars[m2[1]];
    const [r, c] = [idx(vars, m2[2]), idx(vars, m2[3])];
    if (!isGrid(g) || !g[r] || !(c >= 0 && c < g[r].length) || typeof g[r][c] !== 'number' || !grid[r]) return null;
    const old = isGrid(prev[m2[1]]) ? prev[m2[1]][r]?.[c] : undefined;
    return { r, c, v: g[r][c], above: r > 0 ? g[r - 1][c] : 0, left: c > 0 ? g[r][c - 1] : 0, rock: grid[r][c] === 1, changed: old !== g[r][c], cond, cols: g[0].length };
  }
  if (params.includes(m[1])) return null;
  const d = row(vars[m[1]]);
  const before = row(prev[m[1]]);
  const c = idx(vars, m[2]);
  if (!d || !before || before.length !== d.length || !(c >= 0 && c < d.length) || typeof d[c] !== 'number') return null;
  const [, r] = firstInt(vars, ROW.filter((k) => !params.includes(k)));
  const cells = Number.isInteger(r) ? grid[r] : rowOf(vars, grid, params);
  return { r, c, v: d[c], above: before[c], left: c > 0 ? d[c - 1] : 0, rock: !!cells && cells[c] === 1, changed: before[c] !== d[c], cond: cond && !(plus && c > 0), cols: d.length, fresh: before.every((x) => x === 0) };
}

const at = (r, c) => (Number.isInteger(r) ? `square (${r}, ${c})` : `column ${c}`);

export default {
  id: 'unique-paths-ii',
  metaphor: 'Routes across a field with rocks',
  caption: 'Each number is how many right/down routes reach that square. A square adds the routes from above and from the left; a rock holds 0, so routes that would pass through it are lost.',
  pointers: ['c', 'j', 'col', 'x'],
  narrate(ctx) {
    const [gName] = ctx.params;
    const grid = ctx.input?.[0];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return ctx.value === 0 ? 'no route reaches the goal: rocks block every way through' : `the goal corner is reached by ${ctx.value} different route${ctx.value === 1 ? '' : 's'} around the rocks`;
    const w = written(ctx.vars, ctx.prev, ctx.src, [gName], grid);
    if (!w) return null;
    // the same line can record twice (write, then `continue`): only the first one, where something moved
    if (w.rock && w.v === 0 && JSON.stringify(ctx.vars) !== JSON.stringify(ctx.prev)) return `${at(w.r, w.c)} is a rock: no route can stand there → 0`;
    if (w.rock || (w.cond && !w.changed)) return null;
    if (w.c === 0 && w.v === 1 && (w.fresh || w.r === 0)) return 'the start square: one route, stay where you are';
    if (w.r === 0 && w.c > 0 && w.v === w.left) return `${at(w.r, w.c)}: top row, routes only come from the left → ${w.v}`;
    if (w.c > 0 && w.above + w.left === w.v) return `${at(w.r, w.c)}: routes from above ${w.above} + from the left ${w.left} = ${w.v}`;
    if (w.c === 0 && w.v === w.above) return `${at(w.r, w.c)}: left edge, routes only come from above → ${w.v}`;
    return null;
  },
  // before a square fills: one next to a rock, or a real sum (≥ 2)
  predict(ctx) {
    if (!ctx.next) return null;
    const w = written(ctx.next.vars, ctx.vars, ctx.lines[ctx.next.line - 1], ctx.params, ctx.input?.[0]);
    if (!w || w.rock || w.r === 0 || !(w.c >= 1) || w.above + w.left !== w.v) return null;
    const besideRock = (w.left === 0 && w.above > 0) || (w.above === 0 && w.left > 0 && Number.isInteger(w.r));
    if (!besideRock && w.v < 2) return null;
    return options(
      `How many routes reach ${at(w.r, w.c)}?`,
      w.v,
      [w.above, w.left, w.v + 1, w.above + w.left + 1].filter((x) => x !== w.v),
      `Routes enter from above (${w.above}) or from the left (${w.left})${w.left === 0 || w.above === 0 ? '; a 0 there means a rock or a cut-off square' : ''}: ${w.above} + ${w.left} = ${w.v}.`,
    );
  },
  bugs: [
    {
      label: 'Read 0 as the rock',
      find: 'row[c] === 1',
      replace: 'row[c] === 0',
      explain: 'The encoding is 1 = rock, 0 = free. Swapping them blocks every free square and lets routes walk through rocks.',
    },
    {
      label: 'Ignore rocks in the first column',
      find: 'if (row[c] === 1) dp[c] = 0;',
      replace: 'if (row[c] === 1 && c > 0) dp[c] = 0;',
      explain: 'A rock on the start (or anywhere down the left edge) must cut the route off too; skipping column 0 lets routes pass through it, so [[1]] reports 1 route.',
    },
  ],
};
