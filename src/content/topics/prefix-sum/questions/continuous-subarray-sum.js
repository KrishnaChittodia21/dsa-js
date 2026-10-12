export default {
  id: 'continuous-subarray-sum',
  title: 'Continuous Subarray Sum',
  difficulty: 'Medium',
  order: 3,
  pattern: 'prefix-sum-modulo',
  tags: ['array', 'hash map', 'prefix sum', 'math'],
  source: { platform: 'LeetCode', number: 523, url: 'https://leetcode.com/problems/continuous-subarray-sum/' },

  statement: `Given an integer array \`nums\` and an integer \`k\`, return \`true\` if there is a contiguous subarray of **length at least 2** whose sum is a **multiple of \`k\`** (i.e. \`sum = n · k\` for some integer \`n\`; 0 counts as a multiple). Otherwise return \`false\`.`,
  examples: [
    { input: 'nums = [23,2,4,6,7], k = 6', output: 'true', explanation: '[2,4] sums to 6.' },
    { input: 'nums = [23,2,6,4,7], k = 6', output: 'true', explanation: 'The whole array sums to 42 = 7 × 6.' },
    { input: 'nums = [23,2,6,4,7], k = 13', output: 'false' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9', '1 <= k <= 2^31 - 1'],

  think: `- When is \`P_j − P_i\` a multiple of \`k\`? Say it in terms of remainders.
- The subarray must have at least 2 elements. How does that translate to the distance between the two prefix indices?
- Should you keep the first or the latest index of each remainder?`,
  patternChallenge: {
    options: ['Sliding Window — Fixed Size 2', 'Two Pointers', 'Prefix Sum + HashMap', 'Prefix Sum modulo k + HashMap (first index)'],
    answer: 3,
    explanation: '"Multiple of k" ⇔ two prefix sums with the same remainder mod k. The length ≥ 2 rule needs the distance between them, so store the **first** index of each remainder. A plain prefix-sum map looks for an exact difference, which is not what "multiple of k" asks.',
  },
  hints: [
    'Keep `rem = prefix % k` and a Map `remainder → first index`, seeded with `0 → -1`.',
    'At index i: if `rem` was seen at index j and `i - j >= 2`, return true. Only store `rem` if it has not been seen (keep the earliest index).',
  ],
  approach: `**Brute force:** all subarrays of length ≥ 2 → O(n²).

**Prefix remainders (O(n)):** \`sum(j+1..i) = P_i − P_j\` is a multiple of k ⇔ \`P_i mod k = P_j mod k\`.
- Map each remainder to the **first** index it appeared at; the empty prefix contributes \`0 → −1\`.
- At index i, if the remainder was seen at j with \`i − j ≥ 2\` → the subarray \`nums[j+1..i]\` has length ≥ 2 → \`true\`.
- Keeping the first index maximises the distance, so we never miss a long-enough match.

Here \`nums[i] ≥ 0\`, so remainders are never negative; in general JavaScript needs \`((x % k) + k) % k\`, and the solution normalises anyway to be safe.`,

  functionName: 'checkSubarraySum',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {boolean}
 */
function checkSubarraySum(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[2,4] sums to 6.', args: [[23, 2, 4, 6, 7], 6], expected: true },
    { scenario: 'Example 2', hint: 'Only the whole array (42) is a multiple of 6.', args: [[23, 2, 6, 4, 7], 6], expected: true },
    { scenario: 'Example 3', hint: 'No subarray of length ≥ 2 sums to a multiple of 13.', args: [[23, 2, 6, 4, 7], 13], expected: false },
    { scenario: 'Single zero', hint: 'A single element is too short, even though 0 is a multiple of every k.', args: [[0], 1], expected: false },
    { scenario: 'Single element equals k', hint: 'Length must be at least 2 — [6] with k = 6 is false.', args: [[6], 6], expected: false },
    { scenario: 'Two zeros', hint: '0 + 0 = 0 is a multiple of any k, and the length is 2.', args: [[0, 0], 1], expected: true },
    { scenario: 'k = 1', hint: 'Every integer is a multiple of 1, so any two elements work.', args: [[3, 5], 1], expected: true },
    { scenario: 'Keep earliest remainder index', hint: 'Overwriting the index of a repeated remainder loses the length-2 window [0, 0] after 5.', args: [[5, 0, 0, 0], 3], expected: true },
    { scenario: 'Lone zero is too short', hint: '[1,0]: the remainder repeats right after itself, but that window has length 1.', args: [[1, 0], 2], expected: false },
    { scenario: 'Qualifying prefix from index 0', hint: 'Without the seed 0 → -1, the prefix [2,4] is missed.', args: [[2, 4, 3], 6], expected: true },
    { scenario: 'Element equals k, no pair', hint: 'The single element 12 is a multiple of 6, but no window of length ≥ 2 is.', args: [[1, 2, 12], 6], expected: false },
    { scenario: 'Max values', hint: 'Values up to 10^9: 10^9 + 10^9 is a multiple of 10^9.', args: [[1000000000, 1000000000], 1000000000], expected: true },
    { scenario: 'Large no-answer input (n = 10^5)', hint: 'All prefix sums stay below k, so every remainder is new — an O(n²) scan of all subarrays is far too slow.', argsGen: '() => [Array(100000).fill(1), 2147483647]', expected: false, timeLimitMs: 1000 },
    { scenario: 'Large random input (n = 10^5)', hint: 'Prefix remainders with a Map make this O(n).', argsGen: '() => { let s = 9; const r = () => (s = (s * 48271) % 2147483647); const a = Array.from({ length: 100000 }, () => r() % 1000000000); return [a, 1000000007]; }', expected: true, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function checkSubarraySum(nums, k) {
  const firstIndex = new Map([[0, -1]]); // remainder -> earliest prefix index
  let rem = 0;
  for (let i = 0; i < nums.length; i++) {
    rem = (((rem + nums[i]) % k) + k) % k;   // normalised remainder
    if (firstIndex.has(rem)) {
      if (i - firstIndex.get(rem) >= 2) return true; // subarray length >= 2
    } else {
      firstIndex.set(rem, i);                // never overwrite: keep the earliest
    }
  }
  return false;
}`,
    explanation: 'Keeping only the remainder (not the full prefix) also keeps numbers small, even though prefix sums could reach 10^14 here.',
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'rem (k = 6)', 'firstIndex[rem]', 'distance', 'result'],
    rows: [
      ['—', '—', '0', '-1', '—', ''],
      ['0', '23', '5', 'new → 0', '—', ''],
      ['1', '2', '1', 'new → 1', '—', ''],
      ['2', '4', '5', '0', '2', 'true'],
    ],
    note: 'nums = [23,2,4,6,7]: [2,4] sums to 6.',
  },
  complexity: { time: 'O(n)', space: 'O(min(n, k))', explanation: 'One pass; at most min(n + 1, k) distinct remainders.' },
  alternative: {
    title: 'Brute force',
    md: 'Every start i and end j ≥ i + 1 with a running sum, test `sum % k === 0`. O(n²) — too slow at n = 10^5, but a fine first step.',
    complexity: 'O(n²) time, O(1) space',
  },
  mistakes: [
    'Overwriting the index of a remainder — `[5, 0, 0, 0]`, k = 3 needs the first occurrence.',
    'Forgetting the length ≥ 2 rule: `[6]`, k = 6 is false.',
    'Forgetting the seed `0 → -1`, so a qualifying prefix like `[2, 4]` (k = 6) starting at index 0 is missed.',
    'Using raw `%` with possibly negative values (normalise in JavaScript).',
  ],
};
