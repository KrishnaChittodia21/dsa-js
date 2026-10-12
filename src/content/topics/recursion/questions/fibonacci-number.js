export default {
  id: 'fibonacci-number',
  title: 'Fibonacci Number',
  difficulty: 'Easy',
  order: 1,
  pattern: 'recursion-reduce-and-trust',
  tags: ['recursion', 'math', 'memoization'],
  source: { platform: 'LeetCode', number: 509, url: 'https://leetcode.com/problems/fibonacci-number/' },

  statement: `The Fibonacci sequence starts with \`F(0) = 0\` and \`F(1) = 1\`. Every later term is the sum of the two before it: \`F(n) = F(n − 1) + F(n − 2)\` for \`n > 1\`.

Given \`n\`, return \`F(n)\`.`,
  examples: [
    { input: 'n = 2', output: '1', explanation: 'F(2) = F(1) + F(0) = 1 + 0' },
    { input: 'n = 3', output: '2', explanation: 'F(3) = F(2) + F(1) = 1 + 1' },
    { input: 'n = 4', output: '3', explanation: 'F(4) = F(3) + F(2) = 2 + 1' },
  ],
  constraints: ['0 <= n <= 30'],

  think: `- The recurrence is handed to you. What are the base cases?
- Draw the recursion tree for \`n = 5\`. Which calls appear more than once?
- How could you avoid computing the same value twice?`,
  patternChallenge: {
    options: ['Sliding Window', 'Binary Search', 'Recursion (reduce & trust) + memoization', 'Two Pointers'],
    answer: 2,
    explanation: 'The problem *is* a recurrence: F(n) is defined from F(n − 1) and F(n − 2). That maps directly onto recursion with two base cases. Because the sub-calls overlap, memoization (a DP preview) makes it linear.',
  },
  hints: [
    'Base cases: `n === 0` → 0 and `n === 1` → 1. Everything else is `fib(n − 1) + fib(n − 2)`.',
    'The plain version is exponential. Store each computed F(k) in a Map (or array) and return it immediately if you see k again.',
  ],
  approach: `**Brute force (plain recursion):** translate the definition directly. Correct, but the recursion tree has ≈ 1.618ⁿ nodes because \`fib(n − 2)\` is recomputed inside \`fib(n − 1)\`. For n ≤ 30 that is ~1.6 million calls — still fast enough, but it would explode for n = 60.

**Optimized (memoized recursion):** only n + 1 distinct values F(0)…F(n) exist. Cache each one the first time it is computed; every later request is O(1). Time O(n), space O(n) for the memo plus O(n) stack depth.

**Iterative (bonus):** keep just the last two values — O(n) time, O(1) space.`,

  functionName: 'fib',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function fib(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'F(2) = F(1) + F(0) = 1.', args: [2], expected: 1 },
    { scenario: 'Example 2', hint: 'F(3) = F(2) + F(1) = 2.', args: [3], expected: 2 },
    { scenario: 'Example 3', hint: 'F(4) = F(3) + F(2) = 3.', args: [4], expected: 3 },
    { scenario: 'n = 0', hint: 'With only an `n === 1` base case, fib(0) recurses into negative numbers forever. F(0) = 0.', args: [0], expected: 0 },
    { scenario: 'n = 1', hint: 'The other base case: F(1) = 1.', args: [1], expected: 1 },
    { scenario: 'Small n', hint: 'F(5) = 5. Check both base cases combine correctly.', args: [5], expected: 5 },
    { scenario: 'n = 10', hint: 'F(10) = 55.', args: [10], expected: 55 },
    { scenario: 'n = 19', hint: 'An odd index in the middle of the range.', args: [19], expected: 4181 },
    { scenario: 'n = 25', hint: 'Plain recursion already makes ~250k calls here; a memo created inside the recursive function does not help.', args: [25], expected: 75025 },
    { scenario: 'Maximum n (30)', hint: 'The largest allowed n. A shared memo (or a loop) makes this instant.', args: [30], expected: 832040 },
  ],

  solution: {
    code: `function fib(n) {
  const memo = new Map();
  function go(k) {
    if (k < 2) return k;              // base cases: F(0) = 0, F(1) = 1
    if (memo.has(k)) return memo.get(k);
    const v = go(k - 1) + go(k - 2);  // leap of faith on both smaller calls
    memo.set(k, v);
    return v;
  }
  return go(n);
}`,
    explanation: 'The memo lives in the outer function so every recursive call shares it. The first time `go(k)` is asked it recurses; afterwards it is a Map lookup.',
  },
  dryRun: {
    columns: ['call', 'memo hit?', 'computes', 'returns'],
    rows: [
      ['go(4)', 'no', 'go(3) + go(2)', '3'],
      ['go(3)', 'no', 'go(2) + go(1)', '2'],
      ['go(2)', 'no', 'go(1) + go(0) = 1 + 0', '1 (stored)'],
      ['go(1)', 'base', '—', '1'],
      ['go(2) (inside go(4))', 'yes', '—', '1 (from memo)'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each k in 0..n is computed once; the memo holds n entries and the stack is at most n deep.' },
  alternative: {
    title: 'Iterative with two variables',
    md: 'Walk forward from F(0), F(1) keeping only the previous two values. No recursion, no memo.',
    code: `function fib(n) {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Only one base case (`n === 1`), so `fib(0)` recurses into negative numbers forever.',
    'Creating the memo inside the recursive function, so every call gets a fresh empty memo.',
    'Assuming plain recursion is fine for large n — it is exponential.',
  ],
};
