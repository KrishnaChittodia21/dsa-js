export default {
  signals: [
    '"is it possible to reach / escape" (yes/no reachability)',
    'puzzle board or lock with "minimum moves" → each configuration is a node',
    'words that differ by one letter ("word ladder") → implicit edges',
    'n nodes and exactly n − 1 edges → probably a tree',
    'teleports / portals / ladders in a grid → extra edges on top of the 4 neighbours',
    '"distance from every cell to the nearest X" → start the search from the X cells',
    'state needs more than position (keys held, parity, time mod k)',
  ],
  tricks: [
    {
      title: 'Encode multi-part states as one integer',
      kind: 'javascript',
      md: 'A `Set` of arrays never finds anything, because `[1, 2] !== [1, 2]` (arrays compare by reference). Pack the state into one number instead, e.g. `id = (r * C + c) * (1 << K) + mask`. Then `visited` can be a `Uint8Array` indexed by id. This is much faster and uses less memory than string keys like `` `${r},${c},${mask}` ``.',
      code: `const R = 2, C = 3, K = 2;
const encode = (r, c, mask) => (r * C + c) * (1 << K) + mask;
const decode = (id) => {
  const mask = id % (1 << K), cell = Math.floor(id / (1 << K));
  return [Math.floor(cell / C), cell % C, mask];
};
const seen = new Uint8Array(R * C * (1 << K));
const id = encode(1, 2, 3);
seen[id] = 1;
console.log(id, decode(id), seen[encode(1, 2, 3)]); // 23 [ 1, 2, 3 ] 1`,
    },
    {
      title: 'Swap frontier arrays to count BFS levels',
      kind: 'template',
      md: 'When you only need "how many steps", keep the current layer in one array and build the next layer in a fresh array. The step counter goes up once per swap, so you need no `dist` array and never call `shift()` (which is O(n) in JS). Each node still enters a layer only once, so the total cost stays O(V + E).',
      code: `function stepsTo(adj, src, target) {
  const seen = new Uint8Array(adj.length); seen[src] = 1;
  let frontier = [src];
  for (let steps = 0; frontier.length; steps++) {
    const next = [];
    for (const u of frontier) {
      if (u === target) return steps;
      for (const v of adj[u]) if (!seen[v]) { seen[v] = 1; next.push(v); }
    }
    frontier = next;
  }
  return -1;
}
console.log(stepsTo([[1, 2], [3], [3], []], 0, 3)); // 2`,
    },
    {
      title: 'Reverse the edges for "who can reach the target?"',
      kind: 'recognition',
      md: 'In a directed graph, "which nodes can reach T?" would need one search from every node. Build the reverse adjacency list and search once from T. Every node you reach in the reversed graph has a path to T in the original. The same idea works for "nodes from which you can reach the ocean": search inward from the border.',
    },
    {
      title: 'Write grid directions as one flat array',
      kind: 'javascript',
      md: '`const D = [0, 1, 0, -1, 0]` gives the four moves as the pairs `(D[k], D[k + 1])` for k = 0..3. It is shorter than an array of pairs and does not create small arrays inside the hot loop. Add a fifth pair (or use `[1, 1, -1, -1, 1, 0, -1, 0, 1]`) for 8 directions. Always do the bounds check before you read `grid[nr][nc]`.',
      code: `const D = [0, 1, 0, -1, 0];
function neighbours(r, c, R, C) {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const nr = r + D[k], nc = c + D[k + 1];
    if (nr >= 0 && nr < R && nc >= 0 && nc < C) out.push([nr, nc]);
  }
  return out;
}
console.log(neighbours(0, 0, 3, 3)); // [ [ 0, 1 ], [ 1, 0 ] ]`,
    },
    {
      title: 'Ask before you mark visited by changing the grid',
      kind: 'interview',
      md: 'Overwriting `"1"` with `"0"` (or `"#"`) in the grid saves an O(R·C) visited array, and it is a common island-counting shortcut. It does destroy the caller\'s input, so say it out loud: "I\'ll mark cells in place. If the input must stay the same, I\'ll use a separate `Uint8Array`." Interviewers like hearing that you noticed the side effect.',
    },
    {
      title: 'Valid tree = n − 1 edges + connected',
      kind: 'recognition',
      md: 'An undirected graph is a tree exactly when it has n − 1 edges and is connected. If either holds alone, it is not enough. So first return `false` if `edges.length !== n - 1` (an O(1) check). After that, a single BFS/DFS that reaches all n nodes proves there is no cycle, because a connected graph with n − 1 edges cannot have one.',
    },
    {
      title: 'Clone a graph: the old → new Map is also your visited set',
      kind: 'template',
      md: 'Put the copy into the Map **before** you visit the neighbours. If a cycle brings you back to that node, you then reuse the copy instead of looping forever. One Map does two jobs: it marks nodes as visited and links each original node to its clone.',
      code: `function cloneGraph(node, copies = new Map()) {
  if (!node) return null;
  if (copies.has(node)) return copies.get(node);
  const copy = { val: node.val, neighbors: [] };
  copies.set(node, copy);                       // register first
  for (const nb of node.neighbors) copy.neighbors.push(cloneGraph(nb, copies));
  return copy;
}
const a = { val: 1, neighbors: [] }, b = { val: 2, neighbors: [a] };
a.neighbors.push(b);
const c = cloneGraph(a);
console.log(c !== a, c.neighbors[0].neighbors[0] === c); // true true`,
    },
    {
      title: 'Check the target when you enqueue, not when you dequeue',
      kind: 'optimization',
      md: 'In unweighted BFS a node\'s distance is final the moment you discover it. If you test `v === target` while pushing, you can return `dist[u] + 1` right away. This skips the rest of the current layer, and on wide graphs (word ladder, open grids) that can be most of the work. This only works for plain BFS. In Dijkstra you must wait until the node is popped.',
    },
    {
      title: 'Check these input traps before you code',
      kind: 'edge-cases',
      md: 'Ask (or check) whether nodes are numbered **1..n** (then allocate `n + 1`), whether there are **self-loops** or **duplicate edges** (both break "degree" and "edge count" logic), and whether there are **isolated nodes** that never show up in the edge list but still count as components. Also check for an empty edge list and n = 1. These are what hidden test cases usually check.',
    },
    {
      title: 'Turn the tree into a graph when you must move upward',
      kind: 'recognition',
      md: 'Questions like "all nodes at distance K from target" in a binary tree need to move to parents as well as children. Record each node\'s parent (or build an undirected adjacency list) in one pass, then run a normal BFS from the target with a visited set. After that, the tree is just an undirected graph.',
    },
  ],
  traps: [
    { looksLike: 'Grid DP (minimum cost path)', actually: 'BFS / Dijkstra', why: 'when moves go in all 4 directions the cells depend on each other in cycles, so there is no valid fill order for a DP table' },
    { looksLike: 'Word ladder by comparing every pair of words', actually: 'BFS with wildcard buckets ("h*t")', why: 'building all pairs costs O(n²·L); grouping words by pattern finds neighbours in O(L²) each' },
    { looksLike: 'Backtracking over all paths for the "shortest route visiting every node"', actually: 'BFS over (node, visited-mask)', why: 'the same (node, mask) is reached many times; BFS visits each state once in O(2^n · n)' },
    { looksLike: 'Tree recursion only (children)', actually: 'Undirected graph BFS with parent links', why: 'the answer needs paths that go up through ancestors' },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Graph cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/graph/' },
    { label: 'CP-Algorithms — Breadth-first search (applications)', url: 'https://cp-algorithms.com/graph/breadth-first-search.html' },
  ],
};
