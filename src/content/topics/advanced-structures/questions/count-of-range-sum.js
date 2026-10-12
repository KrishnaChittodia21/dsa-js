export default {
  id: 'count-of-range-sum',
  title: 'Count of Range Sum',
  difficulty: 'Hard',
  order: 4,
  pattern: 'bit-coordinate-compression-counting',
  tags: ['array', 'prefix sum', 'fenwick tree', 'coordinate compression', 'merge sort'],
  source: { platform: 'LeetCode', number: 327, url: 'https://leetcode.com/problems/count-of-range-sum/' },

  statement: `Given an integer array \`nums\` and two integers \`lower\` and \`upper\`, return how many subarrays \`nums[i..j]\` (with \`i <= j\`) have a sum \`S(i, j)\` satisfying \`lower <= S(i, j) <= upper\`.`,
  examples: [
    { input: 'nums = [-2,5,-1], lower = -2, upper = 2', output: '3', explanation: 'The subarrays [0,0] (sum −2), [2,2] (sum −1) and [0,2] (sum 2).' },
    { input: 'nums = [0], lower = 0, upper = 0', output: '1' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1', '-10^5 <= lower <= upper <= 10^5', 'The answer fits in a 32-bit integer'],

  think: `- Write the subarray sum with prefix sums: S(i, j) = P[j + 1] − P[i]. What condition on P[i] does \`lower ≤ S ≤ upper\` become, for a fixed j?
- So for each prefix you need to count **earlier prefixes in a value window**. Which structure counts values in a range?
- Prefix sums can reach ±2·10^14. How do you index a Fenwick tree with them?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'Prefix Sum + Hash Map (exact target)', 'Coordinate Compression + BIT over prefix sums', 'Kadane\'s Algorithm'],
    answer: 2,
    explanation: 'For each prefix S we need the number of earlier prefixes in [S − upper, S − lower] — a *range* of values, not one exact value, so a hash map is not enough. Compress all prefix sums and use a Fenwick tree to count values in that range. Negative numbers break the sliding window.',
  },
  hints: [
    'Compute prefix sums P[0..n] (P[0] = 0). You need, for every k, the count of m < k with `P[k] − upper ≤ P[m] ≤ P[k] − lower`.',
    'Compress the P values. For a value window [a, b], the ranks inside it are [lowerBound(a), upperBound(b) − 1]. Insert P[0] first, then for each k query and insert P[k].',
  ],
  approach: `**Brute force:** every (i, j) with a running sum — O(n²).

**Key rewrite:** with prefix sums, \`S(i, j) = P[j+1] − P[i]\`. For a fixed right end k = j + 1, the condition \`lower ≤ P[k] − P[m] ≤ upper\` becomes
\`P[k] − upper ≤ P[m] ≤ P[k] − lower\` for m < k. So: sweep k and count earlier prefixes inside a value window.

**Optimized — compressed BIT (O(n log n)):**
1. Build \`P\` (n + 1 values), \`sorted\` = unique P values.
2. Insert P[0]. For k = 1..n: \`lo = lowerBound(sorted, P[k] − upper)\`, \`hi = upperBound(sorted, P[k] − lower) − 1\`; if lo ≤ hi add \`bit.rangeSum(lo, hi)\`. Then insert rank(P[k]).

Prefix sums reach about ±2^31 · 10^5 ≈ 2·10^14 — still exact as JS numbers (< 2^53).

**Alternative — merge sort on prefix sums:** while merging sorted halves of P, for each left value keep two forward-moving pointers into the right half marking the window [left + lower, left + upper].`,

  functionName: 'countRangeSum',
  paramNames: ['nums', 'lower', 'upper'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} lower
 * @param {number} upper
 * @return {number}
 */
function countRangeSum(nums, lower, upper) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Sums −2, −1 and 2 fall in [−2, 2]; the subarray [0,2] starts at index 0.', args: [[-2,5,-1],-2,2], expected: 3 },
    { scenario: 'Example 2', hint: 'One element whose sum equals both bounds — bounds are inclusive.', args: [[0],0,0], expected: 1 },
    { scenario: 'Single element out of range', hint: 'The only subarray has sum 1, outside [2, 3]: answer 0.', args: [[1],2,3], expected: 0 },
    { scenario: 'All zeros', hint: 'Every one of the n(n+1)/2 = 6 subarrays has sum 0.', args: [[0,0,0],0,0], expected: 6 },
    { scenario: 'Subarrays starting at index 0', hint: 'All matches start at index 0. Without the prefix value P[0] = 0 in your structure you miss them.', args: [[2,0,0,5],2,2], expected: 3 },
    { scenario: 'Asymmetric bounds', hint: 'You need earlier prefixes in [P[k] − upper, P[k] − lower]. Swapping to [P[k] + lower, P[k] + upper] fails when lower ≠ −upper.', args: [[1,2,3,4],3,5], expected: 4 },
    { scenario: 'Negatives break sliding windows', hint: 'Sums are not monotonic with negative numbers, so a two-pointer window misses subarrays.', args: [[-3,5,-2,4,-1,2],-1,3], expected: 11 },
    { scenario: 'Negative bounds only', hint: 'lower and upper are both negative — only subarrays with negative sums count.', args: [[3,-4,2,-6,1],-5,-1], expected: 8 },
    { scenario: 'Extreme 32-bit values', hint: 'Prefix sums exceed 32 bits; JS numbers are exact up to 2^53, but avoid |0 or bitwise tricks on sums.', args: [[-2147483648,2147483647,0,-2147483648,2147483647],-1,1], expected: 6 },
    { scenario: 'Window bounds not in the data', hint: 'P[k] − upper and P[k] − lower are rarely prefix values: binary-search them (lower/upper bound) instead of rank.get().', args: [[5,-3,7,-2,4],1,6], expected: 8 },
    { scenario: 'Random medium (n = 100)', hint: 'Small values with many equal prefix sums — duplicates must all be counted.', argsGen: '() => { let s = 3; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 100 }, () => (rnd() % 41) - 20), -10, 10]; }', expected: 1132 },
    { scenario: 'Large input (n = 10^5)', hint: 'Checking every subarray is O(n²) = 5·10^9 steps. Count prefix sums in range with a BIT (or merge sort) for O(n log n).', argsGen: '() => { let s = 77; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 100000 }, () => (rnd() % 2000001) - 1000000), -100000, 100000]; }', expected: 9090996, timeLimitMs: 1000 },
  ],
  solution: {
    code: `function countRangeSum(nums, lower, upper) {
  const P = [0];
  for (const x of nums) P.push(P[P.length - 1] + x);

  const sorted = [...new Set(P)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));
  // first index with sorted[idx] >= t   /   first index with sorted[idx] > t
  const lowerBound = (t) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < t) lo = m + 1; else hi = m; } return lo; };
  const upperBound = (t) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] <= t) lo = m + 1; else hi = m; } return lo; };

  const bit = new FenwickTree(sorted.length);
  bit.add(rank.get(P[0]), 1);
  let count = 0;
  for (let k = 1; k < P.length; k++) {
    const lo = lowerBound(P[k] - upper);         // smallest rank with value >= P[k] - upper
    const hi = upperBound(P[k] - lower) - 1;     // largest rank with value <= P[k] - lower
    if (lo <= hi) count += bit.rangeSum(lo, hi);
    bit.add(rank.get(P[k]), 1);
  }
  return count;
}`,
  },
  dryRun: {
    columns: ['k', 'P[k]', 'window [P[k]−upper, P[k]−lower]', 'earlier prefixes', 'in window', 'count'],
    rows: [
      ['0', '0', '—', '—', 'insert 0', '0'],
      ['1', '−2', '[−4, 0]', '{0}', '0 ✓', '1'],
      ['2', '3', '[1, 5]', '{0, −2}', 'none', '1'],
      ['3', '2', '[0, 4]', '{0, −2, 3}', '0 ✓, 3 ✓', '3'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'n + 1 prefix sums sorted once; each step does two binary searches and two BIT operations.' },
  alternative: {
    title: 'Merge sort over prefix sums',
    md: 'Sort P with merge sort. Before merging two sorted halves, for each value a in the left half, move pointers lo/hi in the right half so that right[lo..hi) is exactly the values in [a + lower, a + upper]; add hi − lo. Both pointers only move forward because the left half is sorted — O(n) per level.',
    code: `function countRangeSum(nums, lower, upper) {
  const P = [0];
  for (const x of nums) P.push(P[P.length - 1] + x);
  const sort = (l, r) => {                       // sorts P[l..r), returns count of pairs inside
    if (r - l < 2) return 0;
    const m = (l + r) >> 1;
    let cnt = sort(l, m) + sort(m, r);
    let lo = m, hi = m;
    for (let i = l; i < m; i++) {
      while (lo < r && P[lo] - P[i] < lower) lo++;
      while (hi < r && P[hi] - P[i] <= upper) hi++;
      cnt += hi - lo;
    }
    const merged = P.slice(l, r).sort((a, b) => a - b); // linear merge in production code
    for (let k = 0; k < merged.length; k++) P[l + k] = merged[k];
    return cnt;
  };
  return sort(0, P.length);
}`,
    complexity: 'O(n log n) time with a linear merge, O(n) space',
  },
  mistakes: [
    'Forgetting P[0] = 0 — subarrays that start at index 0 are then missed.',
    'Inverting the window: it is [P[k] − upper, P[k] − lower], not [P[k] + lower, P[k] + upper].',
    'Looking up the window bounds with `rank.get` — they are usually not prefix values; binary-search them.',
    'Using a sliding window: negative numbers break monotonicity.',
  ],
};
