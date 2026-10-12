export default {
  id: '4sum-ii',
  title: '4Sum II',
  difficulty: 'Medium',
  order: 3,
  pattern: 'hash-complement-lookup',
  tags: ['array', 'hash map', 'meet in the middle'],
  source: { platform: 'LeetCode', number: 454, url: 'https://leetcode.com/problems/4sum-ii/' },

  statement: `You are given four integer arrays \`nums1\`, \`nums2\`, \`nums3\`, \`nums4\`, all of length \`n\`.

Count the tuples \`(i, j, k, l)\` such that \`nums1[i] + nums2[j] + nums3[k] + nums4[l] === 0\`.`,
  examples: [
    { input: 'nums1 = [1,2], nums2 = [-2,-1], nums3 = [-1,2], nums4 = [0,2]', output: '2', explanation: '(0,0,0,1): 1 − 2 − 1 + 2 = 0 and (1,1,0,0): 2 − 1 − 1 + 0 = 0.' },
    { input: 'nums1 = [0], nums2 = [0], nums3 = [0], nums4 = [0]', output: '1' },
  ],
  constraints: ['1 <= n <= 200', '-2^28 <= nums[i] <= 2^28'],

  think: `- Four nested loops cost n⁴ = 1.6·10⁹ for n = 200. Too slow. What about n²?
- If you knew every possible value of a + b, what would c + d need to equal?
- Do you need indices, or just how many ways each sum occurs?`,
  patternChallenge: {
    options: ['Sort + Two Pointers', 'Complement Lookup (meet in the middle)', 'Sliding Window', 'Backtracking'],
    answer: 1,
    explanation: 'Split the four arrays into two pairs. Count all a + b sums in a Map, then for every c + d look up the complement −(c + d). O(n²) instead of O(n⁴).',
  },
  hints: ['Build a Map sum → count over all pairs (a from nums1, b from nums2).', 'For every pair (c, d), add map.get(−(c + d)) ?? 0 to the answer.'],
  approach: `**Brute force:** four loops → O(n⁴).

**Three loops + Set:** still O(n³).

**Optimized (meet in the middle):** \`ab = Map<sum, count>\` over n² pairs of nums1 × nums2. Then for each of the n² pairs of nums3 × nums4, the number of matching (i, j) is \`ab.get(−(c + d)) ?? 0\`. Total O(n²) time and O(n²) space. We store **counts**, not indices, because we only need the number of tuples.`,

  functionName: 'fourSumCount',
  paramNames: ['nums1', 'nums2', 'nums3', 'nums4'],
  starterCode: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @param {number[]} nums3
 * @param {number[]} nums4
 * @return {number}
 */
function fourSumCount(nums1, nums2, nums3, nums4) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: two index tuples sum to zero.', args: [[1, 2], [-2, -1], [-1, 2], [0, 2]], expected: 2 },
    { scenario: 'Example 2', hint: 'Smallest input (n = 1): the single tuple sums to 0.', args: [[0], [0], [0], [0]], expected: 1 },
    { scenario: 'No zero-sum tuple', hint: 'When nothing cancels out the answer is 0. Writing ab.get(x) + 1 without a default yields NaN instead.', args: [[1], [1], [1], [1]], expected: 0 },
    { scenario: 'All zeros', hint: 'Every one of the 2⁴ tuples counts — tuples are counted by index, not by value.', args: [[0, 0], [0, 0], [0, 0], [0, 0]], expected: 16 },
    { scenario: 'Repeated pair sums', hint: 'Storing which sums exist (a set of pairs) instead of how many pairs make each sum undercounts here.', args: [[1, 2], [2, 1], [-3, -4], [0, 0]], expected: 6 },
    { scenario: 'Mixed signs with duplicates', hint: 'Several pairs share the same sum; each must be counted with its multiplicity.', args: [[-1, -1], [-1, 1], [-1, 1], [1, -1]], expected: 6 },
    { scenario: 'Three elements each', hint: 'Zeros and ±1 combine in many ways — count all of them.', args: [[1, -1, 0], [0, 0, 1], [-1, 1, 0], [0, 0, 0]], expected: 24 },
    { scenario: 'Extreme values (±2^28)', hint: 'Sums reach ±2^30 — still exact in JavaScript numbers, but the sign of the complement matters.', args: [[268435456, -268435456], [268435456, -268435456], [-268435456, 268435456], [0, 0]], expected: 0 },
    { scenario: 'Negatives only on one side', hint: 'The complement −(c + d) must be looked up, not c + d itself.', args: [[1, 2, 3], [1, 2, 3], [-3, -2, -1], [-3, -2, -1]], expected: 19 },
    { scenario: 'Sum is never zero', hint: 'All values are positive, so the answer is 0 even with many elements.', args: [[5, 6], [7, 8], [1, 2], [3, 4]], expected: 0 },
    { scenario: 'Maximum n, all zeros', hint: 'n = 200 with only zeros: 200⁴ = 1.6·10⁹ tuples. Count with pair sums — never enumerate tuples.', argsGen: '() => [Array(200).fill(0), Array(200).fill(0), Array(200).fill(0), Array(200).fill(0)]', expected: 1600000000, timeLimitMs: 1000 },
    { scenario: 'Maximum n, random values', hint: 'Four nested loops are O(n⁴) — far too slow. Build a map of a + b sums (O(n²)) and look up −(c + d).', argsGen: '() => [(() => { let s = 1; return Array.from({ length: 200 }, () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % 41) - 20); })(), (() => { let s = 2; return Array.from({ length: 200 }, () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % 41) - 20); })(), (() => { let s = 3; return Array.from({ length: 200 }, () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % 41) - 20); })(), (() => { let s = 4; return Array.from({ length: 200 }, () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % 41) - 20); })()]', expected: 26181850, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function fourSumCount(nums1, nums2, nums3, nums4) {
  const ab = new Map();                       // sum a + b → how many pairs
  for (const a of nums1) {
    for (const b of nums2) {
      ab.set(a + b, (ab.get(a + b) ?? 0) + 1);
    }
  }
  let count = 0;
  for (const c of nums3) {
    for (const d of nums4) {
      count += ab.get(-(c + d)) ?? 0;          // complement lookup
    }
  }
  return count;
}`,
  },
  dryRun: {
    columns: ['phase', 'details'],
    rows: [
      ['build ab', '1−2 = −1, 1−1 = 0, 2−2 = 0, 2−1 = 1 → {−1:1, 0:2, 1:1}'],
      ['c=−1, d=0', 'need 1 → +1'],
      ['c=−1, d=2', 'need −1 → +1'],
      ['c=2, d=0', 'need −2 → +0'],
      ['c=2, d=2', 'need −4 → +0 → total 2'],
    ],
  },
  complexity: { time: 'O(n²)', space: 'O(n²)', explanation: 'n² pair sums are stored and n² lookups are made, each O(1) average.' },
  alternative: {
    title: 'Three loops + frequency map of nums4',
    md: 'Count nums4, then loop over a, b, c and look up −(a + b + c). Simpler idea, but O(n³) = 8·10⁶ for n = 200 — acceptable here, not optimal.',
    complexity: 'O(n³) time, O(n) space',
  },
  mistakes: ['Storing indices (a set of pairs) instead of counts', 'Using `ab.get(x) || 0` is fine here, but writing `ab.get(x) + 1` without a default yields NaN'],
};
