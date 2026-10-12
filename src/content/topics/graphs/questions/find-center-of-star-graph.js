export default {
  id: 'find-center-of-star-graph',
  title: 'Find Center of Star Graph',
  difficulty: 'Easy',
  order: 1,
  pattern: 'graph-adjacency-representation',
  tags: ['graph', 'degree'],
  source: { platform: 'LeetCode', number: 1791, url: 'https://leetcode.com/problems/find-center-of-star-graph/' },

  statement: `An undirected **star graph** has \`n\` vertices labelled \`1..n\`: one special *center* vertex is connected to every other vertex, and there are no other edges (so there are exactly \`n − 1\` edges).

You are given the edges as a 2D array \`edges\` where \`edges[i] = [u, v]\`. Return the label of the center.`,
  examples: [
    { input: 'edges = [[1,2],[2,3],[4,2]]', output: '2', explanation: 'Vertex 2 appears in every edge.' },
    { input: 'edges = [[1,2],[5,1],[1,3],[1,4]]', output: '1' },
  ],
  constraints: ['3 <= n <= 10^5', 'edges.length == n - 1', 'The input is guaranteed to be a valid star graph'],

  think: `- What is the **degree** of the center? What is the degree of every other vertex?
- Do you need to look at all edges, or is a tiny part of the input enough?`,
  patternChallenge: {
    options: ['Breadth-First Search from vertex 1', 'Sorting + two pointers', 'Graph representation / degree counting', 'Union-Find'],
    answer: 2,
    explanation: 'The center is defined by its degree (n − 1), so no traversal is needed. Even simpler: the center belongs to every edge, so it is the vertex shared by the first two edges. BFS or Union-Find would work but model far more than the question asks.',
  },
  hints: [
    'Counting degrees in an array of size n + 1 works in O(n): the vertex with degree n − 1 is the center.',
    'The center is in **every** edge — so it must be the vertex that edges[0] and edges[1] have in common.',
  ],
  approach: `**Degree counting (general):** make \`deg = new Array(n + 1).fill(0)\`, add 1 to both endpoints of each edge, return the vertex whose degree is \`edges.length\`. O(n) time and space.

**Optimized (O(1)):** every edge contains the center, so the first two edges share exactly one vertex — the center. Compare \`edges[0][0]\` with both endpoints of \`edges[1]\`; if it matches either, it is the center, otherwise \`edges[0][1]\` is.`,

  functionName: 'findCenter',
  paramNames: ['edges'],
  starterCode: `/**
 * @param {number[][]} edges
 * @return {number}
 */
function findCenter(edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Vertex 2 appears in every edge — the basic case from the statement.', args: [[[1,2],[2,3],[4,2]]], expected: 2 },
    { scenario: 'Example 2', hint: 'The center is 1 and sits in different positions across the edges.', args: [[[1,2],[5,1],[1,3],[1,4]]], expected: 1 },
    { scenario: 'Smallest star (n = 3)', hint: 'Only two edges exist; the shared vertex is the center.', args: [[[1,3],[2,3]]], expected: 3 },
    { scenario: 'Center second in edge 0', hint: 'Assuming the center is always edges[0][0] fails here — compare against the second edge.', args: [[[3,1],[1,2]]], expected: 1 },
    { scenario: 'Center second in both edges', hint: 'The center is the second element of the first two edges.', args: [[[2,4],[3,4],[4,1]]], expected: 4 },
    { scenario: 'Center first in edge 0 only', hint: 'edges[0][0] matches edges[1][1]: check both ends of the second edge.', args: [[[5,2],[1,5],[5,3],[4,5]]], expected: 5 },
    { scenario: 'Center is the largest label', hint: 'With 1-based labels, a degree array of size n misses vertex n — size it n + 1.', args: [[[1,6],[2,6],[6,3],[4,6],[6,5]]], expected: 6 },
    { scenario: 'Center is label 1', hint: 'The smallest label can be the center too.', args: [[[2,1],[1,3],[4,1]]], expected: 1 },
    { scenario: 'Unordered leaves', hint: 'Leaves appear in any order; only the shared vertex matters.', args: [[[7,4],[4,1],[2,4],[4,3],[5,4],[4,6]]], expected: 4 },
    { scenario: 'Large star, center 1 (n = 10^5)', hint: 'Only the first two edges are needed; a full scan is fine but BFS on 10^5 nodes is unnecessary.', argsGen: '() => [Array.from({ length: 99999 }, (_, i) => (i % 2 ? [1, i + 2] : [i + 2, 1]))]', expected: 1 },
    { scenario: 'Large star, center n (n = 10^5)', hint: 'The center has the largest label 100000 — an off-by-one degree array loses it.', argsGen: '() => [Array.from({ length: 99999 }, (_, i) => (i % 2 ? [100000, i + 1] : [i + 1, 100000]))]', expected: 100000 },
  ],

  solution: {
    code: `function findCenter(edges) {
  const [a, b] = edges[0];
  const [c, d] = edges[1];
  // The center is the only vertex in both of the first two edges.
  return a === c || a === d ? a : b;
}`,
    explanation: 'Two edges of a star share exactly the center, so one comparison decides.',
  },
  dryRun: { columns: ['edges[0]', 'edges[1]', 'a === c || a === d?', 'answer'], rows: [['[1,2]', '[2,3]', '1 is not 2 or 3 → no', 'b = 2'], ['[1,2]', '[5,1]', '1 === 1 → yes', 'a = 1']] },
  complexity: { time: 'O(1)', space: 'O(1)', explanation: 'Only the first two edges are read.' },
  alternative: {
    title: 'Degree counting',
    md: 'Count the degree of every vertex; the center has degree n − 1. This generalises to "find a vertex with a given degree" when the graph is not guaranteed to be a star.',
    code: `function findCenter(edges) {
  const deg = new Array(edges.length + 2).fill(0);
  for (const [u, v] of edges) { deg[u]++; deg[v]++; }
  return deg.findIndex((d) => d === edges.length);
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Allocating deg with size n instead of n + 1 when labels are 1-based.',
    'Building a full adjacency list and running BFS — correct but unnecessary.',
    'Assuming the center is always edges[0][0] (it may be the second element).',
  ],
};
