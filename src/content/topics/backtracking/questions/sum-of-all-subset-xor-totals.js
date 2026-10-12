export default {
  id: 'sum-of-all-subset-xor-totals',
  title: 'Sum of All Subset XOR Totals',
  difficulty: 'Easy',
  order: 2,
  pattern: 'backtracking-subsets',
  tags: ['backtracking', 'bit manipulation', 'subsets'],
  source: { platform: 'LeetCode', number: 1863, url: 'https://leetcode.com/problems/sum-of-all-subset-xor-totals/' },

  statement: `The **XOR total** of an array is the bitwise XOR (\`^\`) of all its elements (the XOR total of the empty array is \`0\`).

Given an integer array \`nums\`, compute the XOR total of **every subset** of \`nums\` and return the **sum** of all those XOR totals.

Subsets are taken by position: equal values at different indices count as different subsets.`,
  examples: [
    { input: 'nums = [1,3]', output: '6', explanation: 'Subsets: [] → 0, [1] → 1, [3] → 3, [1,3] → 1^3 = 2. Sum = 0 + 1 + 3 + 2 = 6.' },
    { input: 'nums = [5,1,6]', output: '28', explanation: 'The 8 subsets have XOR totals 0,5,1,6,4,3,7,2 → 28.' },
  ],
  constraints: ['1 <= nums.length <= 12', '1 <= nums[i] <= 20'],

  think: `- How many subsets does an array of length 12 have? Is listing them all affordable?
- Do you actually need to store each subset, or just its running XOR?
- In the include/exclude tree, what value should travel down the recursion?`,
  patternChallenge: {
    options: ['Backtracking — Subsets (include / exclude)', 'Prefix Sum', 'Sliding Window — Fixed Size', 'Two Pointers'],
    answer: 0,
    explanation: '"Every subset" with n ≤ 12 (4,096 subsets) is the include/exclude decision tree. Prefix sums and windows only cover contiguous ranges; subsets can skip elements.',
  },
  hints: [
    'Write `dfs(i, xor)`: at index `i` you either include `nums[i]` (new xor = `xor ^ nums[i]`) or skip it.',
    'At `i === nums.length`, the current `xor` is the XOR total of one subset — return it. The answer is the sum of both branches.',
  ],
  approach: `**Brute force:** generate each subset as an array, then XOR its elements → O(n · 2ⁿ).

**Backtracking without storing subsets:** carry the running XOR as an argument.
\`dfs(i, xor) = dfs(i + 1, xor ^ nums[i]) + dfs(i + 1, xor)\`, with \`dfs(n, xor) = xor\`.
Each of the 2ⁿ leaves is one subset and does O(1) work → O(2ⁿ).

**Bit trick (bonus):** every bit that appears in at least one number is set in exactly half of the subsets' XOR totals, so the answer is \`(OR of all nums) × 2^(n−1)\`.`,

  functionName: 'subsetXORSum',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function subsetXORSum(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Totals 0, 1, 3, 2 → 6.', args: [[1,3]], expected: 6 },
    { scenario: 'Example 2', hint: 'All 8 subsets, combined with XOR (^), not + or **.', args: [[5,1,6]], expected: 28 },
    { scenario: 'Six elements', hint: '64 subsets. Start each XOR at 0 — the XOR identity.', args: [[3,4,5,6,7,8]], expected: 480 },
    { scenario: 'Single element', hint: 'Subsets [] and [7] → 0 + 7. Starting the XOR at 1 gives the wrong answer.', args: [[7]], expected: 7 },
    { scenario: 'Minimum value', hint: 'One element equal to 1.', args: [[1]], expected: 1 },
    { scenario: 'Equal pair', hint: 'Subsets are by index: [2,2] has two separate {2} subsets → 0 + 2 + 2 + 0 = 4. Do not de-duplicate values.', args: [[2,2]], expected: 4 },
    { scenario: 'Three equal values', hint: 'Equal values cancel in pairs under XOR.', args: [[1,1,1]], expected: 4 },
    { scenario: 'Powers of two', hint: 'Distinct bits never cancel — every subset XOR equals its sum.', args: [[1,2,4,8,16]], expected: 496 },
    { scenario: 'Max and min values', hint: '20 and 1 share no bits.', args: [[20,1]], expected: 42 },
    { scenario: 'Max length, all max values', hint: 'Twelve 20s: half of the 4096 subsets have an odd count and XOR to 20.', args: [[20,20,20,20,20,20,20,20,20,20,20,20]], expected: 40960 },
    { scenario: 'Max length, mixed values', hint: '4096 subsets — enumerate them all (or use the OR trick).', args: [[1,2,4,8,16,20,3,5,7,9,11,13]], expected: 63488 },
  ],

  solution: {
    code: `function subsetXORSum(nums) {
  // dfs(i, xor): sum of XOR totals of all subsets that extend the current choice
  function dfs(i, xor) {
    if (i === nums.length) return xor;           // one complete subset
    return dfs(i + 1, xor ^ nums[i])             // include nums[i]
         + dfs(i + 1, xor);                      // exclude nums[i]
  }
  return dfs(0, 0);
}`,
    explanation: 'The state (running XOR) is a number passed by value, so the "undo" is automatic when the call returns.',
  },
  dryRun: {
    columns: ['call', 'include branch', 'exclude branch', 'returns'],
    rows: [
      ['dfs(2, 2) [1,3 taken]', '—', '—', '2'],
      ['dfs(2, 1) [1 taken]', '—', '—', '1'],
      ['dfs(1, 1)', 'dfs(2, 1^3=2) = 2', 'dfs(2, 1) = 1', '3'],
      ['dfs(1, 0)', 'dfs(2, 3) = 3', 'dfs(2, 0) = 0', '3'],
      ['dfs(0, 0)', 'dfs(1, 1) = 3', 'dfs(1, 0) = 3', '6'],
    ],
  },
  complexity: { time: 'O(2ⁿ)', space: 'O(n)', explanation: 'The decision tree has 2ⁿ leaves and 2ⁿ⁺¹ − 1 nodes, each O(1). Recursion depth is n.' },
  alternative: {
    title: 'OR of all numbers × 2^(n−1)',
    md: 'For any bit set in at least one number, pairing subsets by toggling one such number shows exactly half of all subsets have that bit set in their XOR. So each such bit contributes `bit × 2^(n−1)`.',
    code: `function subsetXORSum(nums) {
  let or = 0;
  for (const x of nums) or |= x;
  return or * 2 ** (nums.length - 1);
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Starting the XOR at 1 instead of 0 (0 is the identity for XOR).',
    'Skipping the empty subset — harmless here since its total is 0, but a bad habit.',
    'De-duplicating equal values: subsets are by index, so [2,2] has two subsets {2}.',
    'Using `**` or `+` instead of `^` for XOR.',
  ],
};
