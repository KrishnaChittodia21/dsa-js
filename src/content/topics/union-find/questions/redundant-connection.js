export default {
  id: 'redundant-connection',
  title: 'Redundant Connection',
  difficulty: 'Medium',
  order: 3,
  pattern: 'union-find-connectivity',
  tags: ['graph', 'union find', 'cycle detection'],
  source: { platform: 'LeetCode', number: 684, url: 'https://leetcode.com/problems/redundant-connection/' },

  statement: `A tree with \`n\` nodes (labelled \`1\` to \`n\`) had **one extra edge** added, so the graph now has exactly one cycle. The edges are given in \`edges\`, each \`[a, b]\` undirected.

Return an edge that can be removed so the remaining graph is a tree. If several edges qualify, return the one that appears **last** in the input.`,
  examples: [
    { input: 'edges = [[1,2],[1,3],[2,3]]', output: '[2,3]' },
    { input: 'edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]', output: '[1,4]' },
  ],
  constraints: ['n == edges.length', '3 <= n <= 1000', '1 <= a < b <= n', 'No repeated edges; the graph is connected'],

  think: `- If you add edges one by one, at which moment does the cycle appear?
- Why is the edge that *closes* the cycle also the last one of the cycle in input order?`,
  patternChallenge: {
    options: ['Topological Sort', 'Union Find (Dynamic Connectivity)', 'Binary Search', 'Greedy by sorting edges'],
    answer: 1,
    explanation: 'Adding edges in order and asking "were these endpoints already connected?" is DSU cycle detection: the first union that fails is the answer. Topological sort is for directed graphs; the graph here is undirected.',
  },
  hints: [
    'Process edges in input order and union their endpoints.',
    'The first edge whose endpoints already share a root closes the cycle. Every other cycle edge came earlier, so this is the last cycle edge in input order.',
  ],
  approach: `**Brute force:** for each edge from last to first, remove it and check with DFS whether the rest is a connected tree. O(n²).

**Union Find:** nodes are 1..n, so allocate n + 1 slots. For each edge in order, \`if (!uf.union(a, b)) return [a, b]\`.

Why is it the *last* candidate? Only edges on the cycle can be removed. While scanning, the cycle is incomplete until its final edge arrives — that edge is the one whose union fails, and it is the latest cycle edge in the input.`,

  functionName: 'findRedundantConnection',
  paramNames: ['edges'],
  starterCode: `/**
 * @param {number[][]} edges
 * @return {number[]}
 */
function findRedundantConnection(edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A triangle: the third edge closes the cycle.', args: [[[1, 2], [1, 3], [2, 3]]], expected: [2, 3] },
    { scenario: 'Example 2', hint: 'A 4-cycle plus a pendant edge — the pendant [1,5] is not on the cycle and must never be returned.', args: [[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]], expected: [1, 4] },
    { scenario: 'Cycle closed mid-list', hint: 'The redundant edge is not the last edge of the input; return as soon as a union fails rather than keeping the last failure seen.', args: [[[1, 4], [3, 4], [1, 3], [1, 2], [4, 5]]], expected: [1, 3] },
    { scenario: 'Smallest graph (n = 3)', hint: 'With 3 nodes the whole graph is the cycle, so the answer is the last edge.', args: [[[1, 3], [2, 3], [1, 2]]], expected: [1, 2] },
    { scenario: 'Cycle uses node n', hint: 'Nodes are 1-indexed: if you allocate only n slots, node n is out of range and its union misbehaves.', args: [[[1, 5], [2, 5], [3, 4], [2, 3], [4, 5]]], expected: [4, 5] },
    { scenario: 'Closing edge is not first cycle edge', hint: 'Every cycle edge is removable, but the required one is the one appearing last — which is exactly the edge whose union fails, not the first cycle edge you saw.', args: [[[3, 4], [1, 2], [2, 4], [3, 5], [2, 5]]], expected: [2, 5] },
    { scenario: 'Edges out of order', hint: 'Components grow separately before they meet; the cycle only appears with [4,5].', args: [[[1, 5], [3, 4], [3, 5], [4, 5], [2, 4]]], expected: [4, 5] },
    { scenario: 'Two branches joined late', hint: 'Two chains are built independently and the final edge [1,6] joins their ends into a cycle.', args: [[[2, 3], [5, 6], [1, 2], [4, 5], [3, 4], [1, 6]]], expected: [1, 6] },
    { scenario: 'Star with one extra edge', hint: 'All nodes hang off node 1; the leaf-to-leaf edge creates a triangle.', args: [[[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [4, 6]]], expected: [4, 6] },
    { scenario: 'Redundant edge is the first edge', hint: 'The cycle-closing edge can appear before the pendant edges — stop at the first failed union.', args: [[[1, 2], [2, 3], [1, 3], [3, 4], [4, 5], [5, 6]]], expected: [1, 3] },
    { scenario: 'Long chain with no path compression', hint: 'A chain of 1000 nodes can make naive find O(n) per call; path compression or union by rank keeps it fast.', argsGen: '() => { const e = []; for (let i = 1; i < 1000; i++) e.push([i, i + 1]); e.push([1, 1000]); return [e]; }', expected: [1, 1000] },
    { scenario: 'Random tree at max size (n = 1000)', hint: 'A random shuffled tree plus one extra edge: the answer is whichever cycle edge comes last in the input, not necessarily the inserted one.', argsGen: '() => { const n = 1000; const e = []; let s = 7; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); for (let i = 2; i <= n; i++) { const p = 1 + (r() % (i - 1)); e.push([p, i]); } const out = []; const idx = e.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = r() % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; } for (const i of idx) out.push(e[i]); out.splice(600, 0, [500, 1000]); return [out]; }', expected: [19, 23] },
  ],

  solution: {
    code: `function findRedundantConnection(edges) {
  const uf = new UnionFind(edges.length + 1);  // nodes are 1..n
  for (const [a, b] of edges) {
    if (!uf.union(a, b)) return [a, b];        // already connected → closes the cycle
  }
  return [];
}`,
  },
  dryRun: {
    columns: ['edge', 'find(a)', 'find(b)', 'result'],
    rows: [
      ['[1,2]', '1', '2', 'union'],
      ['[2,3]', '1', '3', 'union'],
      ['[3,4]', '1', '4', 'union'],
      ['[1,4]', '1', '1', 'same root → return [1,4]'],
    ],
  },
  complexity: { time: 'O(n · α(n))', space: 'O(n)', explanation: 'One union per edge, n edges.' },
  alternative: {
    title: 'DFS before adding each edge',
    md: 'For each edge [a, b], DFS in the graph built so far to see if a already reaches b; if so, return the edge; otherwise add it. O(n²) in the worst case.',
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: ['Allocating n slots for 1-indexed nodes (index n out of range).', 'Returning the first cycle edge instead of the one that closes it.'],
};
