export default {
  id: 'maximum-sum-circular-subarray',
  title: 'Maximum Sum Circular Subarray',
  difficulty: 'Medium',
  order: 5,
  pattern: 'kadane-max-subarray',
  tags: ['array', 'kadane', 'circular array'],
  source: { platform: 'LeetCode', number: 918, url: 'https://leetcode.com/problems/maximum-sum-circular-subarray/' },

  statement: `\`nums\` is a **circular** integer array: after the last element comes the first one again. Return the largest possible sum of a non-empty subarray.

A subarray may wrap around the end, but it may use each element **at most once** (it cannot be longer than the array).`,
  examples: [
    { input: 'nums = [1,-2,3,-2]', output: '3', explanation: '[3] alone.' },
    { input: 'nums = [5,-3,5]', output: '10', explanation: 'Wrap around: [5, 5] (last element then first).' },
    { input: 'nums = [-3,-2,-3]', output: '-2' },
  ],
  constraints: ['n == nums.length', '1 <= n <= 3 * 10^4', '-3 * 10^4 <= nums[i] <= 3 * 10^4'],

  think: `- A best subarray either wraps around the end or it does not. The non-wrapping case is ordinary Kadane.
- If it wraps, what part of the array is **left out**? What would you want that left-out part to be?
- What goes wrong when every number is negative?`,
  patternChallenge: {
    options: ['Sliding window over the doubled array', 'Prefix sums + hash map', 'Two pointers', "Kadane's algorithm (max and min) with total − min"],
    answer: 3,
    explanation: 'A wrapping subarray is "total minus a contiguous middle piece". Maximising it = minimising that piece = min-Kadane. Doubling the array needs a window with a length cap AND negatives, which a plain window cannot handle (that version needs a monotonic deque).',
  },
  hints: [
    'Run Kadane for the maximum subarray and, in the same loop, Kadane for the minimum subarray. Also sum everything.',
    'Answer = max(maxSub, total − minSub), except when maxSub < 0 (all negative): then return maxSub, because total − minSub would be the empty subarray.',
  ],
  approach: `**Brute force:** for every start, walk up to n steps around the circle → O(n²).

**Kadane twice (O(n), O(1)):**
- Case 1, no wrap: \`maxSub\` = standard Kadane.
- Case 2, wrap: the chosen elements are a prefix plus a suffix; the excluded elements form one contiguous middle block. The sum is \`total − (middle)\`, maximised when the middle is the **minimum subarray**.
- If every number is negative, the minimum subarray is the whole array, and \`total − minSub = 0\` means choosing nothing — not allowed. \`maxSub < 0\` detects this case.`,

  functionName: 'maxSubarraySumCircular',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubarraySumCircular(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'No wrap helps here: [3] alone is best.', args: [[1, -2, 3, -2]], expected: 3 },
    { scenario: 'Example 2', hint: 'Wrapping gives [5, 5] = total − (min subarray −3).', args: [[5, -3, 5]], expected: 10 },
    { scenario: 'Example 3', hint: 'All negative: total − minSub would be 0 (empty subarray). Return the plain Kadane max instead.', args: [[-3, -2, -3]], expected: -2 },
    { scenario: 'Single positive', hint: 'Smallest input: one element.', args: [[7]], expected: 7 },
    { scenario: 'Single negative', hint: 'Initialising maxSub with 0 returns 0 instead of −7.', args: [[-7]], expected: -7 },
    { scenario: 'Non-wrapping best', hint: 'The best run is in the middle of the array.', args: [[3, -1, 2, -1]], expected: 4 },
    { scenario: 'Tie between options', hint: 'Wrapping and not wrapping both give 3.', args: [[3, -2, 2, -3]], expected: 3 },
    { scenario: 'Whole array is best', hint: 'With no harmful negatives the best uses every element exactly once.', args: [[2, -2, 2, 7, 8, 0]], expected: 19 },
    { scenario: 'Wrap across the end', hint: 'The best run starts near the end and continues from index 0.', args: [[8, -1, -3, 8, -6, -9, 2, 4]], expected: 18 },
    { scenario: 'Doubled array trap', hint: 'Running Kadane over nums + nums allows a subarray longer than n (here it would count every element twice).', args: [[4, 4, 4]], expected: 12 },
    { scenario: 'Value bounds', hint: 'Values at ±3·10^4.', args: [[30000, -30000, 30000, -30000, 30000]], expected: 60000 },
    { scenario: 'Large wrap-around (n = 3·10^4)', hint: 'Checking every start and length is O(n²) ≈ 9·10^8 here; one pass computing max and min subarrays is O(n).', argsGen: '() => { let s = 2468; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 30000 }, (_, i) => (i > 10000 && i < 20000 ? -1 - (r() % 30000) : (r() % 60001) - 29000))]; }', expected: 15040657, timeLimitMs: 300 },
    { scenario: 'Large all negative (n = 3·10^4)', hint: 'Every value is negative at full size — the guard must kick in.', argsGen: '() => { let s = 2468; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 30000 }, () => -1 - (r() % 30000))]; }', expected: -1, timeLimitMs: 300 },
  ],
  solution: {
    code: `function maxSubarraySumCircular(nums) {
  let total = 0;
  let curMax = 0, maxSub = -Infinity;
  let curMin = 0, minSub = Infinity;
  for (const x of nums) {
    total += x;
    curMax = Math.max(x, curMax + x);
    maxSub = Math.max(maxSub, curMax);
    curMin = Math.min(x, curMin + x);
    minSub = Math.min(minSub, curMin);
  }
  // All negative → the wrap formula would pick the empty subarray.
  if (maxSub < 0) return maxSub;
  return Math.max(maxSub, total - minSub);
}`,
  },
  dryRun: {
    columns: ['x', 'curMax', 'maxSub', 'curMin', 'minSub', 'total'],
    rows: [
      ['5', '5', '5', '5', '5', '5'],
      ['-3', '2', '5', '-3', '-3', '2'],
      ['5', '7', '7', '2', '-3', '7'],
      ['result', '', '', '', '', 'max(7, 7 − (−3)) = 10'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass computing four running values.' },
  alternative: {
    title: 'Prefix sums + monotonic deque over the doubled array',
    md: 'Conceptually treat nums + nums, and for each end r find the smallest prefix P[l] with r − l ≤ n. The minimum over a sliding range is a monotonic-deque job (Queue & Deque topic). O(n) but more complex.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Missing the all-negative guard (returns 0).',
    'Doubling the array and running plain Kadane — allows subarrays longer than n.',
    'Initialising maxSub/minSub with 0.',
  ],
};
