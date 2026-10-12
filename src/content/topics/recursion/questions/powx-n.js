export default {
  id: 'powx-n',
  title: 'Pow(x, n)',
  difficulty: 'Medium',
  order: 1,
  pattern: 'recursion-halving',
  tags: ['recursion', 'math', 'fast exponentiation'],
  source: { platform: 'LeetCode', number: 50, url: 'https://leetcode.com/problems/powx-n/' },

  statement: `Implement \`myPow(x, n)\`, which returns \`x\` raised to the integer power \`n\` (that is, \`xⁿ\`).

\`n\` can be negative, zero or positive, and can be as large in magnitude as \`2^31\`. Do **not** use \`Math.pow\` or \`**\` — the point is to compute it yourself efficiently.`,
  examples: [
    { input: 'x = 2.00000, n = 10', output: '1024.00000' },
    { input: 'x = 2.10000, n = 3', output: '9.26100' },
    { input: 'x = 2.00000, n = -2', output: '0.25000', explanation: '2^-2 = 1 / 2^2 = 1/4' },
  ],
  constraints: ['-100.0 < x < 100.0', '-2^31 <= n <= 2^31 - 1', 'n is an integer', 'Either x is not zero or n > 0', '-10^4 <= xⁿ <= 10^4'],

  think: `- Multiplying x by itself |n| times is O(n) — up to 2 billion steps. How does xⁿ relate to x^(n/2)?
- What do you do when n is odd?
- How do you turn a negative exponent into a positive one?`,
  patternChallenge: {
    options: ['Binary Search on the answer', 'Recursion — reduce by one (x · x^(n−1))', 'Two Pointers', 'Recursion — halve the exponent (fast exponentiation)'],
    answer: 3,
    explanation: '|n| up to 2^31 rules out any O(n) method, including "reduce by one" (which would also overflow the stack). xⁿ = (x^(n/2))² halves the exponent per call → about 31 calls.',
  },
  hints: [
    'If `n < 0`, use `x = 1 / x` and `n = -n`. In JS, `-(-2147483648)` is exactly representable, so no overflow issue like in Java/C++.',
    'Compute `half = pow(Math.floor(n / 2))` **once**, then return `half * half` (even n) or `half * half * x` (odd n). Base case `n === 0` → 1.',
  ],
  approach: `**Brute force:** loop |n| times multiplying by x → O(|n|), too slow for |n| = 2^31.

**Optimized — fast exponentiation:**
- \`x^0 = 1\`.
- \`xⁿ = (x^⌊n/2⌋)²\` if n is even, \`(x^⌊n/2⌋)² · x\` if odd.
- Negative n: \`xⁿ = (1/x)^(−n)\`.

Each call halves n, so there are ⌊log2 |n|⌋ + 1 ≤ 32 calls. The crucial detail is storing the half result instead of calling twice.`,

  functionName: 'myPow',
  paramNames: ['x', 'n'],
  compare: 'float',
  starterCode: `/**
 * @param {number} x
 * @param {number} n
 * @return {number}
 */
function myPow(x, n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '2^10 = 1024.', args: [2,10], expected: 1024 },
    { scenario: 'Example 2', hint: 'Fractional base: 2.1^3 = 9.261 (compared with a small tolerance).', args: [2.1,3], expected: 9.261000000000001 },
    { scenario: 'Example 3', hint: 'Negative exponent: 2^−2 = 1 / 2² = 0.25.', args: [2,-2], expected: 0.25 },
    { scenario: 'Zero exponent', hint: 'Anything to the power 0 is 1 — this is the base case.', args: [5,0], expected: 1 },
    { scenario: 'Exponent one', hint: 'x^1 = x: the odd branch must multiply by x exactly once.', args: [7.5,1], expected: 7.5 },
    { scenario: 'Zero base', hint: '0^n = 0 for n > 0.', args: [0,5], expected: 0 },
    { scenario: 'Negative base, odd exponent', hint: 'The sign survives an odd exponent: (−2)^3 = −8.', args: [-2,3], expected: -8 },
    { scenario: 'Negative base, even exponent', hint: '(−2)^4 = 16 — the sign cancels.', args: [-2,4], expected: 16 },
    { scenario: 'Fraction to an odd power', hint: '0.5^13: odd exponents need the extra ·x at several levels.', args: [0.5,13], expected: 0.0001220703125 },
    { scenario: 'Minimum exponent, base 1', hint: 'n = −2^31: negating it gives 2^31, which does not fit in 32 bits. Avoid `>>` / `&` on the exponent.', args: [1,-2147483648], expected: 1 },
    { scenario: 'Maximum exponent, base −1', hint: 'n = 2^31 − 1 is odd, so (−1)^n = −1. A reduce-by-one recursion overflows the stack.', args: [-1,2147483647], expected: -1 },
    { scenario: 'Minimum exponent, base 2', hint: '2^(−2^31) underflows to 0. Handle the negative exponent before recursing.', args: [2,-2147483648], expected: 0 },
    { scenario: 'Minimum exponent, base −1', hint: '(−1)^(−2^31) = 1 because the exponent is even.', args: [-1,-2147483648], expected: 1 },
    { scenario: 'Huge exponent near 1', hint: 'n ≈ 2^31: multiplying x one time per step takes billions of steps. Halving the exponent needs ~31.', args: [1.000000001,2147483647], expected: 8.56328453237305, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function myPow(x, n) {
  if (n < 0) {          // x^-n = (1/x)^n
    x = 1 / x;
    n = -n;
  }
  function pow(e) {
    if (e === 0) return 1;                  // base case
    const half = pow(Math.floor(e / 2));    // ONE recursive call
    return e % 2 === 0 ? half * half : half * half * x;
  }
  return pow(n);
}`,
    explanation: '`Math.floor(e / 2)` instead of `e >> 1`: bit shifts convert to 32-bit signed ints, and `2147483648 >> 1` is negative.',
  },
  dryRun: {
    columns: ['call', 'e', 'half', 'returns'],
    rows: [
      ['pow(10)', '10', 'pow(5) = 32', '1024'],
      ['pow(5)', '5', 'pow(2) = 4', '4·4·2 = 32'],
      ['pow(2)', '2', 'pow(1) = 2', '4'],
      ['pow(1)', '1', 'pow(0) = 1', '1·1·2 = 2'],
      ['pow(0)', '0', '—', '1'],
    ],
  },
  complexity: { time: 'O(log |n|)', space: 'O(log |n|)', explanation: 'The exponent halves on each call: at most 32 calls and 32 stack frames.' },
  alternative: {
    title: 'Iterative binary exponentiation',
    md: 'Read the bits of n from lowest to highest. Keep `base` = x^(2^i); whenever bit i is set, multiply it into the result. O(log n) time and O(1) space.',
    code: `function myPow(x, n) {
  if (n < 0) { x = 1 / x; n = -n; }
  let result = 1;
  while (n > 0) {
    if (n % 2 === 1) result *= x;
    x *= x;
    n = Math.floor(n / 2);
  }
  return result;
}`,
    complexity: 'O(log |n|) time, O(1) space',
  },
  mistakes: [
    'Calling `pow(e / 2)` twice (`pow(e/2) * pow(e/2)`) — that is O(n) again.',
    'Using `e >> 1` or `e & 1` with e = 2^31 — bit operators truncate to 32-bit signed ints.',
    'Forgetting negative exponents, or computing `1 / pow(x, n)` recursively with a negative n that never reaches 0.',
    'Reduce-by-one recursion `x * pow(x, n − 1)` — O(n) time and a guaranteed stack overflow for large n.',
  ],
};
