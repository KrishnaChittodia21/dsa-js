export default {
  id: 'critical-connections-in-a-network',
  title: 'Critical Connections in a Network',
  difficulty: 'Hard',
  order: 1,
  pattern: 'adv-graph-lowlink-bridges',
  tags: ['graph', 'dfs', 'bridges', 'low-link'],
  source: { platform: 'LeetCode', number: 1192, url: 'https://leetcode.com/problems/critical-connections-in-a-network/' },

  statement: `There are \`n\` servers numbered \`0 … n-1\` joined by **undirected** cables \`connections[i] = [a, b]\`. The network is connected: any server can reach any other.

A cable is **critical** if removing it leaves some server unable to reach some other server.

Return every critical cable, in any order (each as \`[a, b]\` in any order).`,
  examples: [
    { input: 'n = 4, connections = [[0,1],[1,2],[2,0],[1,3]]', output: '[[1,3]]', explanation: 'The triangle 0-1-2 survives any single cut; 1-3 is the only link to server 3.' },
    { input: 'n = 2, connections = [[0,1]]', output: '[[0,1]]' },
  ],
  constraints: ['2 <= n <= 10^5', 'n - 1 <= connections.length <= 10^5', 'No self-loops or repeated connections', 'The graph is connected'],

  think: `- Which edges can never be critical? (Think about cycles.)
- In a DFS tree, what does it mean for a child's subtree if it can reach an ancestor of its parent through a back edge?
- n can be 10^5 and the graph can be a long path. Is recursion safe in JavaScript?`,
  patternChallenge: {
    options: ['Kruskal / MST', 'Low-link DFS — bridges', 'Dijkstra', 'Kosaraju SCC'],
    answer: 1,
    explanation: 'A critical connection is precisely a **bridge** of an undirected graph: an edge on no cycle. The low-link DFS finds all bridges in O(V + E). MST and Dijkstra deal with weights; SCCs are for directed graphs.',
  },
  hints: [
    'Every non-tree edge in an undirected DFS goes to an ancestor. Track `low[u]` = smallest discovery time reachable from u\'s subtree with one back edge.',
    'Tree edge (p, c) is a bridge iff `low[c] > disc[p]`. Use an explicit stack so a 10^5-node path does not overflow the call stack.',
  ],
  approach: `**Brute force:** remove each edge and BFS to test connectivity — O(E·(V+E)) ≈ 10^10. Too slow.

**Low-link DFS:**
1. Adjacency list of \`[neighbour, edgeId]\`.
2. DFS; on discovery \`disc[u] = low[u] = time++\`.
3. Back edge to visited v (not the edge we came in on): \`low[u] = min(low[u], disc[v])\`.
4. When child c finishes and we return to p: \`low[p] = min(low[p], low[c])\`; if \`low[c] > disc[p]\`, (p, c) is a bridge.

**Iterative version (JS-safe):** frames \`[node, parentEdgeId, nextIndex]\`. "Calling" a child = pushing a frame. The code that normally runs after the recursive call (propagate low, test bridge) runs when the child frame is popped.`,

  functionName: 'criticalConnections',
  paramNames: ['n', 'connections'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} connections
 * @return {number[][]}
 */
function criticalConnections(n, connections) {
  
}
`,
  compare: 'nested-unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The triangle 0-1-2 survives any single cut; 1-3 is the only link to server 3.', args: [4, [[0, 1], [1, 2], [2, 0], [1, 3]]], expected: [[1, 3]] },
    { scenario: 'Example 2', hint: 'Two servers, one cable: it is critical.', args: [2, [[0, 1]]], expected: [[0, 1]] },
    { scenario: 'Triangle with a tail', hint: 'Both tail edges are bridges; the triangle edges are not.', args: [5, [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]]], expected: [[1, 3], [3, 4]] },
    { scenario: 'Single cycle', hint: 'Every edge lies on a cycle: no bridges. Using >= (the articulation test) wrongly marks edges here.', args: [3, [[0, 1], [1, 2], [2, 0]]], expected: [] },
    { scenario: 'Path', hint: 'A tree: every edge is a bridge.', args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], expected: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    { scenario: 'Two cycles joined by a bridge', hint: 'Only the link 1–3 between the triangles is critical.', args: [6, [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 5], [5, 3]]], expected: [[1, 3]] },
    { scenario: 'Two cycles joined twice', hint: 'Two links between the triangles form a cycle, so neither is critical.', args: [6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [0, 3], [1, 4]]], expected: [] },
    { scenario: 'Star with a cycle', hint: 'Leaves of the hub and the tail edge 5–6 are bridges; the triangle 3–4–5 is not.', args: [7, [[0, 1], [0, 2], [0, 3], [3, 4], [4, 5], [5, 3], [5, 6]]], expected: [[0, 1], [0, 2], [0, 3], [5, 6]] },
    { scenario: 'Edges listed in reverse', hint: 'Cable direction in the input does not matter; [b, a] is the same cable.', args: [4, [[1, 0], [2, 1], [0, 2], [3, 2]]], expected: [[3, 2]] },
    { scenario: 'Square with diagonal and tail', hint: 'The square with a diagonal is 2-edge-connected; only the tail 3–4 is critical.', args: [5, [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [3, 4]]], expected: [[3, 4]] },
    { scenario: 'Huge cycle with pendants (n = 10^5)', hint: 'A 99 990-node ring (a recursive DFS goes ~10^5 deep and overflows) plus 10 pendant servers: exactly the 10 pendant cables are critical. Deleting each cable and re-checking connectivity is O(E·(V+E)).', argsGen: '() => { const n = 100000, R = 99990; const e = []; for (let i = 0; i < R; i++) e.push([i, (i + 1) % R]); for (let j = 0; j < 10; j++) e.push([j * 9999, R + j]); return [n, e]; }', expected: [[0, 99990], [9999, 99991], [19998, 99992], [29997, 99993], [39996, 99994], [49995, 99995], [59994, 99996], [69993, 99997], [79992, 99998], [89991, 99999]], timeLimitMs: 1000 },
    { scenario: 'Long path (n = 10^5)', hint: 'A 10^5-server line: every cable is critical, and the DFS is 10^5 deep — use an explicit stack.', argsGen: '() => [100000, Array.from({ length: 99999 }, (_, i) => [i, i + 1])]', expectedGen: '() => Array.from({ length: 99999 }, (_, i) => [i, i + 1])', timeLimitMs: 1000 },
  ],

  solution: {
    code: `function criticalConnections(n, connections) {
  const adj = Array.from({ length: n }, () => []);
  connections.forEach(([a, b], id) => { adj[a].push([b, id]); adj[b].push([a, id]); });

  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const bridges = [];
  let time = 0;

  for (let s = 0; s < n; s++) {
    if (disc[s] !== -1) continue;
    disc[s] = low[s] = time++;
    const stack = [[s, -1, 0]];                   // [node, parentEdgeId, next neighbour index]
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const u = frame[0];
      if (frame[2] < adj[u].length) {
        const [v, id] = adj[u][frame[2]++];
        if (id === frame[1]) continue;            // the cable we arrived through
        if (disc[v] === -1) {                     // tree edge: "recurse"
          disc[v] = low[v] = time++;
          stack.push([v, id, 0]);
        } else {                                  // back edge to an ancestor
          low[u] = Math.min(low[u], disc[v]);
        }
      } else {                                    // u is finished: "return" to parent
        stack.pop();
        if (stack.length) {
          const p = stack[stack.length - 1][0];
          low[p] = Math.min(low[p], low[u]);
          if (low[u] > disc[p]) bridges.push([p, u]);
        }
      }
    }
  }
  return bridges;
}`,
    explanation: 'The last test is a 20,000-node path: a recursive DFS would be 20,000 frames deep, which overflows many JS engines. The explicit stack keeps depth on the heap.',
  },
  dryRun: {
    columns: ['event', 'disc', 'low', 'bridge test'],
    rows: [
      ['visit 0', '0', '0', ''],
      ['visit 1', '1', '1', ''],
      ['visit 2', '2', '2', ''],
      ['2 → 0 back edge', '', 'low[2] = 0', ''],
      ['pop 2 → parent 1', '', 'low[1] = 0', '0 > 1? no'],
      ['visit 3', '3', '3', ''],
      ['pop 3 → parent 1', '', 'low[1] = 0', 'low[3]=3 > disc[1]=1 → bridge [1,3]'],
      ['pop 1 → parent 0', '', 'low[0] = 0', '0 > 0? no'],
    ],
  },
  complexity: { time: 'O(V + E)', space: 'O(V + E)', explanation: 'Every edge is looked at twice (once per endpoint); every node is pushed and popped once.' },
  alternative: {
    title: 'Recursive low-link (short, but depth-limited)',
    md: 'Same logic with recursion. Clear for interviews; mention that for n = 10^5 you would switch to the iterative form.',
    code: `function criticalConnections(n, connections) {
  const adj = Array.from({ length: n }, () => []);
  connections.forEach(([a, b], id) => { adj[a].push([b, id]); adj[b].push([a, id]); });
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0), res = [];
  let time = 0;
  const dfs = (u, pe) => {
    disc[u] = low[u] = time++;
    for (const [v, id] of adj[u]) {
      if (id === pe) continue;
      if (disc[v] === -1) {
        dfs(v, id);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) res.push([u, v]);
      } else low[u] = Math.min(low[u], disc[v]);
    }
  };
  dfs(0, -1);
  return res;
}`,
    complexity: 'O(V + E) time, O(V) recursion depth',
  },
  mistakes: [
    'Using `>=` (the articulation test) — marks cycle edges that land exactly on the parent.',
    'Skipping the parent node instead of the parent edge.',
    'Recursion depth on long paths in JavaScript.',
    'Brute-force edge deletion — correct but O(E·(V+E)).',
  ],
};
