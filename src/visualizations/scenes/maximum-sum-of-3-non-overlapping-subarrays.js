// Maximum Sum of 3 Non-Overlapping Subarrays. Three k-wide planks laid on a row of numbers without overlapping.
// Prefix sums give every plank's total; a forward scan remembers the best plank so far (left), a backward scan the
// best plank from here on (right); then the middle plank slides and grabs the best left and right partners.
// Ties go to the earlier plank. Works with common names (prefix/pre, w/sums/win, left/right, j/mid, total, ans…).
import { firstInt, row } from './util.js';

const PREFIX = /^(prefix|pre|p|ps|psum|prefixSum|sums?)$/i;
const BLOCK = /^(w|win|window|windows|ws|blocks?|block(Sum)?s?|sub|subSums?|ksum|kSums?|sums?)$/i;
const LEFT = /^(left|l|lb|bestLeft|leftBest|leftIdx|leftMax|posLeft)$/i;
const RIGHT = /^(right|r|rb|bestRight|rightBest|rightIdx|rightMax|posRight)$/i;
const MID = ['j', 'mid', 'middle', 'm2', 'i'];
const TOTAL = ['total', 'sum', 'cur', 'curr', 's', 'tot'];
const RECORD = ['bestTotal', 'maxTotal', 'maxSum', 'best', 'bestSum', 'max', 'record'];
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const isIdx = (v) => v == null || Number.isInteger(v);

/** [name, array] of the first var matching `re` that is a row of the given length, else [] */
function arr(vars, re, len, ok = (x) => x == null || fin(x)) {
  const e = Object.entries(vars || {}).find(([k, v]) => re.test(k) && row(v) && v.length === len && v.every(ok));
  return e || [];
}
/** the shapes every phase needs: nums, k, the plank totals w and the left / right index arrays */
function parts(ctx, vars = ctx.vars) {
  const [nName, kName] = ctx.params;
  const nums = row(vars[nName]);
  const k = vars[kName];
  if (!nums || !Number.isInteger(k) || k < 1) return null;
  const m = nums.length - k + 1;
  const [wName, w] = arr(vars, BLOCK, m);
  const [lName, left] = arr(vars, LEFT, m, isIdx);
  const [rName, right] = arr(vars, RIGHT, m, isIdx);
  return { nums, k, m, wName, w, lName, left, rName, right };
}
const oneChange = (a, b) => {
  if (!row(a) || !row(b) || a.length !== b.length) return -1;
  const d = a.map((x, i) => (x === b[i] ? -1 : i)).filter((i) => i >= 0);
  return d.length === 1 ? d[0] : -1;
};
const plank = (i, w) => `plank ${i}${w ? ` (${w[i]})` : ''}`;
const numName = (vars, names) => names.find((x) => fin(vars[x]));
// the record may still be -Infinity, so any number counts (a scan index called best is found only when no bestTotal exists)
const recName = (vars) => RECORD.find((x) => typeof vars[x] === 'number');

const done = (p) => !!(p.w && p.left && p.right && [...p.left, ...p.right].every(Number.isInteger));
/** for a left (dir = 1) or right (dir = -1) scan about to write index i: [old leader, is a tie] */
function leaderAt(best, w, i, dir) {
  const old = best[i - dir];
  return Number.isInteger(old) && w ? [old, w[i] === w[old] && old !== i] : [undefined, false];
}

export default {
  id: 'maximum-sum-of-3-non-overlapping-subarrays',
  metaphor: 'Three k-wide planks, no overlap',
  caption: 'Every k-wide plank gets a total from the prefix sums. left[i] is the best plank starting at or before i, right[i] the best at or after i; the middle plank slides and takes the best partner on each side. Ties go to the earlier plank.',
  compare: 'answer',
  narrate(ctx) {
    const p = parts(ctx);
    if (!p) return null;
    const { nums, k, m, w } = p;
    // prefix sums
    const [pName, pre] = arr(ctx.vars, PREFIX, nums.length + 1);
    if (pName && p.wName !== pName) {
      const i = oneChange(pre, ctx.prev[pName]);
      if (i > 0 && pre[i] === pre[i - 1] + nums[i - 1]) return `prefix ${i} = ${pre[i - 1]} + ${nums[i - 1]} = ${pre[i]} (total of the first ${i} numbers)`;
    }
    // plank totals, written in place or pushed one by one
    const [gName, g] = Object.entries(ctx.vars).find(([x, v]) => BLOCK.test(x) && row(v) && v.length <= m) || [];
    const was = gName && row(ctx.prev[gName]);
    if (g && was) {
      const i = g.length === was.length + 1 && was.every((x, j) => x === g[j]) ? g.length - 1 : oneChange(g, was);
      if (i >= 0 && fin(g[i])) return `plank ${i} covers numbers ${i}..${i + k - 1}: total ${g[i]}`;
    }
    for (const [best, name, dir] of [[p.left, p.lName, 1], [p.right, p.rName, -1]]) {
      if (!best || !w) continue;
      const i = oneChange(best, ctx.prev[name]);
      if (i < 0 || !Number.isInteger(best[i])) continue;
      const span = dir === 1 ? `0..${i}` : `${i}..${m - 1}`;
      const [old, tie] = leaderAt(best, w, i, dir);
      const why = old === undefined ? 'the first one checked' : tie ? `a tie, the earlier plank ${best[i] === old ? 'stays' : 'takes over'}` : best[i] === old ? 'still the leader' : 'a new leader';
      return `best plank starting in ${span}: ${plank(best[i], w)}, ${why}`;
    }
    // the compare step before a scan write: a neutral note (the write itself gets the verdict above)
    const q = ctx.next && parts(ctx, ctx.next.vars);
    for (const [now, nx, dir] of q ? [[p.left, q.left, 1], [p.right, q.right, -1]] : []) {
      const i = now && nx ? oneChange(nx, now) : -1;
      const old = i >= 0 ? now[i - dir] : undefined;
      if (i >= 0 && w && Number.isInteger(old)) return `compare ${plank(i, w)} with the leader so far, ${plank(old, w)}`;
    }
    // sliding the middle plank: only once both scans are complete
    if (done(p)) {
      const [jName, j] = firstInt(ctx.vars, MID);
      const tName = numName(ctx.vars, TOTAL);
      const rec = recName(ctx.vars);
      if (rec && fin(ctx.prev[rec]) && ctx.vars[rec] !== ctx.prev[rec]) return `new best total ${ctx.vars[rec]} (was ${ctx.prev[rec]})`;
      if (rec && !fin(ctx.prev[rec]) && rec in ctx.prev && fin(ctx.vars[rec])) return `the first total ${ctx.vars[rec]} is the best so far`;
      if (tName && ctx.vars[tName] !== ctx.prev[tName] && jName && j >= k && j + k < m) {
        const a = p.left[j - k];
        const c = p.right[j + k];
        if (Number.isInteger(a) && Number.isInteger(c) && ctx.vars[tName] === w[a] + w[j] + w[c]) {
          return `middle ${plank(j, w)} + best left ${plank(a, w)} + best right ${plank(c, w)} = ${ctx.vars[tName]}`;
        }
      }
      if (jName && j !== ctx.prev[jName] && j >= k && j + k < m) return `the middle plank moves to ${j}: left partners must start by ${j - k}, right ones from ${j + k}`;
    }
    const ans = Object.entries(ctx.vars).find(([x, v]) => /ans|answer|res|result/i.test(x) && row(v) && v.length === 3);
    if (ans && JSON.stringify(ans[1]) !== JSON.stringify(ctx.prev[ans[0]])) return `the planks start at ${ans[1].join(', ')}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const p = parts(ctx);
    const q = parts(ctx, ctx.next.vars);
    if (!p || !q || !p.w) return null;
    const { w, k, m } = p;
    // a scan is about to write a tie: does the earlier plank keep the lead? (asked at the first tie of each scan)
    for (const [now, nx, dir] of [[p.left, q.left, 1], [p.right, q.right, -1]]) {
      if (!now || !nx) continue;
      const i = oneChange(nx, now);
      if (i < 0) continue;
      const [old, tie] = leaderAt(nx, w, i, dir);
      if (!tie || ![old, i].includes(nx[i])) continue;
      const earlier = [];
      for (let x = i - dir; x >= 0 && x < m; x -= dir) if (Number.isInteger(nx[x]) && leaderAt(nx, w, x, dir)[1]) earlier.push(x);
      if (earlier.length) continue;
      const opts = [old, i].sort((a, b) => a - b);
      return {
        question: `Plank ${i} totals ${w[i]}, the same as the leader, plank ${old}. Which plank leads now?`,
        options: opts.map((x) => `plank ${x}`),
        answer: opts.indexOf(nx[i]),
        explain: `On a tie the earlier start wins (the answer must be the smallest indices), so plank ${Math.min(old, i)} leads.`,
      };
    }
    // a middle total was just formed: does it set a new record?
    if (!done(p)) return null;
    const tName = numName(ctx.vars, TOTAL);
    const rec = recName(ctx.vars);
    if (!tName || !rec || ctx.vars[tName] === ctx.prev[tName] || !fin(ctx.prev[rec]) || rec === tName) return null;
    // the first total always wins against a sentinel: ask only once an answer exists
    if (!Object.entries(ctx.vars).some(([x, v]) => /ans|answer|res|result/i.test(x) && row(v) && v.length === 3)) return null;
    const [jName] = firstInt(ctx.vars, MID);
    const nx = ctx.next.vars;
    const moved = fin(nx[rec]) && nx[rec] !== ctx.vars[rec];
    if (moved && nx[rec] !== ctx.vars[tName]) return null;
    if (!moved && !ctx.next.ret && !(jName && nx[jName] !== ctx.vars[jName])) return null;
    const t = ctx.vars[tName];
    const b = ctx.vars[rec];
    return {
      question: `This middle position totals ${t}; the best so far is ${b}. Does the answer change?`,
      options: [`Yes: ${t} is a new best`, `No: keep the planks found earlier`],
      answer: moved ? 0 : 1,
      explain: moved ? `${t} > ${b}, so these three planks become the answer.` : t === b ? `${t} only ties ${b}; the earlier planks are smaller indices, so they stay.` : `${t} < ${b}, so the earlier planks stay.`,
    };
  },
  bugs: [
    {
      label: 'Forward scan uses >= on ties',
      find: 'if (w[i] > w[best]) best = i;',
      replace: 'if (w[i] >= w[best]) best = i;',
      explain: 'On a tie the later plank takes the lead, so the left plank is not the earliest one and the answer is not the smallest indices.',
    },
    {
      label: 'Middle plank starts one too late',
      find: 'let j = k;',
      replace: 'let j = k + 1;',
      explain: 'The middle plank never sits right after the first one, so when n = 3k (the only fit) no answer is found at all, and elsewhere a best layout can be missed.',
    },
  ],
};
