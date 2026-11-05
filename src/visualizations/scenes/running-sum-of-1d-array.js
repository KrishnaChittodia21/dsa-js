// Running Sum of 1d Array. A piggy bank: every day drops nums[i] coins in, and the ledger notes the balance after
// that day. Works with a running variable (running/sum/total/…) plus a result array (filled or pushed), or in place.
import { firstInt, options, row } from './util.js';

const RUN = ['running', 'sum', 'total', 'acc', 'cur', 'curr', 'prefix', 's', 'run', 'balance'];
const AT = ['i', 'j', 'idx', 'k'];

/** [name, slot, value] of the one array cell written (or pushed) between two snapshots, else null */
function written(vars, before) {
  for (const [k, v] of Object.entries(vars)) {
    const a = row(v);
    const b = row(before[k]);
    if (!a || !b) continue;
    if (a.length === b.length + 1 && b.every((x, i) => x === a[i])) return [k, a.length - 1, a[a.length - 1]];
    if (a.length !== b.length) continue;
    const d = a.map((x, i) => (x === b[i] ? -1 : i)).filter((i) => i >= 0);
    if (d.length === 1) return [k, d[0], a[d[0]]];
  }
  return null;
}

export default {
  id: 'running-sum-of-1d-array',
  metaphor: 'A piggy bank and its daily ledger',
  caption: 'Each number is the coins dropped in on that day. The ledger notes the balance after each day: yesterday\'s balance plus today\'s coins, never a recount from day 0.',
  compare: 'running',
  narrate(ctx) {
    const name = ctx.params[0];
    const nums = row(ctx.vars[name]);
    if (!nums) return null;
    const w = written(ctx.vars, ctx.prev);
    if (w) {
      const [k, slot, v] = w;
      return `the ledger${k === name ? ` (written over ${name})` : ''} notes day ${slot}: balance ${v}`;
    }
    const [rName, r] = firstInt(ctx.vars, RUN);
    const [, i] = firstInt(ctx.vars, AT);
    if (rName && Number.isInteger(ctx.prev[rName]) && r !== ctx.prev[rName] && Number.isInteger(i) && i >= 0 && i < nums.length) {
      return `day ${i}: drop in ${nums[i]} coin${Math.abs(nums[i]) === 1 ? '' : 's'}, the bank goes from ${ctx.prev[rName]} to ${r}`;
    }
    if (rName && !(rName in ctx.prev) && r === 0) return `the bank starts empty: ${rName} = 0`;
    return null;
  },
  // before the balance changes (running variable) or, without one, before a ledger slot is written
  predict(ctx) {
    if (!ctx.next) return null;
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    const nx = ctx.next.vars;
    const [rName, r] = firstInt(ctx.vars, RUN);
    const [, i] = firstInt(nx, AT);
    if (rName && Number.isInteger(nx[rName]) && nx[rName] !== r && i > 0 && nums[i] !== undefined) {
      const v = nx[rName];
      if (v !== r + nums[i]) return null;
      return options(`Day ${i} drops in ${nums[i]}. The bank held ${r}. What does it hold now?`, v, [nums[i], r, v + 1], `Yesterday's balance plus today's coins: ${r} + ${nums[i]} = ${v}.`);
    }
    if (rName) return null;
    // no running variable: the slot write itself is the decision (e.g. in place: nums[i] += nums[i - 1])
    const w = written(nx, ctx.vars);
    if (!w || written(ctx.vars, ctx.prev)) return null;
    const [k, slot, v] = w;
    const a = row(ctx.vars[k]);
    const before = slot > 0 && a ? a[slot - 1] : null;
    if (!Number.isInteger(v) || !Number.isInteger(nums[slot]) || (slot > 0 && !Number.isInteger(before))) return null;
    return options(`Which balance is noted for day ${slot} (${nums[slot]} coins that day)?`, v, [nums[slot], v + 1, v - 1], slot > 0 ? `The day before ended at ${before}; add ${nums[slot]}: ${v}.` : `Day 0 is just its own coins: ${v}.`);
  },
  bugs: [
    {
      label: 'Start the bank at nums[0], then add it again',
      find: 'let running = 0;',
      replace: 'let running = nums[0];',
      explain: 'The first day\'s coins are counted twice, so every balance in the ledger is too big by nums[0].',
    },
    {
      label: 'Stop one day early',
      find: 'i < nums.length;',
      replace: 'i < nums.length - 1;',
      explain: 'The last day is never added, so the final ledger slot stays empty.',
    },
  ],
};
