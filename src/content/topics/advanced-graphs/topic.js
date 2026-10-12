export default {
  id: 'advanced-graphs',
  summary: 'Squeeze structural facts out of a single DFS or two — which edges and nodes hold a graph together, which nodes form mutually reachable groups, and how to walk every edge exactly once.',

  jsTools: [
    { api: 'Array.from({ length: n }, () => [])', use: 'Adjacency list with a fresh array per node (never fill([]) — that shares one array)', complexity: 'O(n)' },
    { api: 'Int32Array / new Array(n).fill(-1)', use: 'disc[], low[], comp[] arrays; -1 means "not visited yet"', complexity: 'O(1) access' },
    { api: 'Explicit stack of frames [node, parent, nextIndex]', use: 'Iterative DFS that survives graphs with 10^5 nodes (recursion would overflow the call stack)', complexity: 'O(V + E) total' },
    { api: 'array.sort().reverse() + pop()', use: 'Hierholzer with lexical order: pop() the smallest remaining destination in O(1)', complexity: 'sort O(E log E), pop O(1)' },
    { api: 'Map<string, string[]>', use: 'Adjacency for string-labelled nodes (airports, de Bruijn states)', complexity: 'O(1) average' },
    { api: 'Set / boolean arrays', use: 'Visited routes and stops in BFS over "meta-nodes"', complexity: 'O(1) average' },
  ],

  patterns: [
    {
      id: 'adv-graph-lowlink-bridges',
      name: 'Low-Link DFS — Bridges & Articulation Points',
      summary: 'One DFS records when each node was discovered (disc) and the earliest discovery time reachable from its subtree using at most one back edge (low). Comparing low[child] with disc[parent] reveals edges and nodes whose removal disconnects the graph.',
      whyItExists: 'The obvious approach — delete each edge (or node) and test connectivity — costs O(E·(V+E)). Low-link values answer "can this subtree reach above its parent without the tree edge?" for every edge at once, in a single O(V + E) DFS.',
      whenToUse: [
        '"critical connections", "single point of failure", "which cable/router, if removed, splits the network"',
        'Undirected graphs where you need edges or vertices whose removal increases the number of components',
        'Grid problems asking "minimum cells to remove to disconnect" (answer is tiny: 0, 1 or 2 — a cut vertex means 1)',
      ],
      clues: ['"critical connection"', '"bridge"', '"articulation point" / "cut vertex"', '"removing it disconnects"', '"minimum number of days to disconnect"', '"single point of failure"'],
      whenNotToUse: [
        'Directed graphs where you want mutually reachable groups → strongly connected components instead',
        'You need the minimum number of edges to cut in general (a flow / min-cut problem, not low-link)',
        'Edges are added dynamically and you only ask connectivity → Union Find',
      ],
      template: `function bridgesAndCuts(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], id) => { adj[u].push([v, id]); adj[v].push([u, id]); });
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const bridges = [], cut = new Set();
  let time = 0;

  function dfs(u, parentEdge) {
    disc[u] = low[u] = time++;
    let children = 0;
    for (const [v, id] of adj[u]) {
      if (id === parentEdge) continue;          // don't reuse the tree edge we came in on
      if (disc[v] === -1) {                     // tree edge
        children++;
        dfs(v, id);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) bridges.push([u, v]);             // v's subtree can't climb to u
        if (parentEdge !== -1 && low[v] >= disc[u]) cut.add(u);  // v's subtree can't climb above u
      } else {
        low[u] = Math.min(low[u], disc[v]);     // back edge
      }
    }
    if (parentEdge === -1 && children >= 2) cut.add(u);          // root rule
  }
  for (let s = 0; s < n; s++) if (disc[s] === -1) dfs(s, -1);
  return { bridges, cut: [...cut].sort((a, b) => a - b) };
}`,
      variations: [
        { name: 'Bridges', description: 'Edge (u, v) is a bridge iff `low[v] > disc[u]` (strict).' },
        { name: 'Articulation points', description: 'Non-root u is a cut vertex iff some child has `low[v] >= disc[u]`; the root iff it has ≥ 2 DFS children.' },
        { name: 'Grid disconnection', description: 'Treat land cells as nodes; the answer is 0 (already disconnected), 1 (a cut vertex exists, or only one cell) or 2 (always enough — cut around a corner).' },
        { name: '2-edge-connected components', description: 'Remove all bridges; the remaining connected pieces are the 2-edge-connected components.' },
      ],
      mistakes: [
        'Skipping the parent by node id instead of edge id — breaks with parallel edges',
        'Using `>=` for bridges or `>` for articulation points (they differ!)',
        'Forgetting the special root rule for articulation points',
        'Updating low[u] with low[v] of a back edge (use disc[v] for back edges)',
        'Recursion depth on 10^5-node path graphs — use an explicit stack in JS',
      ],
      evolution: {
        easy: 'Find all bridges in a small connected undirected graph.',
        medium: 'Articulation points with the root rule; graphs with several components.',
        hard: 'Apply the idea implicitly (grid islands, "is there a single cell whose removal splits it"), combine with bounds reasoning (answer ≤ 2).',
      },
    },
    {
      id: 'adv-graph-scc-kosaraju',
      name: 'Strongly Connected Components — Kosaraju & Condensation',
      summary: 'Two DFS passes: record finishing order on the graph, then DFS the reversed graph in decreasing finish time — each DFS tree of the second pass is exactly one SCC. Collapsing SCCs gives a DAG (the condensation).',
      whyItExists: 'Checking "u reaches v and v reaches u" for every pair costs O(V·(V+E)). Kosaraju finds every mutually-reachable group in O(V + E), and the condensation turns any directed graph into a DAG so topological reasoning works again.',
      whenToUse: [
        'Directed graph + "groups where everyone can reach everyone"',
        '"Minimum number of starting points / new edges so everything is reachable"',
        'Any time cycles in a directed graph get in the way of a DAG algorithm → condense first',
        '2-SAT (implication graph: x and ¬x in the same SCC ⇒ unsatisfiable)',
      ],
      clues: ['"strongly connected"', '"mutually reachable"', '"can reach each other"', '"minimum number of nodes to start from"', '"every node reachable"', 'directed graph with cycles + DAG-style question'],
      whenNotToUse: [
        'Undirected graphs — plain connected components (BFS/DFS or Union Find) are enough',
        'The graph is already known to be a DAG — every SCC is a single node',
      ],
      template: `function kosaraju(n, edges) {
  const g = Array.from({ length: n }, () => []), rg = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { g[u].push(v); rg[v].push(u); }

  const seen = new Array(n).fill(false), order = [];
  function dfs1(u) {                       // pass 1: finishing order on g
    seen[u] = true;
    for (const v of g[u]) if (!seen[v]) dfs1(v);
    order.push(u);                         // pushed when u FINISHES
  }
  for (let u = 0; u < n; u++) if (!seen[u]) dfs1(u);

  const comp = new Array(n).fill(-1);
  let count = 0;
  function dfs2(u, c) {                    // pass 2: on the transpose
    comp[u] = c;
    for (const v of rg[u]) if (comp[v] === -1) dfs2(v, c);
  }
  for (let i = n - 1; i >= 0; i--) {       // decreasing finish time
    const u = order[i];
    if (comp[u] === -1) dfs2(u, count++);
  }
  return { count, comp };
}`,
      variations: [
        { name: 'Count SCCs', description: 'Return `count` from the template.' },
        { name: 'Condensation sources/sinks', description: 'For every edge u→v with comp[u] ≠ comp[v], mark comp[v] as having in-degree. Sources = components with in-degree 0.' },
        { name: "Tarjan's SCC", description: 'One DFS with a stack and low-link values; a node with low[u] === disc[u] is the root of an SCC — pop the stack down to it.' },
        { name: 'Minimum edges to make strongly connected', description: 'max(#sources, #sinks) of the condensation (0 if already one SCC).' },
      ],
      mistakes: [
        'Running pass 2 on the original graph instead of the transpose',
        'Processing pass 2 in increasing finish order',
        'Counting source NODES instead of source COMPONENTS',
        'Deep recursion on long chains in JS — use an iterative DFS for big inputs',
      ],
      evolution: {
        easy: 'Count SCCs in a small directed graph.',
        medium: 'Build the condensation and count sources / sinks (minimum starting points).',
        hard: 'DP on the condensation DAG (longest path with weights), 2-SAT, max(#sources, #sinks) edges to add.',
      },
    },
    {
      id: 'adv-graph-euler-hierholzer',
      name: 'Eulerian Path — Hierholzer',
      summary: 'Walk unused edges greedily; when a node has none left, append it to the answer. The answer (reversed) uses every edge exactly once. De Bruijn sequences are Eulerian circuits in disguise.',
      whyItExists: 'Trying every order of edges with backtracking is exponential. Degree conditions tell you instantly whether an Euler path exists, and Hierholzer builds one in O(E) by splicing detours into the main walk.',
      whenToUse: [
        '"Use every edge / ticket / domino / pair exactly once"',
        '"Arrange pairs so that each end matches the next start"',
        '"Shortest string containing every code of length n" (de Bruijn → Euler circuit on (n−1)-length states)',
      ],
      clues: ['"use all the tickets"', '"every edge exactly once"', '"valid arrangement of pairs"', '"end of one equals start of next"', '"contains every password"', '"domino chain"'],
      whenNotToUse: [
        '"Visit every NODE exactly once" — that is a Hamiltonian path (NP-hard; bitmask DP for small n)',
        'Shortest route problems — use BFS / Dijkstra',
      ],
      template: `function eulerPath(adj, start) {      // adj: Map node → array of neighbours (consumed)
  const stack = [start], path = [];
  while (stack.length) {
    const u = stack[stack.length - 1];
    const out = adj.get(u);
    if (out && out.length) stack.push(out.pop()); // follow an unused edge
    else path.push(stack.pop());                  // dead end → u is finished
  }
  return path.reverse();
}`,
      variations: [
        { name: 'Lexically smallest itinerary', description: 'Sort each adjacency list in descending order so pop() returns the smallest destination.' },
        { name: 'Pick the start node', description: 'Directed: the node with out − in = 1, else any node with an edge. Undirected: an odd-degree node, else any.' },
        { name: 'De Bruijn sequence', description: 'Nodes = strings of length n−1, edges = append a digit. An Euler circuit visits every length-n string once.' },
      ],
      mistakes: [
        'Appending nodes on the way DOWN instead of when stuck (produces a walk that misses detours)',
        'Starting at an arbitrary node when a node with out − in = 1 exists',
        'Using shift() to take the smallest neighbour — O(E) per call; sort descending and pop()',
        'Confusing Eulerian (edges) with Hamiltonian (nodes)',
      ],
      evolution: {
        easy: 'Decide if an Euler path exists from the degrees.',
        medium: 'Build the path with Hierholzer (reconstruct itinerary).',
        hard: 'Model the problem as a graph first (pairs → edges, passwords → de Bruijn edges) and pick the right start.',
      },
    },
    {
      id: 'adv-graph-functional',
      name: 'Functional Graphs — Cycles with Trees Hanging Off',
      summary: 'When every node has exactly one outgoing edge (i → f[i]), each component is exactly one cycle with in-trees feeding into it. Peel the trees with in-degree (Kahn), what remains are the cycles.',
      whyItExists: 'A general graph can be messy; a functional graph always has the same shape. Knowing the shape lets you compute cycle lengths and longest chains into each cycle node in O(n) instead of simulating walks from every node.',
      whenToUse: [
        'Input is a single array `next[i]` / `favorite[i]` / `edges[i]` (one pointer per node)',
        'Questions about cycles, chain lengths, "who ends up where" after following pointers',
      ],
      clues: ['"each person has exactly one favorite"', '"edges[i] is the node i points to"', '"exactly one outgoing edge"', '"longest cycle"', '"follow the pointer repeatedly"'],
      whenNotToUse: [
        'Nodes can have many outgoing edges — general SCC / DFS techniques apply instead',
      ],
      template: `function functionalShape(f) {
  const n = f.length, indeg = new Array(n).fill(0), depth = new Array(n).fill(0);
  for (const v of f) indeg[v]++;
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  for (let h = 0; h < queue.length; h++) {         // peel tree nodes (Kahn)
    const u = queue[h], v = f[u];
    depth[v] = Math.max(depth[v], depth[u] + 1);   // longest chain ending at v
    if (--indeg[v] === 0) queue.push(v);
  }
  // nodes with indeg > 0 now lie on cycles
  return { onCycle: indeg.map((d) => d > 0), depth };
}`,
      variations: [
        { name: 'Longest cycle', description: 'Walk each unvisited cycle node until you return; count steps.' },
        { name: '2-cycles + chains', description: 'Mutual pairs (a→b, b→a) can each carry the longest chain into a and into b; all such pairs can be combined.' },
        { name: 'k-th successor', description: 'Binary lifting (jump tables) on f.' },
      ],
      mistakes: [
        'Treating it like a general graph and running DFS from every node (O(n²))',
        'Forgetting that several 2-cycles can be combined but only ONE longer cycle can be used',
      ],
      evolution: {
        easy: 'Find the length of the cycle reached from node 0.',
        medium: 'Longest cycle in the whole functional graph.',
        hard: 'Combine cycle structure with chain DP (maximum employees at a round table).',
      },
    },
    {
      id: 'adv-graph-meta-bfs',
      name: 'BFS over Meta-Nodes (Routes, Groups)',
      summary: 'When moving inside a group is free and switching groups costs 1, BFS over the GROUPS (e.g. bus routes) instead of the individual items (stops).',
      whyItExists: 'Connecting every pair of stops on a route creates O(L²) edges per route. Treating a whole route as one node keeps the graph small and makes "number of buses taken" exactly the BFS level.',
      whenToUse: ['"Minimum number of buses / lines / groups to switch"', 'Items belong to groups and cost is counted per group change'],
      clues: ['"least number of buses"', '"minimum transfers"', '"each route is a cycle of stops"'],
      whenNotToUse: ['Edges have different weights → Dijkstra', 'Cost is per item step, not per group change → ordinary BFS on items'],
      template: `function minGroups(groups, source, target) {
  if (source === target) return 0;
  const byItem = new Map();                    // item → group ids
  groups.forEach((g, id) => g.forEach((x) => {
    if (!byItem.has(x)) byItem.set(x, []);
    byItem.get(x).push(id);
  }));
  const usedGroup = new Array(groups.length).fill(false), seenItem = new Set([source]);
  let frontier = [source], steps = 0;
  while (frontier.length) {
    steps++;
    const next = [];
    for (const item of frontier) for (const gid of byItem.get(item) ?? []) {
      if (usedGroup[gid]) continue;
      usedGroup[gid] = true;
      for (const x of groups[gid]) {
        if (x === target) return steps;
        if (!seenItem.has(x)) { seenItem.add(x); next.push(x); }
      }
    }
    frontier = next;
  }
  return -1;
}`,
      variations: [{ name: 'Word groups / colours', description: 'Same trick for "jump to any cell with the same value" (Jump Game IV): after using a value group once, clear it.' }],
      mistakes: ['Not marking a group as used — each route would be scanned again and again (O(routes²·L))', 'Forgetting source === target returns 0'],
      evolution: { easy: 'BFS on a small explicit graph.', medium: 'Build the item → group index yourself.', hard: 'Bus routes with 10^5 stops per route: marking groups used is what keeps it linear.' },
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
            md: `So far you have used DFS and BFS to answer *"can I get from A to B?"* and *"how far is it?"*. This topic squeezes **structural** facts out of the same traversals:

| Question | Tool | Graph |
|---|---|---|
| Which **edge** (cable) breaks the network if it fails? | Bridges (low-link DFS) | undirected |
| Which **node** (router) breaks the network if it fails? | Articulation points (low-link DFS) | undirected |
| Which groups of nodes can all reach each other? | Strongly connected components (Kosaraju / Tarjan) | directed |
| How do I use **every edge exactly once**? | Eulerian path (Hierholzer) | directed or undirected |
| Every node has exactly one arrow out — what shape is that? | Functional graph (cycles + trees) | directed |

None of these needs new data structures — just an adjacency list, a few arrays and a clever DFS. What is new is **what we record during the DFS and why it proves something.**`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'New terms',
            md: `- **Bridge** — an edge whose removal increases the number of connected components.
- **Articulation point (cut vertex)** — a node whose removal (with its edges) increases the number of components.
- **Strongly connected component (SCC)** — in a directed graph, a maximal group of nodes where every node can reach every other node.
- **Condensation** — the graph you get by shrinking every SCC into one super-node. It is always a DAG.
- **Eulerian path** — a walk that uses every edge exactly once. **Eulerian circuit** — one that also ends where it started.
- **Functional graph** — a directed graph where every node has exactly one outgoing edge.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Think of a city road network. A **bridge** is the only road to an island suburb — close it and the suburb is cut off. An **articulation point** is a single roundabout that every route to the suburb passes through. An **SCC** is a one-way-street district where you can drive from any block to any other. An **Euler path** is the route of a street-sweeper that must sweep every street exactly once.',
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-1',
            question: 'Undirected graph: a triangle 0–1–2–0 plus an extra edge 2–3. Which edge is a **bridge**?',
            options: ['0–1', '1–2', '2–3', 'None — every edge lies on a cycle'],
            answer: 2,
            explanation: 'Removing 2–3 isolates node 3. The triangle edges each lie on the cycle 0–1–2–0, so removing any one of them leaves the other two as a detour. **An edge is a bridge exactly when it lies on no cycle.**',
            misconceptions: {
              0: '0–1 is on the triangle. Remove it and 0 still reaches 1 via 0–2–1.',
              1: '1–2 is on the triangle. Remove it and 1 still reaches 2 via 1–0–2.',
              3: 'Edge 2–3 is not on any cycle — node 3 has only one connection, so its only edge is a bridge.',
            },
            deeper: '"Lies on no cycle" is the key fact the low-link DFS tests: a back edge from a subtree to above its parent means a cycle passes through the tree edge, so the tree edge is not a bridge.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Every question in this topic has an obvious but slow answer:

- **Bridges:** remove each edge, run a BFS, put it back → E × O(V + E). For 10^5 edges that is ~10^10 operations.
- **SCCs:** for every pair (u, v), check u → v and v → u → V × O(V + E).
- **Euler path:** backtrack over edge orders → exponential.

The algorithms here do each job in **one or two DFS passes, O(V + E)**. They work because a DFS tree has a very rigid structure: in an undirected graph every non-tree edge connects a node to one of its **ancestors** (there are no "cross edges"). That single fact is what makes low-link values meaningful.`,
          },
          {
            type: 'reflect',
            prompt: 'Why is it true that, in an undirected DFS, a non-tree edge always goes to an ancestor (never "sideways" to another branch)?',
            deeper: `Suppose DFS is at node u and u has an edge to v in a different, already *finished* branch. When that branch was being explored, v was active and saw the edge v–u with u still unvisited — so DFS would have walked v → u right then, making u a descendant of v. Contradiction. So every edge is either a tree edge or connects a node to an ancestor/descendant (a **back edge**).

In directed graphs this is false — cross edges exist — which is why SCC algorithms need extra care (a stack in Tarjan, the transpose in Kosaraju).`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `| Signal in the problem | Technique |
|---|---|
| Undirected, "which link/node is critical", "disconnect" | Low-link DFS (bridges / articulation points) |
| Directed, "reach each other", "groups", "minimum starts so all reachable" | SCC (Kosaraju) + condensation |
| "Use every ticket / pair / edge exactly once", "chain where end = next start" | Eulerian path (Hierholzer) |
| "Shortest string containing every code" | De Bruijn = Euler circuit |
| One array \`next[i]\` / \`favorite[i]\` | Functional graph: peel trees with in-degree, study the cycles |
| "Minimum number of buses/lines" | BFS over meta-nodes (routes) |`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Euler vs Hamilton',
            md: '"Visit every **edge** once" is Eulerian and easy (O(E)). "Visit every **node** once" is Hamiltonian and NP-hard — only small inputs (n ≤ ~20) with bitmask DP. Read the statement carefully; interviewers love this trap.',
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-2',
            question: '"Given flight tickets [from, to], build an itinerary that uses **all tickets exactly once**." Which technique fits?',
            options: [
              'Hamiltonian path with bitmask DP',
              'Dijkstra from the start airport',
              'Topological sort of the airports',
              'Eulerian path with Hierholzer',
            ],
            answer: 3,
            explanation: 'Tickets are **edges**. Using every edge exactly once is the definition of an Eulerian path.',
            misconceptions: {
              0: 'Hamiltonian means every *airport* exactly once. Here airports repeat (you may pass through JFK several times); it is the tickets that are used once.',
              1: 'Dijkstra finds shortest paths; nothing here is about distance.',
              2: 'Itineraries can revisit airports and contain cycles (JFK → ATL → JFK), so there is no topological order.',
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
            clues: ['"critical connections"', '"removing it disconnects"', '"strongly connected" / "mutually reachable"', '"use every edge / ticket exactly once"', '"exactly one outgoing edge"', '"minimum number of buses"'],
            conclusion: 'Think low-link DFS, SCC/condensation, Hierholzer, functional graph or meta-node BFS',
          },
          {
            type: 'text',
            md: `Checklist:

1. **Directed or undirected?** Bridges/articulation points are undirected tools; SCCs are directed.
2. **Nodes or edges?** "Remove an edge" → bridge; "remove a node" → articulation point; "use every edge" → Euler.
3. **Out-degree exactly one?** Functional graph — the shape is fixed, exploit it.
4. **Is the answer tiny by nature?** E.g. "min cells to disconnect an island" is always 0, 1 or 2 — test each case.`,
          },
        ],
      },
      {
        id: 'intuition-lowlink',
        title: 'Core intuition — discovery time & low-link',
        blocks: [
          {
            type: 'text',
            md: `Let us go slowly. Run a DFS and give each node a **timestamp** the moment we first reach it: 0, 1, 2, … That is its **discovery time**, \`disc[u]\`.

Take this graph: a triangle 0–1–2 and a tail 1–3–4.

\`\`\`text
        0
       / \\
      1---2          edges: 0-1, 1-2, 2-0, 1-3, 3-4
      |
      3
      |
      4
\`\`\`

DFS from 0 visits 0 → 1 → 2, then (back at 1) 3 → 4. The **DFS tree** (solid) and the one **back edge** (dotted) look like this:

\`\`\`text
   disc  low
    0     0      0
                 |  :
    1     0      1  :   ← low[1] = 0 because its subtree (node 2) reaches 0
                / \\ :
    2     0    2   \\:.. back edge 2 ⇢ 0
                    \\
    3     3          3  ← nothing below 3 climbs above 3
                     |
    4     4          4
\`\`\``,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Low-link value',
            md: `\`low[u]\` = the **smallest discovery time** you can reach starting from u, going **down** tree edges any number of times and then taking **at most one back edge** up.

In plain words: *"how high up the tree can u's subtree climb without using the edge to u's parent?"*`,
          },
          {
            type: 'text',
            md: `Now the two rules read almost like English. For a tree edge parent **p** → child **c**:

- If \`low[c] > disc[p]\` → c's whole subtree cannot even reach p except through the edge p–c. Remove that edge and the subtree falls off → **p–c is a bridge**.
- If \`low[c] >= disc[p]\` → c's subtree cannot reach anything **above** p. Remove node p and the subtree falls off → **p is an articulation point** (unless p is the root; see below).

In the drawing: \`low[3] = 3 > disc[1] = 1\` → 1–3 is a bridge and 1 is a cut vertex. \`low[4] = 4 > disc[3] = 3\` → 3–4 is a bridge and 3 is a cut vertex. \`low[2] = 0\` is not > \`disc[1] = 1\`, so 1–2 is not a bridge — the back edge 2 ⇢ 0 is the detour.`,
          },
          {
            type: 'visual',
            scenario: 'graph-dfs',
            input: { n: 5, edges: [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]], start: 0 },
            caption: 'Watch the DFS order: 0, 1, 2 (then the back edge to 0), back up to 1, then 3, 4. That order IS the discovery time.',
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-3',
            question: 'Why is the bridge test `low[c] > disc[p]` (strict) but the articulation test `low[c] >= disc[p]`?',
            options: [
              'It is arbitrary; both could use >=',
              'If low[c] === disc[p], the subtree can climb back to p itself — the EDGE p–c is not needed (there is another path to p), but NODE p is still needed',
              'Because articulation points are rarer than bridges',
              'Because discovery times start at 1 for bridges and 0 for articulation points',
            ],
            answer: 1,
            explanation: 'low[c] === disc[p] means a back edge lands exactly on p. So there is a second path from the subtree to p → the edge p–c lies on a cycle → not a bridge. But every path from the subtree to the rest of the graph still passes through p → p is a cut vertex.',
            misconceptions: {
              0: 'Try the triangle 0–1–2 with an extra node hanging off... simpler: triangle p–c–x–p. low[c] = disc[p], and p–c is NOT a bridge. With `>=` you would wrongly call it one.',
              2: 'Frequency has nothing to do with it; the two tests answer different questions (edge removal vs node removal).',
              3: 'Where the counter starts does not matter; only comparisons between timestamps do.',
            },
            deeper: 'Picture "reaching p" vs "reaching above p". Removing an edge is survivable if you can still get to p some other way (= reach p). Removing the node p is survivable only if you can bypass p entirely (= reach strictly above p).',
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-4',
            question: 'The DFS root r has two children a and b in the DFS tree. Why is r then **always** an articulation point?',
            options: [
              'Because the root always has the smallest discovery time',
              'Because a and b are in different subtrees, and in an undirected DFS there are no edges between different subtrees — the only link is r',
              'Because low[r] = 0',
              'It is not; the root needs the same low test as everyone else',
            ],
            answer: 1,
            explanation: 'If there were an edge between a\'s subtree and b\'s subtree, DFS would have walked it while exploring a, putting b inside a\'s subtree. So two DFS children of the root are connected only through the root.',
            misconceptions: {
              0: 'True but irrelevant — every root has disc 0, even roots that are not cut vertices (e.g. a root with one child).',
              2: 'low[r] = 0 always, so it gives no information. That is precisely why the root needs its own rule.',
              3: 'For the root the test `low[c] >= disc[r] = 0` is ALWAYS true, so the normal rule would call every root a cut vertex. Hence the special "≥ 2 children" rule.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'code',
            title: 'Bridges by deletion — O(E · (V + E))',
            code: `function bridgesBrute(n, edges) {
  const result = [];
  for (let skip = 0; skip < edges.length; skip++) {
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(([u, v], i) => { if (i !== skip) { adj[u].push(v); adj[v].push(u); } });
    const [a, b] = edges[skip];
    const seen = new Array(n).fill(false);
    const stack = [a]; seen[a] = true;
    while (stack.length) {
      const u = stack.pop();
      for (const v of adj[u]) if (!seen[v]) { seen[v] = true; stack.push(v); }
    }
    if (!seen[b]) result.push(edges[skip]);   // a can no longer reach b
  }
  return result;
}`,
            caption: 'Correct and a good thing to say first in an interview — but with 10^5 edges it is ~10^10 steps.',
          },
          {
            type: 'text',
            md: 'What is wasted? Every BFS re-discovers almost the same tree. The low-link DFS builds the tree **once** and answers "is there a detour around this tree edge?" for all edges simultaneously by passing \`low\` values up the tree.',
          },
        ],
      },
      {
        id: 'optimized-bridges',
        title: 'Optimized approach — bridges & articulation points',
        blocks: [
          {
            type: 'steps',
            title: 'Tarjan-style low-link DFS',
            steps: [
              'Build an adjacency list storing `[neighbour, edgeId]` so parallel edges can be told apart.',
              'DFS(u, parentEdge): set `disc[u] = low[u] = time++`.',
              'For each `[v, id]`: skip `id === parentEdge`. If v is unvisited → recurse, then `low[u] = min(low[u], low[v])` and apply the bridge / cut tests. If v is visited → it is an ancestor (back edge): `low[u] = min(low[u], disc[v])`.',
              'Root rule: the DFS root is a cut vertex iff it has ≥ 2 tree children.',
              'Repeat from every unvisited node (the graph may be disconnected).',
            ],
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-5',
            question: 'Edges: [[0,1],[0,1]] (two parallel cables between 0 and 1). If you skip the parent by **node** (`if (v === parent) continue`), what goes wrong?',
            options: [
              'Nothing — it still works',
              'Infinite recursion',
              'Both copies of 0–1 are skipped from node 1, so low[1] stays 1 > disc[0] = 0 and 0–1 is wrongly reported as a bridge',
              'Node 0 is reported as an articulation point',
            ],
            answer: 2,
            explanation: 'The second cable IS a detour, so 0–1 is not a bridge. Skipping by node ignores it. Skipping only the specific edge id we arrived through lets the parallel copy act as a back edge.',
            misconceptions: {
              0: 'For simple graphs it works, which is why this bug survives many tests. Parallel edges expose it.',
              1: 'Visited nodes are never re-entered, so there is no infinite recursion.',
              3: 'With only two nodes nobody can be a cut vertex (removing either leaves a single node). The actual bug is the false bridge.',
            },
          },
        ],
      },
      {
        id: 'template-bridges',
        title: 'Pattern / template — low-link',
        blocks: [
          {
            type: 'code',
            title: 'Bridges + articulation points in one DFS',
            code: `const adj = Array.from({ length: n }, () => []);
edges.forEach(([u, v], id) => { adj[u].push([v, id]); adj[v].push([u, id]); });
const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
let time = 0;

function dfs(u, parentEdge) {
  disc[u] = low[u] = time++;
  let children = 0;
  for (const [v, id] of adj[u]) {
    if (id === parentEdge) continue;
    if (disc[v] === -1) {
      children++;
      dfs(v, id);
      low[u] = Math.min(low[u], low[v]);
      if (low[v] > disc[u]) { /* (u, v) is a bridge */ }
      if (parentEdge !== -1 && low[v] >= disc[u]) { /* u is a cut vertex */ }
    } else {
      low[u] = Math.min(low[u], disc[v]);
    }
  }
  if (parentEdge === -1 && children > 1) { /* root u is a cut vertex */ }
}`,
          },
        ],
      },
      {
        id: 'implementation-bridges',
        title: 'JavaScript implementation — iterative low-link (deep graphs)',
        blocks: [
          {
            type: 'text',
            md: `JavaScript engines typically allow roughly **10,000 nested calls** before throwing \`RangeError: Maximum call stack size exceeded\` (the exact number depends on the engine and frame size). A path graph with 10^5 nodes makes a recursive DFS exactly that deep. The fix: simulate the call stack with an array of **frames** that remember where each node was in its neighbour list.`,
          },
          {
            type: 'code',
            title: 'Iterative bridges — O(V + E), no recursion',
            code: `function findBridges(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], id) => { adj[u].push([v, id]); adj[v].push([u, id]); });
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const bridges = [];
  let time = 0;

  for (let s = 0; s < n; s++) {
    if (disc[s] !== -1) continue;
    disc[s] = low[s] = time++;
    const stack = [[s, -1, 0]];                 // frame: [node, parentEdgeId, next neighbour index]
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const u = frame[0];
      if (frame[2] < adj[u].length) {           // still has neighbours to look at
        const [v, id] = adj[u][frame[2]++];
        if (id === frame[1]) continue;
        if (disc[v] === -1) {                   // "recursive call"
          disc[v] = low[v] = time++;
          stack.push([v, id, 0]);
        } else {
          low[u] = Math.min(low[u], disc[v]);   // back edge
        }
      } else {                                  // "return" from u
        stack.pop();
        if (stack.length) {
          const p = stack[stack.length - 1][0];
          low[p] = Math.min(low[p], low[u]);    // the line that ran after dfs(v) returned
          if (low[u] > disc[p]) bridges.push([p, u]);
        }
      }
    }
  }
  return bridges;
}`,
            caption: 'The code after a recursive call ("low[u] = min(low[u], low[v])") moves to the moment the child frame is popped.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`Array.from({ length: n }, () => [])\` — **never** \`new Array(n).fill([])\`, which puts the *same* array in every slot.
- Store edges as \`[neighbour, id]\` pairs; with 10^5 edges consider two flat \`Int32Array\`s (\`to\`, \`edgeId\`) for speed.
- Keep \`time\` in a closure variable (or an object) — not a parameter — so every call shares one counter.`,
          },
        ],
      },
      {
        id: 'dry-run-bridges',
        title: 'Dry run — low-link',
        blocks: [
          {
            type: 'dryrun',
            title: 'Graph 0-1, 1-2, 2-0, 1-3, 3-4 (DFS from 0)',
            columns: ['event', 'disc', 'low after', 'test', 'result'],
            rows: [
              ['visit 0', '0:0', '0:0', '—', ''],
              ['visit 1 (from 0)', '1:1', '1:1', '—', ''],
              ['visit 2 (from 1)', '2:2', '2:2', '—', ''],
              ['2 sees 0 (back edge)', '', '2:0', 'low[2] = min(2, disc[0]=0)', ''],
              ['return 2 → 1', '', '1:0', 'low[2]=0 > disc[1]=1?', 'no → 1–2 not a bridge'],
              ['visit 3 (from 1)', '3:3', '3:3', '—', ''],
              ['visit 4 (from 3)', '4:4', '4:4', '—', ''],
              ['return 4 → 3', '', '3:3', 'low[4]=4 > disc[3]=3?', 'bridge 3–4; 3 is a cut vertex'],
              ['return 3 → 1', '', '1:0', 'low[3]=3 > disc[1]=1?', 'bridge 1–3; 1 is a cut vertex'],
              ['return 1 → 0', '', '0:0', 'root has 1 child', '0 is NOT a cut vertex'],
            ],
            note: 'Bridges: 1–3, 3–4. Articulation points: 1, 3.',
          },
        ],
      },
      {
        id: 'intuition-scc',
        title: 'Core intuition — strongly connected components',
        blocks: [
          {
            type: 'text',
            md: `In a **directed** graph, reachability is not symmetric: 0 → 1 does not mean 1 → 0. Group nodes that can reach each other both ways and you get **strongly connected components**.

\`\`\`text
   0 → 1 → 2 → 3 → 4
   ↑       |   ↑   |
   └───────┘   └───┘

   SCC A = {0, 1, 2}   (0→1→2→0)
   SCC B = {3, 4}      (3→4→3)
   Condensation:  A ──→ B     (a DAG!)
\`\`\`

**Why is the condensation always a DAG?** If there were a cycle A → B → A between two components, every node of A could reach every node of B and back — so they would be one SCC, not two.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Analogy',
            md: 'SCCs are like one-way-street neighbourhoods: inside a neighbourhood you can drive anywhere and come back. Between neighbourhoods the streets only go one way, so once you leave you can never return. The map of neighbourhoods (the condensation) has no loops.',
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-6',
            question: 'Directed edges: 0→1, 1→2, 2→0, 2→3. How many SCCs are there?',
            options: ['1', '4', '3', '2'],
            answer: 3,
            explanation: '{0, 1, 2} form a cycle, so they are one SCC. Node 3 can be reached but cannot get back, so it is its own SCC. Total: 2.',
            misconceptions: {
              0: 'Node 3 has no outgoing edge back to the cycle, so it cannot be in the same SCC — SCCs need reachability in BOTH directions.',
              1: 'Four would mean nobody can reach anybody and back. But 0→1→2→0 is a cycle.',
              2: 'Every node belongs to exactly one SCC; a single node with no cycle through it is still its own SCC.',
            },
          },
        ],
      },
      {
        id: 'optimized-scc',
        title: 'Optimized approach — Kosaraju (two passes)',
        blocks: [
          {
            type: 'steps',
            title: "Kosaraju's algorithm",
            steps: [
              '**Pass 1:** DFS the original graph. Push each node onto `order` when it **finishes** (all its descendants are done).',
              '**Transpose:** build the reversed graph (every edge u→v becomes v→u).',
              '**Pass 2:** go through `order` from last to first (decreasing finish time). Each still-unassigned node starts a DFS **on the transpose**; every node reached gets the same component id.',
            ],
          },
          {
            type: 'text',
            md: `**Why does it work?** Two facts:

1. *The node that finishes last lives in a **source** SCC of the condensation* (no edges come in from other SCCs). More generally, if there is an edge from SCC X to SCC Y, the latest finish time in X is larger than every finish time in Y.
2. Reversing all edges keeps the SCCs the same (a cycle reversed is still a cycle) but turns sources into **sinks**.

So in pass 2, the first DFS starts in a component that, in the transpose, is a sink: it can only reach its own SCC. Mark it. The next start (next-largest finish time among unmarked nodes) is again a sink **among the remaining components** — any edge out of it in the transpose leads only into components already marked. Peel them off one by one.`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: "Tarjan's SCC (one pass)",
            md: "Tarjan's algorithm uses the same `disc`/`low` idea as bridges, plus a stack of \"active\" nodes. When a node finishes with `low[u] === disc[u]`, it is the first node of its SCC that DFS entered — pop the stack down to u; those nodes are the SCC. One pass, no transpose, same O(V + E). Kosaraju is easier to get right under pressure; Tarjan is slightly faster and uses less memory.",
          },
          {
            type: 'text',
            md: `**Condensation questions.** Once every node has \`comp[u]\`, loop over edges: an edge u → v with \`comp[u] !== comp[v]\` is an edge in the condensation DAG. Mark \`hasIncoming[comp[v]] = true\`.

*"Minimum number of nodes to start from so that every node is reachable"* = the number of **source components** (in-degree 0). Each source component must contain a start (nothing else can reach it), and one start per source is enough (every component is reachable from some source in a DAG).`,
          },
          {
            type: 'visual',
            scenario: 'topo-sort',
            input: { n: 4, edges: [[0, 1], [0, 2], [1, 3], [2, 3]] },
            caption: 'After condensing, the component graph is a DAG, so everything you learned in Topological Sort applies to it — e.g. sources are the nodes with in-degree 0.',
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-7',
            question: 'Kosaraju pass 2 runs on the **transposed** graph. What would happen if you ran it on the original graph (still in decreasing finish order)?',
            options: [
              'The same result — reversing edges does not change reachability',
              'The first DFS starts in a source component and can flow into downstream components, merging several SCCs into one',
              'It would find fewer SCCs only for DAGs',
              'It would crash',
            ],
            answer: 1,
            explanation: 'The last-finished node is in a SOURCE SCC. In the original graph, a source can reach many other SCCs, so the DFS would swallow them all. In the transpose that SCC becomes a sink, so the DFS stays inside it.',
            misconceptions: {
              0: 'Reversing edges does not change which nodes are in the same SCC, but it absolutely changes what one DFS reaches — that is the whole point.',
              2: 'It goes wrong for any graph with an edge between two SCCs, cycles or not.',
              3: 'Nothing crashes; you just silently get merged components.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Can you explain why the node with the largest finish time must be in a source SCC?',
            deeper: `Take any edge from SCC X into SCC Y (X ≠ Y). Case 1: DFS enters X first — then it reaches all of Y before finishing X's first node, so X's max finish > Y's max finish. Case 2: DFS enters Y first — it cannot reach X from Y (otherwise they would be the same SCC), so all of Y finishes before X is even started; again X's max finish is larger.

So along every condensation edge X → Y, the max finish time goes down. The overall maximum therefore sits in a component with no incoming condensation edge: a source.`,
          },
        ],
      },
      {
        id: 'template-scc',
        title: 'Pattern / template — Kosaraju + condensation',
        blocks: [
          {
            type: 'code',
            title: 'Iterative Kosaraju (safe for deep graphs)',
            code: `function scc(n, edges) {
  const g = Array.from({ length: n }, () => []), rg = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { g[u].push(v); rg[v].push(u); }

  const seen = new Array(n).fill(false), order = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    seen[s] = true;
    const stack = [[s, 0]];                         // [node, next neighbour index]
    while (stack.length) {
      const top = stack[stack.length - 1], u = top[0];
      if (top[1] < g[u].length) {
        const v = g[u][top[1]++];
        if (!seen[v]) { seen[v] = true; stack.push([v, 0]); }
      } else {
        order.push(u);                              // u finished
        stack.pop();
      }
    }
  }

  const comp = new Array(n).fill(-1);
  let count = 0;
  for (let i = n - 1; i >= 0; i--) {
    const s = order[i];
    if (comp[s] !== -1) continue;
    comp[s] = count;
    const stack = [s];                              // pass 2 order does not matter
    while (stack.length) {
      const u = stack.pop();
      for (const v of rg[u]) if (comp[v] === -1) { comp[v] = count; stack.push(v); }
    }
    count++;
  }
  return { count, comp };
}`,
            caption: 'Pass 1 must record TRUE finishing order, so it needs frames. Pass 2 only needs "everything reachable", so a plain stack is fine.',
          },
        ],
      },
      {
        id: 'implementation-scc',
        title: 'JavaScript implementation — counting source components',
        blocks: [
          {
            type: 'code',
            title: 'Minimum starting nodes = number of source SCCs',
            code: `function minStarts(n, edges) {
  const { count, comp } = scc(n, edges);         // from the template above
  const hasIncoming = new Array(count).fill(false);
  for (const [u, v] of edges) {
    if (comp[u] !== comp[v]) hasIncoming[comp[v]] = true;
  }
  return hasIncoming.filter((x) => !x).length;
}`,
          },
        ],
      },
      {
        id: 'dry-run-scc',
        title: 'Dry run — Kosaraju',
        blocks: [
          {
            type: 'dryrun',
            title: 'Edges 0→1, 1→2, 2→0, 2→3, 3→4, 4→3',
            columns: ['step', 'action', 'order / comp'],
            rows: [
              ['pass 1', 'DFS 0 → 1 → 2 → 3 → 4; 4 finishes, then 3, 2, 1, 0', 'order = [4, 3, 2, 1, 0]'],
              ['transpose', '1→0, 2→1, 0→2, 3→2, 4→3, 3→4', ''],
              ['pass 2, start 0', 'transpose DFS from 0: 0 → 2 → 1 (in the transpose, 2 only points to 1; the edge 3→2 points INTO this group)', 'comp A = {0, 2, 1}'],
              ['pass 2, next 1, 2', 'already assigned', ''],
              ['pass 2, start 3', 'transpose DFS from 3: 3 → 4 (3 → 2 is already in A)', 'comp B = {3, 4}'],
              ['result', '2 SCCs; condensation A → B; sources = {A}', 'count = 2, minStarts = 1'],
            ],
            note: 'Starting pass 2 at node 0 (largest finish time) kept the DFS inside {0,1,2}: in the transpose, nothing leaves that component.',
          },
        ],
      },
      {
        id: 'intuition-euler',
        title: 'Core intuition — Eulerian paths',
        blocks: [
          {
            type: 'text',
            md: `Every time a walk passes **through** a node it uses one edge in and one edge out. So in a directed graph:

- **Euler circuit** exists ⇔ every node has in-degree = out-degree (and all edges are in one connected piece).
- **Euler path** exists ⇔ exactly one node has out − in = 1 (the **start**), exactly one has in − out = 1 (the **end**), all others are balanced — or everything is balanced (a circuit).

Undirected version: 0 odd-degree nodes → circuit; exactly 2 → path between them.

**Hierholzer's idea.** Walk from the start, always taking any unused edge. You can only get stuck at the end node (every other node has an exit for every entrance). But you might get stuck *early*, before using all edges — some cycles were skipped. Fix: when you get stuck at a node, **that node is final**: write it at the *end* of the answer and back up one step. From the previous node, continue into any remaining unused edges — they form detour cycles that get spliced in automatically.`,
          },
          {
            type: 'code',
            title: 'Hierholzer with an explicit stack',
            code: `const stack = [start], path = [];
while (stack.length) {
  const u = stack[stack.length - 1];
  if (adj[u].length) stack.push(adj[u].pop());   // walk forward along an unused edge
  else path.push(stack.pop());                   // stuck → u is fixed at the END
}
path.reverse();                                  // nodes were collected end-first`,
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-8',
            question: 'Tickets: JFK→A, A→JFK, JFK→B. Greedy lexical walk: JFK → A → JFK → B uses all tickets. But what if we had JFK→A, JFK→B, B→JFK? Greedy goes JFK → A and is stuck with tickets left. What does Hierholzer do?',
            options: [
              'Returns "no itinerary"',
              'Restarts from B',
              'Marks A as the final airport (appends it to the result), backs up to JFK, and continues JFK → B → JFK; reversed result: JFK, B, JFK, A',
              'Tries every permutation of tickets',
            ],
            answer: 2,
            explanation: 'Getting stuck at A means A must be the LAST stop. Hierholzer pushes A onto the path, pops back to JFK, and explores the remaining cycle JFK→B→JFK. Post-order collection + reverse yields JFK, B, JFK, A — valid and, among valid ones, lexically smallest.',
            misconceptions: {
              0: 'An itinerary exists (JFK→B→JFK→A); greedy just picked the dead end first. The degree conditions say a path exists.',
              1: 'The itinerary must start at JFK. Hierholzer never restarts; it splices detours.',
              3: 'That is exponential backtracking. Hierholzer is O(E log E) with sorting, no retries.',
            },
            deeper: 'Why is lexical order preserved? At each node we still try the smallest ticket first. If that choice leads to a dead end, the dead-end branch is placed at the END of the route, and the remaining (larger) choices are spliced before it — which is exactly the lexically smallest valid order.',
          },
        ],
      },
      {
        id: 'optimized-euler',
        title: 'Optimized approach — Hierholzer & de Bruijn',
        blocks: [
          {
            type: 'steps',
            title: 'Recipe',
            steps: [
              'Model: what are the nodes, what are the edges? (airports/tickets, numbers/pairs, (n−1)-digit states/n-digit passwords)',
              'Compute in/out degrees; pick the start (out − in = 1, otherwise any node with an edge; itinerary problems fix the start).',
              'If lexical order matters, sort each adjacency list **descending** so `pop()` gives the smallest.',
              'Run the stack loop; reverse the collected nodes.',
              'Convert back: consecutive nodes in the path are the edges in order.',
            ],
          },
          {
            type: 'text',
            md: `**De Bruijn sequences (Cracking the Safe).** We want the shortest string containing every length-\`n\` code over digits \`0..k-1\`.

- Node = a string of length \`n − 1\` (the last n − 1 typed digits).
- Edge = typing digit \`d\`: node \`s\` → node \`(s + d).slice(1)\`, and the edge itself *is* the password \`s + d\`.
- Every node has exactly \`k\` in-edges and \`k\` out-edges → balanced → an **Euler circuit** exists and uses all \`k^n\` edges.
- The string is the start node (\`n − 1\` chars) plus one digit per edge: length \`k^n + n − 1\` — optimal, because each of the k^n passwords needs its own ending position.

\`\`\`text
n = 2, k = 2: nodes "0", "1"; edges 00, 01, 10, 11
circuit: 0 -0-> 0 -1-> 1 -1-> 1 -0-> 0      string: "0" + "0110" = "00110"
contains 00, 01, 11, 10 ✓   length 2^2 + 1 = 5 ✓
\`\`\``,
          },
        ],
      },
      {
        id: 'template-euler',
        title: 'Pattern / template — Hierholzer',
        blocks: [
          {
            type: 'code',
            title: 'Directed Euler path on arbitrary labels',
            code: `function eulerPathFromPairs(pairs) {
  const adj = new Map(), balance = new Map();      // balance = out − in
  for (const [u, v] of pairs) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push(v);
    balance.set(u, (balance.get(u) ?? 0) + 1);
    balance.set(v, (balance.get(v) ?? 0) - 1);
  }
  let start = pairs[0][0];
  for (const [node, b] of balance) if (b === 1) { start = node; break; }

  const stack = [start], path = [];
  while (stack.length) {
    const u = stack[stack.length - 1];
    const out = adj.get(u);
    if (out && out.length) stack.push(out.pop());
    else path.push(stack.pop());
  }
  return path.reverse();                           // E + 1 nodes
}`,
          },
        ],
      },
      {
        id: 'implementation-euler',
        title: 'JavaScript implementation — itinerary in lexical order',
        blocks: [
          {
            type: 'code',
            title: 'Reconstruct itinerary',
            code: `function findItinerary(tickets) {
  const adj = new Map();
  for (const [from, to] of tickets) {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
  }
  for (const list of adj.values()) list.sort().reverse(); // smallest at the end → pop()

  const stack = ['JFK'], route = [];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const out = adj.get(top);
    if (out && out.length) stack.push(out.pop());
    else route.push(stack.pop());
  }
  return route.reverse();
}`,
            caption: 'Default sort() is lexicographic — exactly right for airport codes (and exactly wrong for numbers!).',
          },
        ],
      },
      {
        id: 'dry-run-euler',
        title: 'Dry run — Hierholzer',
        blocks: [
          {
            type: 'dryrun',
            title: 'tickets = [JFK→A, JFK→B, B→JFK]',
            columns: ['stack', 'top has unused?', 'action', 'route (reversed)'],
            rows: [
              ['[JFK]', 'yes (A, B)', 'push A (smallest)', '[]'],
              ['[JFK, A]', 'no', 'pop A → route', '[A]'],
              ['[JFK]', 'yes (B)', 'push B', '[A]'],
              ['[JFK, B]', 'yes (JFK)', 'push JFK', '[A]'],
              ['[JFK, B, JFK]', 'no', 'pop JFK', '[A, JFK]'],
              ['[JFK, B]', 'no', 'pop B', '[A, JFK, B]'],
              ['[JFK]', 'no', 'pop JFK', '[A, JFK, B, JFK]'],
            ],
            note: 'Reverse → JFK, B, JFK, A. Each ticket was pushed exactly once and popped exactly once: O(E) after sorting.',
          },
        ],
      },
      {
        id: 'intuition-functional',
        title: 'Core intuition — functional graphs',
        blocks: [
          {
            type: 'text',
            md: `If every node has **exactly one outgoing edge** (\`i → f[i]\`), keep following arrows from any node: you have finitely many nodes, so you must eventually repeat — you fall into a cycle. Each connected piece therefore looks like a **cycle with trees hanging into it**:

\`\`\`text
     5 → 4 ↘
             0 → 1
     6 → 3 ↗ ↑   ↓
             └── 2          cycle 0 → 1 → 2 → 0, trees {4,5} and {3,6} feed into 0
\`\`\`

**How to separate the cycles from the trees:** a tree leaf has in-degree 0. Remove it (decrease its target's in-degree), repeat — exactly Kahn's topological sort. Nodes never removed are on cycles. As a bonus, while peeling you can compute \`depth[v]\` = the longest chain of tree nodes ending at v.`,
          },
          {
            type: 'text',
            md: `**Maximum Employees to Be Invited to a Meeting** (each employee sits next to their favourite at a round table): two kinds of valid tables:

1. **One big cycle** of length ≥ 3: everyone sits next to their favourite around the cycle. No extra people can be attached. Candidate = longest cycle.
2. **Mutual pairs** (a ↔ b, a 2-cycle): a and b sit together, and each can have a chain of people behind them (x → … → a). Candidate = 2 + depth[a] + depth[b] for EACH pair — and because these arrangements are open-ended lines, **all such pairs can sit at the same table**. So sum them.

Answer = max(longest cycle, sum over 2-cycles of (2 + chains)).`,
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-9',
            question: 'favorite = [1, 0, 3, 2] (two mutual pairs, no chains). What is the maximum number of invited employees?',
            options: ['2', '4', '3', '0'],
            answer: 1,
            explanation: 'Both pairs (0↔1 and 2↔3) are 2-cycles. Each contributes 2; pair-based groups can be placed side by side on one table: 0 1 2 3 → 0 sits by 1, 1 by 0, 2 by 3, 3 by 2. Total 4.',
            misconceptions: {
              0: 'That is taking only the best single pair. Unlike big cycles, 2-cycle arrangements are lines that can be concatenated around the table.',
              2: 'There is no 3-cycle here; 3 would mean splitting a pair, which leaves someone away from their favourite.',
              3: 'Every mutual pair can always be seated; the answer is never 0 when n ≥ 2 and favourites exist.',
            },
          },
        ],
      },
      {
        id: 'optimized-meta-bfs',
        title: 'Optimized approach — BFS over routes (meta-nodes)',
        blocks: [
          {
            type: 'text',
            md: `**Bus Routes.** Stops are items, routes are groups. Riding within a route is free; the cost is the number of buses boarded.

- Naive graph on stops: connect every pair of stops on the same route → a route with 10^5 stops creates 5·10^9 edges. Impossible.
- Better: BFS where one "level" = one more bus. From the current stops, look up every route through them (\`stop → routes\` Map); for each **unused** route, mark it used and add all its stops to the next level.

Each route is expanded at most once and each stop is enqueued at most once → O(total stops across routes).`,
          },
          {
            type: 'reflect',
            prompt: 'Why must we mark a route as "used" the first time we expand it, rather than only marking stops as visited?',
            deeper: 'If only stops are marked, a route with 10^5 stops is re-scanned every time we reach any of its stops from a later level — O(routes × stops) or worse. The first time a route is boarded is also the cheapest time (BFS levels increase), so there is never a reason to scan it again.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Parent skip by node instead of edge id** — wrong with parallel edges.
2. **Mixing up \`>\` and \`>=\`** — bridge: \`low[v] > disc[u]\`; cut vertex: \`low[v] >= disc[u]\`.
3. **Forgetting the root rule** for articulation points (≥ 2 DFS children).
4. **Updating low with low[v] on a back edge** — use \`disc[v]\` there. (For bridges the answer happens to survive, but for articulation points it can report wrong cut vertices.)
5. **Kosaraju pass 2 on the original graph** or in the wrong order.
6. **Counting source nodes instead of source components** in condensation questions.
7. **Hierholzer: appending nodes when you enter them** instead of when you get stuck.
8. **\`sort()\` on numbers** — lexicographic by default; use \`(a, b) => a - b\`.
9. **Recursion depth** — JS overflows around 10^4 nested calls; convert DFS to an explicit stack of frames.
10. **\`new Array(n).fill([])\`** — every node shares ONE adjacency array.`,
          },
          {
            type: 'checkpoint',
            id: 'advanced-graphs-cp-10',
            question: 'Your recursive articulation-points solution passes all small tests but throws `RangeError: Maximum call stack size exceeded` on a 100,000-node path graph. Best fix?',
            options: [
              'Switch to BFS — it finds articulation points too',
              'Rewrite the DFS with an explicit stack of frames [node, parentEdge, nextIndex] and do the "after child returns" work when a frame is popped',
              'Increase the recursion limit with a JS flag',
              'Use memoization',
            ],
            answer: 1,
            explanation: 'The algorithm depends on DFS order (discovery and finishing), so keep DFS but manage the stack yourself. Frames remember where each node was in its neighbour list; the low-propagation code moves to the pop step.',
            misconceptions: {
              0: 'BFS trees do not have the "only back edges to ancestors" property, so low-link reasoning fails with BFS.',
              2: 'In a browser or online judge you cannot pass engine flags (like `--stack-size` in Node). Solutions must work with the default stack.',
              3: 'Nothing is recomputed — the problem is depth, not repeated work.',
            },
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(V + E)',
            space: 'O(V + E)',
            md: `- **Bridges / articulation points:** one DFS; every edge is examined twice (once from each end) → O(V + E).
- **Kosaraju:** two DFS passes + building the transpose → O(V + E). Tarjan: one pass, same bound.
- **Hierholzer:** each edge is pushed and popped once → O(E); plus O(E log E) if adjacency lists must be sorted for lexical order.
- **Functional graph:** Kahn peeling + walking cycles → O(n).
- **Bus routes BFS:** O(sum of route lengths) — each route expanded once, each stop enqueued once.
- **Space:** adjacency lists O(V + E) plus O(V) arrays (disc, low, comp, stack).`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- Start with the brute force ("remove each edge and BFS — O(E(V+E))"), then introduce low-link as "one DFS that checks for a detour around every tree edge".
- **Define disc and low out loud** before coding. Most bugs come from a fuzzy definition.
- For SCCs, say *"two passes: finish order, then DFS the transpose in reverse finish order"* and give the one-line reason (last finisher sits in a source SCC).
- For Euler problems, **check the degree conditions first** and state how you pick the start.
- Mention the **recursion-depth** issue in JS for 10^5 nodes — interviewers appreciate it even if they let you write the recursive version.
- Small-answer problems (0/1/2): prove the upper bound first ("2 always suffices"), then test 0 and 1.`,
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
              { api: 'Array.from({ length: n }, () => [])', use: 'Adjacency lists (one fresh array per node)', complexity: 'O(n)' },
              { api: 'new Array(n).fill(-1)', use: 'disc[] / comp[] with -1 = unvisited', complexity: 'O(n)' },
              { api: 'stack.push / stack.pop', use: 'Iterative DFS frames and Hierholzer', complexity: 'O(1) amortized' },
              { api: 'list.sort().reverse()', use: 'Lexical adjacency so pop() yields the smallest', complexity: 'O(d log d) per node' },
              { api: 'new Map()', use: 'String-labelled nodes, stop → routes index, balance (out − in)', complexity: 'O(1) average' },
              { api: 'arr.slice(1) / string concat', use: 'De Bruijn state transitions (n ≤ 4 so cheap)', complexity: 'O(n)' },
              { api: 'head index on an array queue', use: 'BFS / Kahn without shift() (which is O(n))', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Critical edges / nodes in undirected graphs', 'Mutually reachable groups in directed graphs; DAG reasoning on graphs with cycles', 'Use every edge exactly once', 'One outgoing edge per node', 'Min number of groups/routes to switch'],
    clues: ['critical connection', 'articulation point', 'disconnect', 'strongly connected', 'reach each other', 'use all tickets', 'end = next start', 'every password', 'favorite[i]', 'least number of buses'],
    template: `// low-link
disc[u] = low[u] = time++;
for (const [v, id] of adj[u]) {
  if (id === parentEdge) continue;
  if (disc[v] === -1) { dfs(v, id); low[u] = Math.min(low[u], low[v]);
    if (low[v] > disc[u]) bridge(u, v);
    if (!isRoot && low[v] >= disc[u]) cut(u); }
  else low[u] = Math.min(low[u], disc[v]);
}
// Kosaraju: finish order on g → DFS on reversed g in reverse finish order
// Hierholzer: while(stack) top has edge ? push(next) : path.push(pop()); reverse`,
    complexity: 'O(V + E) for all of them (+ sorting for lexical Euler paths)',
    mistakes: ['skip parent by node id', '> vs >=', 'root rule', 'pass 2 on the original graph', 'Hierholzer pre-order instead of post-order', 'recursion depth in JS'],
    jsTools: ['Array.from', 'Map', 'explicit stack', 'sort().reverse() + pop()'],
  },

  keyConcepts: [
    'disc[u] = DFS discovery time; low[u] = earliest disc reachable from u\'s subtree with at most one back edge.',
    'Bridge (u,v) ⇔ low[v] > disc[u]; non-root cut vertex u ⇔ some child low[v] >= disc[u]; root ⇔ ≥ 2 DFS children.',
    'SCCs: Kosaraju = finish order on G, then DFS on the transpose in reverse finish order. The condensation is a DAG.',
    'Minimum starting nodes to reach everything = number of source SCCs.',
    'Euler path: degree conditions + Hierholzer (post-order, then reverse). De Bruijn sequences are Euler circuits.',
    'Functional graphs are cycles with in-trees; peel trees with Kahn, then study cycles.',
    'In JS, convert deep DFS to an explicit stack of frames to avoid stack overflow.',
  ],

  interviewTips: [
    'Define disc/low before coding and state the > vs >= difference.',
    'Justify Kosaraju in one sentence: the last finisher is in a source SCC, which is a sink in the transpose.',
    'Check Euler degree conditions and explain the start node choice.',
    'Mention recursion depth limits for 10^5-node graphs in JavaScript.',
  ],
};
