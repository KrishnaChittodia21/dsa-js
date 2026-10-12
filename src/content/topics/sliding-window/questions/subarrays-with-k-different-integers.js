export default {
  id: 'subarrays-with-k-different-integers',
  title: 'Subarrays with K Different Integers',
  difficulty: 'Hard',
  order: 2,
  pattern: 'variable-window',
  tags: ['array', 'hash map', 'sliding window', 'counting'],
  source: { platform: 'LeetCode', number: 992, url: 'https://leetcode.com/problems/subarrays-with-k-different-integers/' },

  statement: `Given an integer array \`nums\` and an integer \`k\`, count the **contiguous subarrays** that contain **exactly \`k\` different** integers.

For example, \`[1,2,3,1,2]\` has 3 different integers.`,
  examples: [
    { input: 'nums = [1,2,1,2,3], k = 2', output: '7', explanation: '[1,2], [2,1], [1,2], [2,3], [1,2,1], [2,1,2], [1,2,1,2].' },
    { input: 'nums = [1,2,1,3,4], k = 3', output: '3', explanation: '[1,2,1,3], [2,1,3], [1,3,4].' },
  ],
  constraints: ['1 <= nums.length <= 2 * 10^4', '1 <= nums[i], k <= nums.length'],

  think: `- Fix the right end. As the left end moves right, the number of distinct values can only go down. Is "exactly k" a single contiguous range of left positions, or can it be awkward to track with one pointer?
- "At most k distinct" is monotonic. How many subarrays ending at \`right\` have at most k distinct values if the longest valid window is \`[left, right]\`?
- How do you turn two "at most" counts into an "exactly" count?`,
  patternChallenge: {
    options: ['Prefix Sum + HashMap', 'Sliding Window — Fixed Size k', 'Backtracking over all subarrays', 'Sliding Window — Variable Size, exactly(K) = atMost(K) − atMost(K−1)'],
    answer: 3,
    explanation: '"Exactly K" is not monotonic for a single window (shrinking can go from K to K−1, growing from K to K+1), so one window does not directly count it. "At most K" *is* monotonic and easy to count; the difference of two at-most counts is exactly K. Prefix sums need an additive quantity — "number of distinct values" is not additive.',
  },
  hints: [
    'Write `atMost(K)`: a standard variable window where the window is valid while it has ≤ K distinct values. Every valid window `[left, right]` contributes `right - left + 1` subarrays ending at `right`.',
    'The answer is `atMost(k) - atMost(k - 1)`: subarrays with ≤ k distinct minus those with ≤ k − 1 distinct.',
  ],
  approach: `**Brute force:** for each start, extend and maintain a Set; count when its size is exactly k (and stop once it exceeds k) → O(n²).

**Why not one window?** For a fixed right end, the valid left positions for "exactly k" form a *range* \`[l1, l2]\`, not a single boundary, so one pointer is not enough.

**Optimized:** counting "at most K" is easy:
- Grow right, add to a count Map.
- While \`map.size > K\`, shrink from the left (delete keys at 0).
- Now every start in \`[left, right]\` gives a valid subarray ending at right → add \`right - left + 1\`.

Then \`exactly(k) = atMost(k) − atMost(k − 1)\`: subtracting removes exactly the subarrays with fewer than k distinct values.`,

  functionName: 'subarraysWithKDistinct',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function subarraysWithKDistinct(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 7 subarrays with exactly two distinct values.', args: [[1, 2, 1, 2, 3], 2], expected: 7 },
    { scenario: 'Example 2', hint: 'Three distinct values: only three subarrays qualify.', args: [[1, 2, 1, 3, 4], 3], expected: 3 },
    { scenario: 'Single element', hint: 'The smallest input: [1] has exactly one distinct value.', args: [[1], 1], expected: 1 },
    { scenario: 'k larger than distinct count', hint: 'Only two distinct values exist, so no subarray has 3: answer 0.', args: [[1, 2, 1, 2], 3], expected: 0 },
    { scenario: 'All equal, k = 1', hint: 'Every subarray qualifies: n(n+1)/2 = 10. Count `right - left + 1` per step, not 1.', args: [[2, 2, 2, 2], 1], expected: 10 },
    { scenario: 'All distinct, k = 1', hint: 'Only single elements qualify: n subarrays.', args: [[1, 2, 3, 4], 1], expected: 4 },
    { scenario: 'k = n, all distinct', hint: 'Only the whole array has n distinct values.', args: [[1, 2, 3, 4], 4], expected: 1 },
    { scenario: 'Left end further right', hint: 'One shrinking window misses subarrays starting further right. Use atMost(k) - atMost(k - 1).', args: [[1, 1, 2, 1, 1], 2], expected: 8 },
    { scenario: 'Delete keys at zero', hint: 'If counts that reach 0 stay in the Map, its size overstates the distinct values.', args: [[1, 2, 3, 1, 2, 3, 1], 2], expected: 6 },
    { scenario: 'Mixed example', hint: 'A longer mix of repeats; compare with a brute-force count if unsure.', args: [[2, 1, 1, 1, 2, 3, 3, 2], 2], expected: 12 },
    { scenario: 'Values up to n', hint: 'Values are between 1 and n; k = 2 on a short array.', args: [[3, 3, 1], 2], expected: 2 },
    { scenario: 'Large input (n = 2·10^4)', hint: 'Enumerating all subarrays is O(n²). atMost(k) - atMost(k - 1) with sliding windows is O(n).', argsGen: '() => { let s = 73; return [Array.from({ length: 20000 }, () => { s = (s * 48271) % 2147483647; return (s % 2000) + 1; }), 1000]; }', expected: 36776, timeLimitMs: 150 },
    { scenario: 'Large, all equal', hint: '2·10^4 equal values with k = 1: the answer is n(n+1)/2 = 200 010 000.', argsGen: '() => [new Array(20000).fill(7), 1]', expected: 200010000, timeLimitMs: 150 },
  ],

  solution: {
    code: `function subarraysWithKDistinct(nums, k) {
  return atMost(nums, k) - atMost(nums, k - 1);
}

// Number of subarrays with at most K distinct values.
function atMost(nums, K) {
  const count = new Map();
  let left = 0, total = 0;
  for (let right = 0; right < nums.length; right++) {
    count.set(nums[right], (count.get(nums[right]) ?? 0) + 1);
    while (count.size > K) {
      const v = nums[left++];
      count.set(v, count.get(v) - 1);
      if (count.get(v) === 0) count.delete(v);
    }
    total += right - left + 1; // subarrays [left..right], [left+1..right], …, [right..right]
  }
  return total;
}`,
    explanation: '`atMost(nums, 0)` correctly returns 0: the window can never hold an element, so `left` passes `right` each step and adds 0.',
  },
  dryRun: `\`nums = [1,2,1,2,3]\`

| right | window for atMost(2) | +count | window for atMost(1) | +count |
|---|---|---|---|---|
| 0 | [1] | 1 | [1] | 1 |
| 1 | [1,2] | 2 | [2] | 1 |
| 2 | [1,2,1] | 3 | [1] | 1 |
| 3 | [1,2,1,2] | 4 | [2] | 1 |
| 4 | [2,3] | 2 | [3] | 1 |

atMost(2) = 12, atMost(1) = 5 → exactly(2) = **7**.`,
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Two linear window passes; each Map holds at most K + 1 keys.' },
  alternative: {
    title: 'One pass with two left pointers',
    md: 'Keep `leftFar` (the smallest left with ≤ k distinct) and `leftNear` (the smallest left with ≤ k − 1 distinct), each with its own count Map. For each right, add `leftNear - leftFar` — the number of starts with exactly k distinct. Same complexity, one loop.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Trying to count "exactly K" with one shrinking window — it misses subarrays whose left end is further right.',
    'Adding 1 per valid window instead of `right - left + 1`.',
    'Not deleting keys whose count drops to 0, so `count.size` overstates the distinct values.',
  ],
};
