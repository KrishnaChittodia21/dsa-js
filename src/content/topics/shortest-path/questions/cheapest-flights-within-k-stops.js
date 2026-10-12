export default {
  id: 'cheapest-flights-within-k-stops',
  title: 'Cheapest Flights Within K Stops',
  difficulty: 'Medium',
  order: 6,
  pattern: 'shortest-path-bellman-ford',
  tags: ['graph', 'shortest path', 'bellman-ford', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 787, url: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/' },

  statement: `There are \`n\` cities numbered \`0\` to \`n - 1\` and a list of one-way \`flights[i] = [from, to, price]\`.

Given a start city \`src\`, a destination \`dst\` and an integer \`k\`, return the **cheapest total price** to fly from \`src\` to \`dst\` making **at most \`k\` stops** (intermediate cities). If it is impossible, return \`-1\`.`,
  examples: [
    { input: 'n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1', output: '700', explanation: '0 → 1 → 3 costs 700 with one stop. 0 → 1 → 2 → 3 costs 400 but needs two stops.' },
    { input: 'n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1', output: '200' },
    { input: 'n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0', output: '500' },
  ],
  constraints: ['1 <= n <= 100', '0 <= flights.length <= n·(n−1)/2', '1 <= price <= 10^4', 'No duplicate flights', '0 <= src, dst, k < n', 'src != dst'],

  think: `- How many **flights** (edges) does a route with k stops use?
- Why does keeping only "the cheapest price to each city" fail when stops are limited?
- Bellman-Ford round i finds the cheapest paths with at most i edges. How many rounds do you need?`,
  patternChallenge: {
    options: ['Plain Dijkstra with one distance per city', 'Topological sort', 'Bellman-Ford limited to k + 1 rounds (with a copy of the previous round)', 'Union-Find'],
    answer: 2,
    explanation: '"At most k stops" limits the number of edges. Bellman-Ford rounds correspond exactly to edge counts, so k + 1 rounds (with a copy per round) give the answer. Plain Dijkstra discards pricier-but-shorter routes; the graph may have cycles so topological sort does not apply; Union-Find only answers connectivity.',
  },
  hints: [
    'k stops = k + 1 flights. After round i of Bellman-Ford, price[v] = cheapest cost using at most i flights.',
    'Each round must read the prices from the **previous** round — copy the array first, otherwise one round can chain several flights.',
  ],
  approach: `**Brute force:** DFS all routes with at most k + 1 flights, tracking the minimum price. Exponential.

**Why not plain Dijkstra?** The cheapest way into an intermediate city might use too many stops; a single best price per city throws away the more expensive route with fewer stops.

**Optimized (Bellman-Ford, k + 1 rounds):**
1. \`price = [∞…]\`, \`price[src] = 0\`.
2. Repeat k + 1 times: \`next = price.slice()\`; for each flight \`[u, v, w]\`, if \`price[u] + w < next[v]\` set \`next[v]\`. Then \`price = next\`.
3. Return \`price[dst]\` or \`-1\`.

Alternative: Dijkstra/BFS over states (city, flightsUsed).`,

  functionName: 'findCheapestPrice',
  paramNames: ['n', 'flights', 'src', 'dst', 'k'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} flights
 * @param {number} src
 * @param {number} dst
 * @param {number} k
 * @return {number}
 */
function findCheapestPrice(n, flights, src, dst, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: the cheapest overall route (400) uses too many stops, so the answer is 700.', args: [4,[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]],0,3,1], expected: 700 },
    { scenario: 'Example 2', hint: 'One stop allowed: the two-flight route (200) beats the direct flight (500).', args: [3,[[0,1,100],[1,2,100],[0,2,500]],0,2,1], expected: 200 },
    { scenario: 'Example 3', hint: 'k = 0 means direct flights only, so the cheaper connecting route is not allowed.', args: [3,[[0,1,100],[1,2,100],[0,2,500]],0,2,0], expected: 500 },
    { scenario: 'No flights at all', hint: 'With an empty flight list nothing is reachable — return -1, not Infinity or 0.', args: [2,[],0,1,1], expected: -1 },
    { scenario: 'Two cities, direct flight', hint: 'Smallest useful input: one flight, k = 0. One relaxation round must already see it.', args: [2,[[0,1,5]],0,1,0], expected: 5 },
    { scenario: 'Destination unreachable', hint: 'No route reaches dst at all; return -1 when its price is still Infinity.', args: [3,[[0,1,100]],0,2,1], expected: -1 },
    { scenario: 'Route uses exactly k stops', hint: 'k stops means k + 1 flights. Running only k relaxation rounds misses this 3-flight route.', args: [4,[[0,1,1],[1,2,1],[2,3,1],[0,3,100]],0,3,2], expected: 3 },
    { scenario: 'Cheap chain needs too many stops', hint: 'If you update `price` in place, one round can chain several flights and you report 3 instead of 100. Read last round\'s prices only.', args: [4,[[0,1,1],[1,2,1],[2,3,1],[0,3,100]],0,3,1], expected: 100 },
    { scenario: 'Pricier hop keeps stops low', hint: 'Plain Dijkstra keeps one best price per city: it settles city 2 via the cheap 2-flight route and then cannot reach 3 within k stops. The answer uses the pricier direct flight to 2.', args: [4,[[0,1,1],[1,2,1],[0,2,5],[2,3,1]],0,3,1], expected: 6 },
    { scenario: 'Cycle back to the source', hint: 'Flights 0→1→0 form a cycle; a cycle never lowers a positive price, and dst is still out of reach with k = 0.', args: [3,[[0,1,2],[1,0,2],[1,2,3]],0,2,0], expected: -1 },
    { scenario: 'Destination has a lower label', hint: 'Nothing special about src < dst — routes may go to lower-numbered cities.', args: [4,[[3,2,4],[2,1,4],[3,1,10],[1,0,1],[3,0,20]],3,0,1], expected: 11 },
    { scenario: 'Long chain (k = 98)', hint: 'The only route uses all 99 flights, i.e. exactly k = 98 stops. Check your round count and that nothing caps the depth.', argsGen: '() => [100, Array.from({ length: 99 }, (_, i) => [i, i + 1, 1 + (i % 7)]), 0, 99, 98]', expected: 393 },
    { scenario: 'Dense graph (n = 100)', hint: 'All 4950 forward flights exist. A DFS that tries every route with ≤ k + 1 flights explores ~2^98 paths; k + 1 Bellman-Ford rounds are O(k·E).', argsGen: '() => { let s = 12345; const rnd = (m) => (s = (s * 48271) % 2147483647) % m; const f = []; for (let i = 0; i < 100; i++) for (let j = i + 1; j < 100; j++) f.push([i, j, 1 + rnd(10000)]); return [100, f, 0, 99, 99]; }', expected: 443, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findCheapestPrice(n, flights, src, dst, k) {
  let price = new Array(n).fill(Infinity);
  price[src] = 0;

  // round i allows one more flight; k stops = k + 1 flights
  for (let round = 0; round <= k; round++) {
    const next = price.slice();          // read only last round's prices
    for (const [u, v, w] of flights) {
      if (price[u] + w < next[v]) next[v] = price[u] + w;
    }
    price = next;
  }
  return price[dst] === Infinity ? -1 : price[dst];
}`,
    explanation: '`price[u]` (old round) + `w` is written into `next[v]` (new round). `Infinity + w` stays `Infinity`, so unreached cities never relax anything.',
  },
  dryRun: {
    columns: ['round', 'flights allowed', 'price[0..3]', 'note'],
    rows: [
      ['start', '0', '[0, ∞, ∞, ∞]', ''],
      ['0', '≤ 1', '[0, 100, ∞, ∞]', 'only 0→1 has a finite source'],
      ['1', '≤ 2', '[0, 100, 200, 700]', '1→2 and 1→3 use last round\'s 100'],
    ],
  },
  complexity: { time: 'O((k + 1) · E)', space: 'O(n)', explanation: 'k + 1 rounds, each scanning every flight once, plus an O(n) copy per round.' },
  alternative: {
    title: 'BFS / Dijkstra over (city, flights used)',
    md: 'Push `[cost, city, flights]` into a min-heap. Skip a state if flights > k + 1. Keep `bestFlights[city]` = fewest flights with which the city was popped; a later pop with more flights and higher cost is dominated. Pops come out by cost, so the first pop of dst is the answer.',
    complexity: 'O(E · k · log(E · k)) time in the worst case',
  },
  mistakes: [
    'Running k rounds instead of k + 1 (k counts stops, not flights).',
    'Updating `price` in place — lets a single round use several flights.',
    'Using plain Dijkstra with one distance per city and no stop tracking.',
  ],
};
