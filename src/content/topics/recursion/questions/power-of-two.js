export default {
  id: 'power-of-two',
  title: 'Power of Two',
  difficulty: 'Easy',
  order: 2,
  pattern: 'recursion-reduce-and-trust',
  tags: ['recursion', 'math', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 231, url: 'https://leetcode.com/problems/power-of-two/' },

  statement: `Given an integer \`n\`, return \`true\` if it equals \`2^x\` for some integer \`x ≥ 0\`, and \`false\` otherwise.`,
  examples: [
    { input: 'n = 1', output: 'true', explanation: '2^0 = 1' },
    { input: 'n = 16', output: 'true', explanation: '2^4 = 16' },
    { input: 'n = 3', output: 'false' },
  ],
  constraints: ['-2^31 <= n <= 2^31 - 1'],

  think: `- If n is a power of two and n > 1, what can you say about n / 2?
- Which inputs must be rejected immediately so the recursion always shrinks towards a base case?`,
  patternChallenge: {
    options: ['Recursion (reduce & trust): n is a power of two iff n is even and n/2 is', 'Sliding Window', 'Hash Map lookup', 'Two-player game recursion'],
    answer: 0,
    explanation: 'The definition is self-similar: 2^x = 2 · 2^(x−1). So "n is a power of two" reduces to "n is even and n / 2 is a power of two", with base case n = 1. Each step halves n, so depth ≤ 31.',
  },
  hints: [
    'Base cases: `n <= 0` → false, `n === 1` → true.',
    'If n is odd (and not 1) → false. Otherwise recurse on `n / 2`.',
  ],
  approach: `**Recursive:** reject non-positive numbers (0 would recurse forever: 0 / 2 = 0). \`1\` is 2^0. An odd number > 1 cannot be a power of two. Otherwise the answer is the answer for \`n / 2\`. Depth ≤ 31, so O(log n).

**Bit trick (alternative):** a power of two has exactly one set bit, so \`n > 0 && (n & (n - 1)) === 0\` — O(1).`,

  functionName: 'isPowerOfTwo',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {boolean}
 */
function isPowerOfTwo(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '1 = 2^0 is a power of two.', args: [1], expected: true },
    { scenario: 'Example 2', hint: '16 = 2^4.', args: [16], expected: true },
    { scenario: 'Example 3', hint: '3 is odd and greater than 1.', args: [3], expected: false },
    { scenario: 'Zero', hint: 'Without an `n <= 0` base case, 0 / 2 === 0 recurses forever. 0 is not a power of two.', args: [0], expected: false },
    { scenario: 'Two', hint: 'The smallest power above 1: 2 = 2^1.', args: [2], expected: true },
    { scenario: 'Negative power-of-two magnitude', hint: '−16 is negative, so it can never be 2^x.', args: [-16], expected: false },
    { scenario: 'Negative one', hint: '`n >> 1` keeps −1 at −1 forever. Reject non-positive numbers first.', args: [-1], expected: false },
    { scenario: 'Even but not a power', hint: '6 halves to 3, which is odd — return false.', args: [6], expected: false },
    { scenario: 'Even until 3', hint: '3 · 2^29 halves 29 times before reaching 3.', args: [1610612736], expected: false },
    { scenario: 'Largest power (2^30)', hint: 'The largest power of two inside the 32-bit signed range.', args: [1073741824], expected: true },
    { scenario: 'Odd just above 2^30', hint: '2^30 + 1 is odd, so it is not a power of two.', args: [1073741825], expected: false },
    { scenario: 'Maximum int', hint: '2^31 − 1 is odd.', args: [2147483647], expected: false },
    { scenario: 'Minimum int', hint: '−2^31 has only one bit set, so `n & (n − 1)` alone says yes — the `n > 0` check is required.', args: [-2147483648], expected: false },
  ],

  solution: {
    code: `function isPowerOfTwo(n) {
  if (n <= 0) return false;     // 0 and negatives are never powers of two (and 0 would loop forever)
  if (n === 1) return true;     // 2^0
  if (n % 2 !== 0) return false; // odd and > 1
  return isPowerOfTwo(n / 2);   // halve and trust
}`,
  },
  dryRun: {
    columns: ['call', 'n', 'check', 'result'],
    rows: [
      ['1', '16', 'even → recurse', '…'],
      ['2', '8', 'even → recurse', '…'],
      ['3', '4', 'even → recurse', '…'],
      ['4', '2', 'even → recurse', '…'],
      ['5', '1', 'base case', 'true (propagates up)'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(log n)', explanation: 'n halves on each call, so there are at most 31 calls (and frames) for 32-bit inputs.' },
  alternative: {
    title: 'Single-bit check',
    md: '`n & (n - 1)` clears the lowest set bit. A power of two has exactly one set bit, so the result is 0. Works for n up to 2^31 − 1 because bit operators use 32-bit ints.',
    code: `function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}`,
    complexity: 'O(1) time and space',
  },
  mistakes: [
    'Missing the `n <= 0` base case: `isPowerOfTwo(0)` recurses forever because 0 / 2 === 0.',
    'Returning true for n = 0 with the bit trick (`0 & -1` is 0) — the `n > 0` guard is required.',
    'Using `n >> 1` on negative numbers: arithmetic shift of −1 stays −1 forever.',
  ],
};
