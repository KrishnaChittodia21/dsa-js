export default {
  id: 'longest-increasing-path-in-a-matrix',
  title: 'Longest Increasing Path in a Matrix',
  difficulty: 'Hard',
  order: 3,
  pattern: 'topo-dag-dp',
  tags: ['grid', 'topological sort', 'memoization', 'dag'],
  source: { platform: 'LeetCode', number: 329, url: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix/' },

  statement: `Given an \`m x n\` integer matrix, return the length (number of cells) of the longest **strictly increasing** path. From a cell you may move up, down, left or right (no diagonals, no wrapping around).`,
  examples: [
    { input: 'matrix = [[9,9,4],[6,6,8],[2,1,1]]', output: '4', explanation: '1 → 2 → 6 → 9.' },
    { input: 'matrix = [[3,4,5],[3,2,6],[2,2,1]]', output: '4', explanation: '3 → 4 → 5 → 6.' },
    { input: 'matrix = [[1]]', output: '1' },
  ],
  constraints: ['1 <= m, n <= 200', '0 <= matrix[i][j] <= 2^31 − 1'],

  think: `- Draw an arrow from each cell to every neighbour with a **larger** value. Can these arrows form a cycle?
- So what kind of graph is this, and what are you looking for in it?
- Recursive DFS with memo could go 40,000 calls deep. How could you avoid recursion?`,
  patternChallenge: {
    options: ['BFS shortest path from every cell', 'Longest path in a DAG (topological peel or memoised DFS)', 'Sliding Window on each row', 'Union-Find'],
    answer: 1,
    explanation: 'Edges go from smaller to strictly larger values, so values strictly increase along any path — a cycle is impossible. The question is the longest path in this implicit DAG, solvable with memoised DFS or by peeling in topological order. BFS from every cell would find shortest, not longest, paths.',
  },
  hints: [
    'In-degree of a cell = number of neighbours with a strictly smaller value. Cells with in-degree 0 are local minima — every longest path can start at one.',
    'Kahn layer by layer: each layer peels cells whose smaller neighbours are all gone. The number of layers equals the longest path length.',
  ],
  approach: `**Brute force:** DFS from every cell exploring every increasing path: exponential in the worst case.

**Memoised DFS:** \`best(r, c) = 1 + max(best(neighbour))\` over larger neighbours. The graph is a DAG, so no visited set is needed and each cell is computed once: O(m·n). But recursion depth can reach m·n = 40,000 on a snake-shaped matrix — risky in JavaScript.

**Topological peel (iterative):** edge from smaller to larger neighbour. Compute in-degrees (count of strictly smaller neighbours). Queue all cells with in-degree 0. Process **layer by layer**; when a cell is popped, decrement its larger neighbours. Each layer is one more step along the longest path, so the answer is the number of layers. O(m·n), no recursion.`,

  functionName: 'longestIncreasingPath',
  paramNames: ['matrix'],
  starterCode: `/**
 * @param {number[][]} matrix
 * @return {number}
 */
function longestIncreasingPath(matrix) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The path 1 → 2 → 6 → 9 moves up and around; equal 9s and 6s do not extend it.', args: [[[9, 9, 4], [6, 6, 8], [2, 1, 1]]], expected: 4 },
    { scenario: 'Example 2', hint: '3 → 4 → 5 → 6 along the top row and down.', args: [[[3, 4, 5], [3, 2, 6], [2, 2, 1]]], expected: 4 },
    { scenario: 'Example 3', hint: 'A single cell is a path of length 1.', args: [[[1]]], expected: 1 },
    { scenario: 'Single row', hint: 'Two increasing cells side by side.', args: [[[1, 2]]], expected: 2 },
    { scenario: 'All equal', hint: 'Equal neighbours are not edges — the path must be strictly increasing, so the answer is 1.', args: [[[7, 7], [7, 7]]], expected: 1 },
    { scenario: 'Snake through whole grid', hint: 'The path winds through every cell (1..9); it must turn corners.', args: [[[1, 2, 3], [6, 5, 4], [7, 8, 9]]], expected: 9 },
    { scenario: 'Single column with tie', hint: '0 → 1 → 5 then the next 5 is equal, so it stops at length 3.', args: [[[0], [1], [5], [5]]], expected: 3 },
    { scenario: 'No diagonal moves', hint: 'Values increase only along diagonals; moving diagonally is not allowed.', args: [[[1, 0, 3], [0, 2, 0], [5, 0, 4]]], expected: 2 },
    { scenario: 'Max values', hint: 'Values up to 2^31 − 1: compare numbers directly, no overflow tricks needed.', args: [[[2147483647, 2147483646], [0, 2147483645]]], expected: 4 },
    { scenario: 'Decreasing row', hint: 'The path can run right-to-left; direction does not matter.', args: [[[5, 4, 3, 2, 1]]], expected: 5 },
    { scenario: 'Diagonal ramp (100×100)', hint: 'Value r·100 + c: the longest path walks right and down for 199 cells.', argsGen: '() => [Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => r * 100 + c))]', expected: 199 },
    { scenario: 'Max snake (200×200)', hint: 'One increasing path through all 40 000 cells: a recursive memoised DFS nests 40 000 calls and can overflow the stack — Kahn\'s BFS by layers does not.', argsGen: '() => [Array.from({ length: 200 }, (_, r) => Array.from({ length: 200 }, (_, c) => r * 200 + (r % 2 ? 199 - c : c)))]', expected: 40000 },
    { scenario: 'Large random grid (200×200)', hint: 'Without memoisation, DFS from every cell re-explores the same paths exponentially often; cache each cell\'s answer.', argsGen: '() => { let s = 3; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 200 }, (_, i) => Array.from({ length: 200 }, (_, j) => (i + j) * 4 + (r() % 7)))]; }', expected: 533, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function longestIncreasingPath(matrix) {
  const R = matrix.length, C = matrix[0].length;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // in-degree = number of strictly smaller neighbours (edges go small → large)
  const indeg = new Int32Array(R * C);
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && matrix[nr][nc] < matrix[r][c]) indeg[r * C + c]++;
      }

  let layer = [];
  for (let i = 0; i < R * C; i++) if (indeg[i] === 0) layer.push(i);
  let length = 0;
  while (layer.length) {
    length++;                             // one more cell on the longest path
    const next = [];
    for (const id of layer) {
      const r = Math.floor(id / C), c = id % C;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C || matrix[nr][nc] <= matrix[r][c]) continue;
        const nid = nr * C + nc;
        if (--indeg[nid] === 0) next.push(nid);
      }
    }
    layer = next;
  }
  return length;
}`,
    explanation: 'A cell enters layer k exactly when the longest increasing path ending at it has k cells, so the number of layers is the answer.',
  },
  dryRun: { columns: ['layer', 'cells (value)', 'length'], rows: [['1', '(0,2)=4, (2,1)=1, (2,2)=1', '1'], ['2', '(2,0)=2, (1,2)=8', '2'], ['3', '(1,0)=6, (1,1)=6', '3'], ['4', '(0,0)=9, (0,1)=9', '4']] },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Each cell is peeled once and checks 4 neighbours; in-degree array and layers are O(m·n).' },
  alternative: {
    title: 'Memoised DFS',
    md: 'memo[r][c] = 1 + max over larger neighbours. Shorter to write; fine in most tests, but a 200×200 snake means 40,000 nested calls, which can overflow V8\'s stack.',
    code: `function longestIncreasingPath(matrix) {
  const R = matrix.length, C = matrix[0].length;
  const memo = Array.from({ length: R }, () => new Array(C).fill(0));
  const dfs = (r, c) => {
    if (memo[r][c]) return memo[r][c];
    let best = 1;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && matrix[nr][nc] > matrix[r][c]) best = Math.max(best, 1 + dfs(nr, nc));
    }
    return (memo[r][c] = best);
  };
  let ans = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) ans = Math.max(ans, dfs(r, c));
  return ans;
}`,
    complexity: 'O(m·n) time and space',
  },
  mistakes: [
    'Allowing equal values (the path must be strictly increasing — equal neighbours are not edges).',
    'Adding a visited set and un-marking it (unnecessary: the graph is acyclic).',
    'Running un-memoised DFS from every cell → exponential.',
  ],
};
