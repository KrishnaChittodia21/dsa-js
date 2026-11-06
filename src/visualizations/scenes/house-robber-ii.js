// House Robber II: the street is a circle, so house 0 and the last house are neighbours. Run the straight-street
// robber twice (without the last house, then without house 0) and keep the better haul. Each pass decides
// best = max(skip → best so far, rob → best two back + worth). Works with two rolling bests, a dp row (also over a
// sliced copy or a lo…hi range) or a memo Map / object.
import { changedIdx, entriesOf, functionAt, row } from './util.js';

const IDX = ['i', 'j', 'k', 'idx', 'index', 'pos'];
const VAL = ['money', 'x', 'num', 'val', 'value', 'house', 'cash', 'amount', 'amt', 'gold', 'loot', 'worth', 'coins', 'h'];
const NOT_BEST = /^(n|len|length|size|lo|hi|l|r|s|e|start|end|left|right|from|to|last|first|begin|stop)$/;
const RANGES = [['lo', 'hi'], ['start', 'end'], ['l', 'r'], ['s', 'e'], ['from', 'to'], ['left', 'right'], ['begin', 'stop'], ['first', 'last']];
const ints = (o) => Object.entries(o || {}).filter(([, v]) => Number.isInteger(v));
const code = (s) => (s || '').replace(/\/\/.*$/, '');
const houseOf = (i) => (Number.isInteger(i) ? `house ${i}` : 'this house');
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** the pass's lo…hi range when the code passes one: [lo, hi] */
function rangeOf(vars, n) {
  for (const [a, b] of RANGES) if (Number.isInteger(vars[a]) && Number.isInteger(vars[b]) && vars[a] >= 0 && vars[b] < n + 1) return [vars[a], vars[b] === n ? n - 1 : vars[b]];
  return null;
}
/** the streets a pass can work on: [name, houses, offset of its house 0 in the circle (undefined: unsure)] */
function streetsOf(vars, input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const [k, v] of Object.entries(vars)) {
    const r = row(v);
    if (!r || !r.length || r.length !== input.length - 1) continue;
    const a = same(r, input.slice(1));
    const b = same(r, input.slice(0, -1));
    if (a || b) out.push([k, r, a && b ? undefined : a ? 1 : 0]);
  }
  const rg = rangeOf(vars, input.length);
  if (rg && rg[1] - rg[0] + 1 < input.length) out.push([null, input.slice(rg[0], rg[1] + 1), rg[0]]);
  return out;
}

/** a dp row of bests (not a parameter, not a street): [name, row] */
const dpOf = (vars, skip, n) => Object.entries(vars).filter(([k]) => !skip.includes(k)).map(([k, v]) => [k, row(v)]).find(([, r]) => r && r.length && r.length >= n && r.length <= n + 2 && r.every((x) => x === null || typeof x === 'number'));
/** a memo Map / object of bests: [name, entries] */
const memoOf = (vars, skip) => Object.entries(vars).filter(([k]) => !skip.includes(k)).map(([k, v]) => [k, entriesOf(v)]).find(([, m]) => m && m.every(([key, x]) => Number.isInteger(Number(key)) && typeof x === 'number'));

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

const shift = (p, off) => (p ? { ...p, i: Number.isInteger(p.i) && Number.isInteger(off) ? p.i + off : undefined } : p);

function decisionOf(vars, prev, src, ctx) {
  const input = ctx.input?.[0];
  if (!Array.isArray(input)) return null;
  const streets = streetsOf(vars, input);
  const skip = [...ctx.params, ...streets.map(([k]) => k)];
  for (const [, houses, off] of [...streets, [null, input, 0]]) {
    const d = dpOf(vars, skip, houses.length);
    if (!d) continue;
    const before = row(prev[d[0]]);
    const p = before && dpStep(d[1], before, houses);
    if (p) return shift(p, off);
  }
  for (const [, houses, off] of [[null, input, 0], ...streets]) {
    const m = memoOf(vars, skip);
    const p = m ? memoStep(m[1], entriesOf(prev[m[0]]), houses) : rollStep(vars, prev, src, houses);
    if (p && !p.only) return houses === input ? p : shift(p, off);
  }
  return null;
}

const names = (p) => (p.dir === 'fwd' ? [`best from house ${p.i + 2} on`, `best from house ${p.i + 1} on`] : ['best two back', 'best so far']);
function note(p) {
  const [two, one] = names(p);
  const head = p.dir === 'fwd' ? `from ${houseOf(p.i)} (worth ${p.w}) on` : `${houseOf(p.i)} (worth ${p.w})`;
  if (p.a === p.b + p.w) return `${head}: rob it or skip it, both give ${p.v}`;
  return p.v === p.a ? `${head}: skip it, ${one} (${p.a}) beats ${p.w} + ${two} (${p.b}) = ${p.b + p.w}` : `${head}: rob it, ${p.w} + ${two} (${p.b}) = ${p.v} beats skipping it (${p.a})`;
}

/** the name of the main function: the one the code's last line closes */
function mainOf(lines) {
  let at = (lines || []).length;
  while (at > 1 && !lines[at - 1].trim()) at--;
  return functionAt(lines || [], at);
}

export default {
  id: 'house-robber-ii',
  metaphor: 'A burglar on a ring of houses',
  caption: 'The houses stand in a circle, so the first and the last are neighbours too. Two passes along a straight street: one leaves the last house shut, one leaves house 0 shut; the better haul wins.',
  narrate(ctx) {
    const input = ctx.input?.[0];
    const n = Array.isArray(input) ? input.length : -1;
    if (ctx.ret) {
      if (!Number.isInteger(ctx.value)) return null;
      const inHelper = functionAt(ctx.lines || [], ctx.line) !== mainOf(ctx.lines);
      if (inHelper) return `this pass can carry off ${ctx.value}`;
      if (n === 1) return `only one house: it has no neighbour, rob it for ${ctx.value}`;
      return ctx.next ? null : `the better of the two passes: ${ctx.value}`;
    }
    // a new pass starts: a range or a sliced copy of the street appears
    const rg = rangeOf(ctx.vars, n);
    const was = rangeOf(ctx.prev, n);
    if (rg && (!was || was[0] !== rg[0] || was[1] !== rg[1]) && n > 1) {
      if (rg[0] === 0 && rg[1] === n - 2) return `pass 1: houses 0…${n - 2}, house ${n - 1} stays shut (it neighbours house 0)`;
      if (rg[0] === 1 && rg[1] === n - 1) return `pass 2: houses 1…${n - 1}, house 0 stays shut (it neighbours house ${n - 1})`;
    }
    const st = streetsOf(ctx.vars, input).find(([k]) => k && !same(row(ctx.prev[k]) || [], row(ctx.vars[k])));
    if (st && Number.isInteger(st[2])) return st[2] === 1 ? `a street without house 0: houses 1…${n - 1}` : `a street without the last house: houses 0…${n - 2}`;
    const p = decisionOf(ctx.vars, ctx.prev, ctx.src, ctx);
    if (p) return note(p);
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
    if (!p || p.a === p.b + p.w || (p.a === 0 && p.b === 0) || p.w === 0) return null;
    const [two, one] = names(p);
    const rob = p.v !== p.a;
    const h = houseOf(p.i);
    return {
      question: `${h[0].toUpperCase()}${h.slice(1)} holds ${p.w}. Robbing it adds to the ${two} (${p.b}); skipping keeps the ${one} (${p.a}). Rob it or skip it?`,
      options: ['Rob it', 'Skip it'],
      answer: rob ? 0 : 1,
      explain: rob ? `${p.w} + ${p.b} = ${p.v} is more than ${p.a}, so robbing it pays.` : `${p.w} + ${p.b} = ${p.b + p.w} is less than ${p.a}: skipping keeps more.`,
    };
  },
  bugs: [
    {
      label: 'One pass over the whole circle',
      find: 'return Math.max(line(0, n - 2), line(1, n - 1));',
      replace: 'return line(0, n - 1);',
      explain: 'A single straight pass may rob both house 0 and the last house, which are neighbours on the ring: [2,3,2] gives 4 instead of 3.',
    },
    {
      label: 'Forget the single house',
      find: 'if (n === 1) return nums[0];',
      replace: '',
      explain: 'With one house both passes cover no houses at all, so the answer comes out 0 instead of that house’s worth.',
    },
  ],
};
