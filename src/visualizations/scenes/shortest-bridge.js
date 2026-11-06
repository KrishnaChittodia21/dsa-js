// Shortest Bridge. Paint the first island (DFS, 1 → 2), then grow it ring by ring through the water
// (multi-source BFS, water 0 → 2) until a ring touches the other island's 1s. The number of finished rings is the
// number of water tiles the bridge needs. Reads the grid parameter; source / neighbour pairs by common names.
import { firstInt, options, row } from './util.js';

const SRC = [['r', 'c'], ['cr', 'cc'], ['i', 'j'], ['row', 'col'], ['x', 'y']];
const NB = [['nr', 'nc'], ['nx', 'ny'], ['ni', 'nj'], ['newR', 'newC'], ['nrow', 'ncol'], ['rr', 'cc'], ['x', 'y'], ['a', 'b']];
const COUNT = ['flips', 'steps', 'step', 'level', 'dist', 'ans', 'res', 'bridge', 'layer', 'ring', 'd'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0 && r.length === v[0].length);
const at = ([r, c]) => `(${r}, ${c})`;
const pair = (vars, [a, b]) => (Number.isInteger(vars[a]) && Number.isInteger(vars[b]) ? [vars[a], vars[b]] : null);
const inside = (g, [r, c]) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;
const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
const count = (g, input, from) => g.reduce((n, r, i) => n + r.filter((x, j) => x === 2 && input?.[i]?.[j] === from).length, 0);

function looking(vars) {
  for (const sp of SRC) {
    const src = pair(vars, sp);
    if (!src) continue;
    for (const np of NB) {
      const nb = pair(vars, np);
      if (np !== sp && nb && near(src, nb)) return { src, nb, nbNames: np };
    }
  }
  return null;
}
function changed(g, p) {
  if (!isGrid(p) || p.length !== g.length) return [];
  const out = [];
  g.forEach((r, i) => r.forEach((x, j) => x !== p[i][j] && out.push([i, j])));
  return out;
}
const counter = (vars, params) => firstInt(Object.fromEntries(Object.entries(vars).filter(([k]) => !params.includes(k))), COUNT);

export default {
  id: 'shortest-bridge',
  metaphor: 'Island A pouring sand into the sea',
  caption: 'First island A is painted (2). Then every painted tile fills its water neighbours, one ring per round; lit tiles were just filled. The first ring that touches island B (a 1) says how many water tiles the bridge needs.',
  narrate(ctx) {
    const gName = ctx.params[0];
    const g = ctx.vars[gName];
    const input = ctx.input?.[0];
    if (ctx.ret && Number.isInteger(ctx.value)) {
      const l = looking(ctx.vars);
      return `${l ? `${at(l.src)} touches island B at ${at(l.nb)}` : 'island B is reached'}: the bridge needs ${ctx.value} water tile${ctx.value === 1 ? '' : 's'}`;
    }
    if (!isGrid(g)) return null;
    const d = changed(g, ctx.prev[gName]);
    if (d.length === 1 && g[d[0][0]][d[0][1]] === 2) {
      const [r, c] = d[0];
      if (input?.[r]?.[c] === 1) {
        const k = count(g, input, 1);
        return `${at(d[0])} is land of island A: paint it (${k} tile${k === 1 ? '' : 's'} of island A so far)`;
      }
      if (input?.[r]?.[c] === 0) {
        const l = looking(ctx.vars);
        const [, f] = counter(ctx.vars, ctx.params);
        const ring = Number.isInteger(f) ? ` (ring ${f + 1}: ${f + 1} flip${f === 0 ? '' : 's'} from island A)` : '';
        return `sand fills water ${at(d[0])}${l ? ` next to ${at(l.src)}` : ''}${ring}`;
      }
    }
    const [m, f] = counter(ctx.vars, ctx.params);
    if (m && !looking(ctx.vars)) {
      if (f === 0 && ctx.prev[m] === undefined) {
        const k = count(g, input, 1);
        return `island A is fully painted (${k} tile${k === 1 ? '' : 's'}): all of them start the spread at once, 0 flips`;
      }
      if (f === ctx.prev[m] + 1) return `round ${f}: the newest ring (${f} water tile${f === 1 ? "" : "s"} from island A) now looks for island B`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const gName = ctx.params[0];
    const g = ctx.vars[gName];
    const input = ctx.input?.[0];
    if (!isGrid(g)) return null;
    const l = looking(ctx.vars);
    // the edge touches island B: what is returned?
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && l && inside(g, l.nb) && g[l.nb[0]][l.nb[1]] === 1) {
      const v = ctx.next.value;
      const [m, f] = counter(ctx.vars, ctx.params);
      return options(
        `Painted tile ${at(l.src)} sees land ${at(l.nb)} of island B${m ? ` while ${m} = ${f}` : ''}. What does the run return?`,
        v,
        [v + 1, Math.max(0, v - 1), v + 2],
        `Each finished ring is one water tile flipped. The ring holding ${at(l.src)} is ${v} tile${v === 1 ? '' : 's'} from island A, and B is right next to it, so the answer is ${v}, not one more.`,
      );
    }
    // the first water tile of the spread: ask once, before any water is painted
    if (!l || !inside(g, l.nb) || count(g, input, 0) > 0) return null;
    const [r, c] = l.nb;
    if (g[r][c] !== 0) return null;
    const was = pair(ctx.prev, l.nbNames);
    if (was && was[0] === r && was[1] === c) return null;
    const ng = ctx.next.vars[gName];
    if (!isGrid(ng) || ng[r][c] !== 2) return null;
    return {
      question: `Island A is painted and starts to spread. Tile ${at(l.src)} looks at ${at(l.nb)}. What happens to it?`,
      options: ['It is water: fill it, it joins the next ring', 'It is island B: the bridge is done', 'Nothing: it is already painted'],
      answer: 0,
      explain: `${at(l.nb)} holds 0, water: it is painted 2 (so no one fills it twice) and spreads further in the next round.`,
    };
  },
  bugs: [
    {
      label: 'Count one flip too many',
      find: 'if (grid[nr][nc] === 1) return flips;',
      replace: 'if (grid[nr][nc] === 1) return flips + 1;',
      explain: 'The rings finished so far are already the water tiles crossed. Adding one counts the tile of island B as a flip.',
    },
    {
      label: 'Keep scanning after the first island',
      find: 'break outer;',
      replace: '',
      explain: 'The scan goes on and paints island B too, so the spreading sand never finds a 1 to touch and the run returns -1.',
    },
  ],
};
