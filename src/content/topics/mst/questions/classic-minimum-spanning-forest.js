export default {
  id: 'classic-minimum-spanning-forest',
  title: 'Minimum Spanning Forest',
  difficulty: 'Medium',
  order: 3,
  pattern: 'mst-kruskal',
  tags: ['graph', 'minimum spanning tree', 'union find', 'connected components'],
  source: { platform: 'Classic', note: 'Standard generalisation of MST to disconnected graphs (one MST per connected component).' },

  statement: `You are given an undirected weighted graph with \`n\` nodes (\`0\` … \`n - 1\`) and \`edges[i] = [u, v, w]\`. The graph **may be disconnected**.

A **minimum spanning forest** is a set of edges that, inside every connected component, forms a minimum spanning tree of that component. Return \`[totalWeight, components]\`: the total weight of a minimum spanning forest and the number of connected components.`,
  examples: [
    { input: 'n = 5, edges = [[0,1,3],[1,2,1],[0,2,2],[3,4,7]]', output: '[10, 2]', explanation: 'Component {0,1,2}: edges 1–2 (1) + 0–2 (2) = 3. Component {3,4}: 7. Total 10, 2 components.' },
    { input: 'n = 3, edges = []', output: '[0, 3]', explanation: 'Three isolated nodes: the forest has no edges.' },
  ],
  constraints: ['1 <= n <= 10^4', '0 <= edges.length <= 10^5', '-10^4 <= w <= 10^4'],

  think: `- If you run Kruskal without stopping at n − 1 and without returning -1, what does it produce?
- How many edges will a spanning forest with c components have?
- Would Prim work here as-is? What would you have to change?`,
  patternChallenge: {
    options: ['Kruskal without the early stop', 'Prim from node 0 only', 'Dijkstra from every node', 'Topological sort'],
    answer: 0,
    explanation: 'Kruskal never assumed connectivity: it simply accepts every edge that joins two different components. Run to the end and you get one MST per component. Prim from node 0 only covers node 0\'s component; Dijkstra and topological sort solve different problems.',
  },
  hints: [
    'Do Kruskal as usual but process ALL edges; accept whenever `union` returns true.',
    '`uf.count` (toolkit UnionFind) tracks the number of components for you: it starts at n and decreases by one per successful union.',
  ],
  approach: `**Brute force:** find components with DFS, then run an MST per component — correct but more code.

**Kruskal over the whole graph:** sort all edges, accept each edge that joins two components. The cut-property argument is local to each component, so the accepted edges form an MST inside every component. A forest with c components has exactly n − c edges, and \`uf.count\` ends at c.

With Prim you would have to restart from every unvisited node — Kruskal handles forests for free.`,

  functionName: 'minSpanningForest',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges  [u, v, w]
 * @return {number[]} [totalWeight, components]
 */
function minSpanningForest(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Component {0,1,2} costs 3 and {3,4} costs 7: [10, 2].', args: [5, [[0, 1, 3], [1, 2, 1], [0, 2, 2], [3, 4, 7]]], expected: [10, 2] },
    { scenario: 'Example 2', hint: 'No edges: three isolated nodes are three components with total weight 0.', args: [3, []], expected: [0, 3] },
    { scenario: 'Single node', hint: 'One node is one component with an empty forest.', args: [1, []], expected: [0, 1] },
    { scenario: 'Connected graph', hint: 'A connected graph is a single component; the forest is just its MST.', args: [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 1]]], expected: [4, 1] },
    { scenario: 'Parallel edges, loop, negative', hint: 'Take the cheaper parallel edge, ignore the self-loop, and include negative weights normally.', args: [6, [[0, 1, 5], [0, 1, 2], [2, 3, -4], [4, 4, 1]]], expected: [-2, 4] },
    { scenario: 'Three components with cycles', hint: 'Each component gets its own MST; cycle edges inside a component are skipped.', args: [7, [[0, 1, 1], [1, 2, 1], [0, 2, 1], [3, 4, 2], [4, 5, 9], [3, 5, 3]]], expected: [7, 3] },
    { scenario: 'Isolated nodes count', hint: 'Nodes 0 and 1 have no edges but are still components — count them.', args: [4, [[2, 3, 10]]], expected: [10, 3] },
    { scenario: 'No -1 for disconnected', hint: 'A disconnected graph is the normal case here; never return -1 just because fewer than n − 1 edges were used.', args: [4, [[0, 1, 2], [2, 3, 3]]], expected: [5, 2] },
    { scenario: 'All negative weights', hint: 'Every forest edge is negative, so the total is negative.', args: [3, [[0, 1, -3], [1, 2, -2], [0, 2, -1]]], expected: [-5, 1] },
    { scenario: 'Only self-loops', hint: 'Self-loops never join components: every node stays alone and the total is 0.', args: [3, [[0, 0, 5], [1, 1, -5], [2, 2, 1]]], expected: [0, 3] },
    { scenario: 'Weights at the bounds', hint: 'Weights from −10^4 to 10^4.', args: [4, [[0, 1, 10000], [0, 1, -10000], [2, 3, 10000]]], expected: [0, 2] },
    { scenario: 'Large forest (m = 10^5)', hint: 'Four separate dense blocks: one sorted Kruskal pass over all edges handles every component in O(m log m).', argsGen: '() => { let x = 909; const r = () => (x = (x * 48271) % 2147483647); const n = 10000, e = []; while (e.length < 100000) { const b = r() % 4; const u = b * 2500 + r() % 2500, v = b * 2500 + r() % 2500; e.push([u, v, (r() % 20001) - 10000]); } return [n, e]; }', expected: [-87965156, 4], timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minSpanningForest(n, edges) {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const uf = new UnionFind(n);
  let total = 0;
  for (const [u, v, w] of sorted) {
    if (uf.union(u, v)) total += w;   // joins two components → part of the forest
  }
  return [total, uf.count];           // count = number of components left
}`,
  },
  dryRun: {
    columns: ['edge (sorted)', 'union?', 'total', 'uf.count'],
    rows: [
      ['start', '—', '0', '5'],
      ['[1,2,1]', 'yes', '1', '4'],
      ['[0,2,2]', 'yes', '3', '3'],
      ['[0,1,3]', 'no (cycle)', '3', '3'],
      ['[3,4,7]', 'yes', '10', '2'],
    ],
  },
  complexity: { time: 'O(m log m)', space: 'O(n + m)', explanation: 'One sort plus m near-constant Union Find operations.' },
  alternative: {
    title: 'Prim restarted per component',
    md: 'Loop over nodes; whenever one is not in any tree yet, start a fresh heap Prim from it and count a new component. Same O(m log m), more code.',
    complexity: 'O(m log m) time',
  },
  mistakes: [
    'Keeping the `used === n - 1` early exit — it never triggers in a disconnected graph, but a -1 return would be wrong here.',
    'Counting components separately with DFS when `uf.count` already has it.',
    'Treating isolated nodes as errors — they are components with zero edges.',
  ],
};
