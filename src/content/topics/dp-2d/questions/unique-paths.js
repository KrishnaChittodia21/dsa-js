export default {
  id: 'unique-paths',
  title: 'Unique Paths',
  difficulty: 'Medium',
  order: 1,
  pattern: 'dp-2d-grid',
  tags: ['math', 'dynamic programming', 'combinatorics'],
  source: { platform: 'LeetCode', number: 62, url: 'https://leetcode.com/problems/unique-paths/' },

  statement: `A robot stands in the top-left cell of an \`m × n\` grid and wants to reach the bottom-right cell. At each step it may move **one cell right or one cell down**.

Return the number of different paths it can take.`,
  examples: [
    { input: 'm = 3, n = 7', output: '28' },
    { input: 'm = 3, n = 2', output: '3', explanation: 'Right→Down→Down, Down→Right→Down, Down→Down→Right.' },
  ],
  constraints: ['1 <= m, n <= 100', 'The answer fits in a 32-bit signed integer'],

  think: `- From which cells can the robot *enter* cell (r, c)?
- How many ways are there to reach any cell of the first row?
- Do you need the whole table, or just one row?`,
  patternChallenge: {
    options: ['Grid DP (paths from top and left)', 'BFS shortest path', 'Backtracking all paths', 'Greedy'],
    answer: 0,
    explanation: 'Right/down moves make the dependency acyclic, and "number of paths" is a sum over predecessors. BFS finds shortest distance, not a count of all paths; backtracking enumerates exponentially many paths.',
  },
  hints: [
    'ways(r, c) = ways(r − 1, c) + ways(r, c − 1); the first row and column are all 1.',
    'A single array of length n updated left to right holds "above" in dp[c] and "left" in dp[c − 1].',
  ],
  approach: `**Brute force:** recursion \`paths(r, c) = paths(r+1, c) + paths(r, c+1)\` — about 2^(m+n) calls.

**DP:** \`dp[r][c] = dp[r−1][c] + dp[r][c−1]\` with the first row and column set to 1. Fill top-to-bottom, left-to-right. Roll it into one row: \`dp[c] += dp[c−1]\`.

**Math:** every path is a sequence of (m−1) downs and (n−1) rights — choose which positions are downs: C(m+n−2, m−1).`,

  functionName: 'uniquePaths',
  paramNames: ['m', 'n'],
  starterCode: `/**
 * @param {number} m
 * @param {number} n
 * @return {number}
 */
function uniquePaths(m, n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: C(8,2) = 28.', args: [3, 7], expected: 28 },
    { scenario: 'Example 2', hint: 'A 3×2 grid has 3 paths.', args: [3, 2], expected: 3 },
    { scenario: 'Single cell', hint: 'Start is the goal → 1 path.', args: [1, 1], expected: 1 },
    { scenario: 'Single row', hint: 'Only right moves → 1 path. Initialising the first row to 0 gives 0.', args: [1, 10], expected: 1 },
    { scenario: 'Single column', hint: 'Only down moves → 1 path.', args: [10, 1], expected: 1 },
    { scenario: 'Two by two', hint: 'Right-down or down-right.', args: [2, 2], expected: 2 },
    { scenario: 'Three by three', hint: 'Updating the rolling row right-to-left reads a stale left value and gets this wrong.', args: [3, 3], expected: 6 },
    { scenario: 'Swapped dimensions', hint: 'm × n and n × m have the same count.', args: [7, 3], expected: 28 },
    { scenario: 'Ten by ten', hint: 'C(18,9) = 48 620.', args: [10, 10], expected: 48620 },
    { scenario: 'Thin and long (2×100)', hint: 'Choose where to go down: 100 ways.', args: [2, 100], expected: 100 },
    { scenario: 'Max length (100×3)', hint: 'C(101,2) = 5050.', args: [100, 3], expected: 5050 },
    { scenario: 'Large 32-bit answer', hint: 'C(33,11) = 193 536 720 — still fits in 32 bits.', args: [23, 12], expected: 193536720 },
    { scenario: 'Large input (17×18)', hint: 'Over a billion paths: un-memoized recursion visits each one. The table is O(m·n).', args: [17, 18], expected: 1166803110, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function uniquePaths(m, n) {
  const dp = new Array(n).fill(1);       // first row: one way each
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      dp[c] += dp[c - 1];                  // above (old dp[c]) + left (new dp[c-1])
    }
  }
  return dp[n - 1];
}`,
  },
  dryRun: {
    columns: ['row', 'dp after row'],
    rows: [
      ['0', '[1, 1, 1]'],
      ['1', '[1, 2, 3]'],
      ['2', '[1, 3, 6]'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(n)', explanation: 'Each cell computed once; one rolling row.' },
  alternative: {
    title: 'Combinatorics',
    md: 'C(m+n−2, k) with k = min(m, n) − 1, computed incrementally so intermediate values stay integral: res = res · (N − k + i) / i.',
    code: `function uniquePaths(m, n) {
  const N = m + n - 2, k = Math.min(m, n) - 1;
  let res = 1;
  for (let i = 1; i <= k; i++) res = res * (N - k + i) / i;
  return Math.round(res);
}`,
    complexity: 'O(min(m, n)) time, O(1) space',
  },
  mistakes: [
    'Initialising the first row to 0 instead of 1.',
    'Updating the rolling row right-to-left (reads a stale left value).',
    'Creating the 2D version with fill(new Array(n)) — shared rows.',
  ],
};
