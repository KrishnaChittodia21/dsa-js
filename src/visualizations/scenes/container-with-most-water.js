// Container With Most Water (two pointers, move the shorter side). Two walls hold water up to the shorter one; the
// shorter wall can never do better with a narrower partner, so it is dropped. Works with l/r, left/right, i/j, lo/hi.
import { row } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['i', 'j'],
  ['lo', 'hi'],
  ['start', 'end'],
];
const BEST = ['best', 'max', 'maxArea', 'maxWater', 'most', 'res', 'result', 'ans', 'answer', 'water'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const bestOf = (vars) => BEST.find((n) => Number.isFinite(vars[n]));
const area = (h, l, r) => Math.min(h[l], h[r]) * (r - l);

export default {
  id: 'container-with-most-water',
  metaphor: 'Two walls, water up to the shorter',
  caption: 'The bracket spans the two walls in use. Water rises only to the shorter wall, so after measuring, the shorter wall is dropped and the bracket narrows.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'best',
  narrate(ctx) {
    const h = row(ctx.vars[ctx.params[0]]);
    const pair = pairOf(ctx.vars);
    if (!h || !pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    if (Number.isInteger(pl) && Number.isInteger(pr) && h[pl] !== undefined && h[pr] !== undefined) {
      const tail = l < r ? `next pair: walls ${l} and ${r}, ${r - l} apart` : 'the walls met: every useful pair was measured';
      if (l === pl + 1 && r === pr) return `drop the left wall (${h[pl]}): ${h[pl] < h[pr] ? 'it is the shorter one' : h[pl] === h[pr] ? 'a tie, either can go' : 'it is the taller one!'} · ${tail}`;
      if (r === pr - 1 && l === pl) return `drop the right wall (${h[pr]}): ${h[pr] < h[pl] ? 'it is the shorter one' : h[pr] === h[pl] ? 'a tie, either can go' : 'it is the taller one!'} · ${tail}`;
    }
    const bName = bestOf(ctx.vars);
    if (!bName || l >= r || h[l] === undefined || h[r] === undefined) return null;
    const best = ctx.vars[bName];
    const a = area(h, l, r);
    const msg = `walls ${l} (${h[l]}) and ${r} (${h[r]}): water ${Math.min(h[l], h[r])} high × ${r - l} wide = ${a}`;
    if (bName in ctx.prev && best !== ctx.prev[bName] && best === a) return `${msg}, a new best`;
    // an area variable was just computed for this pair
    const measured = Object.keys(ctx.vars).some((k) => k !== bName && ctx.vars[k] === a && ctx.prev[k] !== a && !PAIRS.flat().includes(k));
    if (measured && a !== Math.min(h[l], h[r])) return `${msg} (best so far ${best})`;
    // the step that compares with the best, when the best does not change
    const line = ctx.lines[ctx.line - 1] || '';
    if (best === ctx.prev[bName] && new RegExp(`\\b${bName}\\b`).test(line) && /Math\.max|>/.test(line)) return `${msg}, not more than the best (${best})`;
    return null;
  },
  // walls measured, about to drop one: which?
  predict(ctx) {
    const h = row(ctx.vars[ctx.params[0]]);
    const pair = pairOf(ctx.vars);
    if (!h || !pair || !ctx.next) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (!(l >= 0 && l < r && r < h.length) || ctx.prev[lName] !== l || ctx.prev[rName] !== r) return null;
    const nl = ctx.next.vars[lName];
    const nr = ctx.next.vars[rName];
    const moved = nl === l + 1 && nr === r ? 0 : nr === r - 1 && nl === l ? 1 : null;
    if (moved === null || h[l] === h[r]) return null; // a tie may go either way: not a fair question

    return {
      question: `Walls ${h[l]} (left) and ${h[r]} (right) are measured. Which wall is dropped next?`,
      options: [`The left wall (${h[l]})`, `The right wall (${h[r]})`],
      answer: moved,
      explain: `${Math.min(h[l], h[r])} is the shorter wall: every narrower container that keeps it is at most ${Math.min(h[l], h[r])} high and narrower, so it can never beat the current one.`,
    };
  },
  bugs: [
    {
      label: 'Drop the taller wall instead',
      find: 'height[l] < height[r]',
      replace: 'height[l] > height[r]',
      explain: 'The shorter wall stays and keeps capping the water while the width shrinks, so the best pair (like 8 and 7 in example 1) is skipped.',
    },
    {
      label: 'Width as r - l + 1',
      find: 'h * (r - l)',
      replace: 'h * (r - l + 1)',
      explain: 'Walls at x = 0 and x = 2 are 2 apart, not 3: counting the walls instead of the gap makes every area too big.',
    },
  ],
};
