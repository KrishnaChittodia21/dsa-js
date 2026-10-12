export default {
  id: 'minimum-obstacle-removal-to-reach-corner',
  title: 'Minimum Obstacle Removal to Reach Corner',
  difficulty: 'Hard',
  order: 1,
  pattern: 'shortest-path-0-1-bfs',
  tags: ['grid', '0-1 bfs', 'deque', 'shortest path'],
  source: { platform: 'LeetCode', number: 2290, url: 'https://leetcode.com/problems/minimum-obstacle-removal-to-reach-corner/' },

  statement: `You are given an \`m × n\` grid where \`0\` is an empty cell and \`1\` is an obstacle that you may remove. You can move up, down, left or right between cells.

Return the **minimum number of obstacles** you must remove to travel from the top-left corner \`(0, 0)\` to the bottom-right corner \`(m − 1, n − 1)\`. Both corners are empty.`,
  examples: [
    { input: 'grid = [[0,1,1],[1,1,0],[1,1,0]]', output: '2', explanation: 'For example remove (0,1) and (0,2), then walk down the right column.' },
    { input: 'grid = [[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0]]', output: '0', explanation: 'A route exists that avoids all obstacles.' },
  ],
  constraints: ['1 <= m, n <= 10^5', '2 <= m · n <= 10^5', 'grid[i][j] is 0 or 1', 'grid[0][0] == grid[m−1][n−1] == 0'],

  think: `- Turn it into a graph: what does it **cost** to step into an empty cell? Into an obstacle?
- With only costs 0 and 1, do you really need a heap?
- Where in a deque does a neighbour reached by a free step belong?`,
  patternChallenge: {
    options: ['Plain BFS minimising steps', '0-1 BFS with a deque', 'Floyd-Warshall', 'Greedy: always move toward the corner'],
    answer: 1,
    explanation: 'Entering a cell costs grid[r][c] — 0 or 1. That is exactly 0-1 BFS: free moves to the front, paid moves to the back, O(m·n). Plain BFS minimises steps, not removals; Floyd-Warshall is O((mn)³); greedy direction choice can walk straight into walls a detour would avoid.',
  },
  hints: [
    'The edge (r, c) → (nr, nc) has weight grid[nr][nc]. You want the cheapest path — Dijkstra would work.',
    'Since weights are only 0/1, use a Deque: if the step is free `pushFront`, otherwise `pushBack`. Relax only on a strictly smaller distance.',
  ],
  approach: `**Brute force:** try every subset of obstacles to remove and BFS — exponential.

**Dijkstra:** cost of entering a cell = its value; O(mn log mn). Correct.

**Optimized (0-1 BFS):**
1. \`dist\` flat array of size m·n (index \`r * n + c\`), all Infinity; \`dist[0] = 0\`.
2. Deque with the start. Pop front; for each neighbour, \`nd = dist[u] + grid[nr][nc]\`. If \`nd < dist[v]\`, update and push to front (weight 0) or back (weight 1).
3. Answer \`dist[m·n − 1]\`.`,

  functionName: 'minimumObstacles',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function minimumObstacles(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two obstacles must go, e.g. (0,1) and (0,2), then the right column is free.', args: [[[0,1,1],[1,1,0],[1,1,0]]], expected: 2 },
    { scenario: 'Example 2', hint: 'A winding obstacle-free route exists, so the answer is 0 even though it is long.', args: [[[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0]]], expected: 0 },
    { scenario: 'Two free cells', hint: 'Smallest grid (m·n = 2): start and end are adjacent and free.', args: [[[0,0]]], expected: 0 },
    { scenario: 'Single row wall', hint: 'The only route goes through the middle obstacle — remove 1.', args: [[[0,1,0]]], expected: 1 },
    { scenario: 'Single column of obstacles', hint: 'A 4×1 grid: both middle cells must be removed.', args: [[[0],[1],[1],[0]]], expected: 2 },
    { scenario: 'Everything blocked inside', hint: 'Every route is the shortest-length route m + n − 3 = 4 obstacles; nothing cheaper exists.', args: [[[0,1,1,1],[1,1,1,1],[1,1,1,0]]], expected: 4 },
    { scenario: 'Long free path vs short wall', hint: 'Plain BFS minimises STEPS, not removals. The free detour is longer but costs 0.', args: [[[0,1,0,0],[0,1,0,1],[0,1,0,1],[0,0,0,0]]], expected: 0 },
    { scenario: 'No obstacles at all', hint: 'An all-zero grid needs 0 removals — make sure free moves cost nothing.', args: [[[0,0,0],[0,0,0],[0,0,0]]], expected: 0 },
    { scenario: 'Free moves pushed to the back', hint: 'In 0-1 BFS a weight-0 move must go to the FRONT of the deque. Pushing it to the back (a plain FIFO queue with visited-on-push) finalises cells with too high a cost: you get 2 instead of 1.', args: [[[0,0,1,1],[0,1,0,0],[0,1,1,0]]], expected: 1 },
    { scenario: 'Mixed walls', hint: 'Walls of different thickness: the best route removes 3 obstacles.', args: [[[0,1,1,0,0],[0,1,1,0,1],[0,1,1,1,0]]], expected: 3 },
    { scenario: 'Alternating row (n = 10^5)', hint: 'A 1×100000 grid of alternating 0/1: 49999 removals. 0-1 BFS is O(m·n). Use a real deque (toolkit `Deque`) — `array.unshift()` as pushFront is O(n) per call.', argsGen: '() => [[Array.from({ length: 100000 }, (_, i) => i % 2)]]', expected: 50000, timeLimitMs: 1000 },
    { scenario: 'Random grid (316×316)', hint: 'm·n ≈ 10^5 with 40% obstacles. 0-1 BFS (or Dijkstra) handles it; `unshift`-based deques and exhaustive searches do not.', argsGen: '() => { let s = 12345; const rnd = (m) => (s = (s * 48271) % 2147483647) % m; const g = Array.from({ length: 316 }, () => Array.from({ length: 316 }, () => (rnd(100) < 40 ? 1 : 0))); g[0][0] = 0; g[315][315] = 0; return [g]; }', expected: 3, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minimumObstacles(grid) {
  const m = grid.length, n = grid[0].length;
  const dist = new Array(m * n).fill(Infinity);
  dist[0] = 0;
  const dq = new Deque();
  dq.pushBack(0);                              // cells encoded as r * n + c
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (!dq.isEmpty()) {
    const u = dq.popFront();
    const r = Math.floor(u / n), c = u % n;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
      const w = grid[nr][nc];                  // 0 = free, 1 = remove obstacle
      const v = nr * n + nc;
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        if (w === 0) dq.pushFront(v); else dq.pushBack(v);
      }
    }
  }
  return dist[m * n - 1];
}`,
    explanation: 'The toolkit `Deque` gives O(1) pushFront/pushBack. Encoding cells as integers keeps the deque light.',
  },
  dryRun: {
    columns: ['pop', 'dist', 'neighbours', 'deque after'],
    rows: [
      ['(0,0)', '0', '(1,0): 1 → back, (0,1): 1 → back', '[(1,0), (0,1)]'],
      ['(1,0)', '1', '(2,0): 2, (1,1): 2 → back', '[(0,1), (2,0), (1,1)]'],
      ['(0,1)', '1', '(0,2): 2 → back, (1,1) already 2', '[(2,0), (1,1), (0,2)]'],
      ['…', '', '(0,2) → (1,2) is free: dist 2 → FRONT', '(1,2) then (2,2) popped with dist 2'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Each cell is improved at most a couple of times and each deque operation is O(1).' },
  alternative: {
    title: 'Dijkstra with a MinHeap',
    md: 'Identical relaxation with a heap of `[dist, cell]` and the stale check. Easier to remember, an extra log factor.',
    complexity: 'O(m·n · log(m·n)) time, O(m·n) space',
  },
  mistakes: [
    'Minimising steps with plain BFS instead of removals.',
    'Marking cells visited on first sight — a later free path may reach them cheaper.',
    'Pushing free moves to the back of the deque.',
    'Using `array.unshift()` as pushFront (O(n) each).',
  ],
};
