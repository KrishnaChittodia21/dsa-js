export default {
  id: 'unique-paths-ii',
  title: 'Unique Paths II',
  difficulty: 'Medium',
  order: 2,
  pattern: 'dp-2d-grid',
  tags: ['array', 'dynamic programming', 'matrix'],
  source: { platform: 'LeetCode', number: 63, url: 'https://leetcode.com/problems/unique-paths-ii/' },

  statement: `Same robot as in *Unique Paths* (moves only right or down, from top-left to bottom-right), but now some cells are blocked.

\`obstacleGrid[r][c] === 1\` means the cell is an obstacle and cannot be entered; \`0\` means it is free. Return the number of distinct paths that avoid every obstacle.`,
  examples: [
    { input: 'obstacleGrid = [[0,0,0],[0,1,0],[0,0,0]]', output: '2', explanation: 'The centre is blocked: go around it on the top-right or the bottom-left.' },
    { input: 'obstacleGrid = [[0,1],[0,0]]', output: '1' },
  ],
  constraints: ['1 <= m, n <= 100', 'obstacleGrid[r][c] is 0 or 1', 'The answer fits in a 32-bit signed integer'],

  think: `- How many ways lead into a blocked cell?
- In the first row, what happens to the cells to the right of an obstacle?
- What if the start or the goal is blocked?`,
  patternChallenge: {
    options: ['Graph BFS', 'Grid DP with a zero for blocked cells', 'Union-Find', 'Sliding window'],
    answer: 1,
    explanation: 'Still right/down moves, still counting paths — the only change is a base case: blocked cells contribute 0. BFS/Union-Find answer reachability, not counts.',
  },
  hints: [
    'Same transition as Unique Paths, but set dp to 0 on an obstacle.',
    'Do NOT pre-fill the first row/column with 1s; let the transition compute them so obstacles propagate.',
  ],
  approach: `**Brute force:** DFS over all right/down paths, skipping obstacles — exponential.

**DP:** \`dp[r][c] = 0\` if blocked, else \`dp[r−1][c] + dp[r][c−1]\`. Start with \`dp[0][0] = 1\` (if free). With one rolling row: for each row, for each column, \`dp[c] = 0\` if blocked else \`dp[c] += dp[c−1]\` (for c > 0). A blocked start gives 0 everywhere automatically.`,

  functionName: 'uniquePathsWithObstacles',
  paramNames: ['obstacleGrid'],
  starterCode: `/**
 * @param {number[][]} obstacleGrid
 * @return {number}
 */
function uniquePathsWithObstacles(obstacleGrid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: the middle obstacle leaves 2 paths.', args: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], expected: 2 },
    { scenario: 'Example 2', hint: 'The obstacle forces the path down first.', args: [[[0, 1], [0, 0]]], expected: 1 },
    { scenario: 'Blocked single cell', hint: 'Start (= goal) is an obstacle → 0.', args: [[[1]]], expected: 0 },
    { scenario: 'Free single cell', hint: 'Start equals goal → 1 path.', args: [[[0]]], expected: 1 },
    { scenario: 'Start blocked', hint: 'If the start is an obstacle nothing is reachable.', args: [[[1, 0]]], expected: 0 },
    { scenario: 'Goal blocked', hint: 'An obstacle on the goal means 0, however many paths reach its neighbours.', args: [[[0, 0], [0, 1]]], expected: 0 },
    { scenario: 'Obstacle in first row', hint: 'Pre-filling the first row with 1s ignores the block: cells after it are unreachable.', args: [[[0, 1, 0, 0]]], expected: 0 },
    { scenario: 'Obstacle in first column', hint: 'Same for the first column — everything below the obstacle is 0.', args: [[[0], [1], [0]]], expected: 0 },
    { scenario: 'First-row obstacle, 2 rows', hint: 'Cells right of the first-row obstacle can still be reached from below.', args: [[[0, 0, 1, 0], [0, 0, 0, 0]]], expected: 2 },
    { scenario: 'Wall across the grid', hint: 'A full row of obstacles cuts start from goal → 0.', args: [[[0, 0], [1, 1], [0, 0]]], expected: 0 },
    { scenario: 'Scattered obstacles', hint: '1 means obstacle, 0 means free — swapping the meaning gives a different count.', args: [[[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 0]]], expected: 4 },
    { scenario: 'No obstacles', hint: 'An open 5×5 grid → C(8,4) = 70.', args: [[[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]], expected: 70 },
    { scenario: 'Large input (100×100)', hint: 'An open 17×18 room feeding one corridor: over a billion paths, so un-memoized recursion is far too slow. The table is O(m·n).', argsGen: '() => { const g = Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => ((r <= 16 && c <= 17) || (c === 17 && r >= 16) || r === 99 && c >= 17) ? 0 : 1)); return [g]; }', expected: 1166803110, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function uniquePathsWithObstacles(obstacleGrid) {
  const n = obstacleGrid[0].length;
  const dp = new Array(n).fill(0);
  dp[0] = 1;                                   // one way to "be" at the start
  for (const row of obstacleGrid) {
    for (let c = 0; c < n; c++) {
      if (row[c] === 1) dp[c] = 0;             // blocked cell: 0 ways
      else if (c > 0) dp[c] += dp[c - 1];      // above + left
    }
  }
  return dp[n - 1];
}`,
  },
  dryRun: {
    columns: ['row', 'cells', 'dp after row'],
    rows: [
      ['0', '[0,0,0]', '[1, 1, 1]'],
      ['1', '[0,1,0]', '[1, 0, 1]'],
      ['2', '[0,0,0]', '[1, 1, 2]'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(n)', explanation: 'One pass over the grid with a single rolling row.' },
  alternative: {
    title: 'In-place 2D DP',
    md: 'Overwrite the grid with path counts (after converting obstacles to 0 and free cells to counts). O(1) extra space but mutates the input — mention it and ask before doing it in an interview.',
    complexity: 'O(m·n) time, O(1) extra space',
  },
  mistakes: [
    'Pre-filling the first row/column with 1 — obstacles in them must block everything after.',
    'Forgetting that a blocked start (or goal) means 0.',
    'Treating 1 as "free" (the encoding is 1 = obstacle).',
  ],
};
