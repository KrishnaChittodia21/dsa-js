export default {
  id: 'graph-valid-tree',
  title: 'Graph Valid Tree',
  difficulty: 'Medium',
  order: 4,
  pattern: 'union-find-connectivity',
  tags: ['graph', 'union find', 'tree'],
  source: { platform: 'LeetCode', number: 261, url: 'https://leetcode.com/problems/graph-valid-tree/', premium: true },

  statement: `Given \`n\` nodes labelled \`0\` to \`n - 1\` and a list of undirected \`edges\`, return \`true\` if these edges form a valid **tree**, otherwise \`false\`.

A tree is connected and has no cycles.`,
  examples: [
    { input: 'n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]', output: 'true' },
    { input: 'n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]', output: 'false', explanation: '1–2–3 forms a cycle.' },
  ],
  constraints: ['1 <= n <= 2000', '0 <= edges.length <= 5000', 'No self-loops or repeated edges'],

  think: `- How many edges must a tree on n nodes have?
- If the edge count is right, what else could still go wrong?
- Which DSU signal tells you about a cycle?`,
  patternChallenge: {
    options: ['Monotonic Stack', 'Sliding Window', 'Kadane\'s Algorithm', 'Union Find (Dynamic Connectivity)'],
    answer: 3,
    explanation: 'A tree = connected + acyclic. DSU detects cycles (failed union) and tracks the component count. None of the other patterns reason about graph structure.',
  },
  hints: [
    'A tree on n nodes has exactly n − 1 edges. Check that first.',
    'With n − 1 edges, the graph is a tree iff no union fails (no cycle) — then it is automatically connected.',
  ],
  approach: `**Facts:** a graph with n nodes is a tree ⇔ it has n − 1 edges **and** is acyclic ⇔ n − 1 edges **and** connected.

**Union Find:** if \`edges.length !== n - 1\` return false. Union every edge; if any union fails, there is a cycle → false. Otherwise true (n − 1 successful unions leave exactly 1 component).

**DFS alternative:** check edge count, then DFS from 0 and verify all n nodes are reached.`,

  functionName: 'validTree',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {boolean}
 */
function validTree(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A star-like tree: 4 edges for 5 nodes, all connected, no cycle.', args: [5, [[0, 1], [0, 2], [0, 3], [1, 4]]], expected: true },
    { scenario: 'Example 2', hint: 'Too many edges: 1–2–3 forms a cycle.', args: [5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]], expected: false },
    { scenario: 'Single node, no edges', hint: 'One node with no edges is a valid tree — do not require at least one edge.', args: [1, []], expected: true },
    { scenario: 'Two isolated nodes', hint: 'No cycle, but the graph is disconnected — only checking for cycles returns true here.', args: [2, []], expected: false },
    { scenario: 'Forest of two trees', hint: 'Acyclic but disconnected: a forest is not a tree.', args: [4, [[0, 1], [2, 3]]], expected: false },
    { scenario: 'Cycle plus isolated node', hint: 'Exactly n − 1 edges, yet there is a triangle and node 3 is isolated — only checking the edge count returns true here.', args: [4, [[0, 1], [1, 2], [2, 0]]], expected: false },
    { scenario: 'Edges point to root', hint: 'Edge direction is irrelevant: [1,0] and [2,0] are undirected.', args: [3, [[1, 0], [2, 0]]], expected: true },
    { scenario: 'Simple path', hint: 'A line 0–1–2–3 is a tree.', args: [4, [[0, 1], [1, 2], [2, 3]]], expected: true },
    { scenario: 'Two nodes, one edge', hint: 'The smallest non-trivial tree.', args: [2, [[1, 0]]], expected: true },
    { scenario: 'Isolated node is 0', hint: 'Node 0 is cut off while 1–2–3 forms a cycle (n − 1 edges again); a DFS from 0 must notice the nodes it never reaches.', args: [4, [[1, 2], [2, 3], [3, 1]]], expected: false },
    { scenario: 'Complete graph on 4 nodes', hint: 'Every pair connected: far more than n − 1 edges.', args: [4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]], expected: false },
    { scenario: 'Large random tree (n = 2000)', hint: 'A valid 2000-node tree; DSU or DFS must visit all nodes.', argsGen: '() => { const n = 2000; let s = 17; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const e = []; for (let i = 1; i < n; i++) e.push([r() % i, i]);  return [n, e]; }', expected: true },
    { scenario: 'Large: cycle plus isolated node', hint: 'A 1999-node ring plus one isolated node: exactly n − 1 edges, so the edge-count check alone passes it.', argsGen: '() => { const n = 2000; let s = 29; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const e = []; for (let i = 1; i < n - 1; i++) e.push([i - 1, i]); e.push([0, n - 2]); for (let i = e.length - 1; i > 0; i--) { const j = r() % (i + 1); [e[i], e[j]] = [e[j], e[i]]; } return [n, e]; }', expected: false },
  ],

  solution: {
    code: `function validTree(n, edges) {
  if (edges.length !== n - 1) return false;   // wrong edge count can never be a tree
  const uf = new UnionFind(n);
  for (const [a, b] of edges) {
    if (!uf.union(a, b)) return false;        // cycle
  }
  return true;                                // n-1 edges, no cycle → connected
}`,
  },
  dryRun: {
    columns: ['edge', 'union', 'count'],
    rows: [
      ['start (4 edges = n−1 ✓)', '', '5'],
      ['[0,1]', 'ok', '4'],
      ['[0,2]', 'ok', '3'],
      ['[0,3]', 'ok', '2'],
      ['[1,4]', 'ok', '1 → true'],
    ],
  },
  complexity: { time: 'O(n · α(n))', space: 'O(n)', explanation: 'At most n − 1 unions after the O(1) edge-count check.' },
  alternative: {
    title: 'DFS connectivity check',
    md: 'After the edge-count check, build an adjacency list and DFS from node 0; the graph is a tree iff every node is visited.',
    complexity: 'O(n) time and space',
  },
  mistakes: ['Only checking for cycles (a forest with no cycles is not a tree).', 'Only checking edge count (n − 1 edges can contain a cycle plus an isolated node).'],
};
