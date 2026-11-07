// Delete and Earn: taking value v earns every copy of it (v × count) but burns all v − 1 and v + 1, so it is House
// Robber over the values 0…max: best(v) = max(skip v → best(v − 1), take v → best(v − 2) + worth(v)). Works with a
// bucket row (sums or counts) and two rolling bests, a dp row (prefix or suffix) or a memo Map / object.
import { changedIdx, entriesOf, row } from './util.js';

const IDX = ['v', 'i', 'val', 'value', 'x', 'num', 'k', 'j', 'idx', 'index', 'h'];
const VAL = ['gain', 'earn', 'worth', 'money', 'pts'];
const NOT_BEST = /^(n|len|length|size|lo|hi|l|r|start|end|left|right|from|to|last|first|max|maxVal|maxV|mx|m|hi|top|limit)$/i;
const ints = (o) => Object.entries(o || {}).filter(([, v]) => Number.isInteger(v));
const code = (s) => (s || '').replace(/\/\/.*$/, '');
const houseOf = (i) => (Number.isInteger(i) ? `value ${i}` : 'this value');

/** the worth of every value 0…max (v × count), and the counts, from the input */
function worthOf(nums) {
  if (!Array.isArray(nums) || !nums.length || !nums.every((x) => Number.isInteger(x) && x >= 0 && x <= 100000)) return null;
  const max = Math.max(...nums);
  const sum = new Array(max + 1).fill(0);
  const cnt = new Array(max + 1).fill(0);
  for (const x of nums) (sum[x] += x), cnt[x]++;
  return { sum, cnt, max };
}
/** the learner's bucket rows (complete): sums, counts, or one copy each; [name, worth row] */
function bucketsOf(vars, params, W) {
  if (!W) return [];
  const out = [];
  for (const [k, v] of Object.entries(vars)) {
    const r = row(v);
    if (params.includes(k) || !r || r.length < W.max + 1 || r.length > W.max + 2) continue;
    const at = (i) => (i < r.length ? r[i] : 0);
    if (W.sum.every((s, i) => at(i) === s)) out.push([k, r]);
    else if (W.cnt.every((c, i) => at(i) === c)) out.push([k, r.map((c, i) => c * i)]);
    else if (W.cnt.every((c, i) => at(i) === (c ? i : 0))) out.push([k, r]);
  }
  return out;
}
/** a dp row of bests (not a parameter, not a bucket): [name, row] */
const dpOf = (vars, skip, n) => Object.entries(vars).filter(([k]) => !skip.includes(k)).map(([k, v]) => [k, row(v)]).find(([, r]) => r && r.length && r.length >= n && r.length <= n + 2 && r.every((x) => x === null || typeof x === 'number'));
/** a memo Map / object of bests: [name, entries] */
const memoOf = (vars, skip) => Object.entries(vars).filter(([k]) => !skip.includes(k)).map(([k, v]) => [k, entriesOf(v)]).find(([, m]) => m && m.length && m.every(([key, x]) => Number.isInteger(Number(key)) && typeof x === 'number'));

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
  const W = worthOf(ctx.input?.[0]);
  if (!W) return null;
  const buckets = bucketsOf(vars, ctx.params, W);
  const skip = [...ctx.params, ...buckets.map(([k]) => k)];
  const rows = [...buckets.map(([, r]) => r), W.sum];
  const d = dpOf(vars, skip, W.max + 1);
  const m = !d && memoOf(vars, skip);
  for (const houses of rows) {
    let p;
    if (d) {
      const before = row(prev[d[0]]);
      // a bucket still filling (`sum[x] += x`, `cnt[x]++`) looks like a dp row: not a decision
      const x = before ? changedIdx(d[1], before)[0] : undefined;
      if (Number.isInteger(x) && !/max|\?|>|</.test(code(src)) && W.cnt[x] && [x, 1].includes(d[1][x] - before[x])) return null;
      p = before && dpStep(d[1], before, houses);
    } else p = m ? memoStep(m[1], entriesOf(prev[m[0]]), houses) : rollStep(vars, prev, src, houses);
    if (p && !p.only) return p;
  }
  return null;
}

const names = (p) => (p.dir === 'fwd' ? [`best from value ${p.i + 2} up`, `best from value ${p.i + 1} up`] : [`best up to value ${p.i - 2}`, `best up to value ${p.i - 1}`]);
function note(p) {
  const [two, one] = Number.isInteger(p.i) ? names(p) : ['best two values back', 'best so far'];
  const head = `${houseOf(p.i)} (worth ${p.w})`;
  if (p.w === 0) return `${head}: nothing to earn, keep ${p.v}`;
  if (p.a === p.b + p.w) return `${head}: take it or skip it, both give ${p.v}`;
  return p.v === p.a ? `${head}: skip it, ${one} (${p.a}) beats ${p.w} + ${two} (${p.b}) = ${p.b + p.w}` : `${head}: take it, ${p.w} + ${two} (${p.b}) = ${p.v} beats skipping (${p.a})`;
}

export default {
  id: 'delete-and-earn',
  metaphor: 'Cashing in buckets, neighbours burn',
  caption: 'Every number goes into the bucket of its value. Cashing in bucket v earns all of it but burns buckets v − 1 and v + 1, so walk the buckets in order: take one on top of the best two back, or skip it.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the most points without ever taking two neighbouring values: ${ctx.value}`;
    const W = worthOf(ctx.input?.[0]);
    if (!W) return null;
    // filling the buckets: one cell grows by the number (a sum) or by 1 (a count)
    if (!/max/.test(code(ctx.src))) {
      for (const [k, v] of Object.entries(ctx.vars)) {
        const r = row(v);
        const b = row(ctx.prev[k]);
        if (ctx.params.includes(k) || !r || r.length < W.max + 1) continue;
        if (!b && bucketsOf(ctx.vars, ctx.params, W).some(([n]) => n !== k)) return `a cell per value 0…${r.length - 1}: the most points using values up to it`;
        if (!b) return r.every((c) => c === 0) && r.length <= W.max + 2 ? `a bucket for every value 0…${W.max}, all empty` : null;
        const ch = changedIdx(r, b);
        if (ch.length !== 1) continue;
        const x = ch[0];
        if (W.cnt[x] && r[x] - b[x] === x && x !== 1) return `a ${x} goes into bucket ${x}: it is now worth ${r[x]}`;
        if (W.cnt[x] && r[x] - b[x] === 1) return `a ${x} goes into bucket ${x}: ${r[x]} cop${r[x] === 1 ? 'y' : 'ies'} (worth ${r[x] * x})`;
      }
    }
    const p = decisionOf(ctx.vars, ctx.prev, ctx.src, ctx);
    if (p && p.only) return Number.isInteger(p.i) ? `best for values from ${p.i}: ${p.v}, remembered` : null;
    if (p) return note(p);
    if (!/max|\?|>|<|\+/.test(code(ctx.src))) {
      const now = ints(ctx.vars).filter(([k]) => !IDX.includes(k) && !VAL.includes(k) && !NOT_BEST.test(k));
      const moved = now.find(([k, v]) => k in ctx.prev && v !== ctx.prev[k]);
      const from = moved && now.find(([k, v]) => k !== moved[0] && v === moved[1] && ctx.vars[k] === ctx.prev[k]);
      if (from) return `on to the next value: ${moved[0]} takes ${from[0]}'s ${moved[1]}`;
    }
    return null;
  },
  // before a bucket is decided: take it (burning its neighbours) or skip it?
  predict(ctx) {
    if (!ctx.next) return null;
    const p = decisionOf(ctx.next.vars, ctx.vars, ctx.lines?.[ctx.next.line - 1], ctx);
    if (!p || p.only || !Number.isInteger(p.i) || p.a === p.b + p.w || (p.a === 0 && p.b === 0) || p.w === 0) return null;
    const [two, one] = names(p);
    const take = p.v !== p.a;
    return {
      question: `Bucket ${p.i} is worth ${p.w}. Taking it adds to the ${two} (${p.b}); skipping keeps the ${one} (${p.a}). Take it or skip it?`,
      options: ['Take it', 'Skip it'],
      answer: take ? 0 : 1,
      explain: take ? `${p.w} + ${p.b} = ${p.v} is more than ${p.a}: worth burning the neighbours.` : `${p.w} + ${p.b} = ${p.b + p.w} is less than ${p.a}: the neighbours are worth more.`,
    };
  },
  bugs: [
    {
      label: 'Count each value once, not every copy',
      find: 'points[x] += x;',
      replace: 'points[x] = x;',
      explain: 'Taking a value earns all its copies: three 3s are worth 9, not 3. [2,2,3,3,3,4] gives 6 instead of 9.',
    },
    {
      label: 'Stop before the biggest value',
      find: 'v <= maxVal',
      replace: 'v < maxVal',
      explain: 'The last bucket is never looked at, so its points are lost: [3,4,2] gives 3 instead of 6.',
    },
  ],
};
