export default {
  id: 'counting-bits',
  title: 'Counting Bits',
  difficulty: 'Easy',
  order: 4,
  pattern: 'bit-lowest-set-bit',
  tags: ['dynamic programming', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 338, url: 'https://leetcode.com/problems/counting-bits/' },

  statement: `Given \`n\`, return an array \`ans\` of length \`n + 1\` where \`ans[i]\` is the number of 1-bits in the binary form of \`i\`, for every \`i\` from 0 to n.

Aim for O(n) overall — not O(n · 32).`,
  examples: [
    { input: 'n = 2', output: '[0,1,1]' },
    { input: 'n = 5', output: '[0,1,1,2,1,2]' },
  ],
  constraints: ['0 <= n <= 10^5'],

  think: `- Is there a smaller number whose bit count you already know and that differs from i by exactly one bit?
- What does \`i >> 1\` have in common with i? What about \`i & (i − 1)\`?`,
  patternChallenge: {
    options: ['Popcount each number independently', 'Reuse answers: bits[i] = bits[i & (i − 1)] + 1', 'Binary trie', 'Sliding window'],
    answer: 1,
    explanation: 'i & (i − 1) is smaller than i and has exactly one fewer 1-bit, so a one-line DP reuses it. Counting each number separately is O(n · bits).',
  },
  hints: [
    'bits[0] = 0.',
    'bits[i] = bits[i & (i − 1)] + 1, or bits[i] = bits[i >> 1] + (i & 1).',
  ],
  approach: `**Brute force:** run a popcount for each i — O(n log n).

**Reuse (DP):** removing the lowest set bit gives a smaller number with one fewer 1: \`bits[i] = bits[i & (i − 1)] + 1\`. Or drop the last bit: \`bits[i] = bits[i >> 1] + (i & 1)\`. Both look only at smaller indices, so filling left to right works. O(n).`,

  functionName: 'countBits',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number[]}
 */
function countBits(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement — note the array has n + 1 entries.',
      args: [2], expected: [0, 1, 1] },
    { scenario: 'Example 2', hint: 'The second statement example: 0..5.',
      args: [5], expected: [0, 1, 1, 2, 1, 2] },
    { scenario: 'n = 0', hint: 'The output still has n + 1 = 1 entry: [0]. Returning an empty array (n entries) is the classic off-by-one.',
      args: [0], expected: [0] },
    { scenario: 'n = 1', hint: 'Two entries: 0 and 1.',
      args: [1], expected: [0, 1] },
    { scenario: 'Length is n + 1', hint: 'Index n itself must be included — a loop with `i < n` drops the last count.',
      args: [3], expected: [0, 1, 1, 2] },
    { scenario: 'Ends at a power of two', hint: '8 = 1000 has a single bit even though 7 had three — the count resets at powers of two.',
      args: [8], expected: [0, 1, 1, 2, 1, 2, 2, 3, 1] },
    { scenario: 'Ends just below a power of two', hint: '15 = 1111 has four set bits — the maximum for numbers below 16.',
      args: [15], expected: [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4] },
    { scenario: 'Two powers of two', hint: '16 must again be 1; the recurrence has to reuse earlier results correctly across the boundary.',
      args: [16], expected: [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4, 1] },
    { scenario: 'n = 100', hint: 'A mid-sized range covering several powers of two.',
      args: [100], expected: Array.from({ length: 101 }, (_, i) => i.toString(2).split('1').length - 1) },
    { scenario: 'n = 1023 (all ones at the end)', hint: '1023 = 1111111111 has ten set bits; every value up to it must be right.',
      args: [1023], expected: Array.from({ length: 1024 }, (_, i) => i.toString(2).split('1').length - 1) },
    { scenario: 'Maximum n (10^5)', hint: 'The largest allowed input — build the array once, reusing smaller results (bits[i & (i − 1)] + 1), rather than recounting from scratch.',
      args: [100000], expected: Array.from({ length: 100001 }, (_, i) => i.toString(2).split('1').length - 1) },
  ],

  solution: {
    code: `function countBits(n) {
  const bits = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    bits[i] = bits[i & (i - 1)] + 1;   // i without its lowest set bit, plus that bit
  }
  return bits;
}`,
  },
  dryRun: {
    columns: ['i', 'binary', 'i & (i−1)', 'bits[i]'],
    rows: [
      ['1', '1', '0', '0 + 1 = 1'],
      ['2', '10', '0', '1'],
      ['3', '11', '2', '1 + 1 = 2'],
      ['4', '100', '0', '1'],
      ['5', '101', '4', '2'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1) besides the output', explanation: 'One O(1) step per index.' },
  alternative: {
    title: 'Shift recurrence',
    md: '`bits[i] = bits[i >> 1] + (i & 1)` — i >> 1 is i without its last bit.',
    code: `function countBits(n) {
  const bits = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);
  return bits;
}`,
    complexity: 'O(n) time',
  },
  mistakes: [
    'Returning n elements instead of n + 1.',
    'Recomputing popcount from scratch for every i.',
  ],
};
