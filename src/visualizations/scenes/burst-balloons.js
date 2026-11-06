// Burst Balloons (interval DP). The row gets a wall worth 1 at each end; cell (i, j) of the table is the most coins
// from bursting every balloon strictly between spots i and j. Pick k as the LAST balloon to burst in that gap: by then
// its neighbours are the gap's ends, so it pays a[i]·a[k]·a[j], plus the best of the two smaller gaps (i, k) and (k, j).
// Works with a padded row and a square table (bottom-up dp or a memo filled by recursion) under any names.
import { options, row, writtenCell } from './util.js';

const I = ['i', 'l', 'left', 'lo', 'start', 's', 'from'];
const J = ['j', 'r', 'right', 'hi', 'end', 'e', 'to'];
const K = ['k', 'last', 'mid', 'p', 'x', 't', 'b', 'idx'];
const code = (s) => (s || '').replace(/\/\/.*$/, '');

/** the padded row: [1, ...nums, 1] under any name */
function paddedOf(vars, ctx) {
  const nums = ctx.input?.[0];
  if (!Array.isArray(nums)) return null;
  const hit = Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && row(v) && v.length === nums.length + 2 && v[0] === 1 && v[v.length - 1] === 1 && nums.every((x, q) => v[q + 1] === x));
  return hit ? hit[1] : null;
}
/** the square table of gap values (dp, or a memo with −1 / null for "not yet") */
function tableOf(vars, ctx, m) {
  const hit = Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && Array.isArray(v) && v.length === m && v.every((r) => row(r) && r.length === m));
  return hit || null;
}
const firstOf = (vars, names) => names.find((k) => Number.isInteger(vars[k]));

/** the gap (i, j) and last balloon k this step is about */
function gapOf(vars, a) {
  const [ik, jk, kk] = [firstOf(vars, I), firstOf(vars, J), firstOf(vars, K)];
  if (!ik || !jk) return null;
  const [i, j] = [vars[ik], vars[jk]];
  if (!(i >= 0 && i < j && j < a.length)) return null;
  const k = kk && vars[kk] > i && vars[kk] < j ? vars[kk] : undefined;
  return { i, j, k };
}

/** a candidate this line computes: k burst last in (i, j); `total` = product + left gap + right gap */
function candOf(vars, prev, src, ctx) {
  const a = paddedOf(vars, ctx);
  const t = a && tableOf(vars, ctx, a.length);
  const g = a && gapOf(vars, a);
  if (!t || !g || g.k === undefined) return null;
  const { i, j, k } = g;
  const sub = (x, y) => (y - x <= 1 ? 0 : t[1][x][y]);
  const [L, R] = [sub(i, k), sub(k, j)];
  if (!Number.isInteger(L) || !Number.isInteger(R) || L < 0 || R < 0) return null;
  const prod = a[i] * a[k] * a[j];
  const total = prod + L + R;
  const lhs = /^\s*(?:const|let|var)?\s*([A-Za-z_$][\w$]*)\s*=(?!=)/.exec(code(src))?.[1];
  if (!lhs || !Number.isInteger(vars[lhs]) || lhs === t[0]) return null;
  // `coins = …` holds the candidate; `best = Math.max(best, …)` keeps the larger one
  if (vars[lhs] === total || (Number.isInteger(prev[lhs]) && /max/.test(src) && vars[lhs] === Math.max(prev[lhs], total))) return { a, i, j, k, L, R, prod, total, name: lhs, now: vars[lhs], was: prev[lhs] };
  return null;
}

const gap = (i, j) => `gap (${i}, ${j})`;
const lastIs = (c) => `last balloon in ${gap(c.i, c.j)} is the ${c.a[c.k]} (spot ${c.k})`;
const sum = (c) => `${c.a[c.i]}·${c.a[c.k]}·${c.a[c.j]} + left ${c.L} + right ${c.R} = ${c.total}`;

export default {
  id: 'burst-balloons',
  metaphor: 'Pick the last balloon to pop',
  caption: 'Spots 0 and the last are walls worth 1. Cell (i, j) is the most coins from popping every balloon strictly between spots i and j. The last balloon popped there pays wall·it·wall, plus the best of the two smaller gaps beside it.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the whole row, wall to wall, is worth ${ctx.value} coins`;
    const a = paddedOf(ctx.vars, ctx);
    if (a && !paddedOf(ctx.prev, ctx)) return `walls worth 1 at both ends (spots 0 and ${a.length - 1}): they are never popped`;
    const c = candOf(ctx.vars, ctx.prev, ctx.src, ctx);
    if (c) {
      // a running best next to the candidate: say whether it wins
      const best = Object.entries(ctx.vars).find(([k, v]) => k !== c.name && /best|max|res|ans|most|top/i.test(k) && Number.isInteger(v) && !ctx.params.includes(k));
      if (c.now !== c.total) return `${lastIs(c)}: ${sum(c)}, not more than ${c.now}`;
      if (best && c.was !== undefined && /max/.test(ctx.src)) return `${lastIs(c)}: ${sum(c)}`;
      return `${lastIs(c)}: ${sum(c)}${best ? (c.total > best[1] ? `, beats ${best[0]} ${best[1]}` : `, not more than ${best[1]}`) : ''}`;
    }
    if (!a) return null;
    const t = tableOf(ctx.vars, ctx, a.length);
    const w = writtenCell(ctx.src, ctx.vars);
    if (t && w && w.name === t[0] && w.at.length === 2) {
      const [i, j] = w.at;
      const v = t[1][i]?.[j];
      if (!Number.isInteger(v)) return null;
      if (j - i <= 1) return `${gap(i, j)} holds no balloon: 0 coins`;
      return `${gap(i, j)} settled: popping its ${j - i - 1} balloon${j - i === 2 ? '' : 's'} earns at most ${v} coins`;
    }
    if (t && !tableOf(ctx.prev, ctx, a.length)) return `a cell per gap (i, j): the most coins from popping everything between spots i and j`;
    // a running best that grew on its own line (`if (coins > best) best = coins`)
    const g = gapOf(ctx.vars, a);
    const was = gapOf(ctx.prev, a);
    if (g && ctx.ret && Number.isInteger(ctx.value) && ctx.next) {
      if (g.j - g.i < 2) return `${gap(g.i, g.j)} is empty: 0 coins`;
      const fresh = !was || was.i !== g.i || was.j !== g.j;
      return fresh ? `${gap(g.i, g.j)} was settled before: reuse its ${ctx.value} coins` : `hand back ${gap(g.i, g.j)}: ${ctx.value} coins`;
    }
    if (g && g.k === undefined && (!was || was.i !== g.i || was.j !== g.j)) {
      if (g.j - g.i < 2) return `${gap(g.i, g.j)} is empty: 0 coins`;
      return `next ${gap(g.i, g.j)}: balloons ${a.slice(g.i + 1, g.j).join(', ')} between the ends ${a[g.i]} and ${a[g.j]}`;
    }
    const up = Object.entries(ctx.vars).find(([k, v]) => /best|max|res|ans|most|top/i.test(k) && Number.isInteger(v) && Number.isInteger(ctx.prev[k]) && v > ctx.prev[k]);
    if (g && up) return `new best for ${gap(g.i, g.j)}: ${up[1]} coins${g.k !== undefined ? ` (the ${a[g.k]} last)` : ''}`;
    return null;
  },
  // before a candidate is added up: how many coins if this balloon goes last?
  predict(ctx) {
    if (!ctx.next) return null;
    const c = candOf(ctx.next.vars, ctx.vars, ctx.lines?.[ctx.next.line - 1], ctx);
    if (!c || c.now !== c.total || c.L + c.R === 0) return null;
    const near = c.a[c.k - 1] * c.a[c.k] * c.a[c.k + 1] + c.L + c.R;
    return options(
      `In ${gap(c.i, c.j)} the ${c.a[c.k]} (spot ${c.k}) is popped last. Its left gap is worth ${c.L}, its right gap ${c.R}. How many coins in all?`,
      c.total,
      [c.prod, near, c.L + c.R + c.a[c.k]],
      `Popped last, its neighbours are the gap's ends ${c.a[c.i]} and ${c.a[c.j]}: ${sum(c)}.`,
    );
  },
  bugs: [
    {
      label: 'Forget the walls',
      find: 'const a = [1, ...nums, 1];',
      replace: 'const a = [...nums];',
      explain: 'Without the 1-walls the outer balloons have nothing to multiply with: a single balloon [5] earns 0 instead of 5.',
    },
    {
      label: 'Multiply by the original neighbours',
      find: 'a[i] * a[k] * a[j]',
      replace: 'a[k - 1] * a[k] * a[k + 1]',
      explain: 'k is popped LAST in the gap, so its neighbours by then are the gap ends i and j, not the balloons next to it at the start.',
    },
  ],
};
