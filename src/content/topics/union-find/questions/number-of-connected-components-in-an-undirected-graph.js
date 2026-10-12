export default {
  id: 'number-of-connected-components-in-an-undirected-graph',
  title: 'Number of Connected Components in an Undirected Graph',
  difficulty: 'Medium',
  order: 2,
  pattern: 'union-find-connectivity',
  tags: ['graph', 'union find'],
  source: { platform: 'LeetCode', number: 323, url: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', premium: true },

  statement: `You have a graph with \`n\` nodes labelled \`0\` to \`n - 1\` and a list of undirected \`edges\`, where \`edges[i] = [a, b]\` joins nodes \`a\` and \`b\`.

Return the number of connected components (groups of nodes that can reach each other).`,
  examples: [
    { input: 'n = 5, edges = [[0,1],[1,2],[3,4]]', output: '2' },
    { input: 'n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]', output: '1' },
  ],
  constraints: ['1 <= n <= 2000', '0 <= edges.length <= 5000', 'No duplicate edges and no self-loops'],

  think: `- How many components are there before any edge is added?
- Does every edge reduce the number of components? When does it not?`,
  patternChallenge: {
    options: ['Union Find (Dynamic Connectivity)', 'Two Pointers', 'Dynamic Programming', 'Monotonic Stack'],
    answer: 0,
    explanation: 'Counting connected components from an edge list is the canonical DSU use: components = n − successful unions. The other patterns operate on sequences, not connectivity.',
  },
  hints: [
    'Start with n components. An edge between two different components merges them.',
    'An edge whose endpoints already share a root does not change the count (union returns false).',
  ],
  approach: `**Brute force / DFS:** build an adjacency list, DFS from every unvisited node, count the starts. O(n + E).

**Union Find:** \`new UnionFind(n)\`, union every edge, return \`uf.count\`. O(n + E · α(n)) with no adjacency list and no recursion.`,

  functionName: 'countComponents',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number}
 */
function countComponents(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two groups: {0,1,2} and {3,4}.', args: [5, [[0, 1], [1, 2], [3, 4]]], expected: 2 },
    { scenario: 'Example 2', hint: 'A single path connects everything: one component.', args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], expected: 1 },
    { scenario: 'Single node', hint: 'One node with no edges is one component.', args: [1, []], expected: 1 },
    { scenario: 'No edges', hint: 'Every isolated node is its own component — start the count at n.', args: [4, []], expected: 4 },
    { scenario: 'Cycle plus isolated node', hint: 'n − edges.length gives 1 here; the triangle\'s third edge merges nothing, so the answer is 2.', args: [4, [[0, 1], [1, 2], [2, 0]]], expected: 2 },
    { scenario: 'Pairs merged later', hint: 'Three pairs are joined into one group by later edges; [3,0] closes a cycle and must not decrement the count.', args: [6, [[0, 1], [2, 3], [4, 5], [1, 2], [3, 0]]], expected: 2 },
    { scenario: 'Edge between high labels', hint: 'Node 0 stays isolated while 1 and 2 join: 2 components.', args: [3, [[2, 1]]], expected: 2 },
    { scenario: 'Complete graph', hint: 'Many redundant edges; counting edges instead of successful unions over-subtracts.', args: [4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]], expected: 1 },
    { scenario: 'Two nodes, one edge', hint: 'The smallest connected graph with an edge.', args: [2, [[0, 1]]], expected: 1 },
    { scenario: 'Star centred on last node', hint: 'All edges touch node 5; one component.', args: [6, [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5]]], expected: 1 },
    { scenario: 'Max size, many components', hint: '2000 nodes in groups of 4 (each a 4-cycle, 2000 edges): 500 components. Redundant cycle edges must not reduce the count.', argsGen: '() => { const e = []; for (let g = 0; g < 2000; g += 4) for (let k = 0; k < 4; k++) e.push([g + k, g + ((k + 1) % 4)]); return [2000, e]; }', expected: 500 },
    { scenario: 'Max size, random edges', hint: '5000 random distinct edges over 2000 nodes: a giant component plus a few stragglers.', argsGen: '() => { let s = 3; const r = () => (s = (s * 48271) % 2147483647); const m = new Map(); while (m.size < 5000) { let a = r() % 2000, b = r() % 2000; if (a === b) continue; if (a > b) [a, b] = [b, a]; m.set(a * 2000 + b, [a, b]); } return [2000, [...m.values()]]; }', expected: 15 },
  ],

  solution: {
    code: `function countComponents(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array(n).fill(1);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];   // path halving
      x = parent[x];
    }
    return x;
  };
  let components = n;
  for (const [a, b] of edges) {
    let ra = find(a), rb = find(b);
    if (ra === rb) continue;           // already connected
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;                   // union by size
    size[ra] += size[rb];
    components--;
  }
  return components;
}`,
    explanation: 'Hand-written DSU so you can practise it; `new UnionFind(n)` from the toolkit gives the same result in three lines.',
  },
  dryRun: {
    columns: ['edge', 'roots', 'action', 'components'],
    rows: [
      ['start', '', '', '5'],
      ['[0,1]', '0,1', 'merge', '4'],
      ['[1,2]', '0,2', 'merge', '3'],
      ['[3,4]', '3,4', 'merge', '2'],
    ],
  },
  complexity: { time: 'O(n + E · α(n))', space: 'O(n)', explanation: 'Initialising the arrays is O(n); each edge does two near-constant finds.' },
  alternative: {
    title: 'DFS with adjacency list',
    md: 'Build `adj`, keep `seen`, DFS from each unseen node and count. Same asymptotic cost, but needs O(n + E) extra memory for the adjacency list.',
    complexity: 'O(n + E) time and space',
  },
  mistakes: ['Returning n − edges.length (wrong when edges form cycles).', 'Forgetting isolated nodes — they are components too.'],
};
