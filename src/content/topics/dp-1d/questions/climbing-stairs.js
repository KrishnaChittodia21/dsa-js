export default {
  id: 'climbing-stairs',
  title: 'Climbing Stairs',
  difficulty: 'Easy',
  order: 1,
  pattern: 'dp-1d-linear-sequence',
  tags: ['dynamic programming', 'math', 'memoization'],
  source: { platform: 'LeetCode', number: 70, url: 'https://leetcode.com/problems/climbing-stairs/' },

  statement: `A staircase has \`n\` steps. Each move you climb either **1** or **2** steps.

Return the number of **distinct sequences of moves** that take you from the bottom (step 0) to the top (step \`n\`).`,
  examples: [
    { input: 'n = 2', output: '2', explanation: '1+1, or 2.' },
    { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1.' },
  ],
  constraints: ['1 <= n <= 45'],

  think: `- Think about your LAST move onto step n. Where could you have been just before it?
- If you knew the answers for n − 1 and n − 2, how would you get the answer for n?
- How many different values of n does the recursion ever ask about?`,
  patternChallenge: {
    options: ['Greedy', '1D DP — Linear Sequence', 'Backtracking (enumerate all sequences)', 'Binary Search'],
    answer: 1,
    explanation: 'ways(n) = ways(n−1) + ways(n−2) with heavily overlapping subproblems. Backtracking would enumerate every sequence — exponentially many (~1.6ⁿ).',
  },
  hints: [
    'The last move is a 1-step (from n − 1) or a 2-step (from n − 2). Those two groups of sequences do not overlap.',
    'ways(0) = 1 and ways(1) = 1. Build up with two variables.',
  ],
  approach: `**Brute force:** \`ways(n) = ways(n−1) + ways(n−2)\` recursively — the recursion tree repeats subproblems and has ~φⁿ nodes.

**Memoization:** cache ways(k) → n + 1 states, O(1) each → O(n).

**Tabulation + space optimisation:** dp[i] only needs dp[i−1] and dp[i−2], so roll two variables. (These are the Fibonacci numbers shifted by one.)`,

  functionName: 'climbStairs',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two steps: either 1+1 or a single 2-step move.', args: [2], expected: 2 },
    { scenario: 'Example 2', hint: 'Three steps: 1+1+1, 1+2 and 2+1 — order matters.', args: [3], expected: 3 },
    { scenario: 'Single step (n = 1)', hint: 'Only one move is possible. Make sure your loop or recursion does not assume n ≥ 2.', args: [1], expected: 1 },
    { scenario: 'Four steps', hint: 'ways(4) = ways(3) + ways(2). If you set ways(0) = 0 instead of 1, every value from here on is off.', args: [4], expected: 5 },
    { scenario: 'Five steps', hint: 'If you shift the rolling variables in the wrong order (overwriting prev1 before saving it), the sequence drifts from n = 3 onwards.', args: [5], expected: 8 },
    { scenario: 'Ten steps', hint: 'The counts follow the Fibonacci sequence — ways(n) = ways(n−1) + ways(n−2).', args: [10], expected: 89 },
    { scenario: 'Twenty steps', hint: 'A medium value; any off-by-one in the loop bounds shows up as a neighbouring Fibonacci number.', args: [20], expected: 10946 },
    { scenario: 'Thirty steps', hint: 'Plain recursion already makes millions of calls here — cache each ways(i) once.', args: [30], expected: 1346269 },
    { scenario: 'Near the maximum (n = 44)', hint: 'Over a billion ways; the answer still fits safely in a JS number.', args: [44], expected: 1134903170 },
    { scenario: 'Maximum input (n = 45)', hint: 'Plain recursion without memo makes about 2·10⁹ calls here. Store each ways(i) once (memo or a loop) for O(n).', args: [45], expected: 1836311903, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function climbStairs(n) {
  let prev2 = 1; // ways(0): one way to stand at the bottom — do nothing
  let prev1 = 1; // ways(1)
  for (let i = 2; i <= n; i++) {
    const cur = prev1 + prev2; // last move was 1 step (from i-1) or 2 steps (from i-2)
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
  },
  dryRun: {
    columns: ['i', 'prev2 (ways(i−2))', 'prev1 (ways(i−1))', 'cur'],
    rows: [
      ['2', '1', '1', '2'],
      ['3', '1', '2', '3'],
      ['4', '2', '3', '5'],
      ['5', '3', '5', '8'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One loop, two variables.' },
  alternative: {
    title: 'Memoized recursion',
    md: 'Closest to the recurrence; O(n) time and O(n) space (memo + call stack).',
    code: `function climbStairs(n, memo = new Map()) {
  if (n <= 1) return 1;
  if (memo.has(n)) return memo.get(n);
  const ans = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
  memo.set(n, ans);
  return ans;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Plain recursion without memo — n = 45 makes ~2·10⁹ calls.',
    'Base case ways(0) = 0 (then ways(2) = 1, wrong).',
    'Shifting variables in the wrong order.',
  ],
};
