export default {
  id: 'car-fleet',
  title: 'Car Fleet',
  difficulty: 'Medium',
  order: 6,
  pattern: 'sorting-preprocess',
  tags: ['array', 'sorting', 'greedy'],
  source: { platform: 'LeetCode', number: 853, url: 'https://leetcode.com/problems/car-fleet/' },

  statement: `\`n\` cars drive towards a destination at mile \`target\` on a single-lane road. Car i starts at \`position[i]\` (all distinct) with constant speed \`speed[i]\`.

A car can never pass the car ahead of it. When it catches up, it slows down and they drive together as one **fleet** (moving at the slower speed). A car that catches a fleet exactly at the destination still joins that fleet.

Return the number of fleets that arrive at the destination.`,
  examples: [
    { input: 'target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]', output: '3', explanation: 'Cars at 10 and 8 meet at 12; the car at 0 is alone; cars at 5 and 3 meet at 6.' },
    { input: 'target = 10, position = [3], speed = [3]', output: '1' },
    { input: 'target = 100, position = [0,2,4], speed = [4,2,1]', output: '1' },
  ],
  constraints: ['1 <= n <= 10^5', '0 < target <= 10^6', '0 <= position[i] < target', 'All positions are distinct', '0 < speed[i] <= 10^6'],

  think: `- Does the order of the input arrays mean anything? Which order does the road impose?
- If a car would arrive (alone) no later than the car ahead of it, what happens to it?
- Scanning from the car closest to the target, what single value do you need to remember?`,
  patternChallenge: {
    options: ['Binary Search', 'Sliding Window', 'Sort by position, then scan with arrival times', 'Union-Find over all pairs'],
    answer: 2,
    explanation: 'Interactions only happen between a car and whoever is ahead of it on the road, so sorting by position exposes the structure; then one scan comparing arrival times counts the fleets. Pairwise union is O(n²) and unnecessary.',
  },
  hints: [
    'Compute each car\'s solo arrival time `(target − position) / speed`. Sort cars by position descending (closest to the target first).',
    'Keep `lead` = the arrival time of the fleet directly ahead. A car with time ≤ lead joins it; a car with time > lead starts a new fleet and becomes the new lead.',
  ],
  approach: `**Brute force:** simulate the cars step by step — slow and floating-point messy.

**Sort + scan:**
1. Pair positions with arrival times; sort by position descending.
2. The first car forms a fleet with arrival time \`lead\`.
3. For each next car (further back): if its solo time ≤ \`lead\`, it catches the fleet ahead before (or at) the target and is slowed down to it — same fleet. Otherwise it arrives strictly later: new fleet, \`lead = time\`.

Why comparing with only the nearest fleet is enough: a fleet's arrival time is the time of its slowest (front) car, and fleets ahead have arrival times that are ≤ the fleet behind, so the car only needs to beat the fleet directly ahead.`,

  functionName: 'carFleet',
  paramNames: ['target', 'position', 'speed'],
  starterCode: `/**
 * @param {number} target
 * @param {number[]} position
 * @param {number[]} speed
 * @return {number}
 */
function carFleet(target, position, speed) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: two pairs merge, one car stays alone.', args: [12,[10,8,0,5,3],[2,4,1,1,3]], expected: 3 },
    { scenario: 'Example 2', hint: 'A single car is always exactly one fleet.', args: [10,[3],[3]], expected: 1 },
    { scenario: 'Example 3', hint: 'Every car behind catches the one ahead, so everything ends as one fleet.', args: [100,[0,2,4],[4,2,1]], expected: 1 },
    { scenario: 'Two cars that never meet', hint: 'The car behind arrives strictly later, so it forms its own fleet.', args: [10,[6,8],[3,2]], expected: 2 },
    { scenario: 'Catch up exactly at target', hint: 'Using < instead of <= when joining: both cars arrive at time 5, and a car that catches up exactly at the target joins the fleet.', args: [10,[0,5],[2,1]], expected: 1 },
    { scenario: 'Would catch up after target', hint: 'The back car is faster but only catches up beyond the destination, so there are 2 fleets.', args: [10,[0,5],[1,2]], expected: 2 },
    { scenario: 'Unsorted input order', hint: 'Positions are not given in road order — sort by position (closest to the target first) before scanning.', args: [10,[8,3],[1,7]], expected: 1 },
    { scenario: 'Every car alone', hint: 'Each car further back is also slower, so nobody catches anybody: 4 fleets.', args: [20,[1,2,3,4],[1,2,3,4]], expected: 4 },
    { scenario: 'Everyone merges into one', hint: 'Each car behind is faster than the one ahead, so all join the front fleet.', args: [20,[1,2,3,4],[4,3,2,1]], expected: 1 },
    { scenario: 'Lead time kept after a merge', hint: 'Updating lead when a car joins: the fleet still moves at the slow front car\'s time (1), so the third car (time 0.5) also joins.', args: [10,[9,8,5],[1,10,10]], expected: 1 },
    { scenario: 'Multi-digit positions', hint: 'Default string sort on positions puts 100 before 9 — sort numerically by position.', args: [200,[9,100,10,20],[1,100,1,2]], expected: 4 },
    { scenario: 'Scan must start at the front', hint: 'Scanning from the back of the road: a car cannot know whether a car closer to the target will block it. Process closest-to-target first.', args: [10,[0,2,4,6],[5,1,4,1]], expected: 2 },
    { scenario: 'Maximum target and speed', hint: 'Both cars arrive at time 1 — the fast one from position 0 catches the slow one exactly at the target.', args: [1000000,[0,999999],[1000000,1]], expected: 1 },
    { scenario: 'Large random input (n = 10^5)', hint: 'A full-size road with random speeds — sort once by position and scan with the lead arrival time.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); const n = 100000; const pos = Array.from({ length: n }, (_, i) => i * 9); for (let i = n - 1; i > 0; i--) { const j = r() % (i + 1); const t = pos[i]; pos[i] = pos[j]; pos[j] = t; } const sp = Array.from({ length: n }, () => (r() % 1000000) + 1); return [1000000, pos, sp]; }', expected: 15, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function carFleet(target, position, speed) {
  const cars = position.map((p, i) => [p, (target - p) / speed[i]]);
  cars.sort((a, b) => b[0] - a[0]);        // closest to the target first

  let fleets = 0;
  let lead = 0;                            // arrival time of the fleet ahead
  for (const [, time] of cars) {
    if (time > lead) {                     // arrives strictly later → new fleet
      fleets++;
      lead = time;
    }                                      // else it catches up and merges
  }
  return fleets;
}`,
    explanation: 'Sorting by position with a numeric comparator is essential: positions like 10 and 8 would be misordered by the default string sort ("10" < "8").',
  },
  dryRun: {
    columns: ['car (pos)', 'time', 'lead before', 'action', 'fleets'],
    rows: [
      ['10', '1', '0', 'new fleet', '1'],
      ['8', '1', '1', 'time ≤ lead → joins', '1'],
      ['5', '7', '1', 'new fleet', '2'],
      ['3', '3', '7', 'joins', '2'],
      ['0', '12', '7', 'new fleet', '3'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting the n cars dominates; the scan is linear.' },
  alternative: {
    title: 'Monotonic stack of arrival times',
    md: 'Push arrival times (sorted by position descending) onto a stack, pushing only when the time is greater than the top. The stack size is the answer — the same idea as `lead`, with the history kept.',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Sorting ascending and scanning from the back of the road — then a car cannot know whether a later (closer) car will block it.',
    'Using `<` instead of `<=` for joining: a car that catches up exactly at the target joins the fleet.',
    'Default string sort on positions.',
    'Updating `lead` when a car joins (the fleet keeps the slower front car\'s time).',
  ],
};
