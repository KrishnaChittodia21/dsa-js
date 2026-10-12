export default {
  id: 'meeting-rooms-ii',
  title: 'Meeting Rooms II',
  difficulty: 'Medium',
  order: 7,
  pattern: 'intervals-sweep-line',
  tags: ['array', 'sorting', 'sweep line', 'intervals'],
  source: { platform: 'LeetCode', number: 253, url: 'https://leetcode.com/problems/meeting-rooms-ii/', premium: true },

  statement: `You are given meeting times \`intervals[i] = [start_i, end_i]\`, where a meeting occupies the half-open range \`[start_i, end_i)\`. A room can host a new meeting at exactly the moment the previous meeting ends.

Return the **minimum number of conference rooms** needed so that every meeting can take place.`,
  examples: [
    { input: 'intervals = [[0,30],[5,10],[15,20]]', output: '2', explanation: '[0,30] needs a room the whole time; [5,10] and [15,20] can share the second room.' },
    { input: 'intervals = [[7,10],[2,4]]', output: '1' },
    { input: 'intervals = [[1,5],[5,10]]', output: '1', explanation: 'The second meeting starts exactly when the first ends.' },
  ],
  constraints: ['1 <= intervals.length <= 10^4', '0 <= start_i < end_i <= 10^6'],

  think: `- At any instant, how many rooms are in use? When does that number change?
- Why is the answer equal to the **maximum** number of meetings happening at the same time?
- Do you need to know *which* meeting ended to reuse its room?`,
  patternChallenge: {
    options: ['Greedy by earliest end', 'Sort by start & merge', 'Sweep line over start/end events', 'Binary search on the number of rooms'],
    answer: 2,
    explanation: '"Minimum rooms" = maximum simultaneous meetings, which a sweep line over +1/−1 events computes directly. Greedy by end answers how many fit in ONE room; merging hides how many overlap.',
  },
  hints: [
    'Sort all start times and, separately, all end times.',
    'Walk the starts. If the current start is `>=` the earliest unused end, a meeting has finished — reuse its room and advance the end pointer; otherwise open a new room.',
  ],
  approach: `**Brute force:** for every meeting start, count how many meetings are running at that moment — O(n²). The maximum count is the answer (the busiest moment always happens at some start).

**Optimized — sweep with two sorted arrays:**
1. \`starts\` = sorted start times, \`ends\` = sorted end times.
2. \`rooms = 0\`, \`j = 0\`. For each \`starts[i]\`: if \`starts[i] >= ends[j]\`, one meeting has ended → reuse a room (\`j++\`). Otherwise \`rooms++\`.

We pair starts with ends from different meetings — that is fine because we only need **how many** meetings have ended by time \`starts[i]\`, and sorted ends answer that. \`>=\` implements "end before start" at equal times (half-open meetings).

**Events version:** push \`[s, +1]\` and \`[e, −1]\`, sort by time then delta (−1 first), and track the running maximum. A MinHeap of end times (Heaps topic) is a third option.`,

  functionName: 'minMeetingRooms',
  paramNames: ['intervals'],
  starterCode: `/**
 * @param {number[][]} intervals
 * @return {number}
 */
function minMeetingRooms(intervals) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'One long meeting overlaps two short ones that do not overlap each other — 2 rooms.', args: [[[0, 30], [5, 10], [15, 20]]], expected: 2 },
    { scenario: 'Example 2', hint: 'Disjoint meetings given out of order can share one room.', args: [[[7, 10], [2, 4]]], expected: 1 },
    { scenario: 'Example 3', hint: 'A meeting ending at 5 frees its room for one starting at 5 — compare with `>=`, not `>`.', args: [[[1, 5], [5, 10]]], expected: 1 },
    { scenario: 'Single meeting', hint: 'One meeting always needs exactly one room.', args: [[[1, 10]]], expected: 1 },
    { scenario: 'All identical meetings', hint: 'Three meetings with the same times all overlap — 3 rooms.', args: [[[1, 10], [1, 10], [1, 10]]], expected: 3 },
    { scenario: 'Back-to-back chain', hint: 'Each meeting starts exactly when the previous ends; one room suffices.', args: [[[3, 4], [1, 2], [2, 3], [0, 1]]], expected: 1 },
    { scenario: 'Staircase overlaps', hint: 'The peak overlap is 3, not the total number of overlapping pairs.', args: [[[1, 4], [2, 5], [3, 6], [4, 7], [5, 8]]], expected: 3 },
    { scenario: 'Overlap depth, not merges', hint: 'All meetings form one merged block, yet only 2 overlap at once. Counting merged blocks gives the wrong answer.', args: [[[1, 3], [2, 4], [3, 5], [4, 6]]], expected: 2 },
    { scenario: 'Multi-digit times unsorted', hint: 'Default `sort()` puts 10 before 9 as strings — use a numeric comparator.', args: [[[9, 10], [4, 9], [4, 17]]], expected: 2 },
    { scenario: 'Shared end times', hint: 'Two meetings end at 16 and one starts at 11 when another ends — reuse that room.', args: [[[2, 11], [6, 16], [11, 16]]], expected: 2 },
    { scenario: 'Nested inside a long meeting', hint: 'A full-day meeting plus short overlapping ones: depth 3 occurs around time 2.', args: [[[0, 1000000], [1, 2], [2, 3], [3, 4], [1, 3]]], expected: 3 },
    { scenario: 'Starting at time 0', hint: 'Zero is a valid start time; do not treat it as "no meeting".', args: [[[0, 5], [0, 5], [5, 6]]], expected: 2 },
    { scenario: 'Large input (n = 10^4)', hint: 'Counting active meetings at every start is O(n²). Sort starts and ends separately (or use a heap): O(n log n).', argsGen: '() => { let s = 11; const r = (m) => (s = (s * 48271) % 2147483647) % m; return [Array.from({ length: 10000 }, () => { const a = r(990000); return [a, a + 1 + r(10000)]; })]; }', expected: 71, timeLimitMs: 400 },
  ],

  solution: {
    code: `function minMeetingRooms(intervals) {
  const starts = intervals.map((m) => m[0]).sort((a, b) => a - b);
  const ends = intervals.map((m) => m[1]).sort((a, b) => a - b);
  let rooms = 0;
  let j = 0; // ends[0..j-1] are meetings that have already finished
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] >= ends[j]) {
      j++;       // some meeting finished by now → reuse its room
    } else {
      rooms++;   // all rooms busy → open a new one
    }
  }
  return rooms;
}`,
    explanation: '`rooms` never decreases; it equals the peak of (meetings started − meetings ended), i.e. the maximum overlap.',
  },
  dryRun: {
    columns: ['i', 'starts[i]', 'ends[j]', 'action', 'rooms'],
    rows: [
      ['0', '0', '10', '0 < 10 → new room', '1'],
      ['1', '5', '10', '5 < 10 → new room', '2'],
      ['2', '15', '10', '15 >= 10 → reuse, j = 1', '2'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Two sorts of n numbers; the scan is O(n). The two arrays take O(n).' },
  alternative: {
    title: 'Sweep over +1/−1 events',
    md: 'One event list, tie-break end before start. Easier to extend (e.g. meetings needing several rooms: use +k/−k).',
    code: `function minMeetingRooms(intervals) {
  const ev = [];
  for (const [s, e] of intervals) ev.push([s, 1], [e, -1]);
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // -1 before +1 on ties
  let active = 0, best = 0;
  for (const [, d] of ev) best = Math.max(best, (active += d));
  return best;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Using `>` instead of `>=`: [1,5] and [5,10] would need 2 rooms.',
    'Counting merged blocks instead of the overlap depth.',
    'Default `sort()` on numbers — `[10, 9, 100].sort()` gives [10, 100, 9].',
  ],
};
