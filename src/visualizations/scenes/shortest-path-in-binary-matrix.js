// Shortest Path in Binary Matrix. BFS from the top-left corner spreads like ripples in rings: every cell of ring d
// is d cells from the start (8 directions, diagonals included), so the first time the ripple touches the
// bottom-right corner, that ring is the answer. Works with a head index or shift(), [r, c, d] entries, and with
// marking the grid itself or a separate visited / dist grid.
import { itemsOf, options, row } from './util.js';

const SRC = [['r', 'c'], ['cr', 'cc'], ['i', 'j'], ['row', 'col'], ['x', 'y']];
const NB = [['nr', 'nc'], ['nx', 'ny'], ['ni', 'nj'], ['newR', 'newC'], ['nrow', 'ncol'], ['x', 'y'], ['a', 'b']];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0 && r.length === v[0].length);
const at = ([r, c]) => `(${r}, ${c})`;
const pair = (vars, [a, b]) => (Number.isInteger(vars[a]) && Number.isInteger(vars[b]) ? [vars[a], vars[b]] : null);
const inside = (g, [r, c]) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;
const near = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) === 1;

// the cell being expanded (src) and the neighbour it tries (nb)
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
// [name, cell] pairs that changed in the grid or a visited / dist grid
function marks(vars, prev, gName) {
  const out = [];
  for (const [k, v] of Object.entries(vars)) {
    if ((k !== gName && !/vis|seen|dist/i.test(k)) || !isGrid(v) || !isGrid(prev[k]) || prev[k].length !== v.length) continue;
    v.forEach((r, i) => r.forEach((x, j) => x !== prev[k][i][j] && out.push({ name: k, cell: [i, j], value: x })));
  }
  return out;
}
const queueOf = (vars) => Object.entries(vars).find(([k, v]) => /queue|^q$|frontier/i.test(k) && itemsOf(v));
function popped(vars, prev, src) {
  const q = queueOf(vars);
  if (!q) return null;
  const now = itemsOf(q[1]), was = itemsOf(prev[q[0]]);
  if (was && /shift\(/.test(src) && now.length === was.length - 1 && JSON.stringify(now) === JSON.stringify(was.slice(1))) return was[0];
  const h = ['head', 'front', 'qi', 'h', 'idx'].find((k) => Number.isInteger(vars[k]) && vars[k] !== prev[k]);
  return h && Array.isArray(now[vars[h]]) ? now[vars[h]] : null;
}
const lenOf = (vars) => ['d', 'dist', 'len', 'steps', 'length', 'pathLen'].map((k) => vars[k]).find(Number.isInteger);

export default {
  id: 'shortest-path-in-binary-matrix',
  metaphor: 'Ripples spreading through a walled maze',
  caption: 'From the top-left corner a ripple spreads one ring per step, in all 8 directions. Lit tiles were just reached; 1s are walls (or already reached). The ring that first touches the bottom-right corner is the path length in cells.',
  narrate(ctx) {
    const gName = ctx.params[0];
    const g0 = ctx.input?.[0];
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (ctx.value !== -1) return `the ripple reaches the far corner: the shortest clear path visits ${ctx.value} cell${ctx.value === 1 ? '' : 's'}`;
      if (isGrid(g0) && (g0[0][0] !== 0 || g0[g0.length - 1][g0.length - 1] !== 0)) return `${g0[0][0] !== 0 ? 'the start' : 'the far corner'} is a wall: no clear path, -1`;
      return 'the ripple died out without touching the far corner: walls cut it off, -1';
    }
    const g = ctx.vars[gName];
    if (!isGrid(g)) return null;
    const m = marks(ctx.vars, ctx.prev, gName);
    if (m.length === 1) {
      const { cell, value, name } = m[0];
      const l = looking(ctx.vars);
      const d = lenOf(ctx.vars);
      const cells = /dist/i.test(name) && Number.isInteger(value) ? value : Number.isInteger(d) && l ? d + 1 : null;
      if (cell[0] === 0 && cell[1] === 0) return `(0, 0) is the start: a path of 1 cell. Mark it reached so nothing queues it again`;
      const from = l && l.nb[0] === cell[0] && l.nb[1] === cell[1] ? ` from ${at(l.src)}${l.src[0] !== cell[0] && l.src[1] !== cell[1] ? ' (diagonally)' : ''}` : '';
      return `${at(cell)} is open: reached${from}${cells ? ` with ${cells} cells` : ''}. Mark it so no longer path claims it`;
    }
    const p = popped(ctx.vars, ctx.prev, ctx.src || '');
    if (p && Number.isInteger(p[0]) && Number.isInteger(p[1])) {
      const last = g.length - 1;
      const dg = Object.entries(ctx.vars).find(([k, v]) => /dist/i.test(k) && isGrid(v))?.[1];
      const d = Number.isInteger(p[2]) ? p[2] : Number.isInteger(dg?.[p[0]]?.[p[1]]) && dg[p[0]][p[1]] > 0 ? dg[p[0]][p[1]] : null;
      return `ripple${d ? ` ${d}` : ''}: take ${at(p)} off the queue${d ? ` (${d} cell${d === 1 ? '' : 's'} from the start)` : ''}${p[0] === last && p[1] === last ? ' — it is the far corner!' : ': try its 8 neighbours'}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const gName = ctx.params[0];
    const g = ctx.vars[gName];
    const g0 = ctx.input?.[0];
    if (!isGrid(g) || !isGrid(g0)) return null;
    if (ctx.next.ret && Number.isInteger(ctx.next.value)) {
      const v = ctx.next.value;
      if (v === -1 && (g0[0][0] !== 0 || g0[g0.length - 1][g0.length - 1] !== 0)) return null; // the guard: not a BFS moment
      const p = looking(ctx.vars)?.src;
      return options(
        v === -1 ? 'The queue is empty. What does the run return?' : `The ripple has reached ${p ? at(p) : 'the far corner'}. What does the run return?`,
        v,
        [-1, Math.max(1, v - 1), v + 1],
        v === -1 ? 'The ripple stopped spreading before it touched the bottom-right corner, so no clear path exists: -1.' : `BFS reaches cells in order of distance, so the first visit of the corner is the shortest path: ${v} cells (the start counts).`,
      );
    }
    const l = looking(ctx.vars);
    if (!l || !inside(g, l.nb)) return null;
    const [r, c] = l.nb;
    const was = pair(ctx.prev, l.nbNames);
    if (was && was[0] === r && was[1] === c) return null; // ask only right after the neighbour is picked
    // diagonal moves are the heart of this question
    if (l.src[0] === r || l.src[1] === c) return null;
    const before = marks(ctx.next.vars, ctx.vars, gName).some(({ cell }) => cell[0] === r && cell[1] === c);
    let yes;
    if (before) yes = true;
    else {
      const n2 = pair(ctx.next.vars, l.nbNames);
      const skip = /\bcontinue\b/.test(ctx.lines[ctx.next.line - 1] || '') || !n2 || n2[0] !== r || n2[1] !== c;
      if (skip) yes = false;
      else return null;
    }
    const wall = g0[r][c] !== 0;
    return {
      question: `From ${at(l.src)} the ripple tries the diagonal neighbour ${at(l.nb)}. Does ${at(l.nb)} join the queue?`,
      options: ['Yes: it is open and not reached yet', 'No: it is a wall or already reached'],
      answer: yes ? 0 : 1,
      explain: yes
        ? `${at(l.nb)} is a clear 0 nobody reached yet; diagonal moves count as one step, so it joins the next ring.`
        : wall
          ? `${at(l.nb)} is a wall (1) on the original grid.`
          : `${at(l.nb)} was already reached by an earlier (or equal) ring, so a path through ${at(l.src)} cannot be shorter.`,
    };
  },
  bugs: [
    {
      label: 'Forget the diagonal directions',
      find: 'const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];',
      replace: 'const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];',
      explain: 'The ripple only spreads up, down, left and right, so a corridor that turns diagonally (like [[0,1],[1,0]]) is never crossed and the answer becomes -1.',
    },
    {
      label: 'Count moves instead of cells',
      find: 'if (r === n - 1 && c === n - 1) return d;',
      replace: 'if (r === n - 1 && c === n - 1) return d - 1;',
      explain: 'The path length counts the cells visited, including the start. Returning the number of moves is one too small (a 1×1 grid should give 1, not 0).',
    },
  ],
};
