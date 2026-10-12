export default {
  id: 'maximum-subarray',
  title: 'Maximum Subarray',
  difficulty: 'Medium',
  order: 1,
  pattern: 'kadane-max-subarray',
  tags: ['array', 'kadane', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 53, url: 'https://leetcode.com/problems/maximum-subarray/' },

  statement: `Given an integer array \`nums\`, find the **non-empty contiguous subarray** with the largest sum and return that sum.`,
  examples: [
    { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] sums to 6.' },
    { input: 'nums = [1]', output: '1' },
    { input: 'nums = [5,4,-1,7,8]', output: '23', explanation: 'The whole array.' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],

  think: `- For a fixed index i, what is the best subarray that **ends exactly at i**? What are its only two possible shapes?
- When is it better to throw away everything before i?
- What should the answer be if every number is negative?`,
  patternChallenge: {
    options: ['Sliding window (variable size)', 'Prefix sum + hash map', 'Binary search on the answer', "Kadane's algorithm"],
    answer: 3,
    explanation: 'Contiguous subarray, any length, maximise the sum, negatives allowed: Kadane. A variable window needs a monotonic rule, which negatives break. Prefix sums + hash map are for "sum equals k" counting, not maximisation.',
  },
  hints: [
    'Let cur = best sum of a subarray ending at the previous index. The best subarray ending at i is either nums[i] alone or cur + nums[i].',
    'cur = max(nums[i], cur + nums[i]); best = max(best, cur). Initialise both with nums[0], not 0.',
  ],
  approach: `**Brute force:** every start, extend the end with a running sum → O(n²).

**Kadane (O(n), O(1)):** define \`cur(i)\` = best sum of a subarray ending at i. It is \`max(nums[i], cur(i−1) + nums[i])\` — extend if the previous best helps, restart if it is negative. The answer is the max of all \`cur(i)\`. Correct by optimal substructure: the part of an optimal subarray before i is itself a subarray ending at i − 1, so it can be replaced by the best one.

**Divide and conquer** (follow-up) splits the array, combining left best, right best and the best crossing the middle → O(n log n).`,

  functionName: 'maxSubArray',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[4, −1, 2, 1] sums to 6 — dropping the negative prefix is what makes it best.', args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
    { scenario: 'Example 2', hint: 'Smallest input: the single element.', args: [[1]], expected: 1 },
    { scenario: 'Example 3', hint: 'The whole array is best despite the −1 inside.', args: [[5, 4, -1, 7, 8]], expected: 23 },
    { scenario: 'All negative', hint: 'Initialising best = 0 returns 0 here; the answer is the largest element, −1.', args: [[-3, -1, -2]], expected: -1 },
    { scenario: 'Single negative', hint: 'One negative element is its own answer.', args: [[-5]], expected: -5 },
    { scenario: 'Zeros and a negative', hint: 'The best is 0 (a single zero).', args: [[0, -1, 0]], expected: 0 },
    { scenario: 'Keep through small dips', hint: 'Extending across −1s is better than restarting.', args: [[2, -1, 2, -1, 2]], expected: 4 },
    { scenario: 'Restart after big drop', hint: 'cur (ending here) must restart after −19, while best (anywhere) remembers 8.', args: [[8, -19, 5, -4, 20]], expected: 21 },
    { scenario: 'Best at the start', hint: 'The answer is a prefix; later elements only hurt.', args: [[6, 1, -10, 2, 3]], expected: 7 },
    { scenario: 'Value bounds', hint: 'Values at ±10^4.', args: [[-10000, 10000, -10000, 10000, 10000]], expected: 20000 },
    { scenario: 'Large all negative (n = 10^5)', hint: 'O(n²) over all subarrays is ~5·10^9 steps; Kadane is one pass. The answer is the largest element.', argsGen: '() => { let s = 1357; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => -1 - (r() % 10000))]; }', expected: -1, timeLimitMs: 1000 },
    { scenario: 'Large random (n = 10^5)', hint: 'Random values at full size with a long best run.', argsGen: '() => { let s = 1357; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => (r() % 20001) - 9990)]; }', expected: 437420, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxSubArray(nums) {
  let cur = nums[0];   // best sum of a subarray ending at the current index
  let best = nums[0];  // best sum anywhere so far
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);  // restart or extend
    best = Math.max(best, cur);
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'cur', 'best'],
    rows: [
      ['0', '-2', '-2', '-2'],
      ['1', '1', '1 (restart)', '1'],
      ['2', '-3', '-2', '1'],
      ['3', '4', '4 (restart)', '4'],
      ['4', '-1', '3', '4'],
      ['5', '2', '5', '5'],
      ['6', '1', '6', '6'],
      ['7', '-5', '1', '6'],
      ['8', '4', '5', '6'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass, two variables.' },
  alternative: {
    title: 'Prefix sums: best = max(prefix[i] − min prefix before i)',
    md: 'sum(l..r) = P[r+1] − P[l]. For each r, subtract the smallest prefix seen so far. This is Kadane in disguise and is a useful way to see it.',
    code: `function maxSubArray(nums) {
  let prefix = 0, minPrefix = 0, best = -Infinity;
  for (const x of nums) {
    prefix += x;
    best = Math.max(best, prefix - minPrefix);
    minPrefix = Math.min(minPrefix, prefix);
  }
  return best;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Initialising best = 0 → returns 0 for all-negative arrays.',
    'Resetting cur to 0 when negative, then taking max — works only if you also handle the all-negative case.',
    'Confusing cur ("ending here") with best ("anywhere").',
  ],
};
