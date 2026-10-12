export default {
  id: 'connecting-cities-with-minimum-cost',
  title: 'Connecting Cities With Minimum Cost',
  difficulty: 'Medium',
  order: 1,
  pattern: 'mst-kruskal',
  tags: ['graph', 'minimum spanning tree', 'union find', 'sorting'],
  source: { platform: 'LeetCode', number: 1135, url: 'https://leetcode.com/problems/connecting-cities-with-minimum-cost/', premium: true },

  statement: `There are \`n\` cities numbered \`1\` to \`n\`. You are given \`connections\`, where \`connections[i] = [a, b, cost]\` means a two-way road between cities \`a\` and \`b\` can be built for \`cost\`.

Return the minimum total cost to build roads so that **every pair of cities is connected** (directly or through other cities). If it is impossible, return \`-1\`.`,
  examples: [
    { input: 'n = 3, connections = [[1,2,5],[1,3,6],[2,3,1]]', output: '6', explanation: 'Build 2–3 (1) and 1–2 (5).' },
    { input: 'n = 4, connections = [[1,2,3],[3,4,4]]', output: '-1', explanation: '{1,2} and {3,4} can never be joined.' },
  ],
  constraints: ['1 <= n <= 10^4', '1 <= connections.length <= 10^4', '1 <= a, b <= n', 'a != b', '0 <= cost <= 10^5'],

  think: `- What does "every pair connected, minimum total cost" describe?
- Cities are 1-indexed — how big should your Union Find be?
- How do you detect the impossible case?`,
  patternChallenge: {
    options: ['BFS from city 1', 'Dijkstra from city 1', 'Topological sort', "Kruskal's algorithm"],
    answer: 3,
    explanation: 'All cities must be connected and we pay for every road built once → MST. The input is an edge list → Kruskal. BFS/Dijkstra minimise distance from a single source, not total construction cost.',
  },
  hints: [
    'Sort roads by cost and use Union Find. Allocate `new UnionFind(n + 1)` so city n is a valid index.',
    'Count accepted roads; if you reach n − 1 you are done, otherwise return -1.',
  ],
  approach: `**Brute force:** try every subset of roads — exponential.

**Kruskal:** sort connections by cost; for each, \`uf.union(a, b)\` — if it succeeds add the cost. After n − 1 successful unions every city is connected. If the list ends earlier, return -1. UnionFind is the toolkit global; index 0 is simply unused.`,

  functionName: 'minimumCost',
  paramNames: ['n', 'connections'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} connections
 * @return {number}
 */
function minimumCost(n, connections) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Build 2–3 (1) and 1–2 (5).', args: [3, [[1, 2, 5], [1, 3, 6], [2, 3, 1]]], expected: 6 },
    { scenario: 'Example 2', hint: '{1,2} and {3,4} can never be joined — return -1.', args: [4, [[1, 2, 3], [3, 4, 4]]], expected: -1 },
    { scenario: 'Two cities, one road', hint: 'The smallest connected case: the single road is the answer.', args: [2, [[1, 2, 7]]], expected: 7 },
    { scenario: 'Highest city index used', hint: 'Cities are 1..n: new UnionFind(n) has no slot for city n. Allocate n + 1 or shift to 0-based.', args: [3, [[2, 3, 4], [1, 3, 2]]], expected: 6 },
    { scenario: 'Parallel roads', hint: 'Two roads between the same pair: keep the cheaper one.', args: [2, [[1, 2, 7], [2, 1, 2]]], expected: 2 },
    { scenario: 'Cheap road closes a cycle', hint: 'Skip any road whose cities are already connected.', args: [5, [[1, 2, 4], [1, 3, 1], [2, 3, 2], [2, 4, 5], [3, 4, 8], [4, 5, 3]]], expected: 11 },
    { scenario: 'Zero-cost roads', hint: 'Cost 0 is allowed; the total can be 0.', args: [4, [[1, 2, 0], [2, 3, 0], [3, 4, 0], [1, 4, 5]]], expected: 0 },
    { scenario: 'One city left out', hint: 'City 3 has no road — the partial total 1 is wrong; return -1.', args: [3, [[1, 2, 1]]], expected: -1 },
    { scenario: 'All costs equal', hint: 'Any spanning tree works: (n − 1) × cost.', args: [4, [[1, 2, 1], [1, 3, 1], [1, 4, 1], [2, 3, 1], [3, 4, 1]]], expected: 3 },
    { scenario: 'Default sort trap', hint: 'sort() without a comparator orders roads as strings ("1,2,100" < "2,3,1"); sort by cost.', args: [3, [[1, 2, 100], [1, 3, 50], [2, 3, 1]]], expected: 51 },
    { scenario: 'Maximum costs', hint: 'Costs up to 10^5 per road.', args: [3, [[1, 2, 100000], [2, 3, 100000], [1, 3, 100000]]], expected: 200000 },
    { scenario: 'Large input (n = 10^4)', hint: 'Sort the roads once and use Union Find: O(m log m).', argsGen: '() => { let x = 97531; const r = () => (x = (x * 48271) % 2147483647); const n = 10000, e = []; for (let i = 2; i <= n; i++) e.push([1 + r() % (i - 1), i, r() % 100001]); return [n, e.concat([[1, n, 0]])]; }', expected: 505438153, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minimumCost(n, connections) {
  if (n === 1) return 0;
  connections.sort((x, y) => x[2] - y[2]);
  const uf = new UnionFind(n + 1);      // cities are 1..n
  let total = 0, used = 0;
  for (const [a, b, cost] of connections) {
    if (uf.union(a, b)) {
      total += cost;
      if (++used === n - 1) return total;
    }
  }
  return -1;
}`,
  },
  dryRun: {
    columns: ['road (sorted)', 'union?', 'total', 'used'],
    rows: [
      ['[2,3,1]', 'yes', '1', '1'],
      ['[1,2,5]', 'yes', '6', '2 = n − 1 → return 6'],
    ],
  },
  complexity: { time: 'O(m log m)', space: 'O(n)', explanation: 'Sorting the m connections dominates; Union Find uses O(n) and each operation is ~O(1).' },
  alternative: {
    title: 'Prim with a heap',
    md: 'Build an adjacency list over 1..n, grow from city 1 with `new MinHeap(e => e[0])`, skip stale entries, and check that all n cities were added.',
    complexity: 'O(m log m) time, O(n + m) space',
  },
  mistakes: [
    '`new UnionFind(n)` with 1-indexed cities → index n is out of range.',
    'Forgetting the impossible case.',
    'Default `sort()` on arrays.',
  ],
};
