export default {
  id: 'n-th-tribonacci-number',
  title: 'N-th Tribonacci Number',
  difficulty: 'Easy',
  order: 2,
  pattern: 'dp-1d-linear-sequence',
  tags: ['dynamic programming', 'math', 'memoization'],
  source: { platform: 'LeetCode', number: 1137, url: 'https://leetcode.com/problems/n-th-tribonacci-number/' },

  statement: `The Tribonacci sequence is defined by \`T0 = 0\`, \`T1 = 1\`, \`T2 = 1\`, and \`T(n+3) = T(n) + T(n+1) + T(n+2)\` for \`n >= 0\`.

Given \`n\`, return \`Tn\`.`,
  examples: [
    { input: 'n = 4', output: '4', explanation: 'T3 = 0 + 1 + 1 = 2, T4 = 1 + 1 + 2 = 4.' },
    { input: 'n = 25', output: '1389537' },
  ],
  constraints: ['0 <= n <= 37', 'the answer fits in a 32-bit integer'],

  think: `- How many previous values does each term need?
- How many variables do you need to keep while looping?
- What should you return for n = 0, 1, 2?`,
  patternChallenge: {
    options: ['1D DP — Linear Sequence', 'Two Pointers', 'Prefix Sum', 'Divide and Conquer'],
    answer: 0,
    explanation: 'Each term depends on a fixed window of the previous three terms — the linear-sequence DP with a 3-variable rolling window.',
  },
  hints: ['Handle n = 0 and n ≤ 2 directly.', 'Keep a, b, c = T(i−3), T(i−2), T(i−1) and slide them forward.'],
  approach: `**Brute force:** recursive definition → ~3ⁿ calls (actually ~1.84ⁿ).

**DP:** the state is the index; the transition sums the three previous states. Iterating from 3 to n with three rolling variables gives O(n) time, O(1) space.`,

  functionName: 'tribonacci',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function tribonacci(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'T3 = 0 + 1 + 1 = 2, T4 = 1 + 1 + 2 = 4.', args: [4], expected: 4 },
    { scenario: 'Example 2', hint: 'A mid-size value — the three-variable rolling update must keep the right order.', args: [25], expected: 1389537 },
    { scenario: 'Zero (n = 0)', hint: 'T0 = 0 is a base case; do not run the loop at all.', args: [0], expected: 0 },
    { scenario: 'First base case (n = 1)', hint: 'T1 = 1 is given directly.', args: [1], expected: 1 },
    { scenario: 'Second base case (n = 2)', hint: 'T2 = 1, not 0 — returning 0 here is a common slip in the base cases.', args: [2], expected: 1 },
    { scenario: 'First computed term (n = 3)', hint: 'The first term the recurrence produces: 0 + 1 + 1.', args: [3], expected: 2 },
    { scenario: 'Small value (n = 5)', hint: 'If you roll a, b, c in the wrong order (overwriting one before it is used), small values already come out wrong.', args: [5], expected: 7 },
    { scenario: 'Ten terms in (n = 10)', hint: 'Checks that the loop runs exactly up to n, not n − 1 or n + 1.', args: [10], expected: 149 },
    { scenario: 'Larger value (n = 30)', hint: 'Plain recursion makes tens of millions of calls here; keep only the last three values.', args: [30], expected: 29249425 },
    { scenario: 'Maximum input (n = 37)', hint: 'Plain recursion without memoization branches three ways per call — billions of calls. Compute iteratively in O(n).', args: [37], expected: 2082876103, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function tribonacci(n) {
  if (n === 0) return 0;
  if (n <= 2) return 1;
  let a = 0, b = 1, c = 1; // T(i-3), T(i-2), T(i-1)
  for (let i = 3; i <= n; i++) {
    const next = a + b + c;
    a = b;
    b = c;
    c = next;
  }
  return c;
}`,
  },
  dryRun: {
    columns: ['i', 'a', 'b', 'c', 'next'],
    rows: [
      ['3', '0', '1', '1', '2'],
      ['4', '1', '1', '2', '4'],
      ['5', '1', '2', '4', '7'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Constant work per index.' },
  alternative: {
    title: 'Tabulation with an array',
    md: 'Store all values in `dp`; easier to debug, O(n) space.',
    code: `function tribonacci(n) {
  const dp = [0, 1, 1];
  for (let i = 3; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
  return dp[n];
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Returning 0 for n = 2 (T2 = 1).', 'Rolling the variables in the wrong order.', 'Plain recursion without memoization.'],
};
