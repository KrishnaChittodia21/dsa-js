export default {
  id: 'meeting-rooms',
  title: 'Meeting Rooms',
  difficulty: 'Easy',
  order: 4,
  pattern: 'intervals-merge',
  tags: ['array', 'sorting', 'intervals'],
  source: { platform: 'LeetCode', number: 252, url: 'https://leetcode.com/problems/meeting-rooms/', premium: true },

  statement: `You are given a list of meeting time intervals \`intervals[i] = [start, end]\` (a meeting occupies the half-open time range \`[start, end)\`).

Return \`true\` if **one person** could attend **all** the meetings, i.e. no two meetings overlap. A meeting that ends at time \`t\` does **not** overlap one that starts at \`t\`.`,
  examples: [
    { input: 'intervals = [[0,30],[5,10],[15,20]]', output: 'false', explanation: '[0,30] overlaps both other meetings.' },
    { input: 'intervals = [[7,10],[2,4]]', output: 'true' },
    { input: 'intervals = [[1,5],[5,8]]', output: 'true', explanation: 'Ending at 5 and starting at 5 is fine.' },
  ],
  constraints: ['0 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= start < end <= 10^6'],

  think: `- Checking every pair of meetings is O(n²). Is there an order in which you only need to compare **neighbours**?
- After sorting by start time, what does it mean if a meeting starts before the previous one ends?`,
  patternChallenge: {
    options: ['Sort by start, then compare neighbours', 'Binary Search', 'Hash Set of times', 'Sliding Window'],
    answer: 0,
    explanation: 'Once meetings are sorted by start time, any overlap must show up between **consecutive** meetings: if meeting i doesn\'t overlap meeting i−1, it can\'t overlap anything earlier either, because those ended even sooner relative to its start. This is the same first step as Merge Intervals.',
  },
  hints: [
    'Sort the meetings by start time.',
    'Walk through them and compare each start with the previous meeting\'s end. Use `<` (strict), because back-to-back meetings are allowed.',
  ],
  approach: `**Brute force:** compare every pair — O(n²).

**Sort + neighbours:** sort by start. If \`intervals[i][0] < intervals[i - 1][1]\`, meeting i begins before meeting i−1 has finished → overlap → return \`false\`. If no neighbouring pair overlaps, no pair overlaps at all. Remember the numeric comparator: \`sort((a, b) => a[0] - b[0])\`.`,

  functionName: 'canAttendMeetings',
  paramNames: ['intervals'],
  starterCode: `/**
 * @param {number[][]} intervals
 * @return {boolean}
 */
function canAttendMeetings(intervals) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'One long meeting overlaps two short ones.', args: [[[0, 30], [5, 10], [15, 20]]], expected: false },
    { scenario: 'Example 2', hint: 'Input is not sorted — sort by start before comparing neighbours.', args: [[[7, 10], [2, 4]]], expected: true },
    { scenario: 'Example 3', hint: 'Back-to-back meetings (end == next start) do NOT overlap — use a strict < comparison.', args: [[[1, 5], [5, 8]]], expected: true },
    { scenario: 'No meetings', hint: 'An empty schedule is trivially attendable — return true without touching intervals[0].', args: [[]], expected: true },
    { scenario: 'Single meeting', hint: 'One meeting can always be attended.', args: [[[3, 9]]], expected: true },
    { scenario: 'Identical meetings', hint: 'Two meetings with the same times overlap completely.', args: [[[2, 6], [2, 6]]], expected: false },
    { scenario: 'Meeting nested inside another', hint: 'A short meeting entirely inside a long one is an overlap even though their ends differ.', args: [[[1, 10], [3, 4], [12, 15]]], expected: false },
    { scenario: 'Overlap only between non-adjacent input items', hint: 'If you compare items in input order without sorting, the overlap between the first and last meeting is missed.', args: [[[1, 4], [10, 12], [6, 8], [3, 5]]], expected: false },
    { scenario: 'Starts that sort wrongly as strings', hint: 'sort() without a comparator orders [10, …] before [9, …]. Use (a, b) => a[0] - b[0].', args: [[[100, 200], [9, 20], [20, 99]]], expected: true },
    { scenario: 'Overlap by one unit at the end', hint: 'end 6 vs next start 5 overlaps by one unit — make sure you compare start < previous end, not <=.', args: [[[0, 6], [5, 9]]], expected: false },
    { scenario: 'Many back-to-back meetings', hint: 'A long chain of touching meetings is valid; a strict/loose comparison bug shows up here.', args: [[[4, 5], [0, 1], [3, 4], [1, 2], [2, 3]]], expected: true },
    { scenario: 'Large input (n = 10^4, sorted check)', hint: 'Comparing every pair is O(n²); sort once and compare neighbours in O(n log n).',
      argsGen: "() => [Array.from({ length: 10000 }, (_, i) => { const j = (i * 7919) % 10000; return [j * 100, j * 100 + 100]; })]",
      expected: true, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function canAttendMeetings(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] < sorted[i - 1][1]) return false; // starts before the previous one ends
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['i', 'previous', 'current', 'start < prev end?', 'result'],
    rows: [
      ['—', '—', '[0,30]', '—', 'sorted: [0,30],[5,10],[15,20]'],
      ['1', '[0,30]', '[5,10]', '5 < 30 → yes', 'return false'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting dominates; the scan is O(n). The copy makes the space O(n) — sort in place for O(1) extra if mutating the input is allowed.' },
  alternative: {
    title: 'Pairwise comparison',
    md: 'Check every pair `a`, `b` with `a.start < b.end && b.start < a.end`. Correct, but O(n²) — too slow for 10^4 meetings in a timed test.',
    complexity: 'O(n²) time, O(1) space',
  },
  mistakes: [
    'Using <= so that back-to-back meetings count as overlapping.',
    'Comparing neighbours without sorting first.',
    'Calling sort() without a numeric comparator.',
    'Reading intervals[0] when the list is empty.',
  ],
};
