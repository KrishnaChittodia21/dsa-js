export default {
  id: 'maximum-average-subarray-i',
  title: 'Maximum Average Subarray I',
  difficulty: 'Easy',
  order: 1,
  pattern: 'fixed-window',
  tags: ['array', 'sliding window'],
  source: { platform: 'LeetCode', number: 643, url: 'https://leetcode.com/problems/maximum-average-subarray-i/' },

  statement: `You are given an integer array \`nums\` of \`n\` elements and an integer \`k\`.

Find the **contiguous subarray of length exactly \`k\`** that has the maximum average value and return that average.`,
  examples: [
    { input: 'nums = [1,12,-5,-6,50,3], k = 4', output: '12.75', explanation: 'The best window is [12,-5,-6,50]: sum 51, average 51 / 4 = 12.75.' },
    { input: 'nums = [5], k = 1', output: '5' },
  ],
  constraints: ['1 <= k <= n <= 10^5', '-10^4 <= nums[i] <= 10^4'],

  think: `- The window length never changes. What is the difference between two neighbouring windows?
- Do you need to track the *average* for every window, or is there something simpler to maximise?`,
  patternChallenge: {
    options: ['Binary Search', 'Sliding Window — Fixed Size', 'Prefix Sum + HashMap', 'Two Pointers from both ends'],
    answer: 1,
    explanation: '"Contiguous subarray of length **k**" is the textbook clue for a fixed-size window. Prefix sums would also work (O(n) time) but need O(n) extra space; the window needs O(1).',
  },
  hints: [
    'Maximising the average of length-k windows is the same as maximising their **sum** (divide by k once at the end).',
    'Keep a running sum. When moving right, add `nums[right]` and subtract `nums[right - k]`.',
  ],
  approach: `**Brute force:** for every start index, add up k elements → O(n·k).

**Optimized:** a fixed window. Build the sum of the first k elements. Then slide: add the new element on the right, subtract the element that fell off on the left, and track the maximum sum. Return \`maxSum / k\`.`,

  functionName: 'findMaxAverage',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function findMaxAverage(nums, k) {
  
}
`,
  compare: 'float',
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: [12, -5, -6, 50] has sum 51, average 12.75.', args: [[1, 12, -5, -6, 50, 3], 4], expected: 12.75 },
    { scenario: 'Example 2', hint: 'n = k = 1: the only window is the single element.', args: [[5], 1], expected: 5 },
    { scenario: 'All negative', hint: 'Every window is negative. Starting maxSum at 0 returns 0 instead of the real best (-1.5).', args: [[-3, -1, -2, -4], 2], expected: -1.5 },
    { scenario: 'k = n', hint: 'Only one window: the whole array.', args: [[4, -2, 7, 1], 4], expected: 2.5 },
    { scenario: 'k = 1', hint: 'Windows of one element: the answer is the maximum element.', args: [[3, -7, 9, 2], 1], expected: 9 },
    { scenario: 'Best window at the end', hint: 'The last window is best. Subtract nums[right - k] (the element leaving), not nums[right - k + 1].', args: [[0, 0, 1, 9, 9], 2], expected: 9 },
    { scenario: 'Best window at the start', hint: 'The first window is best — compare it before sliding.', args: [[9, 9, 1, 0, 0], 2], expected: 9 },
    { scenario: 'Return average not sum', hint: 'The answer is sum / k = 5, not the sum 15.', args: [[5, 5, 5, 1], 3], expected: 5 },
    { scenario: 'Fractional average', hint: 'The average is not an integer (5 / 3): return a float, not a rounded value.', args: [[1, 2, 2, 0], 3], expected: 1.6666666666666667 },
    { scenario: 'Extreme values', hint: 'Values at ±10^4: sums stay small enough for exact arithmetic.', args: [[-10000, 10000, 10000, -10000], 2], expected: 10000 },
    { scenario: 'All zeros', hint: 'Every window averages to 0.', args: [[0, 0, 0], 2], expected: 0 },
    { scenario: 'Large input (n = 10^5)', hint: 'Summing each window from scratch is O(n·k) ≈ 2.5·10^9 steps here. Slide the sum: add the new element, subtract the one leaving.', argsGen: '() => { let s = 53; return [Array.from({ length: 100000 }, () => { s = (s * 48271) % 2147483647; return (s % 20001) - 10000; }), 50000]; }', expected: 32.53238, timeLimitMs: 500 },
  ],

  solution: {
    code: `function findMaxAverage(nums, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];   // first window

  let maxSum = windowSum;
  for (let right = k; right < nums.length; right++) {
    windowSum += nums[right] - nums[right - k];       // slide by one
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum / k;
}`,
    explanation: 'We maximise the sum and divide once at the end — dividing every step is unnecessary work and adds floating-point noise.',
  },
  dryRun: {
    columns: ['right', 'enters', 'leaves', 'windowSum', 'maxSum'],
    rows: [
      ['0..3', '1,12,-5,-6', '—', '2', '2'],
      ['4', '50', '1', '51', '51'],
      ['5', '3', '12', '42', '51'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass; only a couple of numbers are stored.' },
  alternative: {
    title: 'Prefix sums',
    md: 'Build `prefix[i] = nums[0] + … + nums[i-1]`; then each window sum is `prefix[i + k] - prefix[i]`. Same O(n) time but O(n) space — useful when many different window sizes are queried.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Starting `maxSum` at 0 — every window could be negative. Start from the first window sum (or -Infinity).',
    'Subtracting `nums[right - k + 1]` instead of `nums[right - k]`.',
    'Returning the sum instead of the average.',
  ],
};
