// Next Greater Element II (circular, monotonic stack). People stand in a ring; each waits for the first bigger
// value going clockwise. One lap fills the waiting line, a second lap only answers (it wraps past the end).
// Works with a stack of indices under a stack-like name and a loop index (raw 0..2n-1 or already % n).
import { options, row } from './util.js';

const AT = ['i', 'j', 'k', 'cur', 'pos']; // not idx: often the popped index
const stackOf = (vars, skip) => Object.entries(vars).find(([k, v]) => !skip.includes(k) && /stack|waiting|^st$|^stk$|^s$|mono|pending/i.test(k) && row(v));
// the answer: same length as nums, not nums, not the stack
function answerOf(vars, name, s) {
  const a = row(vars[name]);
  return a && Object.entries(vars).find(([k, v]) => k !== name && k !== s && row(v) && v.length === a.length && v.every(Number.isFinite));
}
// { pos, second }: the position in the ring now, and whether the run is in its second lap
function posOf(vars, n) {
  const ints = AT.filter((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < 2 * n);
  if (!ints.length) return null;
  return { pos: vars[ints[0]] % n, second: ints.some((k) => vars[k] >= n) };
}
const same = (a, b) => a.every((x, k) => x === b[k]);

export default {
  id: 'next-greater-element-ii',
  metaphor: 'A ring of people looking clockwise',
  caption: 'Everyone waits in the line (smaller values towards the back) until a bigger value comes along clockwise. The first lap fills the line; the second lap wraps around the end and only answers, nobody new joins.',
  compare: 'res',
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    if (!a || !a.length) return null;
    const n = a.length;
    const st = stackOf(ctx.vars, ctx.params);
    const ans = answerOf(ctx.vars, name, st?.[0]);
    const before = ans && row(ctx.prev[ans[0]]);
    const p = posOf(ctx.vars, n);
    if (ans && before && before.length === n) {
      const d = ans[1].map((x, k) => (x === before[k] ? -1 : k)).filter((k) => k >= 0);
      if (d.length === 1 && p) {
        const j = d[0];
        return `${a[p.pos]} (index ${p.pos}) is the first bigger value after ${a[j]} (index ${j})${p.pos < j ? ', found by wrapping around' : ''}: ${ans[0]}[${j}] = ${ans[1][j]}`;
      }
    }
    const was = st && row(ctx.prev[st[0]]);
    if (st && was && st[1].every((k) => Number.isInteger(k) && k >= 0 && k < n)) {
      const line = st[1].map((k) => a[k]).join(', ') || 'empty';
      if (st[1].length === was.length + 1 && same(was, st[1])) return `${a[st[1].at(-1)]} (index ${st[1].at(-1)}) joins the waiting line · line: ${line}`;
      if (st[1].length === was.length - 1 && same(st[1], was)) return `${a[was.at(-1)]} (index ${was.at(-1)}) leaves the back of the line · line: ${line}`;
    }
    const q = posOf(ctx.prev, n);
    if (p && q && p.second && p.pos !== q.pos) return `second lap: ${a[p.pos]} (index ${p.pos}) comes around again to answer whoever it can`;
    return null;
  },
  // a value has just arrived: is the back of the line answered, does it join, or (second lap) does nothing happen?
  predict(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const nx = ctx.next;
    if (!a || !a.length || !nx) return null;
    const n = a.length;
    const st = stackOf(ctx.vars, ctx.params);
    if (!st || !st[1].length || !st[1].every((k) => Number.isInteger(k) && k >= 0 && k < n)) return null;
    const after = row(nx.vars[st[0]]);
    const p = posOf(ctx.vars, n);
    const q = posOf(ctx.prev, n);
    const np = posOf(nx.vars, n);
    if (!after || !p || !np || !q || p.pos === q.pos) return null; // ask only right after a value arrives
    const back = st[1].at(-1);
    if (back === p.pos) return null;
    const popped = after.length === st[1].length - 1 && same(after, st[1]);
    const pushed = after.length === st[1].length + 1 && same(st[1], after) && after.at(-1) === p.pos;
    const neither = !popped && !pushed && np.pos !== p.pos && same(after, st[1]) && after.length === st[1].length;
    if (!popped && !pushed && !neither) return null;
    // skip the dull ones: a first-lap pop from a 1-long line, and a run of "nothing happens" in the second lap
    if ((popped && !p.second && st[1].length < 2) || (neither && q.second && String(row(ctx.prev[st[0]])) === String(st[1]))) return null;
    const v = a[p.pos];
    const pop = `${a[back]} (index ${back}) is answered with ${v}`;
    const push = `${v} (index ${p.pos}) joins the line`;
    const none = 'Nothing: no answer, and nobody joins';
    const right = popped ? pop : pushed ? push : none;
    const r = options(
      `${p.second ? 'Second lap: ' : ''}${v} (index ${p.pos}) arrives; the back of the line is ${a[back]} (index ${back}). What happens next?`,
      right,
      [pop, push, none].filter((x) => x !== right && (p.second || x !== none)),
      popped
        ? `${v} is bigger than ${a[back]}, so it is the first bigger value after index ${back}${p.pos < back ? ' (reached by wrapping around)' : ''}.`
        : pushed
          ? `${v} is not bigger than ${a[back]}, so nobody is answered: ${v} waits in the line too.`
          : `${v} is not bigger than ${a[back]}, and in the second lap nobody joins: this round does nothing.`,
    );
    return r;
  },
  bugs: [
    {
      label: 'One lap only: no wrapping around',
      find: 'k < 2 * n',
      replace: 'k < n',
      explain: 'Values near the end never see the start of the array: in [1,2,1] the last 1 should find 2 by wrapping around, but stays -1.',
    },
    {
      label: 'Pop on <=: an equal value counts as bigger',
      find: 'nums[st[st.length - 1]] < nums[i]',
      replace: 'nums[st[st.length - 1]] <= nums[i]',
      explain: 'An equal value is not greater, but <= answers with it anyway: in [3,3,3] every element gets 3 instead of -1.',
    },
  ],
};
