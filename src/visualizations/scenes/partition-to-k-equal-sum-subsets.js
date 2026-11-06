// Partition to K Equal Sum Subsets: fill k buckets of size total / k one after another. Bitmask DP: a state is the
// set of items used so far, and the current bucket's fill level is all it needs (earlier buckets are exactly full).
// Bucket backtracking (a row of k bucket sums) is narrated too; other shapes fall back to the generic notes.
import { cellAt, functionAt, options, row, writtenCell } from './util.js';

const DP = ['dp', 'memo', 'fill', 'level', 'f', 'reach', 'state', 'states'];
const BUCKETS = ['buckets', 'bucket', 'sums', 'groups', 'sides', 'bins', 'subsets', 'parts', 'load', 'loads'];
const ITEM = ['i', 'j', 'idx', 'b', 'bit', 'k2', 'x', 'id'];

/** the DP row: a listed name holding an array of 2^n cells (plain, typed or cut long) */
function dpOf(vars, n) {
  const size = 2 ** n;
  const k = DP.find((x) => {
    const v = vars[x];
    return (Array.isArray(v) && v.length === size) || (v && v.$array && v.$length === size);
  });
  return k ? [k, vars[k]] : [];
}
const usedOf = (nums, mask) => nums.filter((_, b) => mask & (1 << b));
const set = (a) => `{${a.join(', ')}}`;
/** the write this step made to the DP row: { at, v } from the line, else the one changed cell among the kept ones */
function dpWrite(src, vars, prev, name) {
  const w = writtenCell(src, vars);
  const now = vars[name];
  if (w && w.name === name && w.at.length === 1) return { at: w.at[0], v: cellAt(now, w.at[0]) };
  const was = prev[name];
  const a = Array.isArray(now) ? now : now?.$array;
  const b = Array.isArray(was) ? was : was?.$array;
  if (!a || !b || a.length !== b.length) return null;
  const d = a.map((x, t) => (x === b[t] ? -1 : t)).filter((t) => t >= 0);
  return d.length === 1 ? { at: d[0], v: a[d[0]] } : null;
}
/** the item added in a write mask → next: an index variable whose bit is in `next`, with a level that adds up */
function itemOf(vars, nums, dp, next, v, target) {
  for (const k of [...ITEM, ...Object.keys(vars)]) {
    const b = vars[k];
    if (!Number.isInteger(b) || b < 0 || b >= nums.length || !(next & (1 << b))) continue;
    const from = cellAt(dp, next ^ (1 << b));
    if (Number.isInteger(from) && from >= 0 && from + nums[b] <= target && (from + nums[b]) % target === v) return { b, from };
  }
  return null;
}

function base(ctx) {
  const [numsName, kName] = ctx.params;
  const nums = row(ctx.vars[numsName]) || row(ctx.input?.[0]);
  const k = ctx.vars[kName] ?? ctx.input?.[1];
  if (!nums || !Number.isInteger(k) || k < 1) return null;
  const total = nums.reduce((s, x) => s + x, 0);
  return { nums, k, total, target: total / k };
}

export default {
  id: 'partition-to-k-equal-sum-subsets',
  metaphor: 'Filling k buckets to the brim',
  caption: 'Every bucket must hold exactly total / k. Buckets are filled one at a time; for each set of used items only the current bucket’s level matters, and a bucket that hits the brim closes and the next one starts at 0.',
  narrate(ctx) {
    const s = base(ctx);
    if (!s) return null;
    const { nums, k, total, target } = s;
    if (ctx.ret && typeof ctx.value === 'boolean' && functionAt(ctx.lines, ctx.line) !== functionAt(ctx.lines, 1)) {
      // a helper call answering its caller
      return ctx.value ? 'the rest fits too: pass "true" back up' : 'dead end from here: back up and try the item somewhere else';
    }
    if (ctx.ret && typeof ctx.value === 'boolean') {
      if (!ctx.value && total % k !== 0) return `the items add up to ${total}, which does not split into ${k} equal buckets: false`;
      if (!ctx.value && Math.max(...nums) > target) return `item ${Math.max(...nums)} alone overflows a bucket of ${target}: false`;
      return ctx.value ? `every item placed and ${k === 1 ? "the one bucket holds" : `all ${k} buckets hold`} exactly ${target}: true` : `no way to place every item with all ${k} buckets exactly full: false`;
    }
    if (!Number.isInteger(target)) return null;
    // bitmask DP
    const [dpName, dp] = dpOf(ctx.vars, nums.length);
    if (dpName && dpOf(ctx.prev, nums.length)[0]) {
      const w = dpWrite(ctx.src, ctx.vars, ctx.prev, dpName);
      if (w && w.at === 0 && w.v === 0) return 'no items used yet: the first bucket is empty (level 0)';
      if (w && Number.isInteger(w.v) && w.v >= 0) {
        const it = itemOf(ctx.vars, nums, dp, w.at, w.v, target);
        if (!it) return null;
        const used = set(usedOf(nums, w.at));
        return it.from + nums[it.b] === target
          ? `used ${used}: bucket at ${it.from} + ${nums[it.b]} = ${target}, full! It closes and the next bucket starts at 0`
          : `used ${used}: bucket at ${it.from} + ${nums[it.b]} = ${w.v}, ${target - w.v} short of full`;
      }
      return null;
    }
    // bucket backtracking: a row of k bucket sums
    const bk = BUCKETS.find((x) => row(ctx.vars[x]) && ctx.vars[x].length === k && row(ctx.prev[x]) && ctx.prev[x].length === k);
    if (bk) {
      const now = ctx.vars[bk];
      const was = ctx.prev[bk];
      const d = now.map((x, t) => (x === was[t] ? -1 : t)).filter((t) => t >= 0);
      if (d.length !== 1) return null;
      const b = d[0];
      const x = now[b] - was[b];
      if (x > 0) return now[b] === target ? `drop ${x} into bucket ${b + 1}: ${now[b]} of ${target}, exactly full` : `drop ${x} into bucket ${b + 1}: ${now[b]} of ${target}`;
      if (x < 0) return `take ${-x} back out of bucket ${b + 1} (${now[b]} of ${target}): that placement led nowhere`;
    }
    return null;
  },
  // right before a bucket reaches the brim: what level is written?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = base(ctx);
    if (!s || !Number.isInteger(s.target)) return null;
    const { nums, target } = s;
    const [dpName] = dpOf(ctx.vars, nums.length);
    if (!dpName || !dpOf(ctx.next.vars, nums.length)[0]) return null;
    const w = dpWrite(ctx.lines[ctx.next.line - 1], ctx.next.vars, ctx.vars, dpName);
    if (!w || !Number.isInteger(w.v) || w.v < 0 || w.at === 0) return null;
    // the cell must be new: it was -1 (unreached) before
    if (cellAt(ctx.vars[dpName], w.at) !== -1) return null;
    const it = itemOf(ctx.next.vars, nums, ctx.next.vars[dpName], w.at, w.v, target);
    // a later bucket closing (3+ items used): the first closes are asked less, so questions do not repeat
    if (!it || it.from + nums[it.b] !== target || it.from === 0 || usedOf(nums, w.at).length < 3) return null;
    return options(
      `The current bucket holds ${it.from} and ${nums[it.b]} goes in (bucket size ${target}). What level is stored for the used set ${set(usedOf(nums, w.at))}?`,
      w.v,
      [target, it.from, nums[it.b]].filter((x) => x !== w.v),
      w.v === 0 ? `${it.from} + ${nums[it.b]} = ${target} fills the bucket exactly, so it closes and the next bucket starts empty: (level + item) % ${target} = 0.` : 'This run did not reset the level when a bucket filled up.',
    );
  },
  bugs: [
    {
      label: 'Never close a full bucket',
      find: 'dp[next] = (dp[mask] + nums[i]) % target;',
      replace: 'dp[next] = dp[mask] + nums[i];',
      explain: 'Without the % target a full bucket never resets to 0, so the next item can never fit and the answer is false whenever k > 1.',
    },
    {
      label: 'Only add an item that leaves room (< instead of <=)',
      find: 'dp[mask] + nums[i] <= target',
      replace: 'dp[mask] + nums[i] < target',
      explain: 'An item that fills the bucket exactly is never allowed in, so no bucket ever closes and every answer is false.',
    },
  ],
};
