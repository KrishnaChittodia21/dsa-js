export default {
  id: 'number-of-ways-to-arrive-at-destination',
  title: 'Number of Ways to Arrive at Destination',
  difficulty: 'Medium',
  order: 8,
  pattern: 'shortest-path-dijkstra',
  tags: ['graph', 'shortest path', 'dijkstra', 'counting', 'modulo'],
  source: { platform: 'LeetCode', number: 1976, url: 'https://leetcode.com/problems/number-of-ways-to-arrive-at-destination/' },

  statement: `A city has \`n\` intersections (\`0\` to \`n - 1\`) joined by **bidirectional** roads \`roads[i] = [u, v, time]\`. Every intersection is reachable from every other, and there is at most one road between two intersections.

Return the **number of different routes** from intersection \`0\` to intersection \`n - 1\` that take the **shortest possible time**. As the number can be huge, return it **modulo \`10^9 + 7\`**.`,
  examples: [
    { input: 'n = 7, roads = [[0,6,7],[0,1,2],[1,2,3],[1,3,3],[6,3,3],[3,5,1],[6,5,1],[2,5,1],[0,4,5],[4,6,2]]', output: '4', explanation: 'The shortest time is 7, achieved by 0→6, 0→4→6, 0→1→2→5→6 and 0→1→3→5→6.' },
    { input: 'n = 2, roads = [[1,0,10]]', output: '1' },
  ],
  constraints: ['1 <= n <= 200', 'n − 1 <= roads.length <= n·(n−1)/2', '1 <= time <= 10^9', 'The graph is connected'],

  think: `- Run Dijkstra. When you relax u → v and find a **strictly shorter** time, how many shortest ways reach v now?
- What if the new time **ties** the current best for v?
- Why is it important that u's count is complete before u relaxes its neighbours?`,
  patternChallenge: {
    options: ['BFS counting paths level by level', 'Backtracking over all routes', 'Dijkstra that also counts ways on ties', 'Topological sort DP on the original graph'],
    answer: 2,
    explanation: 'Weighted, non-negative edges → Dijkstra. Counting is added on top: a strict improvement resets the count, a tie adds to it. BFS ignores weights, backtracking is exponential, and the road graph is undirected with cycles, so there is no topological order (only the shortest-path DAG has one — which Dijkstra processes implicitly).',
  },
  hints: [
    'Keep `ways[v]` next to `dist[v]`. If `d + w < dist[v]`: `dist[v] = d + w`, `ways[v] = ways[u]`. If `d + w === dist[v]`: `ways[v] = (ways[v] + ways[u]) % MOD`.',
    'Skip stale heap entries (`d > dist[u]`) — otherwise a node contributes its ways twice. Times are ≥ 1, so every shortest-path predecessor of u is popped before u.',
  ],
  approach: `**Brute force:** enumerate all simple paths from 0 to n − 1, keep the minimal time and how many achieve it — exponential.

**Optimized (Dijkstra + counting):**
1. \`dist[0] = 0\`, \`ways[0] = 1\`.
2. Pop \`[d, u]\`; skip stale.
3. For each road \`u — v\` (time w): strictly better → set dist and \`ways[v] = ways[u]\`, push; equal → \`ways[v] += ways[u]\` (mod).
4. Return \`ways[n − 1]\`.

**Why it is correct:** the edges on shortest paths form a DAG ordered by distance. Dijkstra pops nodes in increasing distance, so by the time u is popped, every predecessor has already added its ways to u. The largest distance is ≤ 199 · 10^9 ≈ 2·10^11 < 2^53, so plain numbers stay exact.`,

  functionName: 'countPaths',
  paramNames: ['n', 'roads'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} roads
 * @return {number}
 */
function countPaths(n, roads) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Four different routes all take the minimum time 7.', args: [7, [[0, 6, 7], [0, 1, 2], [1, 2, 3], [1, 3, 3], [6, 3, 3], [3, 5, 1], [6, 5, 1], [2, 5, 1], [0, 4, 5], [4, 6, 2]]], expected: 4 },
    { scenario: 'Example 2', hint: 'A single road: one route. Roads are bidirectional.', args: [2, [[1, 0, 10]]], expected: 1 },
    { scenario: 'Single intersection', hint: 'n = 1: start is the destination, and the empty route counts once.', args: [1, []], expected: 1 },
    { scenario: 'Two equal routes', hint: 'Both 0→1→3 and 0→2→3 take time 2.', args: [4, [[0, 1, 1], [0, 2, 1], [1, 3, 1], [2, 3, 1]]], expected: 2 },
    { scenario: 'Reset on strict improvement', hint: 'Node 3 is first reached in time 3 via node 2, then improved to 2 via node 1. On a strict improvement, ways must be RESET to ways[u], not added.', args: [4, [[0, 1, 1], [0, 2, 2], [1, 3, 1], [2, 3, 1]]], expected: 1 },
    { scenario: 'Never mod the distances', hint: 'Route 0→3→4 takes 10^9 + 1, the two-road routes take 2·10^9. Reducing distances modulo 10^9 + 7 makes 2·10^9 look smaller and counts the wrong routes.', args: [5, [[0, 1, 1000000000], [0, 2, 1000000000], [1, 4, 1000000000], [2, 4, 1000000000], [0, 3, 1], [3, 4, 1000000000]]], expected: 1 },
    { scenario: 'Huge road times', hint: 'Times up to 10^9: distances must stay exact — never apply % to them.', args: [3, [[0, 1, 1000000000], [1, 2, 1000000000], [0, 2, 1000000000]]], expected: 1 },
    { scenario: 'Tie through a merge point', hint: 'Two routes merge at node 3 before the destination.', args: [5, [[0, 1, 1], [0, 2, 1], [1, 3, 1], [2, 3, 1], [3, 4, 1], [1, 2, 5]]], expected: 2 },
    { scenario: 'Counts multiply across stages', hint: 'Two ways to reach 3, then two ways from 3 to 5: 4 in total.', args: [6, [[0, 1, 1], [0, 2, 1], [1, 3, 1], [2, 3, 1], [3, 5, 2], [3, 4, 1], [4, 5, 1], [0, 5, 5]]], expected: 4 },
    { scenario: 'Improved before expansion', hint: 'Node 2 is first estimated at 5 and then improved to 2 via node 1 before it is expanded; only the improved route counts.', args: [4, [[0, 1, 1], [0, 2, 5], [1, 2, 1], [2, 3, 1]]], expected: 1 },
    { scenario: 'Complete graph, one best', hint: 'Many roads, but only the direct cheap road is shortest.', args: [4, [[0, 1, 5], [0, 2, 5], [0, 3, 1], [1, 2, 1], [1, 3, 5], [2, 3, 5]]], expected: 1 },
    { scenario: 'Answer needs modulo', hint: '66 diamonds in a row give 2^66 shortest routes — take ways modulo 10^9 + 7 on every addition.', argsGen: '() => { const k = 66, r = []; for (let i = 0; i < k; i++) { const h = 3 * i; r.push([h, h + 1, 1], [h, h + 2, 1], [h + 1, h + 3, 1], [h + 2, h + 3, 1], [h + 1, h + 2, 1]); } return [3 * k + 1, r]; }', expected: 329376018, timeLimitMs: 1000 },
    { scenario: 'Modulo with huge times', hint: 'Same diamonds with time 10^9 per road: distances reach ~1.3·10^11 and must not be reduced modulo anything.', argsGen: '() => { const k = 66, r = []; for (let i = 0; i < k; i++) { const h = 3 * i; r.push([h, h + 1, 1000000000], [h, h + 2, 1000000000], [h + 1, h + 3, 1000000000], [h + 2, h + 3, 1000000000], [h + 1, h + 2, 1000000000]); } return [3 * k + 1, r]; }', expected: 329376018, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function countPaths(n, roads) {
  const MOD = 1_000_000_007;
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, t] of roads) {
    adj[u].push([v, t]);
    adj[v].push([u, t]);
  }

  const dist = new Array(n).fill(Infinity);
  const ways = new Array(n).fill(0);
  dist[0] = 0;
  ways[0] = 1;
  const heap = new MinHeap((e) => e[0]);
  heap.push([0, 0]);

  while (!heap.isEmpty()) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;               // stale — must not count twice
    for (const [v, t] of adj[u]) {
      const nd = d + t;
      if (nd < dist[v]) {                    // strictly better: reset count
        dist[v] = nd;
        ways[v] = ways[u];
        heap.push([nd, v]);
      } else if (nd === dist[v]) {           // tie: another shortest way
        ways[v] = (ways[v] + ways[u]) % MOD;
      }
    }
  }
  return ways[n - 1];
}`,
  },
  dryRun: {
    columns: ['pop', 'relaxations', 'dist / ways changes'],
    rows: [
      ['[0, 0]', '6:7, 1:2, 4:5', 'ways 6=1, 1=1, 4=1'],
      ['[2, 1]', '2:5, 3:5', 'ways 2=1, 3=1'],
      ['[5, 2]', '5:6', 'ways 5=1'],
      ['[5, 3]', '6: 8 > 7 no, 5: 6 tie', 'ways 5=2'],
      ['[5, 4]', '6: 7 tie', 'ways 6=2'],
      ['[6, 5]', '6: 7 tie', 'ways 6=2+2=4'],
      ['[7, 6]', '—', 'answer 4'],
    ],
  },
  complexity: { time: 'O((n + E) log E)', space: 'O(n + E)', explanation: 'Dijkstra with constant extra work per relaxation.' },
  alternative: {
    title: 'Dijkstra, then DP on the shortest-path DAG',
    md: 'First compute all distances. Then sort nodes by distance and do `ways[v] = Σ ways[u]` over edges with `dist[u] + w === dist[v]`. Same complexity, two passes — easier to reason about.',
    complexity: 'O(E log n) time, O(n + E) space',
  },
  mistakes: [
    'Applying % MOD to distances.',
    'Not skipping stale entries → ways get added twice.',
    'Setting `ways[v] += ways[u]` on a strict improvement instead of resetting it.',
    'Forgetting n = 1 (answer 1: the empty route).',
  ],
};
