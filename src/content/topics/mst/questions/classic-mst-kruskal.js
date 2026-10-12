export default {
  id: 'classic-mst-kruskal',
  title: "Minimum Spanning Tree (Kruskal's Algorithm)",
  difficulty: 'Easy',
  order: 1,
  pattern: 'mst-kruskal',
  tags: ['graph', 'minimum spanning tree', 'union find', 'sorting'],
  source: { platform: 'Classic', note: "Textbook MST problem (CLRS ch. 23). Solve it with Kruskal's algorithm." },

  statement: `You are given an undirected weighted graph with \`n\` nodes labelled \`0\` to \`n - 1\` and a list \`edges\`, where \`edges[i] = [u, v, w]\` is an edge between \`u\` and \`v\` with weight \`w\`.

Return the **total weight of a minimum spanning tree** — the cheapest set of edges that connects all \`n\` nodes. If the graph is not connected (no spanning tree exists), return \`-1\`.

The graph may contain parallel edges and self-loops. A single node needs no edges (answer \`0\`).`,
  examples: [
    { input: 'n = 4, edges = [[0,1,1],[1,2,2],[0,2,3],[2,3,4]]', output: '7', explanation: 'Take 0–1 (1), 1–2 (2), 2–3 (4). Edge 0–2 would close a cycle.' },
    { input: 'n = 3, edges = [[0,1,5]]', output: '-1', explanation: 'Node 2 cannot be reached.' },
    { input: 'n = 1, edges = []', output: '0' },
  ],
  constraints: ['1 <= n <= 10^4', '0 <= edges.length <= 10^5', '0 <= u, v < n', '-10^4 <= w <= 10^4 (weights may be negative)'],

  think: `- If you sort the edges by weight, which edges can you safely take first?
- How do you know, in O(1)-ish time, whether an edge would create a cycle?
- How many edges will the tree have, and how can that tell you whether the graph was connected?`,
  patternChallenge: {
    options: ['Dijkstra from node 0', "Kruskal's algorithm (sort + Union Find)", 'Topological sort', 'BFS counting levels'],
    answer: 1,
    explanation: 'An explicit edge list plus "connect all nodes at minimum total weight" is the textbook signal for Kruskal. Dijkstra minimises distances from one source, not total tree weight; topological sort is for DAG ordering; BFS ignores weights.',
  },
  hints: [
    'Sort the edges by weight (with a comparator!). Go through them cheapest first.',
    'Use a Union Find: accept an edge only when `union(u, v)` returns true. Count accepted edges — you need exactly n − 1.',
  ],
  approach: `**Brute force:** try every subset of n − 1 edges and keep the cheapest that forms a tree — exponential.

**Kruskal:**
1. Sort edges by weight ascending.
2. \`uf = new UnionFind(n)\` (toolkit global).
3. For each edge, if \`uf.union(u, v)\` succeeds, add its weight and count it. Stop at n − 1 edges.
4. If fewer than n − 1 edges were accepted, the graph is disconnected → \`-1\`.

It is correct by the **cut property**: when an edge joins two different components, every cheaper edge was already handled, so it is the cheapest edge crossing that component's boundary. Negative weights are fine — the cut property never needed positivity.`,

  functionName: 'mstKruskal',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges  [u, v, w]
 * @return {number}
 */
function mstKruskal(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Take 0–1, 1–2, 2–3; edge 0–2 would close a cycle.', args: [4, [[0, 1, 1], [1, 2, 2], [0, 2, 3], [2, 3, 4]]], expected: 7 },
    { scenario: 'Example 2', hint: 'Node 2 is unreachable — return -1, not the partial total 5.', args: [3, [[0, 1, 5]]], expected: -1 },
    { scenario: 'Example 3', hint: 'A single node needs zero edges: answer 0. Without a special case the loop finds no edges and falls through to -1.', args: [1, []], expected: 0 },
    { scenario: 'Two nodes, no edges', hint: 'No edges and more than one node: disconnected.', args: [2, []], expected: -1 },
    { scenario: 'Cheapest edge closes a cycle', hint: 'Skip edges whose endpoints are already connected.', args: [5, [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]]], expected: 11 },
    { scenario: 'Parallel edges and self-loop', hint: 'Keep the cheaper parallel edge; the self-loop (weight 0) can never be used.', args: [2, [[0, 1, 9], [0, 1, 3], [1, 1, 0]]], expected: 3 },
    { scenario: 'Negative weights', hint: 'Negative weights are fine for Kruskal; the total can be negative.', args: [3, [[0, 1, -2], [1, 2, -3], [0, 2, 1]]], expected: -5 },
    { scenario: 'Two separate pieces', hint: 'Every node has an edge but the graph is two components — return -1.', args: [4, [[0, 1, 1], [2, 3, 1]]], expected: -1 },
    { scenario: 'All weights equal', hint: 'Any spanning tree works; the total is (n − 1) × weight.', args: [4, [[0, 1, 2], [1, 2, 2], [2, 3, 2], [3, 0, 2], [0, 2, 2]]], expected: 6 },
    { scenario: 'Default sort trap', hint: 'edges.sort() compares arrays as strings ("0,…" before "1,…"), so the cheap edge 1–2 comes last. Sort by weight.', args: [3, [[0, 1, 100], [0, 2, 50], [1, 2, 1]]], expected: 51 },
    { scenario: 'Visited set misses merges', hint: 'Both endpoints of 1–2 were "seen" via different components, yet the edge is needed. Only Union Find tells components apart.', args: [4, [[0, 1, 1], [2, 3, 1], [1, 2, 5], [0, 3, 9]]], expected: 7 },
    { scenario: 'Weights at the bounds', hint: 'Weights from −10^4 to 10^4.', args: [3, [[0, 1, -10000], [1, 2, 10000], [0, 2, 10000]]], expected: 0 },
    { scenario: 'Large graph (m = 10^5)', hint: 'Sort once and use Union Find: O(m log m). Rescanning all edges for each new tree edge is O(n·m).', argsGen: '() => { let x = 777; const r = () => (x = (x * 48271) % 2147483647); const n = 10000, e = []; for (let i = 1; i < n; i++) e.push([r() % i, i, (r() % 20001) - 10000]); while (e.length < 100000) e.push([r() % n, r() % n, (r() % 20001) - 10000]); for (let i = e.length - 1; i > 0; i--) { const j = r() % (i + 1); [e[i], e[j]] = [e[j], e[i]]; } return [n, e]; }', expected: -87880646, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function mstKruskal(n, edges) {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]); // cheapest first
  const uf = new UnionFind(n);
  let total = 0;
  let used = 0;
  if (n === 1) return 0;
  for (const [u, v, w] of sorted) {
    if (!uf.union(u, v)) continue;   // same component → cycle → skip
    total += w;
    if (++used === n - 1) return total; // tree complete
  }
  return -1;                         // ran out of edges: disconnected
}`,
    explanation: 'Self-loops and the heavier of two parallel edges are rejected automatically because `union` returns false for nodes already in the same component.',
  },
  dryRun: {
    columns: ['edge (sorted)', 'union?', 'total', 'used'],
    rows: [
      ['[0,1,1]', 'yes', '1', '1'],
      ['[1,2,2]', 'yes', '3', '2'],
      ['[0,2,3]', 'no — 0 and 2 already joined', '3', '2'],
      ['[2,3,4]', 'yes', '7', '3 = n − 1 → return 7'],
    ],
  },
  complexity: { time: 'O(m log m)', space: 'O(n + m)', explanation: 'Sorting dominates; each union/find is ~O(1) amortized (inverse Ackermann). The sorted copy is O(m), Union Find O(n).' },
  alternative: {
    title: "Prim's algorithm with a heap",
    md: 'Build an adjacency list and grow one tree from node 0 with a min-heap of `[weight, node]`. Same O(m log m); needs an explicit disconnected check (`count === n`).',
    complexity: 'O(m log m) time, O(n + m) space',
  },
  mistakes: [
    'Calling `edges.sort()` without a comparator — it compares arrays as strings.',
    'Returning the partial total when the graph is disconnected instead of -1.',
    'Using a visited Set instead of Union Find to detect cycles.',
    'Forgetting n = 1 needs zero edges (answer 0).',
  ],
};
