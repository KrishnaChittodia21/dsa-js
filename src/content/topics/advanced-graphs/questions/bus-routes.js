export default {
  id: 'bus-routes',
  title: 'Bus Routes',
  difficulty: 'Hard',
  order: 3,
  pattern: 'adv-graph-meta-bfs',
  tags: ['graph', 'bfs', 'hash map'],
  source: { platform: 'LeetCode', number: 815, url: 'https://leetcode.com/problems/bus-routes/' },

  statement: `\`routes[i]\` lists the bus stops that bus \`i\` visits, looping forever (you can ride it between any two of its stops).

You start at stop \`source\` (not on a bus) and want to reach stop \`target\`, travelling only by bus. Return the **fewest number of buses** you must board, or \`-1\` if it is impossible.

If \`source === target\` the answer is \`0\`.`,
  examples: [
    { input: 'routes = [[1,2,7],[3,6,7]], source = 1, target = 6', output: '2', explanation: 'Bus 0 from 1 to 7, then bus 1 from 7 to 6.' },
    { input: 'routes = [[7,12],[4,5,15],[6],[15,19],[9,12,13]], source = 15, target = 12', output: '-1' },
  ],
  constraints: ['1 <= routes.length <= 500', '1 <= routes[i].length <= 10^5', 'Sum of routes[i].length <= 10^5', 'All values in routes[i] are distinct', '0 <= stop values < 10^6'],

  think: `- What is the "cost" — each stop you pass, or each bus you board?
- If you connect every pair of stops on a route with an edge, how many edges does a route with 10^5 stops create?
- Once you have boarded a particular bus, is there ever a reason to board it again later?`,
  patternChallenge: {
    options: ['Dijkstra on stops with weights 1', 'BFS where each level boards one more bus (routes as meta-nodes)', 'Union Find on stops', 'DFS returning the first path found'],
    answer: 1,
    explanation: 'The cost counts buses, and every bus costs the same → BFS levels. Treating routes as nodes avoids building O(L²) stop-to-stop edges. Dijkstra is overkill for unit weights; Union Find only tells you reachable/unreachable, not the minimum; DFS does not find shortest paths.',
  },
  hints: [
    'Build `stop → list of routes` with a Map. BFS frontier = stops reachable with the current number of buses.',
    'For each stop in the frontier, board every route through it that you have not used yet; mark the route used, then add all its unseen stops to the next frontier.',
  ],
  approach: `**Naive graph on stops:** edge between every two stops sharing a route → up to (10^5)² edges. Impossible.

**BFS over routes:**
1. If \`source === target\` return 0.
2. \`stopToRoutes\`: Map from stop to the ids of routes through it.
3. Level-by-level BFS starting from \`[source]\`, \`buses = 0\`. For each level: \`buses++\`; for every stop in the frontier, for every **unused** route through it: mark used; scan its stops — if one is \`target\` return \`buses\`; unseen stops join the next frontier.
4. Frontier empty → \`-1\`.

Marking routes used means each route's stop list is scanned **once**, so total work is O(sum of route lengths).`,

  functionName: 'numBusesToDestination',
  paramNames: ['routes', 'source', 'target'],
  starterCode: `/**
 * @param {number[][]} routes
 * @param {number} source
 * @param {number} target
 * @return {number}
 */
function numBusesToDestination(routes, source, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Ride bus 0 from 1 to 7, then bus 1 from 7 to 6: two boardings.', args: [[[1, 2, 7], [3, 6, 7]], 1, 6], expected: 2 },
    { scenario: 'Example 2', hint: 'The buses through 15 never connect to a bus through 12: -1.', args: [[[7, 12], [4, 5, 15], [6], [15, 19], [9, 12, 13]], 15, 12], expected: -1 },
    { scenario: 'Source equals target off-route', hint: 'source === target needs 0 buses even if that stop is on no route.', args: [[[1, 2]], 5, 5], expected: 0 },
    { scenario: 'One bus suffices', hint: 'Both stops are on the same bus: 1 boarding, no matter how many stops apart.', args: [[[1, 2, 3]], 1, 3], expected: 1 },
    { scenario: 'Disconnected routes', hint: 'The two buses share no stop, so you can never transfer.', args: [[[1, 2], [3, 4]], 1, 4], expected: -1 },
    { scenario: 'Chain of transfers', hint: 'Four buses in a chain: count buses boarded, not stops passed.', args: [[[1, 2], [2, 3], [3, 4], [4, 5]], 1, 5], expected: 4 },
    { scenario: 'Source not on any route', hint: 'You cannot walk to a bus — if source is on no route, the answer is -1.', args: [[[1, 2]], 3, 2], expected: -1 },
    { scenario: 'Many overlapping routes', hint: 'Several routes overlap; BFS by number of buses finds the 2-bus route.', args: [[[0, 1, 6, 16, 22, 23], [14, 15, 24, 32], [4, 10, 12, 20, 24, 28, 33], [1, 10, 11, 19, 27, 33], [11, 23, 25, 28], [15, 20, 21, 23, 29], [29]], 4, 21], expected: 2 },
    { scenario: 'Direct bus beats transfer', hint: 'Going 1 → 9 → 5 uses two buses, but bus 2 goes straight there.', args: [[[1, 9], [9, 5], [1, 5]], 1, 5], expected: 1 },
    { scenario: 'Target not on any route', hint: 'No bus stops at the target: -1.', args: [[[1, 2], [2, 3]], 1, 99], expected: -1 },
    { scenario: 'Stop value 0 and large', hint: 'Stop labels go from 0 up to 10^6 − 1 — use a Map, not a small array.', args: [[[0, 999999], [999999, 500000]], 0, 500000], expected: 2 },
    { scenario: 'Two huge routes', hint: 'Two routes of 50 000 stops sharing one stop. Re-scanning a route from every stop on it is O(L²); mark each route used once.', argsGen: '() => { const a = Array.from({ length: 50000 }, (_, i) => i); const b = Array.from({ length: 50000 }, (_, i) => 49999 + i); return [[a, b], 0, 99998]; }', expected: 2, timeLimitMs: 1000 },
    { scenario: 'Long chain of 500 routes', hint: '500 routes, each overlapping the next by one stop: the answer is 500 boardings.', argsGen: '() => { const r = []; for (let i = 0; i < 500; i++) r.push(Array.from({ length: 200 }, (_, j) => i * 199 + j)); return [r, 0, 499 * 199 + 199]; }', expected: 500 },
  ],

  solution: {
    code: `function numBusesToDestination(routes, source, target) {
  if (source === target) return 0;

  const stopToRoutes = new Map();
  routes.forEach((stops, r) => {
    for (const s of stops) {
      if (!stopToRoutes.has(s)) stopToRoutes.set(s, []);
      stopToRoutes.get(s).push(r);
    }
  });

  const usedRoute = new Array(routes.length).fill(false);
  const seenStop = new Set([source]);
  let frontier = [source];
  let buses = 0;

  while (frontier.length) {
    buses++;                                   // everything found in this level needs one more bus
    const next = [];
    for (const stop of frontier) {
      for (const r of stopToRoutes.get(stop) ?? []) {
        if (usedRoute[r]) continue;
        usedRoute[r] = true;                   // each route is scanned once in total
        for (const s of routes[r]) {
          if (s === target) return buses;
          if (!seenStop.has(s)) { seenStop.add(s); next.push(s); }
        }
      }
    }
    frontier = next;
  }
  return -1;
}`,
  },
  dryRun: {
    columns: ['level (buses)', 'frontier', 'routes boarded', 'new stops'],
    rows: [
      ['1', '[1]', 'route 0 [1,2,7]', '2, 7'],
      ['2', '[2, 7]', 'route 1 [3,6,7] (via 7)', 'finds 6 = target → return 2'],
    ],
  },
  complexity: { time: 'O(Σ|routes[i]|)', space: 'O(Σ|routes[i]|)', explanation: 'Building the index touches every stop once; each route is expanded once; each stop is enqueued once.' },
  alternative: {
    title: 'Route graph + BFS',
    md: 'Build a graph whose nodes are routes: two routes are adjacent if they share a stop (use the stop → routes index). Multi-source BFS from all routes containing `source`; stop when you reach a route containing `target`; answer = distance + 1. Up to O(R²) edges, fine for R = 500.',
    complexity: 'O(R² + Σ|routes[i]|) time',
  },
  mistakes: [
    'Not marking routes as used — the same long route gets rescanned from many stops.',
    'Returning -1 when source === target but source is on no route (answer is 0).',
    'Counting stops travelled instead of buses boarded.',
    'Building stop-to-stop edges for every pair on a route.',
  ],
};
