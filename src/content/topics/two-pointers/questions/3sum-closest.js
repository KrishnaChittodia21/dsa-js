export default {
  id: '3sum-closest',
  title: '3Sum Closest',
  difficulty: 'Medium',
  order: 6,
  pattern: 'sort-two-pointers-ksum',
  tags: ['array', 'two pointers', 'sorting'],
  source: { platform: 'LeetCode', number: 16, url: 'https://leetcode.com/problems/3sum-closest/' },

  statement: `Given an integer array \`nums\` and an integer \`target\`, choose three numbers at different indices whose sum is **as close as possible** to \`target\`, and return that **sum**.

Each input has exactly one closest sum.`,
  examples: [
    { input: 'nums = [-1,2,1,-4], target = 1', output: '2', explanation: '-1 + 2 + 1 = 2 is the closest sum to 1.' },
    { input: 'nums = [0,0,0], target = 1', output: '0' },
  ],
  constraints: ['3 <= nums.length <= 500', '-1000 <= nums[i] <= 1000', '-10^4 <= target <= 10^4'],

  think: `- Compared with 3Sum, what changes: the stopping condition, the duplicate handling, or the pointer moves?
- If the current sum is below target, which move can bring it closer?
- When can you stop immediately?`,
  patternChallenge: {
    options: ['Binary Search on the answer', 'Dynamic Programming', 'Sort + Two Pointers', 'Sliding Window'],
    answer: 2,
    explanation: 'Same skeleton as 3Sum: fix one element, then a sorted pair search. The pointer rule is identical (too small → l++, too big → r--); we just track the best |sum − target| instead of collecting exact hits.',
  },
  hints: [
    'Sort, fix `i`, and run `l`/`r` on the rest.',
    'At each step compare `|sum − target|` with the best so far. Move `l` right if `sum < target`, `r` left if `sum > target`, and return immediately if `sum === target`.',
  ],
  approach: `**Brute force:** all triples, O(n³).

**Sort + two pointers (O(n²)):** for a fixed \`i\`, the pair search explores sums in a way that never skips the closest one:
- if \`sum < target\`, every pair \`(l, r')\` with \`r' < r\` is even smaller → further from target, so \`l\` is done: \`l++\`;
- if \`sum > target\`, symmetric: \`r--\`.

Track the best sum. No de-duplication is needed because we return a single number.`,

  functionName: 'threeSumClosest',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function threeSumClosest(nums, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: -1 + 2 + 1 = 2 is the closest sum to 1.', args: [[-1, 2, 1, -4], 1], expected: 2 },
    { scenario: 'Example 2', hint: 'Only one triple exists, so its sum is the answer even though it misses the target.', args: [[0, 0, 0], 1], expected: 0 },
    { scenario: 'Target far below every sum', hint: 'Every sum is far above the target, so the answer is the smallest possible sum. Remember to return the sum, not the distance.', args: [[1, 1, 1, 0], -100], expected: 2 },
    { scenario: 'Exact match exists', hint: 'When a triple hits the target exactly you can stop early — the distance cannot get below 0.', args: [[1, 1, 1, 1], 3], expected: 3 },
    { scenario: 'Target near 0, 0 not reachable', hint: 'Every triple sums to at least 6. If you initialise best to 0, the answer comes back as 0 — start best from a real triple.', args: [[2, 2, 2, 5], 0], expected: 6 },
    { scenario: 'Returns sum, not difference', hint: 'The closest sum is 13 (distance 1). Returning the distance 1 is a common slip.', args: [[1, 2, 5, 10, 11], 12], expected: 13 },
    { scenario: 'Unsorted with negatives', hint: 'The input is not sorted — sort a copy first (with a numeric comparator) so the two pointers make sense.', args: [[4, 0, 5, -5, 3, 3, 0, -4, -5], -2], expected: -2 },
    { scenario: 'All minimum values', hint: 'All values are -1000: the only possible sum is -3000, however far the target is.', args: [[-1000, -1000, -1000], 10000], expected: -3000 },
    { scenario: 'Target far above every sum', hint: 'The answer is the three largest values. Make sure your r pointer starts at the last index.', args: [[10, 20, 30, 40, 50], 1000], expected: 120 },
    { scenario: 'Need to move both directions', hint: 'Move l when the sum is too small and r when it is too big — moving both on every step skips the best pair.', args: [[-8, -3, 2, 6, 15], 4], expected: 4 },
    { scenario: 'Default sort trap', hint: 'Sorting without a comparator compares values as strings and puts 30 before 8, which breaks the two pointers.', args: [[-5, -40, 8, 2, 30], -12], expected: -15 },
    { scenario: 'Largest n (500)', hint: 'Biggest allowed input. Sort once, then one two-pointer sweep per i: O(n²).', argsGen: '() => { let s = 11; const a = Array.from({ length: 500 }, () => { s = (s * 48271) % 2147483647; return (s % 2001) + (-1000); }); return [a, 2357]; }', expected: 2357 },
  ],

  solution: {
    code: `function threeSumClosest(nums, target) {
  const a = [...nums].sort((x, y) => x - y);
  let best = a[0] + a[1] + a[2];
  for (let i = 0; i < a.length - 2; i++) {
    let l = i + 1, r = a.length - 1;
    while (l < r) {
      const sum = a[i] + a[l] + a[r];
      if (Math.abs(sum - target) < Math.abs(best - target)) best = sum;
      if (sum === target) return sum;   // cannot get closer than 0
      if (sum < target) l++;
      else r--;
    }
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['i (a[i])', 'l, r', 'sum', 'best', 'move'],
    rows: [
      ['0 (-4)', '1, 3', '-4 + -1 + 2 = -3', '-3', 'l++'],
      ['0 (-4)', '2, 3', '-4 + 1 + 2 = -1', '-1', 'l++ → stop'],
      ['1 (-1)', '2, 3', '-1 + 1 + 2 = 2', '2', 'r-- → stop'],
    ],
    note: 'Sorted: [-4, -1, 1, 2], target 1 → answer 2.',
  },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'Sort + n linear pair searches; the sorted copy is O(n).' },
  alternative: {
    title: 'Skip duplicate i values',
    md: 'Skipping `i` when `a[i] === a[i-1]` is safe here too (it would only re-explore the same sums) and speeds up inputs with many repeats, but it is optional.',
    complexity: 'O(n²) time',
  },
  mistakes: [
    'Initialising `best` to 0 — 0 may not be an achievable sum, so a target near 0 returns a wrong answer. Start from a real triple such as `a[0] + a[1] + a[2]`.',
    'Returning the difference instead of the sum.',
    'Moving both pointers on every step.',
  ],
};
