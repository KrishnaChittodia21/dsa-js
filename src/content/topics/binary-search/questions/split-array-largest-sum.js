export default {
  id: 'split-array-largest-sum',
  title: 'Split Array Largest Sum',
  difficulty: 'Hard',
  order: 1,
  pattern: 'binary-search-on-answer',
  tags: ['array', 'binary search on answer', 'greedy', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 410, url: 'https://leetcode.com/problems/split-array-largest-sum/' },

  statement: `Given an array of non-negative integers \`nums\` and an integer \`k\`, split \`nums\` into exactly \`k\` **non-empty contiguous** subarrays so that the **largest subarray sum** is as small as possible.

Return that minimised largest sum.`,
  examples: [
    { input: 'nums = [7,2,5,10,8], k = 2', output: '18', explanation: '[7,2,5] and [10,8]: the larger sum is 18, and no split does better.' },
    { input: 'nums = [1,2,3,4,5], k = 2', output: '9', explanation: '[1,2,3] and [4,5].' },
  ],
  constraints: ['1 <= nums.length <= 1000', '0 <= nums[i] <= 10^6', '1 <= k <= min(50, nums.length)'],

  think: `- "Minimise the maximum" — can you flip it into a yes/no question about a limit x?
- For a fixed limit x, how many parts does a greedy split need? Why is "at most k parts" enough when the problem says "exactly k"?
- What are the natural bounds on x?`,
  patternChallenge: {
    options: ['Sliding Window over part sums', 'Binary Search on the answer + greedy part count', 'Sort and distribute largest-first', 'Two Pointers from both ends'],
    answer: 1,
    explanation: '"Minimise the largest" + a monotonic feasibility test ("can we split into ≤ k parts with every sum ≤ x?") is the signature of binary search on the answer. Sorting breaks contiguity; a window does not choose k split points.',
  },
  hints: [
    'feasible(x): greedily extend the current part while its sum stays ≤ x; count parts. Feasible if parts ≤ k.',
    'lo = max(nums) (a part must contain the biggest element), hi = sum(nums) (one part). Find the first feasible x.',
  ],
  approach: `**Brute force:** try all ways to place k − 1 cuts: C(n − 1, k − 1) — exponential.

**DP:** \`dp[j][i]\` = best largest sum splitting the first i elements into j parts; transition over the last cut. O(k · n²) = 5·10^7 — passes but is heavy.

**Optimized (binary search on the answer):**
- Decision question: *can we split into at most k parts with every part sum ≤ x?* Greedy answers it in O(n): extend the current part while the sum stays ≤ x.
- Monotonic: a bigger x never needs more parts.
- "At most k" is enough: if the greedy uses fewer than k parts, split any multi-element part further — sums only shrink, so it stays valid (n ≥ k guarantees enough elements).
- Search x in [max, sum] → O(n log sum).`,

  functionName: 'splitArray',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function splitArray(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: [7, 2, 5] | [10, 8] gives 18.', args: [[7, 2, 5, 10, 8], 2], expected: 18 },
    { scenario: 'Example 2', hint: '[1, 2, 3] | [4, 5]: the larger part sums to 9.', args: [[1, 2, 3, 4, 5], 2], expected: 9 },
    { scenario: 'k equals n', hint: 'Every element alone: the answer is max(nums). Start lo at max(nums), not 0 or 1.', args: [[1, 4, 4], 3], expected: 4 },
    { scenario: 'Single element', hint: 'The smallest input: one element, one part.', args: [[5], 1], expected: 5 },
    { scenario: 'All zeros', hint: 'Zeros are allowed: the answer is 0, so the search range must include 0 when max(nums) is 0.', args: [[0, 0, 0], 2], expected: 0 },
    { scenario: 'k = 1', hint: 'One part: the whole sum. hi = sum(nums) must be reachable.', args: [[1, 2, 3, 4, 5], 1], expected: 15 },
    { scenario: 'Max element dominates', hint: 'With k = 5 the largest single element (5) is the answer.', args: [[1, 2, 3, 4, 5], 5], expected: 5 },
    { scenario: 'Fewer parts than k work', hint: 'A limit of 4 can be met with fewer than 5 greedy parts — the check must accept "≤ k parts", not exactly k.', args: [[2, 3, 1, 2, 4, 3], 5], expected: 4 },
    { scenario: 'Predicate direction', hint: 'If the greedy needs more than k parts, the limit is too small: move lo up (lo = mid + 1), never hi.', args: [[10, 5, 13, 4, 8, 4, 5, 11, 14, 9, 16, 10, 20, 8], 8], expected: 25 },
    { scenario: 'Zeros between values', hint: 'Zeros fit in any part; they never force a new one.', args: [[0, 7, 0, 0, 3, 0, 5], 2], expected: 8 },
    { scenario: 'Max values', hint: 'Large values (10^6): sums reach millions but stay exact.', args: [[1000000, 1000000, 1000000, 1000000, 1000000], 2], expected: 3000000 },
    { scenario: 'Large input (n = 1000)', hint: 'Trying every limit from max(nums) upward can take ~10^8 checks here. Binary search the limit between max and sum.', argsGen: '() => { let s = 109; return [Array.from({ length: 1000 }, () => { s = (s * 48271) % 2147483647; return s % 1000001; }), 50]; }', expected: 10398587, timeLimitMs: 1000 },
    { scenario: 'Large, k = 1', hint: 'One part over 1000 elements of 10^6: the answer is the full sum, 10^9.', argsGen: '() => [new Array(1000).fill(1000000), 1]', expected: 1000000000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function splitArray(nums, k) {
  let lo = 0, hi = 0;
  for (const x of nums) {
    lo = Math.max(lo, x);
    hi += x;
  }

  // minimum number of parts if every part sum must be <= limit
  const partsNeeded = (limit) => {
    let parts = 1, sum = 0;
    for (const x of nums) {
      if (sum + x > limit) { parts++; sum = 0; }
      sum += x;
    }
    return parts;
  };

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (partsNeeded(mid) <= k) hi = mid;  // limit works → try smaller
    else lo = mid + 1;                    // too many parts → limit too small
  }
  return lo;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'greedy parts', 'decision'],
    rows: [
      ['10', '32', '21', '[7,2,5] [10,8] → 2', '≤ 2 → hi = 21'],
      ['10', '21', '15', '[7,2,5] [10] [8] → 3', '> 2 → lo = 16'],
      ['16', '21', '18', '[7,2,5] [10,8] → 2', 'hi = 18'],
      ['16', '18', '17', '[7,2,5] [10] [8] → 3', 'lo = 18'],
      ['18', '18', '—', '—', 'return 18'],
    ],
  },
  complexity: { time: 'O(n log S)', space: 'O(1)', explanation: 'S = sum(nums) ≤ 10^9 → ~30 greedy passes over n elements.' },
  alternative: {
    title: 'Dynamic programming',
    md: '`dp[j][i] = min over c < i of max(dp[j−1][c], sum(c..i−1))`, using prefix sums for range sums. Clear and exact, but O(k · n²).',
    complexity: 'O(k · n²) time, O(k · n) space',
  },
  mistakes: [
    'Requiring exactly k parts in the check — use "≤ k"; fewer parts can always be split further.',
    'lo = 0 or 1 instead of max(nums): a limit below the largest element can never work and confuses the greedy.',
    'Confusing the predicate direction (hi = mid when the limit is too small).',
  ],
};
