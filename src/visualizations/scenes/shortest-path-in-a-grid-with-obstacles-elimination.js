// Shortest Path in a Grid with Obstacles Elimination. BFS over states (tile, removals left), one ring per step.
// A tile reached again is only worth exploring when it arrives with more removals left than before. Reads the
// grid / k parameters, source / neighbour pairs and the "removals left" counters by common names.
import { firstInt, options, row } from './util.js';

const SRC = [['r', 'c'], ['cr', 'cc'], ['x', 'y'], ['i', 'j'], ['row', 'col']];
const NB = [['nr', 'nc'], ['nx', 'ny'], ['ni', 'nj'], ['newR', 'newC'], ['nrow', 'ncol'], ['rr', 'cc'], ['x2', 'y2']];
const LEFT = ['left', 'rem', 'remain', 'remaining', 'kLeft', 'kl', 'elim', 'lives', 'charges', 'power', 'bombs', 'e', 'kk', 'obs', 'quota'];
const NLEFT = ['nl', 'nk', 'nrem', 'newLeft', 'nLeft', 'nextLeft', 'newK', 'nextK', 'nleft', 'left2', 'ne', 'nObs', 'remAfter'];
const STEPS = ['steps', 'step', 'dist', 'level', 'moves', 'ans', 'res', 'd', 'len'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0 && r.length === v[0].length);
const at = ([r, c]) => `(${r}, ${c})`;
const pairOf = (vars, list) => {
  for (const [a, b] of list) if (Number.isInteger(vars?.[a]) && Number.isInteger(vars?.[b])) return { names: [a, b], at: [vars[a], vars[b]] };
  return null;
};
const inside = (g, [r, c]) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;
const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
const own = (vars, params, names) => firstInt(Object.fromEntries(Object.entries(vars || {}).filter(([k]) => !params.includes(k))), names);
const same = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];
// something stored this step: an array / Set grew, or a 2-D board changed
function stored(vars, prev, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || prev?.[k] === undefined) continue;
    const a = v?.$set ? v.$size : Array.isArray(v) && !isGrid(v) ? v.length : null;
    const b = prev[k]?.$set ? prev[k].$size : Array.isArray(prev[k]) && !isGrid(prev[k]) ? prev[k].length : null;
    if (a !== null && b !== null && a > b) return true;
    if (isGrid(v) && isGrid(prev[k]) && JSON.stringify(v) !== JSON.stringify(prev[k])) return true;
  }
  return false;
}
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

export default {
  id: 'shortest-path-in-a-grid-with-obstacles-elimination',
  metaphor: 'A walker carrying k wall-breaking charges',
  caption: 'A state is a tile plus the charges still in the pocket: “(r, c) with k removals left”. Each ring of the BFS is one more step; a tile is worth revisiting only with more charges left than last time.',
  narrate(ctx) {
    const [gName, kName] = ctx.params;
    const g = ctx.vars[gName];
    const k = ctx.vars[kName];
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (ctx.value === -1) return 'every reachable state is explored and the corner was never reached: -1';
      if (!pairOf(ctx.vars, SRC) && isGrid(g) && ctx.value === g.length + g[0].length - 2) return `${k} charges are enough to blast a straight route: ${ctx.value} steps, no search needed`;
      return `the walker stands on the bottom-right corner: the shortest route takes ${plural(ctx.value, 'step')}`;
    }
    if (!isGrid(g)) return null;
    const src = pairOf(ctx.vars, SRC);
    const nb = pairOf(ctx.vars, NB);
    const [, s] = own(ctx.vars, ctx.params, STEPS);
    const [, left] = own(ctx.vars, ctx.params, LEFT);
    // a neighbour's charge count was just worked out
    const [nlName, nl] = own(ctx.vars, ctx.params, NLEFT);
    if (src && nb && nlName && near(src.at, nb.at) && (nl !== ctx.prev[nlName] || !same(nb.at, pairOf(ctx.prev, NB)?.at)) && inside(g, nb.at)) {
      const wall = g[nb.at[0]][nb.at[1]] === 1;
      if (wall) return `${at(nb.at)} is a wall: blasting it would leave ${plural(nl, 'removal')}`;
      return `${at(nb.at)} is open: arriving there keeps ${plural(nl, 'removal')}`;
    }
    // the decision on that neighbour
    if (src && nb && nlName && same(nb.at, pairOf(ctx.prev, NB)?.at)) {
      if (/\bcontinue\b/.test(ctx.src || '')) return nl < 0 ? `skip ${at(nb.at)}: no charge left to break that wall` : `skip ${at(nb.at)} with ${plural(nl, 'removal')} left: it was reached before with at least as many`;
      const board = Object.keys(ctx.vars).some((k) => !ctx.params.includes(k) && ((isGrid(ctx.vars[k]) && ctx.vars[k].length === g.length && ctx.vars[k][0].length === g[0].length && JSON.stringify(ctx.vars[k]) !== JSON.stringify(ctx.prev[k])) || (ctx.vars[k]?.$set && ctx.prev[k]?.$set && ctx.vars[k].$size > ctx.prev[k].$size)));
      if (board) return `keep ${at(nb.at)} with ${plural(nl, 'removal')} left: a new, better state, it joins the next ring`;
    }
    // a new state taken from the frontier
    if (src && !nb && Number.isInteger(left) && (!same(src.at, pairOf(ctx.prev, SRC)?.at) || left !== own(ctx.prev, ctx.params, LEFT)[1])) {
      return `stand on ${at(src.at)} with ${plural(left, 'removal')} left${Number.isInteger(s) ? ` (${plural(s, 'step')} from the start)` : ''}`;
    }
    return null;
  },
  // after the neighbour's charges are known: is that state worth keeping?
  predict(ctx) {
    if (!ctx.next) return null;
    const g = ctx.vars[ctx.params[0]];
    if (!isGrid(g)) return null;
    const src = pairOf(ctx.vars, SRC);
    const nb = pairOf(ctx.vars, NB);
    const [nlName, nl] = own(ctx.vars, ctx.params, NLEFT);
    if (!src || !nb || !nlName || !near(src.at, nb.at) || !inside(g, nb.at)) return null;
    if (nl === ctx.prev[nlName] && same(nb.at, pairOf(ctx.prev, NB)?.at)) return null;
    const wall = g[nb.at[0]][nb.at[1]] === 1;
    const nextLine = ctx.lines[ctx.next.line - 1] || '';
    const nNext = pairOf(ctx.next.vars, NB);
    let answer;
    if (same(nNext?.at, nb.at) && !/\bcontinue\b/.test(nextLine) && stored(ctx.next.vars, ctx.vars, ctx.params)) answer = 0;
    else if (/\bcontinue\b/.test(nextLine) || !same(nNext?.at, nb.at)) answer = nl < 0 ? 1 : 2;
    else return null;
    // a plain first visit, or the start's own walls (always kept), is not worth a question
    if (answer === 0 && (!wall || (src.at[0] === 0 && src.at[1] === 0))) return null;
    return {
      question: `From ${at(src.at)}, the walker would reach ${wall ? 'wall' : 'open tile'} ${at(nb.at)} with ${plural(nl, 'removal')} left. Is that state kept?`,
      options: ['Keep it: it joins the next ring', 'Skip it: no charge left for this wall', 'Skip it: this tile was reached before with as many charges left'],
      answer,
      explain: [
        `${at(nb.at)} with ${plural(nl, 'removal')} left is better than any earlier visit, so it is recorded and explored one step later.`,
        `Breaking ${at(nb.at)} would need a charge, but none is left (${nl} < 0).`,
        `An earlier, no-longer route reached ${at(nb.at)} with at least ${nl} charges left: this state cannot do better, so it is pruned.`,
      ][answer],
    };
  },
  bugs: [
    {
      label: 'Visited on the tile only',
      find: 'nl <= best[nr][nc]',
      replace: 'best[nr][nc] !== -1',
      explain: 'The first visit to a tile may have spent its charges. A later visit with more charges left is pruned, though only it can still blast through to the corner.',
    },
    {
      label: 'Walls cost nothing',
      find: 'const nl = left - grid[nr][nc];',
      replace: 'const nl = left;',
      explain: 'Stepping onto a wall never spends a charge, so the walker blasts through as many walls as it likes and finds routes that are too short.',
    },
  ],
};
