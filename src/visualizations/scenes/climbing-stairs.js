// Climbing Stairs: ways(k) = ways(k−1) + ways(k−2), because the last move is a 1-step or a 2-step. Works with two
// rolling counts (any names, also `[a, b] = [b, a + b]`), a dp row, or a memo Map / object (recursion).
import { changedIdx, entriesOf, options, row } from './util.js';

const DP = ['dp', 'ways', 'memo', 'table', 'f', 'cache', 'steps', 'arr'];
const IDX = ['i', 'step', 'k', 'idx', 'j', 'x'];
const FIB = [1, 1];
while (FIB.length < 60) FIB.push(FIB[FIB.length - 1] + FIB[FIB.length - 2]);
/** the step k with ways(k) = v, when v identifies it (v ≥ 2) */
const stepOf = (v) => (Number.isInteger(v) && v >= 2 ? FIB.indexOf(v) : -1);
const ints = (vars, skip) => Object.entries(vars).filter(([k, v]) => Number.isInteger(v) && !skip.includes(k) && !IDX.includes(k));
const dpOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length && r.every((x) => x === null || typeof x === 'number'));
const memoOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => entriesOf(vars[k])).find(Boolean);

/** a new count made as the sum of two counts in `before`: { t, v, a, b } (a ≥ b), or null for copies */
function sumStep(now, before, params) {
  for (const [t, v] of ints(now, params)) {
    if (v === before[t] || !Number.isInteger(v)) continue;
    // a slide (prev1 = cur) copies a value that is still there
    if (ints(now, params).some(([k, w]) => k !== t && w === v && now[k] === before[k])) continue;
    const old = ints(before, params);
    for (let x = 0; x < old.length; x++) {
      for (let y = x + 1; y < old.length; y++) {
        if (old[x][1] + old[y][1] === v) return { t, v, a: Math.max(old[x][1], old[y][1]), b: Math.min(old[x][1], old[y][1]) };
      }
    }
  }
  return null;
}

const sumNote = (k, a, b, v) => (k >= 2 ? `ways to reach step ${k} = ways to step ${k - 1} (${a}) + ways to step ${k - 2} (${b}) = ${v}` : null);

export default {
  id: 'climbing-stairs',
  metaphor: 'Counting routes up a staircase',
  caption: 'Each count is the number of ways to stand on that step. The last move was 1 step or 2, so a step’s count is the sum of the two counts just below it.',
  narrate(ctx) {
    const [nName] = ctx.params;
    const n = ctx.vars[nName];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the top${Number.isInteger(n) ? `, step ${n},` : ''} can be reached in ${ctx.value} different ways`;
    const d = dpOf(ctx.vars, ctx.params);
    if (d) {
      const [name, dp] = d;
      const before = row(ctx.prev[name]);
      if (!before) return `a cell for every step 0…${dp.length - 1}: how many ways lead onto it`;
      const ch = changedIdx(dp, before);
      if (ch.length !== 1) return null;
      const x = ch[0];
      const v = dp[x];
      if (x === 0 && v === 1) return 'step 0: one way to stand at the bottom — do nothing';
      if (x === 1 && v === 1) return 'step 1: one way — a single 1-step move';
      return x >= 2 && dp[x - 1] + dp[x - 2] === v ? sumNote(x, dp[x - 1], dp[x - 2], v) : null;
    }
    const m = memoOf(ctx.vars, ctx.params);
    if (m) {
      const was = memoOf(ctx.prev, ctx.params) || [];
      if (m.length !== was.length + 1) return null;
      const [key, v] = m[m.length - 1];
      const k = Number(key);
      if (!Number.isInteger(k) || !Number.isInteger(v)) return null;
      const get = (j) => m.find(([kk]) => Number(kk) === j)?.[1] ?? (j <= 1 ? 1 : undefined);
      const a = get(k - 1);
      const b = get(k - 2);
      return a + b === v ? `${sumNote(k, a, b, v)}, remembered` : `ways to reach step ${k} = ${v}, remembered so it is never worked out again`;
    }
    const s = sumStep(ctx.vars, ctx.prev, ctx.params);
    if (s) {
      const k = stepOf(s.v);
      return k >= 2 && FIB[k - 1] === s.a ? sumNote(k, s.a, s.b, s.v) : `next count = ${s.a} + ${s.b} = ${s.v}`;
    }
    // a slide: one count takes another's value, ready for the next step
    const moved = ints(ctx.vars, ctx.params).find(([k, v]) => k in ctx.prev && v !== ctx.prev[k]);
    if (moved) {
      const src = ints(ctx.vars, ctx.params).find(([k, v]) => k !== moved[0] && v === moved[1] && ctx.vars[k] === ctx.prev[k]);
      if (src) return `slide up one step: ${moved[0]} takes ${src[0]}’s count ${moved[1]}`;
    }
    return null;
  },
  // before a new count is written: how many ways reach that step?
  predict(ctx) {
    if (!ctx.next) return null;
    let k;
    let a;
    let b;
    let v;
    const d = dpOf(ctx.vars, ctx.params);
    const dn = d && row(ctx.next.vars[d[0]]);
    if (d && dn) {
      const ch = changedIdx(dn, d[1]);
      if (ch.length !== 1 || ch[0] < 2) return null;
      k = ch[0];
      [a, b, v] = [dn[k - 1], dn[k - 2], dn[k]];
      if (a + b !== v) return null;
    } else if (memoOf(ctx.vars, ctx.params)) {
      const m = memoOf(ctx.next.vars, ctx.params) || [];
      if (m.length !== memoOf(ctx.vars, ctx.params).length + 1) return null;
      const get = (j) => m.find(([kk]) => Number(kk) === j)?.[1] ?? (j <= 1 ? 1 : undefined);
      k = Number(m[m.length - 1][0]);
      [a, b, v] = [get(k - 1), get(k - 2), m[m.length - 1][1]];
      if (!(k >= 2) || a + b !== v) return null;
    } else {
      const s = sumStep(ctx.next.vars, ctx.vars, ctx.params);
      if (!s) return null;
      k = stepOf(s.v);
      if (k < 2 || FIB[k - 1] !== s.a) return null;
      ({ a, b, v } = s);
    }
    return options(
      `How many ways lead onto step ${k}?`,
      v,
      [a, a * b + 1, v + 1].filter((w) => w !== v),
      `The last move onto step ${k} came from step ${k - 1} (${a} ways) or from step ${k - 2} (${b} ways): ${a} + ${b} = ${v}.`,
    );
  },
  bugs: [
    {
      label: 'ways(0) = 0: no way to stand at the bottom',
      find: 'let prev2 = 1;',
      replace: 'let prev2 = 0;',
      explain: 'Standing at the bottom is one way (do nothing). Starting it at 0 loses every route that begins with a 2-step, so step 2 gets 1 way instead of 2.',
    },
    {
      label: 'Slide the counts in the wrong order',
      find: 'prev2 = prev1;\n    prev1 = cur;',
      replace: 'prev1 = cur;\n    prev2 = prev1;',
      explain: 'prev1 is overwritten first, so prev2 copies the new count instead of the old one, and from step 3 on the sums drift (4 instead of 3).',
    },
  ],
};
