export default {
  id: '01-matrix',
  title: '01 Matrix',
  difficulty: 'Medium',
  order: 6,
  pattern: 'multi-source-bfs',
  tags: ['grid', 'bfs', 'multi-source bfs'],
  source: { platform: 'LeetCode', number: 542, url: 'https://leetcode.com/problems/01-matrix/' },

  statement: `Given an \`m x n\` binary matrix \`mat\`, return a matrix of the same size where each cell holds the distance to the **nearest 0**. The distance between two 4-adjacent cells is 1. There is at least one 0.`,
  examples: [
    { input: 'mat = [[0,0,0],[0,1,0],[0,0,0]]', output: '[[0,0,0],[0,1,0],[0,0,0]]' },
    { input: 'mat = [[0,0,0],[0,1,0],[1,1,1]]', output: '[[0,0,0],[0,1,0],[1,2,1]]' },
  ],
  constraints: ['1 <= m, n, m·n <= 10^4', 'mat[i][j] is 0 or 1', 'At least one 0'],

  think: `- One BFS from each 1 finds its nearest 0, but costs O(m·n) each. Can you reverse the direction of the search?
- What is at distance 0? Distance 1?`,
  patternChallenge: {
    options: ['Multi-source BFS from all 0s', 'BFS from every 1 separately', 'Binary Search on distance', 'Union-Find'],
    answer: 0,
    explanation: '"Distance to the nearest X, for every cell" is multi-source BFS: seed all 0s at distance 0. BFS per 1 is correct but O((m·n)²).',
  },
  hints: [
    'Initialise dist to 0 for every 0 cell (and enqueue it) and to -1 for every 1 cell.',
    'Run one BFS; a cell with dist -1 gets `dist[parent] + 1` the first time it is reached.',
  ],
  approach: `**Brute force:** BFS from every 1 until it finds a 0 → O((m·n)²).

**Multi-source BFS:** all 0s are sources at distance 0. The BFS ripples outward from every 0 at once; the first ripple to reach a 1 comes from its nearest 0, so its distance is final. O(m·n).

**DP alternative:** two passes (top-left → bottom-right, then bottom-right → top-left) taking \`min(neighbour + 1)\`; also O(m·n).`,

  functionName: 'updateMatrix',
  paramNames: ['mat'],
  starterCode: `/**
 * @param {number[][]} mat
 * @return {number[][]}
 */
function updateMatrix(mat) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Only the centre cell is 1 and it touches a 0 — the basic case from the statement.', args: [[[0,0,0],[0,1,0],[0,0,0]]], expected: [[0,0,0],[0,1,0],[0,0,0]] },
    { scenario: 'Example 2', hint: 'The middle cell of the bottom row is 2 steps from the nearest 0 — distances must grow layer by layer.', args: [[[0,0,0],[0,1,0],[1,1,1]]], expected: [[0,0,0],[0,1,0],[1,2,1]] },
    { scenario: 'Single zero cell', hint: 'The smallest grid: a lone 0 has distance 0.', args: [[[0]]], expected: [[0]] },
    { scenario: 'Two cells, one row', hint: 'A 1×2 grid: the 1 is adjacent to the only 0.', args: [[[1,0]]], expected: [[1,0]] },
    { scenario: 'All zeros', hint: 'Every cell is a 0, so the output equals the input.', args: [[[0,0],[0,0],[0,0]]], expected: [[0,0],[0,0],[0,0]] },
    { scenario: 'Single row, zero at start', hint: 'Distances increase 1, 2, 3 along a 1-row grid — check horizontal bounds.', args: [[[0,1,1,1,1]]], expected: [[0,1,2,3,4]] },
    { scenario: 'Single column, zero at end', hint: 'A 1-column grid: distances count up from the bottom.', args: [[[1],[1],[1],[0]]], expected: [[3],[2],[1],[0]] },
    { scenario: 'Zero in the centre only', hint: 'Corners are 2 away (Manhattan), not 1 — diagonal moves are not allowed.', args: [[[1,1,1],[1,0,1],[1,1,1]]], expected: [[2,1,2],[1,0,1],[2,1,2]] },
    { scenario: 'Zeros at opposite corners', hint: 'Each 1 must take the minimum over all zeros; a multi-source BFS seeds every 0 at once.', args: [[[1,1,0],[1,1,1],[0,1,1]]], expected: [[2,1,0],[1,2,1],[0,1,2]] },
    { scenario: 'Unvisited vs distance 0', hint: 'If 1-cells are initialised to 0 you cannot tell "unvisited" from "is a zero" — use -1/Infinity as the unvisited marker.', args: [[[1,1,1,1],[1,1,1,1],[1,1,1,0]]], expected: [[5,4,3,2],[4,3,2,1],[3,2,1,0]] },
    { scenario: 'Long single row', hint: 'A 1-row grid with the 0 at the far end — distances count down to it.', args: [[[1,1,1,1,1,1,0]]], expected: [[6,5,4,3,2,1,0]] },
    { scenario: 'Zero wall in the middle', hint: 'A full column of zeros splits the grid; both sides measure distance to it.', args: [[[1,1,0,1,1],[1,1,0,1,1]]], expected: [[2,1,0,1,2],[2,1,0,1,2]] },
    { scenario: 'Large grid, one zero (100×100)', hint: 'BFS from every 1 is O((m·n)²) — too slow here. Start one BFS from all zeros at once.', argsGen: '() => { const m = Array.from({ length: 100 }, () => new Array(100).fill(1)); m[0][0] = 0; return [m]; }', expectedGen: "() => Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => r + c))", timeLimitMs: 1000 },
  ],

  solution: {
    code: `function updateMatrix(mat) {
  const R = mat.length, C = mat[0].length;
  const dist = Array.from({ length: R }, () => new Array(C).fill(-1));
  const queue = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (mat[r][c] === 0) { dist[r][c] = 0; queue.push([r, c]); }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1;
      queue.push([nr, nc]);
    }
  }
  return dist;
}`,
  },
  dryRun: { columns: ['layer', 'cells finalised'], rows: [['0', 'all 0 cells'], ['1', '1-cells touching a 0: (1,1), (2,0), (2,2)'], ['2', '(2,1)']] },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Each cell is enqueued once; the dist matrix and queue are O(m·n).' },
  alternative: {
    title: 'Two-pass DP',
    md: 'Pass 1 (top-left to bottom-right): dist = min(dist, up + 1, left + 1). Pass 2 (bottom-right to top-left): dist = min(dist, down + 1, right + 1). Every shortest path to a 0 is monotone in one of the combined directions, so two passes suffice.',
    complexity: 'O(m·n) time, O(1) extra space if done in place',
  },
  mistakes: [
    'BFS from each 1 → O((m·n)²), times out at 10^4 cells.',
    'Initialising 1-cells with 0 and then not being able to tell visited from unvisited.',
    'Mutating mat while also reading it as the "is it a 0" source.',
  ],
};
