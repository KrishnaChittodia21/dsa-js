// Number of Longest Increasing Subsequence: every number keeps two tags, the longest rising chain that ends on it
// and how many chains reach that length. A longer way in resets the count; an equally long way adds its count.
// Works with two rows (len / cnt under common names); other shapes fall back to the generic notes.
import { changedIdx, firstInt, options, row, writtenCell } from './util.js';

const LEN = ['len', 'lens', 'length', 'lengths', 'lis', 'dp', 'L', 'best', 'longest', 'size', 'sizes'];
const CNT = ['cnt', 'cnts', 'count', 'counts', 'ways', 'num', 'nums2', 'freq', 'c', 'paths', 'combos'];
const TOTAL = ['total', 'res', 'result', 'ans', 'answer', 'sum', 'out'];
const MAX = ['maxLen', 'maxLength', 'longest', 'best', 'mx', 'max', 'maxL', 'lisLen', 'longestLen'];

/** [name, row] of the first listed non-parameter number row of length n */
function rowOf(vars, names, params, n) {
  const k = names.find((x) => !params.includes(x) && row(vars[x]) && vars[x].length === n && vars[x].every(Number.isInteger));
  return k ? [k, vars[k]] : [];
}
function setup(vars, params) {
  const nums = row(vars[params[0]]);
  if (!nums) return null;
  const [lenName, len] = rowOf(vars, LEN, params, nums.length);
  const [cntName, cnt] = rowOf(vars, CNT, params, nums.length);
  if (!lenName || !cntName || lenName === cntName) return null;
  return { nums, lenName, len, cntName, cnt };
}
/** the one index of a row written by this step: from the line, else the one changed cell */
function writtenAt(src, vars, prevRow, name) {
  // two writes on one line (`len[i] = …; cnt[i] = …;`): read the one to this row
  const at = (src || '').search(new RegExp(`\\b${name}\\[[^\\]]+\\]\\s*[+]?=(?!=)`));
  const w = at >= 0 ? writtenCell(src.slice(at), vars) : null;
  if (w && w.name === name && w.at.length === 1) return w.at[0];
  const d = changedIdx(vars[name], prevRow);
  return d.length === 1 ? d[0] : undefined;
}
/** an earlier index j that this write came from: a loop variable below i with nums[j] < nums[i] and the right length */
const INNER = ['j', 'k', 'p', 'prev', 'q'];
function fromIdx(vars, s, i, wantLen) {
  const keys = [...INNER.filter((k) => k in vars), ...Object.keys(vars).filter((k) => !INNER.includes(k))];
  for (const [k, j] of keys.map((k) => [k, vars[k]])) {
    if (!Number.isInteger(j) || j < 0 || j >= i || k === s.lenName || k === s.cntName) continue;
    if (s.nums[j] < s.nums[i] && s.len[j] + 1 === wantLen) return j;
  }
  return undefined;
}
const ways = (x) => `${x} way${x === 1 ? '' : 's'}`;

export default {
  id: 'number-of-longest-increasing-subsequence',
  metaphor: 'Rising chains, and how many',
  caption: 'Each number carries two tags: the longest rising chain that ends on it, and how many chains of that length do. A longer way in replaces the count; an equally long way adds its count.',
  compare: 'cnt',
  narrate(ctx) {
    const s = setup(ctx.vars, ctx.params);
    if (ctx.ret && Number.isInteger(ctx.value)) {
      const top = s ? Math.max(...s.len) : undefined;
      return `${ctx.value} longest rising chain${ctx.value === 1 ? '' : 's'}${top ? ` (length ${top})` : ''}`;
    }
    if (!s) return null;
    const p = setup(ctx.prev, ctx.params);
    if (!p) return null;
    const { nums, len, cnt } = s;
    // a longer chain found: the length grows
    const li = writtenAt(ctx.src, ctx.vars, p.len, s.lenName);
    if (li !== undefined && len[li] > p.len[li]) {
      const j = fromIdx(ctx.vars, s, li, len[li]);
      return j === undefined ? null : `${nums[li]} can follow ${nums[j]} (chain ${len[j]}): its longest chain grows to ${len[li]}`;
    }
    // the count is written
    const ci = writtenAt(ctx.src, ctx.vars, p.cnt, s.cntName);
    if (ci !== undefined && ci >= 0 && ci < nums.length) {
      const j = fromIdx(ctx.vars, s, ci, len[ci]);
      if (j === undefined) return null;
      if (p.len[ci] === len[ci] && cnt[ci] === p.cnt[ci] + cnt[j]) return `${nums[j]} (chain ${len[j]}) is another way to a chain of ${len[ci]} ending at ${nums[ci]}: add its ${ways(cnt[j])} → ${cnt[ci]}`;
      if (cnt[ci] === cnt[j]) return `${nums[ci]}'s count resets to ${nums[j]}'s ${ways(cnt[j])}: chains shorter than ${len[ci]} no longer count`;
      return null;
    }
    // the best length so far
    const [mName, m] = firstInt(ctx.vars, MAX.filter((k) => k !== s.lenName && k !== s.cntName));
    if (mName && Number.isInteger(ctx.prev[mName]) && m > ctx.prev[mName]) return `the longest chain so far has length ${m}`;
    // adding up the counts of the chains that reach the top length
    const [tName, t] = firstInt(ctx.vars, TOTAL);
    if (tName && Number.isInteger(ctx.prev[tName]) && t > ctx.prev[tName]) {
      const top = Math.max(...len);
      const i = nums.findIndex((_, k) => len[k] === top && cnt[k] === t - ctx.prev[tName] && (ctx.vars.i === undefined || ctx.vars.i === k));
      return i >= 0 ? `${nums[i]} ends a longest chain (length ${top}): add its ${ways(cnt[i])} → ${t}` : null;
    }
    return null;
  },
  // right before a count changes: how many longest chains end here now?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = setup(ctx.vars, ctx.params);
    const a = setup(ctx.next.vars, ctx.params);
    if (!s || !a) return null;
    const nextSrc = ctx.lines[ctx.next.line - 1] || '';
    const ci = writtenAt(nextSrc, ctx.next.vars, s.cnt, s.cntName);
    if (ci === undefined || ci < 0 || ci >= s.nums.length || a.len[ci] === undefined) return null;
    const v = a.cnt[ci];
    const j = fromIdx(ctx.next.vars, a, ci, a.len[ci]);
    if (j === undefined) return null;
    const x = s.nums[ci];
    const y = s.nums[j];
    const pv = setup(ctx.prev, ctx.params);
    if (!pv) return null;
    if (a.len[ci] === s.len[ci] && pv.len[ci] === s.len[ci] && s.len[ci] === s.len[j] + 1) {
      // same length again: add
      return options(
        `${y} (chain ${s.len[j]}, ${ways(s.cnt[j])}) can also lead to ${x}, whose best chain is already ${s.len[ci]} (${ways(s.cnt[ci])}). How many ways end at ${x} now?`,
        v,
        [s.cnt[ci], s.cnt[j], v + 1].filter((w) => w !== v),
        v === s.cnt[ci] + s.cnt[j] ? `Same length, a different family of chains: add ${y}'s ${s.cnt[j]} to ${x}'s ${s.cnt[ci]}.` : 'This run did not add the counts of an equally long way in.',
      );
    }
    // the length just grew at this step: the count follows
    if (s.len[ci] > pv.len[ci] && pv.cnt[ci] + s.cnt[j] !== s.cnt[j] && (pv.cnt[ci] > 1 || s.cnt[j] > 1)) {
      return options(
        `${x}'s chain just grew to ${s.len[ci]} through ${y} (${ways(s.cnt[j])}); before, ${ways(s.cnt[ci])} reached a shorter chain. How many ways end at ${x} now?`,
        v,
        [s.cnt[ci] + s.cnt[j], s.cnt[ci], 1].filter((w) => w !== v),
        v === s.cnt[j] ? `The old ways only reached length ${pv.len[ci]}, so they no longer count: ${x} takes ${y}'s ${s.cnt[j]}.` : 'This run kept the counts of the shorter chains.',
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Add counts when a longer chain is found',
      find: 'cnt[i] = cnt[j];',
      replace: 'cnt[i] += cnt[j];',
      explain: 'The ways that reached a shorter chain are kept, so they get counted as longest chains: [3, 1, 2] gives 2 instead of 1.',
    },
    {
      label: 'Let equal numbers chain (≤ instead of <)',
      find: 'nums[j] >= nums[i]',
      replace: 'nums[j] > nums[i]',
      explain: 'Equal values then count as rising, so [2, 2, 2, 2, 2] finds one chain of 5 instead of five chains of 1.',
    },
  ],
};
