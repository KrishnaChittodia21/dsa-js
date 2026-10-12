export default {
  id: 'perfect-squares',
  title: 'Perfect Squares',
  difficulty: 'Medium',
  order: 4,
  pattern: 'dp-1d-unbounded-choice',
  tags: ['math', 'dynamic programming', 'bfs'],
  source: { platform: 'LeetCode', number: 279, url: 'https://leetcode.com/problems/perfect-squares/' },

  statement: `Given a positive integer \`n\`, return the **least number of perfect squares** (1, 4, 9, 16, …) that sum to \`n\`. Squares may be reused.`,
  examples: [
    { input: 'n = 12', output: '3', explanation: '4 + 4 + 4.' },
    { input: 'n = 13', output: '2', explanation: '4 + 9.' },
  ],
  constraints: ['1 <= n <= 10^4'],

  think: `- This is coin change in disguise. What are the "coins"?
- Why does greedy (biggest square first) fail for 12?
- How many squares are ≤ n?`,
  patternChallenge: {
    options: ['Greedy — largest square first', 'Binary Search', '1D DP — Unbounded Choices', 'Two Pointers'],
    answer: 2,
    explanation: 'Coins are 1, 4, 9, … ≤ n: dp[x] = 1 + min over squares s ≤ x of dp[x − s]. Greedy gives 9 + 1 + 1 + 1 = 4 squares for 12, but 4 + 4 + 4 needs 3.',
  },
  hints: ['dp[0] = 0; dp[x] = min over j with j·j ≤ x of dp[x − j·j] + 1.', 'Only √x candidate squares per x.'],
  approach: `**Brute force:** recursion over every square to subtract → exponential.

**DP:** exactly coin change with coins \`{j² : j² ≤ n}\`. \`dp[x]\` = least squares summing to x. O(n√n) ≈ 10⁶ operations for n = 10⁴.

(Math aside: Lagrange's four-square theorem says the answer is always ≤ 4, and Legendre's three-square theorem tells exactly when it is 4 — an O(√n) solution exists, but the DP is what interviews expect.)`,

  functionName: 'numSquares',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function numSquares(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '4 + 4 + 4. Greedy takes 9 + 1 + 1 + 1 = four squares.', args: [12], expected: 3 },
    { scenario: 'Example 2', hint: '4 + 9 = 13.', args: [13], expected: 2 },
    { scenario: 'Smallest input (n = 1)', hint: '1 is itself a square.', args: [1], expected: 1 },
    { scenario: 'Two ones', hint: '2 = 1 + 1; dp must start at Infinity (not 0) for every x > 0.', args: [2], expected: 2 },
    { scenario: 'Needs four squares', hint: '7 = 4 + 1 + 1 + 1 — numbers of the form 8k + 7 always need four.', args: [7], expected: 4 },
    { scenario: 'Perfect square', hint: '16 is a square — answer 1.', args: [16], expected: 1 },
    { scenario: 'Greedy largest square fails', hint: 'Greedy takes 16 + 1 + 1 (three squares) but 9 + 9 needs only two.', args: [18], expected: 2 },
    { scenario: 'Three squares needed', hint: '43 = 25 + 9 + 9. Only square sizes j² ≤ x are valid at each x — larger ones would read negative indices.', args: [43], expected: 3 },
    { scenario: 'Power of four times 7', hint: '28 = 4 · 7 still needs four squares (25 + 1 + 1 + 1).', args: [28], expected: 4 },
    { scenario: 'Maximum input (n = 10^4)', hint: '10000 = 100². A perfect square at the upper bound.', args: [10000], expected: 1 },
    { scenario: 'Large non-square (n = 9999)', hint: 'Top-down recursion here is ~10⁴ calls deep and can overflow the JS stack; a bottom-up loop (or BFS) is safe.', args: [9999], expected: 4 },
    { scenario: 'Four-square case (n = 1792)', hint: '1792 = 4³ · 28 needs four squares. Plain recursion without memo re-solves the same remainders exponentially often; cache dp[x].', args: [1792], expected: 4, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function numSquares(n) {
  const dp = new Array(n + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= n; x++) {
    for (let j = 1; j * j <= x; j++) {
      const cand = dp[x - j * j] + 1; // last square used is j*j
      if (cand < dp[x]) dp[x] = cand;
    }
  }
  return dp[n];
}`,
  },
  dryRun: {
    columns: ['x', 'candidates', 'dp[x]'],
    rows: [
      ['1', 'dp[0]+1', '1'],
      ['4', 'dp[3]+1 = 4, dp[0]+1 = 1', '1'],
      ['8', 'dp[7]+1 = 5, dp[4]+1 = 2', '2'],
      ['12', 'dp[11]+1 = 4, dp[8]+1 = 3, dp[3]+1 = 4', '3'],
    ],
  },
  complexity: { time: 'O(n√n)', space: 'O(n)', explanation: 'n states, √x transitions each.' },
  alternative: {
    title: 'Math (Lagrange / Legendre)',
    md: 'Answer 1 if n is a square; 4 if n = 4^a(8b + 7); 2 if n = i² + j² for some i; otherwise 3.',
    code: `function numSquares(n) {
  const isSq = (x) => Number.isInteger(Math.sqrt(x));
  if (isSq(n)) return 1;
  let m = n;
  while (m % 4 === 0) m /= 4;
  if (m % 8 === 7) return 4;
  for (let i = 1; i * i <= n; i++) if (isSq(n - i * i)) return 2;
  return 3;
}`,
    complexity: 'O(√n) time, O(1) space',
  },
  mistakes: ['Greedy largest square first.', 'Iterating squares up to n instead of x (reads negative indices).', 'Initialising dp with 0.'],
};
