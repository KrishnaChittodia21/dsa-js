export default {
  id: 'graphs',
  summary: 'Model things and their connections as vertices and edges, then explore them systematically: DFS goes deep along one path, BFS spreads out layer by layer and finds shortest paths in unweighted graphs.',

  jsTools: [
    { api: 'Array.from({ length: n }, () => [])', use: 'Adjacency list for vertices 0..n-1 (each vertex gets its OWN array)', complexity: 'O(n) to build' },
    { api: 'Map<key, key[]>', use: 'Adjacency list when vertices are strings or sparse numbers', complexity: 'get / set O(1) average' },
    { api: 'new Uint8Array(n)', use: 'Compact visited / color array for numbered vertices (all zeros, 1 byte each)', complexity: 'O(1) index access, O(n) memory' },
    { api: 'new Set()', use: 'Visited set when vertices are strings, coordinates or states', complexity: 'add / has O(1) average' },
    { api: 'queue + head pointer', use: 'O(1) dequeue for BFS instead of array.shift() which is O(n)', complexity: 'O(1) per push/pop' },
    { api: 'Queue (toolkit)', use: 'Ready-made FIFO with O(1) dequeue', complexity: 'O(1) per operation' },
    { api: 'buildAdjList(n, edges, directed) (toolkit)', use: 'Turns an edge list into an adjacency list in one call', complexity: 'O(n + m)' },
    { api: 'const DIRS = [[1,0],[-1,0],[0,1],[0,-1]]', use: 'The 4 neighbours of a grid cell without copy-pasted if-blocks', complexity: 'O(1) per cell' },
    { api: 'r * cols + c', use: 'Encode a grid cell as one integer (for Uint8Array visited or Set keys)', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'graph-adjacency-representation',
      name: 'Graph Representation & Degrees',
      summary: 'Turn the input (edge list, matrix, grid, rules) into an adjacency list, and read simple facts such as degree directly from it.',
      whyItExists: 'Almost no graph problem hands you a ready-to-traverse structure. The edge list is great for storage but terrible for "who are my neighbours?" (O(m) per question). One O(n + m) pass that builds an adjacency list makes every later neighbour lookup O(deg). Many easy problems are answered by degrees alone, without any traversal.',
      whenToUse: ['The input is an edge list / pairs and you need neighbour lookups', 'The answer depends only on how many edges touch each vertex (degree, in-degree, out-degree)', 'You must choose between list, Map and matrix representations based on n, m and vertex type'],
      clues: ['"edges[i] = [u, v]"', '"the center / hub / judge"', '"degree"', '"n nodes labelled 0 to n-1"', '"trust", "roads", "connections" as pairs'],
      whenNotToUse: ['The answer needs reachability or distances — build the list, then traverse it with DFS/BFS', 'The graph is a grid — neighbours are computed from coordinates, no list needed'],
      template: `function buildGraph(n, edges, directed = false) {
  const adj = Array.from({ length: n }, () => []);
  const degree = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    degree[u]++;
    if (!directed) { adj[v].push(u); degree[v]++; }
  }
  return { adj, degree };
}`,
      variations: [
        { name: 'Adjacency matrix', description: 'n × n boolean table. O(1) "is there an edge u–v?", but O(n²) memory — only for small, dense graphs.' },
        { name: 'Map adjacency list', description: 'When vertices are strings (words, emails) or huge sparse ids.' },
        { name: 'In/out degree counting', description: 'Directed graphs: a "sink" has out-degree 0, a "source" has in-degree 0. Leads directly to topological sort.' },
      ],
      mistakes: ['`new Array(n).fill([])` — every slot shares ONE array, so all vertices get the same neighbours', 'Forgetting to add the reverse edge for undirected graphs', 'Off-by-one when vertices are labelled 1..n instead of 0..n-1'],
      evolution: { easy: 'Read the answer from degrees (star center, town judge).', medium: 'Build the list, then traverse it.', hard: 'Build an implicit or transformed graph (word patterns, reversed edges, states).' },
    },
    {
      id: 'graph-dfs',
      name: 'Graph DFS (Depth-First Search)',
      summary: 'From a vertex, go to an unvisited neighbour and keep going deeper; backtrack only when stuck. Mark vertices visited so each is processed once.',
      whyItExists: 'Many questions only ask "what can I reach?" — reachability, connected components, cycle detection, copying a structure. DFS answers them in O(V + E) with very little code (recursion keeps the path for you).',
      whenToUse: ['Reachability: "can you get from A to B", "can you visit all rooms"', 'Count or label connected components', 'Cycle detection (undirected: track the parent)', 'Copy / clone a graph', 'Any exhaustive exploration where the order does not matter'],
      clues: ['"connected"', '"reachable"', '"number of provinces / components / islands"', '"clone / deep copy the graph"', '"is there a path"', '"visit all"'],
      whenNotToUse: ['You need the SHORTEST path in an unweighted graph — DFS finds *a* path, not the shortest; use BFS', 'Very deep graphs (a 1000×1000 grid) with recursion — the call stack overflows; use an explicit stack or BFS', 'Weighted shortest paths → Dijkstra (later topic)'],
      template: `function dfsAll(n, adj) {
  const visited = new Uint8Array(n);
  let components = 0;
  const dfs = (u) => {
    visited[u] = 1;                 // mark on entry
    for (const v of adj[u]) if (!visited[v]) dfs(v);
  };
  for (let s = 0; s < n; s++) {
    if (!visited[s]) { components++; dfs(s); }
  }
  return components;
}`,
      variations: [
        { name: 'Iterative DFS with a stack', description: 'Push the start; pop, skip if visited, mark, push neighbours. No recursion limit.' },
        { name: 'DFS with parent (undirected cycle)', description: 'Seeing a visited neighbour that is not your parent means a cycle.' },
        { name: 'DFS with a Map old → new', description: 'Clone graph: the map is both the visited set and the result.' },
      ],
      mistakes: ['Marking visited after the recursive call instead of before (infinite recursion on cycles)', 'Only starting DFS from vertex 0 when the graph may be disconnected', 'Deep recursion on big grids → RangeError: Maximum call stack size exceeded'],
      evolution: { easy: 'Path exists? Flood fill.', medium: 'Components, clone graph, keys and rooms, reverse-thinking (surrounded regions, Pacific Atlantic).', hard: 'Label components and combine them (making a large island), DFS on implicit graphs.' },
    },
    {
      id: 'graph-bfs',
      name: 'Graph BFS (Breadth-First Search)',
      summary: 'Explore in rings: first the start, then everything 1 edge away, then 2 edges away… A FIFO queue gives this order, so the first time you reach a vertex is along a shortest path (unweighted).',
      whyItExists: 'In an unweighted graph "shortest path" means "fewest edges". BFS visits vertices in non-decreasing order of distance, so it computes all shortest distances from a source in O(V + E) — without ever trying multiple paths.',
      whenToUse: ['Shortest path / minimum number of steps / moves in an unweighted graph', 'Level-by-level processing ("after each minute", "distance k")', 'Bipartite checks (colour by level parity)', 'State-space search: each state is a vertex, each move an edge'],
      clues: ['"minimum number of steps / moves / transformations"', '"shortest path" with no weights', '"each minute, spreads to neighbours"', '"nearest"', '"level"'],
      whenNotToUse: ['Edges have different weights → Dijkstra', 'You just need reachability and DFS is shorter to write (both are fine)', 'The state space is astronomically large with no pruning'],
      template: `function bfs(adj, start) {
  const dist = new Array(adj.length).fill(-1);
  dist[start] = 0;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {   // O(1) dequeue
    const u = queue[head];
    for (const v of adj[u]) {
      if (dist[v] === -1) {           // mark when ENQUEUED, not when popped
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return dist;
}`,
      variations: [
        { name: 'Level-by-level BFS', description: 'Process `queue.length` items per round when you need the round number explicitly.' },
        { name: 'Multi-source BFS', description: 'Seed the queue with every source at distance 0.' },
        { name: 'Bidirectional BFS', description: 'Search from both ends and stop when the frontiers meet.' },
        { name: 'BFS over states', description: 'A vertex = (position, extra info such as keys or a visited mask).' },
      ],
      mistakes: ['`queue.shift()` in a loop — O(n) each, O(n²) total', 'Marking visited when popping instead of when pushing → the same vertex enters the queue many times', 'Using BFS on a weighted graph and expecting shortest paths'],
      evolution: { easy: 'Distance from one source.', medium: 'Grid shortest path, multi-source spreading, bipartite colouring.', hard: 'Bidirectional search, BFS over (vertex, bitmask) states.' },
    },
    {
      id: 'grid-graph-traversal',
      name: 'Grid as an Implicit Graph',
      summary: 'Each cell is a vertex; its up/down/left/right cells are its neighbours. Traverse with DFS or BFS using a direction array and bounds checks — no adjacency list needed.',
      whyItExists: 'Maps, images, boards and mazes are 2D grids. Building an explicit adjacency list for R·C cells wastes memory; the neighbours are computable from (r, c) in O(1).',
      whenToUse: ['Islands, regions, flood fill, connected blobs of equal value', 'Mazes / shortest path in a binary matrix', 'Boundary-connected regions (reverse thinking: start from the border)'],
      clues: ['"m x n grid"', '"4-directionally / 8-directionally adjacent"', '"island"', '"region"', '"pixel / image"', '"cells"'],
      whenNotToUse: ['Movement is weighted (different costs per cell) → Dijkstra', 'The question is purely arithmetic about each cell (a counting pass may be enough, e.g. island perimeter)'],
      template: `const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function countRegions(grid) {
  const R = grid.length, C = grid[0].length;
  let count = 0;
  const sink = (r, c) => {
    if (r < 0 || r >= R || c < 0 || c >= C || grid[r][c] !== 1) return;
    grid[r][c] = 0;                       // mark visited in place
    for (const [dr, dc] of DIRS) sink(r + dr, c + dc);
  };
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (grid[r][c] === 1) { count++; sink(r, c); }
  return count;
}`,
      variations: [
        { name: 'Mark in place vs visited matrix', description: 'Overwriting the grid saves memory but destroys the input; copy it if the caller needs it.' },
        { name: '8 directions', description: 'Add the four diagonals to DIRS (shortest path in binary matrix).' },
        { name: 'Border-first (reverse) traversal', description: 'Start from the border and mark what is reachable; everything else is the answer (surrounded regions, Pacific Atlantic).' },
      ],
      mistakes: ['Bounds check AFTER reading grid[r][c] → reading grid[-1] is undefined and grid[-1][c] throws', 'Comparing with the string "1" when the grid holds numbers (or vice versa)', 'Recursive DFS on a 1000×1000 all-land grid → stack overflow; use BFS/explicit stack'],
      evolution: { easy: 'Flood fill, island perimeter.', medium: 'Count/measure islands, border-reachability, BFS shortest path in a maze.', hard: 'Label components with ids + sizes and reason about merging them.' },
    },
    {
      id: 'multi-source-bfs',
      name: 'Multi-Source BFS',
      summary: 'Put ALL sources in the queue at distance 0, then run a normal BFS. Each cell gets its distance to the NEAREST source in one O(V + E) pass.',
      whyItExists: 'Running one BFS per source costs O(S · (V + E)). Pretending there is a virtual super-source connected to every real source with edges of length 0 gives the same distances with a single BFS.',
      whenToUse: ['"Distance to the nearest X" for every cell', 'Something spreads from many places simultaneously (rot, fire, infection)', '"Minimum time until everything is reached"'],
      clues: ['"nearest 0 / gate / land"', '"every minute, all adjacent cells become…"', '"simultaneously"', '"minimum minutes until no fresh orange"'],
      whenNotToUse: ['Distances from each source must be kept separately', 'Weighted spreading times → multi-source Dijkstra'],
      template: `function nearestSource(grid) {           // sources are cells with value 0
  const R = grid.length, C = grid[0].length;
  const dist = Array.from({ length: R }, () => new Array(C).fill(-1));
  const queue = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (grid[r][c] === 0) { dist[r][c] = 0; queue.push([r, c]); }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return dist;
}`,
      variations: [
        { name: 'Count the minutes', description: 'The answer is the largest distance assigned (rotting oranges).' },
        { name: 'Reverse the question', description: '"Distance from each 1 to the nearest 0" = BFS starting from all 0s.' },
      ],
      mistakes: ['Running BFS from each target separately (O(n²) on big grids)', 'Forgetting that some cells may never be reached (return -1)', 'Counting minutes as "number of rounds" and being off by one when there were no fresh cells at all'],
      evolution: { easy: 'Distance to nearest source in a small grid.', medium: 'Rotting oranges, 01 matrix, walls and gates.', hard: 'Multi-source BFS as a building block (e.g. safest path, binary search on the answer + BFS).' },
    },
    {
      id: 'bidirectional-bfs',
      name: 'Bidirectional BFS',
      summary: 'Grow two BFS frontiers — one from the start, one from the target — always expanding the smaller one, and stop when they touch.',
      whyItExists: 'If every vertex has about b neighbours and the answer is d steps, one BFS explores about b^d vertices. Two searches that meet in the middle explore about 2 · b^(d/2) — for b = 25, d = 6 that is 30 million vs 31 thousand.',
      whenToUse: ['Shortest transformation from a known start to a known target', 'Huge branching factor (word ladder: 26 letters × word length neighbours)'],
      clues: ['"transform beginWord into endWord"', '"minimum number of moves from start to target"', 'both endpoints given', 'implicit neighbours generated by small edits'],
      whenNotToUse: ['The target is not a single known state', 'Moves are not reversible (the backwards search needs reverse edges)', 'Small graphs — plain BFS is simpler'],
      template: `function biBfs(start, target, neighbors) {
  if (start === target) return 0;
  let front = new Set([start]), back = new Set([target]);
  const seen = new Set([start, target]);
  for (let steps = 1; front.size && back.size; steps++) {
    if (front.size > back.size) [front, back] = [back, front];  // expand smaller side
    const next = new Set();
    for (const u of front) {
      for (const v of neighbors(u)) {
        if (back.has(v)) return steps;      // frontiers touch
        if (!seen.has(v)) { seen.add(v); next.add(v); }
      }
    }
    front = next;
  }
  return -1;
}`,
      variations: [{ name: 'Pattern buckets', description: 'Word ladder: precompute "h*t" → [hot, hit] so neighbour generation is fast.' }],
      mistakes: ['Checking the meeting only against the visited set instead of the OTHER frontier', 'Not swapping to the smaller frontier (loses most of the speed-up)', 'Off-by-one in the returned length (edges vs vertices on the path)'],
      evolution: { easy: '—', medium: 'Open the lock with bidirectional BFS.', hard: 'Word ladder, sliding puzzles.' },
    },
    {
      id: 'graph-bipartite-coloring',
      name: 'Bipartite Check / 2-Coloring',
      summary: 'Try to paint every vertex one of two colours so each edge joins different colours. BFS/DFS assigns "opposite of my colour" to each neighbour; a same-colour edge proves it is impossible.',
      whyItExists: 'Splitting things into two conflict-free groups (teams, schedules, "dislikes" pairs) is exactly bipartiteness. A graph is bipartite iff it has no odd-length cycle, and the colouring traversal finds such a conflict in O(V + E).',
      whenToUse: ['"Split into two groups so no pair in the same group…"', 'Check whether a graph has an odd cycle', 'Assign one of two labels to every vertex consistently'],
      clues: ['"two groups / sets"', '"bipartite"', '"dislike"', '"no two adjacent … same colour"'],
      whenNotToUse: ['More than two colours — k-colouring is NP-hard in general (backtracking)', 'Constraints of the form "same group" as well as "different group" → union-find with parity'],
      template: `function isBipartite(adj) {
  const color = new Int8Array(adj.length).fill(-1);
  for (let s = 0; s < adj.length; s++) {
    if (color[s] !== -1) continue;           // disconnected graphs!
    color[s] = 0;
    const queue = [s];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      for (const v of adj[u]) {
        if (color[v] === -1) { color[v] = 1 - color[u]; queue.push(v); }
        else if (color[v] === color[u]) return false;   // odd cycle
      }
    }
  }
  return true;
}`,
      variations: [{ name: 'Possible bipartition', description: 'Build the graph from "dislikes" pairs, then 2-colour it.' }, { name: 'DFS colouring', description: 'Same idea with recursion: dfs(v, 1 - c).' }],
      mistakes: ['Only colouring from vertex 0 (graph may be disconnected)', 'Returning true when meeting an already-coloured neighbour without comparing colours'],
      evolution: { easy: '—', medium: 'Is graph bipartite, possible bipartition.', hard: 'Bipartite matching (beyond interviews), parity union-find.' },
    },
    {
      id: 'graph-state-space-bfs',
      name: 'BFS over States (vertex + bitmask)',
      summary: 'When "where am I" is not enough to describe progress, make the BFS vertex a state such as (node, set of nodes visited so far) and BFS over those states.',
      whyItExists: 'Some shortest-path questions care about history (which nodes were visited, which keys collected). Revisiting a node is fine if your history is different, so the visited check must be on the whole state. With small n, the history set fits in an integer bitmask.',
      whenToUse: ['Shortest walk that visits all nodes / collects all keys', 'n is small (≤ 12–20) and the answer depends on a subset'],
      clues: ['"visit every node"', '"collect all keys"', '"you may revisit nodes"', 'n <= 12'],
      whenNotToUse: ['n is large (2^n states explode)', 'No history matters → plain BFS'],
      template: `// state = (node, mask). Bit i of mask is 1 when node i has been visited.
function shortestVisitAll(adj) {
  const n = adj.length, full = (1 << n) - 1;
  const seen = Array.from({ length: n }, () => new Uint8Array(1 << n));
  const queue = [];
  for (let i = 0; i < n; i++) { queue.push([i, 1 << i, 0]); seen[i][1 << i] = 1; }
  for (let head = 0; head < queue.length; head++) {
    const [u, mask, d] = queue[head];
    if (mask === full) return d;
    for (const v of adj[u]) {
      const m2 = mask | (1 << v);
      if (!seen[v][m2]) { seen[v][m2] = 1; queue.push([v, m2, d + 1]); }
    }
  }
  return -1;
}`,
      variations: [{ name: 'Keys and locks', description: 'State = (row, col, keysMask).' }, { name: 'Multi-source start', description: 'Start from every node because the walk may begin anywhere.' }],
      mistakes: ['Marking only the node as visited (then you cannot revisit it with a better mask)', 'Using `1 << n` for n ≥ 31 (JS bitwise ops are 32-bit)'],
      evolution: { easy: '—', medium: 'BFS with a small extra dimension (remaining obstacles eliminations k).', hard: 'Shortest path visiting all nodes, shortest path to get all keys.' },
    },
    {
      id: 'grid-component-labeling',
      name: 'Component Labeling (ids + sizes)',
      summary: 'Traverse every component once and write a component id into each cell, remembering size[id]. Later questions about merging components become O(1) lookups.',
      whyItExists: '"What if I flip this one cell?" asked for every cell would re-run a full traversal each time: O((RC)²). Labeling once, then looking at the distinct ids around each candidate cell, gives O(RC).',
      whenToUse: ['Questions about what happens if one cell/edge is added', 'You need the size of the component a cell belongs to, many times'],
      clues: ['"change at most one 0 to 1"', '"largest after one operation"', '"size of the island containing"'],
      whenNotToUse: ['Edges are added repeatedly over time → union-find (next topics)'],
      template: `// label components: id starts at 2 so it never clashes with 0/1
let id = 2; const size = [0, 0];
for (let r = 0; r < R; r++) for (let c = 0; c < C; c++)
  if (grid[r][c] === 1) size[id] = fill(r, c, id++);   // fill returns the size`,
      variations: [{ name: 'Dedupe neighbours', description: 'Around a 0 cell, the same island may appear on two sides — use a Set of ids.' }],
      mistakes: ['Adding the same neighbouring island twice', 'Forgetting the all-land case (no 0 to flip → answer is R·C)'],
      evolution: { easy: '—', medium: 'Size of each island.', hard: 'Making a large island.' },
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
            md: `A **graph** is just *things* plus *connections between things*.

- Cities and the roads between them.
- People and who follows whom.
- Web pages and the links between them.
- Cells of a maze and which cells you can step between.

You already know one kind of graph: a **tree** is a graph with no cycles where every node (except the root) has exactly one parent. A general graph drops those rules: a vertex may have any number of neighbours, there can be loops back to where you started, and some parts may not be connected at all.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Vocabulary',
            md: `- **Vertex** (or *node*) — one thing. Usually numbered \`0..n-1\`.
- **Edge** — a connection between two vertices, written \`[u, v]\`.
- **Undirected** — the edge works both ways (a two-way road, a friendship).
- **Directed** — the edge has a direction \`u → v\` (a one-way street, "A follows B").
- **Weighted** — each edge has a number (distance, cost, time). *Unweighted* means every edge counts as 1.
- **Neighbours** (*adjacent* vertices) — vertices joined to \`u\` by an edge.
- **Degree** — how many edges touch a vertex. Directed graphs split it into **in-degree** (edges coming in) and **out-degree** (edges going out).
- **Path** — a sequence of vertices where each consecutive pair is an edge.
- **Cycle** — a path that returns to its starting vertex without reusing an edge.
- **Connected component** — a maximal group of vertices where every vertex can reach every other one. A connected graph has exactly one component.
- **n** (or **V**) — number of vertices; **m** (or **E**) — number of edges.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Think of an airline route map. Airports are vertices, flights are edges. "Can I fly from Oslo to Lima?" is *reachability*. "With the fewest connections?" is a *shortest path*. "Which airports form isolated regional networks?" are *connected components*. One-way routes make the graph *directed*; ticket prices make it *weighted*.',
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-1',
            question: 'An undirected graph has 4 vertices and edges `[0,1], [0,2], [0,3], [2,3]`. What is the degree of vertex 0, and how many connected components are there?',
            options: [
              'Degree 1, 4 components',
              'Degree 3, 2 components',
              'Degree 4, 1 component',
              'Degree 3, 1 component',
            ],
            answer: 3,
            explanation: 'Vertex 0 appears in three edges (`[0,1]`, `[0,2]`, `[0,3]`), so its degree is 3. Every vertex can reach every other one through 0, so there is **one** component.',
            misconceptions: {
              0: 'Degree counts **all** edges touching the vertex, not just the first one listed. And a single component is enough when everything is reachable.',
              1: 'The degree is right, but the edge `[2,3]` does not split anything off — 1, 2 and 3 are all reachable from 0. A component is a group where everyone can reach everyone.',
              2: 'There are 4 edges in total, but only 3 of them touch vertex 0. Degree is per vertex.',
            },
            deeper: 'A handy fact: in an undirected graph the sum of all degrees is exactly `2m`, because every edge adds 1 to the degree of *both* of its endpoints. Here: 3 + 1 + 2 + 2 = 8 = 2 × 4.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Arrays and trees have a natural order to walk through: index 0, 1, 2… or root, children, grandchildren. A graph has **no natural order** and may contain **cycles**. If you "just follow edges" you can walk around a cycle forever, or miss a disconnected part completely.

Graph traversal gives you a **systematic** way to visit every reachable vertex **exactly once**:

- **DFS (depth-first search)** — go as deep as possible along one path, then back up and try the next branch.
- **BFS (breadth-first search)** — visit everything 1 step away, then everything 2 steps away, and so on.

Both run in **O(V + E)**: each vertex is processed once and each edge is looked at once (twice for undirected). That is the best possible, since you must at least read the input.

A huge number of interview problems are *secretly* graph problems: islands in a grid, word transformations, course prerequisites, social networks, lock combinations. Once you see the vertices and edges, the solution is usually "DFS or BFS plus a small twist".`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** a traversal needs a `visited` set, when tree traversals did not?',
            deeper: `In a tree, each node is reached from exactly one parent, so you can never arrive at a node twice. In a graph, a vertex can be reached from many neighbours, and cycles let you come back to where you started.

Without \`visited\`, the graph \`0 – 1 – 2 – 0\` makes DFS go 0 → 1 → 2 → 0 → 1 → … forever. With \`visited\`, the second arrival at 0 is ignored. The visited set is what turns "follow edges" into an algorithm that processes each vertex **once**, which is exactly where the O(V + E) bound comes from.`,
          },
        ],
      },
      {
        id: 'representations',
        title: 'Representing a graph',
        blocks: [
          {
            type: 'text',
            md: `Problems give you graphs in different shapes. Your first job is usually to convert the input into a shape that answers *"who are the neighbours of u?"* quickly.

| Representation | Looks like | Neighbours of u | Edge u–v? | Memory | Use when |
|---|---|---|---|---|---|
| **Edge list** | \`[[0,1],[1,2]]\` | O(m) scan | O(m) | O(m) | Input format; Kruskal (later) |
| **Adjacency list** | \`adj[1] = [0, 2]\` | O(deg u) | O(deg u) | O(n + m) | **Default for traversal** |
| **Adjacency matrix** | \`mat[u][v] = 1\` | O(n) | **O(1)** | O(n²) | Small dense graphs (n ≤ ~1000) |
| **Implicit (grid / rules)** | a 2D grid | computed | computed | nothing extra | Grids, word ladders, puzzles |

Most real graphs are **sparse** (m is much smaller than n²), so the adjacency list wins.`,
          },
          {
            type: 'code',
            title: 'Building each representation in JavaScript',
            code: `const n = 4, edges = [[0, 1], [1, 2], [2, 0], [2, 3]];

// Adjacency list (numbered vertices) — the one you will use 90% of the time
const adj = Array.from({ length: n }, () => []);
for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); } // undirected
// adj = [[1,2],[0,2],[1,0,3],[2]]

// Adjacency list with a Map (string / sparse vertices)
const g = new Map();
const addEdge = (u, v) => {
  if (!g.has(u)) g.set(u, []);
  if (!g.has(v)) g.set(v, []);
  g.get(u).push(v); g.get(v).push(u);
};
addEdge('alice', 'bob');

// Adjacency matrix
const mat = Array.from({ length: n }, () => new Uint8Array(n));
for (const [u, v] of edges) mat[u][v] = mat[v][u] = 1;

// Implicit grid graph: neighbours of (r, c) are computed, never stored
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];`,
            caption: 'The toolkit also has buildAdjList(n, edges, directed) and a Graph class.',
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-2',
            question: 'A teammate builds the adjacency list with `const adj = new Array(n).fill([]);` and then pushes edges. After adding `[0,1]` they see `adj[3]` contains `1` too. Why?',
            options: [
              '`fill` copies the array lazily, so it only breaks for large n',
              'Undirected edges are added to every vertex automatically',
              '`fill([])` puts the SAME array object in every slot, so pushing into adj[0] also changes adj[3]',
              'Arrays cannot hold arrays in JavaScript without Array.of',
            ],
            answer: 2,
            explanation: '`fill(value)` evaluates `value` once and stores that one reference in every slot. All n slots point at one shared array. `Array.from({ length: n }, () => [])` calls the arrow function per slot, creating n different arrays.',
            misconceptions: {
              0: 'There is nothing lazy about it — it is one shared reference from the start, for any n.',
              1: 'Only the code you write adds edges. The strange result comes from shared references, not from edge semantics.',
              3: 'Arrays of arrays are completely normal; the issue is that all the inner arrays are the same object.',
            },
            deeper: 'Same trap for 2D grids: `new Array(R).fill(new Array(C).fill(0))` shares ONE row. Always create rows with `Array.from({ length: R }, () => new Array(C).fill(0))`. `fill` is only safe with primitives (numbers, booleans, strings).',
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Reach for graph traversal whenever the problem is about **relationships** and **reachability**:

| Question shape | Tool |
|---|---|
| "Can I get from A to B?", "Can I visit everything?" | DFS or BFS |
| "How many separate groups / islands / provinces?" | DFS/BFS from every unvisited vertex |
| "Fewest steps / moves / transformations" (all steps cost the same) | **BFS** |
| "Distance to the nearest X" for every cell | **Multi-source BFS** |
| "Known start and known target, huge branching" | **Bidirectional BFS** |
| "Split into two groups with no conflicts" | **Bipartite 2-colouring** |
| "Shortest walk that must visit a set of things" (small n) | **BFS over (vertex, mask) states** |
| Steps have different costs | Not BFS — Dijkstra (Shortest Path topic) |
| Order tasks by dependencies | Topological sort (next topic) |

DFS and BFS both answer reachability; **only BFS** answers unweighted shortest paths.`,
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['edges / connections / pairs [u, v]', 'grid of cells with "adjacent" moves', '"island", "region", "province", "network"', '"minimum number of steps / moves / transformations"', '"reachable", "connected"', '"spreads every minute"', 'rules that turn one state into another (change one letter, turn one wheel)'],
            conclusion: 'Think Graph: identify vertices + edges, then DFS for reachability/components or BFS for shortest steps',
          },
          {
            type: 'text',
            md: `The hardest part is often noticing that a graph exists at all. Ask:

1. **What are the "things"?** (cells, words, lock combinations, rooms) → vertices.
2. **What moves me from one thing to another?** (step to a neighbour cell, change one letter, use a key) → edges.
3. **What is asked?** reachability / count groups → DFS; fewest moves → BFS.`,
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-3',
            question: '"A lock has 4 wheels (0000–9999). One move turns one wheel by one digit. Some combinations are forbidden. Find the minimum number of moves from 0000 to a target." What is the graph and which traversal fits?',
            options: [
              'Vertices = combinations, edges = one-wheel turns; BFS because we want the fewest moves with equal cost',
              'Vertices = wheels, edges = digits; DFS because we must try all digits',
              'There is no graph; this is a dynamic programming problem over digits',
              'Vertices = combinations, edges = one-wheel turns; DFS because it finds the target faster',
            ],
            answer: 0,
            explanation: 'Each combination is a state (vertex). A move changes it into one of 8 neighbouring states (4 wheels × up/down). Every move costs 1, and we want the fewest moves, so BFS over the 10,000 states. Forbidden combinations are simply vertices you may not enter.',
            misconceptions: {
              1: 'The wheels are not the things we travel between — the *combinations* are. Modelling the right vertices is the key step.',
              2: 'Moves can go up or down and cycle around (9 → 0), so there is no simple left-to-right order for DP. The natural model is a state graph.',
              3: 'DFS may find the target, but along an arbitrary, long path. It does not give the minimum number of moves.',
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
            md: `Two ways to explore a maze:

- **DFS — the stubborn explorer.** Walk down a corridor as far as possible. At a dead end, walk back to the last junction and take the next unexplored corridor. The *path you are currently on* is a **stack** (the recursion stack does this for you).
- **BFS — the ripple in a pond.** Drop a stone at the start. The ripple first touches everything 1 step away, then everything 2 steps away. The *frontier* waiting to be explored is a **queue** (first in, first out).

Same graph, same visited set, same O(V + E) — only the container differs: **stack → deep first, queue → wide first**.`,
          },
          {
            type: 'visual',
            scenario: 'graph-dfs',
            input: { n: 7, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [5, 6], [4, 6]], start: 0 },
            caption: 'DFS: dives 0 → 1 → 3, backs up, tries 4 → 6 → 5 → 2 before ever finishing the neighbours of 0.',
          },
          {
            type: 'visual',
            scenario: 'graph-bfs',
            input: { n: 7, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [5, 6], [4, 6]], start: 0 },
            caption: 'BFS on the same graph: layer 0 = {0}, layer 1 = {1, 2}, layer 2 = {3, 4, 5}, layer 3 = {6}.',
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Analogy',
            md: 'DFS is how you read Wikipedia at 2am — click a link, then a link inside that, then another… BFS is how a rumour spreads: everyone who heard it today tells their friends tomorrow.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: `Take the question *"what is the fewest number of edges from s to t?"*.

The naive idea: **try every simple path** from \`s\` (a path that never repeats a vertex) with backtracking and keep the shortest one that reaches \`t\`.

This is correct, but the number of simple paths can be **exponential**. In a grid, the number of paths between two corners grows faster than 2^n. Even a 10×10 grid has billions.

The waste: brute force happily reaches the same vertex by many different paths and explores onward from each of them. But if we already reached vertex \`x\` using 3 edges, reaching it again using 5 edges can never lead to a shorter answer. BFS exploits exactly that: **reach each vertex once, and make sure that first time is along a shortest path.**`,
          },
          {
            type: 'code',
            title: 'Brute force — all simple paths (exponential)',
            code: `function shortestBrute(adj, s, t) {
  let best = Infinity;
  const onPath = new Set([s]);
  const go = (u, len) => {
    if (u === t) { best = Math.min(best, len); return; }
    for (const v of adj[u]) {
      if (onPath.has(v)) continue;
      onPath.add(v);
      go(v, len + 1);
      onPath.delete(v);          // backtrack: v may be used by another path
    }
  };
  go(s, 0);
  return best === Infinity ? -1 : best;
}`,
            caption: 'Note: onPath is removed on backtrack, so vertices are revisited by other paths. That is exactly what makes it exponential.',
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-4',
            question: 'Why does a plain DFS with a permanent `visited` set (never un-marking) NOT reliably give the shortest path in an unweighted graph?',
            options: [
              'Because DFS cannot handle cycles',
              'Because DFS may first reach a vertex along a long detour, mark it visited, and then refuse the shorter route that arrives later',
              'Because DFS is slower than BFS asymptotically',
              'It does — DFS and BFS always find the same path',
            ],
            answer: 1,
            explanation: 'DFS reaches vertices in "depth" order, not distance order. In the graph 0–1–2–3 plus the edge 0–3, DFS from 0 might go 0→1→2→3 and record distance 3 for vertex 3; the direct edge 0→3 is then ignored because 3 is already visited. BFS would have found 3 at distance 1 first.',
            misconceptions: {
              0: 'DFS handles cycles perfectly well thanks to the visited set. The problem is *which* path reaches a vertex first.',
              2: 'Both are O(V + E). The difference is the ORDER in which vertices are discovered, not the speed.',
              3: 'They visit the same vertices but in a different order, and the order decides which path "claims" each vertex.',
            },
            deeper: 'To make DFS find shortest paths you would have to un-mark vertices on backtrack — which turns it back into the exponential brute force above. BFS keeps "visit each vertex once" AND gets shortest distances, because its discovery order is sorted by distance.',
          },
        ],
      },
      {
        id: 'optimized-dfs',
        title: 'Optimized approach — DFS (reachability, components, cycles)',
        blocks: [
          {
            type: 'steps',
            title: 'DFS from a start vertex',
            steps: [
              'Mark the current vertex `u` as visited **immediately**.',
              'For each neighbour `v` of `u`: if `v` is not visited, recurse into `v`.',
              'When all neighbours are done, return (backtrack) to whoever called you.',
              'To cover a disconnected graph, loop over every vertex and start a new DFS from each one still unvisited — each new start is a new **connected component**.',
            ],
          },
          {
            type: 'text',
            md: `**Why is it O(V + E)?** Each vertex is marked once, and its neighbour list is scanned once (only when it is first visited). The total length of all neighbour lists is \`m\` (directed) or \`2m\` (undirected). So the total work is \`n + 2m\` = **O(V + E)**, no matter how the edges are arranged.

**Cycle detection in an undirected graph.** During DFS, if you see a neighbour that is *already visited* and it is **not the vertex you just came from** (your *parent*), you have found a second route to it — a cycle. The parent check is needed because in an undirected graph every edge \`u–v\` also appears as \`v–u\`, and walking back along it is not a cycle.`,
          },
          {
            type: 'code',
            title: 'Undirected cycle detection with parent tracking',
            code: `function hasCycleUndirected(n, adj) {
  const visited = new Uint8Array(n);
  const dfs = (u, parent) => {
    visited[u] = 1;
    for (const v of adj[u]) {
      if (!visited[v]) { if (dfs(v, u)) return true; }
      else if (v !== parent) return true;     // visited and not where we came from
    }
    return false;
  };
  for (let s = 0; s < n; s++) if (!visited[s] && dfs(s, -1)) return true;
  return false;
}`,
            caption: 'Caveat: with parallel edges (two copies of u–v) compare edge ids instead of vertex ids. Directed graphs need a different test (three colours) — see Topological Sort.',
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-5',
            question: 'Where must `visited[u] = 1` go in recursive DFS?',
            options: [
              'After the loop over neighbours, once u is fully explored',
              'Only when u has no unvisited neighbours',
              'It does not matter as long as it is somewhere inside dfs',
              'At the very start of dfs(u), before looping over neighbours',
            ],
            answer: 3,
            explanation: 'Marking first means that when a neighbour (directly or through a cycle) leads back to `u`, the check `!visited[u]` already says "done here". Marking late lets the cycle `u → v → u` recurse forever.',
            misconceptions: {
              0: 'If u is marked only after its loop, then while exploring its neighbours a cycle can lead back to u, which still looks unvisited, and the recursion never ends.',
              1: 'Leaves would get marked but inner vertices on a cycle would not — the same infinite recursion.',
              2: 'Placement is exactly what decides whether cycles terminate. Mark on entry (or, iteratively, when pushing/popping as the template says).',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why each **new start** in the outer loop means a **new connected component**?',
            deeper: `One DFS call from \`s\` marks **everything reachable from s** — that is exactly s's component (in an undirected graph "reachable" is symmetric). When the outer loop later finds an unvisited vertex \`t\`, t was NOT reachable from any earlier start, so it belongs to a component we have not seen yet. Hence: *number of DFS launches = number of components*. This is how "number of islands" and "number of provinces" work.`,
          },
        ],
      },
      {
        id: 'template-dfs',
        title: 'Pattern / template — DFS',
        blocks: [
          {
            type: 'code',
            title: 'Recursive DFS over all components',
            code: `function components(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const visited = new Uint8Array(n);
  const dfs = (u) => {
    visited[u] = 1;
    for (const v of adj[u]) if (!visited[v]) dfs(v);
  };
  let count = 0;
  for (let s = 0; s < n; s++) if (!visited[s]) { count++; dfs(s); }
  return count;
}`,
          },
          {
            type: 'code',
            title: 'Iterative DFS with an explicit stack (no recursion limit)',
            code: `function reachable(adj, start) {
  const visited = new Uint8Array(adj.length);
  const stack = [start];
  visited[start] = 1;              // mark when pushing → each vertex pushed once
  while (stack.length) {
    const u = stack.pop();         // pop() is O(1) — the END of the array
    for (const v of adj[u]) {
      if (!visited[v]) { visited[v] = 1; stack.push(v); }
    }
  }
  return visited;
}`,
            caption: 'Order differs slightly from recursive DFS (neighbours come out in reverse), which is irrelevant for reachability and counting.',
          },
        ],
      },
      {
        id: 'implementation-dfs',
        title: 'JavaScript implementation — DFS',
        blocks: [
          {
            type: 'callout',
            variant: 'warning',
            title: 'Recursion depth in JavaScript',
            md: `V8 (Chrome/Node) typically allows roughly **10,000 frames** of recursion before throwing \`RangeError: Maximum call stack size exceeded\` (the exact number depends on frame size). A 300×300 grid that is all land can make recursive DFS go 90,000 deep.

- Small inputs (≤ ~5,000 deep): recursive DFS is fine and readable.
- Big grids / long chains: use the **explicit stack** version or BFS.`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Visited structures',
            md: `- Vertices \`0..n-1\`: \`new Uint8Array(n)\` — zero-initialised, 1 byte per vertex, faster and smaller than \`new Array(n).fill(false)\` or a Set.
- Grid cells: either overwrite the grid (\`grid[r][c] = 0\`) or use \`Uint8Array(R * C)\` indexed by \`r * C + c\`.
- Strings / tuples: \`Set\`. For a pair \`(r, c)\` never store the array \`[r, c]\` in a Set — arrays are compared by reference. Use \`r * C + c\` or the string \`r + ',' + c\`.`,
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-6',
            question: 'You store visited cells with `seen.add([r, c])` and check with `seen.has([r, c])`. What happens?',
            options: [
              'It works, but is slower than strings',
              '`has` is always false because each `[r, c]` literal is a new array object; the traversal revisits cells forever or blows up',
              '`has` is always true after the first insertion',
              'JavaScript throws a TypeError for arrays in a Set',
            ],
            answer: 1,
            explanation: 'Sets compare objects by identity (reference), not contents. `[1,2] === [1,2]` is `false`. Encode the pair as a number (`r * C + c`) or a string (`r + "," + c`).',
            misconceptions: {
              0: 'It does not work at all — two arrays with the same contents are different keys.',
              2: 'The opposite: a new array literal is never the same object as the one stored.',
              3: 'Sets accept any value, including arrays. No error, just silently wrong behaviour — which is worse.',
            },
          },
        ],
      },
      {
        id: 'optimized-bfs',
        title: 'Optimized approach — BFS (shortest path in unweighted graphs)',
        blocks: [
          {
            type: 'steps',
            title: 'BFS from a source s',
            steps: [
              'Set `dist[s] = 0`, put `s` in the queue. Every other distance is "unknown" (-1).',
              'Take the vertex `u` at the front of the queue.',
              'For every neighbour `v` with unknown distance: set `dist[v] = dist[u] + 1` and push `v` to the back of the queue.',
              'Repeat until the queue is empty. `dist[t]` is the fewest edges from s to t (or -1 if unreachable).',
            ],
          },
          {
            type: 'text',
            md: `### Why BFS gives shortest paths — the layers argument

Call **layer k** the set of vertices whose true shortest distance from \`s\` is \`k\`.

1. **The queue is always sorted by distance, with at most two consecutive values.** At any time it looks like \`[d, d, …, d, d+1, d+1, …]\`. Reason: we pop a vertex with distance \`d\` and only ever push \`d + 1\` to the back. Starting from \`[0]\`, this shape is preserved forever (an *invariant*).
2. **So vertices are popped in non-decreasing order of the distance we assigned.** All of layer 0 comes out, then all of layer 1, then layer 2…
3. **The first time a vertex is discovered is via a shortest path.** Suppose \`v\` really has distance \`k\`. Its predecessor on a shortest path, \`p\`, has distance \`k − 1\`, and it is popped *before* any vertex of distance \`k\` or more. When \`p\` is popped, \`v\` gets \`dist = k\` (if nothing even earlier claimed it — and nothing earlier can offer less than \`k\`, because that would contradict \`k\` being the shortest).

Because the first discovery is already optimal, we **never** need to revisit a vertex: mark it at discovery, and each vertex enters the queue once → O(V + E).`,
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-7',
            question: 'Why should BFS mark a vertex visited when it is **pushed**, not when it is **popped**?',
            options: [
              'Marking on pop gives wrong distances in every graph',
              'It is required so that the queue stays sorted',
              'Marking on push guarantees each vertex enters the queue once; marking on pop lets the same vertex be pushed by many neighbours before it is popped, blowing up time and memory',
              'There is no difference; both are equally efficient',
            ],
            answer: 2,
            explanation: 'With mark-on-pop, if 1,000 vertices are all adjacent to `v`, `v` can be enqueued 1,000 times before its first pop. Distances stay correct (the first pop is still the best), but the queue can grow to O(E) and on grids this often causes time-limit failures.',
            misconceptions: {
              0: 'Distances are actually still correct with mark-on-pop — the first copy popped has the smallest distance. The problem is wasted work, not wrong answers.',
              1: 'The queue stays sorted by distance either way; duplicates just make it much longer.',
              3: 'Try a complete graph: mark-on-pop pushes each vertex up to n − 1 times. That is O(n²) queue entries instead of O(n).',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why BFS stops being correct as soon as edges have **different weights**?',
            deeper: `The layers argument relies on "one more edge = one more unit of distance". With weights, a path with **more** edges can be **cheaper** (three edges of cost 1 beat one edge of cost 10). BFS would discover the target via the single expensive edge first and lock it in. Dijkstra fixes this by replacing the FIFO queue with a priority queue ordered by total cost. (Special case: if weights are only 0 or 1, a deque-based "0-1 BFS" works — you will see both in the Shortest Path topic.)`,
          },
        ],
      },
      {
        id: 'template-bfs',
        title: 'Pattern / template — BFS',
        blocks: [
          {
            type: 'code',
            title: 'BFS distances with a head pointer',
            code: `function bfsDistances(n, adj, s) {
  const dist = new Array(n).fill(-1);
  dist[s] = 0;
  const queue = [s];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];               // "dequeue" = move head forward, O(1)
    for (const v of adj[u]) {
      if (dist[v] !== -1) continue;       // already discovered
      dist[v] = dist[u] + 1;
      queue.push(v);
    }
  }
  return dist;
}`,
          },
          {
            type: 'code',
            title: 'Level-by-level BFS (when you need the round number)',
            code: `let level = 0;
let frontier = [start];
seen.add(start);
while (frontier.length) {
  const next = [];
  for (const u of frontier) {
    if (u === target) return level;
    for (const v of neighbors(u)) if (!seen.has(v)) { seen.add(v); next.push(v); }
  }
  frontier = next;
  level++;
}
return -1;`,
            caption: 'Swapping arrays per level avoids shift() entirely and keeps the level counter obvious.',
          },
        ],
      },
      {
        id: 'implementation-bfs',
        title: 'JavaScript implementation — BFS',
        blocks: [
          {
            type: 'compare',
            left: {
              title: 'queue.shift() — hidden O(n²)',
              code: `while (queue.length) {
  const u = queue.shift();   // moves every remaining element
  ...
}`,
              md: 'Each `shift()` re-indexes the whole array: O(queue length). On a 10⁶-cell grid this is catastrophic.',
            },
            right: {
              title: 'head pointer — O(1) per pop',
              code: `for (let head = 0; head < queue.length; head++) {
  const u = queue[head];
  ...
}`,
              md: 'The array only grows; `head` marks the front. Memory O(V) total, which BFS needs anyway. Or use the toolkit `Queue`.',
            },
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Storing grid cells in the queue',
            md: 'Pushing `[r, c]` arrays is fine and readable. For very large grids, push the single integer `r * C + c` and decode with `r = Math.floor(id / C)`, `c = id % C` — fewer allocations, less garbage collection.',
          },
        ],
      },
      {
        id: 'optimized-grid',
        title: 'Optimized approach — grids as implicit graphs',
        blocks: [
          {
            type: 'text',
            md: `In a grid, each cell \`(r, c)\` is a vertex. Its neighbours are the cells one step up/down/left/right (sometimes also diagonals). We never build an adjacency list — we **compute** neighbours with a direction array:

\`\`\`js
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [dr, dc] of DIRS) {
  const nr = r + dr, nc = c + dc;
  if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue; // off the grid
  // ...
}
\`\`\`

V = R·C and every cell has at most 4 edges, so any traversal is **O(R·C)**.

**Counting islands** = counting connected components of land cells: scan every cell; when you find unvisited land, count one island and flood the whole island with DFS/BFS so it is never counted again.`,
          },
          {
            type: 'visual',
            scenario: 'grid-dfs',
            input: { grid: [[1, 1, 0, 0, 0], [1, 1, 0, 0, 1], [0, 0, 1, 0, 1], [0, 0, 0, 1, 1]] },
            caption: 'Each time the scan hits new land, one DFS sinks the whole island. 3 launches → 3 islands (diagonal touching does not connect).',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Reverse thinking: start from the border',
            md: '"Capture regions that are NOT connected to the border" and "cells that can flow to both oceans" are hard if you start from every cell. Flip the question: DFS/BFS **from the border inward**, mark what is reachable, and the answer is everything else (or the intersection of two such markings). One traversal instead of one per cell.',
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-8',
            question: 'In `dfs(r, c)`, which check order is safe?',
            options: [
              '`if (r < 0 || r >= R || c < 0 || c >= C || grid[r][c] !== 1) return;`',
              '`if (grid[r][c] !== 1 || r < 0 || r >= R || c < 0 || c >= C) return;`',
              '`if (grid[r][c] === undefined) return;` is enough on its own',
              'Bounds checks are unnecessary in JavaScript because out-of-range reads return undefined',
            ],
            answer: 0,
            explanation: '`||` short-circuits left to right. Checking bounds first guarantees `grid[r]` exists before we index `[c]`. With the grid check first, `grid[-1]` is `undefined` and `undefined[c]` throws a TypeError.',
            misconceptions: {
              1: 'When r = -1, `grid[-1]` is undefined and `grid[-1][c]` throws before the bounds check is reached.',
              2: 'For an out-of-range **row**, `grid[r]` is undefined and `grid[r][c]` throws. It only "works" for bad columns.',
              3: 'An out-of-range column returns undefined, but an out-of-range row makes the second index throw. Always check bounds first.',
            },
          },
        ],
      },
      {
        id: 'optimized-multi-source',
        title: 'Optimized approach — multi-source BFS',
        blocks: [
          {
            type: 'text',
            md: `*"For every cell, how far is the nearest 0?"* Brute force runs a BFS from every cell: O((R·C)²).

**Flip it:** start ONE BFS from **all** the 0s at once. Put every source in the queue with distance 0. The BFS ripples outward from all of them simultaneously, and each cell is first reached by the ripple of its **nearest** source.

Why it is correct: imagine an extra *virtual* vertex \`S*\` with an edge of length 0 to every source. A normal BFS from \`S*\` gives "distance to the nearest source". Seeding the queue with all sources is exactly the state that BFS from \`S*\` would reach after its first step.`,
          },
          {
            type: 'visual',
            scenario: 'grid-bfs',
            input: { grid: [[2, 1, 1, 0], [1, 1, 0, 1], [0, 1, 1, 2], [1, 1, 1, 1]] },
            caption: 'Both sources (2) start at time 0. Each wave of the queue is one minute. Walls (0) block the spread.',
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-9',
            question: 'Rotting oranges: rotten oranges infect fresh neighbours every minute. Why is ONE BFS seeded with all rotten oranges correct, instead of a BFS per rotten orange?',
            options: [
              'Because a fresh orange rots at the minute of its NEAREST rotten source, and multi-source BFS assigns exactly the nearest-source distance to every cell',
              'Because oranges can only be infected once, so the order does not matter',
              'Because DFS from each rotten orange would give the same answer faster',
              'It is not correct; you must take the maximum over separate BFS runs',
            ],
            answer: 0,
            explanation: 'All sources spread at the same speed at the same time, so the time a cell rots is min over sources of dist(source, cell). BFS from the virtual super-source computes exactly that minimum for every cell in one O(R·C) pass.',
            misconceptions: {
              1: 'The order matters a lot for timing: the first ripple to arrive decides the minute. BFS processes ripples in time order, which is why it is correct.',
              2: 'DFS does not respect time order; it would assign large "minutes" along long winding paths.',
              3: 'Separate runs would need a MIN over sources per cell (then a max over cells) — correct but O(S · R · C). The multi-source BFS computes that min directly.',
            },
          },
        ],
      },
      {
        id: 'optimized-bidirectional',
        title: 'Optimized approach — bidirectional BFS',
        blocks: [
          {
            type: 'text',
            md: `When both the **start** and the **target** are known, you can search from both ends.

If each state has about \`b\` neighbours and the answer is \`d\` steps, a single BFS touches about \`b^d\` states. Two BFS searches that meet in the middle each go only \`d/2\` deep: about \`2·b^(d/2)\`. With \`b = 10, d = 8\`: 100,000,000 vs 20,000.

Rules that make it work:
1. Keep two frontiers (Sets) and one shared visited set.
2. Always expand the **smaller** frontier — that keeps the work balanced.
3. When a neighbour you generate is in the **other** frontier, the two searches have met: the answer is the number of layers expanded.

Word Ladder is the classic: vertices are words, edges join words that differ by one letter.`,
          },
          {
            type: 'code',
            title: 'Generating word neighbours on the fly',
            code: `function* neighbors(word, dict) {
  const chars = word.split('');
  for (let i = 0; i < chars.length; i++) {
    const orig = chars[i];
    for (let code = 97; code <= 122; code++) {        // 'a'..'z'
      const ch = String.fromCharCode(code);
      if (ch === orig) continue;
      chars[i] = ch;
      const cand = chars.join('');
      if (dict.has(cand)) yield cand;
    }
    chars[i] = orig;
  }
}`,
            caption: 'L × 26 candidates per word, each O(L) to build → O(26·L²) per expansion.',
          },
        ],
      },
      {
        id: 'optimized-bipartite',
        title: 'Optimized approach — bipartite 2-colouring',
        blocks: [
          {
            type: 'callout',
            variant: 'definition',
            title: 'Bipartite',
            md: 'A graph is **bipartite** if its vertices can be split into two groups A and B so that **every edge goes between A and B** (no edge inside a group). Equivalently: you can colour every vertex red or blue so that no edge joins two vertices of the same colour.',
          },
          { type: 'visual', scenario: 'bipartite-check', caption: "Colour neighbours the opposite colour; a same-colour edge proves an odd cycle." },
          {
            type: 'text',
            md: `Algorithm: pick an uncoloured vertex, colour it 0, BFS. Each neighbour must get the **opposite** colour \`1 − color[u]\`. If a neighbour already has the **same** colour as \`u\`, stop: not bipartite. Repeat for every component.

**Why it is correct:** the colours are forced — once one vertex is fixed, BFS assigns colour = *layer parity* (even layers 0, odd layers 1). A conflict means two vertices at the same parity are adjacent, which closes a cycle of **odd length**. And an odd cycle can never be 2-coloured (walk around it alternating colours; you come back to the start needing the opposite colour). So: **bipartite ⟺ no odd cycle ⟺ BFS colouring finds no conflict.**`,
          },
          {
            type: 'checkpoint',
            id: 'graphs-cp-10',
            question: 'Which graph is NOT bipartite?',
            options: [
              'A square: 0–1–2–3–0',
              'A tree with 10 vertices',
              'A triangle: 0–1–2–0',
              'Two separate edges 0–1 and 2–3',
            ],
            answer: 2,
            explanation: 'A triangle is a cycle of length 3 (odd). Colour 0 red, 1 blue, then 2 must differ from both — impossible with two colours.',
            misconceptions: {
              0: 'A 4-cycle is even: red, blue, red, blue works.',
              1: 'Trees have no cycles at all, so they are always bipartite (colour by depth parity).',
              3: 'Disconnected is fine — colour each component separately. Just remember to start BFS from every uncoloured vertex.',
            },
          },
        ],
      },
      {
        id: 'optimized-state-space',
        title: 'Optimized approach — BFS over states (bitmask)',
        blocks: [
          {
            type: 'text',
            md: `Sometimes "which vertex am I on" does not capture enough. *"Shortest walk that visits every node (you may revisit nodes and edges)"*: standing on node 2 having visited {0, 2} is a **different situation** from standing on node 2 having visited {0, 1, 2, 3}.

So we make each BFS vertex a **state** \`(node, visitedSet)\`. BFS over states still finds the fewest moves, because every move costs 1.

**Storing a set as an integer (bitmask).** With n ≤ 12 nodes, write the visited set as an n-bit binary number: bit \`i\` is 1 if node \`i\` was visited.

| set | binary (nodes 3 2 1 0) | integer |
|---|---|---|
| {0} | 0001 | 1 |
| {0, 2} | 0101 | 5 |
| {0,1,2,3} | 1111 | 15 = \`(1 << 4) - 1\` |

- \`1 << i\` is the number with only bit i set (1, 2, 4, 8…).
- \`mask | (1 << v)\` adds node v to the set.
- \`mask === (1 << n) - 1\` means "all nodes visited".

(Bit tricks get a full topic later — this is all you need here.) There are \`n · 2^n\` states: for n = 12 that is ~49,000, tiny for BFS.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'The visited check moves to the state',
            md: 'Mark `seen[node][mask]`, not `seen[node]`. Coming back to node 0 with a bigger mask is progress, not a repeat.',
          },
        ],
      },
      {
        id: 'optimized-labeling',
        title: 'Optimized approach — component labeling',
        blocks: [
          {
            type: 'text',
            md: `*"You may flip one 0 into a 1. What is the largest island you can make?"*

Brute force: try each 0, flip it, recount the biggest island: O((R·C)²).

**Label first, then answer each question in O(1):**
1. DFS/BFS every island once. Write its **id** (2, 3, 4…) into its cells and store \`size[id]\`.
2. For every 0 cell, look at its 4 neighbours, collect the **distinct** ids (a Set — the same island can touch the cell from two sides), and the island you would create is \`1 + sum of their sizes\`.
3. Also consider the case where there is no 0 at all (the whole grid is one island).

Total O(R·C). This "precompute component id + size" idea shows up constantly — when components also change over time, you will use Union-Find instead.`,
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'text',
            md: `Every traversal in this topic is the same four-part skeleton. Only the **container** and the **"what is a vertex"** change:

1. **Build** neighbours (adjacency list, Map, or computed for grids / states).
2. **Seed** the container with the start(s) and mark them.
3. **Loop**: take one out, look at its neighbours, mark + add the new ones.
4. **Answer** from what you recorded (visited, dist, colour, count, size).`,
          },
          {
            type: 'code',
            title: 'Grid BFS template (shortest steps from one or many sources)',
            code: `const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function gridBfs(grid, sources) {
  const R = grid.length, C = grid[0].length;
  const dist = Array.from({ length: R }, () => new Array(C).fill(-1));
  const queue = [];
  for (const [r, c] of sources) { dist[r][c] = 0; queue.push([r, c]); }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      if (grid[nr][nc] === 0 || dist[nr][nc] !== -1) continue;   // wall or seen
      dist[nr][nc] = dist[r][c] + 1;
      queue.push([nr, nc]);
    }
  }
  return dist;
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Number of islands — iterative DFS (safe for big grids)',
            code: `function numIslands(grid) {
  const R = grid.length, C = grid[0].length;
  let islands = 0;
  const stack = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] !== '1') continue;
      islands++;
      grid[r][c] = '0';                         // mark on push
      stack.push(r * C + c);
      while (stack.length) {
        const id = stack.pop();
        const cr = Math.floor(id / C), cc = id % C;
        if (cr > 0     && grid[cr - 1][cc] === '1') { grid[cr - 1][cc] = '0'; stack.push(id - C); }
        if (cr < R - 1 && grid[cr + 1][cc] === '1') { grid[cr + 1][cc] = '0'; stack.push(id + C); }
        if (cc > 0     && grid[cr][cc - 1] === '1') { grid[cr][cc - 1] = '0'; stack.push(id - 1); }
        if (cc < C - 1 && grid[cr][cc + 1] === '1') { grid[cr][cc + 1] = '0'; stack.push(id + 1); }
      }
    }
  }
  return islands;
}`,
            caption: 'Cells are encoded as r * C + c to avoid allocating an array per stack entry.',
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'BFS distances from 0 — edges 0–1, 0–2, 1–3, 2–3, 3–4',
            columns: ['pop', 'dist[u]', 'neighbours', 'newly discovered', 'queue after'],
            rows: [
              ['—', '—', '—', '0 (dist 0)', '[0]'],
              ['0', '0', '1, 2', '1 → 1, 2 → 1', '[1, 2]'],
              ['1', '1', '0, 3', '3 → 2', '[2, 3]'],
              ['2', '1', '0, 3', 'none (3 already discovered)', '[3]'],
              ['3', '2', '1, 2, 4', '4 → 3', '[4]'],
              ['4', '3', '3', 'none', '[]'],
            ],
            note: 'Vertex 3 is reachable from both 1 and 2 but enters the queue once. The queue always holds at most two distance values (d and d+1).',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **\`new Array(n).fill([])\`** — one shared neighbour array. Use \`Array.from({ length: n }, () => [])\`.
2. **Forgetting the reverse edge** in undirected graphs.
3. **Starting only from vertex 0** — disconnected graphs need an outer loop over all vertices.
4. **Marking visited too late** — DFS: on entry; BFS: when pushing.
5. **\`queue.shift()\`** — O(n) per call. Use a head pointer or the toolkit Queue.
6. **Using DFS for "minimum steps"** — DFS does not give shortest paths.
7. **Bounds check after the grid access** — \`grid[-1][c]\` throws.
8. **Arrays as Set/Map keys** — compared by reference. Encode \`r * C + c\`.
9. **Recursion too deep** on big grids — switch to an explicit stack or BFS.
10. **Mutating input the caller still needs** — marking visited by overwriting the grid is fine in interviews, but say so out loud.
11. **Grid values of the wrong type** — Number of Islands uses the strings \`'1'\`/\`'0'\`, most other problems use numbers.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why "mark on push" and "mark on pop" give the **same distances** but very different running times?',
            deeper: 'The first copy of a vertex that is popped always has its smallest distance (the queue is sorted by distance), so both versions report correct distances. But with mark-on-pop the same vertex can be pushed once per incoming edge before it is ever popped, so the queue holds O(E) entries instead of O(V) — and each duplicate pop re-scans that vertex’s neighbours unless you skip it. Mark on push makes the "each vertex once" part of the O(V + E) proof literally true.',
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
            space: 'O(V)',
            md: `**Time:** every vertex is marked and taken out of the stack/queue once; when it is taken out its neighbour list is scanned once. Sum of all neighbour-list lengths = E (directed) or 2E (undirected). Grids: V = R·C, E ≤ 4·R·C → **O(R·C)**.

**Space:** visited/dist arrays O(V), plus the stack/queue, which can hold O(V) vertices (BFS on a wide graph; DFS on a long chain). Recursive DFS uses the call stack for the same O(V) in the worst case.

**Adjacency list:** O(V + E) memory. **Matrix:** O(V²) memory and O(V²) traversal time (scanning a full row per vertex).

**Special cases:** state-space BFS is O(states × moves per state), e.g. O(2^n · n²) for shortest path visiting all nodes. Bidirectional BFS keeps the same worst case but in practice explores about the square root of the states.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say out loud what the vertices and edges are.** "Each cell is a node, adjacent land cells are edges." This shows you recognised the model.
- **Justify BFS vs DFS.** "All moves cost one and we want the minimum, so BFS; the first time we reach the target is optimal."
- **Mention the visited strategy** and whether you mutate the input.
- **State O(V + E)** and translate it: "O(R·C) for the grid".
- **Edge cases:** empty graph / grid, a single vertex, disconnected parts, start equals target, target unreachable (return -1), self-loops / duplicate edges.
- If the interviewer asks about scale: "Recursive DFS could overflow the stack for 10^6 cells — I would switch to an explicit stack."`,
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
              { api: 'Array.from({ length: n }, () => [])', use: 'Adjacency list with a separate array per vertex', complexity: 'O(n)' },
              { api: 'new Map()', use: 'Adjacency list for string or sparse vertices; old → clone mapping', complexity: 'O(1) average' },
              { api: 'new Uint8Array(n) / new Int8Array(n)', use: 'visited flags / colours (-1, 0, 1) for numbered vertices', complexity: 'O(1) access' },
              { api: 'new Set()', use: 'Visited words / encoded cells / frontiers', complexity: 'O(1) average' },
              { api: 'for (let head = 0; head < q.length; head++)', use: 'BFS queue without shift()', complexity: 'O(1) per pop' },
              { api: 'stack.push / stack.pop', use: 'Iterative DFS', complexity: 'O(1)' },
              { api: 'r * C + c', use: 'Encode a cell as one integer', complexity: 'O(1)' },
              { api: '1 << i, mask | (1 << i)', use: 'Small visited-sets as integers (state-space BFS)', complexity: 'O(1)' },
              { api: 'buildAdjList, Graph, Queue (toolkit)', use: 'Ready-made helpers available in the editor', complexity: 'O(n + m) build' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Reachability / connected components / flood fill → DFS or BFS', 'Fewest steps with equal-cost moves → BFS', 'Nearest source for every cell → multi-source BFS', 'Known start + target with huge branching → bidirectional BFS', 'Two conflict-free groups → bipartite colouring', 'Shortest walk that must cover a small set → BFS over (node, mask)'],
    clues: ['edges [u, v]', 'grid / island / region', 'connected / reachable', 'minimum steps / moves / transformations', 'spreads every minute', 'two groups', 'visit all nodes'],
    template: `const adj = Array.from({ length: n }, () => []);
for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
const dist = new Array(n).fill(-1); dist[s] = 0;
const q = [s];
for (let h = 0; h < q.length; h++) {
  const u = q[h];
  for (const v of adj[u]) if (dist[v] === -1) { dist[v] = dist[u] + 1; q.push(v); }
}`,
    complexity: 'O(V + E) time, O(V) space; grids O(R·C)',
    mistakes: ['fill([]) shared arrays', 'missing reverse edge', 'only starting from vertex 0', 'marking visited late', 'queue.shift()', 'DFS for shortest path', 'bounds check after access', 'arrays as Set keys', 'deep recursion on big grids'],
    jsTools: ['Array.from', 'Map', 'Set', 'Uint8Array', 'head-pointer queue', 'r * C + c'],
  },

  keyConcepts: [
    'A graph = vertices + edges; directed/undirected, weighted/unweighted. Default representation: adjacency list, O(V + E) memory.',
    'DFS (stack / recursion) and BFS (queue) both visit every reachable vertex once in O(V + E); the visited set is what makes cycles safe.',
    'Number of DFS/BFS launches from unvisited vertices = number of connected components.',
    'BFS discovers vertices in order of distance (layers invariant), so it gives shortest paths in unweighted graphs; DFS does not.',
    'Grids are implicit graphs: compute neighbours with a direction array and check bounds first.',
    'Multi-source BFS = BFS from a virtual super-source; bidirectional BFS meets in the middle to cut b^d to about 2·b^(d/2).',
    'Bipartite ⟺ no odd cycle ⟺ BFS 2-colouring finds no same-colour edge.',
    'When history matters, BFS over states (node, bitmask); precomputed component ids + sizes answer "what if I add one cell" in O(1).',
  ],

  interviewTips: [
    'Name the vertices and edges before writing code.',
    'Explain why BFS (fewest equal-cost moves) or DFS (reachability / components).',
    'Mention visited marking time, recursion depth, and O(V + E).',
  ],
};
