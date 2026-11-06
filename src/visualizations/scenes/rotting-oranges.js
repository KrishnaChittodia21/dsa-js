// Rotting Oranges. Multi-source BFS: every rotten orange starts in the queue at minute 0, and each one taken off
// the queue rots its fresh neighbours one minute later. Rotting a tile is also its visited mark. Works with a
// head index or shift(), [r, c, t] entries or level-by-level minutes.
import { itemsOf, options, row } from './util.js';

const SRC = [['r', 'c'], ['cr', 'cc'], ['i', 'j'], ['row', 'col'], ['x', 'y']];
const NB = [['nr', 'nc'], ['nx', 'ny'], ['ni', 'nj'], ['newR', 'newC'], ['nrow', 'ncol'], ['rr', 'cc'], ['x', 'y'], ['a', 'b']];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0 && r.length === v[0].length);
const at = ([r, c]) => `(${r}, ${c})`;
const pair = (vars, [a, b]) => (Number.isInteger(vars[a]) && Number.isInteger(vars[b]) ? [vars[a], vars[b]] : null);
const inside = (g, [r, c]) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;
const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
const freshLeft = (g) => g.reduce((n, r) => n + r.filter((x) => x === 1).length, 0);

// the orange spreading the rot (src) and the neighbour it looks at (nb), when both are in scope
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
const queueOf = (vars) => Object.entries(vars).find(([k, v]) => /queue|^q$|frontier|rotten/i.test(k) && itemsOf(v));
// the entry just taken off the queue: a shrink by one, or a head index that moved
function popped(vars, prev, src) {
  const q = queueOf(vars);
  if (!q) return null;
  const now = itemsOf(q[1]), was = itemsOf(prev[q[0]]);
  if (was && /shift\(/.test(src) && now.length === was.length - 1 && JSON.stringify(now) === JSON.stringify(was.slice(1))) return was[0];
  const h = ['head', 'front', 'qi', 'h', 'idx'].find((k) => Number.isInteger(vars[k]) && vars[k] !== prev[k]);
  return h && Array.isArray(now[vars[h]]) ? now[vars[h]] : null;
}
// the spreader's own minute, when its queue entry carries one ([r, c, t]); round counters vary too much to trust
const timeOf = (vars) => ['t', 'd'].map((k) => vars[k]).find(Number.isInteger);

export default {
  id: 'rotting-oranges',
  metaphor: 'Rot spreading through a fruit crate',
  caption: 'Every rotten orange starts at minute 0. Each one taken off the queue rots its fresh neighbours (up, down, left, right) a minute later; lit tiles just rotted. Fresh oranges nobody reaches make the answer -1.',
  narrate(ctx) {
    const gName = ctx.params[0];
    const g = ctx.vars[gName];
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (ctx.value === -1) return `the queue ran dry with ${isGrid(g) ? freshLeft(g) : 'some'} fresh orange(s) nobody can reach: -1`;
      return `every orange that can rot has rotted: it took ${ctx.value} minute${ctx.value === 1 ? '' : 's'}`;
    }
    if (!isGrid(g)) return null;
    const d = changed(g, ctx.prev[gName]);
    if (d.length === 1 && g[d[0][0]][d[0][1]] === 2) {
      const l = looking(ctx.vars);
      const t = timeOf(ctx.vars);
      const from = l && l.nb[0] === d[0][0] && l.nb[1] === d[0][1] ? ` from ${at(l.src)}` : '';
      const left = freshLeft(g);
      return `${at(d[0])} catches the rot${from}${Number.isInteger(t) ? ` at minute ${t + 1}` : ''}: ${left} fresh orange${left === 1 ? '' : 's'} left`;
    }
    const p = popped(ctx.vars, ctx.prev, ctx.src || '');
    if (p && Number.isInteger(p[0]) && Number.isInteger(p[1])) {
      return `take ${at(p)} off the queue${Number.isInteger(p[2]) ? ` (rotten since minute ${p[2]})` : ''}: it rots its fresh neighbours`;
    }
    // set-up scan: sources join the queue, fresh oranges are counted
    const q = queueOf(ctx.vars);
    const qNow = q && itemsOf(q[1]), qWas = q && itemsOf(ctx.prev[q[0]]);
    if (qNow && qWas && qNow.length === qWas.length + 1) {
      const it = qNow[qNow.length - 1];
      if (Array.isArray(it) && ctx.input?.[0]?.[it[0]]?.[it[1]] === 2) return `${at(it)} is rotten from the start: it joins the queue at minute 0`;
      return null;
    }
    const f = Object.keys(ctx.vars).find((k) => /fresh/i.test(k) && Number.isInteger(ctx.vars[k]));
    if (f && ctx.vars[f] === ctx.prev[f] + 1) return `a fresh orange: ${ctx.vars[f]} counted so far (each must rot, or the answer is -1)`;
    const m = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && /min|time|level|day/i.test(k) && Number.isInteger(ctx.vars[k]));
    if (m && ctx.vars[m] === ctx.prev[m] + 1 && !looking(ctx.vars)) return `the clock ticks: minute ${ctx.vars[m]}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const gName = ctx.params[0];
    const g = ctx.vars[gName];
    if (!isGrid(g)) return null;
    // the run ends next: what does it return?
    if (ctx.next.ret && Number.isInteger(ctx.next.value)) {
      const v = ctx.next.value;
      const left = freshLeft(g);
      return options(
        `The queue is empty and ${left} fresh orange${left === 1 ? ' is' : 's are'} left. What does the run return?`,
        v,
        [-1, Math.max(0, v - 1), v + 1],
        v === -1 ? 'Some fresh orange was never reached by the rot, so the crate can never fully rot: -1.' : `Nothing fresh is left, so the answer is the minute the last orange rotted: ${v}.`,
      );
    }
    const l = looking(ctx.vars);
    if (!l || !inside(g, l.nb)) return null;
    const [r, c] = l.nb;
    const was = pair(ctx.prev, l.nbNames);
    if (was && was[0] === r && was[1] === c) return null; // ask only right after the neighbour is picked
    const v = g[r][c];
    // fresh neighbours, or ones that already rotted during the run (not the empty tiles)
    if (!(v === 1 || (v === 2 && ctx.input?.[0]?.[r]?.[c] === 1))) return null;
    if (v === 1 && timeOf(ctx.vars) === 0) return null; // the first spreaders always hit fresh fruit: ask later, when both answers happen
    const nextG = ctx.next.vars[gName];
    let yes;
    if (isGrid(nextG) && nextG[r][c] === 2 && v === 1) yes = true;
    else {
      const n2 = pair(ctx.next.vars, l.nbNames);
      const skip = /\bcontinue\b/.test(ctx.lines[ctx.next.line - 1] || '') || !n2 || n2[0] !== r || n2[1] !== c;
      if (isGrid(nextG) && nextG[r][c] === v && skip) yes = false;
      else return null;
    }
    return {
      question: `Rotten orange ${at(l.src)} looks at its neighbour ${at(l.nb)}. Does ${at(l.nb)} rot now?`,
      options: ['Yes: it is fresh, it rots and joins the queue', 'No: it is already rotten, skip it'],
      answer: yes ? 0 : 1,
      explain: yes
        ? `${at(l.nb)} holds a fresh orange (1), so it turns to 2 one minute after ${at(l.src)} and joins the queue to spread further.`
        : `${at(l.nb)} already rotted from another orange; rotting doubles as the visited mark, so it is not queued twice.`,
    };
  },
  bugs: [
    {
      label: 'Return -1 when nothing needed to rot',
      find: 'return fresh === 0 ? minutes : -1;',
      replace: 'return fresh === 0 && minutes > 0 ? minutes : -1;',
      explain: 'With no fresh oranges at the start, no minute ever passes, but the crate is already done: the answer is 0, not -1.',
    },
    {
      label: 'Use the spreader\'s minute, not one later',
      find: 'minutes = t + 1;',
      replace: 'minutes = t;',
      explain: 'A neighbour rots one minute after the orange that infects it. Recording the spreader\'s own minute makes every answer one too small.',
    },
  ],
};
