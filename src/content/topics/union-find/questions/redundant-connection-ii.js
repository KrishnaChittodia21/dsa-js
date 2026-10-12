export default {
  id: 'redundant-connection-ii',
  title: 'Redundant Connection II',
  difficulty: 'Hard',
  order: 2,
  pattern: 'union-find-advanced',
  tags: ['union find', 'graph', 'directed graph'],
  source: { platform: 'LeetCode', number: 685, url: 'https://leetcode.com/problems/redundant-connection-ii/' },

  statement: `A **rooted tree** is a directed graph with one root (no parent) where every other node has exactly one parent and every node is reachable from the root.

A rooted tree on nodes \`1..n\` had **one extra directed edge** added. \`edges[i] = [u, v]\` means u is a parent of v.

Return an edge that can be removed so the result is a rooted tree again. If there are several answers, return the one that appears **last** in the input.`,
  examples: [
    { input: 'edges = [[1,2],[1,3],[2,3]]', output: '[2,3]', explanation: 'Node 3 has two parents; removing the later one works.' },
    { input: 'edges = [[1,2],[2,3],[3,4],[4,1],[1,5]]', output: '[4,1]', explanation: 'No node has two parents; there is a cycle 1→2→3→4→1.' },
  ],
  constraints: ['n == edges.length', '3 <= n <= 1000', '1 <= u, v <= n, u != v'],

  think: `- The extra edge points **into** some node. Either that node now has two parents, or it points into the root (creating a cycle but no double parent).
- If a node has two parents, exactly one of those two edges must go. How do you decide which?
- How can the undirected cycle check from Redundant Connection I help?`,
  patternChallenge: {
    options: ['Topological Sort (Kahn)', 'Union Find — Multi-Instance & Online', 'Dijkstra', 'Backtracking'],
    answer: 1,
    explanation: 'This is DSU cycle detection plus careful case analysis of the directed structure (two-parent vs cycle). Kahn\'s algorithm detects cycles but cannot pick the correct edge among two parents in all cases.',
  },
  hints: [
    'Scan edges and record `parentOf[v]`. If some v gets a second parent, remember cand1 = the earlier edge, cand2 = the later edge.',
    'Run DSU over all edges **except cand2**. If no cycle appears, cand2 is the answer. If a cycle appears: return cand1 if it exists, otherwise the edge that closed the cycle.',
  ],
  approach: `There are three possible situations:

1. **Two parents, no cycle** (extra edge points into a non-root node, not creating a cycle): remove the later of the two parent edges → cand2.
2. **Two parents and a cycle**: the cycle passes through the double-parent node; the edge to remove is the parent edge **on the cycle** — which must be cand1 if skipping cand2 still leaves a cycle.
3. **No two parents, only a cycle** (extra edge points into the root): same as Redundant Connection I — the edge that closes the cycle.

**Algorithm:**
- Find cand1/cand2 (the two edges into the same node, in input order).
- DSU over all edges, **skipping cand2**. If a union fails:
  - if cand1 exists → return cand1 (case 2);
  - else → return the failing edge (case 3).
- If nothing fails → return cand2 (case 1: skipping cand2 fixed everything).

Why is skipping cand2 the right test? If cand2 was the bad edge, removing it leaves a valid tree, so no cycle appears. If a cycle still appears, cand2 was fine and cand1 (the other parent edge) must be on the cycle.`,

  functionName: 'findRedundantDirectedConnection',
  paramNames: ['edges'],
  starterCode: `/**
 * @param {number[][]} edges
 * @return {number[]}
 */
function findRedundantDirectedConnection(edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Node 3 has two parents and there is no directed cycle — drop the later parent edge.', args: [[[1, 2], [1, 3], [2, 3]]], expected: [2, 3] },
    { scenario: 'Example 2', hint: 'No node has two parents; the extra edge points into the root and closes a directed cycle.', args: [[[1, 2], [2, 3], [3, 4], [4, 1], [1, 5]]], expected: [4, 1] },
    { scenario: 'Two parents and a cycle', hint: 'Node 1 has two parents and one of them lies on a cycle: the earlier parent edge (cand1) must go, not the later one.', args: [[[2, 1], [3, 1], [4, 2], [1, 4]]], expected: [2, 1] },
    { scenario: 'Pure 3-cycle', hint: 'Every node has one parent but there is no root; remove the last edge of the cycle.', args: [[[1, 2], [2, 3], [3, 1]]], expected: [3, 1] },
    { scenario: 'Cycle edge is cand2', hint: 'Node 3 has parents 2 and 4. Removing the later edge [4,3] still leaves the cycle 1→2→3→1, so the earlier parent edge [2,3] must go — returning cand2 blindly is wrong.', args: [[[3, 1], [1, 2], [2, 3], [4, 3]]], expected: [2, 3] },
    { scenario: 'Earlier parent edge on cycle', hint: 'Node 2 gets parents 4 and 5; [4,2] is on the cycle 2→4→2, so it is the edge to remove even though it appears first.', args: [[[4, 2], [1, 5], [5, 2], [5, 3], [2, 4]]], expected: [4, 2] },
    { scenario: 'Two parents, no cycle', hint: 'Node 2 has parents 1 and 3; with no cycle, the later edge [3,2] is the answer.', args: [[[1, 2], [1, 3], [3, 2]]], expected: [3, 2] },
    { scenario: 'Mutual pair (2-cycle)', hint: 'Edges [2,3] and [3,2] form a 2-node directed cycle; an undirected DSU would flag the wrong edge.', args: [[[1, 2], [2, 3], [3, 2], [3, 4]]], expected: [3, 2] },
    { scenario: 'Duplicate parent edge', hint: 'The same edge [1,3] appears twice, so node 3 has "two" parents that are the same node; return the later copy.', args: [[[1, 2], [1, 3], [2, 4], [1, 3]]], expected: [1, 3] },
    { scenario: 'Undirected answer differs', hint: 'The undirected approach returns [1,2] (it closes the undirected cycle), but node 3 has two parents — the edge to drop is the later parent edge [2,3].', args: [[[1, 3], [2, 3], [1, 2]]], expected: [2, 3] },
    { scenario: 'Edge into the root', hint: 'The extra edge [5,1] points at the root, so nobody has two parents — the answer is the last edge on the cycle 1→…→5→1.', args: [[[1, 2], [2, 3], [5, 1], [3, 4], [4, 5], [1, 6]]], expected: [4, 5] },
    { scenario: 'Large: double parent (n = 1000)', hint: 'A random 1000-node tree with an extra edge into a non-root node; handle both candidate edges correctly at scale.', argsGen: '() => { const n = 1000; let s = 11; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const e = []; for (let i = 2; i <= n; i++) e.push([1 + (r() % (i - 1)), i]); e.push([999, 500]); for (let i = e.length - 1; i > 0; i--) { const j = r() % (i + 1); [e[i], e[j]] = [e[j], e[i]]; } return [e]; }', expected: [999, 500] },
    { scenario: 'Large: cycle through root (n = 1000)', hint: 'A random 1000-node tree whose extra edge points back into the root; there is no double parent, only a cycle.', argsGen: '() => { const n = 1000; let s = 23; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const e = []; for (let i = 2; i <= n; i++) e.push([1 + (r() % (i - 1)), i]); e.push([1000, 1]); for (let i = e.length - 1; i > 0; i--) { const j = r() % (i + 1); [e[i], e[j]] = [e[j], e[i]]; } return [e]; }', expected: [311, 312] },
  ],

  solution: {
    code: `function findRedundantDirectedConnection(edges) {
  const n = edges.length;
  const parentOf = new Array(n + 1).fill(0);
  let cand1 = null, cand2 = null;

  for (const [u, v] of edges) {
    if (parentOf[v] !== 0) {                 // v already has a parent
      cand1 = [parentOf[v], v];              // earlier edge into v
      cand2 = [u, v];                        // later edge into v
    } else {
      parentOf[v] = u;
    }
  }

  const uf = new UnionFind(n + 1);
  for (const [u, v] of edges) {
    if (cand2 && u === cand2[0] && v === cand2[1]) continue; // pretend cand2 is removed
    if (!uf.union(u, v)) {
      return cand1 ? cand1 : [u, v];         // cycle remains
    }
  }
  return cand2;                              // removing cand2 fixed everything
}`,
  },
  dryRun: {
    columns: ['step', 'detail'],
    rows: [
      ['scan', 'edges [2,1],[3,1],[4,2],[1,4]: node 1 gets parents 2 and 3 → cand1 = [2,1], cand2 = [3,1]'],
      ['DSU (skip [3,1])', '[2,1] ok, [4,2] ok, [1,4] → 1 and 4 already connected → cycle'],
      ['decide', 'cycle with cand1 present → return [2,1]'],
    ],
  },
  complexity: { time: 'O(n · α(n))', space: 'O(n)', explanation: 'One scan to find the double parent, one DSU pass.' },
  alternative: {
    title: 'Try removing each edge from the end',
    md: 'For each edge from last to first, remove it and check whether the rest is a valid rooted tree (exactly one root, every node reachable, one parent each). O(n²), fine for n ≤ 1000 and a good way to test your fast solution.',
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: ['Treating it like the undirected version (fails when a node has two parents).', 'Returning cand2 blindly whenever a double parent exists — fails when cand1 is on the cycle.', 'Skipping cand1 instead of cand2 in the DSU pass.'],
};
