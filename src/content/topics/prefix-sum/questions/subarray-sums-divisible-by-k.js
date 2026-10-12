export default {
  id: 'subarray-sums-divisible-by-k',
  title: 'Subarray Sums Divisible by K',
  difficulty: 'Medium',
  order: 4,
  pattern: 'prefix-sum-modulo',
  tags: ['array', 'hash map', 'prefix sum', 'math'],
  source: { platform: 'LeetCode', number: 974, url: 'https://leetcode.com/problems/subarray-sums-divisible-by-k/' },

  statement: `Given an integer array \`nums\` (values may be **negative**) and an integer \`k\`, return the number of non-empty contiguous subarrays whose sum is **divisible by \`k\`**.`,
  examples: [
    { input: 'nums = [4,5,0,-2,-3,1], k = 5', output: '7', explanation: '[4,5,0,-2,-3,1], [5], [5,0], [5,0,-2,-3], [0], [0,-2,-3], [-2,-3].' },
    { input: 'nums = [5], k = 9', output: '0' },
  ],
  constraints: ['1 <= nums.length <= 3 * 10^4', '-10^4 <= nums[i] <= 10^4', '2 <= k <= 10^4'],

  think: `- When is \`P_j − P_i\` divisible by \`k\`?
- If a remainder has been seen \`c\` times before, how many valid subarrays end here?
- What is \`-2 % 5\` in JavaScript, and why is that a problem for your map keys?`,
  patternChallenge: {
    options: ['Prefix Sum modulo k + counts', 'Sliding Window — Variable Size', 'Sorting + Two Pointers', 'Prefix Sum + HashMap for exact sum k'],
    answer: 0,
    explanation: 'Divisible by k ⇔ equal prefix remainders. Count how many earlier prefixes share the current remainder. Looking for an exact difference of k (Subarray Sum Equals K) misses sums like 2k or −k.',
  },
  hints: [
    'Keep `count[r]` = how many prefixes so far have remainder r. Start with `count[0] = 1` (the empty prefix).',
    'Normalise the remainder with `((x % k) + k) % k` — JavaScript keeps the sign, so `-2 % 5` is `-2`, not `3`. Then add `count[r]` to the answer and increment it.',
  ],
  approach: `**Brute force:** O(n²) with running sums.

**Prefix remainders (O(n + k)):** \`sum(i+1..j) % k === 0\` ⇔ \`P_i ≡ P_j (mod k)\`. So the number of valid subarrays ending at \`j\` equals the number of earlier prefixes with the same remainder.
- \`count[0] = 1\` for the empty prefix — subarrays starting at index 0.
- Remainders fit in \`0..k−1\`, so a plain array beats a Map.

**The JavaScript trap:** \`%\` returns a result with the sign of the left operand: \`-2 % 5 === -2\`. The prefix \`-2\` and the prefix \`3\` are congruent mod 5, but raw remainders -2 and 3 would be different keys (and \`count[-2]\` is not even an array slot). Normalise: \`((x % k) + k) % k\`.`,

  functionName: 'subarraysDivByK',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function subarraysDivByK(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Seven subarrays have sums divisible by 5; count equal prefix remainders.', args: [[4, 5, 0, -2, -3, 1], 5], expected: 7 },
    { scenario: 'Example 2', hint: '5 is not divisible by 9 — answer 0.', args: [[5], 9], expected: 0 },
    { scenario: 'Negative prefix remainder', hint: 'In JS −1 % 2 is −1, so it never matches remainder 1 — normalise with ((p % k) + k) % k.', args: [[-1, 2, 9], 2], expected: 2 },
    { scenario: 'Single negative divisible', hint: 'Subarrays starting at index 0 need count[0] = 1 seeded.', args: [[-5], 5], expected: 1 },
    { scenario: 'Zeros', hint: 'Every subarray of zeros has sum 0, which is divisible.', args: [[0, 0], 3], expected: 3 },
    { scenario: 'Mixed signs', hint: 'Prefix remainders repeat across positive and negative values.', args: [[2, -2, 2, -4], 6], expected: 2 },
    { scenario: 'All negative', hint: 'Only the whole array sums to −3, divisible by 3.', args: [[-1, -1, -1], 3], expected: 1 },
    { scenario: 'Remainders, not exact k', hint: 'Looking for prefix − k (sum exactly k) misses sums like 10 or −10.', args: [[7, 4, -10, 9], 5], expected: 2 },
    { scenario: 'Every subarray divisible', hint: 'All elements are multiples of k, so all n(n+1)/2 subarrays count.', args: [[3, 6, -9, 12], 3], expected: 10 },
    { scenario: 'Value bounds', hint: 'Values at ±10^4 with k = 10^4.', args: [[10000, -10000, 9999, 1], 10000], expected: 6 },
    { scenario: 'Large all zeros (n = 3·10^4)', hint: 'All ~4.5·10^8 subarrays count. A double loop over all subarrays is too slow — count remainders in one pass.', argsGen: '() => [new Array(30000).fill(0), 7]', expected: 450015000, timeLimitMs: 300 },
    { scenario: 'Large random (n = 3·10^4)', hint: 'Random values with negatives at full size.', argsGen: '() => { let s = 8080; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 30000 }, () => (r() % 20001) - 10000), 97]; }', expected: 4641707, timeLimitMs: 300 },
  ],

  solution: {
    code: `function subarraysDivByK(nums, k) {
  const count = new Array(k).fill(0);
  count[0] = 1;                            // empty prefix has remainder 0
  let rem = 0, total = 0;
  for (const x of nums) {
    rem = (((rem + x) % k) + k) % k;       // always in 0..k-1, even for negatives
    total += count[rem];                   // pair with every earlier equal remainder
    count[rem]++;
  }
  return total;
}`,
  },
  dryRun: {
    columns: ['x', 'prefix', 'rem', 'count[rem] before', 'total'],
    rows: [
      ['4', '4', '4', '0', '0'],
      ['5', '9', '4', '1', '1'],
      ['0', '9', '4', '2', '3'],
      ['-2', '7', '2', '0', '3'],
      ['-3', '4', '4', '3', '6'],
      ['1', '5', '0', '1 (empty prefix)', '7'],
    ],
    note: 'k = 5. Raw JS would compute the same here, but try [-1, 2, 9], k = 2: prefix −1 gives −1 % 2 = −1 without normalising.',
  },
  complexity: { time: 'O(n + k)', space: 'O(k)', explanation: 'One pass plus allocating the k-slot count array.' },
  alternative: {
    title: 'Map instead of an array',
    md: 'A `Map` keyed by the normalised remainder works too and uses O(min(n, k)) space — better if k were huge.',
    complexity: 'O(n) time, O(min(n, k)) space',
  },
  mistakes: [
    'Using `prefix % k` directly with negatives — keys like −1 and k − 1 never match.',
    'Forgetting `count[0] = 1`.',
    'Looking for `prefix − k` (exact sum k) instead of equal remainders.',
  ],
};
