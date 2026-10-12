export default {
  signals: [
    '"maximum spanning tree" / "keep the strongest links" → same algorithm, sort descending',
    '"split into k clusters so the closest two clusters are as far apart as possible"',
    '"minimize the largest edge you must use between u and v" (bottleneck) for many pairs',
    'some edges are mandatory → add them before running the greedy',
    '"remove the most edges so that Alice and Bob can still reach every node" → shared edges first',
    'points on a plane with all pairs connectable → complete graph, think about density',
  ],
  tricks: [
    {
      title: 'Maximum spanning tree = flip the comparator',
      kind: 'recognition',
      md: 'The cut and cycle properties work just as well with "heaviest" in place of "lightest". So Kruskal with `(a, b) => b[2] - a[2]`, or Prim with a max-heap, gives the maximum spanning tree. You can also negate every weight and reuse your min code unchanged.',
    },
    {
      title: 'k-clustering: stop Kruskal at k components',
      kind: 'template',
      md: 'Run Kruskal but stop once only k groups remain. The next edge that would join two **different** groups is the largest possible minimum distance between clusters. The reason is that Kruskal has already merged everything closer than that edge. This is "single-linkage clustering", and it often appears in interviews disguised as a grouping problem.',
      code: `function maxSpacing(n, edges, k) {
  const p = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (p[x] === x ? x : (p[x] = find(p[x])));
  edges.sort((a, b) => a[2] - b[2]);
  let groups = n;
  for (const [u, v, w] of edges) {
    const ru = find(u), rv = find(v);
    if (ru === rv) continue;
    if (groups === k) return w;              // first edge that would join two clusters
    p[ru] = rv; groups--;
  }
  return Infinity;
}
console.log(maxSpacing(4, [[0, 1, 1], [2, 3, 2], [1, 2, 10], [0, 3, 12]], 2)); // 10`,
    },
    {
      title: 'Mandatory edges: union them first',
      kind: 'template',
      md: 'If some edges must be in the tree, union them into the DSU and add their weights before the main loop. Kruskal then fills in the cheapest remaining edges. The same idea classifies edges: an edge is **critical** if leaving it out makes the cost go up (or disconnects the graph), and **pseudo-critical** if forcing it in keeps the cost the same.',
    },
    {
      title: 'The MST answers bottleneck queries for every pair',
      kind: 'recognition',
      md: 'For any two nodes, the path between them in the MST has the smallest possible largest edge among all paths in the graph (the minimax property). So "what is the minimum possible worst edge between u and v" for many pairs becomes: build the MST once, then query paths in the tree (by DFS, or binary lifting when there are many queries). Offline, you can also sort queries by limit and use a DSU.',
    },
    {
      title: 'Sort weights fast with a packed typed array',
      kind: 'javascript',
      md: '`Float64Array.prototype.sort()` sorts **numerically** by default and with no comparator callback, unlike `Array.prototype.sort()`, which compares as strings. Pack `weight * 2^20 + edgeIndex` into one number (keep it below 2^53), sort, then unpack. With 10^6 edges this avoids a million comparator calls and an array of small arrays.',
      code: `const edges = [[0, 1, 7], [1, 2, 3], [0, 2, 5]];
const SHIFT = 2 ** 20;                                  // edge count < 2^20
const keys = new Float64Array(edges.length);
edges.forEach(([, , w], i) => { keys[i] = w * SHIFT + i; });
keys.sort();                                            // numeric, no callback
const order = Array.from(keys, (k) => k % SHIFT);
console.log(order); // [ 1, 2, 0 ]`,
    },
    {
      title: 'Count the edges before choosing Kruskal or Prim',
      kind: 'optimization',
      md: 'For n points with every pair allowed there are n(n−1)/2 edges. With n = 1000 that is about 500k edges, so sorting them with Kruskal is fine. With n = 10^4 it is 5·10^7 edges, which is too much memory in JS. Then O(n²) array Prim, computing distances on the fly, is the only practical choice. Do this arithmetic out loud.',
    },
    {
      title: 'Alice & Bob: shared edges first, two DSUs',
      kind: 'recognition',
      md: 'When edges are of type "Alice only", "Bob only", or "both", go through the "both" edges first and union them in **both** DSUs. A shared edge does the work of two separate ones, so using it first never hurts. Then add each person\'s own edges to that person\'s DSU. The edges you can remove = total − edges used. Return -1 if either DSU ends with more than one component.',
    },
    {
      title: 'Ties: the cost is the same in every MST',
      kind: 'edge-cases',
      md: 'With equal weights there can be many MSTs, but they all have the same total weight. In fact, they all use the same multiset of weights. So when testing, compare totals, not edge lists. If all weights are distinct, the MST is unique. That is a quick way to answer "is the MST unique?" when the weights happen to be distinct.',
    },
  ],
  traps: [
    { looksLike: 'MST on a directed graph', actually: 'Minimum arborescence (Chu-Liu/Edmonds)', why: 'Kruskal and Prim assume undirected edges; in a directed graph the cheapest edge can point the wrong way' },
    { looksLike: 'MST when only some nodes must be connected', actually: 'Steiner tree (bitmask DP over terminals for small k)', why: 'an MST over all nodes pays for nodes you did not need; the general Steiner problem is NP-hard' },
    { looksLike: 'Kruskal over all pairs of 10^4 points', actually: 'Dense O(n²) Prim', why: '5·10^7 edge arrays exhaust memory and sorting time in JS' },
    { looksLike: 'Binary search + BFS for one bottleneck query', actually: 'Fine for one query; MST for many', why: 'the MST answers every pair\'s minimax path from a single build' },
  ],
  sources: [
    { label: 'CP-Algorithms — Kruskal with DSU', url: 'https://cp-algorithms.com/graph/mst_kruskal_with_dsu.html' },
    { label: 'CP-Algorithms — Prim (dense vs sparse)', url: 'https://cp-algorithms.com/graph/mst_prim.html' },
    { label: 'MDN — TypedArray.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/sort' },
  ],
};
