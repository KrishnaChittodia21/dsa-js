// Combination Sum IV: dp[x] = ordered sequences that add up to x. Every sequence for x ends in some number c, and
// what comes before it is a sequence for x − c, so dp[x] = Σ dp[x − c]. Works with a dp row or a memo Map / object.
import { changedIdx, entriesOf, options, row } from './util.js';

const DP = ['dp', 'ways', 'memo', 'table', 'f', 'cache', 'count', 'counts'];
const LAST = ['n', 'num', 'c', 'x', 'coin', 'v', 'val', 'k', 'd'];
const dpOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length && r.every((x) => typeof x === 'number'));
const memoOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => entriesOf(vars[k])).find(Boolean);
const seq = (v) => `${v} stack${v === 1 ? '' : 's'}`;

/** the number c that explains dp[x] growing by `delta`: the loop's number when it fits, else any that does */
function lastFor(vars, nums, dp, x, delta, src) {
  if (!row(nums)) return undefined;
  const fits = nums.filter((c) => Number.isInteger(c) && c > 0 && c <= x && dp[x - c] === delta);
  // the block the line itself subtracts: dp[x - n]
  const named = /\[\s*\w+\s*-\s*(\w+)\s*\]/.exec(src || '')?.[1];
  if (named && fits.includes(vars[named])) return vars[named];
  return LAST.map((k) => vars[k]).find((c) => fits.includes(c)) ?? fits[0];
}

export default {
  id: 'combination-sum-iv',
  metaphor: 'Stacking blocks to an exact height',
  caption: 'Cell x counts the ordered ways to stack blocks to height x. Each count is built from lower cells: a stack for x is a stack for x − c with block c on top.',
  compare: 'dp',
  narrate(ctx) {
    const [numsName] = ctx.params;
    const nums = ctx.vars[numsName];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the target height ${ctx.input?.[1] ?? ''}: ${seq(ctx.value)} in all`;
    const d = dpOf(ctx.vars, ctx.params);
    if (d) {
      const [name, dp] = d;
      const before = row(ctx.prev[name]);
      if (!before) return `a cell for every height 0…${dp.length - 1}: no stacks counted yet`;
      const ch = changedIdx(dp, before);
      if (ch.length !== 1) return null;
      const x = ch[0];
      const v = dp[x];
      if (x === 0 && v === 1) return 'height 0: one way — the empty stack, which every other stack grows from';
      const c = lastFor(ctx.vars, nums, dp, x, v - before[x], ctx.src);
      if (c === undefined) return null;
      const from = c === x ? `block ${c} alone` : `block ${c} on top of the ${seq(dp[x - c])} for ${x - c}`;
      return `height ${x}: ${from} → ${v - before[x] === v ? '' : `${before[x]} + ${v - before[x]} = `}${seq(v)}`;
    }
    const m = memoOf(ctx.vars, ctx.params);
    const was = memoOf(ctx.prev, ctx.params) || [];
    if (m && m.length === was.length + 1) {
      const [key, v] = m[m.length - 1];
      return Number.isInteger(Number(key)) && Number.isInteger(v) ? `height ${key} solved: ${seq(v)} (remembered, never counted again)` : null;
    }
    return null;
  },
  // before a cell that already has stacks gains more: how many in total?
  predict(ctx) {
    if (!ctx.next) return null;
    const [numsName] = ctx.params;
    const d = dpOf(ctx.vars, ctx.params);
    const after = d && row(ctx.next.vars[d[0]]);
    if (!after) return null;
    const dp = d[1];
    const ch = changedIdx(after, dp);
    if (ch.length !== 1) return null;
    const x = ch[0];
    const delta = after[x] - dp[x];
    if (x === 0 || dp[x] <= 0 || delta <= 0) return null;
    const c = lastFor(ctx.next.vars, ctx.vars[numsName], after, x, delta, ctx.lines[ctx.next.line - 1]);
    if (c === undefined) return null;
    return options(
      `Height ${x} has ${seq(dp[x])} so far. Now add the stacks whose top block is ${c}: how many in total?`,
      after[x],
      [dp[x] + 1, delta, dp[x] * 2 === after[x] ? after[x] + 1 : dp[x] * 2].filter((w) => w !== after[x]),
      `Every stack for ${x - c} (${dp[x - c]} of them) plus block ${c} on top is a new stack for ${x}: ${dp[x]} + ${delta} = ${after[x]}.`,
    );
  },
  bugs: [
    {
      label: 'dp[0] = 0: no empty stack',
      find: 'dp[0] = 1;',
      replace: 'dp[0] = 0;',
      explain: 'Every stack is built on the empty stack of height 0. With dp[0] = 0 there is nothing to build on, so every count stays 0.',
    },
    {
      label: 'n < x: a single block never fills a height',
      find: 'if (n <= x)',
      replace: 'if (n < x)',
      explain: 'A block exactly as tall as x (on the empty stack) is skipped, so stacks like (1) for height 1 are lost and every count is too small.',
    },
  ],
};
