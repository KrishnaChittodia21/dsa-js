export default {
  id: 'valid-perfect-square',
  title: 'Valid Perfect Square',
  difficulty: 'Easy',
  order: 4,
  pattern: 'binary-search-exact',
  tags: ['math', 'binary search'],
  source: { platform: 'LeetCode', number: 367, url: 'https://leetcode.com/problems/valid-perfect-square/' },

  statement: `Given a positive integer \`num\`, return \`true\` if it is a **perfect square** (the square of some integer) and \`false\` otherwise.

Do not use built-in square-root or power functions.`,
  examples: [
    { input: 'num = 16', output: 'true', explanation: '4 × 4 = 16' },
    { input: 'num = 14', output: 'false', explanation: '3² = 9 < 14 < 16 = 4²' },
  ],
  constraints: ['1 <= num <= 2^31 - 1'],

  think: `- Imagine the "virtual sorted array" \`[1², 2², 3², …]\`. What are you searching for in it?
- Is this an exact-match search or a boundary search?`,
  patternChallenge: {
    options: ['Hash Set of all squares', 'Binary Search — exact match over r in [1, num]', 'Sliding Window', 'Greedy'],
    answer: 1,
    explanation: 'r ↦ r² is strictly increasing, so the values r² form a sorted virtual array and we look for an exact value in it. Precomputing a set of squares works but is O(√n) space and time.',
  },
  hints: [
    'Binary search r in [1, min(num, 46341)]. Compare `r * r` with `num`.',
    'Equal → true; smaller → go right; bigger → go left. Empty range → false.',
  ],
  approach: `**Brute force:** try r = 1, 2, … until r² ≥ num — O(√num).

**Optimized:** the function r² is strictly increasing, so treat it as a sorted array indexed by r and run the closed \`lo <= hi\` exact-match search. Cap \`hi\` at 46341 (since 46341² > 2^31) to keep products small and exact.`,

  functionName: 'isPerfectSquare',
  paramNames: ['num'],
  starterCode: `/**
 * @param {number} num
 * @return {boolean}
 */
function isPerfectSquare(num) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '4 × 4 = 16: true.', args: [16], expected: true },
    { scenario: 'Example 2', hint: '14 lies between 9 and 16: false.', args: [14], expected: false },
    { scenario: 'One', hint: 'The smallest input: 1 = 1 × 1. Make sure your range includes 1.', args: [1], expected: true },
    { scenario: 'Two', hint: 'Smallest non-square.', args: [2], expected: false },
    { scenario: 'Four', hint: 'A small square where hi = num / 2 is exactly the root.', args: [4], expected: true },
    { scenario: 'Just below a square', hint: '99 is one less than 100: false.', args: [99], expected: false },
    { scenario: 'Just above a square', hint: '101 is one more than 100: false.', args: [101], expected: false },
    { scenario: 'Mid-sized square', hint: '899² = 808201: true.', args: [808201], expected: true },
    { scenario: 'Large non-square', hint: '10^8 + 1 is one past 10000²: false.', args: [100000001], expected: false },
    { scenario: 'Largest square', hint: '46340² = 2147395600, the biggest square in range: true.', args: [2147395600], expected: true },
    { scenario: 'Maximum input', hint: '2^31 − 1 is not a square. mid² stays below 2^53, so plain multiplication is exact in JS.', args: [2147483647], expected: false },
    { scenario: 'Square of a prime', hint: '46337² = 2147117569 — a large square whose root has no small factors.', args: [2147117569], expected: true },
  ],

  solution: {
    code: `function isPerfectSquare(num) {
  let lo = 1, hi = Math.min(num, 46341);
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    const sq = mid * mid;
    if (sq === num) return true;
    if (sq < num) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'mid²', 'decision'],
    rows: [
      ['1', '14', '7', '49', '> 14 → hi = 6'],
      ['1', '6', '3', '9', '< 14 → lo = 4'],
      ['4', '6', '5', '25', '> 14 → hi = 4'],
      ['4', '4', '4', '16', '> 14 → hi = 3'],
      ['4', '3', '—', '—', 'empty → false'],
    ],
  },
  complexity: { time: 'O(log num)', space: 'O(1)', explanation: 'Binary search over at most 46341 candidates: ~16 steps.' },
  alternative: {
    title: 'Sum of odd numbers',
    md: '1 + 3 + 5 + … + (2k − 1) = k². Subtract consecutive odd numbers from num; it is a perfect square iff you hit exactly 0.',
    code: `function isPerfectSquare(num) {
  for (let odd = 1; num > 0; odd += 2) num -= odd;
  return num === 0;
}`,
    complexity: 'O(√num) time, O(1) space',
  },
  mistakes: [
    'Using `Math.sqrt` (forbidden here) — and floating point can mislead for very large inputs anyway.',
    'Setting hi = num without capping: fine in JS for correctness, but mid² can exceed 2^53 for bigger ranges in other variants.',
  ],
};
