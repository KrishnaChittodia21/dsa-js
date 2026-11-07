// Min Cost Climbing Stairs: best(i) = cheapest way to stand on step i (you pay a step's toll when you leave it), so
// best(i) = min(best(i−1) + cost[i−1], best(i−2) + cost[i−2]). Also the "pay on arrival" form
// best(i) = cost[i] + min(best(i−1), best(i−2)). Works with rolling counts (any names), a dp row, or a memo Map / object.
import { changedIdx, entriesOf, options, row } from './util.js';

const DP = ['dp', 'memo', 'cache', 'best', 'minCost', 'table', 'f', 'total', 'cheapest'];
const IDX = ['i', 'step', 'k', 'idx', 'j', 'pos'];
const SKIP = ['n', 'len', 'length', 'size', 'top'];
const ints = (vars, params) => Object.entries(vars).filter(([k, v]) => Number.isInteger(v) && !params.includes(k) && !IDX.includes(k) && !SKIP.includes(k));
const dpOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length && r.every((x) => typeof x === 'number'));
const memoOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => entriesOf(vars[k])).find(Boolean);
const idxOf = (vars) => IDX.map((k) => vars[k]).find(Number.isInteger);

/** how best(i) = v comes about from p = best(i−1), q = best(i−2): { arrive, A, B, from } or null */
function why(cost, i, p, q, v) {
  if (!row(cost) || !Number.isInteger(i) || i < 2 || !Number.isInteger(p) || !Number.isInteger(q)) return null;
  const A = p + cost[i - 1];
  const B = q + cost[i - 2];
  if (Number.isFinite(A) && Number.isFinite(B) && Math.min(A, B) === v) return { arrive: false, A, B, from: A <= B ? i - 1 : i - 2 };
  if (i < cost.length && cost[i] + Math.min(p, q) === v) return { arrive: true, A: p, B: q, from: p <= q ? i - 1 : i - 2 };
  return null;
}

function note(cost, n, i, p, q, w) {
  const at = i === n && !w.arrive ? `the top (step ${i})` : `step ${i}`;
  if (w.arrive) return `stand on step ${i}: its toll ${cost[i]} + the cheaper step below (step ${w.from}: ${Math.min(p, q)}) = ${cost[i] + Math.min(p, q)}`;
  return `reach ${at}: leave step ${i - 1} (${p} + toll ${cost[i - 1]} = ${w.A}) or step ${i - 2} (${q} + toll ${cost[i - 2]} = ${w.B}) → ${Math.min(w.A, w.B)}`;
}

/** the true best(i) for both readings (toll on leaving / on arriving), to tell which counts are best(i−1), best(i−2) */
function truth(cost) {
  if (!row(cost) || cost.length > 2000) return [[], []];
  const leave = [0, 0];
  const arrive = [cost[0], cost[1]];
  for (let i = 2; i <= cost.length; i++) {
    leave[i] = Math.min(leave[i - 1] + cost[i - 1], leave[i - 2] + cost[i - 2]);
    if (i < cost.length) arrive[i] = cost[i] + Math.min(arrive[i - 1], arrive[i - 2]);
  }
  return [leave, arrive];
}

/** a new rolling count in `now` that best(i) explains from the counts best(i−1), best(i−2) in `before` */
function rollStep(cost, i, now, before, params, line) {
  // the variable a min(…) line assigns counts even when its value stays the same (cur = 2 again)
  const target = /min|\+/.test(line || '') ? /^\s*(?:const|let|var)?\s*(\w+)\s*=[^=]/.exec(line)?.[1] : undefined;
  const old = ints(before, params).map(([, x]) => x);
  for (const [t, v] of ints(now, params)) {
    if (v === before[t] && t !== target) continue;
    // a slide (prev1 = cur) copies a value that is still there
    if (t !== target && ints(now, params).some(([k, x]) => k !== t && x === v && now[k] === before[k])) continue;
    for (const best of truth(cost)) {
      const [p, q] = [best[i - 1], best[i - 2]];
      if (!old.includes(p) || !old.includes(q) || (p === q && old.filter((x) => x === p).length < 2)) continue;
      const w = why(cost, i, p, q, v);
      if (w) return { p, q, v, w };
    }
  }
  return null;
}

/** the next best(i) about to be written: { i, p, q, v, w } from a dp row, a memo or rolling counts */
function nextWrite(ctx, nowVars, nextVars, line) {
  const cost = nowVars[ctx.params[0]];
  const d = dpOf(nowVars, ctx.params);
  if (d) {
    const after = row(nextVars[d[0]]);
    const ch = after ? changedIdx(after, d[1]) : [];
    if (ch.length !== 1) return null;
    const i = ch[0];
    const w = why(cost, i, after[i - 1], after[i - 2], after[i]);
    return w && { i, p: after[i - 1], q: after[i - 2], v: after[i], w };
  }
  const m = memoOf(nowVars, ctx.params);
  if (m) {
    const m2 = memoOf(nextVars, ctx.params) || [];
    if (m2.length !== m.length + 1) return null;
    const [key, v] = m2.find(([k]) => !m.some(([w]) => w === k));
    const i = Number(key);
    const got = (j) => m2.find(([k]) => Number(k) === j)?.[1];
    // base: free start on step 0 / 1, or (pay on arrival) their own tolls
    for (const base of [() => 0, (j) => cost?.[j]]) {
      const get = (j) => got(j) ?? (j <= 1 ? base(j) : undefined);
      const w = why(cost, i, get(i - 1), get(i - 2), v);
      if (w) return { i, p: get(i - 1), q: get(i - 2), v, w };
    }
    return null;
  }
  const i = idxOf(nextVars);
  const s = rollStep(cost, i, nextVars, nowVars, ctx.params, line);
  return s && { i, ...s };
}

export default {
  id: 'min-cost-climbing-stairs',
  metaphor: 'Paying tolls up a staircase',
  caption: 'Each count is the cheapest way to stand on that step. You pay a step’s toll when you leave it, so a step is reached from one or two steps below, whichever adds up cheaper.',
  narrate(ctx) {
    const cost = ctx.vars[ctx.params[0]];
    const n = row(ctx.input?.[0])?.length;
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the top${n ? ` (step ${n})` : ''} costs ${ctx.value} in tolls at the cheapest`;
    const d = dpOf(ctx.vars, ctx.params);
    if (d && !row(ctx.prev[d[0]])) return `a cell for every step 0…${d[1].length - 1}: the cheapest way to stand on it`;
    if (d) {
      const ch = changedIdx(d[1], ctx.prev[d[0]]);
      if (ch.length === 1 && ch[0] <= 1) return `step ${ch[0]}: ${d[1][ch[0]] === 0 ? 'you may start here for free' : `standing here costs its toll ${d[1][ch[0]]}`}`;
    }
    const w = nextWrite(ctx, ctx.prev, ctx.vars, ctx.src);
    if (w) return note(cost, n, w.i, w.p, w.q, w.w) + (memoOf(ctx.vars, ctx.params) ? ', remembered' : '');
    if (d) return null;
    const m = memoOf(ctx.vars, ctx.params);
    const was = memoOf(ctx.prev, ctx.params) || [];
    const [k, v] = (m && m.length === was.length + 1 && m.find(([key]) => !was.some(([w]) => w === key))) || [];
    if (Number.isInteger(v)) return `step ${k} solved: ${v} at the cheapest (remembered)`;
    // a slide: one count takes another's value, ready for the next step
    const moved = ints(ctx.vars, ctx.params).find(([k, v]) => k in ctx.prev && v !== ctx.prev[k]);
    const src = moved && ints(ctx.vars, ctx.params).find(([k, v]) => k !== moved[0] && v === moved[1] && ctx.vars[k] === ctx.prev[k]);
    return src ? `move up one step: ${moved[0]} takes ${src[0]}’s cost ${moved[1]}` : null;
  },
  // before a new cheapest cost is written, when the two ways in differ: which one wins?
  predict(ctx) {
    if (!ctx.next) return null;
    const w = nextWrite(ctx, ctx.vars, ctx.next.vars, ctx.lines[ctx.next.line - 1]);
    if (!w || w.w.A === w.w.B) return null;
    const cost = ctx.vars[ctx.params[0]];
    const { i, p, q } = w;
    const right = `from step ${w.w.from}`;
    const wrong = [`from step ${w.w.from === i - 1 ? i - 2 : i - 1}`];
    const explain = w.w.arrive
      ? `Step ${i - 1} is reached for ${p}, step ${i - 2} for ${q}: the cheaper one, step ${w.w.from}, plus step ${i}’s toll ${cost[i]} makes ${w.v}.`
      : `From step ${i - 1}: ${p} + toll ${cost[i - 1]} = ${w.w.A}. From step ${i - 2}: ${q} + toll ${cost[i - 2]} = ${w.w.B}. The cheaper is ${w.v}.`;
    return options(`Which way onto step ${i} is cheaper?`, right, wrong, explain);
  },
  bugs: [
    {
      label: 'Return the last step instead of the top',
      find: 'return prev1;',
      replace: 'return prev2;',
      explain: 'The top is one past the last step. Returning the cost of standing on the last step (dp[n−1]) forgets that a 2-step jump from the step before can skip it.',
    },
    {
      label: 'Charge the toll of the starting step',
      find: 'let prev1 = 0;',
      replace: 'let prev1 = cost[1];',
      explain: 'You may start on step 1 for free; you pay its toll only when you leave it. Charging it up front pays that toll twice.',
    },
  ],
};
