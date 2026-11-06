// Subsets II: packing a bag from a sorted shelf that holds identical twins. Every bag on the way is an answer, so
// it is written down as soon as the call starts; then each later item is put in, explored, and taken back out. At
// one level, a twin of an item just tried would build the very same bags again, so it is skipped.
import { callArgs, functionAt, row } from './util.js';

const PATH = ['path', 'curr', 'cur', 'current', 'subset', 'sub', 'bag', 'temp', 'tmp', 'comb', 'combo', 'list', 'stack', 'chosen', 'picked', 'set'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'subsets', 'all', 'power'];
const IDX = ['i', 'j', 'k', 'idx', 'index'];

const pathOf = (vars, params) => PATH.filter((k) => !params.includes(k) && k in vars).map((k) => row(vars[k])).find(Boolean);
const resultOf = (vars) => RESULT.map((k) => vars?.[k]).find((v) => Array.isArray(v) && v.every((p) => row(p)));
const extends1 = (a, b) => a.length === b.length + 1 && b.every((x, i) => a[i] === x);
const show = (a) => `[${a.join(', ')}]`;

/** the loop index has just arrived at a new item, in the recursive call (not a return into it) */
function arrival(ctx, nums, p) {
  const call = callArgs(ctx);
  if (!call) return null;
  const startName = Object.keys(call.args).find((k) => Number.isInteger(call.args[k]));
  const iName = IDX.find((k) => k !== startName && Number.isInteger(ctx.vars[k]));
  if (!iName) return null;
  const i = ctx.vars[iName];
  const before = pathOf(ctx.prev, ctx.params);
  if (i < 0 || i >= nums.length || ctx.prev[iName] >= i || !before || before.length !== p.length) return null;
  if (startName && Number.isInteger(ctx.prev[startName]) && ctx.prev[startName] !== ctx.vars[startName]) return null;
  return { fn: call.name, iName, startName, i, start: startName ? ctx.vars[startName] : undefined };
}

export default {
  id: 'subsets-ii',
  metaphor: 'Packing bags from a shelf with twins',
  caption: 'The sorted array is a shelf where equal items stand side by side. Every bag is written down when it is made; items go in left to right, and at one level a twin of an item just tried is skipped, because it would make the same bags again.',
  narrate(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    const before0 = row(ctx.prev[ctx.params[0]]);
    if (before0 && before0.join() !== nums.join() && nums.every((x, i) => i === 0 || nums[i - 1] <= x)) return `sort the shelf: ${show(nums)}, so twins stand side by side`;
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) return `write down bag ${show(res[res.length - 1])} (${res.length} so far): every bag counts, not only full ones`;
    const p = pathOf(ctx.vars, ctx.params);
    const before = pathOf(ctx.prev, ctx.params);
    if (!p || !before) return null;
    if (extends1(p, before)) return `put ${p[p.length - 1]} in: bag ${show(p)}`;
    if (extends1(before, p)) return `take ${before[before.length - 1]} back out: bag ${show(p)}, try the next item at this level`;
    const a = arrival(ctx, nums, p);
    if (!a) return null;
    // the verdict on the previous item (skipped) is safe to say; the current one may be asked about
    const pi = ctx.prev[a.iName];
    const skipped = Number.isInteger(pi) && pi < a.i && pi > 0 && nums[pi] === nums[pi - 1] && (a.start === undefined || pi > a.start) ? `${nums[pi]} at index ${pi} is a twin already tried here: skipped. ` : '';
    return `${skipped}next on the shelf for bag ${show(p)}: ${nums[a.i]} (index ${a.i})`;
  },
  // the loop arrives at a twin (same value as its left neighbour): does it go in, or is it skipped?
  predict(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!ctx.next || !nums) return null;
    const p = pathOf(ctx.vars, ctx.params);
    if (!p) return null;
    const a = arrival(ctx, nums, p);
    if (!a || a.i === 0 || nums[a.i] !== nums[a.i - 1]) return null;
    const nv = ctx.next.vars;
    const after = pathOf(nv, ctx.params);
    if (!after) return null;
    const sameFn = functionAt(ctx.lines, ctx.next.line) === a.fn;
    let answer = -1;
    if (extends1(after, p) && after[after.length - 1] === nums[a.i]) answer = 0;
    else if (sameFn && after.length === p.length && Number.isInteger(nv[a.iName]) && nv[a.iName] > a.i) answer = 1;
    else if (sameFn && after.length < p.length) answer = 1;
    // the twin was the last item: the loop ends and the call returns to the level above
    else if (sameFn && a.startName && Number.isInteger(nv[a.startName]) && nv[a.startName] < a.start && after.length === p.length) answer = 1;
    if (answer < 0) return null;
    const first = a.start !== undefined && a.i === a.start;
    return {
      question: `Bag ${show(p)}; the shelf offers ${nums[a.i]} (index ${a.i}), the twin of index ${a.i - 1}. Does it go in?`,
      options: [`Yes: put ${nums[a.i]} in`, 'No: skip the twin'],
      answer,
      explain: answer === 0
        ? first
          ? `It is the first item this level may use (i = start), so no twin was tried before it here: bags like ${show([...p, nums[a.i]])} are new.`
          : `This run puts it in although an equal item was just tried at this level, which repeats the same bags.`
        : `An equal ${nums[a.i]} was already tried at this level, so every bag it could start was already written down.`,
    };
  },
  bugs: [
    {
      label: 'Skip twins with i > 0 instead of i > start',
      find: 'i > start &&',
      replace: 'i > 0 &&',
      explain: 'A twin is skipped even when it is the first item of a deeper level, so bags with both 2s, like [2, 2] and [1, 2, 2], are never made.',
    },
    {
      label: 'Write down the bag itself, not a copy',
      find: 'result.push([...path]);',
      replace: 'result.push(path);',
      explain: 'Every saved bag is the same array; items taken back out later empty it, so all answers end up as [].',
    },
  ],
};
