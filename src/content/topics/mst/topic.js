export default {
  id: 'mst',
  summary: 'Connect every node of a weighted graph using the cheapest possible set of edges — no cycles, no wasted edges — with Kruskal (sort edges + Union Find) or Prim (grow one tree with a min-heap).',

  jsTools: [
    { api: 'UnionFind (toolkit)', use: 'Kruskal: "would this edge create a cycle?" is exactly `union(u, v) === false`', complexity: 'find / union: ~O(1) amortized (inverse Ackermann)' },
    { api: 'MinHeap (toolkit)', use: 'Prim: always pop the cheapest edge leaving the tree — new MinHeap(e => e[0])', complexity: 'push / pop: O(log n)' },
    { api: 'edges.sort((a, b) => a[2] - b[2])', use: 'Kruskal: process edges from cheapest to most expensive (always pass a comparator!)', complexity: 'O(m log m)' },
    { api: 'new Array(n).fill(Infinity)', use: 'Dense Prim: best known cost to attach each node to the tree', complexity: 'O(n)' },
    { api: 'new Uint8Array(n)', use: 'Compact inTree[] visited flags for Prim', complexity: 'O(n) memory, O(1) access' },
    { api: 'Math.abs', use: 'Manhattan distance between points: |x1 − x2| + |y1 − y2|', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'mst-kruskal',
      name: "Kruskal's Algorithm (Sort Edges + Union Find)",
      summary: 'Sort all edges by weight; walk through them cheapest first and keep an edge only if it joins two different components. Stop after n − 1 edges.',
      whyItExists: 'Trying every spanning tree is exponential. The **cut property** guarantees that the cheapest edge joining two different components is always part of some MST, so a greedy scan over sorted edges is provably optimal. Union Find answers "same component?" in near-O(1), so the whole thing costs O(m log m) — dominated by the sort.',
      whenToUse: [
        'You are given (or can easily build) an explicit **edge list** with weights',
        'The graph is sparse (m is close to n) so sorting m edges is cheap',
        'You need to process edges in weight order anyway (equal-weight groups for uniqueness, critical edges, maximum spanning tree)',
        'The graph may be disconnected and you want a minimum spanning forest',
      ],
      clues: ['"connect all cities/houses/computers at minimum cost"', '"minimum total wire / pipe / road length"', '"every node must be reachable"', 'input is a list of [u, v, cost]', '"return -1 if it is impossible to connect everything"'],
      whenNotToUse: [
        'You need a shortest path between two nodes — an MST minimises the TOTAL edge weight, not any particular path (use Dijkstra)',
        'The graph is complete/dense (m ≈ n²) and edges are implicit (points on a plane) — dense Prim in O(n²) avoids materialising and sorting n² edges',
        'The graph is directed — MST is defined for undirected graphs (the directed version is a different, harder problem: minimum arborescence)',
      ],
      template: `function kruskal(n, edges) {
  edges.sort((a, b) => a[2] - b[2]);        // cheapest first
  const uf = new UnionFind(n);
  let total = 0, used = 0;
  for (const [u, v, w] of edges) {
    if (uf.union(u, v)) {                   // joins two components → safe edge
      total += w;
      if (++used === n - 1) break;          // tree complete
    }
  }
  return used === n - 1 ? total : -1;       // fewer edges → disconnected
}`,
      variations: [
        { name: 'Maximum spanning tree', description: 'Sort descending instead of ascending. The same cut-property argument works with "most expensive crossing edge".' },
        { name: 'Minimum spanning forest', description: 'Do not stop at n − 1 and do not return -1: every successful union adds an edge; the result is one MST per component.' },
        { name: 'Equal-weight groups', description: 'Process all edges of the same weight together to decide whether the MST is unique or which edges are "pseudo-critical".' },
        { name: 'Forced / banned edge', description: 'Pre-union a forced edge (add its weight) or skip a banned edge, then run Kruskal normally — the basis of critical-edge detection.' },
      ],
      mistakes: [
        'Calling `edges.sort()` with no comparator — JavaScript sorts arrays lexicographically as strings',
        'Forgetting the disconnected case: check that exactly n − 1 edges were used',
        'Using a plain visited Set instead of Union Find — "both endpoints visited" does NOT mean they are in the same component',
        'Off-by-one on 1-indexed nodes: create UnionFind(n + 1) or subtract 1',
      ],
      evolution: {
        easy: 'Plain Kruskal on an explicit edge list: total weight or -1.',
        medium: 'Build the edges yourself (points, virtual node), handle 1-indexed input, forests, maximum trees.',
        hard: 'Reason about ALL MSTs: uniqueness, critical/pseudo-critical edges, second-best MST — process equal weights as groups or re-run Kruskal with forced/banned edges.',
      },
    },
    {
      id: 'mst-prim',
      name: "Prim's Algorithm (Grow a Tree with a Min-Heap)",
      summary: 'Start from any node. Repeatedly take the cheapest edge that leaves the current tree and add the node on its far side. A min-heap holds the candidate edges; stale entries are skipped.',
      whyItExists: 'Prim applies the cut property to one specific cut: (nodes already in the tree) vs (everything else). The cheapest edge crossing that cut is always safe. Using a heap of candidate edges makes each step O(log m) instead of scanning every edge.',
      whenToUse: [
        'The graph is given as an **adjacency list or adjacency matrix** rather than an edge list',
        'You want to grow the tree from a particular start node',
        'Medium-density graphs where building an adjacency list is natural',
      ],
      clues: ['adjacency list / matrix input', '"connect all nodes at minimum cost"', 'you already know Dijkstra — Prim has the same shape'],
      whenNotToUse: [
        'You only have an edge list and the graph is sparse → Kruskal is simpler',
        'The graph is complete (every pair connected) → use the O(n²) array version, not the heap',
        'You need a minimum spanning forest of a disconnected graph → you must restart Prim from each unvisited node (Kruskal handles this for free)',
      ],
      template: `function prim(n, adj) {                  // adj[u] = [[v, w], ...]
  const inTree = new Uint8Array(n);
  const heap = new MinHeap((e) => e[0]);  // [weight, node]
  heap.push([0, 0]);
  let total = 0, count = 0;
  while (!heap.isEmpty() && count < n) {
    const [w, u] = heap.pop();
    if (inTree[u]) continue;              // stale entry: u already joined
    inTree[u] = 1;
    total += w;
    count++;
    for (const [v, wt] of adj[u]) if (!inTree[v]) heap.push([wt, v]);
  }
  return count === n ? total : -1;
}`,
      variations: [
        { name: 'Lazy Prim (heap of edges)', description: 'Push every edge leaving a new tree node; skip popped entries whose node is already in the tree. O(m log m).' },
        { name: 'Dense Prim (arrays, no heap)', description: 'Keep minCost[v] for every node and scan for the minimum each round. O(n²) — best for complete graphs.' },
        { name: 'Prim on a matrix', description: 'Neighbours are the columns with a non-zero entry (0 = no edge).' },
      ],
      mistakes: [
        'Marking a node as in-tree when it is PUSHED instead of when it is POPPED — a cheaper edge to it may arrive later',
        'Adding the edge weight to a running distance (that is Dijkstra!) — Prim uses the edge weight alone as the priority',
        'Forgetting to check `count === n` for disconnected graphs',
      ],
      evolution: {
        easy: 'Prim on an adjacency list or matrix.',
        medium: 'Implicit complete graphs (points on a plane) where you generate neighbours on the fly.',
        hard: 'Combine with other ideas: virtual source nodes, constraints on which edges are allowed.',
      },
    },
    {
      id: 'mst-prim-dense',
      name: "Dense Prim (O(n²) Array Version)",
      summary: 'For complete graphs, keep minCost[v] = cheapest edge from the tree to v. Each round pick the unvisited v with the smallest minCost by a linear scan, add it, and relax every other node. No heap, no edge list.',
      whyItExists: 'A complete graph on n nodes has n(n−1)/2 edges. Kruskal would sort ~n²/2 edges (O(n² log n) time, O(n²) memory); heap Prim pushes ~n² entries. The array version touches each pair once: O(n²) time and only O(n) memory — the optimal bound, since you must at least look at every pair.',
      whenToUse: [
        'Every pair of nodes is connected (points on a plane, "cost between any two")',
        'Edge weights are computed from node data rather than given explicitly',
        'n is up to a few thousand (n² ≈ 10^6–10^7 operations)',
      ],
      clues: ['"points" with a distance formula', '"any two points can be connected"', 'n ≤ 1000 with no edge list'],
      whenNotToUse: [
        'Sparse graphs — O(n²) is worse than O(m log m) when m ≪ n²',
      ],
      template: `function densePrim(n, cost) {           // cost(i, j) → weight
  const minCost = new Array(n).fill(Infinity);
  const inTree = new Uint8Array(n);
  minCost[0] = 0;
  let total = 0;
  for (let round = 0; round < n; round++) {
    let u = -1;
    for (let v = 0; v < n; v++)            // pick the closest outside node
      if (!inTree[v] && (u === -1 || minCost[v] < minCost[u])) u = v;
    inTree[u] = 1;
    total += minCost[u];
    for (let v = 0; v < n; v++)            // relax: can u attach v more cheaply?
      if (!inTree[v]) minCost[v] = Math.min(minCost[v], cost(u, v));
  }
  return total;
}`,
      variations: [
        { name: 'With parent[]', description: 'Store which tree node gave v its minCost to reconstruct the actual edges.' },
      ],
      mistakes: [
        'Building all n² edges first "because Kruskal is easier" — it works but uses O(n²) memory and an extra log factor',
        'Relaxing nodes that are already in the tree (harmless but wasteful) or forgetting to skip them when picking the minimum (wrong)',
      ],
      evolution: {
        easy: 'n points, Manhattan or Euclidean distance.',
        medium: 'Points with extra constraints on which pairs may connect.',
        hard: 'Very large n needing geometric tricks (Manhattan MST with only O(n) candidate edges) — beyond interviews.',
      },
    },
    {
      id: 'mst-virtual-node',
      name: 'MST with a Virtual Node',
      summary: 'When nodes can be "served" either by connecting to each other OR by paying a per-node cost (build a well, install a generator), add one imaginary node 0 connected to every node i with weight = that cost. The MST of the enlarged graph is the answer.',
      whyItExists: 'A per-node option does not look like an edge, so plain MST does not apply. But "node i pays its own cost" is equivalent to "node i is connected to a shared source by an edge of that cost": every final configuration corresponds to a spanning tree of the graph with the extra node, and vice versa.',
      whenToUse: [
        'Each node can either get a resource directly (at a node-specific cost) or share it through connections',
        'You see "build a well OR lay a pipe", "install a power plant OR run a cable"',
      ],
      clues: ['per-node cost AND per-edge cost in the same problem', '"supply every house"', 'at least one node must be a source'],
      whenNotToUse: [
        'There is no per-node option — plain MST',
        'Connections are directed or have capacities — that is a flow problem',
      ],
      template: `function withVirtualNode(n, nodeCost, edges) {   // nodes 1..n
  const all = edges.map(([u, v, w]) => [u, v, w]);
  for (let i = 1; i <= n; i++) all.push([0, i, nodeCost[i - 1]]);
  return kruskal(n + 1, all);          // n + 1 nodes including node 0
}`,
      variations: [
        { name: 'Multiple source types', description: 'Still one virtual node: the edge weight is the cheapest way node i can serve itself.' },
        { name: 'Virtual node in shortest paths', description: 'The same trick (a super-source) turns multi-source Dijkstra/BFS into single-source.' },
      ],
      mistakes: [
        'Forgetting that the enlarged graph has n + 1 nodes (UnionFind(n + 1), stop at n edges)',
        'Trying a greedy "build a well at the cheapest house first" — it misses cases where two wells are better than one long pipe',
      ],
      evolution: {
        easy: 'Recognise the trick with a hint.',
        medium: 'Wells + pipes (Optimize Water Distribution).',
        hard: 'Combine a virtual node with edge classification or constraints.',
      },
    },
    {
      id: 'mst-edge-classification',
      name: 'Reasoning About All MSTs (Uniqueness, Critical Edges, Second-Best)',
      summary: 'Classify edges relative to every possible MST: critical (in all MSTs), pseudo-critical (in some), or never used. Tools: process equal weights as a group, run Kruskal with a banned or forced edge, or swap one non-tree edge into the tree (cycle property).',
      whyItExists: 'A graph can have many MSTs when weights tie. Interview problems ask "is it unique?", "which edges are essential?", "what is the next-cheapest tree?". The **cycle property** answers them: adding a non-tree edge (u, v, w) to an MST creates exactly one cycle; removing the heaviest other edge on that cycle gives the cheapest tree that contains (u, v).',
      whenToUse: [
        'Questions about uniqueness of the MST',
        '"Critical" / "pseudo-critical" / "bottleneck" edges',
        'The second-best or k-th best spanning tree',
      ],
      clues: ['"is the MST unique"', '"edges whose removal increases the MST weight"', '"appears in some but not all MSTs"', '"second minimum spanning tree"'],
      whenNotToUse: [
        'You only need one MST — plain Kruskal/Prim',
      ],
      template: `// Weight of the MST with edge 'skip' banned and/or edge 'force' pre-added.
function mstWith(n, edges, skip = -1, force = -1) {
  const uf = new UnionFind(n);
  let total = 0, used = 0;
  if (force !== -1) {
    const [u, v, w] = edges[force];
    uf.union(u, v); total += w; used++;
  }
  for (let i = 0; i < edges.length; i++) {     // edges pre-sorted by weight
    if (i === skip || i === force) continue;
    const [u, v, w] = edges[i];
    if (uf.union(u, v)) { total += w; used++; }
  }
  return used === n - 1 ? total : Infinity;
}
// critical:        mstWith(skip = i)  > best
// pseudo-critical: not critical and mstWith(force = i) === best`,
      variations: [
        { name: 'Uniqueness by weight groups', description: 'Within each group of equal weight, count edges that would join different components BEFORE unioning any of them; if more candidates than successful unions, there is a choice → not unique.' },
        { name: 'Second-best MST', description: 'For every non-tree edge (u, v, w), find the heaviest tree edge on the path u→v that is strictly lighter than w; the best swap gives the second-best tree.' },
        { name: 'Critical by re-running', description: 'O(m · m α(n)) — re-run Kruskal once per edge with it banned/forced. Fine for m ≤ a few hundred.' },
      ],
      mistakes: [
        'Deciding criticality by "is it in MY MST?" — with ties, a non-critical edge may be in your MST and a pseudo-critical one may not',
        'For the banned-edge run, forgetting that the graph may become disconnected (treat as Infinity → the edge is critical)',
        'For second-best, swapping with an edge of EQUAL weight gives the same total, not a strictly greater one',
      ],
      evolution: {
        easy: 'Understand why ties create multiple MSTs.',
        medium: 'Check uniqueness with equal-weight groups.',
        hard: 'Critical/pseudo-critical edges; strictly second-best MST via max-edge-on-path.',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `Imagine five villages and a list of roads you *could* build, each with a price. You want every village to be reachable from every other village, and you want to spend as little as possible. Which roads do you build?

You never need a road that closes a loop: if you can already get from A to B, another A–B route is wasted money. So the roads you keep form a **tree** that touches every village. The cheapest such tree is a **Minimum Spanning Tree (MST)**.

\`\`\`text
      4            Candidate roads:  A-B 4, A-C 1, B-C 2, B-D 5, C-D 8, D-E 3
  A ------ B
   \\      / \\      MST: A-C 1, B-C 2, D-E 3, B-D 5   → total 11
  1 \\  2 /   \\ 5    (A-B 4 would close the loop A-B-C; C-D 8 closes A..D)
     \\  /     \\
      C ------ D --3-- E
          8
\`\`\``,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Spanning tree** — a subset of the edges that connects **all n nodes** and has **no cycle**. It always has exactly **n − 1 edges**.
- **Minimum spanning tree (MST)** — a spanning tree whose total edge weight is as small as possible. There may be several with the same total.
- **Minimum spanning forest** — if the graph is disconnected, one MST per connected component.
- **Cut** — a split of the nodes into two non-empty groups S and V∖S. An edge **crosses** the cut if it has one endpoint on each side.
- MSTs are defined for **undirected, weighted** graphs.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'An electricity company wiring up a new neighbourhood: every house must get power, cable costs money per metre, and a loop of cable adds nothing. The cheapest cabling plan is an MST. Same story for network cables between computers, water pipes, or roads between towns.',
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-1',
            question: 'A connected graph has 7 nodes and 15 edges. How many edges does **every** spanning tree of it have?',
            options: ['15', '7', '6', 'It depends on the weights'],
            answer: 2,
            explanation: 'A tree on n nodes always has exactly n − 1 edges: start with n separate nodes (n components); each edge that does not create a cycle merges two components into one, and you stop when one component is left — after n − 1 merges.',
            misconceptions: {
              0: 'Keeping all 15 edges would create cycles. A spanning tree drops every edge that closes a loop.',
              1: 'n edges on n nodes always contain a cycle. One fewer is the maximum a tree can have.',
              3: 'Weights decide WHICH edges you pick, never HOW MANY. Every spanning tree of a connected 7-node graph has 6 edges.',
            },
            deeper: 'Remember the merge view: "every accepted edge reduces the number of components by one". That is also exactly how Kruskal will count its progress, and why it can stop after n − 1 accepted edges.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `The number of spanning trees explodes: a complete graph on n nodes has **n^(n−2)** of them (Cayley's formula). For n = 10 that is 100,000,000 trees; for n = 20 it is about 2.6 × 10^23. Trying them all is hopeless.

Yet an MST can be found in **O(m log m)** by a greedy algorithm — pick cheap edges one at a time and never look back. That is surprising: most "pick the cheapest thing first" strategies fail on optimisation problems. For MSTs it is **provably correct**, thanks to the *cut property* you will see in a moment.`,
          },
          {
            type: 'text',
            md: `Where MSTs show up in interviews:

| Problem shape | Example |
|---|---|
| Connect everything at minimum cost | Min Cost to Connect All Points, Connecting Cities |
| Nodes can self-serve OR connect | Optimize Water Distribution (virtual node) |
| Reason about all optimal trees | Critical & Pseudo-Critical Edges, second-best MST |
| Minimise the largest edge used ("bottleneck") | An MST also minimises the maximum edge on the path between any two nodes |`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why an MST is **not** the same thing as the shortest paths from one node?',
            deeper: `An MST minimises the **sum of all edges in the tree**. A shortest-path tree (Dijkstra) minimises the **distance from one source to each node**.

Take a triangle A–B = 1, B–C = 1, A–C = 1.5. MST = {A–B, B–C}, total 2. But in the MST the path A→C costs 2, while the direct edge costs 1.5, so the shortest-path tree from A is {A–B, A–C} with total 2.5. Different goals, different trees. If a problem asks "minimum cost to travel from X to Y", it is a shortest path problem, not MST.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Use an MST algorithm when **all** of these hold:

1. The graph is **undirected** (a cable works both ways).
2. You must **connect every node** (or every node in each component).
3. You pay for **each edge you use once**, and want the smallest **total**.

Then choose the algorithm by the input shape:

| Input | Use | Time |
|---|---|---|
| Edge list, sparse graph | **Kruskal** (sort + Union Find) | O(m log m) |
| Adjacency list / matrix | **Prim** with a min-heap | O(m log m) |
| Complete graph (every pair has a cost, e.g. points) | **Dense Prim** with arrays | O(n²) |
| Possibly disconnected, want a forest | **Kruskal** (no early stop) | O(m log m) |
| Per-node "self-serve" cost + edges | Add a **virtual node**, then Kruskal/Prim | O((m + n) log(m + n)) |`,
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-2',
            question: 'You have 1,000 points on a plane; any two can be linked with cost = Manhattan distance. Which approach is the best fit?',
            options: [
              'Kruskal: build all ~500,000 edges, sort them, Union Find',
              'Dijkstra from point 0',
              'BFS from point 0',
              'Dense Prim: O(n²) with a minCost array, generating distances on the fly',
            ],
            answer: 3,
            explanation: 'The graph is complete: m ≈ n²/2 = 500,000. Dense Prim does ~n² = 1,000,000 cheap operations with O(n) memory and no sorting. Kruskal also works but costs O(n² log n) time plus O(n²) memory for the edge list.',
            misconceptions: {
              0: 'It gives the right answer and is acceptable for n = 1000, but it stores half a million edges and sorts them — an extra log factor and a lot of memory. Dense Prim is the better fit for complete graphs.',
              1: 'Dijkstra minimises distance from one source, not total cost of connecting everyone.',
              2: 'BFS ignores weights entirely, and it answers a reachability/shortest-hops question, not a minimum total cost.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['"connect all" nodes / cities / points / houses', '"minimum total cost" of connections', 'undirected edges with costs', '"every pair can be connected" (dense)', '"return -1 if not everything can be connected"', 'build a well OR lay a pipe'],
            conclusion: 'Think Minimum Spanning Tree (Kruskal or Prim)',
          },
          {
            type: 'text',
            md: `Questions to ask while reading:

1. **Do I pay once per edge used, summed over all edges?** → MST. (If you pay per trip, it is shortest paths.)
2. **Must everything end up connected?** → spanning tree. (If only two nodes matter, it is a path problem.)
3. **Is there a per-node alternative cost?** → virtual node.
4. **Does it ask about ALL minimum trees?** → edge classification (groups of equal weight, forced/banned edges).`,
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-3',
            question: '"Find the cheapest route for a delivery truck from the depot to a customer on a weighted road map." Is this an MST problem?',
            options: [
              'Yes — it is about roads and minimum cost',
              'No — only two nodes matter and you pay along one route: this is a shortest-path problem (Dijkstra)',
              'Yes, but only if the roads are one-way',
              'No — it is a topological sort problem',
            ],
            answer: 1,
            explanation: 'MST connects **everyone** and minimises the **total** of the chosen edges. Here only depot → customer matters, and the cost is the length of one path. That is shortest path.',
            misconceptions: {
              0: '"Roads + minimum cost" is not enough. Ask: must every node be connected, and do I pay for the whole network? Here neither is true.',
              2: 'One-way roads make MST inapplicable altogether (MST is for undirected graphs).',
              3: 'Topological sort orders tasks with dependencies in a DAG; there is no ordering question here.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — the cut property',
        blocks: [
          {
            type: 'text',
            md: `Both Kruskal and Prim rest on one fact.

**Cut property.** Split the nodes into any two groups S and V∖S. Among all edges that cross between the groups, the **cheapest one** belongs to some MST. (If it is strictly cheapest, it belongs to *every* MST.)

**Why? An exchange argument.** Suppose an MST T does **not** contain the cheapest crossing edge e = (u, v).

1. T is spanning, so it contains a path from u to v.
2. u is in S and v is not, so that path must cross the cut somewhere — using some edge f.
3. Add e to T: now there is a cycle (e plus the old path). Remove f: the cycle is broken, everything is still connected, and we still have n − 1 edges → another spanning tree T'.
4. weight(T') = weight(T) − w(f) + w(e) ≤ weight(T), because e is the cheapest crossing edge.

So T' is also minimum, and it contains e. Adding e was **safe**: it never rules out an optimal answer.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Two islands and a bridge',
            md: 'Two islands must be linked by at least one bridge — any connected network has to cross the water somewhere. If you are going to build a bridge anyway, building the cheapest possible one can never hurt: whatever plan uses a more expensive bridge can swap it for the cheap one and still be connected.',
          },
          {
            type: 'text',
            md: `The two algorithms simply pick *different cuts*:

- **Kruskal** looks at the cheapest remaining edge overall. If its endpoints are in different components, take S = one of those components: no cheaper edge crosses it (cheaper edges were all already processed and either used or found to be inside one component). Safe.
- **Prim** always uses the cut S = "nodes already in my tree". The cheapest edge leaving the tree is safe.

The mirror image is the **cycle property**: the strictly most expensive edge on any cycle is in **no** MST — you can always drop it and keep connectivity more cheaply.`,
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-4',
            question: 'In the exchange argument, why does removing edge f after adding e still leave a **spanning tree**?',
            options: [
              'Because f was the most expensive edge in the whole graph',
              'Because any tree with n nodes is automatically spanning',
              'Because f lies on the unique cycle created by adding e, and removing any edge of a cycle keeps the graph connected',
              'Because e and f share an endpoint',
            ],
            answer: 2,
            explanation: 'Adding e to a tree creates exactly one cycle. Removing any edge of that cycle breaks the cycle but not connectivity (the rest of the cycle still links its endpoints). Edge count goes back to n − 1, so it is a tree again.',
            misconceptions: {
              0: 'f is just the edge where T\'s u→v path crosses the cut. It need not be the heaviest edge anywhere — we only need w(e) ≤ w(f), which holds because e is the cheapest crossing edge.',
              1: 'A "tree" on n nodes with n − 1 edges must also be connected. The argument works because we remove an edge from a cycle, which keeps connectivity.',
              3: 'They usually do not share endpoints. What matters is that f is on the cycle formed by e and T\'s u→v path.',
            },
            deeper: 'Draw it: T\'s path from u to v, e closing the loop, and f the edge on the loop where the path jumps from S to the other side. Cutting f leaves a "U" shape that is still connected through e.',
          },
          {
            type: 'reflect',
            prompt: 'Can you explain why greedy works for MST even though "take the cheapest thing first" fails for, say, coin change with coins {1, 3, 4} and amount 6?',
            deeper: `Greedy is correct only when a **safe-choice lemma** holds: some optimal solution contains the greedy choice. For coin change {1,3,4}, taking 4 first forces 4+1+1 = 3 coins, but 3+3 = 2 coins is optimal — no exchange argument can rescue the 4.

For MSTs, the cut property **is** the safe-choice lemma: after each greedy step, there is still an MST containing everything chosen so far. By induction, when you have n − 1 edges you hold a full MST. Whenever you use a greedy algorithm, try to name its exchange argument — interviewers love that question.`,
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: `The obvious brute force: try every subset of n − 1 edges, keep the ones that form a spanning tree, return the cheapest. There are C(m, n − 1) subsets — astronomically many.

A smarter-looking but still slow idea: **the reverse-delete algorithm**. Sort edges from most to least expensive; delete an edge if the graph stays connected without it (check with a BFS/DFS). Each check is O(n + m), so the total is O(m · (n + m)). It is correct (by the cycle property: you only ever delete the heaviest edge of some cycle) and is a nice stepping stone: the expensive part is the **connectivity check**.`,
          },
          {
            type: 'code',
            title: 'Kruskal with a naive connectivity check — O(m · (n + m))',
            code: `function mstSlow(n, edges) {
  edges.sort((a, b) => a[2] - b[2]);
  const adj = Array.from({ length: n }, () => []);
  const reachable = (s, t) => {               // DFS over edges chosen so far
    const seen = new Uint8Array(n), stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const u = stack.pop();
      if (u === t) return true;
      for (const v of adj[u]) if (!seen[v]) { seen[v] = 1; stack.push(v); }
    }
    return false;
  };
  let total = 0, used = 0;
  for (const [u, v, w] of edges) {
    if (reachable(u, v)) continue;            // would create a cycle
    adj[u].push(v); adj[v].push(u);
    total += w; used++;
  }
  return used === n - 1 ? total : -1;
}`,
            caption: 'Correct, but every edge triggers a DFS. Replacing that DFS with Union Find gives real Kruskal.',
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-5',
            question: 'In the slow version above, the only expensive operation is "are u and v already connected by chosen edges?". Which structure answers exactly that question in near-O(1)?',
            options: [
              'A Set of visited nodes',
              'Union Find (Disjoint Set Union)',
              'A min-heap',
              'A sorted array of edges',
            ],
            answer: 1,
            explanation: 'Union Find keeps the components formed by the chosen edges. `find(u) === find(v)` means "same component" = "adding u–v would close a cycle". `union` merges them when we accept the edge.',
            misconceptions: {
              0: 'Both endpoints can be visited yet in different components (e.g. edges 0–1 and 2–3 chosen; now edge 1–2 has both endpoints visited but is perfectly safe). A visited Set cannot tell components apart.',
              2: 'A heap gives you the next cheapest edge (that is Prim\'s job), but it cannot tell you whether two nodes are already connected.',
              3: 'Sorting orders the edges — we already do that. It says nothing about connectivity.',
            },
          },
        ],
      },
      {
        id: 'optimized-kruskal',
        title: 'Optimized approach — Kruskal',
        blocks: [
          {
            type: 'steps',
            title: "Kruskal's algorithm",
            steps: [
              'Sort all edges by weight, cheapest first.',
              'Create a Union Find over the n nodes — every node starts as its own component.',
              'For each edge (u, v, w) in sorted order: if `find(u) !== find(v)`, accept it (add w, `union(u, v)`); otherwise skip it — it would close a cycle.',
              'Stop once n − 1 edges are accepted. If the edges run out first, the graph is disconnected → return -1.',
            ],
          },
          { type: 'visual', scenario: 'kruskal', caption: "Cheapest edge first — unless it would close a cycle." },
          {
            type: 'visual',
            scenario: 'union-find',
            input: { n: 5, edges: [[0, 2], [1, 2], [3, 4], [0, 1], [1, 3], [2, 3]] },
            caption: 'Edges fed in Kruskal order (weights 1, 2, 3, 4, 5, 8 from the village example). The 4th edge (0–1) finds both ends already in one group and is rejected; so is the last one.',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why Kruskal is correct (in one paragraph)',
            md: 'When Kruskal looks at edge e = (u, v) and u, v are in different components, let S be u\'s component. Every edge cheaper than e has already been processed; each one was either accepted (so it lies inside a component, not across S\'s boundary) or rejected because both ends were already in the same component (also not crossing). So e is the cheapest edge crossing the cut (S, rest) → by the cut property it is safe.',
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-6',
            question: 'Kruskal is processing edge (2, 5, w = 7). `uf.union(2, 5)` returns `false`. What does that mean and what should happen?',
            options: [
              'Nodes 2 and 5 are already connected by cheaper chosen edges — adding this edge would close a cycle, so skip it',
              'The union failed because of a bug; retry with union(5, 2)',
              'The edge is the most expensive one so far; stop the algorithm',
              'Nodes 2 and 5 are in different components; add 7 to the total',
            ],
            answer: 0,
            explanation: 'The toolkit\'s `union` returns false exactly when both nodes already share a root. The edge would be redundant (a cycle), and by the cycle property it is the heaviest edge on that cycle, so it can be skipped forever.',
            misconceptions: {
              1: 'Union is symmetric; swapping arguments gives the same answer. `false` is information, not an error.',
              2: 'Later edges may still be needed to connect other components. Only stop when you have n − 1 accepted edges.',
              3: 'That is the meaning of `true`. `false` = same component already.',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Kruskal — the template you will reuse',
            code: `function kruskal(n, edges) {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);  // copy if the caller's order matters
  const uf = new UnionFind(n);
  let total = 0, used = 0;
  for (const [u, v, w] of sorted) {
    if (!uf.union(u, v)) continue;   // same component → cycle → skip
    total += w;
    if (++used === n - 1) break;     // early exit
  }
  return used === n - 1 ? total : -1;
}`,
          },
          {
            type: 'code',
            title: 'The Union Find it relies on (toolkit version)',
            code: `class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.count = n;                       // number of components
  }
  find(x) {                               // path halving
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
    this.count--;
    return true;
  }
}`,
            caption: 'You met this in the Union Find topic. `uf.count === 1` after the loop is another way to check that everything got connected.',
          },
          {
            type: 'text',
            md: `**Small edits turn this into other problems:**

| Change | Result |
|---|---|
| sort descending | maximum spanning tree |
| no early exit, return total always | minimum spanning forest |
| add an extra node 0 with edges to everyone | virtual-node problems |
| pre-union one edge / skip one edge | forced / banned edge — critical edges |`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation — Kruskal',
        blocks: [
          {
            type: 'code',
            title: 'Kruskal on 1-indexed input (Connecting Cities)',
            code: `function minimumCost(n, connections) {
  connections.sort((a, b) => a[2] - b[2]);
  const uf = new UnionFind(n + 1);        // index 0 unused
  let total = 0, used = 0;
  for (const [a, b, cost] of connections) {
    if (uf.union(a, b)) {
      total += cost;
      if (++used === n - 1) return total;
    }
  }
  return n === 1 ? 0 : -1;
}`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript pitfall: default sort',
            md: '`[[0,1,10],[1,2,9]].sort()` compares the arrays as **strings** ("0,1,10" vs "1,2,9") — not by weight. Always write `sort((a, b) => a[2] - b[2])`. Also, `sort` mutates the input array; copy it with `[...edges]` if the caller\'s order matters (for example when you must report original edge indices).',
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run — Kruskal',
        blocks: [
          {
            type: 'dryrun',
            title: 'Villages A=0 B=1 C=2 D=3 E=4',
            columns: ['edge (sorted)', 'w', 'find(u) vs find(v)', 'action', 'total', 'used'],
            rows: [
              ['A–C', '1', 'A ≠ C', 'accept, union', '1', '1'],
              ['B–C', '2', 'B ≠ {A,C}', 'accept, union', '3', '2'],
              ['D–E', '3', 'D ≠ E', 'accept, union', '6', '3'],
              ['A–B', '4', 'same group {A,B,C}', 'skip (cycle A-B-C)', '6', '3'],
              ['B–D', '5', '{A,B,C} ≠ {D,E}', 'accept, union', '11', '4 = n − 1 → stop'],
              ['C–D', '8', '—', 'never examined', '11', '4'],
            ],
            note: 'The early exit skipped C–D. Without it, C–D would have been rejected anyway.',
          },
        ],
      },
      {
        id: 'optimized-prim',
        title: 'Optimized approach — Prim (heap)',
        blocks: [
          {
            type: 'text',
            md: `Prim grows **one** tree. The cut is always "tree vs. not-yet-in-tree", and the cheapest crossing edge is safe.

To find that cheapest edge fast, keep a **min-heap of candidate edges** \`[weight, node]\` that lead out of the tree. When you pop an entry whose node is already in the tree, it is **stale** — a cheaper edge got there first — so skip it. This is *lazy deletion*, the same trick you will use in Dijkstra.`,
          },
          { type: 'visual', scenario: 'prim', caption: "Grow one tree, always adding the cheapest edge that leaves it." },
          {
            type: 'steps',
            title: "Prim's algorithm (lazy heap)",
            steps: [
              'Push `[0, start]` into a min-heap keyed by weight.',
              'Pop the cheapest entry `[w, u]`. If `u` is already in the tree, skip it (stale).',
              'Otherwise add `u` to the tree and add `w` to the total.',
              'For every neighbour `v` of `u` not in the tree, push `[weight(u, v), v]`.',
              'Repeat until n nodes are in the tree (or the heap is empty → disconnected).',
            ],
          },
          {
            type: 'code',
            title: 'Prim with the toolkit MinHeap',
            code: `function primMST(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) { adj[u].push([v, w]); adj[v].push([u, w]); }

  const inTree = new Uint8Array(n);
  const heap = new MinHeap((e) => e[0]);   // [weight, node]
  heap.push([0, 0]);
  let total = 0, count = 0;
  while (!heap.isEmpty() && count < n) {
    const [w, u] = heap.pop();
    if (inTree[u]) continue;               // stale entry
    inTree[u] = 1;                         // mark on POP, not on push
    total += w;
    count++;
    for (const [v, wt] of adj[u]) if (!inTree[v]) heap.push([wt, v]);
  }
  return count === n ? total : -1;
}`,
          },
          {
            type: 'compare',
            left: {
              title: 'Prim — priority = edge weight',
              code: `heap.push([wt, v]);            // just this edge
// total += w when v joins`,
            },
            right: {
              title: 'Dijkstra — priority = distance from source',
              code: `heap.push([dist[u] + wt, v]);  // whole path so far
// dist[v] = d when v is settled`,
            },
          },
          {
            type: 'visual',
            scenario: 'dijkstra',
            input: { n: 5, edges: [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]], start: 0 },
            caption: 'This animation runs Dijkstra on the village graph. Prim uses the very same heap loop — only the pushed priority differs (edge weight instead of dist + weight). Compare which node gets settled at each step.',
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-7',
            question: 'In lazy Prim, why do we mark a node as in-tree when it is **popped**, not when it is first pushed?',
            options: [
              'Because the heap cannot store nodes that are marked',
              'It makes no difference; both are correct',
              'To save memory',
              'Because a cheaper edge to the same node may be pushed later; only the first POP is guaranteed to be the cheapest connection',
            ],
            answer: 3,
            explanation: 'In the village graph, B is first pushed with weight 4 (via A). After C joins, B is pushed again with weight 2. If we had marked B on the first push, we would have paid 4 instead of 2. The heap guarantees the first time B is popped, it is via its cheapest crossing edge.',
            misconceptions: {
              0: 'The heap stores whatever you give it; marking is our own bookkeeping.',
              1: 'Marking on push locks in the first edge you happened to see, not the cheapest one. It gives wrong totals.',
              2: 'Marking on push actually pushes fewer entries (less memory) — but it is wrong. Correctness first.',
            },
          },
        ],
      },
      {
        id: 'dry-run-prim',
        title: 'Dry run — Prim',
        blocks: [
          {
            type: 'dryrun',
            title: 'Prim from A on the village graph',
            columns: ['pop', 'in tree?', 'action', 'pushed', 'total'],
            rows: [
              ['[0, A]', 'no', 'add A', '[4,B] [1,C]', '0'],
              ['[1, C]', 'no', 'add C', '[2,B] [8,D]', '1'],
              ['[2, B]', 'no', 'add B', '[5,D]', '3'],
              ['[4, B]', 'yes', 'stale → skip', '—', '3'],
              ['[5, D]', 'no', 'add D', '[3,E]', '8'],
              ['[3, E]', 'no', 'add E → 5 nodes, stop', '—', '11'],
            ],
            note: 'Same total as Kruskal (11) — both find an MST. Notice E was attached with weight 3 even though it popped after a weight-5 entry: E only became reachable once D joined.',
          },
        ],
      },
      {
        id: 'optimized-prim-dense',
        title: 'Optimized approach — Dense Prim for complete graphs',
        blocks: [
          {
            type: 'text',
            md: `When every pair of nodes is connected (n points, cost = distance), there are about n²/2 edges. A heap would receive ~n² entries. Instead keep an array:

- \`minCost[v]\` — the cheapest edge from the current tree to v (Infinity at first).
- Each round: **scan** all nodes outside the tree for the smallest \`minCost\` (O(n)), add it, then **relax** every outside node with the edge from the new node (O(n)).

n rounds × O(n) = **O(n²)** time and **O(n)** memory. Since the input implicitly has ~n² edges, you cannot beat O(n²) in general — this is optimal for dense graphs.`,
          },
          {
            type: 'code',
            title: 'Min Cost to Connect All Points — dense Prim',
            code: `function minCostConnectPoints(points) {
  const n = points.length;
  const minCost = new Array(n).fill(Infinity);
  const inTree = new Uint8Array(n);
  minCost[0] = 0;
  let total = 0;
  for (let round = 0; round < n; round++) {
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!inTree[v] && (u === -1 || minCost[v] < minCost[u])) u = v;
    }
    inTree[u] = 1;
    total += minCost[u];
    const [x, y] = points[u];
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const d = Math.abs(x - points[v][0]) + Math.abs(y - points[v][1]);
      if (d < minCost[v]) minCost[v] = d;
    }
  }
  return total;
}`,
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-8',
            question: 'For a sparse graph with n = 100,000 nodes and m = 200,000 edges, what happens if you use the dense O(n²) Prim?',
            options: [
              'It is still the fastest option',
              'It needs 10^10 operations — far too slow; use Kruskal or heap Prim, O(m log m) ≈ 3.5 × 10^6',
              'It fails because the graph is not complete',
              'It is exactly as fast as Kruskal',
            ],
            answer: 1,
            explanation: 'O(n²) ignores how few edges there are. With n = 10^5 it performs ~10^10 steps. Heap-based algorithms depend on m: 200,000 × log₂(200,000) ≈ 3.5 million steps.',
            misconceptions: {
              0: 'Dense Prim wins only when m is close to n². Here m ≈ 2n.',
              2: 'It would still produce a correct answer if you give missing pairs cost Infinity — it is just slow.',
              3: 'Kruskal is O(m log m); dense Prim is O(n²). For sparse graphs those differ by a factor of thousands.',
            },
          },
        ],
      },
      {
        id: 'optimized-virtual-node',
        title: 'Optimized approach — the virtual node trick',
        blocks: [
          {
            type: 'text',
            md: `**Problem shape:** n houses. House i can get water by building its own well (cost \`wells[i]\`), or through a pipe from a house that already has water (cost per pipe). Minimise the total.

A well is not an edge, so MST does not seem to apply. The trick: invent a **water source node 0**. "Build a well at house i" becomes "connect house i to node 0 with an edge of weight \`wells[i]\`". Now every valid plan is a spanning tree of n + 1 nodes, and the cheapest plan is the MST.

\`\`\`text
          (0) water source
         / | \\
     w1 /  |w2 \\ w3
       1 --p-- 2 --p-- 3
\`\`\`

Why every spanning tree is a valid plan: each house is connected to node 0 through some path; the first house on that path next to 0 builds a well, and water flows through pipes to the rest.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you see why a greedy rule such as "build one well at the cheapest house, then connect everyone with pipes" can be wrong?',
            deeper: 'Two houses far apart with cheap wells (1 each) but an expensive pipe between them (100): one well + pipe = 101, two wells = 2. The MST over the virtual graph picks both 0–1 and 0–2 edges automatically, because the cut property compares wells and pipes on equal terms. Turning every option into an edge lets one algorithm weigh all trade-offs.',
          },
        ],
      },
      {
        id: 'optimized-edge-classification',
        title: 'Optimized approach — reasoning about all MSTs',
        blocks: [
          {
            type: 'text',
            md: `With tied weights a graph can have several MSTs of the same total. Three classic questions:

**1. Is the MST unique?** Process edges in groups of equal weight. For each group, first count the edges whose endpoints are in *different* components (candidates) — **before** unioning any of them. Then union them and count how many actually merge (successes). If candidates > successes, some two edges of this weight were interchangeable → more than one MST.

**2. Critical and pseudo-critical edges.** Let \`best\` = MST weight.
- Edge i is **critical** if banning it makes the MST heavier (or impossible).
- Otherwise it is **pseudo-critical** if forcing it in still gives weight \`best\`.
- Otherwise it is in no MST.

**3. Second-best MST (strictly greater).** Adding a non-tree edge (u, v, w) to the MST creates one cycle: w plus the tree path u→v. Removing the heaviest path edge \`maxEdge\` gives the cheapest tree containing (u, v): \`best − maxEdge + w\`. If \`w === maxEdge\` the total does not change, so use the heaviest path edge that is **strictly smaller** than w instead. Take the minimum over all non-tree edges.`,
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-9',
            question: 'Edges 0–1, 1–2 and 0–2 all have weight 5 (a triangle), n = 3. How many MSTs exist, and what does the "equal-weight group" check see?',
            options: [
              'One MST; candidates = successes = 2',
              'Three MSTs; candidates = 3 but only 2 unions succeed → not unique',
              'Three MSTs; candidates = 2 → unique',
              'Zero MSTs because all weights are equal',
            ],
            answer: 1,
            explanation: 'Any two of the three edges form a spanning tree of weight 10, so there are 3 MSTs. Before unioning, all 3 edges join different singleton nodes (candidates = 3). Unioning them, the third one fails (successes = 2). 3 > 2 → not unique.',
            misconceptions: {
              0: 'Ties are exactly what creates multiple MSTs. Drop any one of the three edges and the other two still span the triangle.',
              2: 'Candidates must be counted BEFORE any union in the group. Counting during the unions gives 2 and hides the choice.',
              3: 'Equal weights are perfectly fine; there are simply several optimal trees.',
            },
            deeper: 'The ordering matters: counting candidates after partially unioning the group would make the last edge look "already connected", the same as an edge that was always redundant. Counting first captures "each of these edges was individually usable".',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Default \`sort()\`** — sorts arrays as strings. Always pass \`(a, b) => a[2] - b[2]\`.
2. **Not detecting disconnection** — Kruskal must check \`used === n − 1\`; Prim must check \`count === n\`.
3. **Visited Set instead of Union Find** in Kruskal — two visited nodes may still be in different components.
4. **Prim: marking on push** instead of on pop — locks in the first edge seen, not the cheapest.
5. **Prim: pushing \`dist + w\`** — that is Dijkstra. Prim's priority is the edge weight alone.
6. **Confusing MST with shortest paths** — the MST path between two nodes is generally *not* their shortest path.
7. **1-indexed nodes** — \`new UnionFind(n)\` with nodes 1..n breaks on node n; use \`n + 1\`.
8. **Virtual node count** — after adding node 0 you have n + 1 nodes and need n edges.
9. **Ties** — "the edge is not in my MST" does not mean "the edge is in no MST".`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'Kruskal O(m log m) · Prim (heap) O(m log m) · Dense Prim O(n²)',
            space: 'O(n + m) (Kruskal/heap Prim) · O(n) (dense Prim)',
            md: `**Kruskal:** sorting m edges is O(m log m). Then m Union Find operations at O(α(n)) each — α is the inverse Ackermann function, ≤ 4 for any realistic n — so the sort dominates. Note O(m log m) = O(m log n), since m ≤ n² means log m ≤ 2 log n.

**Heap Prim:** every edge can push one heap entry (twice for undirected), each push/pop O(log m) → O(m log m). With a decrease-key heap (Fibonacci heap) it is O(m + n log n) in theory, but JavaScript has no built-in decrease-key heap and lazy deletion is simpler and fast in practice.

**Dense Prim:** n rounds × (O(n) scan + O(n) relax) = O(n²), O(n) memory.

**Edge classification:** re-running Kruskal once per edge is O(m² α(n)) after one sort — fine for m ≤ a few hundred. Second-best via all-pairs max-edge on the tree: O(n²) after the MST.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Name the property**: "Adding the cheapest edge across any cut is safe — that's the cut property, so greedy works." This one sentence signals deep understanding.
- **Pick the algorithm out loud by input shape**: edge list → Kruskal; complete graph of points → O(n²) Prim.
- **Always handle disconnection**: "If I accept fewer than n − 1 edges, I return -1."
- **Mention the early exit** at n − 1 edges.
- **Offer the virtual-node trick** whenever nodes have their own cost.
- **Edge cases**: n = 1 (answer 0, no edges needed), duplicate edges between the same pair (Kruskal handles them), self-loops (union returns false → skipped), all equal weights (many MSTs).`,
          },
          {
            type: 'checkpoint',
            id: 'mst-cp-10',
            question: 'The input may contain a **self-loop** (3, 3, w = 1) and two parallel edges (1, 2, 9) and (1, 2, 4). What does Kruskal do with them?',
            options: [
              'It crashes on the self-loop; you must filter it out first',
              'It adds the self-loop because it is the cheapest edge',
              'It skips the self-loop (union(3, 3) returns false) and among the parallel edges takes the cheaper one first; the other is later rejected as a cycle',
              'It takes both parallel edges because they are different edges',
            ],
            answer: 2,
            explanation: 'find(3) === find(3), so the self-loop is rejected like any cycle. Parallel edges are sorted: (1,2,4) is accepted if 1 and 2 are still apart; (1,2,9) then finds them together and is skipped. Kruskal needs no special handling.',
            misconceptions: {
              0: 'Union Find handles `union(x, x)` gracefully — it just returns false.',
              1: 'A self-loop is a cycle of length 1 and never connects anything new.',
              3: 'The second parallel edge would close a 2-node cycle; Union Find sees 1 and 2 already joined.',
            },
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'arr.sort((a, b) => a[2] - b[2])', use: 'Kruskal edge order (never the default sort)', complexity: 'O(m log m)' },
              { api: '[...edges] / edges.map((e, i) => [...e, i])', use: 'Copy before sorting; remember original indices for critical-edge problems', complexity: 'O(m)' },
              { api: 'new UnionFind(n) (toolkit)', use: 'union(u, v) === false ⇔ edge closes a cycle; uf.count = components', complexity: '~O(1) amortized' },
              { api: 'new MinHeap(e => e[0]) (toolkit)', use: 'Prim candidate edges [weight, node]', complexity: 'O(log n) push/pop' },
              { api: 'new Uint8Array(n)', use: 'inTree / visited flags', complexity: 'O(1) access' },
              { api: 'new Array(n).fill(Infinity)', use: 'Dense Prim minCost[]', complexity: 'O(n)' },
              { api: 'Math.abs', use: 'Manhattan distances between points', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Connect all nodes of an undirected weighted graph at minimum total cost', 'Per-node cost + per-edge cost (virtual node)', 'Questions about uniqueness / critical edges of optimal trees'],
    clues: ['connect all', 'minimum total cost', 'every pair can be connected', 'return -1 if impossible to connect', 'well or pipe', 'critical edge'],
    template: `edges.sort((a, b) => a[2] - b[2]);
const uf = new UnionFind(n);
let total = 0, used = 0;
for (const [u, v, w] of edges)
  if (uf.union(u, v)) { total += w; if (++used === n - 1) break; }
return used === n - 1 ? total : -1;`,
    complexity: 'Kruskal/heap Prim O(m log m); dense Prim O(n²) time, O(n) space',
    mistakes: ['default sort()', 'forgetting the disconnected case', 'Prim marking on push', 'Prim pushing dist + w (Dijkstra)', 'MST ≠ shortest path tree'],
    jsTools: ['UnionFind', 'MinHeap', 'sort comparator', 'Uint8Array', 'Array.fill(Infinity)'],
  },

  keyConcepts: [
    'A spanning tree connects all n nodes with exactly n − 1 edges and no cycle; an MST minimises the total weight.',
    'Cut property: the cheapest edge crossing any cut is in some MST (exchange argument) — this is why greedy works.',
    'Cycle property: the strictly heaviest edge on a cycle is in no MST.',
    'Kruskal = sort edges + Union Find; union returning false means "cycle, skip".',
    'Prim = grow one tree with a min-heap of crossing edges; mark nodes on pop; priority is the edge weight, not a distance.',
    'Dense graphs (points): O(n²) array Prim beats building n² edges.',
    'Per-node costs become edges to a virtual node.',
    'With ties, several MSTs exist; classify edges with equal-weight groups or forced/banned re-runs.',
  ],

  interviewTips: [
    'State the cut property to justify the greedy choice.',
    'Choose Kruskal vs Prim by the input format and density.',
    'Return -1 (or check uf.count) when the graph is disconnected.',
    'Mention the virtual node trick for "build here or connect" problems.',
  ],
};
