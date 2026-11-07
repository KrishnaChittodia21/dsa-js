// House Robber: best(i) = max(skip house i → best(i−1), rob it → best(i−2) + nums[i]). Works with two rolling
// bests (any names, also `[a, b] = [b, Math.max(…)]`), a dp row (prefix or suffix) or a memo Map / object (recursion).
import { changedIdx, entriesOf, row } from './util.js';

const IDX = ['i', 'j', 'k', 'idx', 'index', 'pos'];
const VAL = ['money', 'x', 'num', 'val', 'value', 'house', 'cash', 'amount', 'amt', 'gold', 'loot', 'worth', 'coins', 'h'];
const NOT_BEST = /^(n|len|length|size|lo|hi|l|r|start|end|left|right|from|to|last|first)$/;
const ints = (o) => Object.entries(o || {}).filter(([, v]) => Number.isInteger(v));
const code = (s) => (s || '').replace(/\/\/.*$/, '');
const houseOf = (i) => (Number.isInteger(i) ? `house ${i}` : 'this house');

/** a dp row of bests (not a parameter): [name, row] */
const dpOf = (vars, params, n) => Object.entries(vars).filter(([k]) => !params.includes(k)).map(([k, v]) => [k, row(v)]).find(([, r]) => r && r.length && r.length >= n && r.length <= n + 2 && r.every((x) => x === null || typeof x === 'number'));
/** a memo Map / object of bests: [name, entries] */
const memoOf = (vars, params) => Object.entries(vars).filter(([k]) => !params.includes(k)).map(([k, v]) => [k, entriesOf(v)]).find(([, m]) => m && m.every(([key, x]) => Number.isInteger(Number(key)) && typeof x === 'number'));

/** a rolling step: a best that became max(a, b + w), a / b two older bests, w the house's worth */
function rollStep(now, before, src, houses) {
  if (!/max|\?|>|<|\+/.test(code(src)) || !Array.isArray(houses)) return null;
  // the names this line writes (`const cur =`, `[a, b] =`, `dp[i] =` → dp): they are bests, never the house's worth
  const lhs = (/^\s*(?:const|let|var)?\s*(\[[^\]]*\]|[A-Za-z_$][\w$]*)[^=]*?\+?=(?!=)/.exec(code(src))?.[1] || '').match(/[A-Za-z_$][\w$]*/g) || [];
  const target = lhs.length === 1 ? lhs[0] : undefined;
  const worths = [];
  for (const k of IDX) if (Number.isInteger(now[k]) && Number.isInteger(houses[now[k]])) worths.push([k, houses[now[k]], now[k]]);
  for (const [k, v] of ints(now)) {
    if (!houses.includes(v) || lhs.includes(k) || IDX.includes(k) || NOT_BEST.test(k) || !(VAL.includes(k) || before[k] !== v)) continue;
    worths.push([k, v, houses.indexOf(v) === houses.lastIndexOf(v) ? houses.indexOf(v) : undefined]);
  }
  // the best this line writes (it may keep its old value when the house is skipped), else any best that changed
  const changed = ints(now).filter(([k, v]) => (k === target || before[k] !== v) && !IDX.includes(k) && !VAL.includes(k) && !NOT_BEST.test(k));
  changed.sort(([k]) => (k === target ? -1 : 0));
  for (const [t, v] of changed) {
    for (const [wk, w, i] of worths) {
      if (wk === t) continue;
      // t's own old value counts too: `[a, b] = [b, Math.max(b, a + x)]` overwrites the best so far in place
      const pool = ints(before).filter(([k]) => k !== wk && !IDX.includes(k) && !VAL.includes(k) && !NOT_BEST.test(k));
      let best = null;
      for (const [ka, a] of pool) {
        for (const [kb, b] of pool) {
          if (ka === kb || a < b || v !== Math.max(a, b + w)) continue;
          if (!best || a > best.a || (a === best.a && b > best.b)) best = { a, b };
        }
      }
      if (best) return { ...best, v, w, i, dir: 'back' };
    }
  }
  return null;
}

/** a dp cell that changed: prefix (from the two cells before) or suffix (from the two cells after) */
function dpStep(dp, before, houses) {
  const ch = changedIdx(dp, before);
  if (ch.length !== 1 || !Array.isArray(houses)) return null;
  const x = ch[0];
  const v = dp[x];
  const filled = (c) => typeof c === 'number' && c !== 0;
  const after = dp.slice(x + 1).some(filled);
  const suffix = after || (!dp.slice(0, x).some(filled) && x > dp.length / 2);
  const at = (j) => (j < 0 || j >= dp.length ? 0 : dp[j]);
  // a row one longer than the street is shifted: cell x covers the first x houses, so its house is x − 1
  const off = dp.length === houses.length + 1 ? 1 : 0;
  const tries = suffix ? [[x, at(x + 1), at(x + 2), 'fwd']] : [[x - off, at(x - 1), at(x - 2), 'back']];
  for (const [i, a, b, dir] of tries) {
    const w = houses[i];
    if (Number.isInteger(w) && typeof a === 'number' && typeof b === 'number' && v === Math.max(a, b + w)) return { a, b, v, w, i, dir };
  }
  return null;
}

/** a memo entry just added: best from house k on (forward) or best of houses 0…k (backward) */
function memoStep(m, was, houses) {
  if (!m || !Array.isArray(houses) || m.length !== (was || []).length + 1) return null;
  const [key, v] = m[m.length - 1];
  const i = Number(key);
  const w = houses[i];
  if (!Number.isInteger(w) || typeof v !== 'number') return { i, v, only: true };
  const n = houses.length;
  const get = (j, out) => m.find(([kk]) => Number(kk) === j)?.[1] ?? (out ? 0 : undefined);
  const f = [get(i + 1, i + 1 >= n), get(i + 2, i + 2 >= n)];
  if (f.every((x) => typeof x === 'number') && v === Math.max(f[0], f[1] + w)) return { a: f[0], b: f[1], v, w, i, dir: 'fwd' };
  const g = [get(i - 1, i - 1 < 0), get(i - 2, i - 2 < 0)];
  if (g.every((x) => typeof x === 'number') && v === Math.max(g[0], g[1] + w)) return { a: g[0], b: g[1], v, w, i, dir: 'back' };
  return { i, v, only: true };
}

function decisionOf(vars, prev, src, ctx) {
  const houses = ctx.input?.[0] ?? vars[ctx.params[0]];
  const n = Array.isArray(houses) ? houses.length : -1;
  const d = dpOf(vars, ctx.params, n);
  if (d) {
    const before = row(prev[d[0]]);
    return before ? dpStep(d[1], before, houses) : null;
  }
  const m = memoOf(vars, ctx.params);
  if (m) return memoStep(m[1], entriesOf(prev[m[0]]), houses);
  return rollStep(vars, prev, src, houses);
}

const names = (p) => (p.dir === 'fwd' ? [`best from house ${p.i + 2} on`, `best from house ${p.i + 1} on`] : ['best two back', 'best so far']);
function note(p) {
  const [two, one] = names(p);
  const head = p.dir === 'fwd' ? `from ${houseOf(p.i)} (worth ${p.w}) on` : `${houseOf(p.i)} (worth ${p.w})`;
  if (p.a === p.b + p.w) return `${head}: rob it or skip it, both give ${p.v}`;
  return p.v === p.a ? `${head}: skip it, ${one} (${p.a}) beats ${p.w} + ${two} (${p.b}) = ${p.b + p.w}` : `${head}: rob it, ${p.w} + ${two} (${p.b}) = ${p.v} beats skipping it (${p.a})`;
}

export default {
  id: 'house-robber',
  metaphor: 'A burglar on a street of alarmed houses',
  caption: 'Neighbouring houses share an alarm, so the burglar never robs two in a row. At each house: rob it on top of the best haul two houses back, or skip it and keep the best haul so far.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the biggest haul without robbing two neighbours: ${ctx.value}`;
    const houses = ctx.input?.[0];
    const d = dpOf(ctx.vars, ctx.params, Array.isArray(houses) ? houses.length : -1);
    if (d && !row(ctx.prev[d[0]])) return `a cell per house: the best haul ${d[1].length === houses?.length ? 'up to that house' : 'from the houses so far'}`;
    const p = decisionOf(ctx.vars, ctx.prev, ctx.src, ctx);
    if (p && p.only) return Number.isInteger(p.i) ? `best haul for house ${p.i}'s part of the street: ${p.v}, remembered` : null;
    if (p) return note(p);
    if (d) {
      const ch = changedIdx(d[1], row(ctx.prev[d[0]]));
      const x = ch[0];
      if (ch.length === 1 && Array.isArray(houses) && d[1][x] === houses[x] && x === 0) return `house 0 alone: rob it, ${houses[0]}`;
      return null;
    }
    // a slide: one best takes another's value, ready for the next house
    if (!/max|\?|>|<|\+/.test(code(ctx.src))) {
      const now = ints(ctx.vars).filter(([k]) => !IDX.includes(k) && !VAL.includes(k) && !NOT_BEST.test(k));
      const moved = now.find(([k, v]) => k in ctx.prev && v !== ctx.prev[k]);
      const from = moved && now.find(([k, v]) => k !== moved[0] && v === moved[1] && ctx.vars[k] === ctx.prev[k]);
      if (from) return `move one house on: ${moved[0]} takes ${from[0]}'s ${moved[1]}`;
    }
    return null;
  },
  // before a house is decided: rob it or skip it?
  predict(ctx) {
    if (!ctx.next) return null;
    const p = decisionOf(ctx.next.vars, ctx.vars, ctx.lines?.[ctx.next.line - 1], ctx);
    if (!p || p.only || p.a === p.b + p.w || (p.a === 0 && p.b === 0) || p.w === 0) return null;
    const [two, one] = names(p);
    const rob = p.v !== p.a;
    const opts = ['Rob it', 'Skip it'];
    return {
      question: `${houseOf(p.i)[0].toUpperCase()}${houseOf(p.i).slice(1)} holds ${p.w}. Robbing it adds to the ${two} (${p.b}); skipping keeps the ${one} (${p.a}). Rob it or skip it?`,
      options: opts,
      answer: rob ? 0 : 1,
      explain: rob ? `${p.w} + ${p.b} = ${p.v} is more than ${p.a}, so robbing it pays.` : `${p.w} + ${p.b} = ${p.b + p.w} is less than ${p.a}: skipping keeps more.`,
    };
  },
  bugs: [
    {
      label: 'Slide the bests in the wrong order',
      find: 'prev2 = prev1;\n    prev1 = cur;',
      replace: 'prev1 = cur;\n    prev2 = prev1;',
      explain: 'prev1 is overwritten first, so prev2 copies the new best too: the next house is added to a haul that already robbed its neighbour.',
    },
    {
      label: 'Add the house to the best so far',
      find: 'prev2 + money',
      replace: 'prev1 + money',
      explain: 'The best so far may include the house right next door, so the burglar ends up robbing neighbours: [1,2,3,1] gives 7 instead of 4.',
    },
  ],
};
