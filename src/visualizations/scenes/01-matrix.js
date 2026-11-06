// 01 Matrix: a multi-source BFS. Every 0 drops a pebble at the same moment; the ripples spread one ring per round,
// and the first ripple to reach a 1 sets its distance. Works with a separate distance grid (-1 / Infinity = unknown)
// or the input changed in place, a queue with a head index or shift(), and r/c, i/j, row/col names.
import { row } from './util.js';

const HOME = [['r', 'c'], ['i', 'j'], ['row', 'col'], ['x', 'y'], ['cr', 'cc']];
const NEXT = [['nr', 'nc'], ['ni', 'nj'], ['nx', 'ny'], ['newR', 'newC'], ['rr', 'cc'], ['x2', 'y2']];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0);
const unknown = (v) => v === -1 || v === Infinity || v === null || v === undefined;

/** [name, grid] of the distance grid: a new grid with the input's shape, else the input itself (changed in place) */
function distOf(ctx, vars) {
  const m = ctx.input?.[0];
  if (!isGrid(m)) return [];
  const same = (v) => isGrid(v) && v.length === m.length && v[0].length === m[0].length;
  const own = Object.entries(vars || {}).filter(([k, v]) => !ctx.params.includes(k) && same(v));
  const hit = own.find(([k]) => /dist|ans|res|out|^d$/i.test(k)) || own[0];
  if (hit) return hit;
  const p = ctx.params[0];
  return same(vars?.[p]) ? [p, vars[p]] : [];
}
const diff = (g, p) => {
  if (!isGrid(p) || p.length !== g.length) return [];
  const out = [];
  g.forEach((r, i) => r.forEach((x, j) => x !== p[i]?.[j] && out.push([i, j])));
  return out;
};
const pairOf = (vars, list) => {
  const p = list.find(([a, b]) => Number.isInteger(vars?.[a]) && Number.isInteger(vars?.[b]));
  return p ? [p, vars[p[0]], vars[p[1]]] : null;
};
const queueOf = (vars) => Object.entries(vars).find(([k, v]) => /queue|^q$|frontier|^cur/i.test(k) && Array.isArray(v));
const inside = (g, r, c) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;
const known = (g) => g.flat().filter((x) => !unknown(x)).length;

export default {
  id: '01-matrix',
  metaphor: 'Ripples spreading from every 0',
  caption: 'Every 0 drops a pebble at the same moment. The ripples grow one ring per round, and the first ripple that reaches a 1 sets its distance. Lit tiles were just given a distance.',
  narrate(ctx) {
    const [dName, g] = distOf(ctx, ctx.vars);
    if (!g) return null;
    const d = diff(g, ctx.prev[dName]);
    const total = g.length * g[0].length;
    if (d.length === 1) {
      const [r, c] = d[0];
      const v = g[r][c];
      if (v === 0) return `(${r}, ${c}) is a 0: distance 0, a pebble drops here`;
      if (unknown(v)) return `(${r}, ${c}) is a 1: its distance is unknown for now`;
      const home = pairOf(ctx.vars, HOME);
      const from = home && inside(g, home[1], home[2]) ? ` from (${home[1]}, ${home[2]}) at ${g[home[1]][home[2]]}` : '';
      return `the ripple${from} reaches (${r}, ${c}) first: distance ${v} (${known(g)} of ${total} cells known)`;
    }
    if (d.length > 1) return `${d.length} cells get a starting value: 0 for each 0, unknown for each 1`;
    if (ctx.ret && Array.isArray(ctx.value)) return 'no ripple left to spread: every cell knows its distance to the nearest 0';
    const q = queueOf(ctx.vars);
    const qPrev = q && ctx.prev[q[0]];
    const home = pairOf(ctx.vars, HOME);
    const nb = pairOf(ctx.vars, NEXT);
    // the next cell is taken off the front of the line
    const headMoved = Object.entries(ctx.vars).some(([k, v]) => /^(head|front|h|qi|idx|ptr)$/.test(k) && Number.isInteger(v) && v !== ctx.prev[k]);
    const shrank = q && Array.isArray(qPrev) && q[1].length < qPrev.length;
    if (home && (headMoved || shrank) && (home[1] !== ctx.prev[home[0][0]] || home[2] !== ctx.prev[home[0][1]] || shrank) && inside(g, home[1], home[2])) {
      return `(${home[1]}, ${home[2]}) leaves the line: its ripple (distance ${g[home[1]][home[2]]}) spreads to its 4 neighbours`;
    }
    // a neighbour that is skipped (the next step is a `continue`)
    if (nb && /\bcontinue\b/.test(ctx.src || '')) {
      const [, r, c] = nb;
      if (!inside(g, r, c)) return `(${r}, ${c}) is off the grid: skip`;
      if (g[r][c] === 0) return `(${r}, ${c}) is a 0 itself: skip`;
      if (!unknown(g[r][c])) return `(${r}, ${c}) already has distance ${g[r][c]}: an earlier ripple got there first, skip`;
    }
    return null;
  },
  // a neighbour has just been worked out: does the ripple write it?
  predict(ctx) {
    const nx = ctx.next;
    const [dName, g] = distOf(ctx, ctx.vars);
    const nb = pairOf(ctx.vars, NEXT);
    const home = pairOf(ctx.vars, HOME);
    if (!nx || !g || !nb || !home || !inside(g, home[1], home[2])) return null;
    const [[a, b], r, c] = nb;
    if (r === ctx.prev[a] && c === ctx.prev[b]) return null; // not a fresh neighbour
    if (nx.vars[a] !== r || nx.vars[b] !== c) return null; // half-worked-out pair
    const after = nx.vars[dName];
    const d = isGrid(after) ? diff(after, g) : [];
    const base = g[home[1]][home[2]];
    if (!Number.isInteger(base) || base < 0) return null;
    let ans;
    if (d.length === 1 && d[0][0] === r && d[0][1] === c && Number.isInteger(after[r][c])) ans = 0;
    else if (!d.length && /\bcontinue\b/.test(ctx.lines[nx.line - 1] || '')) ans = !inside(g, r, c) ? 1 : !unknown(g[r][c]) ? 2 : null;
    // ask only the telling cases: a first arrival, or a 1 another ripple already reached
    if (ans == null || ans === 1 || (ans === 2 && !(g[r][c] > 0))) return null;
    const opts = [`It gets distance ${base + 1}`, 'Skip: off the grid', 'Skip: it already has a distance'];
    return {
      question: `The ripple at (${home[1]}, ${home[2]}) (distance ${base}) spreads to (${r}, ${c}). What happens?`,
      options: opts,
      answer: ans,
      explain: [
        `(${r}, ${c}) had no distance yet, so this ripple is the first to reach it: one step further than (${home[1]}, ${home[2]}), ${base + 1}.`,
        `(${r}, ${c}) lies outside the grid, so there is nothing to write.`,
        `(${r}, ${c}) already has distance ${inside(g, r, c) ? g[r][c] : '?'}: rings spread in order, so the first ripple to arrive was the closest. It is never overwritten.`,
      ][ans],
    };
  },
  bugs: [
    {
      label: '1-cells start at 0',
      find: 'new Array(C).fill(-1)',
      replace: 'new Array(C).fill(0)',
      explain: 'With 0 as the starting value, "not reached yet" looks the same as "is a 0": every ripple is skipped and all the 1s keep distance 0.',
    },
    {
      label: 'No "already reached" check',
      find: ' || dist[nr][nc] !== -1',
      replace: '',
      explain: 'Without the check a later ripple overwrites a cell: even 0s get rewritten as 1, and cells keep the distance of the last ripple instead of the first.',
    },
  ],
};
