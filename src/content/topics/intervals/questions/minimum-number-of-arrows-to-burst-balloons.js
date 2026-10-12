export default {
  id: 'minimum-number-of-arrows-to-burst-balloons',
  title: 'Minimum Number of Arrows to Burst Balloons',
  difficulty: 'Medium',
  order: 5,
  pattern: 'intervals-greedy-end',
  tags: ['array', 'greedy', 'sorting', 'intervals'],
  source: { platform: 'LeetCode', number: 452, url: 'https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/' },

  statement: `Balloons are taped to a wall. Balloon \`i\` spans the horizontal range \`points[i] = [xStart, xEnd]\` (inclusive). An arrow shot straight up from position \`x\` bursts every balloon with \`xStart <= x <= xEnd\`, and keeps flying.

Return the **minimum number of arrows** needed to burst all balloons.`,
  examples: [
    { input: 'points = [[10,16],[2,8],[1,6],[7,12]]', output: '2', explanation: 'Shoot at x = 6 (bursts [2,8] and [1,6]) and x = 11 (bursts [10,16] and [7,12]).' },
    { input: 'points = [[1,2],[3,4],[5,6],[7,8]]', output: '4' },
    { input: 'points = [[1,2],[2,3],[3,4],[4,5]]', output: '2', explanation: 'x = 2 hits the first two, x = 4 the last two.' },
  ],
  constraints: ['1 <= points.length <= 10^5', '-2^31 <= xStart < xEnd <= 2^31 - 1'],

  think: `- Consider the balloon that **ends** first. It must be hit by some arrow. Where is the best place for that arrow?
- Which other balloons does that arrow also burst?
- Balloons are closed ranges: does an arrow at x = 2 burst both [1,2] and [2,3]?`,
  patternChallenge: {
    options: ['Merge overlapping balloons and count blocks', 'Sweep line — maximum balloons stacked', 'Greedy by earliest end', 'Binary search on x'],
    answer: 2,
    explanation: 'The balloon ending first needs an arrow somewhere in its range; shooting at its end hits the most future balloons. This is the earliest-end greedy. Merging fails on chains ([1,2],[2,3],[3,4] merge into one block but need 2 arrows).',
  },
  hints: [
    'Sort by end. The first arrow goes at the first balloon\'s end.',
    'Skip every balloon with `start <= arrowX` (already burst). The first balloon with `start > arrowX` needs a new arrow at its end.',
  ],
  approach: `**Brute force:** try arrow positions at every endpoint and search combinations — exponential.

**Optimized — greedy by earliest end:**
1. Sort balloons by \`xEnd\`.
2. \`arrowX = -Infinity\`, \`arrows = 0\`.
3. For each \`[s, e]\`: if \`s > arrowX\` the balloon is not burst yet → \`arrows++\`, \`arrowX = e\`.

**Why shooting at the end is safe:** any arrow for the first-ending balloon lies at some \`x <= e₁\`. Moving it right to \`e₁\` still hits that balloon, and any other balloon it hit at \`x\` (which ends at \`>= e₁\` and starts at \`<= x <= e₁\`) is still hit. So moving right never loses balloons.

**JS note:** values reach ±2³¹; \`a[1] - b[1]\` is exact in JavaScript doubles (no 32-bit overflow as in Java/C++).`,

  functionName: 'findMinArrowShots',
  paramNames: ['points'],
  starterCode: `/**
 * @param {number[][]} points
 * @return {number}
 */
function findMinArrowShots(points) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two overlapping groups — one arrow per group.', args: [[[10, 16], [2, 8], [1, 6], [7, 12]]], expected: 2 },
    { scenario: 'Example 2', hint: 'No two balloons overlap, so every balloon needs its own arrow.', args: [[[1, 2], [3, 4], [5, 6], [7, 8]]], expected: 4 },
    { scenario: 'Example 3', hint: 'Balloons touching at a point share an arrow there: ranges are closed, so `s === arrowX` is still burst.', args: [[[1, 2], [2, 3], [3, 4], [4, 5]]], expected: 2 },
    { scenario: 'Single balloon', hint: 'One balloon always needs exactly one arrow.', args: [[[1, 2]]], expected: 1 },
    { scenario: 'Shared endpoint only', hint: 'Two balloons meet only at x = 5. With `s >= arrowX` you would shoot twice.', args: [[[5, 9], [1, 5]]], expected: 1 },
    { scenario: 'Chain needs several arrows', hint: 'Merging overlapping balloons gives one block, but [1,10] can not save you — the three inner balloons are disjoint, so 3 arrows.', args: [[[1, 10], [2, 3], [4, 5], [6, 7]]], expected: 3 },
    { scenario: 'Overlapping chain of three', hint: '[1,3] overlaps [2,5] and [2,5] overlaps [4,6], yet no point hits all three — 2 arrows.', args: [[[1, 3], [2, 5], [4, 6]]], expected: 2 },
    { scenario: 'All identical balloons', hint: 'One arrow bursts every copy of the same range.', args: [[[3, 7], [3, 7], [3, 7]]], expected: 1 },
    { scenario: 'Nested balloons', hint: 'All ranges contain [4,5], so a single arrow suffices.', args: [[[0, 10], [1, 9], [2, 8], [3, 7], [4, 5]]], expected: 1 },
    { scenario: 'Full 32-bit range', hint: 'Coordinates reach ±2^31; in JS `a[1] - b[1]` is exact, but sentinel values like 0 or -1 for "no arrow yet" break.', args: [[[-2147483648, 2147483647], [0, 1]]], expected: 1 },
    { scenario: 'Extreme far apart', hint: 'Balloons at opposite ends of the 32-bit range need 2 arrows.', args: [[[-2147483646, -2147483645], [2147483646, 2147483647]]], expected: 2 },
    { scenario: 'Negative coordinates', hint: 'Negative ranges sort and compare like any other numbers.', args: [[[-10, -5], [-7, -3], [-2, 0], [-1, 4]]], expected: 2 },
    { scenario: 'Mixed overlaps', hint: 'Sort by end and shoot at the end of the first un-burst balloon each time.', args: [[[3, 9], [7, 12], [3, 8], [6, 8], [9, 10], [2, 9], [0, 9], [3, 9], [0, 6], [2, 8]]], expected: 2 },
    { scenario: 'Large input (n = 10^5)', hint: 'Removing burst balloons one arrow at a time is O(n²) when most balloons are disjoint. Sort by end once: O(n log n).', argsGen: '() => { let s = 5; const r = (m) => (s = (s * 48271) % 2147483647) % m; const a = Array.from({ length: 100000 }, (_, i) => { const x = -2000000000 + 40000 * i + r(10000); return [x, x + 1 + r(25000)]; }); for (let i = a.length - 1; i > 0; i--) { const j = r(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return [a]; }', expected: 100000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findMinArrowShots(points) {
  const sorted = points.toSorted((a, b) => a[1] - b[1]); // exact for ±2^31 in JS
  let arrows = 0;
  let arrowX = -Infinity;
  for (const [s, e] of sorted) {
    if (s > arrowX) {    // closed ranges: s === arrowX is still burst
      arrows++;
      arrowX = e;        // shoot as far right as this balloon allows
    }
  }
  return arrows;
}`,
  },
  dryRun: {
    columns: ['sorted by end', 'arrowX', 's > arrowX?', 'arrows'],
    rows: [
      ['[1,6]', '-∞', '✓ shoot at 6', '1'],
      ['[2,8]', '6', '2 > 6 ✗ (burst)', '1'],
      ['[7,12]', '6', '7 > 6 ✓ shoot at 12', '2'],
      ['[10,16]', '12', '10 > 12 ✗ (burst)', '2'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting dominates; one linear pass afterwards.' },
  alternative: {
    title: 'Sort by start, shrink the shared window',
    md: 'Sort by start and keep the intersection `[_, curEnd]` of the current group. If the next balloon starts after `curEnd`, a new arrow is needed; otherwise `curEnd = Math.min(curEnd, e)`.',
    code: `function findMinArrowShots(points) {
  const sorted = points.toSorted((a, b) => a[0] - b[0]);
  let arrows = 1, curEnd = sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    if (s > curEnd) { arrows++; curEnd = e; }
    else curEnd = Math.min(curEnd, e);
  }
  return arrows;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Using `s >= arrowX` — an arrow exactly at a balloon\'s start bursts it (closed ranges).',
    'Merging overlapping balloons and counting blocks (chains need several arrows).',
    'Porting Java code that avoids `a - b` overflow with `Integer.compare` — unnecessary in JS, but know why.',
  ],
};
