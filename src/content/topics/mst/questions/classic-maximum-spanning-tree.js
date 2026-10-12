export default {
  id: 'classic-maximum-spanning-tree',
  title: 'Maximum Spanning Tree',
  difficulty: 'Easy',
  order: 3,
  pattern: 'mst-kruskal',
  tags: ['graph', 'spanning tree', 'union find', 'sorting', 'greedy'],
  source: { platform: 'Classic', note: 'Standard variation of the MST problem: maximise instead of minimise the total weight.' },

  statement: `You are given an undirected weighted graph with \`n\` nodes (\`0\` … \`n - 1\`) and \`edges[i] = [u, v, w]\`.

Return the **maximum possible total weight** of a spanning tree (a set of \`n - 1\` edges connecting all nodes without a cycle). If the graph is disconnected, return \`-1\`.

Think of it as: every edge is a road with a "scenic value"; keep a tree of roads with the largest total value.`,
  examples: [
    { input: 'n = 4, edges = [[0,1,1],[1,2,2],[0,2,3],[2,3,4]]', output: '9', explanation: 'Take 2–3 (4), 0–2 (3), 1–2 (2).' },
    { input: 'n = 3, edges = [[0,1,5],[1,2,5],[0,2,5]]', output: '10' },
    { input: 'n = 3, edges = [[0,1,1]]', output: '-1' },
  ],
  constraints: ['1 <= n <= 10^4', '0 <= edges.length <= 10^5', '-10^4 <= w <= 10^4'],

  think: `- Does the cut property still work if "cheapest" becomes "most expensive"?
- What is the one-character change to Kruskal?
- Could you instead negate every weight and reuse an MST routine?`,
  patternChallenge: {
    options: ['Kruskal with edges sorted in descending order', 'Longest path with DFS', 'Dijkstra with a max-heap', 'Dynamic programming over subsets'],
    answer: 0,
    explanation: 'A maximum spanning tree is an MST of the negated weights, so Kruskal with a descending sort is exact. "Longest path" is NP-hard in general and is a different question; Dijkstra with a max-heap is not correct for anything here; subset DP is exponential.',
  },
  hints: [
    'The exchange argument works symmetrically: the MOST expensive edge crossing any cut is in some maximum spanning tree.',
    'Sort by `b[2] - a[2]` and run Kruskal unchanged.',
  ],
  approach: `**Brute force:** enumerate spanning trees — exponential.

**Kruskal, reversed:** sort edges from heaviest to lightest and accept an edge whenever \`uf.union(u, v)\` succeeds. Stop at n − 1 edges, return -1 if fewer were found.

Why it is correct: negate every weight. A maximum spanning tree of the original graph is exactly a minimum spanning tree of the negated one, and sorting negated weights ascending = sorting originals descending.`,

  functionName: 'maxSpanningTree',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges  [u, v, w]
 * @return {number}
 */
function maxSpanningTree(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Take 2–3 (4), 0–2 (3), 1–2 (2): heaviest edges that do not close a cycle.', args: [4, [[0, 1, 1], [1, 2, 2], [0, 2, 3], [2, 3, 4]]], expected: 9 },
    { scenario: 'Example 2', hint: 'All weights equal: any two of the three edges give 10.', args: [3, [[0, 1, 5], [1, 2, 5], [0, 2, 5]]], expected: 10 },
    { scenario: 'Example 3', hint: 'Node 2 has no edge, so no spanning tree exists — return -1.', args: [3, [[0, 1, 1]]], expected: -1 },
    { scenario: 'Single node', hint: 'One node is already a spanning tree with no edges: total 0.', args: [1, []], expected: 0 },
    { scenario: 'Two nodes, no edges', hint: 'Two nodes with no edge are disconnected — return -1.', args: [2, []], expected: -1 },
    { scenario: 'Heaviest edge closes a cycle', hint: 'Skip an edge when union fails, even if it is heavy.', args: [5, [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]]], expected: 20 },
    { scenario: 'All negative weights', hint: 'Negative weights are allowed: the "maximum" tree picks the least negative edges, and the total can be negative.', args: [3, [[0, 1, -1], [1, 2, -5], [0, 2, -2]]], expected: -3 },
    { scenario: 'Parallel edges and self-loop', hint: 'Keep the heavier parallel edge; a self-loop can never join two components.', args: [2, [[0, 1, 3], [0, 1, 9], [0, 0, 50]]], expected: 9 },
    { scenario: 'Two disconnected pieces', hint: 'Edges exist, but they form two separate components — return -1.', args: [4, [[0, 1, 10], [2, 3, 10]]], expected: -1 },
    { scenario: 'Default sort trap', hint: 'sort() without a comparator compares the edge arrays as strings ("1,2,1" > "0,1,100"), not by weight. Sort with (a, b) => b[2] - a[2].', args: [3, [[0, 1, 100], [1, 2, 1], [0, 2, 50]]], expected: 150 },
    { scenario: 'Max is not the min tree', hint: 'Sorting ascending gives the MINIMUM spanning tree; here the two differ.', args: [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 7], [0, 2, 6], [1, 3, 5]]], expected: 18 },
    { scenario: 'Weights at the bounds', hint: 'Weights from −10^4 to 10^4 in the same graph.', args: [3, [[0, 1, -10000], [1, 2, 10000], [0, 2, -10000]]], expected: 0 },
    { scenario: 'Large graph (m = 10^5)', hint: 'Sort the edges once and use union-find: O(m log m). Rescanning edges for every added tree edge is O(n·m).', argsGen: '() => { let x = 2024; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); const n = 10000, e = []; for (let i = 1; i < n; i++) e.push([r() % i, i, (r() % 20001) - 10000]); while (e.length < 100000) { const u = r() % n, v = r() % n; e.push([u, v, (r() % 20001) - 10000]); } return [n, e]; }', expected: 7615493, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxSpanningTree(n, edges) {
  if (n === 1) return 0;
  const sorted = [...edges].sort((a, b) => b[2] - a[2]); // heaviest first
  const uf = new UnionFind(n);
  let total = 0, used = 0;
  for (const [u, v, w] of sorted) {
    if (!uf.union(u, v)) continue;
    total += w;
    if (++used === n - 1) return total;
  }
  return -1;
}`,
  },
  dryRun: {
    columns: ['edge (desc)', 'union?', 'total', 'used'],
    rows: [
      ['[2,3,4]', 'yes', '4', '1'],
      ['[0,2,3]', 'yes', '7', '2'],
      ['[1,2,2]', 'yes', '9', '3 → return 9'],
    ],
  },
  complexity: { time: 'O(m log m)', space: 'O(n + m)', explanation: 'Same as Kruskal: the sort dominates.' },
  alternative: {
    title: 'Negate and reuse',
    md: 'Map each edge to `[u, v, -w]`, compute an ordinary MST, and negate the result (keeping -1 for disconnected). Useful when you already have a tested MST function.',
    complexity: 'O(m log m) time',
  },
  mistakes: [
    'Returning -1 as a "sentinel" when negative weights could legitimately sum to -1 — here disconnection is the only -1 case in the tests, but in real code prefer null or Infinity for "impossible".',
    'Thinking a maximum spanning tree maximises path lengths between nodes — it only maximises the total of the chosen edges.',
    'Forgetting the comparator (default sort is lexicographic).',
  ],
};
