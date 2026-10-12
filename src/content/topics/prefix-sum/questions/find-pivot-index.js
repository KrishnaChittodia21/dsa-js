export default {
  id: 'find-pivot-index',
  title: 'Find Pivot Index',
  difficulty: 'Easy',
  order: 3,
  pattern: 'prefix-sum-1d',
  tags: ['array', 'prefix sum'],
  source: { platform: 'LeetCode', number: 724, url: 'https://leetcode.com/problems/find-pivot-index/' },

  statement: `The **pivot index** of \`nums\` is an index where the sum of all numbers strictly to its **left** equals the sum of all numbers strictly to its **right**. An empty side has sum 0.

Return the **leftmost** pivot index, or \`-1\` if there is none.`,
  examples: [
    { input: 'nums = [1,7,3,6,5,6]', output: '3', explanation: 'Left: 1 + 7 + 3 = 11. Right: 5 + 6 = 11.' },
    { input: 'nums = [1,2,3]', output: '-1' },
    { input: 'nums = [2,1,-1]', output: '0', explanation: 'Left is empty (0); right is 1 + (-1) = 0.' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '-1000 <= nums[i] <= 1000'],

  think: `- If you know the total and the left sum, what is the right sum?
- How does the left sum change when you move one index to the right?
- Can index 0 or the last index be a pivot?`,
  patternChallenge: {
    options: ['Two Pointers — Opposite Ends', 'Binary Search', 'Hash Map', 'Prefix Sum (left sum + total)'],
    answer: 3,
    explanation: 'Left sum is a running prefix; right sum is `total − left − nums[i]`. Two pointers from both ends do not work with negative numbers (there is no rule for which side to move), and the sums are not monotonic, so binary search fails too.',
  },
  hints: [
    'Compute `total` first.',
    'Walk left to right with `left = 0`. At index i, the right sum is `total - left - nums[i]`. Compare, then `left += nums[i]`.',
  ],
  approach: `**Brute force:** for each index, sum both sides → O(n²).

**Prefix sum:** \`right(i) = total − left(i) − nums[i]\`. Keep \`left\` as a running sum. One pass to get \`total\`, one pass to test each index → O(n), O(1) space.

Because we test indices from left to right and return at the first match, we return the **leftmost** pivot.`,

  functionName: 'pivotIndex',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function pivotIndex(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Left 1 + 7 + 3 = 11 equals right 5 + 6.', args: [[1, 7, 3, 6, 5, 6]], expected: 3 },
    { scenario: 'Example 2', hint: 'No index balances the two sides — return -1.', args: [[1, 2, 3]], expected: -1 },
    { scenario: 'Example 3', hint: 'Index 0 is the pivot: its left side is empty (sum 0). Do not skip index 0.', args: [[2, 1, -1]], expected: 0 },
    { scenario: 'Single element', hint: 'Both sides are empty, so index 0 is the pivot.', args: [[5]], expected: 0 },
    { scenario: 'Two elements', hint: 'With [1, 0], the pivot is 0: left is empty, right is 0.', args: [[1, 0]], expected: 0 },
    { scenario: 'Two elements, no pivot', hint: 'Neither index balances.', args: [[1, 1]], expected: -1 },
    { scenario: 'Pivot at the last index', hint: 'Right side is empty — the loop must reach the final index.', args: [[-1, -1, 0, 1, 1, 0]], expected: 5 },
    { scenario: 'All zeros, pick leftmost', hint: 'Every index is a pivot; return the leftmost one.', args: [[0, 0, 0]], expected: 0 },
    { scenario: 'Pivot excluded from both sides', hint: 'Adding nums[i] to left before comparing makes [1,-1,2] look pivot-less; the answer is 2.', args: [[1, -1, 2]], expected: 2 },
    { scenario: 'Negative values', hint: 'Negatives break any two-pointer "move the smaller side" idea.', args: [[-1, -1, -1, -1, -1, 0]], expected: 2 },
    { scenario: 'Multiple pivots', hint: 'Two indices balance; return the leftmost.', args: [[0, 1, -1, 0]], expected: 0 },
    { scenario: 'Extreme values', hint: 'Boundary values ±1000.', args: [[1000, -1000, 1000, 1000, -1000]], expected: 0 },
    { scenario: 'Large, no pivot (n = 10^4)', hint: 'Re-summing both sides for every index is O(n²); a running left sum and the total make it O(n).', argsGen: '() => { const a = Array(10000).fill(1); a[9998] = -9997; return [a]; }', expected: -1, timeLimitMs: 50 },
  ],

  solution: {
    code: `function pivotIndex(nums) {
  let total = 0;
  for (const x of nums) total += x;
  let left = 0;
  for (let i = 0; i < nums.length; i++) {
    const right = total - left - nums[i];
    if (left === right) return i;
    left += nums[i];
  }
  return -1;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'left', 'right = 28 − left − nums[i]', 'pivot?'],
    rows: [
      ['0', '1', '0', '27', 'no'],
      ['1', '7', '1', '20', 'no'],
      ['2', '3', '8', '17', 'no'],
      ['3', '6', '11', '11', 'yes → 3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Two linear passes, a few variables.' },
  alternative: {
    title: 'Explicit prefix array',
    md: 'Build `prefix` (n + 1 entries). Index i is a pivot when `prefix[i] === prefix[n] - prefix[i + 1]`. Same time, O(n) space — handy if you need many such checks.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Adding `nums[i]` to `left` before comparing — the pivot itself belongs to neither side.',
    'Assuming values are positive and using two pointers.',
    'Forgetting that index 0 (empty left side) can be the pivot.',
  ],
};
