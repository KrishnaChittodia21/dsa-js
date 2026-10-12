export default {
  id: 'sqrtx',
  title: 'Sqrt(x)',
  difficulty: 'Easy',
  order: 3,
  pattern: 'binary-search-on-answer',
  tags: ['math', 'binary search'],
  source: { platform: 'LeetCode', number: 69, url: 'https://leetcode.com/problems/sqrtx/' },

  statement: `Given a non-negative integer \`x\`, return the **integer part** of its square root (the square root rounded down).

You may not use any built-in exponent or square-root function (\`Math.sqrt\`, \`**\`, \`Math.pow\`).`,
  examples: [
    { input: 'x = 4', output: '2' },
    { input: 'x = 8', output: '2', explanation: '√8 ≈ 2.828, rounded down to 2.' },
  ],
  constraints: ['0 <= x <= 2^31 - 1'],

  think: `- The answer is a number r in [0, x]. What yes/no question about a candidate r is monotonic?
- You want the **largest** r satisfying it — is that a "first true" or a "last true" search?
- Which midpoint formula is safe when x is close to 2^31?`,
  patternChallenge: {
    options: ['Binary Search on the answer (largest r with r·r ≤ x)', 'Sliding Window', 'Two Pointers on a sorted array', 'Dynamic Programming'],
    answer: 0,
    explanation: 'There is no array — the search space is the range of candidate answers, and "r·r ≤ x" is true for small r and false after the root. That is binary search on the answer.',
  },
  hints: [
    'Predicate `r * r <= x` is true, true, …, true, false, false. You want the last true.',
    'Equivalently find the first r with `r * r > x` and return r − 1. Use `Math.floor((lo + hi) / 2)` — `lo + hi` can exceed 2^31.',
  ],
  approach: `**Brute force:** r = 0, 1, 2… while (r+1)² ≤ x — O(√x) ≈ 46,000 steps for the max input. Acceptable but not the point.

**Optimized:** search r in [0, x + 1) for the **first** r with r·r > x (a lower-bound search), then answer r − 1. In JS, \`r * r\` with r ≤ 2^31 is below 2^62 — larger than 2^53, so tiny precision loss is possible in theory, but comparisons near √x (≈ 46341) are exact. Limiting \`hi\` to \`Math.min(x, 46341) + 1\` keeps every product exact.`,

  functionName: 'mySqrt',
  paramNames: ['x'],
  starterCode: `/**
 * @param {number} x
 * @return {number}
 */
function mySqrt(x) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A perfect square: √4 = 2 exactly.', args: [4], expected: 2 },
    { scenario: 'Example 2', hint: '√8 ≈ 2.83 rounds down to 2.', args: [8], expected: 2 },
    { scenario: 'Zero', hint: 'x = 0 is allowed: the answer is 0. Make sure the search range includes 0.', args: [0], expected: 0 },
    { scenario: 'One', hint: '√1 = 1. A range like [1, x / 2] is empty here.', args: [1], expected: 1 },
    { scenario: 'Two', hint: '√2 ≈ 1.41 → 1.', args: [2], expected: 1 },
    { scenario: 'Just below a square', hint: '15 is one less than 16: the answer is 3, not 4.', args: [15], expected: 3 },
    { scenario: 'Exact square 16', hint: 'Returning lo instead of lo − 1 in the "first r with r² > x" form gives 5 here.', args: [16], expected: 4 },
    { scenario: 'Just above a square', hint: '17 is one more than 16: still 4.', args: [17], expected: 4 },
    { scenario: 'Largest perfect square', hint: '46340² = 2147395600 is the biggest square ≤ 2^31 − 1.', args: [2147395600], expected: 46340 },
    { scenario: 'Just below largest square', hint: 'One less than 46340²: the answer is 46339.', args: [2147395599], expected: 46339 },
    { scenario: 'Maximum input', hint: 'x = 2^31 − 1. `(lo + hi) >> 1` can overflow to a negative number at this size — use Math.floor((lo + hi) / 2).', args: [2147483647], expected: 46340 },
    { scenario: 'Mid-sized value', hint: 'An ordinary large value: √(10^9) ≈ 31622.8.', args: [1000000000], expected: 31622 },
  ],

  solution: {
    code: `function mySqrt(x) {
  // first r with r * r > x, searched in [0, hi]; answer is r - 1
  let lo = 0, hi = Math.min(x, 46341) + 1;   // 46341^2 > 2^31 - 1, keeps products exact
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (mid * mid > x) hi = mid;   // too big → root is left of mid
    else lo = mid + 1;
  }
  return lo - 1;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'mid² > 8?', 'decision'],
    rows: [
      ['0', '9', '4', '16 yes', 'hi = 4'],
      ['0', '4', '2', '4 no', 'lo = 3'],
      ['3', '4', '3', '9 yes', 'hi = 3'],
      ['3', '3', '—', '—', 'return 3 − 1 = 2'],
    ],
  },
  complexity: { time: 'O(log x)', space: 'O(1)', explanation: 'About 16 iterations for the largest input.' },
  alternative: {
    title: 'Newton\'s method',
    md: 'Iterate `r = (r + x / r) / 2` (integer division) starting from x until `r * r <= x`. Converges quadratically — very few steps — but is harder to prove correct in an interview.',
    code: `function mySqrt(x) {
  let r = x;
  while (r * r > x) r = Math.floor((r + Math.floor(x / r)) / 2);
  return r;
}`,
    complexity: 'O(log x) iterations (in practice ~5–20), O(1) space',
  },
  mistakes: [
    'Searching the "last true" with floor mid and `lo = mid` → infinite loop.',
    'Using `(lo + hi) >> 1` when lo + hi can pass 2^31 − 1: the result becomes negative.',
    'Returning lo instead of lo − 1 in the "first r with r² > x" formulation.',
  ],
};
