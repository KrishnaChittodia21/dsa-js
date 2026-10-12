export default {
  id: 'swim-in-rising-water',
  title: 'Swim in Rising Water',
  difficulty: 'Hard',
  order: 3,
  pattern: 'shortest-path-minimax',
  tags: ['grid', 'heap', 'minimax', 'binary search', 'shortest path'],
  source: { platform: 'LeetCode', number: 778, url: 'https://leetcode.com/problems/swim-in-rising-water/' },

  statement: `You are given an \`n × n\` grid of **distinct** integers from \`0\` to \`n² − 1\`; \`grid[i][j]\` is the height of that cell.

Rain starts falling: at time \`t\`, the water level everywhere is \`t\`. You can swim from a cell to a 4-directionally adjacent cell only if **both** heights are at most \`t\`; swimming itself takes no time.

Starting at \`(0, 0)\`, return the **earliest time** at which you can reach \`(n − 1, n − 1)\`.`,
  examples: [
    { input: 'grid = [[0,2],[1,3]]', output: '3', explanation: 'The target has height 3, so you must wait until t = 3.' },
    { input: 'grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]', output: '16', explanation: 'The best route goes around the outer spiral; its highest cell is 16.' },
  ],
  constraints: ['1 <= n <= 50', '0 <= grid[i][j] < n²', 'All values are distinct'],

  think: `- For a fixed route, when can you complete it? (Which cell on it matters?)
- So the answer is the minimum over routes of the **maximum** height on the route. Which pattern is that?
- The start cell counts too — what is the answer for a 1×1 grid?`,
  patternChallenge: {
    options: ['Minimax Dijkstra over cell heights (or binary search on t + BFS)', 'Plain BFS counting steps', 'Kadane-style DP', 'Topological sort'],
    answer: 0,
    explanation: 'A route is usable at time t iff every cell on it has height ≤ t, so the answer is min over routes of max height — a bottleneck path. Dijkstra with `Math.max` handles it, as does binary search on t with a reachability BFS. Step counts, Kadane and topological order have nothing to do with the maximum along a path.',
  },
  hints: [
    'Define time[r][c] = the earliest moment you can stand on (r, c). Moving to a neighbour gives `Math.max(time[r][c], grid[nr][nc])`.',
    'Run Dijkstra with a MinHeap starting from `[grid[0][0], 0, 0]` and return when you pop the bottom-right cell.',
  ],
  approach: `**Brute force:** simulate t = 0, 1, 2, … and flood fill each time until the target is reachable — O(n² · n²) = O(n⁴).

**Binary search + BFS:** the predicate "reachable at time t" is monotone. Binary search t in [grid[0][0], n² − 1]; each check is a BFS over cells ≤ t. O(n² log n²).

**Minimax Dijkstra:** heap of \`[time, r, c]\`, start \`[grid[0][0], 0, 0]\`. Pop the smallest; if target return; mark visited; push unvisited neighbours with \`Math.max(time, grid[nr][nc])\`. Works because extending a route never lowers its maximum.`,

  functionName: 'swimInWater',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function swimInWater(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The target has height 3, so you must wait until t = 3.', args: [[[0, 2], [1, 3]]], expected: 3 },
    { scenario: 'Example 2', hint: 'The best route goes around the outer spiral; its highest cell is 16.', args: [[[0, 1, 2, 3, 4], [24, 23, 22, 21, 5], [12, 13, 14, 15, 16], [11, 17, 18, 19, 20], [10, 9, 8, 7, 6]]], expected: 16 },
    { scenario: 'Single cell', hint: 'n = 1: you are already at the target at time grid[0][0] = 0.', args: [[[0]]], expected: 0 },
    { scenario: 'Start is the highest', hint: 'You cannot leave (0,0) before the water reaches its height 3 — start the time at grid[0][0], not 0.', args: [[[3, 2], [0, 1]]], expected: 3 },
    { scenario: 'Target not the highest', hint: 'The highest cell 3 can be avoided: the answer is 2.', args: [[[0, 3], [2, 1]]], expected: 2 },
    { scenario: 'Max, not sum', hint: 'The time is the highest cell on the route, not the sum of heights.', args: [[[0, 1, 2], [7, 8, 3], [6, 5, 4]]], expected: 4 },
    { scenario: 'Route goes down first', hint: 'Low cells run down the left column and along the bottom.', args: [[[0, 8, 7], [1, 6, 5], [2, 3, 4]]], expected: 4 },
    { scenario: 'High start cell', hint: 'grid[0][0] = 7 dominates every route.', args: [[[7, 1, 2], [0, 8, 3], [6, 5, 4]]], expected: 7 },
    { scenario: 'Detour through low cells', hint: 'The cells next to the start are 8 and 2; going down the left side and along the bottom keeps the maximum at 6.', args: [[[0, 8, 1], [2, 7, 4], [3, 6, 5]]], expected: 6 },
    { scenario: 'Must move up or left', hint: 'The cheapest route (time 15) moves left and up along the way; a right/down-only DP returns 17.', args: [[[14, 2, 5, 7, 11], [18, 16, 23, 21, 15], [8, 0, 17, 4, 9], [19, 24, 20, 12, 22], [13, 3, 1, 6, 10]]], expected: 15 },
    { scenario: 'Large random grid (50×50)', hint: 'Minimax Dijkstra is O(n² log n); binary search + BFS is O(n² log n) too. Trying every t with a fresh BFS is O(n⁴).', argsGen: '() => { let x = 7777; const r = () => (x = (x * 48271) % 2147483647); const n = 50, v = Array.from({ length: n * n }, (_, i) => i); for (let i = v.length - 1; i > 0; i--) { const j = r() % (i + 1); [v[i], v[j]] = [v[j], v[i]]; } return [Array.from({ length: n }, (_, i) => v.slice(i * n, i * n + n))]; }', expected: 1680, timeLimitMs: 1000 },
    { scenario: 'Large spiral (50×50)', hint: 'Heights spiral inward, so the route hugs the border before turning in.', argsGen: '() => { const n = 50, g = Array.from({ length: n }, () => new Array(n).fill(-1)); let r = 0, c = 0, dr = 0, dc = 1; for (let v = 0; v < n * n; v++) { g[r][c] = v; const nr = r + dr, nc = c + dc; if (nr < 0 || nc < 0 || nr >= n || nc >= n || g[nr][nc] !== -1) { [dr, dc] = [dc, -dr]; } r += dr; c += dc; } return [g]; }', expected: 98, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function swimInWater(grid) {
  const n = grid.length;
  const seen = Array.from({ length: n }, () => new Array(n).fill(false));
  const heap = new MinHeap((e) => e[0]);     // [time, r, c]
  heap.push([grid[0][0], 0, 0]);
  seen[0][0] = true;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (!heap.isEmpty()) {
    const [t, r, c] = heap.pop();
    if (r === n - 1 && c === n - 1) return t;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;
      seen[nr][nc] = true;                   // safe: cost only depends on the max so far
      heap.push([Math.max(t, grid[nr][nc]), nr, nc]);
    }
  }
  return -1;
}`,
    explanation: 'Marking on push is safe here — unlike sum-Dijkstra — because the popped node t is the smallest bottleneck in the heap and every later push is max(t_later, h) ≥ max(t_now, h), so the first push of a cell already carries its best value.',
  },
  dryRun: {
    columns: ['pop [t, cell]', 'push', 'note'],
    rows: [
      ['[0, (0,0)]', '[2, (0,1)], [1, (1,0)]', ''],
      ['[1, (1,0)]', '[3, (1,1)]', ''],
      ['[2, (0,1)]', '(1,1) already seen', ''],
      ['[3, (1,1)]', '—', 'target → 3'],
    ],
  },
  complexity: { time: 'O(n² log n)', space: 'O(n²)', explanation: 'Each of the n² cells is pushed once; heap operations are O(log n²) = O(log n).' },
  alternative: {
    title: 'Binary search on t + BFS',
    md: 'lo = grid[0][0], hi = n² − 1. For mid, BFS from (0, 0) through cells with height ≤ mid. If the target is reached, hi = mid, else lo = mid + 1.',
    code: `function swimInWater(grid) {
  const n = grid.length;
  const ok = (t) => {
    if (grid[0][0] > t) return false;
    const seen = new Uint8Array(n * n);
    const q = [0];
    seen[0] = 1;
    for (let h = 0; h < q.length; h++) {
      const r = Math.floor(q[h] / n), c = q[h] % n;
      if (r === n - 1 && c === n - 1) return true;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        if (seen[nr * n + nc] || grid[nr][nc] > t) continue;
        seen[nr * n + nc] = 1;
        q.push(nr * n + nc);
      }
    }
    return false;
  };
  let lo = grid[0][0], hi = n * n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ok(mid)) hi = mid; else lo = mid + 1;
  }
  return lo;
}`,
    complexity: 'O(n² log n) time, O(n²) space',
  },
  mistakes: [
    'Starting the time at 0 instead of grid[0][0].',
    'Summing heights instead of taking the maximum.',
    'Returning when the target is pushed rather than popped.',
    'Assuming the route only moves right/down.',
  ],
};
