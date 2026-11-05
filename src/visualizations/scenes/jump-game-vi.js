// Scene: Jump Game VI. Stepping stones: best[i] is the best score standing on stone i, and it comes from the best
// stone at most k back. A line of candidate stones (the deque) keeps that best in front: stones too far back leave
// the front, and stones no better than the newcomer leave the back, because they can never be the best again.
// Reads the score table (best/dp/score… or the non-parameter array as long as nums) and the deque (array or
// toolkit Deque / Queue).
import { changedIdx, firstInt, row } from './util.js';

function lineOf(v) {
  if (row(v)) return v;
  const o = v?.$obj;
  if (!o) return null;
  if (row(o.items) && Number.isInteger(o.head)) return o.items.slice(o.head);
  if (row(o.buf) && Number.isInteger(o.head) && Number.isInteger(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
const DP = /^(best|dp|score|scores|f|memo|res|sum|sums|max\w*)$/i;
const Q = /^(dq|deque|q|queue|window|win|cand\w*|mono\w*|d)$/i;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

function state(ctx, vars) {
  if (!vars) return null;
  const nums = ctx.input?.[0];
  if (!row(nums)) return null;
  const free = Object.keys(vars).filter((k) => !ctx.params.includes(k) && k !== 'this');
  const arrs = free.filter((k) => row(vars[k]) && vars[k].length === nums.length);
  const dp = arrs.find((k) => DP.test(k)) ?? (arrs.length === 1 ? arrs[0] : undefined);
  if (!dp) return null;
  const qs = free.filter((k) => k !== dp && lineOf(vars[k])?.every((x) => Number.isInteger(x) && x >= 0 && x < nums.length));
  const q = qs.find((k) => Q.test(k)) ?? (qs.length === 1 ? qs[0] : undefined);
  return { nums, dp, best: vars[dp], q, line: q ? lineOf(vars[q]) : null };
}
const has = (v) => v !== null && v !== undefined;
const show = (line, best) => (line.length ? line.map((j) => `${j}(${best[j]})`).join(', ') : 'empty');

export default {
  id: 'jump-game-vi',
  metaphor: 'Stepping stones with a line of best',
  caption: 'Each stone gets the best score of any path ending on it. The line holds candidate stones, best first: stones more than k back leave the front, and stones no better than a newcomer leave the back, since they will never be chosen.',
  narrate(ctx) {
    const now = state(ctx, ctx.vars);
    if (!now) return null;
    const { nums, best, dp, line } = now;
    const k = ctx.input[1];
    if (ctx.ret && has(best[nums.length - 1])) return `the last stone's best score is ${best[nums.length - 1]}: that is the answer`;
    const was = state(ctx, ctx.prev);
    if (!was || was.dp !== dp || was.q !== now.q) return null;
    const d = changedIdx(best, was.best);
    if (d.length === 1) {
      const i = d[0];
      if (i === 0) return `start on stone 0: best[0] = nums[0] = ${best[0]}`;
      const from = [];
      for (let j = Math.max(0, i - k); j < i; j++) if (has(best[j]) && best[i] === nums[i] + best[j]) from.push(j);
      const j = from.length ? from.reduce((a, b) => (best[b] > best[a] ? b : a)) : -1;
      if (j < 0) return `stone ${i}: best = ${best[i]}`;
      return `stone ${i} (worth ${nums[i]}): jump from stone ${j}, the best within ${k} back (${best[j]}): best = ${best[i]}`;
    }
    if (!line || !was.line) return null;
    const a = line;
    const b = was.line;
    // the stone the loop is on: its index variable, else the newest stone with a score
    let i = best.length - 1;
    while (i >= 0 && !has(best[i])) i--;
    const [, li] = firstInt(ctx.vars, ['i', 'j', 'idx', 'pos', 'cur', 'p']);
    if (li !== undefined && li >= 0 && li < nums.length) i = li;
    const fromFront = a.length === b.length - 1 && same(a, b.slice(1));
    const fromBack = a.length === b.length - 1 && same(a, b.slice(0, -1));
    // one stone left: both ends match, so tell them apart by the code, else by reach
    const front = fromFront && (!fromBack || (/popFront|shift|pollFirst/.test(ctx.src) ? true : /popBack|\.pop\(/.test(ctx.src) ? false : b[0] < i - k));
    if (front) return `stone ${b[0]} is more than ${k} stones back from stone ${i}: out of reach, it leaves the front · line: ${show(a, best)}`;
    if (fromBack) return `stone ${b.at(-1)} (${best[b.at(-1)]}) is no better than stone ${i}${has(best[i]) ? ` (${best[i]})` : ''}, which stays in reach longer: it leaves the back`;
    if (a.length === b.length + 1 && same(a.slice(0, -1), b)) return `stone ${a.at(-1)} joins the back of the line · line: ${show(a, best)}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const now = state(ctx, ctx.vars);
    const nx = state(ctx, ctx.next.vars);
    if (!now || !nx || nx.dp !== now.dp) return null;
    const { nums, best, line } = now;
    const k = ctx.input[1];
    // 1. the next step fills best[i]: which score?
    const d = changedIdx(nx.best, best);
    // a table filled with 0 up front: the cell the loop index points at next is the fresh one
    const [, li] = firstInt(ctx.next.vars, ['i', 'j', 'idx', 'pos', 'cur', 'p']);
    if (d.length === 1 && d[0] > 0 && (!has(best[d[0]]) || d[0] === li)) {
      const i = d[0];
      const right = nx.best[i];
      const lo = Math.max(0, i - k);
      if (i - lo < 2 || !best.slice(lo, i).every(has)) return null;
      const wrong = [];
      for (let j = i - 1; j >= lo; j--) wrong.push(nums[i] + best[j]);
      wrong.push(nums[i], nums[i] + best[i - 1] + 1);
      const opts = [...new Set([right, ...wrong])].slice(0, 4).sort((x, y) => x - y);
      if (opts.length < 2) return null;
      const top = Math.max(...best.slice(lo, i));
      return {
        question: `Stone ${i} is worth ${nums[i]} and you can jump from stones ${lo}..${i - 1} (best: ${best.slice(lo, i).join(', ')}). What is best[${i}]?`,
        options: opts.map(String),
        answer: opts.indexOf(right),
        explain: right === nums[i] + top ? `Come from the best reachable stone: ${nums[i]} + ${top} = ${right}.` : `This run computed ${right}; the best reachable stone gives ${nums[i]} + ${top} = ${nums[i] + top}.`,
      };
    }
    // 2. right after best[i] was set: does the back of the line leave?
    const was = state(ctx, ctx.prev);
    if (!was || !line || !nx.line || line.length < 2 || !same(line, was.line ?? [])) return null;
    const di = changedIdx(best, was.best);
    if (di.length !== 1 || di[0] === 0) return null;
    const i = di[0];
    const back = line.at(-1);
    const popped = nx.line.length === line.length - 1 && same(nx.line, line.slice(0, -1));
    const pushed = nx.line.length === line.length + 1 && same(nx.line.slice(0, -1), line);
    if (popped === pushed || back === i) return null;
    return {
      question: `best[${i}] = ${best[i]}. The back of the line is stone ${back} (best ${best[back]}). What happens to it?`,
      options: [`Stone ${back} leaves the back`, `It stays; stone ${i} joins behind it`],
      answer: popped ? 0 : 1,
      explain: popped
        ? `${best[back]} ≤ ${best[i]}, and stone ${i} stays in reach longer, so stone ${back} can never be the best choice again.`
        : `${best[back]} > ${best[i]}: stone ${back} is still the better choice while it is in reach, so it stays.`,
    };
  },
  bugs: [
    {
      label: 'Expire the front after using it',
      find: `    if (dq.front() < i - k) dq.popFront();          // out of jumping range
    best[i] = nums[i] + best[dq.front()];           // come from the best reachable index`,
      replace: `    best[i] = nums[i] + best[dq.front()];           // come from the best reachable index
    if (dq.front() < i - k) dq.popFront();          // out of jumping range`,
      explain: 'The front is checked only after best[i] used it, so a stone more than k back can still be jumped from: the score is too high.',
    },
  ],
};
