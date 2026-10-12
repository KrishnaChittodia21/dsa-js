export default {
  id: 'number-of-islands',
  title: 'Number of Islands',
  difficulty: 'Medium',
  order: 1,
  pattern: 'grid-graph-traversal',
  tags: ['grid', 'dfs', 'bfs', 'connected components'],
  source: { platform: 'LeetCode', number: 200, url: 'https://leetcode.com/problems/number-of-islands/' },

  statement: `You are given an \`m x n\` grid of **strings**: \`'1'\` is land and \`'0'\` is water.

An **island** is a group of land cells connected horizontally or vertically (not diagonally). Everything outside the grid is water. Return the number of islands.`,
  examples: [
    { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' },
    { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' },
  ],
  constraints: ['1 <= m, n <= 300', "grid[i][j] is '0' or '1'"],

  think: `- In graph words, what is an island?
- When you find a land cell during a scan, how do you make sure the rest of its island is not counted again?
- What is the deepest recursion possible for a 300 × 300 grid of all land?`,
  patternChallenge: {
    options: ['Dynamic Programming', 'Sliding Window over rows', 'Monotonic Stack', 'Grid DFS/BFS — count connected components'],
    answer: 3,
    explanation: 'Islands are connected components of land cells in an implicit grid graph. Counting components = counting how many traversals you launch from unvisited land. DP would need the answer of a cell to depend on smaller sub-answers, which it does not.',
  },
  hints: [
    'Scan every cell. When you see unvisited land, add 1 to the count and then visit its whole island.',
    'Visiting can "sink" the land by setting it to `\'0\'` — that is your visited mark. Use an explicit stack or BFS to avoid deep recursion.',
  ],
  approach: `**Model:** land cells are vertices, 4-adjacent land cells are edges. An island is a connected component.

**Algorithm:** for each cell, if it is \`'1'\`, increment the answer and flood its island (DFS/BFS), turning every reached land cell into \`'0'\`. Each cell is flooded at most once → O(m·n).

**Stack depth:** a 300×300 grid of land makes recursive DFS up to 90,000 frames deep, which can overflow V8's stack. An explicit stack (shown) or BFS is safer.`,

  functionName: 'numIslands',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {character[][]} grid
 * @return {number}
 */
function numIslands(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'One large island with an inlet of water — the basic case from the statement.', args: [[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]], expected: 1 },
    { scenario: 'Example 2', hint: 'Three separate islands; each must be flooded completely before counting the next one.', args: [[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]], expected: 3 },
    { scenario: 'Single water cell', hint: 'The smallest grid with no land must return 0.', args: [[["0"]]], expected: 0 },
    { scenario: 'Single land cell', hint: 'A 1×1 grid of land is exactly one island.', args: [[["1"]]], expected: 1 },
    { scenario: 'All water', hint: 'No land anywhere — the answer is 0, not 1.', args: [[["0","0","0"],["0","0","0"],["0","0","0"]]], expected: 0 },
    { scenario: 'Single row, alternating', hint: 'A 1-row grid: check your bounds when rows = 1; water cells separate the islands.', args: [[["1","0","1","0","1"]]], expected: 3 },
    { scenario: 'Single column', hint: 'A 1-column grid: moving left/right must stay in bounds.', args: [[["1"],["1"],["0"],["1"]]], expected: 2 },
    { scenario: 'Diagonal cells only', hint: 'Diagonal neighbours are NOT connected — a checkerboard has one island per land cell.', args: [[["1","0","1"],["0","1","0"],["1","0","1"]]], expected: 5 },
    { scenario: 'Count components, not cells', hint: 'If you count land cells instead of flooding whole islands, you get 7 here instead of 1.', args: [[["1","1","1"],["0","1","0"],["1","1","1"]]], expected: 1 },
    { scenario: 'Island wrapping around a lake', hint: 'A ring of land enclosing water is still one island; the inner water must not split it.', args: [[["1","1","1","1","1"],["1","0","0","0","1"],["1","0","1","0","1"],["1","0","0","0","1"],["1","1","1","1","1"]]], expected: 2 },
    { scenario: 'Snake-shaped island', hint: 'A long winding path must be followed through every turn (up and left moves too).', args: [[["1","1","1","1","1"],["0","0","0","0","1"],["1","1","1","1","1"],["1","0","0","0","0"],["1","1","1","1","1"]]], expected: 1 },
    { scenario: 'Numbers vs strings', hint: 'Cells are the strings \'1\'/\'0\'. Comparing with the number 1 using === finds no land.', args: [[["0","1"],["1","0"]]], expected: 2 },
    { scenario: 'Large all-land grid (300×300)', hint: 'One 90,000-cell island: recursive DFS can overflow the call stack — use an explicit stack/queue.', argsGen: '() => [Array.from({ length: 300 }, () => new Array(300).fill(\'1\'))]', expected: 1, timeLimitMs: 1000 },
    { scenario: 'Large checkerboard (300×300)', hint: '45,000 one-cell islands: each cell must be visited O(1) times — rescanning the grid per island is far too slow.', argsGen: '() => [Array.from({ length: 300 }, (_, r) => Array.from({ length: 300 }, (_, c) => ((r + c) % 2 ? \'0\' : \'1\')))]', expected: 45000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function numIslands(grid) {
  const R = grid.length, C = grid[0].length;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let islands = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] !== '1') continue;
      islands++;
      grid[r][c] = '0';                   // sink on push
      const stack = [[r, c]];
      while (stack.length) {
        const [cr, cc] = stack.pop();
        for (const [dr, dc] of DIRS) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C || grid[nr][nc] !== '1') continue;
          grid[nr][nc] = '0';
          stack.push([nr, nc]);
        }
      }
    }
  }
  return islands;
}`,
    explanation: 'The last test is a 300×300 block of land — this iterative version handles it without stack overflow.',
  },
  dryRun: { columns: ['scan cell', 'value', 'action', 'islands'], rows: [['(0,0)', "'1'", 'count + sink the 2×2 block', '1'], ['(0,1)…(1,1)', "'0' now", 'skip', '1'], ['(2,2)', "'1'", 'count + sink it', '2'], ['(3,3)', "'1'", 'count + sink (3,3),(3,4)', '3']] },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Each cell is pushed at most once and examines 4 neighbours. The stack can hold O(m·n) cells in the worst case.' },
  alternative: {
    title: 'Union-Find',
    md: 'Union every land cell with its right and down land neighbours, then count distinct roots among land cells. Useful when land is added over time (Number of Islands II).',
    complexity: 'O(m·n·α) time, O(m·n) space',
  },
  mistakes: [
    "Comparing with the number 1 instead of the string '1'.",
    'Counting land cells instead of components (forgetting to flood the island).',
    'Recursive DFS on a 300×300 grid → stack overflow.',
    'Treating diagonal neighbours as connected.',
  ],
};
