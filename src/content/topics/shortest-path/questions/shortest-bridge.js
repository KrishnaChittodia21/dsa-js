export default {
  id: 'shortest-bridge',
  title: 'Shortest Bridge',
  difficulty: 'Medium',
  order: 2,
  pattern: 'shortest-path-unweighted-bfs',
  tags: ['grid', 'bfs', 'dfs', 'multi-source bfs'],
  source: { platform: 'LeetCode', number: 934, url: 'https://leetcode.com/problems/shortest-bridge/' },

  statement: `You are given an \`n × n\` binary grid where \`1\` is land and \`0\` is water. There are **exactly two islands** (an island is a group of land cells connected up/down/left/right).

You may turn water cells into land. Return the **smallest number of water cells** you must flip to connect the two islands into one.`,
  examples: [
    { input: 'grid = [[0,1],[1,0]]', output: '1' },
    { input: 'grid = [[0,1,0],[0,0,0],[0,0,1]]', output: '2' },
    { input: 'grid = [[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]]', output: '1' },
  ],
  constraints: ['2 <= n <= 100', 'grid[i][j] is 0 or 1', 'There are exactly two islands'],

  think: `- If you BFS from **one cell** of island A, is the distance to island B the answer? Why not?
- What if every cell of island A starts in the BFS queue at distance 0?
- How do you find all cells of island A first?`,
  patternChallenge: {
    options: ['Dijkstra from every land cell', 'Union-Find over land cells', 'DFS to mark island A, then multi-source BFS outward until island B', 'Dynamic programming over rows'],
    answer: 2,
    explanation: 'The distance between two *sets* of cells is a multi-source BFS: all of island A at distance 0, expand in rings until a ring touches island B. Dijkstra from every cell is overkill (equal weights, many sources); Union-Find tells you the islands but not the distance; row DP cannot handle arbitrary shapes.',
  },
  hints: [
    'Find any land cell and flood-fill (DFS) its island, marking cells as 2 and adding each to the BFS frontier.',
    'BFS level by level through water. The first time a neighbour is a 1 (the other island), the current level count is the number of flipped cells.',
  ],
  approach: `**Brute force:** for every cell of island A and every cell of island B compute the Manhattan distance − 1 and take the minimum. That is actually correct here (water is free to cross) but O(|A|·|B|) — up to ~2.5·10^7 for n = 100. The BFS version is O(n²) and generalises to grids with obstacles.

**Optimized (DFS + multi-source BFS):**
1. Find the first land cell; DFS its island, marking each cell 2 and pushing it into \`frontier\`.
2. \`flips = 0\`. While the frontier is non-empty: for each cell, look at its 4 neighbours. If a neighbour is 1 → return \`flips\`. If it is 0 → mark 2 and add to next frontier. After each level, \`flips++\`.`,

  functionName: 'shortestBridge',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function shortestBridge(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The islands touch diagonally: one flip connects them.', args: [[[0, 1], [1, 0]]], expected: 1 },
    { scenario: 'Example 2', hint: 'Two water cells separate the islands.', args: [[[0, 1, 0], [0, 0, 0], [0, 0, 1]]], expected: 2 },
    { scenario: 'Example 3', hint: 'An island inside a ring: one flip.', args: [[[1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [1, 0, 1, 0, 1], [1, 0, 0, 0, 1], [1, 1, 1, 1, 1]]], expected: 1 },
    { scenario: 'Smallest grid (2×2)', hint: 'Two single-cell islands in a 2×2 grid, diagonal.', args: [[[1, 0], [0, 1]]], expected: 1 },
    { scenario: 'One cell gap in a row', hint: 'One water cell between them: the BFS level count is already the answer — do not add 1.', args: [[[1, 0, 1], [0, 0, 0], [0, 0, 0]]], expected: 1 },
    { scenario: 'Opposite corners', hint: 'Single cells at opposite corners of a 4×4 grid: Manhattan distance 6, so 5 flips.', args: [[[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 1]]], expected: 5 },
    { scenario: 'Start BFS from every cell', hint: 'Island A\'s first cell (0,0) is far from B, but its cell (1,3) is only 2 flips away. Seeding BFS from one cell only overestimates.', args: [[[1, 0, 0, 0, 0], [1, 1, 1, 1, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 1], [0, 0, 0, 0, 1]]], expected: 2 },
    { scenario: 'L-shaped islands', hint: 'Irregular shapes: the closest pair of cells decides.', args: [[[1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 1]]], expected: 3 },
    { scenario: 'Islands in the same row', hint: 'A single water cell between two horizontal bars.', args: [[[0, 0, 0, 0, 0], [1, 1, 0, 1, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]], expected: 1 },
    { scenario: 'Second island found first?', hint: 'Mark only the FIRST island found; scanning on would also mark island B and the BFS would never meet it.', args: [[[0, 0, 1], [0, 0, 0], [1, 1, 0]]], expected: 2 },
    { scenario: 'Diagonal single cells far', hint: 'Diagonal neighbours do not count as connected; three flips are needed here.', args: [[[1, 0, 0], [0, 0, 0], [0, 0, 1]]], expected: 3 },
    { scenario: 'Large comb islands (100×100)', hint: 'Two huge comb-shaped islands nearly touch at one spike. Seed the BFS with ALL cells of the first island: O(n²). Use an explicit stack — recursive DFS can overflow.', argsGen: '() => { const n = 100, g = Array.from({ length: n }, () => new Array(n).fill(0)); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (r < 40 && (c % 4 !== 3 || r === 0)) g[r][c] = 1; if (r > 60 && (c % 4 !== 1 || r === n - 1)) g[r][c] = 1; } g[40][50] = 1; g[41][50] = 1; return [g]; }', expected: 19, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function shortestBridge(grid) {
  const n = grid.length;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let frontier = [];

  // 1. mark the first island with 2 and collect its cells (iterative DFS)
  outer:
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 1) continue;
      const stack = [[r, c]];
      grid[r][c] = 2;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        frontier.push([cr, cc]);
        for (const [dr, dc] of DIRS) {
          const nr = cr + dr, nc = cc + dc;
          if (nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] === 1) {
            grid[nr][nc] = 2;
            stack.push([nr, nc]);
          }
        }
      }
      break outer;
    }
  }

  // 2. multi-source BFS through water
  for (let flips = 0; frontier.length; flips++) {
    const next = [];
    for (const [r, c] of frontier) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        if (grid[nr][nc] === 1) return flips;     // reached the other island
        if (grid[nr][nc] === 0) {
          grid[nr][nc] = 2;
          next.push([nr, nc]);
        }
      }
    }
    frontier = next;
  }
  return -1;
}`,
    explanation: 'An explicit stack avoids recursion depth issues on a 100×100 island (10^4 cells). Marking with 2 serves as the visited set for both phases.',
  },
  dryRun: {
    columns: ['phase', 'frontier', 'flips', 'event'],
    rows: [
      ['DFS', '(0,1)', '—', 'island A = {(0,1)}'],
      ['BFS level 0', '(0,1)', '0', 'neighbours (1,1), (0,0), (0,2) are water → mark'],
      ['BFS level 1', '(1,1), (0,0), (0,2)', '1', '(1,1) → (2,1) water, (1,2) water … mark'],
      ['BFS level 2', '(2,1), (1,2), (1,0), …', '2', '(1,2) → (2,2) is land → return 2'],
    ],
  },
  complexity: { time: 'O(n²)', space: 'O(n²)', explanation: 'Every cell is marked at most once in the DFS or BFS.' },
  alternative: {
    title: 'Pairwise Manhattan distance',
    md: 'Collect cells of both islands; answer = min over pairs of |r1 − r2| + |c1 − c2| − 1. Correct because water can always be flipped, but O(|A|·|B|).',
    complexity: 'O(n⁴) worst case time, O(n²) space',
  },
  mistakes: [
    'BFS from a single cell of island A instead of all of them.',
    'Returning flips + 1 (the level count already equals the number of water cells crossed).',
    'Recursive DFS overflowing the stack on huge islands.',
    'Forgetting to stop scanning after the first island is marked (you would also mark island B).',
  ],
};
