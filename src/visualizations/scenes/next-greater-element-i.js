// Next Greater Element I (monotonic stack + answer book). Values of nums2 wait in a line that only gets smaller
// towards the back; a bigger value walking in answers everyone smaller at the back and writes it in the answer book
// (a Map or plain object). nums1 is only looked up at the end. Works with a stack of values under a stack-like name.
import { entriesOf, options, row } from './util.js';

const X = ['x', 'num', 'n', 'cur', 'curr', 'val', 'v', 'value', 'el', 'e', 'a', 'item'];
const stackOf = (vars, skip) => Object.entries(vars).find(([k, v]) => !skip.includes(k) && /stack|waiting|^st$|^stk$|^s$|mono|pending/i.test(k) && row(v));
const bookOf = (vars) => Object.entries(vars).map(([k, v]) => [k, entriesOf(v)]).find(([, e]) => e && e.every(([a, b]) => typeof b === 'number' && Number.isFinite(Number(a))));
const list = (a) => (a.length ? a.join(', ') : 'empty');
const same = (a, b) => a.every((x, k) => x === b[k]);
// a pair added to the answer book between two snapshots, else null
function newAnswer(vars, prev) {
  const b = bookOf(vars);
  const was = b && entriesOf(prev[b[0]]);
  if (!b || !was || b[1].length !== was.length + 1) return null;
  const old = new Set(was.map(([k]) => String(k)));
  const e = b[1].find(([k]) => !old.has(String(k)));
  return e ? [Number(e[0]), e[1]] : null;
}

export default {
  id: 'next-greater-element-i',
  metaphor: 'A line waiting for someone taller',
  caption: 'Walking through nums2, each value waits in the line (smaller ones towards the back). A bigger value answers everyone smaller at the back and writes it in the answer book; nums1 just looks its values up at the end.',
  narrate(ctx) {
    const [n1Name, n2Name] = ctx.params;
    if (ctx.ret && Array.isArray(ctx.result) && row(ctx.vars[n1Name])) {
      return `look up each value of ${n1Name} in the answer book (no entry → -1): [${ctx.result.join(', ')}]`;
    }
    const st = stackOf(ctx.vars, ctx.params);
    const was = st && row(ctx.prev[st[0]]);
    const ans = newAnswer(ctx.vars, ctx.prev);
    if (ans) return `${ans[1]} is the first bigger value after ${ans[0]} in ${n2Name}: ${ans[0]}'s wait is over${st ? ` · line: ${list(st[1])}` : ''}`;
    if (!st || !was) return null;
    if (st[1].length === was.length + 1 && same(was, st[1])) {
      const v = st[1].at(-1);
      return `${v} joins the line: nothing bigger has come yet · line: ${list(st[1])}`;
    }
    if (st[1].length === was.length - 1 && same(st[1], was)) return `${was.at(-1)} leaves the back of the line · line: ${list(st[1])}`;
    return null;
  },
  // the line is about to change: is the back of the line answered, or does the newcomer join?
  predict(ctx) {
    const nx = ctx.next;
    const n2 = row(ctx.vars[ctx.params[1]]);
    const st = stackOf(ctx.vars, ctx.params);
    if (!nx || !n2 || !st || !st[1].length) return null;
    const after = row(nx.vars[st[0]]);
    if (!after) return null;
    const back = st[1].at(-1);
    const pushed = after.length === st[1].length + 1 && same(st[1], after);
    const popped = after.length === st[1].length - 1 && same(after, st[1]);
    let x;
    if (pushed) x = after.at(-1);
    else if (popped) {
      const ans = newAnswer(nx.vars, ctx.vars);
      x = ans ? ans[1] : nx.vars[X.find((k) => typeof nx.vars[k] === 'number' && n2.includes(nx.vars[k]))];
    }
    if (typeof x !== 'number' || x === back) return null;
    // skip the repeats: the middle of a chain of answers, and pushes onto a line of 2+ after a push
    const was = row(ctx.prev[st[0]]);
    const justPopped = was && was.length === st[1].length + 1;
    if ((popped && justPopped) || (pushed && !justPopped && st[1].length > 1)) return null;
    const pop = `${back} is answered: ${x} is its next greater value`;
    const push = `${x} joins the line behind ${back}`;
    return options(
      `${x} from ${ctx.params[1]} meets the line ${list(st[1])} (back: ${back}). What happens?`,
      popped ? pop : push,
      [popped ? push : pop],
      popped ? `${x} is bigger than ${back}, and it is the first bigger value to come after ${back}.` : `${x} is not bigger than ${back}, so nobody in the line is answered: ${x} waits too.`,
    );
  },
  bugs: [
    {
      label: 'if instead of while: one answer per newcomer',
      find: 'while (stack.length && stack[stack.length - 1] < x)',
      replace: 'if (stack.length && stack[stack.length - 1] < x)',
      explain: 'A big value can answer several smaller values in the line, but if lets it answer only the last one: in [6,5,4,3,2,1,7], 7 answers 1 and 6 never gets an answer.',
    },
    {
      label: 'Run the line over nums1 instead of nums2',
      find: 'for (const x of nums2)',
      replace: 'for (const x of nums1)',
      explain: 'The next greater value must be found in nums2, where the order matters; walking nums1 finds the wrong neighbours (or none).',
    },
  ],
};
