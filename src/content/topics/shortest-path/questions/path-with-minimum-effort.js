export default {
  id: 'path-with-minimum-effort',
  title: 'Path With Minimum Effort',
  difficulty: 'Medium',
  order: 7,
  pattern: 'shortest-path-minimax',
  tags: ['grid', 'shortest path', 'heap', 'binary search', 'minimax'],
  source: { platform: 'LeetCode', number: 1631, url: 'https://leetcode.com/problems/path-with-minimum-effort/' },

  statement: `You are hiking on a grid \`heights\` of size \`rows × cols\`, starting at the top-left cell and ending at the bottom-right cell. You may move up, down, left or right.

The **effort** of a route is the **largest absolute height difference** between two consecutive cells on it. Return the minimum effort needed to go from start to end.`,
  examples: [
    { input: 'heights = [[1,2,2],[3,8,2],[5,3,5]]', output: '2', explanation: 'Route 1 → 3 → 5 → 3 → 5 has differences 2, 2, 2, 2.' },
    { input: 'heights = [[1,2,3],[3,8,4],[5,3,5]]', output: '1', explanation: 'Route 1 → 2 → 3 → 4 → 5 never differs by more than 1.' },
    { input: 'heights = [[1,2,1,1,1],[1,2,1,2,1],[1,2,1,2,1],[1,2,1,2,1],[1,1,1,2,1]]', output: '0' },
  ],
  constraints: ['1 <= rows, cols <= 100', '1 <= heights[i][j] <= 10^6'],

  think: `- The route's cost is a **max**, not a sum. Does "extending a route can never make it cheaper" still hold?
- If I told you "effort must be ≤ X", could you quickly check whether the end is reachable?
- Is the answer monotone in X?`,
  patternChallenge: {
    options: ['Plain BFS counting steps', 'Dynamic programming moving only right/down', 'Sliding window', 'Minimax Dijkstra (relax with max) or binary search + BFS'],
    answer: 3,
    explanation: 'The cost of a path is its worst step — a bottleneck/minimax path. Dijkstra works with `Math.max(d, w)` because max is monotone. BFS ignores the weights; right/down DP misses routes that go up or left; there is no contiguous-window structure.',
  },
  hints: [
    'Treat every pair of adjacent cells as an edge with weight |h1 − h2|. The cost of a path is the MAX edge weight on it.',
    'Run Dijkstra where the new cost is `Math.max(currentEffort, edgeWeight)`. The first time you pop the bottom-right cell, that effort is the answer.',
  ],
  approach: `**Brute force:** DFS every route and track its maximum step — exponential.

**Optimized 1 (minimax Dijkstra):** \`effort[r][c]\` = smallest possible max-step to reach (r, c). Heap of \`[effort, r, c]\`. Pop the smallest; if it is the target return it; skip if stale; for each neighbour, \`ne = Math.max(e, |h − h'|)\`; if smaller than \`effort[nr][nc]\` update and push. Correct because max never decreases along a path.

**Optimized 2 (binary search + BFS):** For a limit X, BFS using only steps with difference ≤ X. If reachable, try smaller X; otherwise larger. The smallest reachable X is the answer.`,

  functionName: 'minimumEffortPath',
  paramNames: ['heights'],
  starterCode: `/**
 * @param {number[][]} heights
 * @return {number}
 */
function minimumEffortPath(heights) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Route 1 → 3 → 5 → 3 → 5 never steps more than 2.', args: [[[1, 2, 2], [3, 8, 2], [5, 3, 5]]], expected: 2 },
    { scenario: 'Example 2', hint: 'Route 1 → 2 → 3 → 4 → 5 never differs by more than 1.', args: [[[1, 2, 3], [3, 8, 4], [5, 3, 5]]], expected: 1 },
    { scenario: 'Example 3', hint: 'A flat path of 1s winds through the grid: effort 0.', args: [[[1, 2, 1, 1, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 1, 1, 2, 1]]], expected: 0 },
    { scenario: 'Single cell', hint: 'Start equals end: effort 0.', args: [[[7]]], expected: 0 },
    { scenario: 'Single row', hint: 'Only one route: the effort is its biggest step.', args: [[[1, 10]]], expected: 9 },
    { scenario: 'Single column', hint: 'Steps of 3 and 2: effort is the max, 3.', args: [[[1], [4], [2]]], expected: 3 },
    { scenario: 'Max, not sum', hint: 'Effort is the LARGEST step (2), not the total of the steps.', args: [[[1, 3, 5, 7]]], expected: 2 },
    { scenario: 'Must go up and around', hint: 'The flat route goes down, right, then UP. Only moving right/down misses it.', args: [[[1, 9, 1, 1, 1], [1, 9, 1, 9, 1], [1, 1, 1, 9, 1], [9, 9, 9, 9, 1]]], expected: 0 },
    { scenario: 'Return when popped', hint: 'The target is first pushed with effort 7 (from the 2 below-left) but the route through the 5 gives 4. Return only when the target is POPPED.', args: [[[1, 1, 5], [2, 2, 9]]], expected: 4 },
    { scenario: 'Walls of 100', hint: 'A ring of 1s around a wall of 100s gives effort 0.', args: [[[1, 100, 1], [1, 100, 1], [1, 1, 1]]], expected: 0 },
    { scenario: 'Extreme heights', hint: 'Heights 1 and 10^6: every route has effort 999999.', args: [[[1, 1000000], [1000000, 1]]], expected: 999999 },
    { scenario: 'Large random grid (100×100)', hint: 'Dijkstra on (max-step) costs runs in O(RC log RC); exploring all routes is exponential.', argsGen: '() => { let x = 3333; const r = () => (x = (x * 48271) % 2147483647); return [Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => 1 + r() % 1000000))]; }', expected: 629628, timeLimitMs: 1000 },
    { scenario: 'Large snake path (99×99)', hint: 'The only flat route snakes through every other row (~5000 cells); everything else needs a 999999 step.', argsGen: '() => { const n = 99, h = Array.from({ length: n }, (_, r) => new Array(n).fill(r % 2 === 0 ? 1 : 1000000)); for (let r = 1; r < n; r += 2) h[r][(r >> 1) % 2 === 0 ? n - 1 : 0] = 1; return [h]; }', expected: 0, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minimumEffortPath(heights) {
  const R = heights.length, C = heights[0].length;
  const effort = Array.from({ length: R }, () => new Array(C).fill(Infinity));
  effort[0][0] = 0;
  const heap = new MinHeap((e) => e[0]);   // [effort, r, c]
  heap.push([0, 0, 0]);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (!heap.isEmpty()) {
    const [e, r, c] = heap.pop();
    if (r === R - 1 && c === C - 1) return e;  // popped = final
    if (e > effort[r][c]) continue;            // stale
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      const ne = Math.max(e, Math.abs(heights[nr][nc] - heights[r][c]));
      if (ne < effort[nr][nc]) {
        effort[nr][nc] = ne;
        heap.push([ne, nr, nc]);
      }
    }
  }
  return 0;
}`,
    explanation: 'Standard Dijkstra with `Math.max` replacing `+`. Early return on popping the target is safe because pops come out in non-decreasing effort.',
  },
  dryRun: `Example 2 (\`[[1,2,3],[3,8,4],[5,3,5]]\`): the heap pops (0,0) with 0, then cells with effort 1 along the top row 1 → 2 → 3, then 4 (|4 − 3| = 1) and finally 5 (|5 − 4| = 1). The route through 8 would cost 5 or 6, so it is never popped before the target, which comes out with effort **1**.`,
  complexity: { time: 'O(R·C · log(R·C))', space: 'O(R·C)', explanation: 'Each cell has ≤ 4 edges; each successful relaxation pushes one heap entry.' },
  alternative: {
    title: 'Binary search on the answer + BFS',
    md: 'Search X in [0, 10^6]. `canReach(X)` is a BFS using only steps with |diff| ≤ X. The predicate is monotone (larger X keeps all old edges), so the smallest true X is the answer.',
    code: `function minimumEffortPath(heights) {
  const R = heights.length, C = heights[0].length;
  const canReach = (limit) => {
    const seen = new Uint8Array(R * C);
    const queue = [0];
    seen[0] = 1;
    for (let head = 0; head < queue.length; head++) {
      const r = Math.floor(queue[head] / C), c = queue[head] % C;
      if (r === R - 1 && c === C - 1) return true;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C || seen[nr * C + nc]) continue;
        if (Math.abs(heights[nr][nc] - heights[r][c]) > limit) continue;
        seen[nr * C + nc] = 1;
        queue.push(nr * C + nc);
      }
    }
    return false;
  };
  let lo = 0, hi = 1e6;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (canReach(mid)) hi = mid; else lo = mid + 1;
  }
  return lo;
}`,
    complexity: 'O(R·C · log H) time, O(R·C) space',
  },
  mistakes: [
    'Summing the differences instead of taking the maximum.',
    'Only moving right/down — the best route may go up or left around a peak.',
    'Returning when the target is pushed instead of popped.',
    'Forgetting the 1×1 grid (answer 0).',
  ],
};
