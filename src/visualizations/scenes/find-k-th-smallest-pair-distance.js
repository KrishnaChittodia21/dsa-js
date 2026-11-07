// Find K-th Smallest Pair Distance: binary search on the gap. Sorted numbers are posts along a fence; for a trial gap d
// a sliding window counts the pairs of posts at most d apart. The smallest d with at least k such pairs is the answer.
// lo / hi are gaps, not indexes. Works with lo/hi, l/r, low/high; mid / m / d / gap; left/right or i/j as the window.
import { firstInt, row, sorted } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['low', 'high'],
  ['l', 'r'],
];
const GAP = ['d', 'gap', 'dist', 'limit', 'mid', 'm'];
const COUNT = ['count', 'cnt', 'pairs', 'c', 'total'];
const WIN_L = ['left', 'i', 'slow', 'start', 'j0'];
const WIN_R = ['right', 'j', 'fast', 'end'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
/** the first of `names` holding an integer that is not a parameter */
const own = (ctx, vars, names) => firstInt(vars, names.filter((n) => !ctx.params.includes(n)));
const nth = (k) => `${k}${(k % 100 > 10 && k % 100 < 14) || k % 10 > 3 ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10]}`;
const pairs = (c) => `${c} pair${c === 1 ? '' : 's'}`;

export default {
  id: 'find-k-th-smallest-pair-distance',
  metaphor: 'Measuring gaps between fence posts',
  caption: 'After sorting, each cell is a fence post in order. A trial gap slides a window along the fence and counts the pairs of posts that close together; the search keeps the smallest gap that has at least k pairs.',
  pointers: [...WIN_L, ...WIN_R],
  compare: 'lo',
  narrate(ctx) {
    const [aName, kName] = ctx.params;
    const a = row(ctx.vars[aName]);
    const k = ctx.vars[kName];
    if (!a) return null;
    const before = row(ctx.prev[aName]);
    if (((before && !sorted(before)) || (ctx.index === 0 && /sort/.test(ctx.src))) && sorted(a)) return `posts sorted along the fence: [${a.join(', ')}], so close posts stand side by side`;
    const [, d] = own(ctx, ctx.vars, GAP);
    const [cName, c] = own(ctx, ctx.vars, COUNT);
    const [lName, L] = own(ctx, ctx.vars, WIN_L);
    const [, R] = own(ctx, ctx.vars, WIN_R);
    const inside = Number.isInteger(L) && Number.isInteger(R) && L >= 0 && R < a.length;
    // the counting window
    if (Number.isInteger(d) && cName && inside) {
      if (Number.isInteger(ctx.prev[cName]) && c > ctx.prev[cName]) {
        const add = c - ctx.prev[cName];
        return `post ${a[R]} pairs with the ${add} post${add > 1 ? 's' : ''} before it within ${d} (index ${L}…${R - 1}): ${pairs(c)} so far`;
      }
      const was = ctx.prev[lName];
      if (Number.isInteger(was) && L === was + 1 && was < a.length) {
        return `${a[R]} − ${a[was]} = ${a[R] - a[was]} is more than ${d}: post ${a[was]} leaves the window`;
      }
    }
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const [mName, mid] = own(ctx, ctx.vars, ['mid', 'm', 'gap']);
    if (!Number.isInteger(ctx.prev[loName]) || !Number.isInteger(ctx.prev[hiName])) {
      return !(loName in ctx.prev) ? `every gap lies between ${lo} and ${hi} (the two ends of the fence)` : null;
    }
    // the bracket moved after a count: the count is still in prev (the helper's last step)
    const [, counted] = own(ctx, ctx.prev, COUNT);
    const cnt = Number.isInteger(counted) ? ` (${pairs(counted)})` : '';
    if (mName && lo > ctx.prev[loName] && ctx.prev[hiName] === hi) return `fewer than ${pairs(k)} ${k === 1 ? 'is' : 'are'} within ${mid}${cnt}: the ${nth(k)} gap is bigger (${lo}…${hi})`;
    if (mName && hi < ctx.prev[hiName] && ctx.prev[loName] === lo) return `at least ${pairs(k)} ${k === 1 ? 'is' : 'are'} within ${mid}${cnt}: keep ${mid}, try smaller gaps (${lo}…${hi})`;
    if (mName && mid !== own(ctx, ctx.prev, ['mid', 'm', 'gap'])[1] && lo <= hi) return `try gap ${mid}: how many pairs of posts are at most ${mid} apart? (answer in ${lo}…${hi})`;
    return null;
  },
  // a count is done: which half of the gaps is kept?
  predict(ctx) {
    if (!ctx.next) return null;
    const k = ctx.vars[ctx.params[1]];
    const pair = pairOf(ctx.vars);
    if (!pair || !Number.isInteger(k)) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (!Number.isInteger(nx[loName]) || !Number.isInteger(nx[hiName])) return null;
    const [mName, mid] = own(ctx, nx, ['mid', 'm', 'gap']);
    if (!mName || !(lo <= mid && mid <= hi)) return null;
    const up = nx[loName] > lo && nx[hiName] === hi;
    const down = nx[hiName] < hi && nx[loName] === lo;
    if (up === down) return null;
    const [, c] = own(ctx, ctx.vars, COUNT);
    return {
      question: `${Number.isInteger(c) ? `${c} pair${c === 1 ? ' is' : 's are'}` : 'The pairs were counted'} at most ${mid} apart, and we want the ${nth(k)} smallest gap. Which gaps are kept?`,
      options: [`Bigger gaps: ${loName} moves up`, `${mid} and smaller: ${hiName} moves down`],
      answer: up ? 0 : 1,
      explain: up ? `Fewer than ${pairs(k)} fit within ${mid}, so the ${nth(k)} smallest gap must be bigger than ${mid}.` : `At least ${pairs(k)} fit within ${mid}, so the ${nth(k)} smallest gap is ${mid} or smaller.`,
    };
  },
  bugs: [
    {
      label: 'Default sort: numbers sorted as text',
      find: 'nums.sort((a, b) => a - b);',
      replace: 'nums.sort();',
      explain: 'Without a compare function, 10 sorts before 9 (as text), so the posts are out of order and the window counts the wrong pairs.',
    },
    {
      label: 'More than k pairs instead of at least k',
      find: 'countAtMost(mid) >= k',
      replace: 'countAtMost(mid) > k',
      explain: 'When exactly k pairs fit within a gap, that gap is the answer, but > k rejects it and the search settles on a bigger gap.',
    },
  ],
};
