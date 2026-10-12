export default {
  signals: [
    '"minimum number of semesters / rounds" when independent tasks run in parallel',
    '"is there exactly one valid order?" (sequence reconstruction)',
    '"lexicographically smallest valid order"',
    'pairwise "a < b" facts between variables → check for a contradiction',
    'dependencies given as names (recipes, packages, build targets)',
    '"find all ancestors / everything that must happen first"',
    'two levels of ordering (items inside groups, groups among themselves)',
  ],
  tricks: [
    {
      title: 'Run Kahn layer by layer to count rounds',
      kind: 'template',
      md: 'Every node with in-degree 0 at the same moment can run in the same round. Take the whole queue as one layer, build the next layer, and count the layers. The count is the minimum number of semesters when there is no limit on tasks per round. A layer that comes back empty before all nodes are done means there is a cycle.',
      code: `function minRounds(n, edges) {          // edge [u, v]: u before v
  const adj = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
  for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }
  let layer = [], done = 0, rounds = 0;
  for (let i = 0; i < n; i++) if (indeg[i] === 0) layer.push(i);
  while (layer.length) {
    rounds++; done += layer.length;
    const next = [];
    for (const u of layer) for (const v of adj[u]) if (--indeg[v] === 0) next.push(v);
    layer = next;
  }
  return done === n ? rounds : -1;
}
console.log(minRounds(4, [[0, 1], [0, 2], [1, 3], [2, 3]])); // 3`,
    },
    {
      title: 'Order is unique ⇔ the queue never holds two nodes',
      kind: 'recognition',
      md: 'If Kahn\'s queue ever holds two nodes at once, either one could go next, so at least two valid orders exist. Another way to see it: the order is unique exactly when every pair of neighbours in the order is joined by an edge (the order is a Hamiltonian path). Use this for "sequence reconstruction" and for "can you tell the full ranking?" questions.',
    },
    {
      title: 'Use a min-heap instead of a queue for the smallest order',
      kind: 'recognition',
      md: 'Swap the FIFO queue for a min-heap and Kahn always outputs the lexicographically smallest valid order. The reason is that at each step it picks the smallest node that is currently free. DFS post-order cannot give you this easily. JavaScript has no built-in heap, so for small n you can scan the ready set for its minimum (O(n²) total), or use your MinHeap class.',
    },
    {
      title: 'Edges and in-degrees must stay in sync',
      kind: 'edge-cases',
      md: 'When edges are derived (alien dictionary: one edge per adjacent word pair), the same edge can appear many times. Either keep the duplicates in **both** `adj` and `indeg`, or remove duplicates from **both** (e.g. `adj` as a Set and `indeg[v]++` only if `!adj[u].has(v)`). If you remove duplicates in one and not the other, in-degrees never reach 0 and the answer looks like a cycle.',
      code: `const adj = new Map([['a', new Set()], ['b', new Set()]]);
const indeg = new Map([['a', 0], ['b', 0]]);
function addEdge(u, v) {
  if (adj.get(u).has(v)) return;          // dedupe BOTH structures together
  adj.get(u).add(v); indeg.set(v, indeg.get(v) + 1);
}
addEdge('a', 'b'); addEdge('a', 'b');
console.log(indeg.get('b')); // 1`,
    },
    {
      title: 'Seed in-degrees from every name, not just edge targets',
      kind: 'javascript',
      md: 'With string nodes it is easy to create `indeg` entries only inside the edge loop. Then nodes that never appear as a target are missing from the Map and never enter the queue. First loop over **all** names (all letters of all words, all recipes and supplies) and set `indeg.set(name, 0)`. After that, add the edges.',
    },
    {
      title: 'Push in post-order, then reverse once',
      kind: 'javascript',
      md: 'In DFS topological sort, collect each node with `order.push(u)` when its DFS finishes, then call `order.reverse()` once at the end. `unshift` would also give the right order, but each call moves the whole array, so the total cost becomes O(V²).',
    },
    {
      title: 'Check your answer with a position array',
      kind: 'edge-cases',
      md: 'Many orders can be valid, so comparing to one expected answer is not a real test. Instead, set `pos[order[i]] = i` and check `pos[u] < pos[v]` for every edge. Also check that the order contains each node exactly once. This takes O(V + E) and catches reversed edges right away.',
      code: `function isTopoOrder(n, edges, order) {
  if (order.length !== n) return false;
  const pos = new Array(n).fill(-1);
  order.forEach((v, i) => { pos[v] = i; });
  if (pos.includes(-1)) return false;
  return edges.every(([u, v]) => pos[u] < pos[v]);
}
console.log(isTopoOrder(3, [[0, 1], [1, 2]], [0, 1, 2]), isTopoOrder(3, [[0, 1], [1, 2]], [1, 0, 2])); // true false`,
    },
    {
      title: '"Safe nodes": run Kahn on the reversed graph',
      kind: 'recognition',
      md: 'A node is safe when every path from it ends at a terminal node. Reverse all edges and start Kahn from the terminal nodes (out-degree 0 in the original graph). A node becomes ready only after all of its original out-neighbours are proven safe. Nodes that never come out of the queue are on a cycle or lead into one. This gives the same answer as the 3-colour DFS, without recursion.',
    },
    {
      title: 'Two-level ordering: sort groups, then items within groups',
      kind: 'template',
      md: 'For "sort items by groups respecting dependencies", give each ungrouped item its own new group id. Build a group graph (an edge whenever a dependency crosses two groups) and an item graph. Topologically sort both. Then go through the groups in their order and output each group\'s items in the item order. If either sort finds a cycle, return [].',
    },
    {
      title: 'Return the actual cycle if asked',
      kind: 'interview',
      md: 'Kahn only tells you that a cycle exists. If the interviewer asks which nodes form it, switch to the colour DFS and store `parent[v] = u` as you go. When you hit a gray node `g` from `u`, follow parents back from `u` until you reach `g`. Saying this follow-up out loud shows you understand why gray means "on the current path".',
    },
  ],
  traps: [
    { looksLike: 'Topological sort for an undirected cycle check', actually: 'Union Find or DFS with parent skip', why: 'topological order only exists for directed graphs; every undirected edge looks like a 2-cycle to Kahn' },
    { looksLike: 'Longest path with Dijkstra on negated weights', actually: 'Topological order + DP', why: 'Dijkstra breaks with negative weights; on a DAG one pass in topological order is exact and linear' },
    { looksLike: 'Any DFS order is fine for "smallest order"', actually: 'Kahn with a min-heap', why: 'reversed post-order is valid but not lexicographically smallest' },
    { looksLike: 'Need a cycle check and a parallel schedule separately', actually: 'One layered Kahn', why: 'the number of layers gives the rounds and the processed count gives the cycle check' },
  ],
  sources: [
    { label: 'CP-Algorithms — Topological sorting', url: 'https://cp-algorithms.com/graph/topological-sort.html' },
    { label: 'Tech Interview Handbook — Graph cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/graph/' },
  ],
};
