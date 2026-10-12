export default {
  id: 'shortest-path',
  summary: 'Find the cheapest way from one place to another in a graph — and, more importantly, pick the right algorithm (BFS, 0-1 BFS, Dijkstra, Bellman-Ford, Floyd-Warshall) from the shape of the edge weights.',

  jsTools: [
    { api: 'MinHeap (toolkit)', use: 'Dijkstra frontier: new MinHeap((e) => e[0]) pops the smallest tentative distance', complexity: 'push / pop O(log n)' },
    { api: 'Deque (toolkit)', use: '0-1 BFS: pushFront for weight-0 edges, pushBack for weight-1 edges', complexity: 'O(1) at both ends' },
    { api: 'new Array(n).fill(Infinity)', use: 'Distance table: "not reached yet" = Infinity', complexity: 'O(n)' },
    { api: 'Array.from({ length: n }, () => [])', use: 'Adjacency list (one fresh array per node — never fill([]))', complexity: 'O(n)' },
    { api: 'dist.slice()', use: 'Bellman-Ford: copy of the previous round so one round uses at most one more edge', complexity: 'O(n)' },
    { api: 'BigInt / % 1_000_000_007', use: 'Counting shortest paths: keep counts modulo 1e9+7; sums of distances may exceed 2^53 → compare carefully', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'shortest-path-unweighted-bfs',
      name: 'Shortest Path — BFS on Unweighted Graphs / Grids',
      summary: 'When every edge costs the same, BFS visits nodes in order of distance, so the first time you reach a node is the shortest way to it.',
      whyItExists: 'BFS explores in "rings": all nodes at distance 1, then all at distance 2, and so on. With equal edge costs, ring number = distance, so no priority queue is needed and the run is O(V + E).',
      whenToUse: [
        'Every move/edge costs exactly 1 (or the same constant)',
        '"Minimum number of steps / moves / swaps / transformations"',
        'Grid mazes where you can step up/down/left/right',
        'Multi-source: distance from the nearest of several starting cells',
      ],
      clues: ['"minimum number of steps"', '"fewest moves"', '"nearest exit"', 'grid with walls', '"shortest transformation sequence"', 'all edges weight 1'],
      whenNotToUse: [
        'Edges have different weights → Dijkstra (or 0-1 BFS if weights are only 0 and 1)',
        'You need the longest path — BFS does not help (longest simple path is NP-hard in general graphs)',
      ],
      template: `function bfsDistance(start, target, neighbors) {
  const dist = new Map([[start, 0]]);
  let frontier = [start];
  while (frontier.length) {
    const next = [];
    for (const u of frontier) {
      if (u === target) return dist.get(u);
      for (const v of neighbors(u)) {
        if (!dist.has(v)) {           // mark when ENQUEUED, not when popped
          dist.set(v, dist.get(u) + 1);
          next.push(v);
        }
      }
    }
    frontier = next;
  }
  return -1;
}`,
      variations: [
        { name: 'Multi-source BFS', description: 'Start with every source in the first frontier (e.g. every cell of island A in Shortest Bridge).' },
        { name: 'Grid BFS', description: 'Neighbours are the 4 (or 8) adjacent in-bounds, non-wall cells; encode a cell as r * cols + c.' },
        { name: 'Level-by-level', description: 'Process one frontier at a time so the step counter is the level number.' },
      ],
      mistakes: [
        'Marking visited when popping instead of when pushing → the same cell is enqueued many times',
        'Using array.shift() as the queue: O(n) per call; use an index pointer or level arrays',
        'Using BFS on weighted edges — the first arrival is then NOT the cheapest',
      ],
      evolution: {
        easy: 'Steps through an open grid / unweighted graph.',
        medium: 'Multi-source BFS, grids with special exit rules (nearest exit), two-phase (DFS to mark, BFS to expand — Shortest Bridge).',
        hard: 'The node is not just a cell: add extra state (keys held, obstacles left) → state-augmented BFS.',
      },
    },
    {
      id: 'shortest-path-0-1-bfs',
      name: 'Shortest Path — 0-1 BFS (Deque)',
      summary: 'When every edge weighs 0 or 1, use a deque: weight-0 neighbours go to the FRONT, weight-1 neighbours to the BACK. It is Dijkstra without the heap.',
      whyItExists: 'Dijkstra needs the frontier sorted by distance. With only 0/1 weights, the frontier only ever holds two distance values, d and d + 1. A deque keeps them sorted for free: d-values at the front, (d+1)-values at the back. That gives O(V + E) instead of O(E log V).',
      whenToUse: [
        'Edge costs are only 0 or 1',
        '"Minimum number of walls to break / obstacles to remove / arrows to change"',
        'Some moves are free, others cost one unit',
      ],
      clues: ['"minimum obstacles to remove"', '"minimum cost to change arrows"', 'free moves vs paid moves', 'cost is 0 or 1 per step'],
      whenNotToUse: [
        'Weights other than 0 and 1 → Dijkstra',
        'All weights equal → plain BFS is simpler',
      ],
      template: `function zeroOneBfs(n, adj, src) {       // adj[u] = [[v, w]] with w in {0, 1}
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const dq = new Deque();
  dq.pushBack(src);
  while (!dq.isEmpty()) {
    const u = dq.popFront();
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        if (w === 0) dq.pushFront(v); else dq.pushBack(v);
      }
    }
  }
  return dist;
}`,
      variations: [
        { name: 'Grid with obstacles', description: 'Stepping onto an obstacle costs 1, onto an empty cell 0 (Minimum Obstacle Removal).' },
        { name: 'Grid with arrows', description: 'Following the arrow costs 0, any other direction costs 1 (Minimum Cost to Make a Valid Path).' },
      ],
      mistakes: [
        'Marking a node visited on push — a node can be improved later via a 0-edge; only relax on "strictly smaller distance"',
        'Pushing weight-0 neighbours to the back (that turns it into a wrong BFS)',
        'Using an array with unshift() as the deque (O(n) per unshift)',
      ],
      evolution: {
        easy: 'Binary grid, count obstacles removed on the best path.',
        medium: 'Arrows / directions where following the given one is free.',
        hard: 'Combine with extra state or large implicit graphs.',
      },
    },
    {
      id: 'shortest-path-dijkstra',
      name: "Shortest Path — Dijkstra's Algorithm (MinHeap)",
      summary: 'With non-negative weights, repeatedly take the unfinished node with the smallest tentative distance from a min-heap; its distance is now final. Relax its edges.',
      whyItExists: 'BFS breaks when weights differ. Dijkstra generalises BFS by always expanding the closest frontier node. Because weights are ≥ 0, no later path can come back cheaper, so the popped distance is final. O((V + E) log V) with a binary heap.',
      whenToUse: [
        'Single source, non-negative weights (times, distances, costs)',
        'Also any "path cost" that never decreases when you extend a path: max-of-edges (minimax), product of probabilities ≤ 1 (maximise)',
        'Counting the number of shortest paths (count while relaxing)',
      ],
      clues: ['"minimum time for the signal to reach all nodes"', 'weighted edges, all ≥ 0', '"cheapest path"', '"maximum probability"', '"number of ways to arrive in the shortest time"'],
      whenNotToUse: [
        'Negative edge weights → Bellman-Ford',
        'A limit on the number of edges used ("at most k stops") → Bellman-Ford rounds or BFS over (node, stops)',
        'All weights equal → BFS is simpler and faster',
      ],
      template: `function dijkstra(n, adj, src) {           // adj[u] = [[v, w]]
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const heap = new MinHeap((e) => e[0]);     // entries: [distance, node]
  heap.push([0, src]);
  while (!heap.isEmpty()) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;               // stale entry (lazy deletion)
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {                 // relaxation
        dist[v] = d + w;
        heap.push([dist[v], v]);
      }
    }
  }
  return dist;
}`,
      variations: [
        { name: 'Early exit', description: 'Stop when the target is popped — its distance is final.' },
        { name: 'Max-probability', description: 'Use a max-heap and multiply; works because probabilities ≤ 1 never increase a path.' },
        { name: 'Minimax (bottleneck)', description: 'Path cost = max edge on the path; relax with Math.max(d, w) instead of d + w.' },
        { name: 'Count shortest paths', description: 'ways[v] = ways[u] on a strict improvement, ways[v] += ways[u] on a tie.' },
      ],
      mistakes: [
        'Forgetting the stale-entry check → correct answer but much slower, and wrong counts in path-counting problems',
        'Using a visited set AND relaxing already-finalised nodes inconsistently',
        'Running it with negative edges',
        'Using a plain array sorted every iteration (O(V² log V))',
      ],
      evolution: {
        easy: 'Classic single-source distances (network delay time).',
        medium: 'Different cost function (probability, max-edge effort), path counting modulo 1e9+7.',
        hard: 'Graph built implicitly from a grid or state, or combined with other constraints.',
      },
    },
    {
      id: 'shortest-path-bellman-ford',
      name: 'Shortest Path — Bellman-Ford (edge-limited rounds)',
      summary: 'Relax every edge, V − 1 times. After round i, every shortest path that uses at most i edges is correct. Handles negative weights and "at most k edges" limits.',
      whyItExists: 'Dijkstra relies on "the closest node is final", which negative edges break. Bellman-Ford makes no greedy assumption: it just keeps relaxing all edges. A shortest simple path has at most V − 1 edges, so V − 1 rounds are enough. The round structure also gives a natural edge-count limit.',
      whenToUse: [
        'Negative edge weights (and detecting negative cycles: a V-th round still improves something)',
        '"At most k stops / k edges" constraints',
        'Small graphs where O(V·E) is fine',
      ],
      clues: ['"at most k stops"', '"within k moves"', 'negative weights', '"detect a negative cycle"', 'currency arbitrage'],
      whenNotToUse: [
        'Large graphs with non-negative weights → Dijkstra is much faster',
        'Unweighted graphs → BFS',
      ],
      template: `function bellmanFordK(n, edges, src, k) {   // at most k edges
  let dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let round = 0; round < k; round++) {
    const next = dist.slice();               // read from the PREVIOUS round only
    for (const [u, v, w] of edges) {
      if (dist[u] + w < next[v]) next[v] = dist[u] + w;
    }
    dist = next;
  }
  return dist;
}`,
      variations: [
        { name: 'Unlimited edges', description: 'Run V − 1 rounds; you may update in place (it only converges faster).' },
        { name: 'Negative cycle detection', description: 'One extra round: if any edge still relaxes, a negative cycle is reachable.' },
        { name: 'SPFA', description: 'Queue-based Bellman-Ford that only re-relaxes nodes whose distance changed. Same worst case.' },
      ],
      mistakes: [
        'Updating dist in place when the edge count matters — a single round can then chain several edges',
        'Off-by-one: k stops = k + 1 edges = k + 1 rounds',
        'Relaxing from a node whose distance is still Infinity (harmless with Infinity, but wrong with a sentinel like 1e9)',
      ],
      evolution: {
        easy: 'Plain single-source with a few negative edges.',
        medium: 'Cheapest flights within k stops.',
        hard: 'Negative cycle detection, arbitrage, difference constraints.',
      },
    },
    {
      id: 'shortest-path-floyd-warshall',
      name: 'Shortest Path — Floyd-Warshall (all pairs)',
      summary: 'dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]) for every intermediate k. Three nested loops, O(V³), gives the shortest distance between EVERY pair.',
      whyItExists: 'Some questions need distances between all pairs of nodes. With small V (≤ ~400), a triple loop is simpler than running Dijkstra from every node. It is dynamic programming over "which nodes are allowed as stop-overs".',
      whenToUse: [
        'All-pairs distances with small n (≈ 100–400)',
        '"For every city, how many cities are within distance T"',
        'Transitive closure (can i reach j?) with booleans instead of numbers',
      ],
      clues: ['n ≤ 100', '"every pair"', '"for each city"', 'queries asking distance between arbitrary pairs'],
      whenNotToUse: [
        'Large n (O(n³) at n = 10^4 is 10^12)',
        'Only one source → Dijkstra / BFS',
      ],
      template: `function floydWarshall(n, edges) {
  const d = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [u, v, w] of edges) {
    d[u][v] = Math.min(d[u][v], w);
    d[v][u] = Math.min(d[v][u], w);          // undirected
  }
  for (let k = 0; k < n; k++)                 // k MUST be the outer loop
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}`,
      variations: [
        { name: 'Transitive closure', description: 'reach[i][j] ||= reach[i][k] && reach[k][j] (Course Schedule IV style).' },
        { name: 'Negative cycle check', description: 'After the loops, d[i][i] < 0 means i lies on a negative cycle.' },
      ],
      mistakes: [
        'Putting k in the inner loop — the DP order breaks and answers become wrong',
        'Forgetting parallel edges (keep the minimum weight)',
        'Forgetting d[i][i] = 0',
      ],
      evolution: {
        easy: 'Small all-pairs table.',
        medium: 'Count reachable cities within a threshold.',
        hard: 'Combine with DP over subsets or reachability queries.',
      },
    },
    {
      id: 'shortest-path-minimax',
      name: 'Shortest Path — Minimax / Bottleneck Paths',
      summary: 'The cost of a path is its WORST edge (max height difference, max water level). Minimise that with Dijkstra using max instead of +, or binary-search the answer and check with BFS.',
      whyItExists: 'Some problems do not sum costs: you care about the single hardest step. "max" is still monotone (extending a path never makes its max smaller), so Dijkstra\'s greedy argument still holds. Alternatively, the answer is monotone in a threshold, so binary search + reachability works.',
      whenToUse: [
        '"Minimise the maximum …" along a path',
        'Effort = largest absolute difference between consecutive cells',
        'Time = highest cell you must wade through',
      ],
      clues: ['"minimum effort"', '"maximum absolute difference"', '"swim"', '"rising water"', '"minimise the largest"', 'bottleneck'],
      whenNotToUse: [
        'Cost is the sum of edges → normal Dijkstra',
        'You want to maximise the minimum capacity — same idea but with a max-heap (widest path)',
      ],
      template: `// Dijkstra where a path's cost is the max edge on it
function minimaxPath(n, adj, src, dst) {
  const best = new Array(n).fill(Infinity);
  best[src] = 0;
  const heap = new MinHeap((e) => e[0]);
  heap.push([0, src]);
  while (!heap.isEmpty()) {
    const [d, u] = heap.pop();
    if (u === dst) return d;
    if (d > best[u]) continue;
    for (const [v, w] of adj[u]) {
      const nd = Math.max(d, w);              // bottleneck instead of sum
      if (nd < best[v]) { best[v] = nd; heap.push([nd, v]); }
    }
  }
  return -1;
}`,
      variations: [
        { name: 'Binary search + BFS', description: 'Guess the limit X; BFS using only edges ≤ X; smallest X that reaches the target.' },
        { name: 'Union-Find by sorted edges', description: 'Add edges from cheapest to most expensive; the answer is the edge that first connects source and target (Kruskal-style — see the MST topic).' },
      ],
      mistakes: [
        'Summing edge costs instead of taking the max',
        'Starting from 0 when the start cell itself has a cost (swim in rising water starts at grid[0][0])',
        'Returning when a node is pushed instead of popped',
      ],
      evolution: {
        easy: 'Minimax on a small grid.',
        medium: 'Path With Minimum Effort.',
        hard: 'Swim in Rising Water (node weights), widest path, combined constraints.',
      },
    },
    {
      id: 'shortest-path-state-bfs',
      name: 'Shortest Path — State-Augmented BFS',
      summary: 'When where you are is not enough to describe the situation, make the node a tuple (row, col, extra) and run BFS/Dijkstra on that bigger graph.',
      whyItExists: 'In "you may remove up to k obstacles", reaching cell (r, c) with 3 removals left is a different situation from reaching it with 0 left. Treating them as one node would wrongly prune paths. Adding the extra resource to the state makes the problem a plain BFS again, at the cost of a bigger graph (rows × cols × (k + 1)).',
      whenToUse: [
        'A limited resource: obstacles you may break, keys held, fuel, stops left',
        'The same position may be worth revisiting with a different resource level',
      ],
      clues: ['"you can eliminate at most k obstacles"', '"collect all keys"', '"with at most k stops"', 'bitmask of visited things'],
      whenNotToUse: [
        'The extra state space is huge (e.g. k up to 10^9) — look for a smarter invariant',
        'The resource does not affect future moves — then it is just a cost',
      ],
      template: `function bfsWithState(grid, k) {
  const R = grid.length, C = grid[0].length;
  // seen[r][c] = most eliminations left we ever had at (r, c)
  const seen = Array.from({ length: R }, () => new Array(C).fill(-1));
  let frontier = [[0, 0, k]];
  seen[0][0] = k;
  for (let steps = 0; frontier.length; steps++) {
    const next = [];
    for (const [r, c, left] of frontier) {
      if (r === R - 1 && c === C - 1) return steps;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        const nl = left - grid[nr][nc];
        if (nl < 0 || nl <= seen[nr][nc]) continue;  // dominated state
        seen[nr][nc] = nl;
        next.push([nr, nc, nl]);
      }
    }
    frontier = next;
  }
  return -1;
}`,
      variations: [
        { name: 'Keys bitmask', description: 'State = (r, c, mask of keys collected).' },
        { name: 'Stops left', description: 'State = (city, stops used) — another view of Cheapest Flights.' },
        { name: 'Visited-set bitmask', description: 'State = (node, mask of visited nodes) — shortest path visiting all nodes.' },
      ],
      mistakes: [
        'Visited array indexed only by (r, c) — prunes valid paths that arrive with more resources',
        'Forgetting the shortcut: if k ≥ R + C − 3 you can walk straight through, answer = R + C − 2',
        'Blowing up memory with string keys like `${r},${c},${k}` — use numeric encodings or typed arrays',
      ],
      evolution: {
        easy: 'Position + one small counter.',
        medium: 'Obstacle elimination with k.',
        hard: 'Bitmask states (keys, visited-all-nodes).',
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
            md: `A **shortest path** is the cheapest route between two nodes of a graph. "Cheapest" depends on the problem: fewest steps, least total time, lowest price, smallest worst-step.

\`\`\`text
        4
   A ───────► B
   │          ▲
 1 │          │ 1
   ▼          │
   C ───────► D
        2
\`\`\`

From A to B: the direct edge costs **4**, but A → C → D → B costs **1 + 2 + 1 = 4**… tie. Make A → B cost 5 and the three-edge route wins. *More edges can be cheaper* — that single fact is why "just count edges" (BFS) stops working once edges have weights.

There is no single "shortest path algorithm". There is a **family**, and the real skill is choosing the right member from the edge weights:

| Edge weights | Algorithm | Time |
|---|---|---|
| all equal (unweighted) | BFS | O(V + E) |
| only 0 or 1 | 0-1 BFS (deque) | O(V + E) |
| any non-negative | Dijkstra (min-heap) | O((V + E) log V) |
| negative allowed, or "at most k edges" | Bellman-Ford | O(V · E) |
| all pairs, small V | Floyd-Warshall | O(V³) |`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Weight / cost** \`w(u, v)\` — the price of using edge u → v.
- **Path cost** — usually the *sum* of its edge weights (sometimes the *max*, see minimax paths).
- **Single-source** — distances from one start node to every node. **All-pairs** — distances between every pair.
- **dist[v]** — the best cost to reach v found *so far* (a *tentative* distance). It starts at \`Infinity\`.
- **Relaxation** — checking whether going through u gives a cheaper way to v: \`if (dist[u] + w < dist[v]) dist[v] = dist[u] + w\`.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A GPS app does not try every road combination. It keeps a "best known time" for each junction and keeps improving it: "Oh, going via the ring road gets me to the station in 12 minutes instead of 15 — update." That "update if better" step is relaxation, and every algorithm in this topic is just a different *order* of doing it.',
          },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-1',
            question: 'Edges: A→B (10), A→C (1), C→B (2). What is the shortest distance A → B, and what does BFS (counting edges) report?',
            options: [
              'Shortest 10; BFS 1',
              'Shortest 3; BFS 2',
              'Shortest 3; BFS 1 — BFS picks the one-edge route and is wrong here',
              'Shortest 1; BFS 1',
            ],
            answer: 2,
            explanation: 'A → C → B costs 1 + 2 = 3, which beats the direct edge of 10. BFS only counts edges: the direct edge has 1 edge, so BFS would say "reach B in 1 step via the 10-cost edge". Fewest edges ≠ cheapest when weights differ.',
            misconceptions: {
              0: '10 is the cost of the direct edge, but A → C → B is cheaper (3).',
              1: 'BFS reaches B at level 1 (directly from A), not level 2. It does not look at weights at all.',
              3: '1 is the cost of A → C only; you still need C → B (2).',
            },
            deeper: 'BFS answers "fewest edges". That equals "cheapest" only when every edge has the same weight. The moment weights differ you need an algorithm that orders nodes by *cost*, not by *hops* — that is Dijkstra.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `The obvious brute force is "try every path". In a graph a node can be reached through exponentially many paths — a 20×20 grid already has more than **10^11** monotone paths from corner to corner. Exploring them all is hopeless.

Shortest-path algorithms work because of one structural fact:

> **Optimal substructure:** if the best route A → Z passes through M, then its A → M part is itself a best route to M.

(If a cheaper A → M existed, you could swap it in and get a cheaper A → Z — contradiction.) So we only need to remember **one number per node** — the best cost so far — instead of whole paths. That shrinks the problem from "all paths" to "V distances", and each algorithm is a smart schedule for improving those V numbers.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why remembering only **one best distance per node** is enough — why we never need the second-best way to reach a middle node?',
            deeper: `Suppose the best path to Z goes through M and uses some route R to reach M. If R were not the cheapest way to M, replace it by the cheapest way R*: the rest of the path (M → Z) is unchanged, so the total gets cheaper — contradicting "best path to Z". Therefore the prefix is always a best path to M, and a single \`dist[M]\` suffices.

**Careful:** this breaks when reaching M "cheaply" can hurt you later — e.g. "at most k stops" (the cheap route to M may use too many stops) or "at most k obstacles removed". Then one number per node is *not* enough and you must add the resource to the state: \`(node, stopsUsed)\`. That is exactly the state-augmented pattern later in this lesson.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Ask these questions **in order** — the first "yes" decides the algorithm:

1. **Do I need every pair, and is n small (≤ ~400)?** → Floyd-Warshall.
2. **Are there negative edges, or a limit on the number of edges ("at most k stops")?** → Bellman-Ford (k rounds).
3. **Are all edges the same weight?** → BFS.
4. **Are weights only 0 and 1?** → 0-1 BFS with a deque.
5. **Otherwise (non-negative weights)** → Dijkstra with a min-heap.

And two twists that keep the same algorithms:

- **Path cost is a max, not a sum** ("minimise the largest step") → Dijkstra with \`Math.max\` (minimax), or binary search on the answer + BFS.
- **A resource changes what you may do next** (obstacles you can break, keys) → put the resource in the node: BFS over \`(row, col, resource)\`.`,
          },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-2',
            question: 'Grid: moving into an empty cell is free, moving into a wall cell costs 1 (you break it). Minimise walls broken from top-left to bottom-right. Best choice?',
            options: [
              'Plain BFS counting steps',
              'Floyd-Warshall on all cells',
              'Bellman-Ford',
              '0-1 BFS: free moves go to the front of a deque, wall moves to the back',
            ],
            answer: 3,
            explanation: 'Every edge costs 0 or 1 — the textbook case for 0-1 BFS. It behaves exactly like Dijkstra but the deque keeps the frontier sorted in O(1), so it is O(cells).',
            misconceptions: {
              0: 'Plain BFS minimises the number of *steps*, not the number of walls. A long detour through empty cells may break zero walls.',
              1: 'Floyd-Warshall is O(V³) with V = rows × cols — for a 100×100 grid that is 10^12 operations. And we only need one source.',
              2: 'Bellman-Ford is correct but O(V·E) — far too slow and unnecessary with non-negative weights.',
            },
            deeper: 'Dijkstra would also be correct here (O(E log V)). 0-1 BFS is the optimisation you mention when you notice weights are only 0/1 — interviewers like hearing both.',
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['"minimum time / cost / effort to reach"', '"fewest steps"', '"cheapest price with at most k stops"', 'weighted edges [u, v, w]', '"number of ways to arrive in the shortest time"', '"minimise the maximum" along a path', '"remove at most k obstacles"'],
            conclusion: 'Think Shortest Path — then pick BFS / 0-1 BFS / Dijkstra / Bellman-Ford / Floyd-Warshall from the weights',
          },
          {
            type: 'text',
            md: `Shortest-path problems are often **disguised**. The graph might be:

- a **grid** (cells = nodes, moves = edges),
- a **word list** (words = nodes, one-letter changes = edges),
- a **state space** (node = (cell, keys held), edges = legal moves).

Once you can say *"what is a node, what is an edge, what does an edge cost?"*, the choice of algorithm follows from the table.`,
          },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-3',
            question: '"n cities, flights [from, to, price]. Find the cheapest price from src to dst using at most k stops." Why is plain Dijkstra (one dist per city) risky?',
            options: [
              'Prices can be negative',
              'The cheapest way to reach an intermediate city may use too many stops, and Dijkstra would discard a slightly pricier route that has fewer stops',
              'The graph is undirected',
              'Dijkstra cannot handle more than 100 nodes',
            ],
            answer: 1,
            explanation: 'Optimal substructure breaks: the best *price* to city M might use 4 stops, while a pricier route to M with 1 stop is the only one that still reaches dst within k. One number per node loses that route. Bellman-Ford with exactly k + 1 rounds (or Dijkstra/BFS over (city, stops)) respects the limit.',
            misconceptions: {
              0: 'Prices are positive in this problem. The trouble is the stop limit, not the sign.',
              2: 'Flights are directed, and direction does not matter for this issue anyway.',
              3: 'Dijkstra handles millions of nodes. The issue is correctness under the stop limit, not size.',
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
            md: `Every algorithm here repeats the same move — **relax an edge**:

\`\`\`js
if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
\`\`\`

"If going to u and then taking edge u → v is cheaper than what I knew for v, update v." Distances only ever go **down**, and they never go below the true shortest distance (each value is the cost of a real path). So if we relax *enough edges in a good order*, every \`dist\` settles on the truth.

The algorithms only differ in **which edge to relax next**:

- **BFS** — relax in order of hop count (a queue).
- **Dijkstra** — always relax from the closest unfinished node (a min-heap).
- **0-1 BFS** — like Dijkstra, but a deque is enough to keep the order.
- **Bellman-Ford** — relax *every* edge, V − 1 times, no clever order.
- **Floyd-Warshall** — relax through each possible "stop-over" node k, for all pairs.`,
          },
          {
            type: 'visual',
            scenario: 'dijkstra',
            input: { n: 5, edges: [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5], [3, 4, 3]], start: 0 },
            caption: 'Dijkstra from node 0: the heap always hands out the closest unfinished node. Watch dist[1] drop from 4 to 3 when node 2 relaxes its edge.',
          },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-4',
            question: 'Why is it safe for Dijkstra to declare the node it pops from the heap as **final** (weights are non-negative)?',
            options: [
              'Because the heap is sorted',
              'Because every other path to it must leave the "finished" region through some frontier node that is already at least as far, and non-negative edges can only add cost from there',
              'Because each node is pushed only once',
              'Because BFS has already visited it',
            ],
            answer: 1,
            explanation: 'Let u be the popped node with distance d (the smallest in the heap). Any other route to u must at some point step from a finished node to an unfinished frontier node x, whose tentative distance is ≥ d (u was the minimum). From x to u the remaining edges are ≥ 0, so that route costs ≥ d. Nothing can beat d → final.',
            misconceptions: {
              0: 'A sorted heap is how we *find* the minimum, but the reason the minimum is *final* is the non-negative weights. With a negative edge the same heap gives wrong answers.',
              2: 'With lazy deletion a node can be pushed many times. Finality comes from the greedy argument, not from push counts.',
              3: 'Dijkstra does not run BFS first; it replaces BFS for weighted graphs.',
            },
            deeper: 'This proof has exactly one step that needs w ≥ 0: "from x to u costs ≥ 0 more". Remember that — it is the exact reason negative edges break Dijkstra (see the next section).',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Take **Network Delay Time**: n nodes, directed weighted edges, a signal starts at node k — how long until every node hears it? (= the largest shortest distance from k). The most naive correct idea: DFS every simple path from k and keep the minimum cost per node.',
          },
          {
            type: 'code',
            title: 'Brute force — explore every path (exponential)',
            code: `function networkDelayTime(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);
  const dist = new Array(n + 1).fill(Infinity);

  function dfs(u, cost) {
    if (cost >= dist[u]) return;      // pruning: already reached u cheaper
    dist[u] = cost;
    for (const [v, w] of adj[u]) dfs(v, cost + w);
  }
  dfs(k, 0);

  let ans = 0;
  for (let v = 1; v <= n; v++) ans = Math.max(ans, dist[v]);
  return ans === Infinity ? -1 : ans;
}`,
            caption: 'Correct, and the pruning helps, but in bad orders a node gets improved again and again — the worst case is exponential.',
          },
          {
            type: 'text',
            md: `A middle step is **Bellman-Ford**: forget clever orders, just relax *every* edge in a loop V − 1 times. After round i, all shortest paths with ≤ i edges are correct (proof by induction on i). O(V·E) — polynomial, and it even tolerates negative edges. It is the brute force Dijkstra improves on: instead of relaxing everything V times, relax each node's edges **once**, at the moment it becomes final.`,
          },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-5',
            question: 'Bellman-Ford runs V − 1 rounds. Why exactly V − 1?',
            options: [
              'Because a shortest path without cycles visits at most V nodes, so it has at most V − 1 edges, and each round fixes at least one more edge of it',
              'Because the heap has V − 1 elements',
              'It is arbitrary; V rounds would be the same',
              'Because each round finalises one node, like Dijkstra',
            ],
            answer: 0,
            explanation: 'Induction: after round i, every node whose shortest path uses ≤ i edges has the right distance (round i + 1 relaxes the last edge of any (i+1)-edge path). Shortest simple paths have ≤ V − 1 edges → V − 1 rounds. A V-th round that still improves something proves a negative cycle.',
            misconceptions: {
              1: 'Bellman-Ford has no heap at all — it relaxes the full edge list each round.',
              2: 'V − 1 is the tight bound for correctness; the extra V-th round is useful only for detecting negative cycles.',
              3: 'Bellman-Ford does not finalise a specific node per round; it guarantees correctness for all paths up to a given edge count.',
            },
          },
        ],
      },
      {
        id: 'optimized-bfs',
        title: 'Optimized approach — BFS and 0-1 BFS',
        blocks: [
          {
            type: 'text',
            md: `**Unweighted (all edges cost 1):** plain BFS already processes nodes in order of distance — the queue holds distance-d nodes followed by distance-(d+1) nodes and nothing else. So the first time BFS *discovers* a node, that is its shortest distance. Mark visited **when you enqueue**.

**Multi-source BFS** puts several starting nodes in the first frontier at distance 0 — e.g. "distance from the nearest exit", or Shortest Bridge where every cell of the first island is a source.`,
          },
          { type: 'visual', scenario: 'zero-one-bfs', caption: "0-weight edges go to the front of the deque, 1-weight edges to the back." },
          {
            type: 'visual',
            scenario: 'grid-bfs',
            input: { grid: [[2, 1, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 1, 1]] },
            caption: 'BFS expands in rings from the source: ring number = distance, because every step costs the same.',
          },
          {
            type: 'text',
            md: `**0-1 BFS (weights 0 or 1):** Dijkstra's heap only ever contains two distinct distances at a time: the current \`d\` and \`d + 1\`. A **deque** keeps that order for free:

- edge of weight **0** → neighbour has the *same* distance → \`pushFront\` (it should be processed next),
- edge of weight **1** → neighbour is one further → \`pushBack\`.

The deque stays sorted, so popping the front always gives the smallest distance — Dijkstra's invariant — with O(1) operations instead of O(log V).`,
          },
          {
            type: 'code',
            title: '0-1 BFS on a grid (cost 1 to enter an obstacle)',
            code: `function minObstacles(grid) {
  const R = grid.length, C = grid[0].length;
  const dist = Array.from({ length: R }, () => new Array(C).fill(Infinity));
  dist[0][0] = 0;
  const dq = new Deque();
  dq.pushBack([0, 0]);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (!dq.isEmpty()) {
    const [r, c] = dq.popFront();
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      const w = grid[nr][nc];                 // 0 = free, 1 = obstacle
      if (dist[r][c] + w < dist[nr][nc]) {
        dist[nr][nc] = dist[r][c] + w;
        if (w === 0) dq.pushFront([nr, nc]); else dq.pushBack([nr, nc]);
      }
    }
  }
  return dist[R - 1][C - 1];
}`,
          },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-6',
            question: 'In 0-1 BFS, you pop node u (dist 3) and find neighbour v through a weight-0 edge. Where does v go and why?',
            options: [
              'To the back — every new node goes to the back of a queue',
              'Nowhere — v is marked visited as soon as it is seen',
              'To the front — v has distance 3, the same as the smallest in the deque, so it must be processed before the distance-4 nodes',
              'To a separate heap',
            ],
            answer: 2,
            explanation: 'dist[v] = 3 + 0 = 3. The deque currently holds some 3s at the front and 4s at the back. Putting v at the front keeps the deque sorted by distance, which is the invariant that makes the popped node final.',
            misconceptions: {
              0: 'If v (distance 3) went behind the distance-4 nodes, a 4 could be popped and finalised first — the order breaks and answers can be wrong or require re-processing.',
              1: 'In 0-1 BFS a node can be improved later by a 0-edge; you relax on "strictly smaller distance" instead of marking on first sight.',
              3: 'The whole point is that with 0/1 weights the deque replaces the heap.',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: "Optimized approach — Dijkstra's algorithm",
        blocks: [
          {
            type: 'steps',
            title: 'Dijkstra with a min-heap (lazy deletion)',
            steps: [
              'Build an adjacency list `adj[u] = [[v, w], …]`. Set `dist[src] = 0`, every other `dist = Infinity`.',
              'Push `[0, src]` into a min-heap ordered by distance.',
              'Pop the smallest `[d, u]`. If `d > dist[u]`, this entry is **stale** (u was improved after it was pushed) — skip it.',
              'Otherwise u is final. For each edge `u → v` with weight w: if `d + w < dist[v]`, set `dist[v] = d + w` and push `[dist[v], v]`.',
              'Repeat until the heap is empty (or until the target is popped, if you only need one distance).',
            ],
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Lazy deletion',
            md: 'A binary heap cannot cheaply "decrease the key" of an entry already inside it. Instead we just **push a new, better entry** and leave the old one in the heap. When the old one surfaces later, `d > dist[u]` tells us it is out of date and we skip it. The heap can hold up to E entries, so the cost is O(E log E) = O(E log V) (since E ≤ V², log E ≤ 2 log V).',
          },
          {
            type: 'text',
            md: `### Why Dijkstra fails with negative edges

\`\`\`text
A ──2──► B
│        ▲
5        │ -4
▼        │
C ───────┘
\`\`\`

From A: the heap pops A (0), then B (2) — **B is declared final at 2**. Later C (5) is popped and relaxes C → B: 5 + (−4) = 1 < 2. The "final" value was wrong, and anything already computed from B is wrong too.

The greedy proof said "any other path must go through a frontier node that is already ≥ d, and the rest of the path adds ≥ 0". With a −4 edge the rest of the path can **subtract** — the proof collapses. That is why negative weights → Bellman-Ford.`,
          },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-7',
            question: 'Dijkstra pops `[7, u]`, but `dist[u]` is already 5. What should happen?',
            options: [
              'Relax u\'s edges again using 7',
              'Set dist[u] = 7',
              'Throw an error — the heap is corrupted',
              'Skip it: it is a stale entry pushed before u was improved to 5, and u\'s edges were already relaxed with 5',
            ],
            answer: 3,
            explanation: 'Lazy deletion leaves outdated entries in the heap. When one surfaces, `d > dist[u]` identifies it. Relaxing with 7 cannot improve anything (the 5-version already did better) and only wastes time — in path-counting problems it would even double-count.',
            misconceptions: {
              0: 'Relaxing with a worse distance never produces an improvement; it just burns time (and breaks counting problems).',
              1: 'Distances only ever decrease. Raising dist[u] to 7 would destroy a correct, better answer.',
              2: 'Stale entries are expected and normal with lazy deletion — the heap is fine.',
            },
          },
          {
            type: 'text',
            md: `**Other path costs that still work with Dijkstra.** The greedy proof only needs "extending a path never makes it better". That also holds for:

- **Max of edges** (minimax / bottleneck): extending can only keep or raise the max → relax with \`Math.max(d, w)\`.
- **Product of probabilities in [0, 1]**: extending can only keep or lower the product → use a **max**-heap and maximise.

**Counting shortest paths.** Keep \`ways[v]\`. When \`d + w < dist[v]\` (strictly better), \`ways[v] = ways[u]\`; when \`d + w === dist[v]\` (a tie), \`ways[v] += ways[u]\`. Because nodes are finalised in distance order, \`ways[u]\` is complete before u relaxes its edges — *provided you skip stale entries*.`,
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Dijkstra — single source, non-negative weights',
            code: `function dijkstra(n, edges, src) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);   // add adj[v].push([u, w]) if undirected

  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const heap = new MinHeap((e) => e[0]);                // [distance, node]
  heap.push([0, src]);

  while (!heap.isEmpty()) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;                          // stale
    for (const [v, w] of adj[u]) {
      const nd = d + w;                                 // swap for Math.max(d, w) in minimax problems
      if (nd < dist[v]) {
        dist[v] = nd;
        heap.push([nd, v]);
      }
    }
  }
  return dist;
}`,
          },
          {
            type: 'code',
            title: 'Bellman-Ford — at most k edges',
            code: `function cheapestWithinEdges(n, edges, src, dst, maxEdges) {
  let dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let i = 0; i < maxEdges; i++) {
    const next = dist.slice();                 // copy: this round reads only last round
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < next[v]) next[v] = dist[u] + w;
    }
    dist = next;
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Grids as graphs',
            md: 'For grids, do not build an adjacency list — generate neighbours on the fly with a `DIRS = [[1,0],[-1,0],[0,1],[0,-1]]` array. Store distances in a 2-D array (or a flat array indexed by `r * C + c`) and push `[d, r, c]` into the heap.',
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Network Delay Time — Dijkstra with the toolkit MinHeap',
            code: `function networkDelayTime(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);   // nodes are 1..n
  for (const [u, v, w] of times) adj[u].push([v, w]);

  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const heap = new MinHeap((e) => e[0]);
  heap.push([0, k]);
  let finalized = 0, latest = 0;

  while (!heap.isEmpty()) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;         // stale entry
    finalized++;
    latest = d;                        // pops come out in non-decreasing order
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        heap.push([dist[v], v]);
      }
    }
  }
  return finalized === n ? latest : -1;
}`,
            caption: 'Because pops come out in increasing distance, the last finalised node is the farthest one — no final scan needed.',
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript pitfalls',
            md: `- \`new Array(n).fill([])\` puts the **same** array in every slot — every node would share one neighbour list. Use \`Array.from({ length: n }, () => [])\`.
- There is no built-in priority queue in JavaScript. Use the toolkit \`MinHeap\` (in interviews, say "assume a MinHeap class" or write a 30-line one). Sorting an array every iteration is O(V² log V).
- \`Infinity + 5\` is still \`Infinity\`, so relaxing from an unreached node is harmless — but if you use a sentinel like \`1e9\`, guard it.
- Heap entries as small arrays \`[d, u]\` are fine; destructure them on pop.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'Dijkstra from 0 — edges 0→1 (4), 0→2 (1), 2→1 (2), 1→3 (1), 2→3 (5), 3→4 (3)',
            columns: ['pop', 'stale?', 'relaxations', 'dist [0,1,2,3,4]', 'heap after'],
            rows: [
              ['[0, 0]', 'no', '1 → 4, 2 → 1', '[0, 4, 1, ∞, ∞]', '[1,2] [4,1]'],
              ['[1, 2]', 'no', '1: 1+2=3 < 4 ✓, 3: 1+5=6 ✓', '[0, 3, 1, 6, ∞]', '[3,1] [4,1] [6,3]'],
              ['[3, 1]', 'no', '3: 3+1=4 < 6 ✓', '[0, 3, 1, 4, ∞]', '[4,1] [4,3] [6,3]'],
              ['[4, 1]', 'yes (4 > 3)', 'skip', 'unchanged', '[4,3] [6,3]'],
              ['[4, 3]', 'no', '4: 4+3=7 ✓', '[0, 3, 1, 4, 7]', '[6,3] [7,4]'],
              ['[6, 3]', 'yes (6 > 4)', 'skip', 'unchanged', '[7,4]'],
              ['[7, 4]', 'no', 'no edges', '[0, 3, 1, 4, 7]', 'empty'],
            ],
            note: 'Two stale entries were skipped. Each node was finalised exactly once, in distance order 0, 1, 3, 4, 7.',
          },
        ],
      },
      {
        id: 'optimized-bellman-ford',
        title: 'Optimized approach — Bellman-Ford with an edge limit',
        blocks: [
          {
            type: 'text',
            md: `Bellman-Ford's rounds have a precise meaning: **after round i, \`dist[v]\` is the cheapest cost using at most i edges.** That is exactly what "at most k stops" asks for (k stops = k + 1 flights = k + 1 edges).

But the meaning only holds if round i reads distances **from round i − 1**. If you update \`dist\` in place, an edge relaxed early in the round can feed another edge later in the *same* round — two flights sneak into one round.

\`\`\`text
edges (in this order): 0→1 (100), 1→2 (100), 0→2 (500), k = 0 stops (1 flight)

in place : 0→1 sets dist[1]=100, then 1→2 uses it: dist[2]=200   ✗ (2 flights!)
with copy: next[1]=100, 1→2 reads OLD dist[1]=∞, next[2]=500       ✓
\`\`\``,
          },
          { type: 'visual', scenario: 'bellman-ford', caption: "Relax every edge V−1 times; one more improving round means a negative cycle." },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-8',
            question: 'Why does the k-stops version of Bellman-Ford copy `dist` into `next` at the start of every round?',
            options: [
              'To save memory',
              'Because JavaScript arrays cannot be modified while being iterated',
              'So each round extends paths by exactly one edge: relaxations in round i read only round i − 1 values, keeping "≤ i edges" true',
              'It is only needed for negative weights',
            ],
            answer: 2,
            explanation: 'Without the copy, a value written earlier in the same round can be read later in that round, letting a path gain several edges per round. The final answer may then use more than k + 1 flights.',
            misconceptions: {
              0: 'The copy *costs* O(n) memory per round; it exists for correctness.',
              1: 'We iterate the edge list, not dist, and JS arrays can be modified during iteration anyway.',
              3: 'Negative weights are fine with in-place updates when there is no edge limit. The copy is about the edge-count limit.',
            },
          },
        ],
      },
      {
        id: 'optimized-floyd-warshall',
        title: 'Optimized approach — Floyd-Warshall (all pairs)',
        blocks: [
          {
            type: 'text',
            md: `When a problem asks about **every pair** and n is small, Floyd-Warshall is the simplest tool:

\`\`\`js
for (let k = 0; k < n; k++)
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
\`\`\`

**Why it works (DP):** after the outer loop has processed k = 0..m, \`d[i][j]\` is the shortest i → j path whose *intermediate* nodes all come from {0..m}. Adding node m + 1 as an allowed stop-over: the best path either avoids it (keep \`d[i][j]\`) or goes through it once (\`d[i][m+1] + d[m+1][j]\`, both halves only using {0..m}). That is why **k must be the outermost loop**.

Cost: O(n³) time, O(n²) space — 10^6 operations at n = 100, fine; 10^12 at n = 10^4, hopeless (run Dijkstra from each source instead, O(n · E log n)).`,
          },
          { type: 'visual', scenario: 'floyd-warshall', caption: "For each middle node k, check whether going through k shortens i → j." },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-9',
            question: 'A teammate writes Floyd-Warshall with loop order `i, j, k` (k innermost). What happens?',
            options: [
              'Same result, just slower',
              'Some d[i][j] are finalised before the shorter halves d[i][k], d[k][j] are known, so answers can be too large',
              'It throws an error on negative weights',
              'It becomes O(n⁴)',
            ],
            answer: 1,
            explanation: 'With k innermost, d[i][j] is computed once using whatever d[i][k] and d[k][j] happen to be at that moment — often still Infinity for pairs visited later. The DP needs "all pairs using stop-overs {0..k−1}" to be complete before stop-over k is considered.',
            misconceptions: {
              0: 'The complexity is the same O(n³), but correctness breaks — it is not just slower.',
              2: 'Loop order does not create errors; it silently produces wrong numbers.',
              3: 'Still three loops of n → O(n³).',
            },
          },
        ],
      },
      {
        id: 'optimized-minimax',
        title: 'Optimized approach — minimax (bottleneck) paths',
        blocks: [
          {
            type: 'text',
            md: `In **Path With Minimum Effort** the cost of a route is the *largest* height difference between consecutive cells, and you want the route whose largest step is smallest. Two standard solutions:

**1. Dijkstra with max.** A path's value is \`max(edges)\`. Extending a path never lowers its max, so the greedy "pop the smallest, it is final" argument still holds. Relax with \`nd = Math.max(d, w)\`.

**2. Binary search on the answer + BFS.** Guess a limit X. Can you reach the target using only steps ≤ X? That is a plain BFS/DFS. The answer is *monotone*: if X works, every larger X works. Binary search the smallest working X over [0, maxHeight]. O(RC · log H).

**Swim in Rising Water** is the same idea with *node* weights: at time t you can stand on cells with height ≤ t; the answer is the minimum over paths of the maximum cell height on the path (including the start cell).`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why Dijkstra still works when the path cost is a **max** instead of a sum — and what property both share?',
            deeper: `Dijkstra's proof needs one thing: **extending a path can never make it cheaper** (monotonicity). For sums, that is "w ≥ 0". For max, \`max(d, w) ≥ d\` always — so it holds for *any* weights. For probability products with p ∈ [0, 1], \`d · p ≤ d\` — the path can only get *less* likely, so maximising with a max-heap works.

Counter-example: a path cost of "sum with negative edges" is not monotone, so Dijkstra fails. Whenever you invent a new path cost, check monotonicity before trusting Dijkstra.`,
          },
        ],
      },
      {
        id: 'optimized-state-bfs',
        title: 'Optimized approach — state-augmented BFS',
        blocks: [
          {
            type: 'text',
            md: `**Shortest Path in a Grid with Obstacles Elimination:** you may walk through at most k obstacle cells. Standing on (r, c) with 3 eliminations left is *better* than standing there with 0 left — it keeps more future paths open. So a visited set on (r, c) alone is wrong: it would throw away a slower-arriving but richer state that is the only one able to finish.

Fix: the node becomes \`(r, c, remaining)\`. Moves cost 1 → plain BFS on this bigger graph, at most R · C · (k + 1) states.

A neat pruning: for each cell remember the **most** eliminations left you have ever had there. A new arrival with fewer or equal remaining at a *later or equal* BFS level is dominated — skip it. (BFS levels only grow, so a later arrival with less resource is never better.)

Also: if \`k ≥ R + C − 3\` you can bulldoze a straight L-shaped path, so the answer is immediately \`R + C − 2\`.`,
          },
          {
            type: 'checkpoint',
            id: 'shortest-path-cp-10',
            question: 'BFS with obstacle elimination reaches cell X first at step 5 with 0 eliminations left, and later at step 7 with 2 left. Should the second arrival be expanded?',
            options: [
              'No — X was already visited, and BFS guarantees the first visit is best',
              'Yes — (X, 2 left) is a different state; it may reach the goal where (X, 0 left) is blocked by an obstacle',
              'No — more steps is always worse',
              'Only if k is even',
            ],
            answer: 1,
            explanation: 'The first-visit rule holds per *state*, not per cell. (X, 0) and (X, 2) are different nodes. If the only route to the goal from X goes through an obstacle, only the second state can finish, and the answer might go through it.',
            misconceptions: {
              0: 'BFS guarantees the first visit of a *node* is shortest — but here the node is (cell, remaining), so this is a new node.',
              2: 'More steps so far, but it is the only state that can pass the next obstacle; a finished path beats an impossible one.',
              3: 'Parity of k is irrelevant.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why **counting** shortest paths (Number of Ways to Arrive) needs the stale-entry check to be correct, not just fast?',
            deeper: `When u is popped, we add \`ways[u]\` to each neighbour on a tie. If a stale copy of u were processed again, we would add \`ways[u]\` to the neighbours a **second time** — double-counting. Worse, if u were processed before all its shortest predecessors were finalised, \`ways[u]\` would be incomplete.

Dijkstra's order guarantees every predecessor of u on a shortest path has a strictly smaller distance (weights ≥ 1 in that problem) and is popped earlier, so \`ways[u]\` is final when u is popped. The \`d > dist[u]\` skip guarantees u contributes exactly once.`,
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Picking the wrong algorithm** — BFS on weighted edges, Dijkstra on negative edges or with a k-edge limit.
2. **No stale-entry check** in Dijkstra — slower, and wrong in path-counting problems.
3. **Marking visited at push time in Dijkstra / 0-1 BFS** — a node can still be improved later. (In plain BFS, marking at push time is *correct* and important.)
4. **Bellman-Ford without a copy** when the edge count is limited.
5. **Off-by-one on stops** — k stops = k + 1 edges.
6. **\`fill([])\` for adjacency lists** — all nodes share one array.
7. **Forgetting both directions** for undirected edges.
8. **1-indexed nodes** (Network Delay Time) — allocate n + 1 slots.
9. **Using \`queue.shift()\`** in big BFS — O(n) per call; use a head index, level arrays, or the toolkit \`Queue\`/\`Deque\`.
10. **Modulo on comparisons** — in counting problems take \`% MOD\` on the *count*, never on the distance.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'BFS / 0-1 BFS O(V + E) · Dijkstra O((V + E) log V) · Bellman-Ford O(V·E) (O(k·E) with k rounds) · Floyd-Warshall O(V³)',
            space: 'O(V + E) for adjacency + distances (Floyd-Warshall O(V²))',
            md: `- **BFS:** each node enqueued once, each edge looked at once (twice if undirected).
- **0-1 BFS:** a node can be pushed a small constant number of times (once per improvement, and improvements go 1 → 0 at most per level), so O(V + E).
- **Dijkstra (lazy):** up to E pushes and pops, each O(log E) = O(log V).
- **Bellman-Ford:** V − 1 (or k) rounds × E edges.
- **Floyd-Warshall:** n³ relaxations.
- **State BFS:** multiply V by the number of extra states (e.g. R·C·(k + 1)).`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the decision out loud:** "Weights are non-negative and differ, single source → Dijkstra, O(E log V)." Interviewers grade the choice as much as the code.
- **Define the graph first:** what is a node, what is an edge, what does an edge cost? For grids and state spaces this is half the solution.
- **Mention lazy deletion** when writing Dijkstra — it shows you know why the stale check exists.
- **Know the negative-edge counter-example** (A→B 2, A→C 5, C→B −4) — it is a common follow-up.
- **Constraint hints:** n ≤ 100 → Floyd-Warshall is fine; "at most k stops" → Bellman-Ford rounds; weights 0/1 → 0-1 BFS.
- **Edge cases:** unreachable nodes (return −1), source = target, parallel edges, self-loops, 1-indexed nodes.`,
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
              { api: 'new MinHeap((e) => e[0])', use: 'Dijkstra frontier of [distance, node, …] entries', complexity: 'push/pop O(log n)' },
              { api: 'new MaxHeap((e) => e[0])', use: 'Maximum-probability paths', complexity: 'push/pop O(log n)' },
              { api: 'new Deque()', use: '0-1 BFS: pushFront / pushBack / popFront', complexity: 'O(1)' },
              { api: 'Array.from({ length: n }, () => [])', use: 'Adjacency list with independent arrays', complexity: 'O(n)' },
              { api: 'new Array(n).fill(Infinity)', use: 'Initial distances', complexity: 'O(n)' },
              { api: 'dist.slice()', use: 'Previous-round copy in Bellman-Ford', complexity: 'O(n)' },
              { api: 'r * C + c', use: 'Encode a grid cell as a single number', complexity: 'O(1)' },
              { api: '(a + b) % 1_000_000_007', use: 'Counting paths modulo 1e9+7 (numeric separators are valid JS)', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Minimum cost/time/steps between nodes', 'Grids and state spaces with move costs', 'Counting shortest routes', 'Minimise the worst step on a path'],
    clues: ['"minimum time to reach"', '"fewest steps"', '"at most k stops"', 'weighted edges', '"minimum effort"', '"number of ways in the shortest time"', '"remove at most k obstacles"'],
    template: `const dist = new Array(n).fill(Infinity); dist[src] = 0;
const heap = new MinHeap((e) => e[0]); heap.push([0, src]);
while (!heap.isEmpty()) {
  const [d, u] = heap.pop();
  if (d > dist[u]) continue;            // stale
  for (const [v, w] of adj[u])
    if (d + w < dist[v]) { dist[v] = d + w; heap.push([dist[v], v]); }
}`,
    complexity: 'BFS O(V+E) · 0-1 BFS O(V+E) · Dijkstra O(E log V) · Bellman-Ford O(V·E) · Floyd-Warshall O(V³)',
    mistakes: ['BFS on weighted graphs', 'Dijkstra with negative edges or a k-edge limit', 'no stale-entry check', 'Bellman-Ford without copying the previous round', 'k stops = k + 1 edges', 'fill([]) adjacency'],
    jsTools: ['MinHeap', 'MaxHeap', 'Deque', 'Array.from', 'fill(Infinity)', 'slice'],
  },

  keyConcepts: [
    'Pick the algorithm from the weights: equal → BFS; 0/1 → 0-1 BFS; non-negative → Dijkstra; negative or k-edge limit → Bellman-Ford; all pairs small n → Floyd-Warshall.',
    'Relaxation: if dist[u] + w < dist[v], improve dist[v]. Every algorithm is an order of relaxations.',
    'Dijkstra is correct because, with non-negative weights, the closest frontier node cannot be improved later.',
    'Lazy deletion: push improved entries and skip stale ones (d > dist[u]) when popped.',
    'Bellman-Ford round i = paths with at most i edges; copy the previous round when the edge count is limited.',
    'Floyd-Warshall is DP over allowed stop-over nodes; k must be the outer loop.',
    'Minimax paths: Dijkstra with max instead of +, or binary search + BFS.',
    'If a resource affects future moves, put it in the state: BFS over (cell, resource).',
  ],

  interviewTips: [
    'State node / edge / cost first, then name the algorithm and why.',
    'Explain why Dijkstra fails with negative edges using a 3-node example.',
    'Mention lazy deletion and the stale-entry check.',
    'Watch for "at most k" — it invalidates one-distance-per-node thinking.',
  ],
};
