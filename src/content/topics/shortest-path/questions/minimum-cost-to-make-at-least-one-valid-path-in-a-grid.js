export default {
  id: 'minimum-cost-to-make-at-least-one-valid-path-in-a-grid',
  title: 'Minimum Cost to Make at Least One Valid Path in a Grid',
  difficulty: 'Hard',
  order: 2,
  pattern: 'shortest-path-0-1-bfs',
  tags: ['grid', '0-1 bfs', 'deque', 'shortest path'],
  source: { platform: 'LeetCode', number: 1368, url: 'https://leetcode.com/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid/' },

  statement: `Every cell of an \`m × n\` grid holds an arrow telling you where to go next:

- \`1\` → right, \`2\` → left, \`3\` → down, \`4\` → up.

Starting at \`(0, 0)\` you follow the arrows. Some arrows may point outside the grid. You may **change** the arrow of any cell at a cost of 1 (each cell at most once). Return the **minimum total cost** so that following the arrows from \`(0, 0)\` reaches \`(m − 1, n − 1)\`.`,
  examples: [
    { input: 'grid = [[1,1,1,1],[2,2,2,2],[1,1,1,1],[2,2,2,2]]', output: '3', explanation: 'Change three arrows to "down" at the ends of rows 0, 1 (left end) and 2.' },
    { input: 'grid = [[1,1,3],[3,2,2],[1,1,4]]', output: '0', explanation: 'The arrows already lead from start to end.' },
    { input: 'grid = [[1,2],[4,3]]', output: '1' },
  ],
  constraints: ['1 <= m, n <= 100', '1 <= grid[i][j] <= 4'],

  think: `- From a cell you can move in 4 directions. Which move is free and which costs 1?
- Is it ever useful to change the same cell twice?
- Edge weights 0 and 1 — which algorithm?`,
  patternChallenge: {
    options: ['DFS following arrows and counting dead ends', 'Dynamic programming from bottom-right to top-left', '0-1 BFS: follow the arrow for 0, any other direction for 1', 'Union-Find of arrow chains'],
    answer: 2,
    explanation: 'Model each cell with 4 outgoing edges: the arrow direction costs 0, the other three cost 1 (changing this cell\'s arrow). Minimum total cost with 0/1 weights → 0-1 BFS. DFS and Union-Find do not minimise cost; a right/down DP fails because the best path can go up or left.',
  },
  hints: [
    'Edge (r, c) → neighbour in direction d costs 0 if grid[r][c] points that way, else 1. A shortest path never visits a cell twice, so "each cell changed at most once" is automatic.',
    'Run 0-1 BFS from (0, 0): cost-0 neighbours to the front of the deque, cost-1 neighbours to the back.',
  ],
  approach: `**Brute force:** try all arrow assignments — 4^(mn).

**Graph model:** node = cell; four edges out of every cell; weight 0 for the arrow's direction, 1 otherwise. We want the cheapest path from (0, 0) to (m − 1, n − 1). A cheapest path is simple (no repeated cell), so no cell is "changed twice".

**Optimized (0-1 BFS):**
1. \`DIRS\` indexed so \`DIRS[grid[r][c] - 1]\` is the arrow: right, left, down, up.
2. \`dist\` = Infinity, \`dist[start] = 0\`; deque with start.
3. Pop front; for each of the 4 directions compute \`w = (d === arrow) ? 0 : 1\`; relax, pushFront for 0, pushBack for 1.`,

  functionName: 'minCost',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function minCost(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Change three arrows to "down" at the row ends.', args: [[[1, 1, 1, 1], [2, 2, 2, 2], [1, 1, 1, 1], [2, 2, 2, 2]]], expected: 3 },
    { scenario: 'Example 2', hint: 'The arrows already lead to the goal: cost 0.', args: [[[1, 1, 3], [3, 2, 2], [1, 1, 4]]], expected: 0 },
    { scenario: 'Example 3', hint: 'One change is enough.', args: [[[1, 2], [4, 3]]], expected: 1 },
    { scenario: 'Single cell', hint: 'Start is the goal: cost 0 regardless of the arrow.', args: [[[4]]], expected: 0 },
    { scenario: 'Single row pointing left', hint: 'Every arrow points the wrong way; fix all but the last cell.', args: [[[2, 2, 2]]], expected: 2 },
    { scenario: 'Single column', hint: 'Arrows point down until the last cell: cost 0.', args: [[[3], [3], [4]]], expected: 0 },
    { scenario: 'Arrow direction order', hint: 'Values map 1 → right, 2 → left, 3 → down, 4 → up. Swapping left and down makes this free path look costly.', args: [[[3, 2], [3, 2], [1, 1]]], expected: 0 },
    { scenario: 'Free path with a detour', hint: 'The free route wanders through the grid; 0-1 BFS follows zero-cost edges first.', args: [[[1, 1, 3], [2, 2, 3]]], expected: 0 },
    { scenario: 'All arrows up', hint: 'Every move costs 1 — the answer is the Manhattan distance.', args: [[[4, 4, 4], [4, 4, 4], [4, 4, 4]]], expected: 4 },
    { scenario: 'BFS order is not cost order', hint: 'Plain BFS fixes a cell\'s cost the first time it is reached by hop count; a longer free path can be cheaper. Use 0-1 BFS or Dijkstra.', args: [[[3, 3, 2, 4], [3, 1, 1, 3], [1, 2, 2, 4]]], expected: 1 },
    { scenario: 'Cost on the changed cell', hint: 'You pay for changing the arrow of the cell you LEAVE, not the cell you enter.', args: [[[3, 4, 3], [2, 1, 3], [4, 4, 1]]], expected: 1 },
    { scenario: 'Large random grid (100×100)', hint: 'Re-relaxing every cell until nothing changes is O((mn)²); 0-1 BFS is O(mn).', argsGen: '() => { let x = 4321; const r = () => (x = (x * 48271) % 2147483647); return [Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => 1 + r() % 4))]; }', expected: 50, timeLimitMs: 1000 },
    { scenario: 'Large all-left grid', hint: 'Every arrow points left; the answer is still found in O(mn).', argsGen: '() => [Array.from({ length: 100 }, () => new Array(100).fill(2))]', expected: 198, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minCost(grid) {
  const m = grid.length, n = grid[0].length;
  // index = arrow value - 1: right, left, down, up
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const dist = new Array(m * n).fill(Infinity);
  dist[0] = 0;
  const dq = new Deque();
  dq.pushBack(0);

  while (!dq.isEmpty()) {
    const u = dq.popFront();
    const r = Math.floor(u / n), c = u % n;
    for (let d = 0; d < 4; d++) {
      const nr = r + DIRS[d][0], nc = c + DIRS[d][1];
      if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
      const w = grid[r][c] - 1 === d ? 0 : 1;   // follow arrow = free
      const v = nr * n + nc;
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        if (w === 0) dq.pushFront(v); else dq.pushBack(v);
      }
    }
  }
  return dist[m * n - 1];
}`,
  },
  dryRun: `Example 3 (\`[[1,2],[4,3]]\`): from (0,0) the arrow points right → (0,1) at cost 0 (front). (1,0) costs 1 (back). (0,1)'s arrow points left, so going down to (1,1) costs 1 → dist 1. (1,0)'s arrow points up; going right to (1,1) also costs 1 + 1 = 2, not better. Answer **1**.`,
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: '4 edges per cell, O(1) deque operations.' },
  alternative: {
    title: 'DFS along free arrows + BFS by cost layers',
    md: 'Layer k = all cells reachable with cost k. From every cell of layer k, DFS along the arrows (cost 0) to collect the whole layer; the next layer is one changed arrow away. Same complexity, a nice way to "see" 0-1 BFS as BFS over cost levels.',
    complexity: 'O(m·n) time and space',
  },
  mistakes: [
    'Mapping arrow values to directions in the wrong order (1 right, 2 left, 3 down, 4 up).',
    'Charging the cost on the destination cell instead of the cell whose arrow you change.',
    'Using plain BFS (all weights 1) or DFS without cost ordering.',
    'Forgetting the 1×1 grid (answer 0).',
  ],
};
