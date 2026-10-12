export default {
  id: 'network-delay-time',
  title: 'Network Delay Time',
  difficulty: 'Medium',
  order: 3,
  pattern: 'shortest-path-dijkstra',
  tags: ['graph', 'shortest path', 'heap', 'dijkstra'],
  source: { platform: 'LeetCode', number: 743, url: 'https://leetcode.com/problems/network-delay-time/' },

  statement: `A network has \`n\` nodes labelled \`1\` to \`n\`. You are given \`times\`, a list of **directed** travel times \`times[i] = [u, v, w]\`: a signal sent from \`u\` reaches \`v\` after \`w\` time units.

A signal is sent from node \`k\`. Return the minimum time until **all** \`n\` nodes have received it. If some node can never receive it, return \`-1\`.`,
  examples: [
    { input: 'times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2', output: '2', explanation: 'Node 4 is reached last, via 2 → 3 → 4 at time 2.' },
    { input: 'times = [[1,2,1]], n = 2, k = 1', output: '1' },
    { input: 'times = [[1,2,1]], n = 2, k = 2', output: '-1', explanation: 'The edge points from 1 to 2, so node 1 is never reached from 2.' },
  ],
  constraints: ['1 <= k <= n <= 100', '1 <= times.length <= 6000', '0 <= w <= 100', 'All (u, v) pairs are distinct'],

  think: `- The signal spreads along every edge at once. When does node v "hear" it? (Think: the cheapest path.)
- Once you know every node's shortest arrival time, how do you get "time until all nodes have it"?
- Weights are non-negative and differ — which algorithm does that suggest?`,
  patternChallenge: {
    options: ['Plain BFS counting edges', "Dijkstra's algorithm with a min-heap", 'Topological sort', 'Floyd-Warshall on all pairs'],
    answer: 1,
    explanation: 'Single source, weighted edges, all weights ≥ 0 → Dijkstra. BFS ignores weights; topological sort needs a DAG (there may be cycles); Floyd-Warshall would work for n ≤ 100 but computes far more than needed.',
  },
  hints: [
    'Each node receives the signal at time = its shortest distance from k. The answer is the maximum of those distances (or −1 if any is Infinity).',
    'Run Dijkstra from k. Because pops come out in non-decreasing distance order, the last node you finalise has the largest distance.',
  ],
  approach: `**Brute force:** DFS every path from k, keeping the minimum arrival time for each node. Exponential in the worst case, or Bellman-Ford O(n · E) — acceptable here but not the intended answer.

**Optimized (Dijkstra):**
1. Build \`adj[u] = [[v, w]]\` with n + 1 slots (nodes are 1-indexed).
2. \`dist[k] = 0\`, heap = \`[[0, k]]\` (toolkit \`MinHeap\` keyed on distance).
3. Pop \`[d, u]\`; skip if stale (\`d > dist[u]\`). Otherwise count u as finalised, remember \`d\`, relax its edges.
4. If all n nodes were finalised, the last popped distance is the answer; otherwise \`-1\`.`,

  functionName: 'networkDelayTime',
  paramNames: ['times', 'n', 'k'],
  starterCode: `/**
 * @param {number[][]} times
 * @param {number} n
 * @param {number} k
 * @return {number}
 */
function networkDelayTime(times, n, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Node 4 is reached last via 2 → 3 → 4 at time 2.', args: [[[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2], expected: 2 },
    { scenario: 'Example 2', hint: 'One edge from the source.', args: [[[1, 2, 1]], 2, 1], expected: 1 },
    { scenario: 'Example 3', hint: 'Edges are directed: from node 2 the signal cannot travel back to 1.', args: [[[1, 2, 1]], 2, 2], expected: -1 },
    { scenario: 'Highest label is n', hint: 'Nodes are 1..n — arrays need n + 1 slots or node n is lost.', args: [[[1, 3, 5], [3, 2, 1]], 3, 1], expected: 6 },
    { scenario: 'Shorter path with more hops', hint: '1 → 3 → 2 → 4 (1 + 2 + 1) beats the direct-looking hops; BFS by hop count gets this wrong.', args: [[[1, 2, 4], [1, 3, 1], [3, 2, 2], [2, 4, 1], [3, 4, 5]], 4, 1], expected: 4 },
    { scenario: 'Zero-weight edges', hint: 'Weights can be 0: everyone is reached at time 0.', args: [[[1, 2, 0], [2, 3, 0]], 3, 1], expected: 0 },
    { scenario: 'Maximum, not sum', hint: 'The answer is the time the LAST node hears the signal (3), not the sum of all arrival times (4).', args: [[[1, 2, 1], [2, 3, 2], [1, 3, 4]], 3, 1], expected: 3 },
    { scenario: 'Unreachable isolated node', hint: 'Node 3 has no incoming edges at all: -1.', args: [[[1, 2, 1], [2, 1, 3]], 3, 2], expected: -1 },
    { scenario: 'Undirected shortcut is illegal', hint: 'Edge 1 → 2 is one-way. Treating it as two-way lets node 1 hear the signal via 3 → 2 → 1 at time 2; the real route is 3 → 1 at time 5.', args: [[[3, 2, 1], [1, 2, 1], [3, 1, 5]], 3, 3], expected: 5 },
    { scenario: 'Long chain of relays', hint: 'Path 3 → 4 → 5 → 2 → 1 is cheaper than the direct 3 → 1 edge.', args: [[[3, 1, 5], [3, 2, 2], [2, 1, 2], [3, 4, 1], [4, 5, 1], [5, 2, 1]], 5, 3], expected: 4 },
    { scenario: 'Maximum edge weight', hint: 'Weights up to 100 along a chain.', args: [[[1, 2, 100], [2, 3, 100]], 3, 1], expected: 200 },
    { scenario: 'Dense graph (n = 100)', hint: 'Up to 6000 edges: Dijkstra with a heap is O(E log V).', argsGen: '() => { let x = 1111; const r = () => (x = (x * 48271) % 2147483647); const t = []; for (let u = 1; u <= 100; u++) for (let v = 1; v <= 100; v++) if (u !== v && t.length < 6000 && r() % 10 < 7) t.push([u, v, r() % 101]); return [t, 100, 37]; }', expected: 10, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function networkDelayTime(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);

  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const heap = new MinHeap((e) => e[0]);   // [distance, node]
  heap.push([0, k]);
  let finalized = 0;
  let latest = 0;

  while (!heap.isEmpty()) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;             // stale entry
    finalized++;
    latest = d;                            // pops are non-decreasing
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        heap.push([dist[v], v]);
      }
    }
  }
  return finalized === n ? latest : -1;
}`,
    explanation: 'Uses the toolkit `MinHeap`. Each node is finalised exactly once thanks to the stale check, so `finalized` counts reachable nodes.',
  },
  dryRun: {
    columns: ['pop', 'stale?', 'relax', 'dist[1..4]', 'finalized'],
    rows: [
      ['[0, 2]', 'no', '1 → 1, 3 → 1', '[1, 0, 1, ∞]', '1'],
      ['[1, 1]', 'no', '(no out-edges)', '[1, 0, 1, ∞]', '2'],
      ['[1, 3]', 'no', '4 → 2', '[1, 0, 1, 2]', '3'],
      ['[2, 4]', 'no', '—', '[1, 0, 1, 2]', '4 → answer 2'],
    ],
  },
  complexity: { time: 'O((n + E) log E)', space: 'O(n + E)', explanation: 'Each edge can push one heap entry; each push/pop costs O(log E).' },
  alternative: {
    title: 'Bellman-Ford',
    md: 'Relax every edge n − 1 times, then take the maximum distance. Simpler to write, slower in general, fine for n ≤ 100.',
    code: `function networkDelayTime(times, n, k) {
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  for (let i = 1; i < n; i++)
    for (const [u, v, w] of times)
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  let ans = 0;
  for (let v = 1; v <= n; v++) ans = Math.max(ans, dist[v]);
  return ans === Infinity ? -1 : ans;
}`,
    complexity: 'O(n · E) time, O(n) space',
  },
  mistakes: [
    'Allocating n slots instead of n + 1 for 1-indexed nodes.',
    'Treating edges as undirected.',
    'Returning the SUM of distances instead of the maximum.',
    'Using BFS (hop count) instead of weighted distances.',
  ],
};
