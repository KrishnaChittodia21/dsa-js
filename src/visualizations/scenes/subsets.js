// Subsets: packing a bag from a shelf, left to right. Every bag along the way is written down; an item goes in,
// the bag is explored with only the items to its right, then the item comes back out (backtracking).
import { callArgs, options, row } from './util.js';

const PATH = ['path', 'curr', 'cur', 'current', 'subset', 'sub', 'temp', 'tmp', 'bag', 'list', 'comb', 'combo', 'track', 'stack', 'chosen'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'subsets', 'all', 'power', 'powerSet'];
const isRows = (v) => Array.isArray(v) && v.every((r) => row(r));
const pathOf = (vars, params) => PATH.filter((k) => !params.includes(k)).map((k) => row(vars?.[k])).find(Boolean);
const resultOf = (vars, params) => RESULT.filter((k) => !params.includes(k)).map((k) => vars?.[k]).find(isRows);
const show = (a) => `[${a.join(', ')}]`;
const extends1 = (a, b) => a.length === b.length + 1 && b.every((x, i) => a[i] === x);

export default {
  id: 'subsets',
  metaphor: 'Packing a bag from a shelf, left to right',
  caption: 'The path is the bag. Every bag on the way is written down as a subset; an item goes in, only items to its right may follow, then it comes back out so the next item can be tried.',
  narrate(ctx) {
    const P = ctx.params;
    const nums = row(ctx.input?.[0]);
    const total = nums ? 2 ** nums.length : null;
    const res = resultOf(ctx.vars, P);
    const resBefore = resultOf(ctx.prev, P);
    if (res && resBefore && res.length === resBefore.length + 1) {
      const got = res[res.length - 1];
      return `write down bag ${show(got)} as a subset (${res.length}${total ? ` of ${total}` : ''})`;
    }
    if (ctx.ret && !ctx.next && isRows(ctx.value)) return `all ${ctx.value.length} bags are written down: each item was either in or out`;
    const p = pathOf(ctx.vars, P);
    const before = pathOf(ctx.prev, P);
    if (!p || !before) return null;
    if (extends1(p, before)) {
      const x = p[p.length - 1];
      const at = nums ? nums.lastIndexOf(x) : -1;
      const rest = at >= 0 ? nums.slice(at + 1) : null;
      return `put ${x} in: bag ${show(p)}${rest ? (rest.length ? `; only ${rest.join(', ')} may follow` : '; nothing is right of it') : ''}`;
    }
    if (extends1(before, p)) return `take ${before[before.length - 1]} back out: bag ${show(p)}; every bag starting ${show(before)} is done`;
    const fn = callArgs(ctx)?.name;
    if (fn && fn !== ctx.lines.find((l) => /\S/.test(l))?.match(/function\s+(\w+)/)?.[1] && new RegExp(`\\b${fn}\\s*\\(`).test(ctx.src) && p.length === before.length && p.every((x, i) => x === before[i])) {
      return `back from the deeper call: every bag that grows ${show(p)} further is written down`;
    }
    return null;
  },
  predict(ctx) {
    const P = ctx.params;
    const nums = row(ctx.input?.[0]);
    // at the start: how many bags will this run write down?
    if (ctx.index === 0 && nums && Array.isArray(ctx.result) && nums.length <= 6) {
      const n = nums.length;
      return options(`The shelf holds ${n} item${n > 1 ? 's' : ''} (${show(nums)}). How many bags will be written down?`, ctx.result.length, [n, 2 * n, n * n, 2 ** n, 2 ** n - 1].filter((x) => x !== ctx.result.length), ctx.result.length === 2 ** n ? `Each item is either in the bag or not: 2 choices per item, so 2^${n} = ${2 ** n} subsets, including the empty bag.` : `There should be 2^${n} = ${2 ** n}, but this run writes down ${ctx.result.length}.`);
    }
    if (!ctx.next) return null;
    const p = pathOf(ctx.vars, P);
    const before = pathOf(ctx.prev, P);
    const after = pathOf(ctx.next.vars, P);
    if (!p || !before || !after || !nums) return null;
    // the last item just went in (the bag is full): is it written down next?
    if (extends1(p, before) && p.length >= 2 && p.length === nums.length) {
      const res = resultOf(ctx.vars, P);
      const resNext = resultOf(ctx.next.vars, P);
      const answer = res && resNext && resNext.length === res.length + 1 ? 0 : extends1(after, p) ? 1 : extends1(p, after) ? 2 : -1;
      if (answer < 0) return null;
      return {
        question: `${p[p.length - 1]} just went in: the bag is ${show(p)}. What happens next?`,
        options: ['Write the bag down as a subset', 'Put another item in first', 'Take the last item back out'],
        answer,
        explain: answer === 0 ? 'Every bag is a subset, not only full ones: a copy is written down as soon as the new call starts.' : 'This run does not write the bag down here; check where the copy is saved.',
      };
    }
    // an item just came back out: which one goes in next?
    if (!extends1(before, p) || !extends1(after, p)) return null;
    const x = after[after.length - 1];
    const popped = before[before.length - 1];
    return options(`${popped} just came back out of bag ${show(p)}. Which item goes in next?`, x, nums.filter((y) => y !== x), `Bags with ${popped} are done, so the loop moves one step right on the shelf: ${x} goes in next.`);
  },
  bugs: [
    {
      label: 'Write down the bag itself, not a copy',
      find: 'result.push([...path]);',
      replace: 'result.push(path);',
      explain: 'Every saved subset is the same bag object; items taken out later empty it, so all answers end up as [].',
    },
    {
      label: 'Recurse with start + 1 instead of i + 1',
      find: 'backtrack(i + 1);',
      replace: 'backtrack(start + 1);',
      explain: 'After choosing a later item, the next call may go back to items left of it, so bags like [2, 1] and duplicates appear.',
    },
  ],
};
