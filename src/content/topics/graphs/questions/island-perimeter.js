export default {
  id: 'island-perimeter',
  title: 'Island Perimeter',
  difficulty: 'Easy',
  order: 4,
  pattern: 'grid-graph-traversal',
  tags: ['grid', 'counting'],
  source: { platform: 'LeetCode', number: 463, url: 'https://leetcode.com/problems/island-perimeter/' },

  statement: `You get a grid where \`1\` is land and \`0\` is water. Cells connect horizontally and vertically. The grid contains **exactly one island** (one connected group of land cells) and the island has no lakes (no water enclosed inside it). Each cell is a 1×1 square.

Return the **perimeter** of the island — the total length of its boundary.`,
  examples: [
    { input: 'grid = [[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]', output: '16' },
    { input: 'grid = [[1]]', output: '4' },
    { input: 'grid = [[1,0]]', output: '4' },
  ],
  constraints: ['1 <= rows, cols <= 100', 'grid[i][j] is 0 or 1', 'Exactly one island'],

  think: `- A single land cell has perimeter 4. What happens to the total when two land cells touch?
- Is a traversal (DFS) really required, or does each cell contribute independently?`,
  patternChallenge: {
    options: ['Prefix sums on the grid', 'Binary Search', 'Grid traversal / per-cell neighbour counting', 'Backtracking'],
    answer: 2,
    explanation: 'The perimeter is a sum of per-cell contributions: each land side that faces water or the border counts 1. You look at each cell and its 4 neighbours — the same neighbour logic as a grid traversal, but because there is one island you do not even need DFS.',
  },
  hints: [
    'For each land cell, count its 4 sides that face water or the edge of the grid.',
    'Equivalently: perimeter = 4 × (land cells) − 2 × (adjacent land pairs). Count only right and down neighbours so each pair is counted once.',
  ],
  approach: `**DFS approach:** DFS the island; every time a move steps into water or off the grid, add 1. Works, but needs a visited mark.

**Simpler counting:** every land cell contributes 4; every shared edge between two land cells removes 2 (one side from each cell). Scan the grid once: for a land cell add 4, and subtract 2 if the cell below or to the right is also land. O(R·C), no extra memory, no recursion.`,

  functionName: 'islandPerimeter',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function islandPerimeter(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'An irregular island — count every land edge that touches water or the border.', args: [[[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]], expected: 16 },
    { scenario: 'Example 2', hint: 'A single 1×1 land cell has perimeter 4; the grid border counts as perimeter.', args: [[[1]]], expected: 4 },
    { scenario: 'Example 3', hint: 'One land cell next to one water cell still has perimeter 4.', args: [[[1,0]]], expected: 4 },
    { scenario: '2×2 square', hint: 'Four cells share four edges: each shared edge removes 2 from 16, giving 8.', args: [[[1,1],[1,1]]], expected: 8 },
    { scenario: 'Horizontal bar', hint: 'Subtracting only 1 per shared edge gives 13 here instead of 10.', args: [[[1,1,1,1]]], expected: 10 },
    { scenario: 'Vertical bar', hint: 'Shared edges below a cell count too, not just to the right.', args: [[[1],[1],[1]]], expected: 8 },
    { scenario: 'Land surrounded by water', hint: 'A lone land cell in the middle of water: perimeter 4.', args: [[[0,0,0],[0,1,0],[0,0,0]]], expected: 4 },
    { scenario: 'S-shaped island', hint: 'A staircase shape: count shared edges both rightward and downward.', args: [[[1,1,0],[0,1,1]]], expected: 10 },
    { scenario: 'Ring around a lake', hint: 'The inner lake\'s edges are perimeter too — enclosed water is still water.', args: [[[1,1,1],[1,0,1],[1,1,1]]], expected: 16 },
    { scenario: 'Island at the far corner', hint: 'Land in the bottom-right corner: the border on two sides counts.', args: [[[0,0,0],[0,0,1],[0,1,1]]], expected: 8 },
    { scenario: 'Plus shape', hint: 'Check all 4 neighbours AND subtract 2 per match double-counts shared edges — this gives 4 instead of 12.', args: [[[0,1,0],[1,1,1],[0,1,0]]], expected: 12 },
    { scenario: 'Full 100×100 land', hint: 'The maximum grid, all land: only the 400 outer edges are perimeter.', argsGen: '() => [Array.from({ length: 100 }, () => new Array(100).fill(1))]', expected: 400 },
    { scenario: 'Large comb island (100×100)', hint: 'Many teeth hang off one spine row; every tooth adds two long sides.', argsGen: '() => [Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => (r === 0 || c % 2 === 0 ? 1 : 0)))]', expected: 10102 },
  ],

  solution: {
    code: `function islandPerimeter(grid) {
  const R = grid.length, C = grid[0].length;
  let perimeter = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] !== 1) continue;
      perimeter += 4;
      if (r + 1 < R && grid[r + 1][c] === 1) perimeter -= 2; // shared edge below
      if (c + 1 < C && grid[r][c + 1] === 1) perimeter -= 2; // shared edge right
    }
  }
  return perimeter;
}`,
    explanation: 'Each shared edge is seen exactly once (from its top or left cell) and removes one side from both cells.',
  },
  dryRun: { columns: ['grid', 'land cells', 'shared edges', '4·L − 2·S'], rows: [['[[1,1],[1,1]]', '4', '4', '16 − 8 = 8'], ['[[1,1,1,1]]', '4', '3', '16 − 6 = 10']] },
  complexity: { time: 'O(R·C)', space: 'O(1)', explanation: 'One pass, constant work per cell.' },
  alternative: {
    title: 'DFS counting water/border edges',
    md: 'Start DFS at any land cell; `dfs` returns 1 when it steps off the grid or into water, 0 for an already visited land cell, and otherwise the sum over its 4 neighbours. Same O(R·C) time but O(R·C) stack.',
    complexity: 'O(R·C) time and space',
  },
  mistakes: [
    'Subtracting 1 per shared edge instead of 2 (both cells lose a side).',
    'Checking all 4 neighbours AND subtracting 2 — double-counts every shared edge.',
    'Treating the grid border differently from water — both count as perimeter.',
  ],
};
