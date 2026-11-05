// Combination Sum: a shopping basket that must cost exactly the budget. Items go in (the same item may go in again),
// a basket that hits the budget is written down, and items come back out to try the next one.
import { options, row } from './util.js';

const PATH = ['path', 'curr', 'cur', 'current', 'comb', 'combo', 'combination', 'temp', 'tmp', 'basket', 'subset', 'list'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'combos', 'combinations'];
const pathOf = (vars) => PATH.map((k) => row(vars[k])).find(Boolean);
const resultOf = (vars) => RESULT.map((k) => vars[k]).find((v) => Array.isArray(v) && v.every((r) => row(r)));
const sum = (a) => a.reduce((s, x) => s + x, 0);
const show = (a) => `[${a.join(', ')}]`;
const extends1 = (a, b) => a.length === b.length + 1 && b.every((x, i) => a[i] === x);

export default {
  id: 'combination-sum',
  metaphor: 'Filling a basket to an exact budget',
  caption: 'The path is the basket and the target is the budget. Items are tried smallest first and may be reused; a basket that costs exactly the budget is written down, then items come back out so the next one can be tried.',
  narrate(ctx) {
    const target = ctx.vars[ctx.params[1]];
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) {
      const got = res[res.length - 1];
      return `basket ${show(got)} costs exactly ${sum(got)}: write it down (${res.length} found so far)`;
    }
    const p = pathOf(ctx.vars);
    const before = pathOf(ctx.prev);
    if (!p || !before || !Number.isInteger(target)) return null;
    const left = target - sum(p);
    if (extends1(p, before)) {
      const x = p[p.length - 1];
      return left < 0 ? `put ${x} in: ${show(p)} is over budget by ${-left}` : `put ${x} in: basket ${show(p)}, ${left} left to spend`;
    }
    if (extends1(before, p)) return `take ${before[before.length - 1]} back out: ${show(p)}, ${left} left — try the next item instead`;
    return null;
  },
  // the basket just hit the budget: what now? / an item just came back out: which one goes in next?
  predict(ctx) {
    if (!ctx.next) return null;
    const p = pathOf(ctx.vars);
    const before = pathOf(ctx.prev);
    const after = pathOf(ctx.next.vars);
    const items = row(ctx.vars[ctx.params[0]]);
    const target = ctx.vars[ctx.params[1]];
    if (!p || !before || !after || !items) return null;
    const res = resultOf(ctx.vars);
    const resNext = resultOf(ctx.next.vars);
    if (extends1(p, before) && Number.isInteger(target) && sum(p) === target) {
      const answer = res && resNext && resNext.length === res.length + 1 ? 0 : extends1(after, p) ? 1 : extends1(p, after) ? 2 : -1;
      if (answer < 0) return null;
      return {
        question: `Basket ${show(p)} now costs exactly ${target}. What happens next?`,
        options: ['Write the basket down as an answer', 'Put another item in', 'Take the last item back out'],
        answer,
        explain: answer === 0 ? 'Nothing is left to spend, so this basket is an answer; a copy is saved before items come back out.' : 'This run does not save the basket here; check where the "costs exactly the target" test happens.',
      };
    }
    if (!extends1(before, p) || !extends1(after, p)) return null;
    const x = after[after.length - 1];
    const popped = before[before.length - 1];
    const left = Number.isInteger(target) ? `, ${target - sum(p)} left to spend` : '';
    return options(`${popped} just came back out of basket ${show(p)}${left}. Which item goes in next?`, x, [...new Set(items)].filter((y) => y !== x), `Every basket starting with ${show([...p, popped])} has been tried, so the loop moves on to the next item: ${x}.`);
  },
  bugs: [
    {
      label: 'Recurse with i + 1: no reuse',
      find: 'backtrack(i, remaining - candidates[i])',
      replace: 'backtrack(i + 1, remaining - candidates[i])',
      explain: 'Each item may go into the basket only once, so baskets like [2, 2, 3] that reuse an item are never found.',
    },
    {
      label: 'Write down the basket itself, not a copy',
      find: 'result.push([...path]);',
      replace: 'result.push(path);',
      explain: 'Every saved answer is the same basket object; items taken back out later empty it, so the answers end up as [].',
    },
  ],
};
