export default {
  id: 'optimize-water-distribution-in-a-village',
  title: 'Optimize Water Distribution in a Village',
  difficulty: 'Hard',
  order: 1,
  pattern: 'mst-virtual-node',
  tags: ['graph', 'minimum spanning tree', 'union find', 'virtual node'],
  source: { platform: 'LeetCode', number: 1168, url: 'https://leetcode.com/problems/optimize-water-distribution-in-a-village/', premium: true },

  statement: `A village has \`n\` houses numbered \`1\` to \`n\`. Every house needs water. For each house \`i\` you can either:

- **build a well** inside it for \`wells[i - 1]\`, or
- **lay a pipe** from another house that has water. \`pipes[j] = [house1, house2, cost]\` means a two-way pipe between those houses costs \`cost\`. There may be several pipes between the same pair with different costs.

Return the minimum total cost to supply water to every house.`,
  examples: [
    { input: 'n = 3, wells = [1,2,2], pipes = [[1,2,1],[2,3,1]]', output: '3', explanation: 'Build a well at house 1 (1) and pipes 1–2 (1) and 2–3 (1).' },
    { input: 'n = 2, wells = [1,1], pipes = [[1,2,1],[1,2,2]]', output: '2', explanation: 'Either two wells, or one well plus the cheap pipe — both cost 2.' },
  ],
  constraints: ['2 <= n <= 10^4', 'wells.length == n', '0 <= wells[i] <= 10^5', '1 <= pipes.length <= 10^4', '1 <= house1, house2 <= n', '0 <= cost <= 10^5', 'house1 != house2'],

  think: `- If wells did not exist, which classic problem would this be?
- A well is a cost attached to a node, not an edge. Could you turn it into an edge to *something*?
- Is "build exactly one well at the cheapest house" always optimal?`,
  patternChallenge: {
    options: ['Dijkstra from the cheapest well', 'MST with a virtual water-source node', 'Greedy: one well at the cheapest house + MST of pipes', 'Dynamic programming over houses'],
    answer: 1,
    explanation: 'Add node 0 = "the water source" and an edge 0–i of weight wells[i−1]. Every valid plan is a spanning tree of the n + 1 nodes, so the answer is that MST. One well + MST of pipes fails when two far-apart cheap wells beat one long pipe; Dijkstra measures distances, not total cost; there is no linear DP structure.',
  },
  hints: [
    'Invent house 0 — a river. Building a well at house i = laying a "pipe" from house 0 to house i costing wells[i − 1].',
    'Run Kruskal over pipes plus these n new edges with a Union Find of size n + 1. You need exactly n accepted edges.',
  ],
  approach: `**Brute force:** try every subset of houses that get wells, then connect the rest with the cheapest pipes — 2^n subsets, far too slow.

**Virtual node + Kruskal:**
1. Edges = all pipes, plus \`[0, i, wells[i − 1]]\` for i = 1..n.
2. Sort by cost, Kruskal with \`new UnionFind(n + 1)\` (toolkit global).
3. Stop after n accepted edges (a tree on n + 1 nodes). The total is the answer.

Why it is exact: in any spanning tree of the enlarged graph, every house has a path to node 0; the house adjacent to 0 on that path builds a well and water flows along pipes to the rest. Conversely any valid plan (wells + pipes, without useless loops) is such a tree. So minimum plan = MST. The graph is always connected (every house has its well edge), so there is no -1 case.`,

  functionName: 'minCostToSupplyWater',
  paramNames: ['n', 'wells', 'pipes'],
  starterCode: `/**
 * @param {number} n
 * @param {number[]} wells
 * @param {number[][]} pipes
 * @return {number}
 */
function minCostToSupplyWater(n, wells, pipes) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'One well at house 1 plus two cheap pipes.', args: [3, [1, 2, 2], [[1, 2, 1], [2, 3, 1]]], expected: 3 },
    { scenario: 'Example 2', hint: 'Two wells or one well plus the cheap pipe — both cost 2.', args: [2, [1, 1], [[1, 2, 1], [1, 2, 2]]], expected: 2 },
    { scenario: 'Wells beat pipes', hint: 'The pipe costs 100; building a well in each house is cheaper.', args: [2, [1, 1], [[1, 2, 100]]], expected: 2 },
    { scenario: 'Cheap well at the end', hint: 'The cheapest well is at house 4; pipes carry its water to the rest.', args: [4, [10, 10, 10, 1], [[1, 2, 1], [2, 3, 1], [3, 4, 1]]], expected: 4 },
    { scenario: 'Free wells', hint: 'Wells can cost 0 — then no pipe is worth buying.', args: [3, [0, 0, 0], [[1, 2, 5], [2, 3, 5]]], expected: 0 },
    { scenario: 'Single well not enough', hint: 'Two separate pipe groups need two wells (5 + 5) plus two pipes. A plan with one well at the cheapest house cannot reach the other group.', args: [4, [5, 5, 5, 5], [[1, 2, 1], [3, 4, 1]]], expected: 12 },
    { scenario: 'Tree has n edges', hint: 'With the virtual source there are n + 1 nodes, so a full tree has n edges. Stopping at n − 1 leaves one house dry.', args: [3, [3, 7, 7], [[1, 2, 2], [1, 3, 2], [2, 3, 1]]], expected: 6 },
    { scenario: 'Parallel pipes', hint: 'Several pipes between the same houses: only the cheapest can matter.', args: [2, [10, 10], [[1, 2, 7], [2, 1, 3], [1, 2, 5]]], expected: 13 },
    { scenario: 'Last house uses index n', hint: 'House n must have its own Union Find slot: allocate n + 1 nodes (0 is the source).', args: [3, [9, 9, 1], [[3, 2, 1], [2, 1, 1]]], expected: 3 },
    { scenario: 'Random mid-size case', hint: 'Wells and pipes with large mixed costs.', args: [5, [46012, 72474, 64965, 751, 33304], [[2, 1, 6719], [3, 2, 75312], [5, 3, 44918]]], expected: 131704 },
    { scenario: 'Maximum costs', hint: 'Costs up to 10^5 for both wells and pipes.', args: [3, [100000, 100000, 100000], [[1, 2, 100000], [2, 3, 0]]], expected: 200000 },
    { scenario: 'Large village (n = 10^4)', hint: 'Add a virtual source with one edge per well and run Kruskal: O((n + m) log(n + m)).', argsGen: '() => { let x = 8642; const r = () => (x = (x * 48271) % 2147483647); const n = 10000, wells = Array.from({ length: n }, () => r() % 100001), pipes = []; while (pipes.length < 10000) { const a = 1 + r() % n, b = 1 + r() % n; if (a !== b) pipes.push([a, b, r() % 20001]); } return [n, wells, pipes]; }', expected: 142412062, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minCostToSupplyWater(n, wells, pipes) {
  const edges = pipes.map(([a, b, c]) => [a, b, c]);
  for (let i = 1; i <= n; i++) edges.push([0, i, wells[i - 1]]); // well = pipe from source 0
  edges.sort((x, y) => x[2] - y[2]);

  const uf = new UnionFind(n + 1);   // node 0 is the virtual water source
  let total = 0, used = 0;
  for (const [a, b, c] of edges) {
    if (!uf.union(a, b)) continue;
    total += c;
    if (++used === n) break;         // n + 1 nodes → n edges
  }
  return total;
}`,
  },
  dryRun: {
    columns: ['edge (sorted)', 'meaning', 'union?', 'total'],
    rows: [
      ['[0,1,1]', 'well at 1', 'yes', '1'],
      ['[1,2,1]', 'pipe 1–2', 'yes', '2'],
      ['[2,3,1]', 'pipe 2–3', 'yes', '3 (3 edges = n → stop)'],
    ],
    note: 'Ties are broken by sort order; any MST gives the same total.',
  },
  complexity: { time: 'O((n + m) log(n + m))', space: 'O(n + m)', explanation: 'n extra edges are added to m pipes; sorting dominates.' },
  alternative: {
    title: 'Prim from the virtual node',
    md: 'Start Prim at node 0: initially push `[wells[i-1], i]` for every house, then grow with pipe edges. Same result; Prim naturally "starts at the river".',
    complexity: 'O((n + m) log(n + m)) time',
  },
  mistakes: [
    'Greedily building one well at the cheapest house — misses multi-well solutions (test 7: two wells 5 + 5 plus two pipes).',
    'UnionFind(n) instead of UnionFind(n + 1) — node 0 and node n both need slots.',
    'Stopping at n − 1 edges: the enlarged graph has n + 1 nodes.',
  ],
};
