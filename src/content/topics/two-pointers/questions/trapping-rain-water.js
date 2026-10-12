export default {
  id: 'trapping-rain-water',
  title: 'Trapping Rain Water',
  difficulty: 'Hard',
  order: 1,
  pattern: 'two-pointers-bottleneck',
  tags: ['array', 'two pointers', 'prefix max'],
  source: { platform: 'LeetCode', number: 42, url: 'https://leetcode.com/problems/trapping-rain-water/' },

  statement: `\`height[i]\` is the height of a bar of width 1 in an elevation map. After it rains, water collects in the dips between bars.

Return the **total units of water** trapped.`,
  examples: [
    { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
    { input: 'height = [4,2,0,3,2,5]', output: '9', explanation: 'Water above each bar: 0, 2, 4, 1, 2, 0.' },
  ],
  constraints: ['1 <= height.length <= 2 * 10^4', '0 <= height[i] <= 10^5'],

  think: `- Forget the whole map; look at one bar \`i\`. How high can water stand above it? What limits it on the left and on the right?
- Write that as a formula. How would you compute it for every bar in O(n) with extra arrays?
- With two pointers you only know the max on one side exactly. When is that enough?`,
  patternChallenge: {
    options: ['Two Pointers — move the smaller side (bottleneck)', 'Sliding Window', 'Sort + Two Pointers', 'Binary Search'],
    answer: 0,
    explanation: 'Water above a bar is `min(maxLeft, maxRight) − height`: limited by the smaller side. With pointers at both ends, the side whose running max is smaller has its water level fully determined, so it can be settled and moved. Sorting would destroy the geometry. (Prefix-max arrays and a monotonic stack also solve it.)',
  },
  hints: [
    'Water above bar i = `min(max of height[0..i], max of height[i..n-1]) − height[i]`.',
    'Keep `leftMax` and `rightMax` as running maxima from the two ends. If `leftMax < rightMax`, the level at `l` is exactly `leftMax` — add `leftMax − height[l]` and move `l`. Otherwise do the same on the right.',
  ],
  approach: `**Brute force:** for each bar, scan left and right for the tallest bars → O(n²).

**Prefix / suffix maxima:** precompute \`maxLeft[i]\` and \`maxRight[i]\` in two passes; sum \`min(maxLeft[i], maxRight[i]) − height[i]\` → O(n) time, O(n) space.

**Two pointers (O(1) space):** keep \`leftMax = max(height[0..l])\` and \`rightMax = max(height[r..n-1])\`.

*Claim:* if \`leftMax < rightMax\`, the water level at \`l\` is exactly \`leftMax\`.
*Proof:* the true left max of \`l\` is \`leftMax\` (we have seen all of \`height[0..l]\`). The true right max of \`l\` is the max of \`height[l..n-1]\`, which contains \`height[r..n-1]\`, so it is **≥ rightMax > leftMax**. Hence \`min(trueLeft, trueRight) = leftMax\`, regardless of the bars between \`l\` and \`r\` that we have not seen. Settle bar \`l\` and move it. The mirror argument handles \`leftMax ≥ rightMax\` on the right.

Every bar is settled exactly once → O(n).`,

  functionName: 'trap',
  paramNames: ['height'],
  starterCode: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: several separate pools add up to 6.', args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
    { scenario: 'Example 2', hint: 'One wide basin between 4 and 5: water level 4 everywhere inside.', args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
    { scenario: 'Single bar', hint: 'The smallest input: one bar cannot hold water.', args: [[5]], expected: 0 },
    { scenario: 'Two bars', hint: 'No space between them, so no water.', args: [[3, 3]], expected: 0 },
    { scenario: 'Strictly increasing', hint: 'No left wall is ever taller than the bar after it — 0 water. Update the running max before adding water, or you get negative amounts.', args: [[1, 2, 3, 4, 5]], expected: 0 },
    { scenario: 'Strictly decreasing', hint: 'Mirror case: no right wall, so 0 water.', args: [[5, 4, 3, 2, 1]], expected: 0 },
    { scenario: 'All zeros', hint: 'A flat floor holds nothing.', args: [[0, 0, 0, 0]], expected: 0 },
    { scenario: 'Simple valley', hint: 'One dip of depth 2 between two walls of height 2.', args: [[2, 0, 2]], expected: 2 },
    { scenario: 'Every bar between matters', hint: 'Not Container With Most Water: the bars between the walls take up space. 3 + 2 + 3 = 8, not 3 × 4.', args: [[3, 0, 1, 0, 3]], expected: 8 },
    { scenario: 'Unequal walls', hint: 'The water level is the shorter wall (3), not the taller one (7). Move the side with the smaller max.', args: [[3, 0, 0, 7]], expected: 6 },
    { scenario: 'Peak in the middle', hint: 'A tall middle peak splits the map into two separate basins.', args: [[2, 0, 5, 0, 3]], expected: 5 },
    { scenario: 'Max heights', hint: 'Heights of 10^5 around a deep hole: 10^5 units.', args: [[100000, 0, 100000]], expected: 100000 },
    { scenario: 'Large input (n = 2·10^4)', hint: 'Scanning left and right for every bar is O(n²). Two pointers (or prefix/suffix maxima) is O(n).', argsGen: '() => { let s = 19; return [Array.from({ length: 20000 }, () => { s = (s * 48271) % 2147483647; return s % 100001; })]; }', expected: 998330628, timeLimitMs: 150 },
    { scenario: 'Large single basin', hint: 'Two tall walls with 19 998 low bars between: every inner bar holds water.', argsGen: '() => [Array.from({ length: 20000 }, (_, i) => (i === 0 || i === 19999 ? 100000 : i % 7))]', expected: 1999740003, timeLimitMs: 150 },
  ],

  solution: {
    code: `function trap(height) {
  let l = 0, r = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (l < r) {
    leftMax = Math.max(leftMax, height[l]);
    rightMax = Math.max(rightMax, height[r]);
    if (leftMax < rightMax) {
      // Level at l is exactly leftMax: the right side is at least rightMax > leftMax.
      water += leftMax - height[l];
      l++;
    } else {
      // Level at r is exactly rightMax: the left side is at least leftMax >= rightMax.
      water += rightMax - height[r];
      r--;
    }
  }
  return water;
}`,
    explanation: 'Updating the maxima *before* adding water guarantees `leftMax − height[l] >= 0`. The loop stops when l === r; that last bar is the tallest seen, so it holds no water.',
  },
  dryRun: {
    columns: ['l', 'r', 'leftMax', 'rightMax', 'settle', 'water'],
    rows: [
      ['0', '5', '4', '5', 'l: 4 − 4 = 0', '0'],
      ['1', '5', '4', '5', 'l: 4 − 2 = 2', '2'],
      ['2', '5', '4', '5', 'l: 4 − 0 = 4', '6'],
      ['3', '5', '4', '5', 'l: 4 − 3 = 1', '7'],
      ['4', '5', '4', '5', 'l: 4 − 2 = 2', '9'],
      ['5', '5', '—', '—', 'l === r, stop', '9'],
    ],
    note: 'height = [4,2,0,3,2,5]. The right wall (5) is taller, so the left running max decides every level.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each bar is settled once by one of the two pointers.' },
  alternative: {
    title: 'Prefix and suffix maximum arrays',
    md: 'Easier to explain first: two passes build `maxLeft` and `maxRight`, a third pass sums the water. Then show how two pointers remove the arrays.',
    code: `function trap(height) {
  const n = height.length;
  const maxLeft = new Array(n), maxRight = new Array(n);
  maxLeft[0] = height[0];
  for (let i = 1; i < n; i++) maxLeft[i] = Math.max(maxLeft[i - 1], height[i]);
  maxRight[n - 1] = height[n - 1];
  for (let i = n - 2; i >= 0; i--) maxRight[i] = Math.max(maxRight[i + 1], height[i]);
  let water = 0;
  for (let i = 0; i < n; i++) water += Math.min(maxLeft[i], maxRight[i]) - height[i];
  return water;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Adding water before updating the running max → negative water.',
    'Moving the side with the larger max — its level is not yet known.',
    'Treating it like Container With Most Water: here every bar between the walls matters.',
  ],
};
