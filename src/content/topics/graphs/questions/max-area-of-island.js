export default {
  id: 'max-area-of-island',
  title: 'Max Area of Island',
  difficulty: 'Medium',
  order: 2,
  pattern: 'grid-graph-traversal',
  tags: ['grid', 'dfs', 'connected components'],
  source: { platform: 'LeetCode', number: 695, url: 'https://leetcode.com/problems/max-area-of-island/' },

  statement: `Given an \`m x n\` binary grid (numbers: \`1\` = land, \`0\` = water), an island is a group of land cells connected 4-directionally. The **area** of an island is the number of cells in it.

Return the maximum area of any island, or \`0\` if there is no land.`,
  examples: [
    { input: 'grid = [[0,0,1,0,0],[0,1,1,0,0],[0,0,0,0,1],[1,1,0,1,1]]', output: '3', explanation: 'Islands have areas 3, 3 and 2.' },
    { input: 'grid = [[0,0,0,0]]', output: '0' },
  ],
  constraints: ['1 <= m, n <= 50', 'grid[i][j] is 0 or 1'],

  think: `- How is this different from counting islands?
- What should your traversal **return** so that you get the size for free?`,
  patternChallenge: {
    options: ['Grid DFS returning component size', 'Kadane on each row', 'Prefix sums', 'Topological Sort'],
    answer: 0,
    explanation: 'Each island is a connected component; its area is the number of cells a traversal visits. Kadane/prefix sums work on contiguous 1D ranges, but islands have arbitrary shapes.',
  },
  hints: [
    'Same scan as Number of Islands, but make `dfs(r, c)` return the number of cells it sank.',
    '`dfs` returns 0 for water/out of bounds, otherwise `1 + dfs(up) + dfs(down) + dfs(left) + dfs(right)`.',
  ],
  approach: `Scan all cells. For each unvisited land cell, run a DFS that sinks the island and returns how many cells it sank; keep the maximum. With at most 2,500 cells the recursion depth is safe here.`,

  functionName: 'maxAreaOfIsland',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function maxAreaOfIsland(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Islands of areas 3, 3 and 2 — return the largest area, not the island count.', args: [[[0,0,1,0,0],[0,1,1,0,0],[0,0,0,0,1],[1,1,0,1,1]]], expected: 3 },
    { scenario: 'Example 2', hint: 'No land at all: the answer is 0 (not -1).', args: [[[0,0,0,0]]], expected: 0 },
    { scenario: 'Single land cell', hint: 'The smallest island has area 1.', args: [[[1]]], expected: 1 },
    { scenario: 'Single water cell', hint: 'A 1×1 grid of water — initialise best to 0, not -1.', args: [[[0]]], expected: 0 },
    { scenario: 'Whole grid is land', hint: 'The island is the whole 2×2 grid.', args: [[[1,1],[1,1]]], expected: 4 },
    { scenario: 'Diagonal cells only', hint: 'Diagonal neighbours are not connected — every island has area 1.', args: [[[1,0,1],[0,1,0],[1,0,1]]], expected: 1 },
    { scenario: 'Count vs area', hint: 'Three islands of size 1, 1 and 4: returning the island count gives 3, the answer is 4.', args: [[[1,0,1,0],[0,0,0,0],[1,1,0,0],[1,1,0,0]]], expected: 4 },
    { scenario: 'Winding island', hint: 'A bent island reached through several turns; sink each cell before recursing so it is counted once.', args: [[[1,1,0,0],[0,1,0,1],[0,1,1,1],[0,0,0,0]]], expected: 7 },
    { scenario: 'Plus shape plus a tail', hint: 'A cell reachable from two neighbours must still be counted only once.', args: [[[0,1,0],[1,1,1],[0,1,0],[0,0,1]]], expected: 5 },
    { scenario: 'Largest island last', hint: 'The biggest island is found at the end of the scan — keep comparing until the very last cell.', args: [[[1,0,0,0],[0,0,1,1],[0,0,1,1],[0,1,1,1]]], expected: 7 },
    { scenario: 'Ring around a lake', hint: 'Land surrounding a lake is one island of area 8.', args: [[[1,1,1],[1,0,1],[1,1,1]]], expected: 8 },
    { scenario: 'Full 50×50 land', hint: 'The maximum grid, all land: one island of area 2,500.', argsGen: '() => [Array.from({ length: 50 }, () => new Array(50).fill(1))]', expected: 2500 },
    { scenario: 'Large striped grid', hint: 'Fifty vertical strips of different lengths; the largest is a full column joined to the top row.', argsGen: '() => [Array.from({ length: 50 }, (_, r) => Array.from({ length: 50 }, (_, c) => (c % 2 === 0 && r <= c ? 1 : 0)))]', expected: 49 },
  ],

  solution: {
    code: `function maxAreaOfIsland(grid) {
  const R = grid.length, C = grid[0].length;
  const area = (r, c) => {
    if (r < 0 || r >= R || c < 0 || c >= C || grid[r][c] !== 1) return 0;
    grid[r][c] = 0;                         // sink = visited
    return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1);
  };
  let best = 0;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (grid[r][c] === 1) best = Math.max(best, area(r, c));
  return best;
}`,
  },
  dryRun: { columns: ['start', 'cells sunk', 'best'], rows: [['(0,2)', '(0,2),(1,2),(1,1) → 3', '3'], ['(2,4)', '(2,4),(3,4),(3,3) → 3', '3'], ['(3,0)', '(3,0),(3,1) → 2', '3']] },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Every cell is sunk once; recursion depth is at most the island size.' },
  alternative: { title: 'BFS per island', md: 'Count cells as they are dequeued; identical complexity, no recursion.', complexity: 'O(m·n) time and space' },
  mistakes: [
    'Returning the number of islands instead of the largest area.',
    'Not sinking the cell before recursing → the same cell is counted twice through a neighbour.',
    'Initialising best to -1 (answer must be 0 when there is no land).',
  ],
};
