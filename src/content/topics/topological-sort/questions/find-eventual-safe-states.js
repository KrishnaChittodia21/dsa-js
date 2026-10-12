export default {
  id: 'find-eventual-safe-states',
  title: 'Find Eventual Safe States',
  difficulty: 'Medium',
  order: 5,
  pattern: 'topo-dfs-three-color',
  tags: ['graph', 'dfs', 'cycle detection', 'topological sort'],
  source: { platform: 'LeetCode', number: 802, url: 'https://leetcode.com/problems/find-eventual-safe-states/' },

  statement: `A directed graph of \`n\` nodes is given as \`graph[i]\` = list of nodes that \`i\` has edges to.

A **terminal** node has no outgoing edges. A node is **safe** if **every** path starting from it eventually ends at a terminal node (in other words, no path from it can loop forever).

Return all safe nodes, sorted ascending.`,
  examples: [
    { input: 'graph = [[1,2],[2,3],[5],[0],[5],[],[]]', output: '[2,4,5,6]', explanation: '0 → 1 → 3 → 0 is a cycle, so 0, 1 and 3 are unsafe.' },
    { input: 'graph = [[1,2,3,4],[1,2],[3,4],[0,4],[]]', output: '[4]' },
  ],
  constraints: ['1 <= n <= 10^4', '0 <= total edges <= 4 · 10^4', 'graph[i] is sorted, may contain self-loops'],

  think: `- A node is unsafe if some path from it can reach a cycle. How can DFS colours tell you that?
- If a node is found to be safe once, do you ever need to explore it again?
- Could you instead "peel" from the terminal nodes, Kahn-style? Which edges would you reverse?`,
  patternChallenge: {
    options: ['BFS shortest path to a terminal node', 'Undirected cycle detection', 'Three-colour DFS (gray = on path)', 'Bipartite colouring'],
    answer: 2,
    explanation: 'Unsafe ⟺ can reach a directed cycle. In 3-colour DFS, a node that reaches a gray node is on or leads into a cycle; nodes that finish black are safe, and the colour doubles as a memo. BFS to a terminal node shows that SOME path is fine, but safety needs EVERY path to be fine.',
  },
  hints: [
    'color: 0 = unvisited, 1 = visiting (on the current path, or proven unsafe), 2 = safe.',
    'dfs(u): if color[u] > 0 return color[u] === 2. Set 1; if any neighbour is not safe, return false leaving u at 1; else set 2 and return true.',
  ],
  approach: `**3-colour DFS with memo.** Mark \`u\` gray (1) on entry. If any neighbour returns "unsafe" (it is gray = on the current path → cycle, or already proven unsafe), return false **and leave u gray** — gray now also means "unsafe" permanently, which is correct because u can reach a cycle. If all neighbours are safe, colour u black (2). Each node is resolved once → O(V + E).

**Kahn on the reversed graph.** Reverse every edge; terminal nodes now have in-degree 0 (in the reversed sense: out-degree 0 originally). Peel: a node becomes safe when all its original successors are safe. The peeled nodes are exactly the safe ones.`,

  functionName: 'eventualSafeNodes',
  paramNames: ['graph'],
  starterCode: `/**
 * @param {number[][]} graph
 * @return {number[]}
 */
function eventualSafeNodes(graph) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '0 → 1 → 3 → 0 is a cycle, so 0, 1 and 3 are unsafe; everything else ends at 5 or 6.', args: [[[1, 2], [2, 3], [5], [0], [5], [], []]], expected: [2, 4, 5, 6] },
    { scenario: 'Example 2', hint: 'Node 1 has a self-loop and every other non-terminal can reach a cycle; only 4 is safe.', args: [[[1, 2, 3, 4], [1, 2], [3, 4], [0, 4], []]], expected: [4] },
    { scenario: 'Single terminal node', hint: 'A node with no outgoing edges is terminal, hence safe.', args: [[[]]], expected: [0] },
    { scenario: 'Single self-loop', hint: '[[0]]: the only node loops forever — missing self-loops makes it look safe.', args: [[[0]]], expected: [] },
    { scenario: 'Simple chain', hint: 'All paths end at terminal node 2.', args: [[[1], [2], []]], expected: [0, 1, 2] },
    { scenario: 'Separate cycle component', hint: '0 ⇄ 1 is unsafe while the separate chain 2 → 3 is safe.', args: [[[1], [0], [3], []]], expected: [2, 3] },
    { scenario: 'Diamond is not a cycle', hint: 'Node 3 is reached twice from 0; a single visited flag would call that a cycle.', args: [[[1, 2], [3], [3], []]], expected: [0, 1, 2, 3] },
    { scenario: 'Some path is not enough', hint: 'Node 1 can reach terminal 0 but can also enter the 2 ⇄ 3 loop — safety needs ALL paths to end.', args: [[[], [0, 2], [3], [2]]], expected: [0] },
    { scenario: 'Self-loop mid-path', hint: 'Node 1 loops on itself, so 0 (which must pass through 1) is also unsafe.', args: [[[1], [1, 2], []]], expected: [2] },
    { scenario: 'Everything on one cycle', hint: 'No terminal node exists: return [].', args: [[[1], [2], [0]]], expected: [] },
    { scenario: 'Fan into long unsafe chain', hint: '7000 nodes all point at the head of a 3000-node chain ending in a cycle. If you reset unsafe nodes to "unvisited", every start re-walks the chain: O(n²). Keep unsafe nodes marked.', argsGen: '() => { const n = 10000, L = 3000; const g = Array.from({ length: n }, (_, i) => (i < L - 1 ? [i + 1] : [0])); g[L - 1] = [L - 2]; return [g]; }', expected: [], timeLimitMs: 120 },
    { scenario: 'Large mixed graph (n = 10^4)', hint: 'Half the nodes feed into a terminal, half into a cycle, with 4·10^4 edges in total.', argsGen: '() => { const n = 10000; let s = 7; const r = () => (s = (s * 48271) % 2147483647); const g = Array.from({ length: n }, () => []); for (let i = 0; i < n; i++) { const hi = i < 5000 ? 5000 : n; for (let k = 0; k < 4; k++) { if (i + 1 >= hi) break; g[i].push(i + 1 + (r() % Math.min(50, hi - i - 1))); } } g[n - 1] = [5000]; g[4999] = []; for (const l of g) { l.sort((a, b) => a - b); for (let k = l.length - 1; k > 0; k--) if (l[k] === l[k - 1]) l.splice(k, 1); } return [g]; }', expectedGen: "() => Array.from({ length: 5000 }, (_, i) => i)" },
  ],

  solution: {
    code: `function eventualSafeNodes(graph) {
  const n = graph.length;
  // 0 = unvisited, 1 = visiting OR proven unsafe, 2 = safe
  const color = new Uint8Array(n);
  const isSafe = (u) => {
    if (color[u] !== 0) return color[u] === 2;   // gray here = cycle (or known unsafe)
    color[u] = 1;
    for (const v of graph[u]) {
      if (!isSafe(v)) return false;               // u stays 1 → unsafe forever
    }
    color[u] = 2;
    return true;
  };
  const result = [];
  for (let i = 0; i < n; i++) if (isSafe(i)) result.push(i);
  return result;                                  // already ascending
}`,
    explanation: 'Leaving an unsafe node gray is a deliberate trick: anyone reaching it later also learns "unsafe" in O(1).',
  },
  dryRun: { columns: ['call', 'colour change', 'result'], rows: [['isSafe(0)', '0 gray', 'explore 1'], ['isSafe(1)', '1 gray', 'explore 2'], ['isSafe(2)', '2 gray → 5 terminal (safe)', '2 black, safe'], ['isSafe(3) from 1', '3 gray → 0 is gray', 'unsafe; 3, 1, 0 stay gray'], ['isSafe(4)', '4 → 5 safe', '4 black'], ['answer', '', '[2, 4, 5, 6]']] },
  complexity: { time: 'O(V + E)', space: 'O(V)', explanation: 'Each node leaves colour 0 once and scans its edges at most once; recursion depth ≤ V.' },
  alternative: {
    title: 'Kahn on the reversed graph',
    md: 'Build reverse edges v → u for each u → v and outdeg[u]. Queue all terminal nodes. Pop v; for each u with an edge u → v, `outdeg[u]--`; at 0 all of u\'s successors are safe → queue u. Mark queued nodes safe, then list them in order.',
    code: `function eventualSafeNodes(graph) {
  const n = graph.length;
  const rev = Array.from({ length: n }, () => []);
  const out = graph.map((g) => g.length);
  graph.forEach((list, u) => { for (const v of list) rev[v].push(u); });
  const safe = new Uint8Array(n);
  const q = [];
  for (let i = 0; i < n; i++) if (out[i] === 0) q.push(i);
  for (let h = 0; h < q.length; h++) {
    const v = q[h];
    safe[v] = 1;
    for (const u of rev[v]) if (--out[u] === 0) q.push(u);
  }
  const res = [];
  for (let i = 0; i < n; i++) if (safe[i]) res.push(i);
  return res;
}`,
    complexity: 'O(V + E) time and space, no recursion',
  },
  mistakes: [
    'Using a single visited flag — a node reached twice through a diamond is not a cycle.',
    'Resetting unsafe nodes back to 0 → exponential re-exploration.',
    'Returning nodes that have SOME path to a terminal (safety needs ALL paths).',
    'Missing self-loops: [[0]] makes node 0 unsafe.',
  ],
};
