export default {
  signals: [
    '"minimum edges to add so every node reaches every other" → count sources/sinks of the SCC DAG',
    'boolean choices with "at least one of a, b" constraints → 2-SAT',
    '"assign workers to jobs / students to seats, max pairs" → bipartite matching',
    '"k-th ancestor" or "lowest common ancestor" with many queries → binary lifting',
    '"minimum days/cells to disconnect the island" → answer is 0, 1 or 2',
    '"minimum edges to remove to separate s from t" → max flow = min cut',
    'directed graph with cycles but you need DP over it → condense SCCs first',
  ],
  tricks: [
    {
      title: 'Make a digraph strongly connected with max(sources, sinks) edges',
      kind: 'recognition',
      md: 'Compress the SCCs into a DAG and count the components with in-degree 0 (sources) and out-degree 0 (sinks). The minimum number of edges to add is `max(sources, sinks)`. It is 0 if there is only one SCC, because then that SCC is both a source and a sink. You can always add an edge from a sink to a source, and each edge fixes at most one of each.',
    },
    {
      title: '2-SAT is an SCC problem',
      kind: 'recognition',
      md: 'Turn each clause (a OR b) into two implications: ¬a → b and ¬b → a. A solution exists exactly when no variable x is in the same SCC as ¬x. To build an assignment, order the SCCs topologically and set x = true when x\'s component comes **after** ¬x\'s. Look for it when each item has two options and the rules are about pairs ("these two can\'t both be on").',
    },
    {
      title: 'Binary lifting for k-th ancestor and LCA',
      kind: 'template',
      md: 'Store `up[j][v]`, the 2^j-th ancestor of v, built as `up[j][v] = up[j-1][up[j-1][v]]`. A k-th ancestor query then uses the set bits of k, so it takes O(log n) jumps. For LCA, first lift the deeper node to the same depth. Then jump both nodes together from the highest level down, but only while their ancestors differ.',
      code: `function buildLift(parent) {               // parent[root] = root
  const n = parent.length, LOG = Math.max(1, Math.ceil(Math.log2(n)));
  const up = [Int32Array.from(parent)];
  for (let j = 1; j <= LOG; j++) up.push(up[j - 1].map((v) => up[j - 1][v]));
  return (v, k) => {
    for (let j = 0; k > 0 && j <= LOG; j++, k >>= 1) if (k & 1) v = up[j][v];
    return k > 0 ? -1 : v;                    // -1: k bigger than the table covers
  };
}
const kth = buildLift([0, 0, 1, 2, 3]);       // chain 0-1-2-3-4
console.log(kth(4, 3), kth(4, 4)); // 1 0`,
    },
    {
      title: 'Kuhn\'s augmenting-path matching',
      kind: 'template',
      md: 'For each left vertex, run a DFS looking for a free right vertex. If a right vertex is already taken, try to move its current partner somewhere else. Every success adds one pair. It is O(V·E), fine for interview sizes (≤ ~500 per side). Start from the smaller side. Greedily matching obvious pairs first often speeds it up a lot.',
      code: `function maxMatching(adj, nRight) {          // adj[l] = right neighbours of l
  const matchR = new Int32Array(nRight).fill(-1);
  let seen;
  const tryKuhn = (l) => {
    for (const r of adj[l]) {
      if (seen[r]) continue; seen[r] = 1;
      if (matchR[r] === -1 || tryKuhn(matchR[r])) { matchR[r] = l; return true; }
    }
    return false;
  };
  let size = 0;
  for (let l = 0; l < adj.length; l++) { seen = new Uint8Array(nRight); if (tryKuhn(l)) size++; }
  return size;
}
console.log(maxMatching([[0, 1], [0], [1, 2]], 3)); // 3`,
    },
    {
      title: 'Disconnecting a grid island never needs more than 2 removals',
      kind: 'recognition',
      md: 'Any corner-most land cell has at most two land neighbours, so removing those two cuts it off. So the answer is 0 (already disconnected or empty), 1 (some cell is a cut vertex), or 2. You can test "1" by brute force, removing each cell and re-counting islands (O((RC)²) for small grids), or with an articulation-point DFS in O(RC).',
    },
    {
      title: 'Min cut = max flow (Menger)',
      kind: 'recognition',
      md: 'The minimum number of edges to remove to separate s from t equals the maximum number of edge-disjoint s→t paths, which is a max flow with capacity 1 per edge. For **vertex** cuts, split each vertex v into v_in → v_out with capacity 1. You rarely implement this in a coding round, but naming it shows you know the problem has a clean polynomial solution.',
    },
    {
      title: 'Condense SCCs, then do DAG DP',
      kind: 'template',
      md: 'Cycles break "longest path" or "max coins collected" DP. Inside an SCC you can visit every node, so first add up each SCC\'s values into one super-node, build the DAG of components, and run a topological DP over it. Kosaraju already outputs the SCCs in topological order (its second pass finds them source-first), so you get the order for free.',
    },
    {
      title: 'JS recursion depth is a hard limit on judges',
      kind: 'javascript',
      md: 'Node\'s default stack overflows somewhere around 10k frames, depending on frame size. `node --stack-size=...` helps locally, but you can\'t pass flags on most judges or in the browser. For Tarjan, Kosaraju or Hierholzer on 10^5 nodes, use an explicit stack of `[node, edgeIndex]` frames, or run the DFS on a "path graph" test (0→1→2→…) to see whether your code crashes.',
      code: `function depth(n) {                          // a path 0-1-...-n-1, recursive DFS
  const go = (u) => (u === n - 1 ? 1 : 1 + go(u + 1));
  try { return go(0); } catch (e) { return e instanceof RangeError ? 'stack overflow' : e; }
}
console.log(depth(1000), depth(1e6)); // 1000 stack overflow`,
    },
    {
      title: 'Prefer Kosaraju when you code from memory',
      kind: 'interview',
      md: 'Tarjan\'s SCC algorithm uses one pass but keeps low-links, an on-stack flag and a stack together, and it is easy to mix it up with the bridge version. Kosaraju is two ordinary DFS passes (finish order, then the transposed graph), and its correctness fits in one sentence. Both are O(V + E). Say this choice out loud and it sounds like a deliberate trade-off.',
    },
  ],
  traps: [
    { looksLike: 'Remove each edge and re-check connectivity (bridges)', actually: 'Low-link DFS', why: 'brute force is O(E·(V + E)); one DFS finds every bridge in O(V + E)' },
    { looksLike: 'SCCs in an undirected graph', actually: 'Connected components (or biconnected components)', why: 'in undirected graphs reachability is symmetric, so "strongly connected" is just connected' },
    { looksLike: 'Euler path (use every edge once)', actually: 'Hamiltonian path (visit every node once) when the wording says nodes', why: 'Euler is linear with Hierholzer; Hamiltonian is NP-hard → bitmask DP for n ≤ 20' },
    { looksLike: 'Greedy pairing for maximum matching', actually: 'Augmenting paths (Kuhn / Hopcroft-Karp)', why: 'an early greedy pair can block two later ones; augmenting paths can undo it' },
  ],
  sources: [
    { label: 'CP-Algorithms — Finding bridges', url: 'https://cp-algorithms.com/graph/bridge-searching.html' },
    { label: 'CP-Algorithms — 2-SAT', url: 'https://cp-algorithms.com/graph/2SAT.html' },
    { label: 'CP-Algorithms — Kuhn\'s bipartite matching', url: 'https://cp-algorithms.com/graph/kuhn_maximum_bipartite_matching.html' },
    { label: 'CP-Algorithms — LCA with binary lifting', url: 'https://cp-algorithms.com/graph/lca_binary_lifting.html' },
  ],
};
