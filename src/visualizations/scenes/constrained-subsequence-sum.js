// Constrained Subsequence Sum (DP + monotonic deque). Each index builds the best chain ending there by hopping
// from the best chain at most k steps back; the deque keeps the candidates in the window, best first.
// Reads a toolkit Deque (ring buffer), a Queue, or a plain array used as a deque, under any name.
import { changedIdx, firstInt, options, row } from './util.js';

const isIdx = (x, n) => Number.isInteger(x) && x >= 0 && x < n;
// the deque's contents front → back, or null
function contents(v) {
  if (row(v)) return v;
  const o = v && v.$obj;
  if (!o) return null;
  if (row(o.buf) && Number.isInteger(o.head) && Number.isInteger(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  if (row(o.items) && Number.isInteger(o.head)) return o.items.slice(o.head);
  return null;
}
function dequeOf(vars, skip, n) {
  const all = Object.entries(vars)
    .filter(([k]) => !skip.includes(k))
    .map(([k, v]) => [k, contents(v)])
    .filter(([, c]) => c && c.every((x) => isIdx(x, n)));
  return all.find(([k]) => /dq|deque|^q$|queue|window|win|mono/i.test(k)) || null;
}
// the dp array: same length as nums, a dp-like name, not the input
const dpOf = (vars, skip, n) => Object.entries(vars).find(([k, v]) => !skip.includes(k) && /best|dp|^f$|sum|score/i.test(k) && row(v) && v.length === n) || null;
// the index being worked on: the loop variable, else the newest filled dp cell (when the dp is filled as it goes)
function current(vars, dpRow, n) {
  const [, i] = firstInt(vars, ['i', 'j', 'idx', 'x', 't', 'pos']);
  if (isIdx(i, n)) return i;
  return dpRow && dpRow.some((x) => !Number.isFinite(x)) ? dpRow.reduce((m, x, t) => (Number.isFinite(x) ? t : m), -1) : -1;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

export default {
  id: 'constrained-subsequence-sum',
  metaphor: 'Hop from the best chain in reach',
  caption: 'best[i] is the best chain ending at i: nums[i] plus the best chain at most k steps back (or nothing, if all are negative). The deque holds those candidates, best at the front, too-old ones dropped.',
  narrate(ctx) {
    const [nName, kName] = ctx.params;
    const nums = row(ctx.vars[nName]);
    const k = ctx.vars[kName];
    if (!nums) return null;
    const skip = ctx.params;
    const n = nums.length;
    const dp = dpOf(ctx.vars, skip, n);
    const dpWas = dp && row(ctx.prev[dp[0]]);
    if (dp && dpWas) {
      const d = changedIdx(dp[1], dpWas);
      if (d.length === 1 && Number.isFinite(dp[1][d[0]])) {
        const i = d[0];
        const from = dp[1][i] - nums[i];
        return from === 0
          ? `chain ending at ${i}: start fresh with ${nums[i]} (no chain in reach worth adding) → ${dp[1][i]}`
          : `chain ending at ${i}: ${nums[i]} + the best chain in reach (${from}) = ${dp[1][i]}`;
      }
    }
    const dq = dequeOf(ctx.vars, skip, n);
    const was = dq && contents(ctx.prev[dq[0]]);
    if (dq && was && was.every((x) => isIdx(x, n))) {
      const now = dq[1];
      const val = (j) => (dp && Number.isFinite(dp[1][j]) ? dp[1][j] : nums[j]);
      const list = now.map((j) => val(j)).join(', ') || 'empty';
      // with one item both ends are the same: the line tells which end was popped
      const fromFront = was.length > 1 ? same(now, was.slice(1)) && !same(now, was.slice(0, -1)) : /popFront|shift\(|pollFirst|removeFirst/.test(ctx.src);
      if (now.length === was.length - 1 && fromFront) return `index ${was[0]} is more than ${k} steps back: out of reach, leaves the front`;
      if (now.length === was.length - 1 && same(now, was.slice(0, -1))) {
        const j = was.at(-1);
        const i = current(ctx.vars, dp?.[1], n);
        const newer = i > j ? `the newer ${val(i)} at ${i}` : 'a newer chain';
        return `chain at ${j} (${val(j)}) is no better than ${newer}: it can never be the best again, drop it`;
      }
      if (now.length === was.length + 1 && same(now.slice(0, -1), was)) return `index ${now.at(-1)} joins the back · candidates (best first): ${list}`;
    }
    const ans = Object.entries(ctx.vars).find(([key, v]) => /ans|res|max|best$/i.test(key) && !skip.includes(key) && Number.isFinite(v) && Number.isFinite(ctx.prev[key]) && v > ctx.prev[key]);
    if (ans) return `new best sum overall: ${ans[1]}`;
    return null;
  },
  // right after best[i] is known: does the back of the deque survive, or is it dropped?
  predict(ctx) {
    const [nName] = ctx.params;
    const nums = row(ctx.vars[nName]);
    const nx = ctx.next;
    if (!nums || !nx) return null;
    const n = nums.length;
    const skip = ctx.params;
    const dp = dpOf(ctx.vars, skip, n);
    const dq = dequeOf(ctx.vars, skip, n);
    const after = dq && contents(nx.vars[dq[0]]);
    if (!dp || !dq || !after || !dq[1].length) return null;
    // the newest index with a value: the one about to be compared
    const i = current(ctx.vars, dp[1], n);
    const back = dq[1].at(-1);
    if (i <= back || !Number.isFinite(dp[1][i]) || !Number.isFinite(dp[1][back])) return null;
    const popped = after.length === dq[1].length - 1 && same(after, dq[1].slice(0, -1));
    const pushed = after.length === dq[1].length + 1 && after.at(-1) === i && same(after.slice(0, -1), dq[1]);
    if (!popped && !pushed) return null;
    const drop = `Drop index ${back} (${dp[1][back]}) from the back`;
    const keep = `Keep it; index ${i} joins behind it`;
    return options(
      `The chain ending at ${i} is worth ${dp[1][i]}. The back of the deque is index ${back}, worth ${dp[1][back]}. What happens?`,
      popped ? drop : keep,
      [popped ? keep : drop],
      popped ? `${dp[1][back]} ≤ ${dp[1][i]}, and index ${i} is newer, so it stays in reach longer: ${back} can never be the best choice again.` : `${dp[1][back]} > ${dp[1][i]}: it is better, so it must stay a candidate while it is in reach.`,
    );
  },
  bugs: [
    {
      label: 'Forget max(0, …): always carry the previous chain',
      find: 'Math.max(0, best[dq.front()])',
      replace: 'best[dq.front()]',
      explain: 'A negative chain is dragged along instead of starting fresh: [-10, -10, 4, 5] with k = 1 gives a sum below 9.',
    },
    {
      label: 'Start the answer at 0',
      find: 'let answer = -Infinity;',
      replace: 'let answer = 0;',
      explain: 'The subsequence must be non-empty, so when every number is negative the answer is the largest one (-1 for [-1, -2, -3]), not 0.',
    },
  ],
};
