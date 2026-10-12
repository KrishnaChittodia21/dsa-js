export default {
  id: 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance',
  title: 'Find the City With the Smallest Number of Neighbors at a Threshold Distance',
  difficulty: 'Medium',
  order: 5,
  pattern: 'shortest-path-floyd-warshall',
  tags: ['graph', 'shortest path', 'floyd-warshall', 'all pairs'],
  source: { platform: 'LeetCode', number: 1334, url: 'https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/' },

  statement: `There are \`n\` cities numbered \`0\` to \`n - 1\` connected by **bidirectional** weighted roads \`edges[i] = [a, b, weight]\`, and an integer \`distanceThreshold\`.

For each city, count how many **other** cities can be reached with a shortest-path distance **at most** \`distanceThreshold\`. Return the city with the **smallest** such count. If several cities tie, return the one with the **largest** number.`,
  examples: [
    { input: 'n = 4, edges = [[0,1,3],[1,2,1],[1,3,4],[2,3,1]], distanceThreshold = 4', output: '3', explanation: 'Cities 0 and 3 each reach 2 others within distance 4; the larger label, 3, wins.' },
    { input: 'n = 5, edges = [[0,1,2],[0,4,8],[1,2,3],[1,4,2],[2,3,1],[3,4,1]], distanceThreshold = 2', output: '0', explanation: 'City 0 reaches only city 1 within distance 2.' },
  ],
  constraints: ['2 <= n <= 100', '1 <= edges.length <= n·(n−1)/2', '1 <= weight, distanceThreshold <= 10^4', 'All pairs (a, b) are distinct'],

  think: `- You need distances from **every** city, not just one. How many sources is that?
- n ≤ 100 — what does that allow in terms of complexity?
- Tie-break: which loop direction makes "largest label on tie" automatic?`,
  patternChallenge: {
    options: ['Floyd-Warshall all-pairs shortest paths', 'Single BFS from city 0', 'Union-Find connectivity', 'Topological sort'],
    answer: 0,
    explanation: 'Every city needs its distances to every other city, and n ≤ 100 makes O(n³) = 10^6 trivial. BFS ignores weights and would only give one source; Union-Find tells connectivity, not distance; the graph is undirected, so no topological order exists.',
  },
  hints: [
    'Build an n × n distance matrix: 0 on the diagonal, the road weight for each road (both directions), Infinity elsewhere.',
    'Run Floyd-Warshall (k outermost). Then for each city count j ≠ i with d[i][j] ≤ threshold; scan cities in increasing order and use `<=` so later (larger) cities win ties.',
  ],
  approach: `**Brute force:** for each city, DFS every path and track the shortest distance to each other city — exponential.

**Better:** run Dijkstra from each city: O(n · E log n).

**Simplest (Floyd-Warshall):** O(n³) with three short loops:
1. \`d[i][j] = 0\` if i = j, road weight if a road exists, else Infinity.
2. For k, i, j: \`d[i][j] = min(d[i][j], d[i][k] + d[k][j])\`.
3. Count reachable cities per i; keep the city with the smallest count, preferring larger i on ties.`,

  functionName: 'findTheCity',
  paramNames: ['n', 'edges', 'distanceThreshold'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @param {number} distanceThreshold
 * @return {number}
 */
function findTheCity(n, edges, distanceThreshold) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Cities 0 and 3 both reach 2 others; the tie goes to the larger label, 3.', args: [4,[[0,1,3],[1,2,1],[1,3,4],[2,3,1]],4], expected: 3 },
    { scenario: 'Example 2', hint: 'City 0 reaches only city 1 within distance 2 — the unique minimum.', args: [5,[[0,1,2],[0,4,8],[1,2,3],[1,4,2],[2,3,1],[3,4,1]],2], expected: 0 },
    { scenario: 'Two cities, road too long', hint: 'Smallest input: both cities reach 0 others, so the larger label 1 wins the tie.', args: [2,[[0,1,5]],4], expected: 1 },
    { scenario: 'Distance equals threshold', hint: 'A distance exactly equal to the threshold counts ("at most"). Both cities reach 1 → answer 1.', args: [2,[[0,1,5]],5], expected: 1 },
    { scenario: 'Every city ties', hint: 'All four cities reach exactly one neighbour. Using `<` in the tie-break returns 0; ties must go to the largest label. (Counting the city itself changes nothing — it adds 1 to everyone.)', args: [4,[[0,1,1],[2,3,1]],10], expected: 3 },
    { scenario: 'Detour shorter than direct road', hint: 'The direct road 0–1 costs 10 but 0–2–1 costs 2. Without the all-pairs relaxation, city 0 looks like it reaches fewer cities.', args: [3,[[0,1,10],[0,2,1],[2,1,1]],2], expected: 2 },
    { scenario: 'Roads work both ways', hint: 'Roads are bidirectional. Storing only d[a][b] makes the high-numbered cities look isolated.', args: [4,[[1,0,1],[2,1,1],[3,2,1]],1], expected: 3 },
    { scenario: 'Chain needs outer k loop', hint: 'The shortest path passes through intermediate cities in an order that the "k innermost" loop cannot discover. k (the stop-over) must be the OUTERMOST loop.', args: [6,[[3,4,2],[5,3,2],[2,5,1],[3,1,2],[1,0,3],[2,3,2]],7], expected: 5 },
    { scenario: 'Threshold below every road', hint: 'Nobody reaches anybody, so every count is 0 and the largest label wins.', args: [5,[[0,1,7],[1,2,8],[2,3,9],[3,4,10]],6], expected: 4 },
    { scenario: 'Star graph', hint: 'The hub reaches everyone; each leaf reaches the hub and (via the hub) the other leaves only if 2·w ≤ threshold.', args: [5,[[0,1,2],[0,2,2],[0,3,2],[0,4,3]],4], expected: 4 },
    { scenario: 'Complete graph (n = 100)', hint: 'The maximum input: 4950 roads. Floyd–Warshall is 10^6 steps; exploring all simple paths from each city is hopeless.', argsGen: '() => { let s = 12345; const rnd = (m) => (s = (s * 48271) % 2147483647) % m; const e = []; for (let i = 0; i < 100; i++) for (let j = i + 1; j < 100; j++) e.push([i, j, 1 + rnd(10000)]); return [100, e, 900]; }', expected: 59, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findTheCity(n, edges, distanceThreshold) {
  const d = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [a, b, w] of edges) {
    d[a][b] = Math.min(d[a][b], w);
    d[b][a] = Math.min(d[b][a], w);
  }

  for (let k = 0; k < n; k++) {            // allowed stop-over, outermost
    for (let i = 0; i < n; i++) {
      if (d[i][k] === Infinity) continue;  // small speed-up
      for (let j = 0; j < n; j++) {
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
      }
    }
  }

  let bestCity = -1, bestCount = Infinity;
  for (let i = 0; i < n; i++) {
    let count = 0;
    for (let j = 0; j < n; j++) if (j !== i && d[i][j] <= distanceThreshold) count++;
    if (count <= bestCount) {              // <= → larger index wins ties
      bestCount = count;
      bestCity = i;
    }
  }
  return bestCity;
}`,
  },
  dryRun: {
    columns: ['city', 'distances to others', 'within 4', 'count'],
    rows: [
      ['0', '1:3, 2:4, 3:5', '1, 2', '2'],
      ['1', '0:3, 2:1, 3:2', '0, 2, 3', '3'],
      ['2', '0:4, 1:1, 3:1', '0, 1, 3', '3'],
      ['3', '0:5, 1:2, 2:1', '1, 2', '2 → ties with 0, larger label 3 wins'],
    ],
  },
  complexity: { time: 'O(n³)', space: 'O(n²)', explanation: 'Three nested loops over n ≤ 100 → 10^6 relaxations.' },
  alternative: {
    title: 'Dijkstra from every city',
    md: 'Run Dijkstra n times and count distances ≤ threshold (you can stop exploring once a popped distance exceeds the threshold). O(n · E log n); better for large sparse graphs.',
    complexity: 'O(n · E log n) time, O(n + E) space',
  },
  mistakes: [
    'Putting k in the inner loop.',
    'Adding roads in one direction only.',
    'Counting the city itself (d[i][i] = 0 ≤ threshold).',
    'Using `<` in the tie-break, which returns the smallest label instead of the largest.',
  ],
};
