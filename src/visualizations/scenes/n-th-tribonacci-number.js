// N-th Tribonacci Number: T(k) = T(k−3) + T(k−2) + T(k−1). Works with three rolling counts (any names, also
// `[a, b, c] = [b, c, a + b + c]`), a dp row, or a memo Map / object (recursion).
import { changedIdx, entriesOf, options, row } from './util.js';

const DP = ['dp', 'memo', 'cache', 'table', 'f', 't', 'trib', 'T', 'seq', 'arr'];
const IDX = ['i', 'k', 'idx', 'j', 'step'];
const TRIB = [0, 1, 1];
while (TRIB.length < 40) TRIB.push(TRIB[TRIB.length - 1] + TRIB[TRIB.length - 2] + TRIB[TRIB.length - 3]);
/** k with T(k) = v, when v identifies it (v ≥ 2) */
const kOf = (v) => (Number.isInteger(v) && v >= 2 ? TRIB.indexOf(v) : -1);
const ints = (vars, params) => Object.entries(vars).filter(([k, v]) => Number.isInteger(v) && !params.includes(k) && !IDX.includes(k));
const dpOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length && r.every((x) => typeof x === 'number'));
const memoOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => entriesOf(vars[k])).find(Boolean);
const has = (vals, want) => want.every((w) => vals.filter((x) => x === w).length >= want.filter((x) => x === w).length);

/** a new count in `now` that is T(k), with T(k−3), T(k−2), T(k−1) all present in `before`: { k, v } */
function sumStep(now, before, params, line) {
  const target = /\+/.test(line || '') ? /^\s*(?:const|let|var)?\s*(\w+)\s*=[^=]/.exec(line)?.[1] : undefined;
  const old = ints(before, params).map(([, x]) => x);
  for (const [t, v] of ints(now, params)) {
    if (v === before[t] && t !== target) continue;
    // a slide (c = next) copies a value that is still there
    if (t !== target && ints(now, params).some(([o, x]) => o !== t && x === v && now[o] === before[o])) continue;
    const k = kOf(v);
    if (k >= 3 && has(old, [TRIB[k - 3], TRIB[k - 2], TRIB[k - 1]])) return { k, v };
  }
  return null;
}

/** the T(k) about to appear in `after`: { k, v } from a dp row, a memo or rolling counts */
function nextSum(ctx, now, after, line) {
  const d = dpOf(now, ctx.params);
  if (d) {
    const r = row(after[d[0]]);
    const ch = r ? changedIdx(r, d[1]) : [];
    const k = ch[0];
    return ch.length === 1 && k >= 3 && r[k] === r[k - 1] + r[k - 2] + r[k - 3] ? { k, v: r[k], parts: [r[k - 3], r[k - 2], r[k - 1]] } : null;
  }
  const m = memoOf(now, ctx.params);
  if (m) {
    const m2 = memoOf(after, ctx.params) || [];
    const e = m2.length === m.length + 1 && m2.find(([key]) => !m.some(([w]) => w === key));
    let k = e && Number(e[0]);
    if (!e) {
      // the sum of three calls worked out into a variable before it is remembered
      const t = /\+/.test(line || '') ? /^\s*(?:const|let|var)?\s*(\w+)\s*=[^=]/.exec(line)?.[1] : undefined;
      k = t && t in after && !ctx.params.includes(t) ? kOf(after[t]) : -1;
      return k >= 3 ? { k, v: TRIB[k], parts: [TRIB[k - 3], TRIB[k - 2], TRIB[k - 1]], calc: true } : null;
    }
    return k >= 3 && e[1] === TRIB[k] ? { k, v: e[1], parts: [TRIB[k - 3], TRIB[k - 2], TRIB[k - 1]] } : null;
  }
  const s = sumStep(after, now, ctx.params, line);
  return s && { ...s, parts: [TRIB[s.k - 3], TRIB[s.k - 2], TRIB[s.k - 1]] };
}

export default {
  id: 'n-th-tribonacci-number',
  metaphor: 'A three-card window sliding along',
  caption: 'Three face-up cards hold the last three numbers. The next card is their sum; then the window slides one card to the right and the oldest card drops out.',
  narrate(ctx) {
    const n = ctx.input?.[0];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return Number.isInteger(n) && n <= 2 ? `T(${n}) = ${ctx.value} is one of the three starting cards` : `T(${n}) = ${ctx.value}`;
    const d = dpOf(ctx.vars, ctx.params);
    if (d && !row(ctx.prev[d[0]])) return `a cell for every T(0)…T(${d[1].length - 1}), starting cards 0, 1, 1`;
    const s = nextSum(ctx, ctx.prev, ctx.vars, ctx.src);
    if (s && memoOf(ctx.vars, ctx.params) && !s.calc && ints(ctx.prev, ctx.params).some(([, v]) => v === s.v)) return `card T(${s.k}) = ${s.v} remembered: it is never worked out again`;
    if (s) return `next card T(${s.k}) = T(${s.k - 3}) + T(${s.k - 2}) + T(${s.k - 1}) = ${s.parts.join(' + ')} = ${s.v}${memoOf(ctx.vars, ctx.params) && !s.calc ? ', remembered' : ''}`;
    if (d || memoOf(ctx.vars, ctx.params)) return null;
    // a slide: one count takes another's value
    const moved = ints(ctx.vars, ctx.params).find(([k, v]) => k in ctx.prev && v !== ctx.prev[k]);
    const src = moved && ints(ctx.vars, ctx.params).find(([k, v]) => k !== moved[0] && v === moved[1] && ctx.vars[k] === ctx.prev[k]);
    if (src) return `slide the window: ${moved[0]} takes ${src[0]}’s card ${moved[1]}`;
    const start = ints(ctx.vars, ctx.params).map(([, v]) => v);
    return !ints(ctx.prev, ctx.params).length && start.length >= 3 && start.slice(0, 3).join() === '0,1,1' ? 'the three starting cards: T(0) = 0, T(1) = 1, T(2) = 1' : null;
  },
  // before the next card is laid: what is it?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = nextSum(ctx, ctx.vars, ctx.next.vars, ctx.lines[ctx.next.line - 1]);
    // the card is already on screen (worked out a step before it is remembered)
    if (!s || ints(ctx.vars, ctx.params).some(([, v]) => v === s.v)) return null;
    const [a, b, c] = s.parts;
    return options(
      `What is the next card, T(${s.k})?`,
      s.v,
      [b + c, 2 * c, s.v + 1, s.v - 1].filter((w) => w !== s.v),
      `T(${s.k}) is the sum of the three cards before it: ${a} + ${b} + ${c} = ${s.v}.`,
    );
  },
  bugs: [
    {
      label: 'Slide the window in the wrong order',
      find: 'a = b;\n    b = c;',
      replace: 'b = c;\n    a = b;',
      explain: 'b is overwritten first, so a copies the new b (the old c) instead of the old b; one card is lost and the sums drift from T(5) on.',
    },
    {
      label: 'Stop the loop one card early',
      find: 'i <= n',
      replace: 'i < n',
      explain: 'The loop lays cards up to T(n−1) only, so it returns the card before the one asked for.',
    },
  ],
};
