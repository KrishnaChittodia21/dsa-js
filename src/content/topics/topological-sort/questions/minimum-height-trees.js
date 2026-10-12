export default {
  id: 'minimum-height-trees',
  title: 'Minimum Height Trees',
  difficulty: 'Medium',
  order: 7,
  pattern: 'topo-leaf-trimming',
  tags: ['graph', 'tree', 'bfs', 'topological sort'],
  source: { platform: 'LeetCode', number: 310, url: 'https://leetcode.com/problems/minimum-height-trees/' },

  statement: `A tree is an undirected connected graph with no cycles. You get \`n\` nodes \`0..n-1\` and \`n − 1\` edges.

If you pick any node as the root, the tree has some **height** (number of edges on the longest root-to-leaf path). Return **all** roots that give the minimum possible height, in any order.`,
  examples: [
    { input: 'n = 4, edges = [[1,0],[1,2],[1,3]]', output: '[1]' },
    { input: 'n = 6, edges = [[3,0],[3,1],[3,2],[3,4],[5,4]]', output: '[3,4]' },
  ],
  constraints: ['1 <= n <= 2 · 10^4', 'edges.length == n − 1', 'The input is a valid tree'],

  think: `- Is a leaf ever a good root (for n > 2)?
- If you remove all leaves at once, do the best roots change?
- How many roots can the answer contain?`,
  patternChallenge: {
    options: ['Leaf trimming (peel degree-1 nodes layer by layer)', 'BFS from every node to measure its height', 'DFS post-order topo sort', 'Dijkstra'],
    answer: 0,
    explanation: 'Peeling all leaves shortens every longest path by 2 without changing its middle, so the last 1–2 survivors are the centers. BFS from every node is correct but O(n²) = 4·10^8 for n = 2·10^4.',
  },
  hints: [
    'Compute degrees. All degree-1 nodes form the first layer of leaves.',
    'Remove a whole layer: decrement neighbours\' degrees; new degree-1 nodes form the next layer. Stop when ≤ 2 nodes remain.',
  ],
  approach: `**Brute force:** BFS from each node to find its height, keep the minimum: O(n²).

**Leaf trimming (Kahn on an undirected tree):**
1. Build adjacency and degrees. Handle \`n ≤ 2\` directly (every node is an answer).
2. \`leaves\` = all degree-1 nodes; \`remaining = n\`.
3. While \`remaining > 2\`: remove the whole layer (\`remaining -= leaves.length\`), decrement each neighbour's degree, and collect neighbours that became degree 1 as the next layer.
4. The final layer is the answer.

The survivors are the middle of the tree's longest path (diameter), which is where the height is minimised. O(n).`,

  functionName: 'findMinHeightTrees',
  paramNames: ['n', 'edges'],
  compare: 'unordered',
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number[]}
 */
function findMinHeightTrees(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A star: the centre 1 gives height 1.', args: [4, [[1, 0], [1, 2], [1, 3]]], expected: [1] },
    { scenario: 'Example 2', hint: 'The longest path 0–3–4–5 has an even number of nodes, so there are two centres: 3 and 4.', args: [6, [[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]]], expected: [3, 4] },
    { scenario: 'Single node', hint: 'n = 1 has no edges and no leaves to peel; the answer is [0].', args: [1, []], expected: [0] },
    { scenario: 'Two nodes', hint: 'Both nodes are leaves and both are centres — do not peel them away.', args: [2, [[0, 1]]], expected: [0, 1] },
    { scenario: 'Odd path', hint: 'A 5-node path has one centre, node 2.', args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], expected: [2] },
    { scenario: 'Even path', hint: 'A 4-node path has two centres; stopping only when one node remains loses one.', args: [4, [[0, 1], [1, 2], [2, 3]]], expected: [1, 2] },
    { scenario: 'Branches of unequal length', hint: 'Peel whole layers of leaves at once; peeling one leaf at a time can strip past the centres.', args: [7, [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6]]], expected: [1, 2] },
    { scenario: 'Centre is a high label', hint: 'All nodes hang off node 5.', args: [6, [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5]]], expected: [5] },
    { scenario: 'Long tail on a star', hint: 'A star with one long tail: the centre moves along the tail, away from the hub.', args: [8, [[0, 1], [0, 2], [0, 3], [3, 4], [4, 5], [5, 6], [6, 7]]], expected: [4] },
    { scenario: 'Caterpillar tree', hint: 'A spine with leaves on every spine node; the leaves are peeled first, then the spine shrinks from both ends.', args: [10, [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 7], [3, 8], [4, 9]]], expected: [2] },
    { scenario: 'Max path (n = 2·10^4)', hint: 'A 20 000-node path: BFS from every node is O(n²), far too slow — peel leaves layer by layer.', argsGen: '() => [20000, Array.from({ length: 19999 }, (_, i) => [i, i + 1])]', expected: [9999, 10000], timeLimitMs: 1000 },
    { scenario: 'Max random tree (n = 2·10^4)', hint: 'A random tree with shuffled edge order; the centres come from the longest path.', argsGen: '() => { const n = 20000; let s = 21; const r = () => (s = (s * 48271) % 2147483647); const e = []; for (let i = 1; i < n; i++) e.push([Math.max(0, i - 1 - (r() % 3)), i]); for (let i = e.length - 1; i > 0; i--) { const j = r() % (i + 1); [e[i], e[j]] = [e[j], e[i]]; } return [n, e]; }', expected: [9988, 9989], timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findMinHeightTrees(n, edges) {
  if (n <= 2) return Array.from({ length: n }, (_, i) => i);
  const adj = Array.from({ length: n }, () => []);
  const deg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v); adj[v].push(u);
    deg[u]++; deg[v]++;
  }
  let leaves = [];
  for (let i = 0; i < n; i++) if (deg[i] === 1) leaves.push(i);

  let remaining = n;
  while (remaining > 2) {
    remaining -= leaves.length;          // peel the whole layer at once
    const next = [];
    for (const leaf of leaves) {
      for (const nb of adj[leaf]) {
        if (--deg[nb] === 1) next.push(nb);
      }
    }
    leaves = next;
  }
  return leaves;
}`,
    explanation: 'A removed leaf is never touched again: only nodes whose degree drops to exactly 1 enter the next layer, so each node is peeled once.',
  },
  dryRun: { columns: ['layer', 'leaves removed', 'remaining', 'next layer'], rows: [['1', '0, 1, 2, 5', '6 − 4 = 2', '3 (deg 4→1), 4 (deg 2→1)'], ['stop', '—', '2', 'answer [3, 4]']] },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Every node is peeled once and every edge decrements a degree once (from the leaf side).' },
  alternative: {
    title: 'Two BFS passes (diameter)',
    md: 'BFS from any node to the farthest node a; BFS from a to the farthest node b, recording parents. The centers are the middle one or two nodes of the path a → b.',
    complexity: 'O(n) time and space',
  },
  mistakes: [
    'Stopping only when one node remains (two centers are possible).',
    'Not handling n = 1 (no edges) and n = 2.',
    'Removing leaves one at a time from a queue without tracking layers — you may peel past the centers.',
  ],
};
