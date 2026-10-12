export default {
  id: 'shortest-path-in-binary-matrix',
  title: 'Shortest Path in Binary Matrix',
  difficulty: 'Medium',
  order: 9,
  pattern: 'graph-bfs',
  tags: ['grid', 'bfs', 'shortest path'],
  source: { platform: 'LeetCode', number: 1091, url: 'https://leetcode.com/problems/shortest-path-in-binary-matrix/' },

  statement: `Given an \`n x n\` binary grid, find the length of the shortest **clear path** from the top-left cell \`(0, 0)\` to the bottom-right cell \`(n-1, n-1)\`.

- A clear path only visits cells with value \`0\`.
- You may move in **8 directions** (including diagonals).
- The **length** of a path is the number of cells it visits (so a 1×1 grid of \`0\` has length 1).

Return \`-1\` if there is no clear path.`,
  examples: [
    { input: 'grid = [[0,1],[1,0]]', output: '2', explanation: 'Go diagonally.' },
    { input: 'grid = [[0,0,0],[1,1,0],[1,1,0]]', output: '4' },
    { input: 'grid = [[1,0,0],[1,1,0],[1,1,0]]', output: '-1', explanation: 'The start cell is blocked.' },
  ],
  constraints: ['1 <= n <= 100', 'grid[i][j] is 0 or 1'],

  think: `- Every move costs the same. Which traversal gives the fewest moves?
- The answer counts **cells**, not moves. Where does the +1 go?
- What if the start or the end cell is 1?`,
  patternChallenge: {
    options: ['DFS with backtracking', 'BFS on the grid (8 directions)', 'Dynamic Programming moving only right/down', 'Dijkstra with a heap'],
    answer: 1,
    explanation: 'Unweighted moves + "shortest" = BFS. DP right/down fails because the shortest path may need to go up or left around walls; Dijkstra works but a heap is unnecessary when every step costs 1.',
  },
  hints: [
    'Check `grid[0][0]` and `grid[n-1][n-1]` first. Start BFS at (0,0) with distance 1.',
    'Use 8 direction pairs. Mark a cell (e.g. set it to 1) when you enqueue it. Return the distance when you pop the target.',
  ],
  approach: `**Brute force:** DFS over all paths with backtracking — exponential.

**BFS:** vertices are clear cells, edges join 8-adjacent clear cells. BFS from (0,0) with \`dist = 1\`. The first time the target is dequeued, its distance is the shortest path length (layers argument). Mark cells visited on enqueue by writing 1 into the grid. O(n²).`,

  functionName: 'shortestPathBinaryMatrix',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function shortestPathBinaryMatrix(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Go diagonally: the path visits 2 cells.', args: [[[0, 1], [1, 0]]], expected: 2 },
    { scenario: 'Example 2', hint: 'Right, right-down diagonal, down: 4 cells.', args: [[[0, 0, 0], [1, 1, 0], [1, 1, 0]]], expected: 4 },
    { scenario: 'Example 3', hint: 'The start cell is blocked: -1.', args: [[[1, 0, 0], [1, 1, 0], [1, 1, 0]]], expected: -1 },
    { scenario: 'Single clear cell', hint: 'A 1×1 grid of 0: the path visits 1 cell (length counts cells, not moves).', args: [[[0]]], expected: 1 },
    { scenario: 'Single blocked cell', hint: 'A 1×1 grid of 1: no clear path.', args: [[[1]]], expected: -1 },
    { scenario: 'End cell blocked', hint: 'The target itself is 1 — check it before searching.', args: [[[0, 0], [0, 1]]], expected: -1 },
    { scenario: 'Diagonal moves required', hint: 'Only diagonal steps connect the clear cells; 4-directional BFS returns -1.', args: [[[0, 1, 1], [1, 0, 1], [1, 1, 0]]], expected: 3 },
    { scenario: 'Count cells, not moves', hint: 'A straight 3×3 diagonal visits 3 cells (2 moves).', args: [[[0, 0, 0], [0, 0, 0], [0, 0, 0]]], expected: 3 },
    { scenario: 'Fully walled off', hint: 'A wall of 1s separates start from end: -1.', args: [[[0, 0, 1], [1, 1, 1], [1, 0, 0]]], expected: -1 },
    { scenario: 'Winding corridor', hint: 'The clear path snakes through the grid.', args: [[[0, 1, 1, 0, 0], [0, 1, 0, 1, 0], [0, 1, 0, 1, 0], [0, 0, 1, 1, 0], [1, 1, 1, 1, 0]]], expected: 11 },
    { scenario: 'Large open grid (100×100)', hint: 'All clear: the diagonal gives 100 cells. BFS marks cells on enqueue and runs in O(n²).', argsGen: '() => [Array.from({ length: 100 }, () => new Array(100).fill(0))]', expected: 100, timeLimitMs: 1000 },
    { scenario: 'Large snake (100×100)', hint: 'A long zig-zag corridor of ~5000 cells; DFS-style search explores far too much, BFS stays O(n²).', argsGen: '() => { const n = 100, g = Array.from({ length: n }, (_, r) => new Array(n).fill(r % 2)); for (let r = 1; r < n; r += 2) g[r][(r >> 1) % 2 === 0 ? n - 1 : 0] = 0; g[n - 1][n - 1] = 0; for (let c = 0; c < n; c++) if ((n - 1) % 2 === 1) g[n - 1][c] = 0; return [g]; }', expected: 4854, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function shortestPathBinaryMatrix(grid) {
  const n = grid.length;
  if (grid[0][0] !== 0 || grid[n - 1][n - 1] !== 0) return -1;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const queue = [[0, 0, 1]];              // [row, col, cells on the path so far]
  grid[0][0] = 1;                         // visited
  for (let head = 0; head < queue.length; head++) {
    const [r, c, d] = queue[head];
    if (r === n - 1 && c === n - 1) return d;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n || grid[nr][nc] !== 0) continue;
      grid[nr][nc] = 1;
      queue.push([nr, nc, d + 1]);
    }
  }
  return -1;
}`,
  },
  dryRun: { columns: ['pop', 'd', 'enqueued'], rows: [['(0,0)', '1', '(0,1)'], ['(0,1)', '2', '(0,2), (1,2)'], ['(0,2)', '3', '—'], ['(1,2)', '3', '(2,2)'], ['(2,2)', '4', 'target → return 4']] },
  complexity: { time: 'O(n²)', space: 'O(n²)', explanation: 'Each cell is enqueued at most once and checks 8 neighbours.' },
  alternative: { title: 'A* search', md: 'Use a priority queue ordered by d + max(|dr|, |dc|) to the target (Chebyshev distance, admissible for 8-way moves). Explores fewer cells in open grids; same worst case.', complexity: 'O(n² log n) time' },
  mistakes: [
    'Forgetting the diagonal directions.',
    'Returning the number of moves (cells − 1).',
    'Not checking that the start or end cell is blocked.',
  ],
};
