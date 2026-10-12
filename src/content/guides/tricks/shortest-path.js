export default {
  signals: [
    '"maximum probability path" → Dijkstra that keeps the largest product',
    '"minimum changes to arrows/signs to reach the end" → change = cost 1, follow = cost 0 → 0-1 BFS',
    '"second minimum time / k-th shortest path" → let each node be finalised up to k times',
    '"is this edge/node on some shortest path?" → one search from the source + one from the target',
    'small n (≤ 100–400) with many distance queries → Floyd-Warshall once, then O(1) lookups',
    'graph defined by rules (operations on a number, jumps) → BFS over values',
    'edge weights are small integers (≤ 10) → bucket queue',
  ],
  tricks: [
    {
      title: 'Search from both ends to test "is it on a shortest path?"',
      kind: 'recognition',
      md: 'Run Dijkstra (or BFS) from the source to get `dS`, and from the target on the **reversed** graph to get `dT`. A vertex v lies on some shortest path exactly when `dS[v] + dT[v] === dS[t]`. An edge (u, v, w) lies on one when `dS[u] + w + dT[v] === dS[t]`. The same two arrays answer "shortest path that must pass through X": it is `dS[X] + dT[X]`.',
    },
    {
      title: 'Dense graph? Use the O(V²) Dijkstra with no heap',
      kind: 'optimization',
      md: 'When E is close to V² (complete graphs, adjacency matrices, V ≤ ~2000), scan an array for the closest unvisited vertex instead of using a heap. That is O(V² + E), which beats O(E log V) here. It also needs no heap class in JavaScript, so there is less to write and fewer chances for bugs.',
      code: `function dijkstraDense(w, src) {            // w[i][j] = Infinity if no edge
  const n = w.length, dist = new Array(n).fill(Infinity), done = new Uint8Array(n);
  dist[src] = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;
    if (dist[u] === Infinity) break;
    done[u] = 1;
    for (let v = 0; v < n; v++) if (dist[u] + w[u][v] < dist[v]) dist[v] = dist[u] + w[u][v];
  }
  return dist;
}
console.log(dijkstraDense([[0, 4, 1], [4, 0, 2], [1, 2, 0]], 0)); // [ 0, 3, 1 ]`,
    },
    {
      title: 'Stop when the target is popped, not when it is pushed',
      kind: 'template',
      md: 'In Dijkstra, a distance is final only when the node is **popped** (if the stale check passes). A node you just pushed may still get a shorter path later. So `if (u === target) return d;` goes right after the stale-entry check. This early exit can save most of the work on a large graph when the target is close.',
    },
    {
      title: 'Second-best or k-th shortest: let each node be popped k times',
      kind: 'template',
      md: 'Keep a counter `pops[v]`. Skip a popped entry once `pops[v] === k`. Otherwise increase the counter and relax all edges again. The k-th time the target is popped, you have the k-th shortest walk. For "second minimum (strictly greater)" keep `d1[v]` and `d2[v]` and only accept a new value into d2 if it is strictly greater than d1.',
    },
    {
      title: 'Max-probability path is still Dijkstra',
      kind: 'recognition',
      md: 'Each probability is ≤ 1, so extending a path can never raise its probability. That is the same property as non-negative weights. Use a max-heap on the product and the usual stale check. If you want to reuse min-Dijkstra unchanged, use weights `-Math.log(p)`. They are non-negative, and products become sums.',
    },
    {
      title: 'Infinity does not overflow in JS',
      kind: 'javascript',
      md: '`Infinity + 5` is `Infinity` and `Infinity + (-3)` is still `Infinity`, so you never get the C++ bug where INT_MAX + w wraps to a negative number. `dist.fill(Infinity)` is safe to relax against. Two things to watch: `Infinity - Infinity` is `NaN`, and the output usually wants `-1`, so map it at the end with `d === Infinity ? -1 : d`.',
      code: `const dist = [0, Infinity, 7];
console.log(Infinity + 5 < Infinity, Infinity + -3 === Infinity); // false true
console.log(Infinity - Infinity);                                  // NaN
console.log(dist.map((d) => (d === Infinity ? -1 : d)));           // [ 0, -1, 7 ]`,
    },
    {
      title: 'Bucket queue (Dial) for small integer weights',
      kind: 'optimization',
      md: 'If every weight is an integer in 0..k, the distances still waiting are all within k of the current one. Keep k + 1 buckets indexed by `dist % (k + 1)` and pop from them in a cycle. This is O(V·k + E) with no heap. 0-1 BFS is the special case k = 1. In JS it is just an array of arrays plus a pointer.',
    },
    {
      title: 'Negative cycles in Floyd-Warshall: look at the diagonal',
      kind: 'edge-cases',
      md: 'After Floyd-Warshall, `d[i][i] < 0` means i is on a negative cycle. Any pair (a, b) with a path a → i → b has no shortest path (it is −∞). For Bellman-Ford, run one extra (V-th) round: if anything still relaxes, a negative cycle can be reached from the source. Always start the diagonal at `d[i][i] = 0`, or self-distances come out wrong.',
      code: `const I = Infinity;
const d = [[0, 1, I], [I, 0, -2], [0, I, 0]];          // cycle 0→1→2→0 of weight -1
const n = d.length;
for (let k = 0; k < n; k++)
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
console.log([0, 1, 2].some((i) => d[i][i] < 0)); // true`,
    },
    {
      title: 'Put waiting rules into the edge cost',
      kind: 'recognition',
      md: 'In timetable problems (traffic lights, buses that leave every p minutes) the edge cost depends on when you arrive. Dijkstra still works if arriving earlier never makes you leave later (the "FIFO" property). Compute the departure time inside the relaxation, e.g. `depart = Math.ceil(t / p) * p`. Explaining this in an interview shows you know why Dijkstra is correct, not just its code.',
    },
    {
      title: 'Ask "how many sources and targets?" first',
      kind: 'interview',
      md: 'One source to everything: Dijkstra or BFS. Everything to one target: run it from the target on the reversed graph. Many sources: add a virtual super-source with 0-cost edges. All pairs with small V: Floyd-Warshall. If you ask this before naming an algorithm, you usually turn V separate searches into one.',
    },
  ],
  traps: [
    { looksLike: 'Dijkstra on a grid with only right/down moves', actually: 'Grid DP', why: 'right/down moves make a DAG, so one pass in row-major order is exact and O(R·C) without a heap' },
    { looksLike: 'Longest simple path via negated weights', actually: 'Topological DP (DAG) or bitmask DP (small n)', why: 'longest simple path is NP-hard in general; negated weights create negative cycles' },
    { looksLike: 'Bellman-Ford because the costs are multiplied', actually: 'Dijkstra with max-product (or −log p)', why: 'probabilities ≤ 1 only shrink along a path, which is the same as non-negative weights' },
    { looksLike: 'BFS on a weighted graph whose weights are 0 or 1', actually: '0-1 BFS with a deque', why: 'plain BFS ignores weight 0, so it counts edges instead of cost' },
  ],
  sources: [
    { label: 'CP-Algorithms — Dijkstra on sparse graphs', url: 'https://cp-algorithms.com/graph/dijkstra_sparse.html' },
    { label: 'CP-Algorithms — 0-1 BFS (and Dial buckets)', url: 'https://cp-algorithms.com/graph/01_bfs.html' },
    { label: 'CP-Algorithms — BFS applications (edges on shortest paths)', url: 'https://cp-algorithms.com/graph/breadth-first-search.html' },
  ],
};
