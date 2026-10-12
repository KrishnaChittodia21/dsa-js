export default {
  id: 'all-ancestors-of-a-node-in-a-directed-acyclic-graph',
  title: 'All Ancestors of a Node in a Directed Acyclic Graph',
  difficulty: 'Medium',
  order: 4,
  pattern: 'topo-dag-dp',
  tags: ['graph', 'topological sort', 'dag', 'set'],
  source: { platform: 'LeetCode', number: 2192, url: 'https://leetcode.com/problems/all-ancestors-of-a-node-in-a-directed-acyclic-graph/' },

  statement: `You are given a DAG with \`n\` nodes \`0..n-1\` and directed edges \`edges[i] = [from, to]\`.

Node \`u\` is an **ancestor** of \`v\` if \`v\` can be reached from \`u\` by following edges. Return a list \`answer\` where \`answer[i]\` is the list of all ancestors of node \`i\`, **sorted ascending**.`,
  examples: [
    { input: 'n = 8, edges = [[0,3],[0,4],[1,3],[2,4],[2,7],[3,5],[3,6],[3,7],[4,6]]', output: '[[],[],[],[0,1],[0,2],[0,1,3],[0,1,2,3,4],[0,1,2,3]]' },
    { input: 'n = 5, edges = [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]', output: '[[],[0],[0,1],[0,1,2],[0,1,2,3]]' },
  ],
  constraints: ['1 <= n <= 1000', '0 <= edges.length <= min(2000, n(n−1)/2)', 'The graph is acyclic, no duplicate edges'],

  think: `- If u → v is an edge, how are the ancestors of v related to the ancestors of u?
- In what order must you process the nodes so that ancestors[u] is complete before you use it?`,
  patternChallenge: {
    options: ['BFS shortest path from every node', 'Topological order + propagating ancestor sets', 'Union-Find', 'Binary Search'],
    answer: 1,
    explanation: 'ancestors(v) = ⋃ over edges u → v of (ancestors(u) ∪ {u}). Processing in topological order guarantees every ancestors(u) is complete before it is merged into v. Union-Find would merge nodes regardless of direction.',
  },
  hints: [
    'Use Kahn. When you relax an edge u → v, add u and everything in ancestors[u] to ancestors[v] (a Set).',
    'At the end convert each Set to an array and sort numerically: `(a, b) => a - b`.',
  ],
  approach: `**Propagation along a topological order:** \`anc[v]\` = Set. Process vertices in Kahn order; for every edge \`u → v\`: add \`u\` and all of \`anc[u]\` to \`anc[v]\`. Because u is popped only after all of its own predecessors, \`anc[u]\` is final by then. Finally sort each set. Worst case O(n · (n + m)) set work plus sorting.

**Alternative:** DFS/BFS forward from every node \`s\` and append \`s\` to the list of every node it reaches. If sources are processed in increasing order, the lists come out already sorted.`,

  functionName: 'getAncestors',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number[][]}
 */
function getAncestors(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Ancestors flow along edges: node 6 inherits from both 3 and 4, and transitively from 0, 1, 2.', args: [8, [[0, 3], [0, 4], [1, 3], [2, 4], [2, 7], [3, 5], [3, 6], [3, 7], [4, 6]]], expected: [[], [], [], [0, 1], [0, 2], [0, 1, 3], [0, 1, 2, 3, 4], [0, 1, 2, 3]] },
    { scenario: 'Example 2', hint: 'A complete DAG: every lower-numbered node is an ancestor.', args: [5, [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]], expected: [[], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3]] },
    { scenario: 'Single node', hint: 'One node, no edges: one empty list.', args: [1, []], expected: [[]] },
    { scenario: 'No edges', hint: 'Every node gets an empty list — return n lists, not an empty array.', args: [3, []], expected: [[], [], []] },
    { scenario: 'Reversed chain', hint: 'Edges point from high to low labels; node 0 has every other node as an ancestor.', args: [4, [[3, 2], [2, 1], [1, 0]]], expected: [[1, 2, 3], [2, 3], [3], []] },
    { scenario: 'Two components', hint: 'Ancestors never leak across disconnected parts of the graph.', args: [6, [[0, 2], [1, 2], [2, 3], [4, 5]]], expected: [[], [], [0, 1], [0, 1, 2], [], [4]] },
    { scenario: 'Many parents, one child', hint: 'Node 4 has four direct parents and nothing else.', args: [5, [[0, 4], [1, 4], [2, 4], [3, 4]]], expected: [[], [], [], [], [0, 1, 2, 3]] },
    { scenario: 'Edges out of topological order', hint: 'Edge [1,2] is listed before [0,1]. Merging ancestors in input order misses 0 for node 2 — process nodes in topological order.', args: [3, [[1, 2], [0, 1]]], expected: [[], [0], [0, 1]] },
    { scenario: 'Labels needing numeric sort', hint: 'Default sort() compares as strings and puts 10 before 2 — use (a, b) => a - b.', args: [12, [[10, 11], [2, 11], [9, 10], [1, 2]]], expected: [[], [], [1], [], [], [], [], [], [], [], [9], [1, 2, 9, 10]] },
    { scenario: 'Direct parent included', hint: 'Node u itself is an ancestor of v for every edge u → v — not only u\'s own ancestors.', args: [3, [[0, 1], [1, 2]]], expected: [[], [0], [0, 1]] },
    { scenario: 'Diamond', hint: 'Node 3 is reached through two paths; each ancestor must appear only once.', args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], expected: [[], [0], [0], [0, 1, 2]] },
    { scenario: 'Max n, max edges (shallow)', hint: '1000 nodes and 2000 edges arranged in small diamonds with long-range links; lists stay short but there are many merges.', argsGen: '() => { const e = []; for (let b = 0; b < 250; b++) { const x = 4 * b; e.push([x, x + 1], [x, x + 2], [x + 1, x + 3], [x + 2, x + 3]); } for (let b = 0; b < 249; b++) e.push([4 * b, 4 * (b + 1) + 3]); for (let b = 0; b < 248; b++) e.push([4 * b + 1, 4 * (b + 2) + 3]); for (let b = 0; b < 247; b++) e.push([4 * b + 2, 4 * (b + 3) + 3]); for (let b = 0; b < 246; b++) e.push([4 * b, 4 * (b + 4) + 2]); for (let b = 0; b < 10; b++) e.push([4 * b + 1, 4 * (b + 5) + 2]); return [1000, e.reverse()]; }', expectedGen: "() => { const [n, edges] = (() => { const e = []; for (let b = 0; b < 250; b++) { const x = 4 * b; e.push([x, x + 1], [x, x + 2], [x + 1, x + 3], [x + 2, x + 3]); } for (let b = 0; b < 249; b++) e.push([4 * b, 4 * (b + 1) + 3]); for (let b = 0; b < 248; b++) e.push([4 * b + 1, 4 * (b + 2) + 3]); for (let b = 0; b < 247; b++) e.push([4 * b + 2, 4 * (b + 3) + 3]); for (let b = 0; b < 246; b++) e.push([4 * b, 4 * (b + 4) + 2]); for (let b = 0; b < 10; b++) e.push([4 * b + 1, 4 * (b + 5) + 2]); return [1000, e.reverse()]; })(); const par = Array.from({ length: n }, () => []); for (const [u, v] of edges) par[v].push(u); return par.map((_, x) => { const seen = new Uint8Array(n), st = [x]; while (st.length) for (const p of par[st.pop()]) if (!seen[p]) { seen[p] = 1; st.push(p); } const out = []; for (let i = 0; i < n; i++) if (seen[i]) out.push(i); return out; }); }" },
    { scenario: 'Deep chain (n = 80)', hint: 'An 80-node chain listed backwards: the last node has 79 ancestors, gathered only if each node is finished before its children use it.', argsGen: '() => { const e = []; for (let i = 78; i >= 0; i--) e.push([i, i + 1]); return [80, e]; }', expectedGen: "() => Array.from({ length: 80 }, (_, i) => Array.from({ length: i }, (_, j) => j))" },
  ],

  solution: {
    code: `function getAncestors(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }

  const anc = Array.from({ length: n }, () => new Set());
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];                    // anc[u] is complete now
    for (const v of adj[u]) {
      anc[v].add(u);
      for (const a of anc[u]) anc[v].add(a);
      if (--indeg[v] === 0) queue.push(v);
    }
  }
  return anc.map((s) => [...s].sort((a, b) => a - b));
}`,
    explanation: 'Numeric comparator is required: the default sort would put 10 before 2.',
  },
  dryRun: { columns: ['pop', 'edge', 'anc[v] after'], rows: [['0', '0→3, 0→4', 'anc[3]={0}, anc[4]={0}'], ['1', '1→3', 'anc[3]={0,1}'], ['2', '2→4, 2→7', 'anc[4]={0,2}, anc[7]={2}'], ['3', '3→5, 3→6, 3→7', 'anc[5]={0,1,3}, anc[6]={0,1,3}, anc[7]={0,1,2,3}'], ['4', '4→6', 'anc[6]={0,1,2,3,4}']] },
  complexity: { time: 'O(n · (n + m) + n² log n)', space: 'O(n²)', explanation: 'Each edge merges a set of up to n ancestors; sorting n lists of up to n items. Output itself can be Θ(n²).' },
  alternative: {
    title: 'DFS from every source, already sorted',
    md: 'For s = 0..n−1: DFS from s along edges with a fresh visited array; for every reached node v, push s into ans[v]. Since s increases, each list is sorted without calling sort.',
    code: `function getAncestors(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const ans = Array.from({ length: n }, () => []);
  for (let s = 0; s < n; s++) {
    const seen = new Uint8Array(n);
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const u = stack.pop();
      for (const v of adj[u]) if (!seen[v]) { seen[v] = 1; ans[v].push(s); stack.push(v); }
    }
  }
  return ans;
}`,
    complexity: 'O(n · (n + m)) time, O(n²) output',
  },
  mistakes: [
    'Using the default `sort()` — it compares as strings.',
    'Merging anc[u] into anc[v] before anc[u] is complete (not following topological order).',
    'Forgetting to add u itself, not only its ancestors.',
  ],
};
