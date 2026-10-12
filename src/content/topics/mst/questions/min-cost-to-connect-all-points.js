export default {
  id: 'min-cost-to-connect-all-points',
  title: 'Min Cost to Connect All Points',
  difficulty: 'Medium',
  order: 2,
  pattern: 'mst-prim-dense',
  tags: ['graph', 'minimum spanning tree', 'geometry', 'prim'],
  source: { platform: 'LeetCode', number: 1584, url: 'https://leetcode.com/problems/min-cost-to-connect-all-points/' },

  statement: `You are given an array \`points\` where \`points[i] = [x, y]\` is a point on a 2D grid. Connecting points \`i\` and \`j\` costs their **Manhattan distance** \`|xi - xj| + |yi - yj|\`.

Return the minimum total cost to connect all points, where "connected" means there is exactly one simple path between any two points (i.e. the connections form a tree).`,
  examples: [
    { input: 'points = [[0,0],[2,2],[3,10],[5,2],[7,0]]', output: '20' },
    { input: 'points = [[3,12],[-2,5],[-4,1]]', output: '18' },
    { input: 'points = [[0,0]]', output: '0' },
  ],
  constraints: ['1 <= points.length <= 1000', '-10^6 <= xi, yi <= 10^6', 'All points are distinct'],

  think: `- How many possible connections are there for n = 1000 points?
- Do you need to store all of them, or can you compute a distance only when you need it?
- Which MST algorithm does not need an edge list at all?`,
  patternChallenge: {
    options: ['Kruskal on a pre-sorted edge list only', 'Dense Prim (O(n²) with a minCost array)', 'Sort points by x and connect neighbours', 'BFS on the grid'],
    answer: 1,
    explanation: 'Every pair of points can be connected → complete graph with ~n²/2 edges. Dense Prim computes each distance on the fly in O(n²) total with O(n) memory. Kruskal works but must build and sort 500k edges. Connecting x-neighbours is not optimal in general; a grid BFS over coordinates up to 10^6 is infeasible.',
  },
  hints: [
    'It is an MST on a complete graph. Keep `minCost[i]` = cheapest known connection from the tree to point i.',
    'Repeat n times: pick the non-tree point with the smallest minCost (linear scan), add it, then update minCost for every other non-tree point using its distance to the new point.',
  ],
  approach: `**Brute force / Kruskal:** generate all n(n−1)/2 edges, sort them, Kruskal. O(n² log n) time and O(n²) memory — works for n = 1000 but heavy.

**Dense Prim:**
1. \`minCost = Array(n).fill(Infinity)\`, \`minCost[0] = 0\`, \`inTree\` all false.
2. n rounds: find the non-tree point \`u\` with the smallest \`minCost\` (O(n) scan). Add it; \`total += minCost[u]\`.
3. For every non-tree point \`v\`, \`minCost[v] = min(minCost[v], dist(u, v))\`.

Each round is O(n) → O(n²) total, O(n) memory. Correct by the cut property: \`minCost[u]\` is the cheapest edge crossing the (tree, rest) cut.`,

  functionName: 'minCostConnectPoints',
  paramNames: ['points'],
  starterCode: `/**
 * @param {number[][]} points
 * @return {number}
 */
function minCostConnectPoints(points) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Connect the five points with total Manhattan cost 20.', args: [[[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]], expected: 20 },
    { scenario: 'Example 2', hint: 'Negative coordinates: distances use absolute differences.', args: [[[3, 12], [-2, 5], [-4, 1]]], expected: 18 },
    { scenario: 'Example 3', hint: 'A single point needs no connections: 0.', args: [[[0, 0]]], expected: 0 },
    { scenario: 'Two points', hint: 'The only edge is the answer: |dx| + |dy|.', args: [[[1, 2], [4, -2]]], expected: 7 },
    { scenario: 'Manhattan, not Euclidean', hint: 'Diagonal neighbours cost |dx| + |dy| = 2, not √2. Using Euclidean distance gives a non-integer total.', args: [[[0, 0], [1, 1], [1, 0], [-1, 1]]], expected: 4 },
    { scenario: 'Extreme coordinates', hint: 'Opposite corners of the ±10^6 range: distance 4·10^6.', args: [[[-1000000, -1000000], [1000000, 1000000]]], expected: 4000000 },
    { scenario: 'Collinear points', hint: 'Points on a line: the tree is the chain of neighbours.', args: [[[0, 0], [0, 5], [0, 10], [0, 15]]], expected: 15 },
    { scenario: 'Grow from whole tree', hint: 'Always attach the point closest to ANY tree point, not just the last one added — a nearest-neighbour chain overpays.', args: [[[0, 0], [10, 0], [-1, 0], [11, 0]]], expected: 12 },
    { scenario: 'Mixed negative points', hint: 'Scattered points with negative coordinates.', args: [[[2, -3], [-17, -8], [13, 8], [-17, -15]]], expected: 53 },
    { scenario: 'Square grid', hint: 'A 3×3 grid with spacing 1: eight unit edges.', args: [[[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]], expected: 8 },
    { scenario: 'Star around a center', hint: 'Every outer point is closest to the center.', args: [[[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]]], expected: 20 },
    { scenario: 'Large input (n = 1000)', hint: 'Enumerating trees is hopeless; dense Prim runs in O(n²) with O(n) memory.', argsGen: '() => { let x = 13579; const r = () => (x = (x * 48271) % 2147483647); const seen = new Set(), pts = []; while (pts.length < 1000) { const a = r() % 2000001 - 1000000, b = r() % 2000001 - 1000000; const k = a + \',\' + b; if (!seen.has(k)) { seen.add(k); pts.push([a, b]); } } return [pts]; }', expected: 51885386, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minCostConnectPoints(points) {
  const n = points.length;
  const minCost = new Array(n).fill(Infinity);
  const inTree = new Uint8Array(n);
  minCost[0] = 0;
  let total = 0;
  for (let round = 0; round < n; round++) {
    // 1. closest point not yet in the tree
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!inTree[v] && (u === -1 || minCost[v] < minCost[u])) u = v;
    }
    inTree[u] = 1;
    total += minCost[u];
    // 2. relax: can u offer a cheaper connection to anyone outside?
    const [x, y] = points[u];
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const d = Math.abs(x - points[v][0]) + Math.abs(y - points[v][1]);
      if (d < minCost[v]) minCost[v] = d;
    }
  }
  return total;
}`,
  },
  dryRun: {
    columns: ['round', 'picked', 'cost', 'total', 'minCost after relax (P0..P4)'],
    rows: [
      ['1', 'P0 (0,0)', '0', '0', '[–, 4, 13, 7, 7]'],
      ['2', 'P1 (2,2)', '4', '4', '[–, –, 9, 3, 7]'],
      ['3', 'P3 (5,2)', '3', '7', '[–, –, 9, –, 4]'],
      ['4', 'P4 (7,0)', '4', '11', '[–, –, 9, –, –]'],
      ['5', 'P2 (3,10)', '9', '20', '—'],
    ],
  },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'n rounds, each with an O(n) scan and an O(n) relaxation. No edge list is ever built.' },
  alternative: {
    title: 'Kruskal on all pairs',
    md: 'Build every `[i, j, dist]`, sort, Union Find. Simple to write but O(n² log n) time and ~n²/2 stored edges (500k arrays for n = 1000). Heap Prim is similar: O(n² log n).',
    complexity: 'O(n² log n) time, O(n²) space',
  },
  mistakes: [
    'Using Euclidean distance — the problem says Manhattan.',
    'Building all n² edges when the dense O(n²) algorithm needs none.',
    'Forgetting to skip in-tree points when picking the minimum (you would pick the same point again).',
  ],
};
