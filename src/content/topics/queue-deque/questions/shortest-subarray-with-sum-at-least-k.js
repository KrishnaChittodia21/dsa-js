export default {
  id: 'shortest-subarray-with-sum-at-least-k',
  title: 'Shortest Subarray with Sum at Least K',
  difficulty: 'Hard',
  order: 2,
  pattern: 'monotonic-deque-prefix-sum',
  tags: ['array', 'prefix sum', 'monotonic deque'],
  source: { platform: 'LeetCode', number: 862, url: 'https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/' },

  statement: `Given an integer array \`nums\` (values may be **negative**) and an integer \`k\`, return the length of the shortest non-empty contiguous subarray whose sum is **at least** \`k\`. If none exists, return \`-1\`.`,
  examples: [
    { input: 'nums = [1], k = 1', output: '1' },
    { input: 'nums = [1,2], k = 4', output: '-1' },
    { input: 'nums = [2,-1,2], k = 3', output: '3' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^5 <= nums[i] <= 10^5', '1 <= k <= 10^9'],

  think: `- Why does the usual "shrink while sum ≥ k" sliding window fail on [2, −1, 2]?
- Using prefix sums P, a subarray (i..j−1) has sum P[j] − P[i]. For a fixed j, which start i do you want?
- If an earlier start has a **larger** prefix than a later start, is the earlier one ever useful?`,
  patternChallenge: {
    options: ['Variable sliding window', 'Prefix sums + monotonic deque', 'Prefix sums + hash map', 'Kadane'],
    answer: 1,
    explanation: 'Negatives break the sliding window. With prefix sums, we need, for each end, the latest start with P[start] ≤ P[end] − k; the useful starts form an increasing sequence of prefix values — a monotonic deque. A hash map finds EXACT sums, not "at least".',
  },
  hints: [
    'Build P with P[0] = 0. Scan j = 0..n; keep a deque of indices with increasing P.',
    'Front rule: while P[j] − P[front] >= k, record j − front and pop the front. Back rule: while P[back] >= P[j], pop the back. Then push j.',
  ],
  approach: `**Brute force:** all subarrays with prefix sums → O(n²).

**Why not a sliding window?** With negatives, removing an element can increase the sum, so "shrink while valid" can skip the optimum (try [2, −1, 2], k = 3).

**Monotonic deque over prefix sums (O(n)):**
- *Back rule:* if \`P[j] <= P[i]\` for an earlier i, then j is a strictly better start than i for all future ends (later → shorter, smaller prefix → larger sum). Pop i. The deque is increasing in P.
- *Front rule:* if \`P[j] − P[front] >= k\`, the subarray (front..j−1) is valid; record \`j − front\`. Pop the front: any later end would only make a longer subarray with this start.
Each index enters and leaves the deque once.`,

  functionName: 'shortestSubarray',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function shortestSubarray(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A single element that already reaches k.', args: [[1], 1], expected: 1 },
    { scenario: 'Example 2', hint: 'Even the whole array sums to only 3 — return −1.', args: [[1, 2], 4], expected: -1 },
    { scenario: 'Example 3', hint: 'The negative in the middle forces the whole array; it starts at index 0, so you need P[0] = 0.', args: [[2, -1, 2], 3], expected: 3 },
    { scenario: 'Negatives break sliding window', hint: 'A plain two-pointer window assumes sums grow as it widens — negatives break that.', args: [[84, -37, 32, 40, 95], 167], expected: 3 },
    { scenario: 'Starts after a negative', hint: 'Dropping a negative prefix makes the sum larger and the subarray shorter.', args: [[-28, 81, -20, 28, -29], 89], expected: 3 },
    { scenario: 'Single element at the end', hint: 'The last element alone reaches k — shortest length 1.', args: [[1, 1, 1, 1, 10], 10], expected: 1 },
    { scenario: 'All negative', hint: 'No subarray can reach a positive k.', args: [[-1, -2, -3], 1], expected: -1 },
    { scenario: 'Answer at the start', hint: '48 + 99 reaches 140 with length 2 at index 0; later pairs fall short.', args: [[48, 99, 37, 4, -31], 140], expected: 2 },
    { scenario: 'Equal prefix sums', hint: 'Prefix sums repeat; the later equal prefix gives a shorter subarray — pop the back with >=.', args: [[5, -10, 5, 5], 10], expected: 2 },
    { scenario: 'Extreme values', hint: 'Values at ±10^5 with a large k.', args: [[100000, -100000, 100000, 100000], 200000], expected: 2 },
    { scenario: 'Large k unreachable', hint: 'k = 10^9 is far beyond any sum here — return −1.', args: [[100000, 100000, 100000], 1000000000], expected: -1 },
    { scenario: 'Large, no answer (n = 10^5)', hint: 'Nothing reaches k, so a double loop tries all ~5·10^9 pairs. Use prefix sums with a monotonic deque.', argsGen: '() => { let s = 2468; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => (r() % 200001) - 100000), 1000000000]; }', expected: -1, timeLimitMs: 1000 },
    { scenario: 'Large alternating (n = 10^5)', hint: 'Sums grow slowly through alternating values, so the shortest valid subarray is about 8·10^4 long.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i % 2 ? -99999 : 100000)), 40000]', expected: 1 },
    { scenario: 'Large random (n = 10^5)', hint: 'Random values with a reachable k at full size.', argsGen: '() => { let s = 2468; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => (r() % 200001) - 90000), 3000000]; }', expected: 94 },
  ],
  solution: {
    code: `function shortestSubarray(nums, k) {
  const n = nums.length;
  const P = new Array(n + 1);          // P[j] = sum of nums[0..j-1]
  P[0] = 0;
  for (let i = 0; i < n; i++) P[i + 1] = P[i] + nums[i];

  const dq = new Deque();              // candidate start indices, P increasing
  let best = Infinity;
  for (let j = 0; j <= n; j++) {
    // Front rule: a valid subarray ends here; later ends can only be longer.
    while (!dq.isEmpty() && P[j] - P[dq.front()] >= k) {
      best = Math.min(best, j - dq.popFront());
    }
    // Back rule: j is a later start with a smaller-or-equal prefix → dominates.
    while (!dq.isEmpty() && P[dq.back()] >= P[j]) dq.popBack();
    dq.pushBack(j);
  }
  return best === Infinity ? -1 : best;
}`,
  },
  dryRun: {
    columns: ['j', 'P[j]', 'front rule', 'back rule', 'deque (P values)', 'best'],
    rows: [
      ['0', '0', '—', '—', '[0]', '∞'],
      ['1', '2', '2 − 0 < 3', '—', '[0,2]', '∞'],
      ['2', '1', '1 − 0 < 3', 'pop 2 (2 ≥ 1)', '[0,1]', '∞'],
      ['3', '3', '3 − 0 ≥ 3 → len 3, pop 0; 3 − 1 < 3', '—', '[1,3]', '3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Prefix array plus a deque in which every index is pushed and popped at most once.' },
  alternative: {
    title: 'Prefix sums + binary search on a monotonic stack',
    md: 'Keep the same increasing sequence of prefix indices (only the back rule), and for each j binary search the rightmost index with P[i] <= P[j] − k. O(n log n); useful when you cannot pop from the front.',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Using a plain sliding window with negative numbers.',
    'Forgetting P[0] = 0 (subarrays starting at index 0).',
    'Not popping the front after recording (misses nothing but wastes time — and in some variants gives wrong answers).',
    'Using > instead of >= in the back rule (equal prefixes: the later one is better).',
  ],
};
