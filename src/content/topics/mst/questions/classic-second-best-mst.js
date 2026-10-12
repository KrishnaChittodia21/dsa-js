export default {
  id: 'classic-second-best-mst',
  title: 'Second-Best Minimum Spanning Tree',
  difficulty: 'Hard',
  order: 3,
  pattern: 'mst-edge-classification',
  tags: ['graph', 'minimum spanning tree', 'union find', 'tree path maximum'],
  source: { platform: 'Classic', note: 'Classic exercise (CLRS Problem 23-1, strict variant): weight of the cheapest spanning tree strictly heavier than the MST.' },

  statement: `You are given an undirected weighted graph with \`n\` nodes (\`0\` … \`n - 1\`) and \`edges[i] = [u, v, w]\`. It may contain parallel edges and self-loops.

Let \`best\` be the weight of a minimum spanning tree. Return the **smallest total weight of a spanning tree that is strictly greater than \`best\`**.

Return \`-1\` if the graph is disconnected, or if every spanning tree has weight exactly \`best\` (or there is only one spanning tree).`,
  examples: [
    { input: 'n = 3, edges = [[0,1,1],[1,2,2],[0,2,3]]', output: '4', explanation: 'MST = 3 (edges 1 and 2). Swapping 1–2 for 0–2 gives 1 + 3 = 4.' },
    { input: 'n = 3, edges = [[0,1,1],[1,2,1],[0,2,1]]', output: '-1', explanation: 'All three spanning trees weigh 2.' },
    { input: 'n = 4, edges = [[0,1,1],[1,2,2],[2,3,3]]', output: '-1', explanation: 'The graph is itself a tree — only one spanning tree exists.' },
  ],
  constraints: ['1 <= n <= 300', '0 <= edges.length <= 3000', '-10^4 <= w <= 10^4'],

  think: `- A second-best tree differs from some MST in how many edges? (Try to argue it is exactly one swap.)
- If you add a non-tree edge (u, v, w) to the MST, a cycle appears. Which tree edge should you remove to keep the total as small as possible?
- What goes wrong when that removed edge has the same weight as w?`,
  patternChallenge: {
    options: ['Run Kruskal twice with a random tie-break', 'Dijkstra from every node', 'MST + best single edge swap using the maximum edge on tree paths', 'Enumerate all subsets of n − 1 edges'],
    answer: 2,
    explanation: 'A second-best spanning tree can always be obtained from an MST by one swap: add a non-tree edge, remove an edge on the cycle it creates. Precomputing the largest (and strictly second-largest) edge on every tree path makes each swap O(1). Random tie-breaks just produce other MSTs of the same weight; Dijkstra is unrelated; subset enumeration is exponential.',
  },
  hints: [
    'Build one MST with Kruskal and remember which edges it used. For every pair (s, t), compute the largest edge on the tree path s → t — a DFS from each node over the tree is O(n) each, O(n²) total.',
    'For strictness also track the largest path edge that is strictly smaller than the maximum. For a non-tree edge (u, v, w): if w > max1, candidate = best − max1 + w; else if w === max1 and max2 exists, candidate = best − max2 + w. Take the minimum.',
  ],
  approach: `**Brute force:** enumerate all spanning trees — exponential. A better brute force: for each MST edge, ban it and rerun Kruskal; the minimum over those runs is the best tree *different* from this MST, but it may still equal \`best\` when ties exist, so it does not directly give the strict answer.

**MST + one swap:**
1. Kruskal → \`best\`, the set of tree edges, and a tree adjacency list. Disconnected → -1.
2. From every node s, DFS the tree carrying \`(max1, max2)\` = largest and strictly-second-largest edge weight on the path from s. Store \`M1[s][t]\`, \`M2[s][t]\`. O(n²).
3. For every non-tree edge (u, v, w) with u ≠ v: by the cycle property w ≥ M1[u][v].
   - w > M1 → swap out the max edge: \`best − M1 + w\` (strictly greater).
   - w === M1 → swapping M1 changes nothing; swap the strictly smaller M2 instead (if it exists): \`best − M2 + w\`.
4. Answer = minimum candidate, or -1 if there is none.

Why one swap suffices: take any second-best tree T₂ and an MST T; a classic exchange argument shows some MST differs from T₂ in exactly one edge pair, so trying every "add one non-tree edge, remove one tree edge on its cycle" covers T₂.`,

  functionName: 'secondBestMst',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges  [u, v, w]
 * @return {number}
 */
function secondBestMst(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'MST = 3; swapping 1–2 for 0–2 gives 4.', args: [3, [[0, 1, 1], [1, 2, 2], [0, 2, 3]]], expected: 4 },
    { scenario: 'Example 2', hint: 'All three spanning trees weigh 2, so nothing is strictly greater: -1.', args: [3, [[0, 1, 1], [1, 2, 1], [0, 2, 1]]], expected: -1 },
    { scenario: 'Example 3', hint: 'The graph is itself a tree — only one spanning tree exists.', args: [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3]]], expected: -1 },
    { scenario: 'Single node', hint: 'One node has only the empty tree: -1.', args: [1, []], expected: -1 },
    { scenario: 'Disconnected graph', hint: 'No spanning tree at all: -1.', args: [3, [[0, 1, 1]]], expected: -1 },
    { scenario: 'Parallel edge and self-loop', hint: 'The heavier parallel edge gives 5; the self-loop never creates a cycle through the tree.', args: [2, [[0, 1, 3], [0, 1, 5], [1, 1, 0]]], expected: 5 },
    { scenario: 'Self-loop only extra edge', hint: 'A self-loop is not a swap candidate, so the tree is still the only spanning tree.', args: [2, [[0, 1, 4], [0, 0, 1]]], expected: -1 },
    { scenario: 'Strictly greater, not equal', hint: 'Swapping a weight-2 edge for another weight-2 edge gives another MST (5), not the answer — the next strictly larger weight is 6.', args: [4, [[0, 1, 1], [1, 2, 2], [2, 3, 2], [0, 3, 2]]], expected: 6 },
    { scenario: 'Needs strict second max', hint: 'The only non-tree edge 0–2 (weight 2) ties the max on its cycle; you must swap out the strictly smaller edge (1) to get 4.', args: [3, [[0, 1, 1], [1, 2, 2], [0, 2, 2]]], expected: 4 },
    { scenario: 'Equal-weight triangle plus edges', hint: 'Ties among the light edges do not matter; the strictly larger tree swaps a heavier edge in.', args: [4, [[0, 1, 1], [1, 2, 1], [0, 2, 1], [2, 3, 5], [0, 3, 7]]], expected: 9 },
    { scenario: 'Five-node mixed graph', hint: 'Try every non-tree edge and remove the best tree edge on its cycle.', args: [5, [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]]], expected: 13 },
    { scenario: 'Negative weights', hint: 'Negative weights work the same way; the answer can be any integer.', args: [5, [[0, 1, -3], [1, 2, 4], [2, 3, 4], [3, 4, 1], [0, 4, 4], [1, 3, 6], [0, 2, 10]]], expected: 8 },
    { scenario: 'Large graph (m = 3000)', hint: 'Enumerating spanning trees is exponential; one MST plus precomputed path maxima is O(n² + m log m).', argsGen: '() => { let x = 2468; const r = () => (x = (x * 48271) % 2147483647); const n = 300, e = []; for (let i = 1; i < n; i++) e.push([r() % i, i, (r() % 20001) - 10000]); while (e.length < 3000) e.push([r() % n, r() % n, (r() % 20001) - 10000]); return [n, e]; }', expected: -2627132, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function secondBestMst(n, edges) {
  // 1. Kruskal: MST weight + which edges were used
  const order = edges.map((_, i) => i).sort((a, b) => edges[a][2] - edges[b][2]);
  const uf = new UnionFind(n);
  const inTree = new Uint8Array(edges.length);
  const adj = Array.from({ length: n }, () => []);
  let best = 0;
  for (const i of order) {
    const [u, v, w] = edges[i];
    if (uf.union(u, v)) {
      inTree[i] = 1;
      best += w;
      adj[u].push([v, w]);
      adj[v].push([u, w]);
    }
  }
  if (uf.count !== 1) return -1;              // disconnected

  // 2. For every source, largest (M1) and strictly second-largest (M2) edge on tree paths
  const M1 = Array.from({ length: n }, () => new Array(n).fill(-Infinity));
  const M2 = Array.from({ length: n }, () => new Array(n).fill(-Infinity));
  for (let s = 0; s < n; s++) {
    const stack = [[s, -1, -Infinity, -Infinity]];
    while (stack.length) {
      const [u, parent, m1, m2] = stack.pop();
      M1[s][u] = m1;
      M2[s][u] = m2;
      for (const [v, w] of adj[u]) {
        if (v === parent) continue;
        let a = m1, b = m2;                   // push w into the (max, strict second max) pair
        if (w > a) { b = a; a = w; }
        else if (w < a && w > b) b = w;
        stack.push([v, u, a, b]);
      }
    }
  }

  // 3. Try every single swap
  let answer = Infinity;
  for (let i = 0; i < edges.length; i++) {
    if (inTree[i]) continue;
    const [u, v, w] = edges[i];
    if (u === v) continue;                    // a self-loop never helps
    if (w > M1[u][v]) answer = Math.min(answer, best - M1[u][v] + w);
    else if (M2[u][v] !== -Infinity) answer = Math.min(answer, best - M2[u][v] + w);
  }
  return answer === Infinity ? -1 : answer;
}`,
    explanation: 'The DFS over the tree uses an explicit stack (no recursion depth issues). Tree paths are unique, so the parent check is enough to avoid revisiting.',
  },
  dryRun: {
    columns: ['non-tree edge', 'tree path', 'M1', 'M2', 'candidate'],
    rows: [
      ['0–1 (4)', '0–2–1: {1, 2}', '2', '1', 'w > M1 → 11 − 2 + 4 = 13'],
      ['2–3 (8)', '2–1–3: {2, 5}', '5', '2', 'w > M1 → 11 − 5 + 8 = 14'],
      ['answer', '', '', '', 'min = 13'],
    ],
    note: 'Village graph, MST = {0–2 (1), 1–2 (2), 3–4 (3), 1–3 (5)}, best = 11.',
  },
  complexity: { time: 'O(m log m + n² + m)', space: 'O(n²)', explanation: 'Kruskal O(m log m); n tree DFS runs of O(n) each fill the n×n tables; each non-tree edge is then O(1).' },
  alternative: {
    title: 'Binary lifting (LCA) for large n',
    md: 'Replace the O(n²) tables with binary lifting: up[k][v] plus the top-two edge weights on each 2^k jump. Each path query becomes O(log n), total O(m log n) time and O(n log n) memory — needed when n is 10^5.',
    complexity: 'O(m log n) time, O(n log n) space',
  },
  mistakes: [
    'Swapping with an edge of equal weight and reporting best — the problem asks for STRICTLY greater.',
    'Tracking only the maximum edge on the path; you also need the strict second maximum for ties.',
    'Using a self-loop as a swap candidate (it creates no cycle through the tree).',
    'Forgetting the disconnected and "graph is already a tree" cases (-1).',
  ],
};
