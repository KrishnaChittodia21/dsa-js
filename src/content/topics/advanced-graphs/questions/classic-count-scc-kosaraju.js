export default {
  id: 'classic-count-scc-kosaraju',
  title: 'Count Strongly Connected Components (Kosaraju)',
  difficulty: 'Medium',
  order: 1,
  pattern: 'adv-graph-scc-kosaraju',
  tags: ['graph', 'dfs', 'strongly connected components'],
  source: { platform: 'Classic', note: "Textbook exercise: Kosaraju's two-pass SCC algorithm (CLRS §22.5)." },

  statement: `You are given a **directed** graph with \`n\` nodes labelled \`0 … n-1\` and a list of edges \`[u, v]\` meaning there is an arrow from \`u\` to \`v\`.

Two nodes belong to the same **strongly connected component (SCC)** when each can reach the other by following arrows. Every node belongs to exactly one SCC (a node that is on no cycle is an SCC by itself).

Return the **number of SCCs**.`,
  examples: [
    { input: 'n = 5, edges = [[0,1],[1,2],[2,0],[2,3],[3,4],[4,3]]', output: '2', explanation: '{0,1,2} form a cycle and {3,4} form a cycle; 3 cannot get back to 2.' },
    { input: 'n = 4, edges = [[0,1],[1,2],[2,3]]', output: '4', explanation: 'A simple chain: nobody can go backwards, so every node is alone.' },
  ],
  constraints: ['1 <= n <= 2 * 10^4', '0 <= edges.length <= 5 * 10^4', '0 <= u, v < n', 'Self-loops and duplicate edges may appear'],

  think: `- Reachability in both directions for every pair would cost O(V·(V+E)). What can one DFS tell you about the ORDER in which nodes finish?
- If you reverse every edge, which SCCs stay the same, and what happens to "source" components?
- With 2·10^4 nodes on a long chain, will a recursive DFS survive in JavaScript?`,
  patternChallenge: {
    options: ['Union Find over the edges', 'Topological sort (Kahn)', 'Kosaraju — finish order + DFS on the transposed graph', 'BFS from every node'],
    answer: 2,
    explanation: '"Mutually reachable" in a **directed** graph is the definition of an SCC; Kosaraju finds them all in O(V + E). Union Find ignores direction (it would merge 0→1 even if 1 cannot reach 0). Kahn only works on DAGs — cycles are exactly what we want to find. BFS from every node is the O(V·(V+E)) brute force.',
  },
  hints: [
    'Pass 1: DFS the original graph and record each node when it FINISHES. The last node to finish lies in a component nothing else points into.',
    'Pass 2: build the reversed graph; process nodes in decreasing finish time; each fresh DFS on the reversed graph marks exactly one SCC. Count how many DFS runs you start.',
  ],
  approach: `**Brute force:** for every node run a BFS to get its reachable set; u and v are in the same SCC iff each set contains the other. O(V·(V+E)) — too slow for 2·10^4 nodes.

**Kosaraju (O(V + E)):**
1. Build \`g\` and its transpose \`rg\` (every edge reversed).
2. Pass 1 — iterative DFS on \`g\` with frames \`[node, nextIndex]\`; push a node onto \`order\` when all its neighbours are done.
3. Pass 2 — for \`i\` from \`n-1\` down to \`0\`, if \`order[i]\` has no component yet, flood-fill it on \`rg\` and increment the count.

Why it works: the node that finishes last is in a *source* SCC of the condensation. Reversing edges keeps SCCs but turns that source into a *sink*, so the flood fill in pass 2 cannot leak into another component. Repeating the argument on the remaining nodes peels off one SCC per DFS.`,

  functionName: 'countSCC',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number}
 */
function countSCC(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '{0,1,2} and {3,4} are cycles; 3 cannot get back to 2, so they stay separate.', args: [5, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 3]]], expected: 2 },
    { scenario: 'Example 2', hint: 'A chain: nobody can go backwards, so every node is its own SCC.', args: [4, [[0, 1], [1, 2], [2, 3]]], expected: 4 },
    { scenario: 'Single node', hint: 'One node is one SCC.', args: [1, []], expected: 1 },
    { scenario: 'No edges', hint: 'Every isolated node is its own SCC.', args: [3, []], expected: 3 },
    { scenario: 'Two separate 2-cycles', hint: 'Disconnected parts: start a DFS from every unvisited node in both passes.', args: [4, [[0, 1], [1, 0], [2, 3], [3, 2]]], expected: 2 },
    { scenario: 'Self-loop and duplicates', hint: 'A self-loop or a doubled edge does not merge 0 and 1 — 1 cannot reach 0.', args: [2, [[0, 0], [0, 1], [0, 1]]], expected: 2 },
    { scenario: 'Cycles linked by one-way edges', hint: 'Pass 2 must run on the REVERSED graph; otherwise the source SCC {0,1,2} swallows everything downstream.', args: [8, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 6], [6, 4], [6, 7]]], expected: 4 },
    { scenario: 'Two cycles closed into one', hint: 'Edges 2 → 3 and 5 → 0 make both triangles one big SCC.', args: [6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 3], [5, 0]]], expected: 1 },
    { scenario: 'Undirected thinking fails', hint: 'Everything is weakly connected, but edges point one way: Union Find (ignoring direction) would say 1.', args: [3, [[0, 1], [2, 1]]], expected: 3 },
    { scenario: 'Finish order matters', hint: 'Record nodes when they FINISH and process pass 2 in decreasing finish order; discovery order gives the wrong count here.', args: [4, [[1, 0], [0, 2], [2, 1], [3, 0]]], expected: 2 },
    { scenario: 'Huge cycle (n = 2·10^4)', hint: 'One 20 000-node cycle: a recursive DFS this deep overflows the call stack — use an explicit stack.', argsGen: '() => [20000, Array.from({ length: 20000 }, (_, i) => [i, (i + 1) % 20000])]', expected: 1 },
    { scenario: 'Large DAG-like graph', hint: '20 000 nodes, 5·10^4 mostly forward edges and a few short back edges: thousands of small SCCs. Two reachability searches per SCC is O(V·(V+E)) — far too slow.', argsGen: '() => { const n = 20000; let s = 8; const r = () => (s = (s * 48271) % 2147483647); const e = []; while (e.length < 50000) { const a = r() % n; if (r() % 20 === 0) { const b = a + 1 + (r() % 3); if (b < n) e.push([b, a]); } else { const b = a + 1 + (r() % 50); if (b < n) e.push([a, b]); } } return [n, e]; }', expected: 19829, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function countSCC(n, edges) {
  const g = Array.from({ length: n }, () => []);
  const rg = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { g[u].push(v); rg[v].push(u); }

  // Pass 1: iterative DFS, record nodes in finishing order
  const seen = new Array(n).fill(false);
  const order = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    seen[s] = true;
    const stack = [[s, 0]];               // [node, index of next neighbour]
    while (stack.length) {
      const top = stack[stack.length - 1];
      const u = top[0];
      if (top[1] < g[u].length) {
        const v = g[u][top[1]++];
        if (!seen[v]) { seen[v] = true; stack.push([v, 0]); }
      } else {
        order.push(u);                    // u has finished
        stack.pop();
      }
    }
  }

  // Pass 2: flood fill on the transpose in decreasing finish time
  const comp = new Array(n).fill(-1);
  let count = 0;
  for (let i = n - 1; i >= 0; i--) {
    const s = order[i];
    if (comp[s] !== -1) continue;
    comp[s] = count;
    const stack = [s];
    while (stack.length) {
      const u = stack.pop();
      for (const v of rg[u]) {
        if (comp[v] === -1) { comp[v] = count; stack.push(v); }
      }
    }
    count++;
  }
  return count;
}`,
    explanation: 'Pass 1 needs true post-order, so it keeps a "next neighbour" index per frame. Pass 2 only needs the set of reachable nodes, so a plain stack works.',
  },
  dryRun: {
    columns: ['phase', 'what happens', 'state'],
    rows: [
      ['pass 1', 'DFS 0 → 1 → 2 → 3 → 4; 4 finishes, then 3, 2, 1, 0', 'order = [4,3,2,1,0]'],
      ['pass 2', 'start at 0 (last finisher): transpose DFS reaches 2, 1', 'comp 0 = {0,1,2}, count = 1'],
      ['pass 2', '1, 2 already assigned; start at 3: reaches 4 (2 is taken)', 'comp 1 = {3,4}, count = 2'],
      ['pass 2', '4 already assigned', 'answer 2'],
    ],
  },
  complexity: { time: 'O(V + E)', space: 'O(V + E)', explanation: 'Each node is pushed and popped once per pass; each edge is scanned once in g and once in rg. The two adjacency lists take O(V + E).' },
  alternative: {
    title: "Tarjan's SCC (single pass)",
    md: 'One DFS with disc/low values and an explicit stack of "active" nodes. When a node finishes with `low[u] === disc[u]`, pop the stack down to u — that is one SCC. No transpose needed.',
    code: `function countSCC(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) g[u].push(v);
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0), onStack = new Array(n).fill(false);
  const st = [];
  let time = 0, count = 0;
  function dfs(u) {                        // recursive: fine for small n
    disc[u] = low[u] = time++; st.push(u); onStack[u] = true;
    for (const v of g[u]) {
      if (disc[v] === -1) { dfs(v); low[u] = Math.min(low[u], low[v]); }
      else if (onStack[v]) low[u] = Math.min(low[u], disc[v]);
    }
    if (low[u] === disc[u]) {
      count++;
      let w;
      do { w = st.pop(); onStack[w] = false; } while (w !== u);
    }
  }
  for (let u = 0; u < n; u++) if (disc[u] === -1) dfs(u);
  return count;
}`,
    complexity: 'O(V + E) time, O(V) extra space',
  },
  mistakes: [
    'Running pass 2 on the original graph — a source component would swallow everything downstream.',
    'Iterating pass 2 in increasing finish order.',
    'Recording nodes when they are discovered instead of when they finish.',
    'Recursive DFS on the 20,000-node cycle overflows the JS call stack.',
    'Using Union Find — it ignores edge direction.',
  ],
};
