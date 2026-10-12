export default {
  id: 'minimum-path-sum',
  title: 'Minimum Path Sum',
  difficulty: 'Medium',
  order: 3,
  pattern: 'dp-2d-grid',
  tags: ['array', 'dynamic programming', 'matrix'],
  source: { platform: 'LeetCode', number: 64, url: 'https://leetcode.com/problems/minimum-path-sum/' },

  statement: `You are given an \`m × n\` grid of **non-negative** numbers. Starting at the top-left cell and moving only **right or down**, reach the bottom-right cell.

Return the smallest possible sum of all numbers on the path (both end cells included).`,
  examples: [
    { input: 'grid = [[1,3,1],[1,5,1],[4,2,1]]', output: '7', explanation: '1 → 3 → 1 → 1 → 1.' },
    { input: 'grid = [[1,2,3],[4,5,6]]', output: '12' },
  ],
  constraints: ['1 <= m, n <= 200', '0 <= grid[r][c] <= 200'],

  think: `- The cheapest path to (r, c) must arrive from the top or from the left. Which one?
- Why is greedy ("always step to the cheaper neighbour") wrong?
- How are the first row and column different?`,
  patternChallenge: {
    options: ['Greedy — always move to the smaller neighbour', 'Dijkstra', 'Grid DP (min of top and left)', 'Prefix sums'],
    answer: 2,
    explanation: 'Right/down only → acyclic, so DP works in O(m·n). Dijkstra would also be correct but is unnecessary (O(mn log mn)). Greedy fails: a cheap step now can lead into an expensive region.',
  },
  hints: [
    'dp[r][c] = grid[r][c] + min(dp[r − 1][c], dp[r][c − 1]); out-of-grid neighbours count as Infinity.',
    'A single row works: dp[c] (above) and dp[c − 1] (left, already updated).',
  ],
  approach: `**Brute force:** try every path: C(m+n−2, m−1) of them.

**DP:** \`dp[r][c] = grid[r][c] + min(top, left)\`. First row = running sum from the left; first column = running sum from above. Fill top-to-bottom, left-to-right, or roll into one array with \`dp[c] = grid[r][c] + min(dp[c], dp[c−1])\`.

Greedy fails when a locally cheaper step leads into a costly region, e.g. \`[[1,1,9],[5,9,9],[1,1,1]]\`: greedy steps right onto the cheap 1 and is then forced through a 9 (total ≥ 13), while the DP goes down the left column: 1 + 5 + 1 + 1 + 1 = 9.`,

  functionName: 'minPathSum',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function minPathSum(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: 1→3→1→1→1.', args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], expected: 7 },
    { scenario: 'Example 2', hint: 'Go right along the top row, then down.', args: [[[1, 2, 3], [4, 5, 6]]], expected: 12 },
    { scenario: 'Single cell', hint: 'The start cell counts — forgetting to add it returns 0.', args: [[[5]]], expected: 5 },
    { scenario: 'Single row', hint: 'Only one path. Initialising dp with 0 lets the first row take min(0, …) = 0.', args: [[[1, 2, 3, 4]]], expected: 10 },
    { scenario: 'Single column', hint: 'Only one path straight down.', args: [[[1], [2], [3]]], expected: 6 },
    { scenario: 'All zeros', hint: 'Every path costs 0.', args: [[[0, 0], [0, 0]]], expected: 0 },
    { scenario: 'Greedy neighbour fails', hint: 'Picking the cheaper neighbour each step goes right into the 9s (21); the best path goes down first (9).', args: [[[1, 1, 9], [5, 9, 9], [1, 1, 1]]], expected: 9 },
    { scenario: 'Expensive first row', hint: 'The cheap route is down the first column then along the bottom.', args: [[[1, 200, 200], [1, 200, 200], [1, 1, 1]]], expected: 5 },
    { scenario: 'Two by two', hint: 'Choose the cheaper of the two middle cells.', args: [[[1, 2], [1, 1]]], expected: 3 },
    { scenario: 'Medium grid', hint: 'A 7×8 grid with many competing routes.', args: [[[1, 4, 8, 6, 2, 2, 1, 7], [4, 7, 3, 1, 4, 5, 5, 1], [8, 8, 2, 1, 1, 8, 0, 1], [8, 9, 2, 9, 8, 0, 8, 9], [5, 7, 5, 7, 1, 8, 5, 5], [7, 0, 9, 4, 5, 6, 5, 6], [4, 9, 9, 7, 9, 1, 9, 0]]], expected: 47 },
    { scenario: 'Max values (200×200)', hint: 'Every cell is 200 and every path has 399 cells → 79 800.', argsGen: '() => [Array.from({ length: 200 }, () => new Array(200).fill(200))]', expected: 79800 },
    { scenario: 'Large input (200×200)', hint: 'Trying every path is exponential; the table is O(m·n).', argsGen: '() => { let x = 8; const r = () => (x = x * 48271 % 2147483647); return [Array.from({ length: 200 }, () => Array.from({ length: 200 }, () => r() % 201))]; }', expected: 20912, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minPathSum(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = new Array(n).fill(Infinity);  // dp[c] = min cost to reach (r, c)
  dp[0] = 0;
  for (let r = 0; r < m; r++) {
    dp[0] += grid[r][0];                   // first column: only from above
    for (let c = 1; c < n; c++) {
      dp[c] = grid[r][c] + Math.min(dp[c], dp[c - 1]);
    }
  }
  return dp[n - 1];
}`,
    explanation: 'Row 0 works automatically: dp[c] is Infinity (no cell above), so min picks the left neighbour.',
  },
  dryRun: {
    columns: ['row', 'dp after row', 'note'],
    rows: [
      ['0', '[1, 4, 5]', 'running sum'],
      ['1', '[2, 7, 6]', 'dp[1] = 5 + min(4, 2)'],
      ['2', '[6, 8, 7]', 'dp[2] = 1 + min(6, 8) = 7'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(n)', explanation: 'Each cell once; one row of state.' },
  alternative: {
    title: 'In-place',
    md: 'Accumulate directly in grid (grid[r][c] += min(top, left)). O(1) extra space but destroys the input.',
    complexity: 'O(m·n) time, O(1) extra space',
  },
  mistakes: [
    'Greedy neighbour choice.',
    'Initialising dp with 0 so the first row takes min(0, left) = 0.',
    'Forgetting to add the start cell.',
  ],
};
