export default {
  id: 'shortest-path-in-a-grid-with-obstacles-elimination',
  title: 'Shortest Path in a Grid with Obstacles Elimination',
  difficulty: 'Hard',
  order: 4,
  pattern: 'shortest-path-state-bfs',
  tags: ['grid', 'bfs', 'state space', 'shortest path'],
  source: { platform: 'LeetCode', number: 1293, url: 'https://leetcode.com/problems/shortest-path-in-a-grid-with-obstacles-elimination/' },

  statement: `You are given an \`m × n\` grid where \`0\` is empty and \`1\` is an obstacle, and an integer \`k\`. In one step you move up, down, left or right. You may walk **through at most \`k\` obstacles** (eliminating them).

Return the **minimum number of steps** from the top-left \`(0, 0)\` to the bottom-right \`(m − 1, n − 1)\`, or \`-1\` if it is impossible. Both corners are empty.`,
  examples: [
    { input: 'grid = [[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], k = 1', output: '6', explanation: 'Without eliminations the route is 10 steps; removing the obstacle at (3,2) gives a 6-step route.' },
    { input: 'grid = [[0,1,1],[1,1,1],[1,0,0]], k = 1', output: '-1', explanation: 'Every route needs at least two eliminations.' },
  ],
  constraints: ['1 <= m, n <= 40', '1 <= k <= m · n', 'grid[0][0] == grid[m−1][n−1] == 0'],

  think: `- Is "I am at (r, c)" enough to describe your situation? What else matters for the future?
- If you reach (r, c) at step 5 with 0 eliminations left, and again at step 7 with 2 left, is the second one useless?
- Each move costs 1 — once the state is right, which algorithm finds the fewest steps?`,
  patternChallenge: {
    options: ['BFS with visited on (row, col) only', '0-1 BFS minimising obstacles', 'Dijkstra on number of obstacles removed', 'BFS over states (row, col, eliminations left)'],
    answer: 3,
    explanation: 'Steps all cost 1 → BFS. But the remaining eliminations change what you can do next, so the state must be (r, c, left). Visited on (r, c) alone wrongly prunes richer states; minimising obstacles (0-1 BFS / Dijkstra) optimises the wrong quantity — we want fewest steps subject to ≤ k obstacles.',
  },
  hints: [
    'Node = (r, c, remaining). Moving into an obstacle decreases remaining by 1; you cannot go below 0. At most m·n·(k + 1) states.',
    'Store `best[r][c]` = the most remaining eliminations with which (r, c) has been reached. A new arrival with ≤ that many is dominated (it came no earlier, with no more resource) — skip it. Also: if k ≥ m + n − 3, return m + n − 2 immediately.',
  ],
  approach: `**Brute force:** try every set of ≤ k obstacles to delete and BFS each time — combinatorial explosion.

**Optimized (state-augmented BFS):**
1. Shortcut: a Manhattan route has m + n − 2 steps and passes through at most m + n − 3 non-start cells that could be obstacles; if k ≥ m + n − 3, answer m + n − 2.
2. BFS level by level over \`[r, c, left]\`, starting \`[0, 0, k]\`.
3. For each neighbour: \`nl = left − grid[nr][nc]\`. Skip if \`nl < 0\` or \`nl <= best[nr][nc]\`. Otherwise record and enqueue.
4. Return the level when the target is dequeued; \`-1\` if the queue empties.

**Why the domination prune is safe:** BFS levels never decrease, so a later arrival has ≥ steps. With ≤ remaining eliminations it can do nothing the earlier state could not.`,

  functionName: 'shortestPath',
  paramNames: ['grid', 'k'],
  starterCode: `/**
 * @param {number[][]} grid
 * @param {number} k
 * @return {number}
 */
function shortestPath(grid, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Removing the obstacle at (3,2) shortens 10 steps to 6.', args: [[[0, 0, 0], [1, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 0]], 1], expected: 6 },
    { scenario: 'Example 2', hint: 'Every route needs at least two eliminations but k = 1: -1.', args: [[[0, 1, 1], [1, 1, 1], [1, 0, 0]], 1], expected: -1 },
    { scenario: 'Single cell', hint: 'Start is the target: 0 steps.', args: [[[0]], 1], expected: 0 },
    { scenario: 'One obstacle in a row', hint: 'Walk straight through the single obstacle.', args: [[[0, 1, 0]], 1], expected: 2 },
    { scenario: 'Never go below zero', hint: 'Two obstacles in a row but only one elimination: the remaining count must never go negative.', args: [[[0, 1, 1, 0]], 1], expected: -1 },
    { scenario: 'Exactly enough eliminations', hint: 'With k = 2 the straight-through route works in 4 steps.', args: [[[0, 1, 1], [1, 1, 1], [1, 0, 0]], 2], expected: 4 },
    { scenario: 'Plenty of eliminations', hint: 'k is at least m + n − 3: bulldoze the Manhattan route, m + n − 2 steps.', args: [[[0, 1, 1], [1, 1, 1], [1, 1, 0]], 9], expected: 4 },
    { scenario: 'No eliminations used', hint: 'Even with k available, the obstacle-free route may already be shortest.', args: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]], 1], expected: 4 },
    { scenario: 'Visited must include k left', hint: 'The state that first reaches a cell may have spent its eliminations; keying visited on (r, c) alone prunes the route that can still finish and returns -1 instead of 6.', args: [[[0, 0, 1, 1], [1, 0, 1, 0], [1, 1, 0, 0], [1, 0, 1, 0]], 1], expected: 6 },
    { scenario: 'Winding maze, k = 1', hint: 'One elimination cuts through a wall of the maze.', args: [[[0, 1, 0, 0, 0], [0, 1, 0, 1, 0], [0, 1, 0, 1, 0], [0, 0, 0, 1, 0]], 1], expected: 7 },
    { scenario: 'Winding maze, k = 0', hint: 'No eliminations: follow the full winding corridor.', args: [[[0, 1, 0, 0, 0], [0, 1, 0, 1, 0], [0, 1, 0, 1, 0], [0, 0, 0, 1, 0]], 0], expected: 13 },
    { scenario: 'Large grid, moderate k (40×40)', hint: 'States are (r, c, left): at most 40·40·(k + 1). String keys in a Set work but are slow; keep a best-left table.', argsGen: '() => { let x = 5555; const r = () => (x = (x * 48271) % 2147483647); const g = Array.from({ length: 40 }, () => Array.from({ length: 40 }, () => (r() % 100 < 35 ? 1 : 0))); g[0][0] = 0; g[39][39] = 0; return [g, 20]; }', expected: 78, timeLimitMs: 1000 },
    { scenario: 'Large grid, huge k (40×40)', hint: 'k = 1600: without the m + n − 3 shortcut the state space is 40·40·1601 — the shortcut answers instantly.', argsGen: '() => { let x = 6666; const r = () => (x = (x * 48271) % 2147483647); const g = Array.from({ length: 40 }, () => Array.from({ length: 40 }, () => (r() % 100 < 50 ? 1 : 0))); g[0][0] = 0; g[39][39] = 0; return [g, 1600]; }', expected: 78, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function shortestPath(grid, k) {
  const m = grid.length, n = grid[0].length;
  if (k >= m + n - 3) return m + n - 2;       // can bulldoze a straight route

  // best[r][c] = most eliminations left we have had at (r, c); -1 = never
  const best = Array.from({ length: m }, () => new Array(n).fill(-1));
  best[0][0] = k;
  let frontier = [[0, 0, k]];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  for (let steps = 0; frontier.length; steps++) {
    const next = [];
    for (const [r, c, left] of frontier) {
      if (r === m - 1 && c === n - 1) return steps;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
        const nl = left - grid[nr][nc];
        if (nl < 0 || nl <= best[nr][nc]) continue;   // impossible or dominated
        best[nr][nc] = nl;
        next.push([nr, nc, nl]);
      }
    }
    frontier = next;
  }
  return -1;
}`,
    explanation: 'Keeping only the best remaining count per cell is a compact version of a 3-D visited array `seen[r][c][left]` — it prunes more and uses O(m·n) memory.',
  },
  dryRun: {
    columns: ['steps', 'frontier states (r,c,left)', 'note'],
    rows: [
      ['0', '(0,0,1)', 'start'],
      ['1', '(1,0,0), (0,1,1)', '(1,0) is an obstacle → left drops to 0'],
      ['2', '(2,0,0), (1,1,0), (0,2,1)', ''],
      ['3', '(3,0,0), (2,1,0), (1,2,1)', ''],
      ['4', '(4,0,0), (2,2,1), (3,1,…)', ''],
      ['5', '(3,2,0), …', 'eliminate (3,2)'],
      ['6', '(4,2,0)', 'target → 6'],
    ],
  },
  complexity: { time: 'O(m · n · k)', space: 'O(m · n) (+ frontier up to O(m·n·k))', explanation: 'At most k + 1 improvements per cell, 4 neighbours each. The shortcut caps k at m + n − 3.' },
  alternative: {
    title: 'A* or Dijkstra over (r, c, left)',
    md: 'A* with the Manhattan distance as heuristic explores fewer states in practice. Dijkstra is unnecessary since all steps cost 1, but works.',
    complexity: 'O(m·n·k · log(m·n·k)) time',
  },
  mistakes: [
    'Visited keyed on (r, c) only — prunes the state that can actually finish.',
    'Allowing remaining to go negative.',
    'Using string keys like "r,c,k" in a Set: works but slow and memory-heavy.',
    'Forgetting the k ≥ m + n − 3 shortcut (not needed for correctness, but huge k makes the state space big).',
  ],
};
