// Swim in Rising Water (Dijkstra where a route costs its highest tile). The swimmer can enter a tile once the
// water has risen to its height, so reaching a neighbour takes max(time so far, its height). Reads a heap of
// [time, r, c] (or [time, r * n + c]) tickets, a toolkit MinHeap or a plain array kept as one.
import { diffItems, firstInt, itemsOf, options, row } from './util.js';

const CUR = [['r', 'c'], ['row', 'col'], ['x', 'y'], ['i', 'j'], ['cr', 'cc']];
const NEXT = [['nr', 'nc'], ['nx', 'ny'], ['ni', 'nj'], ['newR', 'newC'], ['r2', 'c2'], ['rr', 'cc'], ['nRow', 'nCol']];
const TIME = ['t', 'time', 'cur', 'd', 'level', 'w', 'e', 'cost', 'maxT', 'tt', 'wait', 'h'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0 && r.length === v[0].length);

function heapOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    if (!(v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|queue|^q$|frontier|todo|open/i.test(k))) continue;
    const items = itemsOf(v);
    if (Array.isArray(items) && items.every((it) => row(it) && it.length >= 2 && it.length <= 3)) return { name: k, items };
  }
  return null;
}
/** what was popped / pushed on the heap between two steps */
function moved(before, after, params) {
  const a = heapOf(before, params);
  const b = heapOf(after, params);
  return a && b && a.name === b.name ? diffItems(a.items, b.items) : null;
}
/** [r, c] of a ticket: [t, r, c] or [t, r * n + c] */
const where = (it, n) => (it.length >= 3 ? [it[1], it[2]] : Number.isInteger(n) && n > 0 ? [Math.floor(it[1] / n), it[1] % n] : null);
const pair = (vars, list) => {
  for (const [a, b] of list) if (Number.isInteger(vars?.[a]) && Number.isInteger(vars?.[b])) return [vars[a], vars[b]];
  return null;
};
const xy = ([r, c]) => `(${r}, ${c})`;

export default {
  id: 'swim-in-rising-water',
  metaphor: 'A swimmer waiting for the flood',
  caption: 'Each tile is a height; at time t the water covers every tile up to height t. The heap holds tiles by the earliest time they can be reached, and always hands out the earliest one next.',
  narrate(ctx) {
    const g = ctx.vars[ctx.params[0]];
    if (!isGrid(g)) return null;
    const n = g.length;
    if (ctx.ret && typeof ctx.value === 'number') return `the corner is the earliest tile left: the water must reach ${ctx.value} before the swimmer can get there`;
    const d = moved(ctx.prev, ctx.vars, ctx.params);
    if (!d) return null;
    if (d.removed.length === 1 && !d.added.length) {
      const p = d.removed[0];
      const w = where(p, n);
      if (!w) return null;
      return `take the earliest tile ${xy(w)}: reachable at time ${p[0]}${w[0] === n - 1 && w[1] === n - 1 ? ' — that is the corner' : ''}`;
    }
    if (d.added.length === 1 && !d.removed.length) {
      const p = d.added[0];
      const w = where(p, n);
      const h = w && g[w[0]]?.[w[1]];
      if (typeof h !== 'number') return null;
      if (w[0] === 0 && w[1] === 0 && !pair(ctx.vars, NEXT)) return `start in the top-left tile: the water must first rise to its height ${h}`;
      const cur = pair(ctx.vars, CUR);
      const [, t] = firstInt(ctx.vars, TIME);
      if (cur && Number.isInteger(t)) return `${xy(w)} has height ${h}: from ${xy(cur)} at time ${t} it is reachable at time max(${t}, ${h}) = ${p[0]}`;
      return `${xy(w)} (height ${h}) joins the heap: reachable at time ${p[0]}`;
    }
    return null;
  },
  maxPredicts: 2,
  predict(ctx) {
    if (!ctx.next) return null;
    const g = ctx.vars[ctx.params[0]];
    if (!isGrid(g)) return null;
    const n = g.length;
    const d = moved(ctx.vars, ctx.next.vars, ctx.params);
    if (!d) return null;
    // the time of a neighbour about to be pushed: max, not sum
    if (d.added.length === 1 && !d.removed.length) {
      const p = d.added[0];
      const w = where(p, n);
      const cur = pair(ctx.vars, CUR);
      const [, t] = firstInt(ctx.vars, TIME);
      const h = w && g[w[0]]?.[w[1]];
      if (!cur || !Number.isInteger(t) || typeof h !== 'number' || h >= t || h === 0) return null; // only when the route so far is the higher one: then max matters
      return options(
        `The swimmer reached ${xy(cur)} at time ${t}. Neighbour ${xy(w)} has height ${h}. When can the swimmer be there?`,
        p[0],
        [t + h, Math.min(t, h), h, t].filter((x) => x !== p[0]),
        `The swimmer must wait for the water to cover both the route so far and the new tile: max(${t}, ${h}) = ${Math.max(t, h)}. Heights are not added up.`,
      );
    }
    // which tile pops next?
    if (d.removed.length !== 1 || d.added.length) return null;
    const p = d.removed[0];
    const h = heapOf(ctx.vars, ctx.params);
    if (!h || h.items.length < 3) return null;
    // ask only when the swimmer jumps back to an older edge of the frontier (not a neighbour of its last tile)
    const cur = pair(ctx.vars, CUR);
    const pw = where(p, n);
    if (!cur || !pw || Math.abs(cur[0] - pw[0]) + Math.abs(cur[1] - pw[1]) <= 1) return null;
    const firsts = h.items.map((it) => it[0]);
    if (p[0] !== Math.min(...firsts) || firsts.filter((x) => x === p[0]).length !== 1) return null;
    const label = (it) => {
      const w = where(it, n);
      return w ? `${xy(w)} at time ${it[0]}` : null;
    };
    if (!label(p)) return null;
    return options(
      `The heap holds ${h.items.length} tiles: ${h.items.map(label).join(', ')}. Which is taken next?`,
      label(p),
      h.items.filter((it) => it !== p).map(label).filter(Boolean),
      `The min-heap hands out the earliest reachable tile: ${label(p)}. Every other tile needs the water higher, so nothing reaches it sooner.`,
    );
  },
  bugs: [
    {
      label: 'Start the clock at 0',
      find: 'heap.push([grid[0][0], 0, 0]);',
      replace: 'heap.push([0, 0, 0]);',
      explain: 'The swimmer stands on the first tile, so the water must cover it too. Starting at 0 forgets its height and gives answers that are too small.',
    },
    {
      label: 'Add heights instead of max',
      find: 'Math.max(t, grid[nr][nc])',
      replace: 't + grid[nr][nc]',
      explain: 'Waiting is not cumulative: once the water is at level t it covers every lower tile. Summing heights counts the same wait again and again.',
    },
  ],
};
