export default {
  id: 'minimum-size-subarray-sum',
  title: 'Minimum Size Subarray Sum',
  difficulty: 'Medium',
  order: 3,
  pattern: 'variable-window',
  tags: ['array', 'sliding window'],
  source: { platform: 'LeetCode', number: 209, url: 'https://leetcode.com/problems/minimum-size-subarray-sum/' },

  statement: `Given an array of **positive** integers \`nums\` and a positive integer \`target\`, return the length of the **shortest** contiguous subarray whose sum is **greater than or equal to** \`target\`.

If no such subarray exists, return \`0\`.`,
  examples: [
    { input: 'target = 7, nums = [2,3,1,2,4,3]', output: '2', explanation: '[4,3] has sum 7 and length 2.' },
    { input: 'target = 4, nums = [1,4,4]', output: '1' },
    { input: 'target = 11, nums = [1,1,1,1,1,1,1,1]', output: '0', explanation: 'The whole array only sums to 8.' },
  ],
  constraints: ['1 <= target <= 10^9', '1 <= nums.length <= 10^5', '1 <= nums[i] <= 10^4'],

  think: `- Shortest or longest? Which of the two variable-window templates records the answer *inside* the shrink loop?
- Why does it matter that every number is positive?
- Once a window has sum ≥ target, is there any point in extending it further to the right before shrinking?`,
  patternChallenge: {
    options: ['Prefix Sum + HashMap', 'Sliding Window — Fixed Size', 'Sorting + Two Pointers', 'Sliding Window — Variable Size (shortest valid)'],
    answer: 3,
    explanation: 'Contiguous, minimise the length, and "sum ≥ target" is monotonic **because all numbers are positive** (adding only increases the sum, removing only decreases it). That is the shortest-valid window. Prefix sum + HashMap is for "sum exactly k" with negatives; sorting would break contiguity.',
  },
  hints: [
    'Keep a running `sum` of the window. Grow right and add `nums[right]`.',
    'While `sum >= target` the window is valid: record its length, then subtract `nums[left]` and move left — maybe a shorter window still works.',
  ],
  approach: `**Brute force:** every start, extend until sum ≥ target → O(n²).

**Optimized (shortest valid window):**
1. \`sum += nums[right]\`.
2. While \`sum >= target\`: \`best = min(best, right - left + 1)\`, then \`sum -= nums[left++]\`.
3. Return \`best\` or 0 if it stayed \`Infinity\`.

**Why positivity matters:** with positives, removing an element strictly lowers the sum, so once the window becomes invalid, no shorter window ending at \`right\` can be valid — left never needs to move back. With negatives this breaks (you would need prefix sums + a monotonic deque, see Queue & Deque).`,

  functionName: 'minSubArrayLen',
  paramNames: ['target', 'nums'],
  starterCode: `/**
 * @param {number} target
 * @param {number[]} nums
 * @return {number}
 */
function minSubArrayLen(target, nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: [4, 3] reaches 7 with length 2.', args: [7, [2, 3, 1, 2, 4, 3]], expected: 2 },
    { scenario: 'Example 2', hint: 'A single element already reaches the target: length 1.', args: [4, [1, 4, 4]], expected: 1 },
    { scenario: 'Example 3', hint: 'Even the whole array is too small: return 0, not Infinity.', args: [11, [1, 1, 1, 1, 1, 1, 1, 1]], expected: 0 },
    { scenario: 'Single element, enough', hint: 'Smallest input that succeeds: [5] with target 5.', args: [5, [5]], expected: 1 },
    { scenario: 'Single element, too small', hint: 'Smallest input that fails: return 0.', args: [6, [5]], expected: 0 },
    { scenario: 'Whole array needed', hint: 'Only the full array reaches the target — the answer is n.', args: [15, [1, 2, 3, 4, 5]], expected: 5 },
    { scenario: 'Sum exactly target', hint: '"Greater than or equal": a window summing to exactly the target counts.', args: [6, [1, 2, 3]], expected: 3 },
    { scenario: 'Record before shrinking', hint: 'Record the length inside the while loop, while the window is still valid. Recording after it measures an invalid window.', args: [8, [1, 1, 1, 8, 1]], expected: 1 },
    { scenario: 'Best window at the end', hint: 'The shortest window is the last two elements.', args: [15, [1, 2, 3, 7, 8]], expected: 2 },
    { scenario: 'Max element values', hint: 'Elements of 10^4 and a target of 10^9 cannot be reached by a short array: 0.', args: [1000000000, [10000, 10000, 10000]], expected: 0 },
    { scenario: 'Large, no answer (n = 10^5)', hint: 'The total is below target: a double loop scans every subarray (O(n²)). A sliding window is O(n).', argsGen: '() => [1000000000, new Array(100000).fill(1)]', expected: 0, timeLimitMs: 1000 },
    { scenario: 'Large input, long answer', hint: 'The target needs about half the array: the window grows and shrinks across 10^5 elements.', argsGen: '() => { let s = 61; return [250000000, Array.from({ length: 100000 }, () => { s = (s * 48271) % 2147483647; return (s % 10000) + 1; })]; }', expected: 49556, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minSubArrayLen(target, nums) {
  let left = 0, sum = 0, best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {                 // valid → record, then try shorter
      best = Math.min(best, right - left + 1);
      sum -= nums[left++];
    }
  }
  return best === Infinity ? 0 : best;
}`,
  },
  dryRun: {
    columns: ['right', 'nums[right]', 'sum', 'shrinks (recorded lengths)', 'best'],
    rows: [
      ['0-2', '2,3,1', '6', '—', '∞'],
      ['3', '2', '8', 'len 4; remove 2 → 6', '4'],
      ['4', '4', '10', 'len 4; remove 3 → 7, len 3; remove 1 → 6', '3'],
      ['5', '3', '9', 'len 3; remove 2 → 7, len 2; remove 4 → 3', '2'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Every element is added once and subtracted at most once.' },
  alternative: {
    title: 'Prefix sums + binary search',
    md: 'Prefix sums are strictly increasing (positive numbers), so for each start `i` binary search the first `j` with `prefix[j] - prefix[i] >= target`. O(n log n) — the classic follow-up answer when asked for an n log n solution.',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Recording the length after the while loop (the window is already invalid there).',
    'Returning `Infinity` instead of 0 when no window qualifies.',
    'Using this template on arrays that can contain negative numbers.',
  ],
};
