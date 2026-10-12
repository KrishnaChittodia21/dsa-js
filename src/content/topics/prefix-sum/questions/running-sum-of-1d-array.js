export default {
  id: 'running-sum-of-1d-array',
  title: 'Running Sum of 1d Array',
  difficulty: 'Easy',
  order: 1,
  pattern: 'prefix-sum-1d',
  tags: ['array', 'prefix sum'],
  source: { platform: 'LeetCode', number: 1480, url: 'https://leetcode.com/problems/running-sum-of-1d-array/' },

  statement: `Given an array \`nums\`, return its **running sum**: an array where element \`i\` is \`nums[0] + nums[1] + … + nums[i]\`.`,
  examples: [
    { input: 'nums = [1,2,3,4]', output: '[1,3,6,10]', explanation: '[1, 1+2, 1+2+3, 1+2+3+4].' },
    { input: 'nums = [1,1,1,1,1]', output: '[1,2,3,4,5]' },
    { input: 'nums = [3,1,2,10,1]', output: '[3,4,6,16,17]' },
  ],
  constraints: ['1 <= nums.length <= 1000', '-10^6 <= nums[i] <= 10^6'],

  think: `- How does the answer at \`i\` relate to the answer at \`i − 1\`?
- Do you ever need to look further back than one position?
- This is the "inclusive" prefix sum (no leading 0). How does it differ from the \`n + 1\`-length version used for range queries?`,
  patternChallenge: {
    options: ['Sliding Window', 'Prefix Sum', 'Two Pointers', 'Sorting'],
    answer: 1,
    explanation: '"Sum of everything up to i" is the definition of a prefix sum. Each value is the previous one plus the current element.',
  },
  hints: [
    '`result[i] = result[i - 1] + nums[i]`.',
    'Start with `result[0] = nums[0]` (or keep a running variable starting at 0).',
  ],
  approach: `**Brute force:** for each \`i\`, add \`nums[0..i]\` → O(n²).

**Prefix sum:** keep a running total. Each step adds one element → O(n). This inclusive version has length n; the range-query version prepends a 0 and has length n + 1 — both are "prefix sums", just different indexing conventions.`,

  functionName: 'runningSum',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function runningSum(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[1, 1+2, 1+2+3, 1+2+3+4].', args: [[1, 2, 3, 4]], expected: [1, 3, 6, 10] },
    { scenario: 'Example 2', hint: 'All ones: the running sum counts up.', args: [[1, 1, 1, 1, 1]], expected: [1, 2, 3, 4, 5] },
    { scenario: 'Example 3', hint: 'Each output adds the current element to the previous output.', args: [[3, 1, 2, 10, 1]], expected: [3, 4, 6, 16, 17] },
    { scenario: 'Single element', hint: 'Smallest input: the running sum is the element itself. An in-place loop starting at 0 reads nums[−1] → NaN.', args: [[5]], expected: [5] },
    { scenario: 'Two elements', hint: 'The first output is unchanged; the second adds both.', args: [[-7, 7]], expected: [-7, 0] },
    { scenario: 'All negative', hint: 'The running sum keeps decreasing.', args: [[-1, -2, -3]], expected: [-1, -3, -6] },
    { scenario: 'Alternating signs', hint: 'Sums return to 0 repeatedly.', args: [[2, -2, 2, -2]], expected: [2, 0, 2, 0] },
    { scenario: 'All zeros', hint: 'Zeros keep the sum at 0.', args: [[0, 0, 0]], expected: [0, 0, 0] },
    { scenario: 'Value bounds', hint: 'Values at ±10^6.', args: [[1000000, 1000000, -1000000, -1000000, -1000000]], expected: [1000000, 2000000, 1000000, 0, -1000000] },
    { scenario: 'Leading zeros then values', hint: 'The first non-zero element starts the growth.', args: [[0, 0, 4, -1, 6]], expected: [0, 0, 4, 3, 9] },
    { scenario: 'Max size, max values (n = 1000)', hint: '1000 values of 10^6 — the last running sum is 10^9.', argsGen: '() => [new Array(1000).fill(1000000)]', expected: Array.from({ length: 1000 }, (_, i) => (i + 1) * 1000000) },
    { scenario: 'Max size, alternating (n = 1000)', hint: 'Alternating +i/−i values at full size.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => (i % 2 ? -i : i))]', expected: Array.from({ length: 1000 }, (_, i) => (i % 2 ? -(i + 1) / 2 : i / 2)) },
  ],

  solution: {
    code: `function runningSum(nums) {
  const result = new Array(nums.length);
  let running = 0;
  for (let i = 0; i < nums.length; i++) {
    running += nums[i];
    result[i] = running;
  }
  return result;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'running', 'result'],
    rows: [
      ['0', '1', '1', '[1]'],
      ['1', '2', '3', '[1,3]'],
      ['2', '3', '6', '[1,3,6]'],
      ['3', '4', '10', '[1,3,6,10]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One pass; the output array is O(n) (O(1) extra if done in place).' },
  alternative: {
    title: 'In place',
    md: 'If mutating the input is allowed: `for (let i = 1; i < nums.length; i++) nums[i] += nums[i - 1]; return nums;` — O(1) extra space.',
    code: `function runningSum(nums) {
  for (let i = 1; i < nums.length; i++) nums[i] += nums[i - 1];
  return nums;
}`,
    complexity: 'O(n) time, O(1) extra space',
  },
  mistakes: [
    'Recomputing the sum from 0 for every index (O(n²)).',
    'Starting the in-place loop at 0 and reading `nums[-1]` (undefined → NaN).',
  ],
};
