// Path with Minimum Effort (Dijkstra on a grid where a route costs its single biggest climb). The hiker's effort
// for a route is the steepest step on it, so relaxing uses max(effort so far, this climb) instead of a sum.
// Reads a heap of [effort, r, c] (or [effort, r * C + c]) tickets and a 2-D effort / dist board; Infinity may be
// recorded as null (shown as ∞).
import { firstInt, itemsOf, options, row } from './util.js';

const inf = (x) => x === null || x === undefined || x === Infinity;
const fmt = (x) => (inf(x) ? '∞' : x);
const CUR = [['r', 'c'], ['row', 'col'], ['x', 'y'], ['i', 'j'], ['cr', 'cc']];
const NEXT = [['nr', 'nc'], ['nx', 'ny'], ['ni', 'nj'], ['newR', 'newC'], ['r2', 'c2'], ['rr', 'cc'], ['nRow', 'nCol']];
const EFF = ['e', 'eff', 'effort0', 'cost', 'd', 'dist', 'cur', 'curEffort', 'w', 'maxSoFar'];
const CAND = ['ne', 'newEffort', 'nextEffort', 'cand', 'alt', 'nd', 'next', 'neff', 'ncost', 'newCost', 'step'];

function heapOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!(v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|queue|^q$|frontier/i.test(k))) continue;
    const items = itemsOf(v);
    if (Array.isArray(items) && items.every((it) => row(it) && it.length >= 2)) return { name: k, items };
  }
  return null;
}
function minus(a, b) {
  const left = b.map((x) => JSON.stringify(x));
  return a.filter((x) => {
    const i = left.indexOf(JSON.stringify(x));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
function popped(before, after) {
  const a = heapOf(before);
  const b = heapOf(after);
  if (!a || !b || a.name !== b.name) return null;
  const gone = minus(a.items, b.items);
  return gone.length === 1 && !minus(b.items, a.items).length ? gone[0] : null;
}
/** [r, c] of a heap ticket: [e, r, c] or [e, r * C + c] */
const where = (it, C) => (it.length >= 3 ? [it[1], it[2]] : Number.isInteger(C) && C > 0 ? [Math.floor(it[1] / C), it[1] % C] : null);
const pair = (vars, list) => {
  for (const [a, b] of list) if (Number.isInteger(vars[a]) && Number.isInteger(vars[b])) return [a, b];
  return null;
};
const boardOf = (vars, params) => Object.keys(vars || {}).find((k) => !params.includes(k) && /effort|dist|cost|best/i.test(k) && Array.isArray(vars[k]) && vars[k].length > 0 && vars[k].every((r) => row(r)));
/** the one changed cell [r, c, new, old] of a 2-D board */
function cell(vars, prev, k) {
  const a = k && vars?.[k];
  const b = k && prev?.[k];
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return null;
  const out = [];
  a.forEach((r, i) => row(r) && row(b[i]) && r.forEach((x, j) => x !== b[i][j] && out.push([i, j, x, b[i][j]])));
  return out.length === 1 ? out[0] : null;
}

export default {
  id: 'path-with-minimum-effort',
  metaphor: 'A hiker avoiding the steepest climb',
  caption: 'Each tile is a height; a route’s effort is its single steepest step. The effort table holds the gentlest known route to each tile, and the heap always hands out the gentlest tile next.',
  narrate(ctx) {
    const H = ctx.vars[ctx.params[0]];
    const C = Array.isArray(H?.[0]) ? H[0].length : undefined;
    if (ctx.ret && typeof ctx.value === 'number') return `the bottom-right tile comes off the heap with effort ${ctx.value}: no gentler route exists, so that is the answer`;
    if (!Object.keys(ctx.prev).length) return null;
    const B = boardOf(ctx.vars, ctx.params);
    const p = popped(ctx.prev, ctx.vars);
    const at = p && where(p, C);
    if (at) {
      const known = B ? ctx.vars[B][at[0]]?.[at[1]] : undefined;
      if (!inf(known) && p[0] > known) return `pop (${at[0]},${at[1]}) at effort ${p[0]}: stale, a gentler route (${known}) was already found; skip it`;
      return `pop the gentlest unsettled tile (${at[0]},${at[1]}): effort ${p[0]}, and that is final`;
    }
    const bc = cell(ctx.vars, ctx.prev, B);
    if (bc) {
      const [r, c, nw, old] = bc;
      if (nw === 0 && inf(old) && r === 0 && c === 0) return 'start at the top-left tile with effort 0; every other tile is at ∞';
      return `${nw} < ${fmt(old)}: a gentler route to (${r},${c}), so its effort drops to ${nw}`;
    }
    const cur = pair(ctx.vars, CUR);
    const nxt = pair(ctx.vars, NEXT);
    const [cName, ne] = firstInt(ctx.vars, CAND);
    if (cName && cur && nxt && Array.isArray(H) && ne !== ctx.prev[cName]) {
      const [r, c, nr, nc] = [ctx.vars[cur[0]], ctx.vars[cur[1]], ctx.vars[nxt[0]], ctx.vars[nxt[1]]];
      const a = H[r]?.[c];
      const b = H[nr]?.[nc];
      if (typeof a === 'number' && typeof b === 'number') {
        const [, e] = firstInt(ctx.vars, EFF);
        const k = Math.abs(b - a);
        return `step (${r},${c}) → (${nr},${nc}): height ${a} → ${b}, a climb of ${k}; route effort ${e !== undefined && Math.max(e, k) === ne ? `max(${e}, ${k}) = ` : ''}${ne}`;
      }
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const H = ctx.vars[ctx.params[0]];
    const C = Array.isArray(H?.[0]) ? H[0].length : undefined;
    // the route effort through this step: max, not sum
    const cur = pair(ctx.vars, CUR);
    const nxt = pair(ctx.vars, NEXT);
    const [cName, right] = firstInt(ctx.next.vars, CAND);
    const [, e] = firstInt(ctx.vars, EFF);
    if (cName && cur && nxt && Array.isArray(H) && e !== undefined && !Number.isInteger(ctx.vars[cName]) && nxt.every((k) => ctx.next.vars[k] === ctx.vars[k])) {
      const [r, c, nr, nc] = [ctx.vars[cur[0]], ctx.vars[cur[1]], ctx.vars[nxt[0]], ctx.vars[nxt[1]]];
      const a = H[r]?.[c];
      const b = H[nr]?.[nc];
      if (typeof a !== 'number' || typeof b !== 'number') return null;
      const k = Math.abs(b - a);
      if (e === 0 || k === 0 || e === k) return null;
      return options(`The route to (${r},${c}) has effort ${e}. Stepping to (${nr},${nc}) climbs from ${a} to ${b}. What is the new route's effort?`, right, [e + k, k, e, Math.min(e, k)].filter((x) => x !== right), `A route's effort is its steepest single step, so it is max(${e}, ${k}) = ${Math.max(e, k)}, not the sum ${e + k}.`);
    }
    // which tile pops next?
    const p = popped(ctx.vars, ctx.next.vars);
    const h = heapOf(ctx.vars);
    if (!p || !h || h.items.length < 2) return null;
    const firsts = h.items.map((it) => it[0]);
    if (p[0] !== Math.min(...firsts) || firsts.filter((x) => x === p[0]).length !== 1) return null;
    const label = (it) => {
      const w = where(it, C);
      return w ? `(${w[0]},${w[1]}) at effort ${it[0]}` : null;
    };
    if (!label(p)) return null;
    return options(`The heap holds ${h.items.length} tiles: ${h.items.map(label).join(', ')}. Which pops next?`, label(p), h.items.filter((it) => it !== p).map(label).filter(Boolean), `The min-heap hands out the gentlest route first: ${label(p)}. Every other ticket is already steeper, so nothing can beat it.`);
  },
  bugs: [
    {
      label: 'Sum the climbs instead of max',
      find: 'Math.max(e, Math.abs(heights[nr][nc] - heights[r][c]))',
      replace: 'e + Math.abs(heights[nr][nc] - heights[r][c])',
      explain: 'Effort is the single steepest step of a route, not the total climbing. Summing prefers short routes with many small steps over a flat detour.',
    },
    {
      label: 'Only move right and down',
      find: '[[1, 0], [-1, 0], [0, 1], [0, -1]]',
      replace: '[[1, 0], [0, 1]]',
      explain: 'The gentlest route may go up or left around a peak; with only right / down moves it is never found.',
    },
  ],
};
