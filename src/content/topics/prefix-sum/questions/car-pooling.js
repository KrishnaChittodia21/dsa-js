export default {
  id: 'car-pooling',
  title: 'Car Pooling',
  difficulty: 'Medium',
  order: 7,
  pattern: 'difference-array',
  tags: ['array', 'prefix sum', 'difference array', 'simulation'],
  source: { platform: 'LeetCode', number: 1094, url: 'https://leetcode.com/problems/car-pooling/' },

  statement: `A car with \`capacity\` empty seats drives only east (positions only increase). \`trips[i] = [numPassengers, from, to]\` means \`numPassengers\` people get in at kilometre \`from\` and get **out at** kilometre \`to\`.

Return \`true\` if the car can complete every trip without ever carrying more than \`capacity\` passengers at once, otherwise \`false\`.`,
  examples: [
    { input: 'trips = [[2,1,5],[3,3,7]], capacity = 4', output: 'false', explanation: 'Between km 3 and 5 there are 2 + 3 = 5 passengers.' },
    { input: 'trips = [[2,1,5],[3,3,7]], capacity = 5', output: 'true' },
    { input: 'trips = [[2,1,5],[3,5,7]], capacity = 3', output: 'true', explanation: 'The first group leaves at km 5 exactly when the second boards.' },
  ],
  constraints: ['1 <= trips.length <= 1000', '1 <= numPassengers <= 100', '0 <= from < to <= 1000', '1 <= capacity <= 10^5'],

  think: `- Positions go up to 1000. What does the passenger count look like as a function of position?
- A trip adds passengers on a block of positions. Is the block \`[from, to]\` or \`[from, to)\`? Look at example 3.
- After building the difference array, what do you check while taking the prefix sum?`,
  patternChallenge: {
    options: ['Difference Array (half-open ranges)', 'Sort by start + Min-Heap of end times', 'Prefix Sum + HashMap', 'Two Pointers'],
    answer: 0,
    explanation: 'Each trip is a range update on a small coordinate line (≤ 1000). A difference array records +p at `from` and −p at `to`, and a prefix pass gives the load at each point. Sorting with a heap also works (and is needed when coordinates are huge), but is more complex here.',
  },
  hints: [
    'Use `diff` of size 1001: `diff[from] += p`, `diff[to] -= p` — passengers are gone AT `to`.',
    'Walk the positions keeping a running sum; if it ever exceeds `capacity`, return false.',
  ],
  approach: `**Brute force:** for every trip add passengers to each km in \`[from, to)\` → O(trips · distance), fine here but wasteful.

**Difference array:** the load changes only where people board or leave.
- \`diff[from] += p\` (board), \`diff[to] −= p\` (leave). The range is **half-open** \`[from, to)\`: at \`to\` the seats are free again, which is why example 3 is \`true\`.
- Prefix-sum the array; the running value is the load at each km. Any value above capacity → \`false\`.

When coordinates are huge (10^9), use the same idea with **sorted events** (a sweep line, Intervals topic).`,

  functionName: 'carPooling',
  paramNames: ['trips', 'capacity'],
  starterCode: `/**
 * @param {number[][]} trips
 * @param {number} capacity
 * @return {boolean}
 */
function carPooling(trips, capacity) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Between km 3 and 5 both groups are on board (5 > 4).', args: [[[2, 1, 5], [3, 3, 7]], 4], expected: false },
    { scenario: 'Example 2', hint: 'Same trips, but capacity 5 is just enough.', args: [[[2, 1, 5], [3, 3, 7]], 5], expected: true },
    { scenario: 'Example 3', hint: 'Passengers leave AT km `to`, so the next group can board there — subtracting at to + 1 keeps them one km too long.', args: [[[2, 1, 5], [3, 5, 7]], 3], expected: true },
    { scenario: 'Single trip, whole road', hint: 'One trip from km 0 to km 1000 exactly at capacity — make sure index 0 and the last km are handled.', args: [[[1, 0, 1000]], 1], expected: true },
    { scenario: 'Single trip over capacity', hint: 'Smallest input that fails: one group larger than the car.', args: [[[5, 2, 3]], 4], expected: false },
    { scenario: 'Overload at km 0', hint: 'The overload happens at the very first position; a loop that starts at 1 misses it.', args: [[[9, 0, 1], [3, 3, 7]], 4], expected: false },
    { scenario: 'Back-to-back at full capacity', hint: 'Drop-offs at a km happen before pick-ups at the same km — the car never holds 8.', args: [[[4, 0, 3], [4, 3, 6], [4, 6, 9]], 4], expected: true },
    { scenario: 'Unsorted trips, total exceeds capacity', hint: 'The trips never overlap, so the answer is true even though their total is 9. Checking capacity after adding each trip (instead of per position) fails here.', args: [[[3, 0, 2], [3, 5, 8], [3, 2, 5]], 3], expected: true },
    { scenario: 'Nested trips overload', hint: 'Three nested intervals all overlap at km 2 (6 > 5).', args: [[[2, 0, 5], [2, 1, 4], [2, 2, 3]], 5], expected: false },
    { scenario: 'Overlap only near the end', hint: 'The only overlap is at km 998 — scan every position up to the largest drop-off.', args: [[[1, 0, 999], [1, 998, 1000]], 1], expected: false },
    { scenario: 'Shared pick-up point', hint: 'Several groups board at km 4; the peak 16 exceeds capacity 15.', args: [[[5, 4, 7], [7, 4, 8], [4, 1, 8]], 15], expected: false },
    { scenario: 'Exactly at capacity', hint: 'The load reaches capacity but never exceeds it — use > not >=.', args: [[[3, 2, 7], [3, 7, 9], [8, 3, 9]], 11], expected: true },
    { scenario: 'Max size, overloaded (1000 trips)', hint: 'Largest allowed input; the peak load exceeds capacity somewhere in the middle.', argsGen: '() => { let s = 11; const r = () => (s = (s * 48271) % 2147483647); const t = []; for (let i = 0; i < 1000; i++) { const a = r() % 1000; const b = a + 1 + (r() % (1000 - a)); t.push([1 + (r() % 100), a, b]); } return [t, 20000]; }', expected: false },
    { scenario: 'Max size, fits (1000 trips)', hint: 'Largest allowed input where every position stays within capacity.', argsGen: '() => { let s = 5; const r = () => (s = (s * 48271) % 2147483647); const t = []; for (let i = 0; i < 1000; i++) { const a = r() % 1000; const b = a + 1 + (r() % (1000 - a)); t.push([1 + (r() % 100), a, b]); } return [t, 100000]; }', expected: true },
  ],

  solution: {
    code: `function carPooling(trips, capacity) {
  let maxPos = 0;
  for (const [, , to] of trips) maxPos = Math.max(maxPos, to);
  const diff = new Array(maxPos + 1).fill(0);
  for (const [p, from, to] of trips) {
    diff[from] += p;   // board at from
    diff[to] -= p;     // leave AT to (half-open [from, to))
  }
  let load = 0;
  for (let km = 0; km <= maxPos; km++) {
    load += diff[km];
    if (load > capacity) return false;
  }
  return true;
}`,
    explanation: 'Because drop-offs and pick-ups at the same km are combined in `diff[km]` before we check, people leaving at km 5 free their seats for people boarding at km 5.',
  },
  dryRun: {
    columns: ['km', 'diff[km]', 'load', 'capacity 4'],
    rows: [
      ['0', '0', '0', 'ok'],
      ['1', '+2', '2', 'ok'],
      ['2', '0', '2', 'ok'],
      ['3', '+3', '5', 'over → false'],
    ],
    note: 'trips = [[2,1,5],[3,3,7]].',
  },
  complexity: { time: 'O(t + D)', space: 'O(D)', explanation: 't trips, D = max position (≤ 1000). One O(1) update per trip, one pass over positions.' },
  alternative: {
    title: 'Sorted events (sweep line)',
    md: 'Create events `(from, +p)` and `(to, −p)`, sort by position with drop-offs before pick-ups at the same position, and scan. O(t log t), independent of the coordinate range.',
    code: `function carPooling(trips, capacity) {
  const events = [];
  for (const [p, from, to] of trips) events.push([from, p], [to, -p]);
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // at equal km, negatives (drop-offs) first
  let load = 0;
  for (const [, delta] of events) {
    load += delta;
    if (load > capacity) return false;
  }
  return true;
}`,
    complexity: 'O(t log t) time, O(t) space',
  },
  mistakes: [
    'Subtracting at `to + 1` — keeps passengers one km too long (example 3 would fail).',
    'Checking capacity after each trip is added instead of at each position.',
    'Sorting events without putting drop-offs before pick-ups at the same position.',
  ],
};
