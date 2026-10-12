export default {
  id: 'minimum-number-of-refueling-stops',
  title: 'Minimum Number of Refueling Stops',
  difficulty: 'Hard',
  order: 2,
  pattern: 'greedy-heap-regret',
  tags: ['array', 'greedy', 'heap', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 871, url: 'https://leetcode.com/problems/minimum-number-of-refueling-stops/' },

  statement: `A car drives east from position \`0\` to position \`target\`. It starts with \`startFuel\` litres, and uses **one litre per mile**. Its tank has unlimited capacity.

\`stations[i] = [position, fuel]\` (sorted by position) describes a gas station where the car may stop and take **all** \`fuel\` litres.

Return the **minimum number of stops** needed to reach \`target\`, or \`-1\` if it is impossible. Arriving somewhere with 0 fuel left still counts as arriving.`,
  examples: [
    { input: 'target = 1, startFuel = 1, stations = []', output: '0' },
    { input: 'target = 100, startFuel = 1, stations = [[10,100]]', output: '-1', explanation: 'Cannot even reach the first station.' },
    { input: 'target = 100, startFuel = 10, stations = [[10,60],[20,30],[30,30],[60,40]]', output: '2', explanation: 'Stop at 10 (fuel 60) and at 60 (fuel 40).' },
  ],
  constraints: ['1 <= target, startFuel <= 10^9', '0 <= stations.length <= 500', '1 <= position < target', '1 <= fuel <= 10^9', 'positions strictly increasing'],

  think: `- If you are about to run dry, which of the stations you already passed would you most like to have stopped at?
- Does it matter WHEN you stopped at a station, or only WHETHER you stopped?
- Which data structure gives you "the biggest passed station" quickly?`,
  patternChallenge: {
    options: ['Dijkstra', 'Greedy — Heap with Regret', 'Sliding Window', 'Binary Search on Answer'],
    answer: 1,
    explanation: 'Fuel only matters in total, so you can decide "retroactively" which passed stations you used. Keep them in a max-heap and pop the largest when stuck. (A DP over number of stops is O(n²) and also correct.)',
  },
  hints: [
    'Drive as far as current fuel allows; push the fuel of every station you pass into a MaxHeap.',
    'When you cannot reach further, pop the largest fuel (that is your next stop). If the heap is empty, return -1.',
  ],
  approach: `**DP:** \`dp[t]\` = farthest distance reachable with t stops. For each station i (in order), for t from i down to 0: if \`dp[t] >= pos_i\`, \`dp[t+1] = max(dp[t+1], dp[t] + fuel_i)\`. Answer = smallest t with \`dp[t] >= target\` → O(n²).

**Greedy with regret:** since tank capacity is unlimited, a stop's effect is simply "+fuel", no matter when it happened as long as we had passed it. So:
1. Push every station within current range into a max-heap.
2. If \`fuel < target\`, pop the largest and add it (stops++). If empty → -1.

**Stays ahead:** after k stops, greedy's range is the maximum possible over all choices of k reachable stations — each pop takes the largest available amount.`,

  functionName: 'minRefuelStops',
  paramNames: ['target', 'startFuel', 'stations'],
  starterCode: `/**
 * @param {number} target
 * @param {number} startFuel
 * @param {number[][]} stations
 * @return {number}
 */
function minRefuelStops(target, startFuel, stations) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'startFuel already reaches the target: zero stops.', args: [1, 1, []], expected: 0 },
    { scenario: 'Example 2', hint: 'The only station is at 10 but you run dry at 1 — return -1.', args: [100, 1, [[10, 100]]], expected: -1 },
    { scenario: 'Example 3', hint: 'Stop at 10 (+60) then 60 (+40): two stops.', args: [100, 10, [[10, 60], [20, 30], [30, 30], [60, 40]]], expected: 2 },
    { scenario: 'No stations, enough fuel', hint: 'An empty station list with enough fuel needs 0 stops.', args: [100, 100, []], expected: 0 },
    { scenario: 'No stations, not enough', hint: 'Empty station list and too little fuel: -1.', args: [100, 99, []], expected: -1 },
    { scenario: 'Arrive with exactly 0 fuel', hint: 'Reaching a station with 0 litres left still counts — compare position <= fuel, not <.', args: [100, 50, [[50, 50]]], expected: 1 },
    { scenario: 'Skip the small station', hint: 'Stopping at every reachable station uses 2 stops; only the larger one at 50 is needed.', args: [100, 50, [[25, 25], [50, 50]]], expected: 1 },
    { scenario: 'Max-heap, not min-heap', hint: 'Popping the smallest fuel first wastes stops; always refuel from the largest passed station.', args: [100, 30, [[10, 5], [20, 70], [30, 10]]], expected: 1 },
    { scenario: 'Every stop needed', hint: 'Both stations are needed to cover the distance.', args: [100, 50, [[25, 30], [50, 20]]], expected: 2 },
    { scenario: 'Stuck despite later stations', hint: 'A gap larger than your range makes later big stations useless — return -1.', args: [1000, 83, [[25, 27], [36, 187], [140, 186], [378, 6], [492, 202], [517, 89], [579, 234], [673, 86], [808, 53], [954, 49]]], expected: -1 },
    { scenario: 'Regret choices several times', hint: 'Several pops from the heap; the order of stations passed differs from the order of stops.', args: [1000, 299, [[13, 21], [26, 115], [100, 47], [225, 99], [299, 141], [444, 198], [608, 190], [636, 157], [647, 255], [841, 123]]], expected: 4 },
    { scenario: 'Maximum distances (10^9)', hint: 'Targets and fuel go up to 10^9; plain numbers handle the sums.', args: [1000000000, 1, [[1, 999999999]]], expected: 1 },
    { scenario: 'Large input (500 stations)', hint: 'Trying subsets of stations is exponential; a max-heap of passed stations is O(n log n).', argsGen: '() => { let x = 3; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); const st = []; for (let i = 1; i <= 500; i++) st.push([i * 1000, 1 + r() % 3000]); return [450000, 1000, st]; }', expected: 192, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minRefuelStops(target, startFuel, stations) {
  const passed = new MaxHeap();   // toolkit: fuel of stations we drove past without stopping
  let fuel = startFuel;           // = farthest position reachable right now
  let stops = 0;
  let i = 0;
  while (fuel < target) {
    while (i < stations.length && stations[i][0] <= fuel) {
      passed.push(stations[i][1]);
      i++;
    }
    if (passed.isEmpty()) return -1;  // stuck, and no station to regret
    fuel += passed.pop();             // "we stopped at the best one"
    stops++;
  }
  return stops;
}`,
  },
  dryRun: {
    columns: ['fuel (reach)', 'pushed', 'heap', 'pop', 'stops'],
    rows: [
      ['10', '60 (pos 10)', '[60]', '60 → reach 70', '1'],
      ['70', '30, 30, 40 (pos 20, 30, 60)', '[40, 30, 30]', '40 → reach 110', '2'],
      ['110 ≥ 100', '', '', 'done', '2'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Each station is pushed and popped at most once.' },
  alternative: {
    title: 'DP over number of stops',
    md: '`dp[t]` = farthest reachable with exactly t stops, updated station by station (t descending so each station is used once).',
    code: `function minRefuelStops(target, startFuel, stations) {
  const n = stations.length;
  const dp = new Array(n + 1).fill(0);
  dp[0] = startFuel;
  for (let i = 0; i < n; i++) {
    const [pos, fuel] = stations[i];
    for (let t = i; t >= 0; t--) {
      if (dp[t] >= pos) dp[t + 1] = Math.max(dp[t + 1], dp[t] + fuel);
    }
  }
  for (let t = 0; t <= n; t++) if (dp[t] >= target) return t;
  return -1;
}`,
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Stopping at every reachable station immediately (not minimal).',
    'Using a min-heap — you want the largest fuel.',
    'Treating "reach exactly with 0 fuel" as failure (use <=).',
  ],
};
