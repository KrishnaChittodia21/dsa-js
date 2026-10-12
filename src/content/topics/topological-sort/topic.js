export default {
  id: 'topological-sort',
  summary: 'Line up the vertices of a directed graph so every edge points forward — "do prerequisites first". Kahn\'s algorithm peels off vertices with no remaining prerequisites; DFS post-order does it in reverse; both detect cycles.',

  jsTools: [
    { api: 'Array.from({ length: n }, () => [])', use: 'Directed adjacency list (u → v means "u before v")', complexity: 'O(n)' },
    { api: 'new Int32Array(n) / new Array(n).fill(0)', use: 'In-degree counters', complexity: 'O(1) update' },
    { api: 'queue + head pointer', use: "Kahn's queue of vertices with in-degree 0", complexity: 'O(1) per push/pop' },
    { api: 'new Uint8Array(n)', use: 'DFS colours: 0 = white, 1 = gray, 2 = black', complexity: 'O(1) access' },
    { api: 'Map<string, string[]>', use: 'Graphs over letters / recipe names', complexity: 'O(1) average' },
    { api: 'Set per vertex', use: 'Ancestor sets / reachability closure (course schedule IV)', complexity: 'O(1) average add/has' },
    { api: 'result.reverse()', use: 'Turn DFS post-order into a topological order', complexity: 'O(n)' },
  ],

  patterns: [
    {
      id: 'topo-degree-counting',
      name: 'In-degree / Out-degree Counting',
      summary: 'Count edges coming in and going out of each vertex of a directed graph; many questions are answered by those counts alone.',
      whyItExists: 'In a directed graph, the in-degree tells you how many things point at a vertex (how many prerequisites, how many people trust it) and the out-degree how many it points at. Some roles (a judge, a source, a sink) are defined purely by these numbers, so O(n + m) counting beats any traversal. In-degree is also the engine of Kahn\'s algorithm.',
      whenToUse: ['A vertex is defined by "everyone points to it and it points to no one"', 'You need sources (in-degree 0) or sinks (out-degree 0)', 'As the first step of Kahn\'s algorithm'],
      clues: ['"trusts"', '"everybody … nobody"', '"celebrity / judge"', '"no incoming edges"', '"no outgoing edges"'],
      whenNotToUse: ['The answer depends on paths of length > 1 → traverse (BFS/DFS/topo)'],
      template: `function degrees(n, edges) {
  const indeg = new Array(n).fill(0), outdeg = new Array(n).fill(0);
  for (const [u, v] of edges) { outdeg[u]++; indeg[v]++; }
  return { indeg, outdeg };
}`,
      variations: [{ name: 'Net score', description: 'score = indeg − outdeg; the judge is the unique vertex with score n − 1.' }],
      mistakes: ['Mixing up direction: [a, b] "a trusts b" is the edge a → b, so b gains in-degree', '1-based labels with a 0-based array'],
      evolution: { easy: 'Find the town judge / star center.', medium: 'Sources and sinks as seeds for Kahn.', hard: 'Degree reasoning inside larger algorithms (leaf trimming, Euler paths).' },
    },
    {
      id: 'topo-kahn-indegree',
      name: "Kahn's Algorithm (BFS on in-degree 0)",
      summary: 'Start with every vertex that has no prerequisites. Repeatedly output one, and "delete" its outgoing edges; any vertex whose in-degree drops to 0 becomes ready. If fewer than n vertices are output, there is a cycle.',
      whyItExists: 'Dependencies form a directed graph; a valid schedule is an order where every edge points forward. A vertex with in-degree 0 can safely go first because nothing must precede it. Removing it cannot create new cycles, so repeating the argument builds the whole order in O(V + E).',
      whenToUse: ['Order tasks / courses / builds by prerequisites', 'Decide whether a set of dependencies is satisfiable (cycle detection in a directed graph)', 'Process a DAG in dependency order (longest path, earliest finish time, DP over a DAG)'],
      clues: ['"prerequisites"', '"must be taken before"', '"dependencies"', '"order of compilation / build"', '"is it possible to finish all"', '"any valid order"'],
      whenNotToUse: ['The graph is undirected — "order" is meaningless there', 'Cycles are allowed and meaningful (use SCCs — advanced graphs)'],
      template: `function kahn(n, edges) {           // edge [u, v] means u must come before v
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const v of adj[u]) if (--indeg[v] === 0) queue.push(v);
  }
  return queue.length === n ? queue : [];   // queue IS the order; short → cycle
}`,
      variations: [
        { name: 'Lexicographically smallest order', description: 'Replace the queue by a min-heap of ready vertices.' },
        { name: 'Levels / semesters', description: 'Process the ready set one layer at a time; the number of layers = minimum semesters.' },
        { name: 'DP along the order', description: 'finish[v] = max(finish[v], finish[u] + time[v]) as edges are relaxed (parallel courses III).' },
        { name: 'Two-level topo', description: 'Sort groups, then items inside each group (sort items by groups).' },
      ],
      mistakes: ['Reversing the edge direction ([a, b] = "to take a you need b" means b → a)', 'Forgetting to check processed count < n (cycle)', 'Seeding only one zero-in-degree vertex', 'Using shift() on the queue'],
      evolution: { easy: 'Can all courses be finished?', medium: 'Return an order, recipes, ancestors, safe states.', hard: 'Build the graph yourself (alien dictionary), topo + DP (longest path), nested topo (groups), two independent orders (matrix).' },
    },
    {
      id: 'topo-dfs-three-color',
      name: 'DFS Post-order Topo Sort + 3-Color Cycle Detection',
      summary: 'DFS each vertex; append it to a list AFTER all its descendants finish. The reversed list is a topological order. A gray vertex (still on the recursion path) reached again means a directed cycle.',
      whyItExists: 'When DFS finishes a vertex u, every vertex reachable from u has already finished. So in finish order, u appears after everything it must precede; reversing puts it before them. The three colours distinguish "on the current path" (gray — a back edge here is a cycle) from "fully explored" (black — safe to meet again).',
      whenToUse: ['Cycle detection in directed graphs', '"Which vertices can never reach a cycle?" (eventual safe states)', 'Memoised DFS on a DAG (longest path, counting paths)', 'When recursion is more natural than in-degree bookkeeping'],
      clues: ['"cycle in a directed graph"', '"safe / terminal / eventually"', '"deadlock"', '"longest path" on a DAG with memo'],
      whenNotToUse: ['Huge graphs with long chains in JS (recursion depth) — prefer Kahn', 'Undirected graphs — use the parent check instead'],
      template: `function topoDfs(n, adj) {
  const color = new Uint8Array(n);    // 0 white, 1 gray (on path), 2 black (done)
  const post = [];
  let hasCycle = false;
  const dfs = (u) => {
    color[u] = 1;
    for (const v of adj[u]) {
      if (color[v] === 1) { hasCycle = true; return; }  // back edge
      if (color[v] === 0) { dfs(v); if (hasCycle) return; }
    }
    color[u] = 2;
    post.push(u);                     // all descendants finished
  };
  for (let i = 0; i < n && !hasCycle; i++) if (color[i] === 0) dfs(i);
  return hasCycle ? [] : post.reverse();
}`,
      variations: [{ name: 'Safe states', description: 'A vertex is safe iff its DFS finishes black without meeting gray.' }, { name: 'Memoised DFS', description: 'Black vertices carry a computed value (longest path from here).' }],
      mistakes: ['Using a single visited boolean: a black vertex reached twice is NOT a cycle', 'Forgetting to reverse the post-order', 'Adding u to the order on entry (pre-order is not a topological order)'],
      evolution: { easy: 'Detect a cycle.', medium: 'Eventual safe states, course schedule via DFS.', hard: 'Memoised DFS on implicit DAGs (longest increasing path in a matrix).' },
    },
    {
      id: 'topo-leaf-trimming',
      name: 'Leaf Trimming (topological peeling of a tree)',
      summary: 'Repeatedly remove all current leaves (degree-1 vertices) of an undirected tree, layer by layer; the last 1–2 vertices standing are the centers.',
      whyItExists: 'It is Kahn\'s idea applied to an undirected tree: leaves play the role of in-degree-0 vertices. Removing a layer of leaves shortens every longest path by 2 from both ends at once, so what remains at the end is the middle of the longest path — the vertex (or two) minimising the tree height.',
      whenToUse: ['Find the center(s) of a tree / roots minimising height', 'Peel a graph from the outside in (e.g. find nodes on cycles in a functional graph)'],
      clues: ['"minimum height trees"', '"center of the tree"', '"root that minimises height"', '"remove leaves repeatedly"'],
      whenNotToUse: ['Graph is not a tree (cycles leave vertices that never become leaves — sometimes that is exactly the point, but centers are then undefined)'],
      template: `function centers(n, edges) {
  if (n <= 2) return [...Array(n).keys()];
  const adj = Array.from({ length: n }, () => []);
  const deg = new Array(n).fill(0);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); deg[u]++; deg[v]++; }
  let leaves = [];
  for (let i = 0; i < n; i++) if (deg[i] === 1) leaves.push(i);
  let remaining = n;
  while (remaining > 2) {
    remaining -= leaves.length;
    const next = [];
    for (const leaf of leaves) for (const nb of adj[leaf]) if (--deg[nb] === 1) next.push(nb);
    leaves = next;
  }
  return leaves;
}`,
      variations: [{ name: 'Nodes on cycles', description: 'Peel in-degree-0 vertices from a functional graph; survivors lie on cycles.' }],
      mistakes: ['Stopping at remaining === 1 only (there can be two centers)', 'Not handling n = 1 (no edges, no leaves)'],
      evolution: { easy: '—', medium: 'Minimum height trees.', hard: 'Tree diameter / center reasoning inside bigger problems.' },
    },
    {
      id: 'topo-dag-dp',
      name: 'DP / Propagation along a Topological Order',
      summary: 'Once vertices are in topological order, every predecessor of v is processed before v. So values like longest path, earliest finish time or ancestor sets can be pushed forward along edges in one pass.',
      whyItExists: 'DP needs subproblems solved before they are used. In a DAG, "before" is exactly a topological order. That turns longest-path (NP-hard in general graphs) into O(V + E) on DAGs, and makes transitive facts (ancestors, reachability) computable by merging sets forward.',
      whenToUse: ['Longest / critical path in a DAG ("minimum time to finish all tasks when tasks run in parallel")', 'Ancestors / reachability queries between many pairs', 'Longest increasing path in a grid (edges from smaller to larger value form a DAG)'],
      clues: ['"minimum time to complete all courses" with durations', '"is a a prerequisite of b" for many queries', '"all ancestors"', '"longest increasing path"', 'strictly increasing moves (automatically acyclic)'],
      whenNotToUse: ['The graph has cycles (no topological order exists)', 'Shortest paths with arbitrary weights on general graphs → Dijkstra/Bellman-Ford'],
      template: `// longest path ending at each vertex, in a DAG with vertex weights
const finish = time.slice();
for (let head = 0; head < queue.length; head++) {   // Kahn order
  const u = queue[head];
  for (const v of adj[u]) {
    finish[v] = Math.max(finish[v], finish[u] + time[v]);
    if (--indeg[v] === 0) queue.push(v);
  }
}`,
      variations: [{ name: 'Set propagation', description: 'ancestors[v] ∪= ancestors[u] ∪ {u} along each edge.' }, { name: 'Memoised DFS', description: 'Same DP computed on demand with recursion + cache.' }],
      mistakes: ['Relaxing v before all its predecessors are done (not following the order)', 'Using min instead of max for "all prerequisites must finish"'],
      evolution: { easy: '—', medium: 'All ancestors, course schedule IV.', hard: 'Parallel courses III, longest increasing path in a matrix.' },
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
            md: `You want to get dressed. Socks before shoes. Underwear before trousers. Trousers before shoes. Shirt before tie. Some things do not care about each other (socks vs shirt).

A **topological sort** is any ordering of the tasks that respects **all** of these "X before Y" rules. For example: underwear, socks, shirt, trousers, tie, shoes.

In graph terms: every task is a vertex, every rule "X before Y" is a **directed edge X → Y**, and a topological order is a line-up of the vertices where **every edge points forward** (from left to right).`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Vocabulary',
            md: `- **Dependency / prerequisite** — "Y depends on X" means X must happen first. Edge **X → Y**.
- **In-degree** of v — number of edges coming **into** v = how many prerequisites v still has.
- **Source** — vertex with in-degree 0 (nothing needs to happen before it).
- **DAG** (*Directed Acyclic Graph*) — a directed graph with **no directed cycle**. A topological order exists **if and only if** the graph is a DAG.
- **Topological order** — an ordering of all vertices such that for every edge u → v, u comes before v.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A university catalogue: each course lists prerequisites. A student plan that takes every course only after its prerequisites is a topological order. If Course A requires B and B requires A, no plan exists — that is a **cycle**. Build systems (webpack, make), package managers (npm install order) and spreadsheet recalculation all do topological sorting.',
          },
          {
            type: 'visual',
            scenario: 'topo-sort',
            input: { n: 6, edges: [[0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5]] },
            caption: "Kahn's algorithm: vertices with in-degree 0 are ready; taking one decrements its successors' in-degrees.",
          },
          {
            type: 'checkpoint',
            id: 'topological-sort-cp-1',
            question: 'Edges: `0 → 1`, `0 → 2`, `1 → 3`, `2 → 3`. Which is **NOT** a valid topological order?',
            options: [
              '0, 1, 2, 3',
              '0, 2, 1, 3',
              '0, 1, 3, 2',
              'Both of the first two are valid, and so is every order starting with 0',
            ],
            answer: 2,
            explanation: 'In `0, 1, 3, 2` vertex 3 comes before 2, but the edge `2 → 3` says 2 must come first. The first two orders both respect every edge — topological orders are usually **not unique**.',
            misconceptions: {
              0: 'Check each edge: 0<1, 0<2, 1<3, 2<3 — all point forward. It is valid.',
              1: 'Also valid: 1 and 2 have no edge between them, so either may come first.',
              3: 'Starting with 0 is necessary but not sufficient — 3 must also come after both 1 and 2.',
            },
            deeper: 'Because many orders can be valid, problems that say "return any valid order" must be checked by **verifying the rules**, not by comparing with one expected answer. This app does exactly that for such questions.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Plain DFS/BFS from the previous topic tells you *what is reachable*. It does not tell you *in what order things may be done*. BFS order from a source can violate dependencies: in the graph \`0 → 1 → 2\` plus \`0 → 2\`, BFS from 0 visits 2 at distance 1 — right after 0 — even though 2 also needs 1 first.

Topological sort gives:
1. **A schedule** that respects every dependency.
2. **Cycle detection** in directed graphs — "is this set of prerequisites even possible?".
3. **An evaluation order for DP on DAGs** — once each vertex comes after its predecessors, you can compute longest paths, earliest finish times or ancestor sets in one pass.`,
          },
          {
            type: 'checkpoint',
            id: 'topological-sort-cp-2',
            question: 'Why does a directed cycle make a topological order impossible?',
            options: [
              'Because Kahn\'s algorithm uses a queue, and queues cannot hold cycles',
              'Because a cycle means the graph is disconnected',
              'Because cycles have even length',
              'Because along a cycle a → b → … → a, each vertex must come before the next, so a would have to come before itself',
            ],
            answer: 3,
            explanation: 'Follow the edges around the cycle: a before b, b before c, …, z before a. Chaining these gives a before a — a contradiction. So no ordering can satisfy all edges of a cycle.',
            misconceptions: {
              0: 'The impossibility is mathematical and holds for any algorithm. Kahn\'s just detects it (the cycle vertices never reach in-degree 0).',
              1: 'A cycle has nothing to do with connectivity; a single connected graph can contain a cycle, and a disconnected DAG still has topological orders.',
              2: 'Length parity matters for bipartiteness, not here. Any directed cycle — even length 2 (a → b → a) — blocks the order.',
            },
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `| Question shape | Tool |
|---|---|
| "Can you finish all tasks?" / "Is there a cycle in this directed graph?" | Kahn (count processed) or 3-colour DFS |
| "Return an order of the tasks" | Kahn (queue order) or reversed DFS post-order |
| "Minimum time / semesters when tasks can run in parallel" | Kahn + DP (longest path) |
| "Is a an (indirect) prerequisite of b?" for many queries | Topo order + propagate ancestor sets |
| "Which nodes never lead into a cycle?" | 3-colour DFS, or Kahn on the reversed graph |
| "Which roots give minimum tree height?" | Leaf trimming |
| Orders are implied by sorted words / constraints | Build the graph, then Kahn |

Topological sort is only for **directed** graphs. For undirected cycle detection, use DFS with a parent check (Graphs topic) or Union-Find.`,
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['"prerequisites" / "dependencies" / "requires"', '"before" / "after" constraints', '"is it possible to finish all"', '"return any valid ordering"', '"build order" / "compile order"', 'a sorted dictionary in an unknown alphabet', '"safe / eventual / terminal" nodes'],
            conclusion: 'Think Topological Sort: directed edges = "must come before", then Kahn or DFS post-order',
          },
          {
            type: 'text',
            md: `**Decide the edge direction first and write it down.** "To take course a you must first take b" is given as \`[a, b]\`, but the edge is **b → a** (b comes first). Getting this backwards produces a reversed order — which may still "pass" the cycle check but fails the order check.`,
          },
          {
            type: 'checkpoint',
            id: 'topological-sort-cp-3',
            question: 'The input `prerequisites[i] = [a, b]` means "to take course a you must first take b". Which edge do you add for Kahn\'s algorithm, and whose in-degree grows?',
            options: [
              'a → b; in-degree of b grows',
              'b → a; in-degree of a grows',
              'Both directions, because prerequisites are symmetric',
              'a → b; in-degree of a grows',
            ],
            answer: 1,
            explanation: 'Edges point from "must be first" to "comes later": b → a. The in-degree of a counts how many prerequisites a still waits for, so a gains in-degree.',
            misconceptions: {
              0: 'That reverses every dependency: you would schedule a before b, the opposite of what is required. (The cycle answer would coincidentally stay the same, the order would not.)',
              2: 'Prerequisites are one-way. Adding both directions creates a 2-cycle on every edge and nothing could ever be scheduled.',
              3: 'In-degree belongs to the head of the arrow (the vertex it points to). With a → b, b would gain in-degree, not a.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Two equivalent ways to think:

**Kahn — "peel the ready ones".** Anything with no remaining prerequisites can be done now. Do it, cross it off, and some other tasks may now have no remaining prerequisites. Repeat. Like a to-do list where finishing one item unlocks others.

**DFS — "finish the deepest first".** Start anywhere and follow "must come before" edges as deep as possible. A task is *finished* only when everything that depends on it is finished. Writing down tasks in finish order lists every task **after** all tasks that depend on it — so the **reversed** finish list is a valid schedule.

Both are O(V + E), both detect cycles. Kahn is iterative (no recursion limits) and makes the "layers" explicit; DFS is shorter when you already have recursive code and gives the cycle detection needed for "safe state" style questions.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why a DAG always has at least one vertex with in-degree 0 (so Kahn can always start)?',
            deeper: `Suppose every vertex had in-degree ≥ 1. Start anywhere and keep walking **backwards** along an incoming edge. You can do this forever, since every vertex has an incoming edge. With only n vertices, after n + 1 steps you must repeat a vertex — and the walk between the two visits is a directed cycle. So an acyclic graph must have a source. The same argument applies after removing that source (a sub-graph of a DAG is still a DAG), which is exactly why Kahn never gets stuck on a DAG — and why getting stuck **proves** a cycle.`,
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: `**Try every permutation** of the n tasks and check whether all edges point forward: O(n! · m). Useless beyond n ≈ 10.

**Slightly smarter:** repeatedly scan all vertices to find one whose prerequisites are all done, output it, repeat. Each scan costs O(n + m) and we do n of them: O(n · (n + m)). Correct, and it is Kahn's idea — but it rediscovers the "ready" vertices from scratch every round.

**Kahn's optimisation:** keep a counter \`indeg[v]\` of *remaining* prerequisites and a queue of vertices whose counter is 0. Finishing \`u\` only touches u's outgoing edges, so each edge is processed once in total → O(V + E).`,
          },
          {
            type: 'checkpoint',
            id: 'topological-sort-cp-4',
            question: 'In Kahn\'s algorithm, when does a vertex v enter the queue?',
            options: [
              'When all of v\'s successors have been processed',
              'At the start, for every vertex',
              'Exactly when its remaining in-degree becomes 0 (at the start, or when its last prerequisite is processed)',
              'Whenever any predecessor of v is processed',
            ],
            answer: 2,
            explanation: 'A vertex is ready only when every prerequisite is done. The counter reaches 0 exactly once — at that moment it is pushed. That is why each vertex is pushed at most once.',
            misconceptions: {
              0: 'Successors come after v; waiting for them would reverse the order. It is the predecessors (prerequisites) that must be finished.',
              1: 'Only sources (in-degree 0) start in the queue; the others must wait for their prerequisites.',
              3: 'After one predecessor is processed v may still have others pending. Pushing early would schedule v too soon and could push it several times.',
            },
          },
        ],
      },
      {
        id: 'optimized-kahn',
        title: "Optimized approach — Kahn's algorithm",
        blocks: [
          {
            type: 'steps',
            title: "Kahn's algorithm",
            steps: [
              'Build the adjacency list u → v and `indeg[v]` = number of incoming edges.',
              'Push every vertex with `indeg === 0` into a queue.',
              'Pop `u`, append it to the order. For every `v` in `adj[u]`: `indeg[v]--`; if it becomes 0, push `v`.',
              'When the queue is empty: if the order has n vertices, it is a topological order. If it has fewer, the leftovers are on (or behind) a cycle.',
            ],
          },
          {
            type: 'text',
            md: `**Why is the output valid?** A vertex \`v\` is pushed only after \`indeg[v]\` reaches 0, i.e. after **every** predecessor \`u\` has been popped and decremented it. So every edge \`u → v\` has u earlier in the order.

**Why does "count < n" mean a cycle?** Vertices on a cycle each wait for the previous one on the cycle, so none of their counters can reach 0 first. They are never pushed. Conversely, if the graph is a DAG, the reflect above shows a source always exists among the remaining vertices, so everything is processed.`,
          },
          {
            type: 'checkpoint',
            id: 'topological-sort-cp-5',
            question: 'n = 4, edges `0 → 1`, `1 → 2`, `2 → 1`, `0 → 3`. Kahn processes 0 and 3 and then the queue is empty. What does that tell you?',
            options: [
              'The order [0, 3] is valid; vertices 1 and 2 are simply unreachable',
              'Processed 2 < 4, so there is a cycle — here 1 → 2 → 1 — and no full topological order exists',
              'Kahn failed because vertex 0 was chosen first; another start would succeed',
              'The graph is disconnected',
            ],
            answer: 1,
            explanation: 'After 0 is processed, `indeg[1]` drops from 2 to 1 (it still waits for 2), and `indeg[2]` stays 1 (it waits for 1). They wait on each other forever. Fewer than n processed ⟺ a cycle.',
            misconceptions: {
              0: 'They ARE reachable (0 → 1). They are stuck because their counters never reach 0, which only happens with a cycle.',
              2: 'The start choice does not matter; Kahn fails exactly when there is a cycle, whatever order ready vertices are taken in.',
              3: 'Everything is connected through 0. Disconnected DAGs are sorted perfectly well by Kahn.',
            },
          },
        ],
      },
      {
        id: 'template-kahn',
        title: "Pattern / template — Kahn's algorithm",
        blocks: [
          {
            type: 'code',
            title: 'Kahn with cycle detection',
            code: `function topoOrder(n, edges) {         // edges: [u, v] means u before v
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }

  const order = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) order.push(i);
  for (let head = 0; head < order.length; head++) {   // order doubles as the queue
    const u = order[head];
    for (const v of adj[u]) {
      indeg[v]--;
      if (indeg[v] === 0) order.push(v);
    }
  }
  return order.length === n ? order : null;          // null → cycle
}`,
            caption: 'Trick: the queue array itself is the final order, so no separate result array is needed.',
          },
          {
            type: 'code',
            title: 'Layered Kahn (count semesters / rounds)',
            code: `let layer = [];
for (let i = 0; i < n; i++) if (indeg[i] === 0) layer.push(i);
let rounds = 0, done = 0;
while (layer.length) {
  rounds++;
  done += layer.length;
  const next = [];
  for (const u of layer) for (const v of adj[u]) if (--indeg[v] === 0) next.push(v);
  layer = next;
}
return done === n ? rounds : -1;`,
          },
        ],
      },
      {
        id: 'implementation-kahn',
        title: "JavaScript implementation — Kahn's algorithm",
        blocks: [
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`--indeg[v] === 0\` decrements and tests in one expression — compact, but write it in two lines if it hurts readability.
- For string vertices (letters, recipe names) use \`Map\` for both \`adj\` and \`indeg\`, and remember to register vertices that have **no** edges (they still need to be output).
- Duplicate edges are fine for Kahn **as long as** you add them to both \`adj\` and \`indeg\` consistently (each copy is decremented once). If you dedupe with a Set, dedupe both.
- Need the lexicographically smallest order? Swap the queue for the toolkit \`MinHeap\`: O((V + E) log V).`,
          },
        ],
      },
      {
        id: 'optimized-dfs',
        title: 'Optimized approach — DFS post-order and 3-colour cycle detection',
        blocks: [
          {
            type: 'text',
            md: `Give every vertex one of **three colours**:

- **White (0)** — not visited yet.
- **Gray (1)** — visited, and DFS is **still inside it** (it is on the current recursion path).
- **Black (2)** — finished: all its descendants have been explored.

Run DFS. On entering \`u\` colour it gray; after all neighbours are done colour it black and **append u to the post-order list**. Reversed post-order is a topological order.

**Why gray = "on the current path"?** DFS is a stack of nested calls. A vertex turns gray when its call starts and black when its call returns. So at any moment the gray vertices are exactly the calls still open on the stack — the path from the DFS root to the current vertex.

**Why gray-again = cycle.** If from \`u\` we see an edge to a **gray** \`v\`, then \`v\` is an ancestor of \`u\` on the current path: there is a path v ⇝ u, and now an edge u → v closes it — a directed cycle (a *back edge*).

**Why black-again is fine.** A black \`v\` has already finished; it is not on our path. Reaching it again just means two routes lead to it (a diamond \`a → b → d\`, \`a → c → d\`). That is not a cycle. This is exactly why **one visited boolean is not enough** for directed graphs.`,
          },
          {
            type: 'checkpoint',
            id: 'topological-sort-cp-6',
            question: 'Directed edges: `0 → 1`, `0 → 2`, `1 → 3`, `2 → 3`. DFS from 0 visits 1, then 3, then returns and visits 2, which has an edge to 3. What colour is 3 at that moment, and what does it mean?',
            options: [
              'Gray — there is a cycle 0 → 2 → 3',
              'Black — 3 is finished and off the current path, so this is NOT a cycle',
              'White — it has not been visited yet',
              'Gray — but cycles through gray vertices are allowed in DAGs',
            ],
            answer: 1,
            explanation: '3 turned black when the call dfs(3) returned (before dfs(1) returned). The current path is 0 → 2; 3 is not on it. Two routes into 3 form a diamond, not a cycle.',
            misconceptions: {
              0: 'A vertex is gray only while its call is still open. dfs(3) returned long ago, so 3 is black.',
              2: '3 was already visited from 1, so it is no longer white.',
              3: 'A DAG has no cycles by definition; meeting a gray vertex always proves a cycle.',
            },
            deeper: 'With a plain `visited` boolean you could not tell this situation (harmless diamond) apart from a real back edge. Undirected graphs get away with a boolean plus a parent check because there every re-visit that is not the parent really is a cycle.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why **reversed post-order** (not pre-order) is a topological order?',
            deeper: `Take any edge u → v. When DFS examines this edge from u, v is either white (then dfs(v) runs and finishes **before** u finishes), or black (it already finished **before** u), or gray (a cycle — impossible in a DAG). In every legal case, v finishes before u, so v appears earlier in the post-order list and **later** after reversing. Pre-order fails: in \`a → c\`, \`b → c\` DFS might start from a, record a, c, and only later b — putting c before its prerequisite b.`,
          },
        ],
      },
      {
        id: 'template-dfs',
        title: 'Pattern / template — DFS topological sort',
        blocks: [
          {
            type: 'code',
            title: 'Three-colour DFS returning an order (or null on a cycle)',
            code: `function topoDfs(n, adj) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Uint8Array(n);
  const post = [];
  const dfs = (u) => {                  // returns false if a cycle is found
    color[u] = GRAY;
    for (const v of adj[u]) {
      if (color[v] === GRAY) return false;                 // back edge
      if (color[v] === WHITE && !dfs(v)) return false;
    }
    color[u] = BLACK;
    post.push(u);
    return true;
  };
  for (let i = 0; i < n; i++) if (color[i] === WHITE && !dfs(i)) return null;
  return post.reverse();
}`,
            caption: 'Recursion depth can reach n; for n in the tens of thousands with long chains prefer Kahn in JavaScript.',
          },
        ],
      },
      {
        id: 'optimized-dag-dp',
        title: 'Optimized approach — DP along a topological order',
        blocks: [
          {
            type: 'text',
            md: `Topological order is the natural order for **DP on a DAG**: when you process \`v\`, all its predecessors are final.

**Longest path / critical path.** Courses take \`time[i]\` months and any number can run in parallel. Course v can start when **all** its prerequisites are done, so \`finish[v] = time[v] + max(finish[u])\` over predecessors u. Relax edges in Kahn order; the answer is \`max(finish)\`. (Longest path is NP-hard in graphs with cycles — the DAG property is what makes this linear.)

**Transitive facts.** "Is a an indirect prerequisite of b?" for many queries: walk in topo order and set \`ancestors[v] ∪= ancestors[u] ∪ {u}\` for each edge u → v. Every query becomes a Set lookup.

**Implicit DAGs.** In a grid, moving only to **strictly larger** values can never loop back, so "longest increasing path" is a longest path in a DAG — solved with memoised DFS (black = cached answer) or Kahn by value.`,
          },
          {
            type: 'checkpoint',
            id: 'topological-sort-cp-7',
            question: 'Parallel courses: time = [3, 2, 5], edges 0 → 2 and 1 → 2. Unlimited courses can run at once. What is the minimum total time?',
            options: [
              '10 — add all times',
              '5 — the longest single course',
              '7 — course 2 starts after the FASTER prerequisite: min(3, 2) + 5',
              '8 — course 2 starts after the SLOWER prerequisite: max(3, 2) + 5',
            ],
            answer: 3,
            explanation: 'finish[0] = 3 and finish[1] = 2 (they run in parallel from time 0). Course 2 needs **both**, so it starts at max(3, 2) = 3 and ends at 3 + 5 = 8. The answer is the longest (critical) path, not the sum.',
            misconceptions: {
              0: 'Adding everything assumes courses run one at a time. With unlimited parallelism only the longest dependency chain matters.',
              1: 'Course 2 cannot start at time 0; it must wait for its prerequisites.',
              2: 'All prerequisites must be finished, so the start time is decided by the slowest one — max, not min.',
            },
            deeper: 'This is the "critical path" idea from project management: the minimum project duration equals the heaviest path through the dependency DAG. Kahn order guarantees finish[u] is final before it is used for v.',
          },
        ],
      },
      {
        id: 'optimized-leaf-trimming',
        title: 'Optimized approach — leaf trimming (tree centers)',
        blocks: [
          {
            type: 'text',
            md: `*"Pick the root of this undirected tree that gives the smallest height."*

Brute force: BFS from every vertex and measure the height → O(n²).

**Trim leaves like Kahn peels sources.** A leaf (degree 1) is a terrible root — it is at the very edge. Remove **all** current leaves at once; their neighbours' degrees drop, and new leaves appear. Keep peeling layer by layer. When at most **2** vertices remain, they are the answer.

**Why?** Look at the longest path in the tree (its *diameter*). Each round of peeling removes both of its endpoints, shrinking it by 2 and keeping it the longest path. The survivors are the **middle** of the diameter: one vertex if the diameter has an odd number of vertices, two adjacent vertices if even. The middle of the longest path is the vertex whose farthest vertex is as close as possible — the minimum-height root.`,
          },
          {
            type: 'checkpoint',
            id: 'topological-sort-cp-8',
            question: 'Why does leaf trimming stop when **at most 2** vertices remain, and not always at exactly 1?',
            options: [
              'Because a tree always has exactly two centers',
              'Because the algorithm runs out of leaves at 2',
              'Because it is an approximation; the exact answer needs BFS from every vertex',
              'Because when the longest path has an even number of vertices, its middle is an edge — both endpoints give the same minimum height',
            ],
            answer: 3,
            explanation: 'Path 0–1–2–3 (4 vertices): rooting at 1 or at 2 both give height 2, and nothing does better. Peeling removes 0 and 3 and leaves {1, 2}; peeling again would wrongly remove both.',
            misconceptions: {
              0: 'A path of 3 vertices (0–1–2) has a single center, 1.',
              1: 'Two adjacent vertices are both leaves (degree 1) — the algorithm could keep going, but it would remove both true answers.',
              2: 'It is exact; the diameter argument proves the survivors are the centers.',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'text',
            md: `Almost every problem in this topic is:

1. **Model** — what are the vertices, which way do edges point ("first → later")?
2. **Build** \`adj\` + \`indeg\` (or colours for DFS).
3. **Sort** with Kahn (or DFS post-order), and **check** for a cycle.
4. **Use the order** — return it, count it, or run a DP along it.`,
          },
          {
            type: 'code',
            title: 'Kahn + DP (longest path / earliest finish)',
            code: `function minimumTime(n, relations, time) {     // relations: [prev, next], 1-based
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [a, b] of relations) { adj[a - 1].push(b - 1); indeg[b - 1]++; }
  const finish = time.slice();                    // finish[v] ≥ its own duration
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const v of adj[u]) {
      finish[v] = Math.max(finish[v], finish[u] + time[v]);
      if (--indeg[v] === 0) queue.push(v);
    }
  }
  return Math.max(...finish);
}`,
            caption: 'Math.max(...arr) spreads arguments — fine for ~10^5 elements; for millions use a loop.',
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Course Schedule II — Kahn, returns [] on a cycle',
            code: `function findOrder(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [course, pre] of prerequisites) {  // pre must come first
    adj[pre].push(course);
    indeg[course]++;
  }
  const order = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) order.push(i);
  for (let head = 0; head < order.length; head++) {
    for (const next of adj[order[head]]) {
      if (--indeg[next] === 0) order.push(next);
    }
  }
  return order.length === numCourses ? order : [];
}`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: "Kahn on edges 0→2, 1→2, 1→3, 2→4, 3→4, 4→5",
            columns: ['pop', 'in-degree changes', 'pushed', 'order so far'],
            rows: [
              ['(start)', 'indeg = [0,0,2,1,2,1]', '0, 1', '[0, 1]'],
              ['0', '2: 2→1', '—', '[0, 1]'],
              ['1', '2: 1→0, 3: 1→0', '2, 3', '[0, 1, 2, 3]'],
              ['2', '4: 2→1', '—', '[0, 1, 2, 3]'],
              ['3', '4: 1→0', '4', '[0, 1, 2, 3, 4]'],
              ['4', '5: 1→0', '5', '[0, 1, 2, 3, 4, 5]'],
              ['5', '—', '—', '6 = n → valid, no cycle'],
            ],
            note: 'Each edge caused exactly one decrement: 6 edges, 6 decrements. That is the O(E) part.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Wrong edge direction** — \`[a, b]\` "a needs b" is **b → a**. Say it out loud before coding.
2. **Forgetting the cycle check** — Kahn silently returns a partial order; compare its length with n.
3. **One visited boolean in directed DFS** — confuses diamonds with cycles. Use white/gray/black.
4. **Pre-order instead of reversed post-order** in DFS topo sort.
5. **Missing isolated vertices** — vertices with no edges must still appear in the order (seed them, they have in-degree 0).
6. **String vertices** — build \`indeg\` for every vertex, not only for those that appear as edge targets.
7. **Invalid-input edge cases** — alien dictionary: a word followed by its own proper prefix ("abc" before "ab") is impossible.
8. **Deep recursion** — DFS over 10^5 vertices in a chain can overflow the JS call stack.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why Kahn\'s leftovers (the vertices never processed) are not necessarily all ON a cycle?',
            deeper: 'A vertex that merely **depends on** a cycle (reachable from it, e.g. `1 → 2 → 1` and `2 → 5`) also never reaches in-degree 0, because its predecessor 2 is never processed. So the leftovers are "on a cycle or downstream of one". If you need exactly the cycle vertices, also peel from the other side (reverse graph) or use DFS colours. This distinction is the heart of "find eventual safe states".',
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
            md: `**Kahn:** building adj/indeg O(V + E); each vertex is pushed and popped once; each edge decremented once. **DFS:** each vertex coloured gray and black once; each edge examined once.

**Space:** adjacency list O(V + E), in-degree / colour arrays O(V), queue or recursion stack O(V).

**Variants:** with a min-heap for lexicographic order, O((V + E) log V). Ancestor-set propagation is O(V · (V + E)) in the worst case (sets can hold V entries). Alien dictionary: O(total characters) to build edges.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Name the graph**: "Courses are vertices; prerequisite b of a is an edge b → a."
- **Mention both algorithms** and pick one: "Kahn is iterative and gives the cycle check for free by counting."
- **State the cycle criterion**: "If fewer than n vertices are output, there is a cycle."
- **"Any valid order"** — tell the interviewer the order is not unique and that you would validate by checking every edge.
- **Edge cases**: no edges (any permutation), self-loop (\`[a, a]\` — immediately impossible), duplicate edges, disconnected vertices, n = 1.`,
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
              { api: 'Array.from({ length: n }, () => [])', use: 'Directed adjacency list', complexity: 'O(n)' },
              { api: 'new Array(n).fill(0)', use: 'In-degree counters (primitives are safe with fill)', complexity: 'O(n)' },
              { api: 'order[head++] with push', use: "Kahn's queue that is also the output", complexity: 'O(1) per operation' },
              { api: 'new Uint8Array(n)', use: 'White/gray/black colours', complexity: 'O(1) access' },
              { api: 'new Map() / new Set()', use: 'String vertices, deduplicated edges, ancestor sets', complexity: 'O(1) average' },
              { api: 'post.reverse()', use: 'Reverse DFS post-order (in place)', complexity: 'O(n)' },
              { api: 'MinHeap (toolkit)', use: 'Lexicographically smallest topological order', complexity: 'O(log n) per push/pop' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Order tasks with prerequisites', 'Detect a cycle in a directed graph', 'DP over a DAG (longest path, earliest finish, ancestors)', 'Nodes that never reach a cycle', 'Tree centers via leaf trimming'],
    clues: ['prerequisites', 'dependencies', 'before / after', 'possible to finish', 'any valid order', 'alien alphabet', 'safe states', 'minimum height tree'],
    template: `const adj = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }   // u before v
const order = [];
for (let i = 0; i < n; i++) if (indeg[i] === 0) order.push(i);
for (let h = 0; h < order.length; h++)
  for (const v of adj[order[h]]) if (--indeg[v] === 0) order.push(v);
return order.length === n ? order : [];   // shorter → cycle`,
    complexity: 'O(V + E) time and space',
    mistakes: ['reversed edge direction', 'no cycle check', 'single visited flag in directed DFS', 'pre-order instead of reversed post-order', 'isolated vertices missing', 'prefix case in alien dictionary'],
    jsTools: ['Array.from', 'fill(0)', 'head-pointer queue', 'Uint8Array colours', 'Map/Set', 'reverse()'],
  },

  keyConcepts: [
    'A topological order lists vertices so every directed edge points forward; it exists iff the graph is a DAG.',
    'Kahn: repeatedly take in-degree-0 vertices and decrement successors; fewer than n processed ⟺ cycle.',
    'DFS: reversed post-order is a topological order; gray (on the current path) reached again = back edge = cycle; black is safe.',
    'Topological orders are usually not unique — validate "any order" answers by checking every edge.',
    'Processing a DAG in topological order makes DP (longest path, finish times, ancestor sets) linear.',
    'Leaf trimming is Kahn on an undirected tree; the last 1–2 survivors are the minimum-height roots.',
  ],

  interviewTips: [
    'Fix the edge direction explicitly before coding.',
    'Choose Kahn for iterative safety and a free cycle check; DFS colours for safe-state style questions.',
    'Mention that multiple valid orders exist.',
  ],
};
