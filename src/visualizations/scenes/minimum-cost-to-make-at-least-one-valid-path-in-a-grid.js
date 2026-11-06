// Minimum Cost to Make at Least One Valid Path in a Grid (0-1 BFS with a deque). Following a cell's arrow is free,
// leaving it any other way means changing that arrow and costs 1: free moves go to the front of the deque, paid moves to the back, so cells leave the
// deque cheapest first. Works with a flat dist (r * n + c) or a 2-D one, and deque items as indexes, [r, c] or [d, r, c].
import { itemsOf, options } from './util.js';

const R = ['r', 'row', 'x', 'i', 'cr', 'y0'];
const C = ['c', 'col', 'y', 'j', 'cc', 'x0'];
const km = (x) => (x === null || x === undefined || x === Infinity ? '∞' : x);
const at = ([r, c]) => `(${r},${c})`;
const ARROW = { 1: 'right', 2: 'left', 3: 'down', 4: 'up' };
const plural = (k) => `${km(k)} arrow change${k === 1 ? '' : 's'}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fixed = (x) => x !== null && x !== undefined && x !== Infinity;

/** the cost table: [name, cells as [[r, c, value]…]] from a flat r * n + c array or an m × n grid */
function costOf(ctx, vars) {
  const g = ctx.input?.[0];
  if (!Array.isArray(g) || !Array.isArray(g[0]) || !vars) return null;
  const m = g.length;
  const n = g[0].length;
  for (const [k, v] of Object.entries(vars)) {
    if (ctx.params.includes(k) || !/dist|cost|best|^d$|remov|min/i.test(k) || !Array.isArray(v)) continue;
    if (v.length === m * n && v.every((x) => x === null || typeof x === 'number')) return [k, (r, c) => v[r * n + c]];
    if (v.length === m && v.every((row) => Array.isArray(row) && row.length === n)) return [k, (r, c) => v[r][c]];
  }
  return null;
}
/** the one cell whose cost changed: [r, c, before, after] */
function written(ctx, a, b) {
  const g = ctx.input[0];
  const out = [];
  g.forEach((row, r) => row.forEach((_, c) => a(r, c) !== b(r, c) && out.push([r, c, a(r, c), b(r, c)])));
  return out.length === 1 ? out[0] : null;
}
const dequeOf = (vars) => Object.entries(vars || {}).find(([k, v]) => /dq|deque|queue|^q$|dequ/i.test(k) && itemsOf(v));
/** a deque item as [r, c] */
function cellOf(ctx, x, cost) {
  const n = ctx.input[0][0].length;
  if (Number.isInteger(x)) return [Math.floor(x / n), x % n];
  if (Array.isArray(x) && x.length === 2) return x;
  if (Array.isArray(x) && x.length === 3) return cost && cost(x[1], x[2]) === x[0] ? [x[1], x[2]] : [x[0], x[1]];
  return null;
}
/** the cell being expanded, from r / c names */
function here(vars) {
  const r = R.find((k) => Number.isInteger(vars[k]));
  const c = C.find((k) => Number.isInteger(vars[k]));
  return r && c ? [vars[r], vars[c]] : null;
}
/** 'front' / 'back' when the deque grew by one item at that end, with the item */
function pushed(before, after) {
  if (!before || !after || after.length !== before.length + 1) return null;
  if (before.length && same(after.slice(1), before)) return ['front', after[0]];
  if (same(after.slice(0, -1), before)) return [before.length ? 'back' : 'empty', after[after.length - 1]];
  return null;
}

export default {
  id: 'minimum-cost-to-make-at-least-one-valid-path-in-a-grid',
  metaphor: 'Repainting the fewest signposts',
  caption: 'Each cell is a signpost; walking where it points is free, any other way means repainting it (cost 1). Each number is the fewest repaints to reach that cell. Free moves go to the front of the deque, paid moves to the back, so cells always come out cheapest first.',
  narrate(ctx) {
    const grid = ctx.input?.[0];
    if (ctx.ret && Number.isInteger(ctx.value) && Array.isArray(grid)) return `the bottom-right cell (${grid.length - 1},${grid[0].length - 1}) is reached with ${plural(ctx.value)}`;
    const cost = costOf(ctx, ctx.vars);
    if (!cost) return null;
    const before = costOf(ctx, ctx.prev);
    if (!before) return 'every cell costs ∞ for now: no route known yet';
    const w = written(ctx, before[1], cost[1]);
    if (w) {
      const [r, c, was, is] = w;
      if (is === 0 && r === 0 && c === 0) return 'start at (0,0): it costs 0';
      return `(${r},${c}) can be reached with ${plural(is)} (was ${km(was)})`;
    }
    const dq = dequeOf(ctx.vars);
    if (!dq) return null;
    const now = itemsOf(dq[1]);
    const prev = itemsOf(ctx.prev[dq[0]]);
    const p = pushed(prev, now);
    if (p) {
      const cell = cellOf(ctx, p[1], cost[1]);
      if (!cell) return null;
      const from = here(ctx.vars);
      if (p[0] === 'empty' || !from) return `${at(cell)} goes into the deque (${now.length} waiting)`;
      return p[0] === 'front'
        ? `${at(cell)} is where ${at(from)}'s arrow points (+0): free move to the front (${now.length} waiting)`
        : `${at(cell)} needs ${at(from)}'s arrow repainted (+1): paid move to the back (${now.length} waiting)`;
    }
    if (prev && now.length === prev.length - 1 && same(now, prev.slice(1))) {
      const cell = cellOf(ctx, prev[0], cost[1]);
      const k = cell && cost[1](cell[0], cell[1]);
      return cell ? `take ${at(cell)} from the front (${plural(k)}, the cheapest waiting); its arrow points ${ARROW[grid[cell[0]]?.[cell[1]]] || '?'}` : null;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const cost = costOf(ctx, ctx.vars);
    const after = costOf(ctx, ctx.next.vars);
    const from = here(ctx.vars);
    if (!cost || !after || !from) return null;
    const base = cost[1](from[0], from[1]);
    if (!Number.isInteger(base)) return null;
    // the first paid move: what does the cell cost now?
    const w = written(ctx, cost[1], after[1]);
    if (w) {
      const [r, c, was, is] = w;
      const g = ctx.input[0];
      const anyPaid = g.some((row, a) => row.some((_, b) => fixed(cost[1](a, b)) && cost[1](a, b) > 0));
      if (anyPaid || !Number.isInteger(is) || is <= base) return null;
      const dir = ARROW[g[from[0]]?.[from[1]]];
      return options(`From ${at(from)} (cost ${base}, arrow points ${dir || '?'}) the search tries ${at([r, c])}, which costs ${km(was)} now. What does ${at([r, c])} cost after this step?`, is, [km(was), base, is + 1].filter((x) => x !== is), `${at([r, c])} is not where ${at(from)}'s arrow points, so that arrow must be repainted: ${base} + ${is - base} = ${is}.`);
    }
    // a cell is pushed: which end of the deque?
    if (!/pushFront|unshift|appendleft|addFirst|offerFirst/.test(ctx.lines.join('\n'))) return null;
    const dq = dequeOf(ctx.vars);
    const p = dq && pushed(itemsOf(dq[1]), itemsOf(ctx.next.vars[dq[0]]));
    if (!p || p[0] === 'empty') return null;
    const cell = cellOf(ctx, p[1], after[1]);
    if (!cell) return null;
    const opts = ['Front of the deque', 'Back of the deque'];
    const free = after[1](cell[0], cell[1]) === base;
    return {
      question: `${at(cell)} now costs ${km(after[1](cell[0], cell[1]))}; ${at(from)}, the cell being expanded, costs ${base}. Where does ${at(cell)} go?`,
      options: opts,
      answer: p[0] === 'front' ? 0 : 1,
      explain: p[0] === 'front' ? `It follows ${at(from)}'s arrow (${free ? 'same cost' : 'cost'} as ${at(from)}), so it may be popped before everything waiting: free move to the front.` : `${at(from)}'s arrow had to be repainted, so it costs one more than the cells at the front: paid move to the back.`,
    };
  },
  bugs: [
    {
      label: 'Arrow values in the wrong order',
      find: 'const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];',
      replace: 'const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];',
      explain: 'Arrow 2 means left and 3 means down; swapping them makes the search follow signposts the wrong way, so free moves look paid and the reverse.',
    },
    {
      label: 'Charge the cell you enter',
      find: 'const w = grid[r][c] - 1 === d ? 0 : 1;',
      replace: 'const w = grid[nr][nc] - 1 === d ? 0 : 1;',
      explain: "A move is free when it follows the arrow of the cell you leave; reading the arrow of the cell you enter charges the wrong signposts.",
    },
  ],
};
