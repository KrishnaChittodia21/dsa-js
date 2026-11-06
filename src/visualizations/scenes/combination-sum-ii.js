// Combination Sum II: a shopping basket that must cost exactly the budget, from a shelf of price tags where each tag
// can be used once. The shelf is sorted, so equal tags sit together: at one depth only the first of them is tried.
import { options, row } from './util.js';

const PATH = ['path', 'curr', 'cur', 'current', 'comb', 'combo', 'combination', 'temp', 'tmp', 'basket', 'subset', 'list', 'picked', 'chosen'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'combos', 'combinations'];
const pathOf = (vars, params) => PATH.filter((k) => !params.includes(k)).map((k) => row(vars[k])).find(Boolean);
const resultOf = (vars) => RESULT.map((k) => vars[k]).find((v) => Array.isArray(v) && v.every((r) => row(r)));
const sum = (a) => a.reduce((s, x) => s + x, 0);
const show = (a) => `[${a.join(', ')}]`;
const extends1 = (a, b) => a.length === b.length + 1 && b.every((x, i) => a[i] === x);
const same = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => x === b[i]);
/** the loop index and the name it starts from: for (let i = start; …) */
function loopOf(ctx) {
  const m = /for\s*\(\s*(?:let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)/.exec(ctx.lines.join('\n'));
  return m ? { i: m[1], start: m[2] } : null;
}

/** what the next step shows about candidate i: 'use' (pushed), 'skip' (moved on to i + 1), 'stop' (left the call) */
function outcome(ctx, p, lp) {
  const i = ctx.vars[lp.i];
  const after = pathOf(ctx.next.vars, ctx.params);
  const c = row(ctx.vars[ctx.params[0]]);
  if (!after || !c) return null;
  if (extends1(after, p) && after[after.length - 1] === c[i]) return 'use';
  if (!same(after, p)) return null;
  const ni = ctx.next.vars[lp.i];
  if (ni === i + 1 && ctx.next.vars[lp.start] === ctx.vars[lp.start]) return 'skip';
  // leaving the call after the last tag could be a skip or a break: too close to tell
  if ((ni === undefined || (Number.isInteger(ni) && ni < i)) && i < c.length - 1) return 'stop';
  return null;
}

export default {
  id: 'combination-sum-ii',
  metaphor: 'One-of-each basket to an exact budget',
  caption: 'The path is the basket, the target is the budget, and each price tag on the sorted shelf can be used once. Equal tags sit side by side; at one depth only the first of them is tried, so no basket is written down twice.',
  narrate(ctx) {
    const target = ctx.input?.[1];
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) {
      const got = res[res.length - 1];
      return `basket ${show(got)} costs exactly ${sum(got)}: record it (${res.length} found so far)`;
    }
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    const c = row(ctx.vars[ctx.params[0]]);
    if (!p || !before || !Number.isInteger(target)) return null;
    const left = target - sum(p);
    if (extends1(p, before)) {
      const x = p[p.length - 1];
      return left < 0 ? `choose ${x} → basket ${show(p)}: over budget by ${-left}, dead end` : `choose ${x} → basket ${show(p)}, ${left} left to spend`;
    }
    if (extends1(before, p)) return `undo ${before[before.length - 1]} → basket ${show(p)}, ${left} left`;
    const lp = loopOf(ctx);
    if (!lp || !c || !same(p, before)) return null;
    const i = ctx.vars[lp.i];
    const pi = ctx.prev[lp.i];
    const start = ctx.vars[lp.start];
    // the step after a `break`: back in the caller, the candidate that was too big is gone
    if (Number.isInteger(pi) && Number.isInteger(i) && i < pi && c[pi] > left) return `${c[pi]} is more than the ${left} left, and every tag after it is bigger (sorted): stop, back up`;
    if (!Number.isInteger(i) || i === pi || i >= c.length) return null;
    // back from a deeper call (prev was that call): not a new look
    if (pi === undefined ? ctx.prev[lp.start] !== start : pi > i) return null;
    if (pi === i - 1 && i - 1 > start && c[i - 1] === c[i - 2]) return `skip tag ${i - 1} (${c[i - 1]}): an equal tag was already tried at this depth. Next: tag ${i} = ${c[i]}, ${left} left`;
    return `look at tag ${i} = ${c[i]} for basket ${show(p)}, ${left} left`;
  },
  // a tag is under consideration: use it, skip it as a repeat, or stop because it is too big?
  predict(ctx) {
    if (!ctx.next) return null;
    const target = ctx.input?.[1];
    const lp = loopOf(ctx);
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    const c = row(ctx.vars[ctx.params[0]]);
    if (!lp || !p || !same(p, before) || !c || !Number.isInteger(target)) return null;
    const i = ctx.vars[lp.i];
    const start = ctx.vars[lp.start];
    if (!Number.isInteger(i) || !Number.isInteger(start) || i < 0 || i >= c.length) return null;
    const left = target - sum(p);
    const dup = i > 0 && c[i] === c[i - 1];
    if (!dup && !(c[i] > left && p.length === 1)) return null;
    const got = outcome(ctx, p, lp);
    if (!got) return null;
    const opts = ['Use it: put it in and go deeper', 'Skip it: an equal tag was tried at this depth', 'Stop: it costs more than what is left'];
    const explain = {
      use: dup && i === start ? `Tag ${i} is the first one this call looks at (i = start = ${start}), so a second ${c[i]} in the basket is a new basket, not a repeat. Only later equal tags in the same loop are skipped.` : `${c[i]} fits in the ${left} left, so it goes in and the search goes one level deeper.`,
      skip: `Tag ${i - 1} also costs ${c[i]} and was already tried at this depth (i > start), so every basket this tag could start has been found already.`,
      stop: `${c[i]} is more than the ${left} left; the shelf is sorted, so every later tag is too big as well and the loop breaks.`,
    }[got];
    return {
      question: `Basket ${show(p)}, ${left} left. Tag ${i} costs ${c[i]}${dup ? ` (the same as tag ${i - 1})` : ''}. What happens to it?`,
      options: opts,
      answer: { use: 0, skip: 1, stop: 2 }[got],
      explain,
    };
  },
  bugs: [
    {
      label: 'Skip duplicates with i > 0 instead of i > start',
      find: 'if (i > start && candidates[i] === candidates[i - 1]) continue;',
      replace: 'if (i > 0 && candidates[i] === candidates[i - 1]) continue;',
      explain: 'A repeated value is skipped even when it is the first pick at a new depth, so baskets that need the same value twice, like [1, 1, 6], are never built.',
    },
    {
      label: 'Recurse with i: a tag is reused',
      find: 'backtrack(i + 1, remaining - candidates[i]);',
      replace: 'backtrack(i, remaining - candidates[i]);',
      explain: 'The next call may pick the same tag again, so baskets like [1, 1, 1, 5] use one tag several times.',
    },
  ],
};
