// Sum of All Subset XOR Totals: light switches. Walking along the numbers, each one is either flipped into the running
// XOR (taken) or passed by (left out); when every number is decided, the switches read one subset's XOR total, and
// the totals of both branches add up on the way back. Works with dfs(i, xor) style recursion; other shapes fall back.
import { callArgs, options, row } from './util.js';

const IDX = ['i', 'idx', 'index', 'pos', 'k', 'start', 'level', 'depth', 'j', 'n'];
const ACC = ['xor', 'x', 'cur', 'curr', 'acc', 'val', 'value', 'total', 'running', 'sofar', 'mask', 'xr', 'currXor', 'curXor', 'xorSoFar', 's'];
const SUM = ['sum', 'total', 'res', 'result', 'ans', 'answer', 'out'];

/** the call we are in: { index, xor } read from its parameters, or null */
function stateOf(ctx, vars = ctx.vars) {
  const call = callArgs({ ...ctx, vars });
  if (!call) return null;
  const ints = Object.entries(call.args).filter(([k, v]) => Number.isInteger(v) && !ctx.params.includes(k));
  if (ints.length !== 2) return null;
  const iName = ints.find(([k]) => IDX.includes(k))?.[0] ?? ints[0][0];
  const xName = ints.find(([k]) => k !== iName && ACC.includes(k))?.[0] ?? ints.find(([k]) => k !== iName)[0];
  return { i: call.args[iName], xor: call.args[xName], fn: call.name };
}

export default {
  id: 'sum-of-all-subset-xor-totals',
  metaphor: 'Flipping light switches, one number at a time',
  caption: 'The running XOR is a row of light switches: taking a number flips its bits. When every number is decided, the lights show one subset’s XOR total; the totals add up on the way back.',
  narrate(ctx) {
    const nums = row(ctx.input?.[0]);
    if (!nums) return null;
    const n = nums.length;
    // a global running sum (total += xor at the leaves)
    const sName = SUM.find((k) => !ctx.params.includes(k) && Number.isInteger(ctx.vars[k]) && Number.isInteger(ctx.prev[k]) && ctx.vars[k] !== ctx.prev[k]);
    if (sName) return `add this subset's XOR total ${ctx.vars[sName] - ctx.prev[sName]}: the sum so far is ${ctx.vars[sName]}`;
    const st = stateOf(ctx);
    if (!st) {
      if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `all ${2 ** n} subsets are counted: their XOR totals add up to ${ctx.value}`;
      return null;
    }
    const { i, xor } = st;
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (i >= n) return `all ${n} numbers decided: this subset's lights read ${xor} (binary ${xor.toString(2)})`;
      if (i >= 0) return `both choices for ${nums[i]} (number ${i}) are done: starting from XOR ${xor}, the subsets add up to ${ctx.value}`;
      return null;
    }
    const before = stateOf(ctx, ctx.prev);
    if (before && before.i > i) return null; // back in this call after a deeper one returned
    if (i >= 0 && i < n) return `number ${i} is ${nums[i]} (binary ${nums[i].toString(2)}); the running XOR is ${xor}: take it or leave it`;
    return null;
  },
  // a number is about to be taken: what does the running XOR become?
  predict(ctx) {
    if (!ctx.next) return null;
    const nums = row(ctx.input?.[0]);
    const st = stateOf(ctx);
    const nx = stateOf(ctx, ctx.next.vars);
    if (!nums || !st || !nx || ctx.ret || nx.fn !== st.fn) return null;
    const { i, xor } = st;
    if (i < 0 || i >= nums.length || xor === 0 || nx.i !== i + 1) return null;
    const x = nums[i];
    if (nx.xor !== (xor ^ x) || nx.xor === xor) return null; // the next call is the "take it" branch
    return options(
      `The running XOR is ${xor} (binary ${xor.toString(2)}) and ${x} (binary ${x.toString(2)}) is taken. What does the running XOR become?`,
      nx.xor,
      [xor + x, xor | x, xor & x, x].filter((v) => v !== nx.xor),
      `XOR flips the bits of ${x} in ${xor}: bits set in both switch off, so ${xor.toString(2)} ^ ${x.toString(2)} = ${nx.xor.toString(2)} = ${nx.xor}.`,
    );
  },
  bugs: [
    {
      label: 'Add instead of XOR',
      find: 'dfs(i + 1, xor ^ nums[i])',
      replace: 'dfs(i + 1, xor + nums[i])',
      explain: 'Taking a number adds it instead of flipping its bits, so [1, 3] counts 1 + 3 = 4 instead of 1 ^ 3 = 2 and the total is too big.',
    },
    {
      label: 'Start the XOR at 1',
      find: 'return dfs(0, 0);',
      replace: 'return dfs(0, 1);',
      explain: '0 is the "all lights off" start for XOR; starting at 1 flips the lowest bit of every subset’s total.',
    },
  ],
};
