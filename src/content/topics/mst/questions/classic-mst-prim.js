export default {
  id: 'classic-mst-prim',
  title: "Minimum Spanning Tree from an Adjacency Matrix (Prim's Algorithm)",
  difficulty: 'Easy',
  order: 2,
  pattern: 'mst-prim',
  tags: ['graph', 'minimum spanning tree', 'heap', 'adjacency matrix'],
  source: { platform: 'Classic', note: "Textbook MST problem with matrix input; the natural fit for Prim's algorithm." },

  statement: `You are given an \`n × n\` symmetric matrix \`graph\` describing an undirected weighted graph: \`graph[i][j] > 0\` is the weight of the edge between \`i\` and \`j\`, and \`graph[i][j] === 0\` means **there is no edge**. The diagonal is always \`0\`.

Return the total weight of a minimum spanning tree, or \`-1\` if the graph is not connected.`,
  examples: [
    { input: 'graph = [[0,2,0,6,0],[2,0,3,8,5],[0,3,0,0,7],[6,8,0,0,9],[0,5,7,9,0]]', output: '16', explanation: 'Edges 0–1 (2), 1–2 (3), 1–4 (5), 0–3 (6).' },
    { input: 'graph = [[0,1,0],[1,0,0],[0,0,0]]', output: '-1', explanation: 'Node 2 has no edges.' },
    { input: 'graph = [[0]]', output: '0' },
  ],
  constraints: ['1 <= n <= 500', 'graph[i][j] === graph[j][i]', '0 <= graph[i][j] <= 10^5', 'graph[i][i] === 0'],

  think: `- Start from node 0. Which edge is certainly safe to add next?
- How do you get the cheapest edge leaving your current tree quickly?
- What should you do when you pop a node that is already in the tree?`,
  patternChallenge: {
    options: ['Floyd-Warshall', 'Topological sort', "Prim's algorithm", 'Binary search on the answer'],
    answer: 2,
    explanation: 'Matrix input + "connect everything cheaply" → grow a tree from one node with Prim. Floyd-Warshall computes all-pairs shortest paths; topological sort needs a DAG; nothing here is monotonic for binary search.',
  },
  hints: [
    'Keep `inTree[]`. Put `[0, 0]` (weight 0 to reach node 0) into a min-heap.',
    'Pop the cheapest entry; skip it if its node is already in the tree; otherwise add it and push `[graph[u][v], v]` for every v with a non-zero entry that is not in the tree.',
  ],
  approach: `**Brute force:** enumerate spanning trees — exponential.

**Prim (lazy heap):**
1. \`heap = new MinHeap(e => e[0])\` with entries \`[weight, node]\`; push \`[0, 0]\`.
2. Pop \`[w, u]\`. If \`inTree[u]\`, skip (a cheaper edge already brought u in). Else mark it, \`total += w\`, \`count++\`.
3. For every \`v\` with \`graph[u][v] > 0\` and not in the tree, push \`[graph[u][v], v]\`.
4. When the heap empties, \`count === n\` ? total : -1.

Correct by the cut property applied to the cut (tree, rest). Because the input is a matrix, scanning a row is O(n), so the dense O(n²) array version (no heap) is an equally good choice — see the alternative.`,

  functionName: 'mstPrim',
  paramNames: ['graph'],
  starterCode: `/**
 * @param {number[][]} graph  adjacency matrix, 0 = no edge
 * @return {number}
 */
function mstPrim(graph) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Edges 0–1 (2), 1–2 (3), 1–4 (5), 0–3 (6).', args: [[[0, 2, 0, 6, 0], [2, 0, 3, 8, 5], [0, 3, 0, 0, 7], [6, 8, 0, 0, 9], [0, 5, 7, 9, 0]]], expected: 16 },
    { scenario: 'Example 2', hint: 'Node 2 has no edges — the tree never reaches it, so return -1.', args: [[[0, 1, 0], [1, 0, 0], [0, 0, 0]]], expected: -1 },
    { scenario: 'Example 3', hint: 'A single node: total 0.', args: [[[0]]], expected: 0 },
    { scenario: 'Two nodes, one edge', hint: 'The only edge is the tree.', args: [[[0, 7], [7, 0]]], expected: 7 },
    { scenario: 'Two nodes, no edge', hint: 'A 0 entry means NO edge, not a free edge of weight 0 — this graph is disconnected.', args: [[[0, 0], [0, 0]]], expected: -1 },
    { scenario: 'Zero is not a free edge', hint: 'Treating 0 as weight 0 connects 0–2 for free and reports 1 instead of 11.', args: [[[0, 1, 0], [1, 0, 10], [0, 10, 0]]], expected: 11 },
    { scenario: 'Triangle of equal weights', hint: 'Any two edges; total 2.', args: [[[0, 1, 1], [1, 0, 1], [1, 1, 0]]], expected: 2 },
    { scenario: 'Push edge weight, not distance', hint: 'Pushing total + w (as in Dijkstra) picks the node closest to the START, not the cheapest edge out of the tree.', args: [[[0, 10, 1, 0], [10, 0, 1, 0], [1, 1, 0, 100], [0, 0, 100, 0]]], expected: 102 },
    { scenario: 'Mark on pop, not on push', hint: 'Marking node 2 when it is first pushed (via 0–2 = 10) locks in that expensive edge; a cheaper 1–2 edge appears later.', args: [[[0, 1, 10], [1, 0, 1], [10, 1, 0]]], expected: 2 },
    { scenario: 'Classic six-node graph', hint: 'A mid-sized sparse graph: grow the tree one cheapest crossing edge at a time.', args: [[[0, 4, 0, 0, 0, 0], [4, 0, 8, 0, 0, 0], [0, 8, 0, 7, 0, 4], [0, 0, 7, 0, 9, 14], [0, 0, 0, 9, 0, 10], [0, 0, 4, 14, 10, 0]]], expected: 32 },
    { scenario: 'Maximum weights', hint: 'Weights up to 10^5; the total still fits easily in a number.', args: [[[0, 100000, 100000], [100000, 0, 1], [100000, 1, 0]]], expected: 100001 },
    { scenario: 'Large dense graph (n = 500)', hint: 'Building an edge list and trying subsets is hopeless; Prim over the matrix is O(n²) or O(n² log n).', argsGen: '() => { let x = 1234; const r = () => (x = (x * 48271) % 2147483647); const n = 500, g = Array.from({ length: n }, () => new Array(n).fill(0)); for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const w = r() % 4 === 0 ? 0 : 1 + r() % 100000; g[i][j] = g[j][i] = w; } return [g]; }', expected: 159450, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function mstPrim(graph) {
  const n = graph.length;
  const inTree = new Uint8Array(n);
  const heap = new MinHeap((e) => e[0]);    // [weight, node]
  heap.push([0, 0]);
  let total = 0, count = 0;
  while (!heap.isEmpty() && count < n) {
    const [w, u] = heap.pop();
    if (inTree[u]) continue;                // stale entry
    inTree[u] = 1;                          // mark on pop
    total += w;
    count++;
    const row = graph[u];
    for (let v = 0; v < n; v++) {
      if (row[v] > 0 && !inTree[v]) heap.push([row[v], v]);
    }
  }
  return count === n ? total : -1;
}`,
  },
  dryRun: {
    columns: ['pop', 'action', 'pushes', 'total'],
    rows: [
      ['[0,0]', 'add 0', '[2,1] [6,3]', '0'],
      ['[2,1]', 'add 1', '[3,2] [8,3] [5,4]', '2'],
      ['[3,2]', 'add 2', '[7,4]', '5'],
      ['[5,4]', 'add 4', '[9,3]', '10'],
      ['[6,3]', 'add 3 → 5 nodes', '—', '16'],
    ],
  },
  complexity: { time: 'O(n² log n)', space: 'O(n²) heap in the worst case', explanation: 'Each node scans its row (O(n)) and may push up to n entries; total pushes O(n²), each O(log n). The dense variant below is O(n²) with O(n) space.' },
  alternative: {
    title: 'Dense Prim (arrays only)',
    md: 'Keep `minCost[v]`; each round pick the unvisited node with the smallest minCost by scanning, then relax its row. Perfect for matrices. If the picked minimum is Infinity, the graph is disconnected.',
    code: `function mstPrim(graph) {
  const n = graph.length, minCost = new Array(n).fill(Infinity), inTree = new Uint8Array(n);
  minCost[0] = 0;
  let total = 0;
  for (let r = 0; r < n; r++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!inTree[v] && (u === -1 || minCost[v] < minCost[u])) u = v;
    if (minCost[u] === Infinity) return -1;
    inTree[u] = 1; total += minCost[u];
    for (let v = 0; v < n; v++) if (!inTree[v] && graph[u][v] > 0 && graph[u][v] < minCost[v]) minCost[v] = graph[u][v];
  }
  return total;
}`,
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Treating a 0 entry as a free edge of weight 0 — here 0 means "no edge".',
    'Marking nodes when pushed instead of when popped.',
    'Pushing `total + w` (Dijkstra-style) instead of the edge weight `w`.',
    'Not detecting disconnection (count < n).',
  ],
};
