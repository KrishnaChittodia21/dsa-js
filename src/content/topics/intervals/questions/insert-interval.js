export default {
  id: 'insert-interval',
  title: 'Insert Interval',
  difficulty: 'Medium',
  order: 2,
  pattern: 'intervals-merge',
  tags: ['array', 'intervals'],
  source: { platform: 'LeetCode', number: 57, url: 'https://leetcode.com/problems/insert-interval/' },

  statement: `\`intervals\` is a list of closed intervals that are **disjoint and sorted by start**. Insert \`newInterval\` into it, merging where necessary, so that the result is still sorted and disjoint. Return the new list (you do not have to modify the input in place).

Touching intervals (sharing an endpoint) count as overlapping.`,
  examples: [
    { input: 'intervals = [[1,3],[6,9]], newInterval = [2,5]', output: '[[1,5],[6,9]]' },
    { input: 'intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]', output: '[[1,2],[3,10],[12,16]]', explanation: '[4,8] overlaps [3,5], [6,7] and [8,10].' },
    { input: 'intervals = [], newInterval = [5,7]', output: '[[5,7]]' },
  ],
  constraints: ['0 <= intervals.length <= 10^4', '0 <= start_i <= end_i <= 10^5', 'intervals is sorted by start and pairwise disjoint', '0 <= newInterval[0] <= newInterval[1] <= 10^5'],

  think: `- The list is already sorted and disjoint. Which intervals are **definitely** unaffected on the left? On the right?
- The ones in the middle all overlap the new interval. What single interval replaces them?
- Do you need to sort anything?`,
  patternChallenge: {
    options: ['Sort by start & merge (three-phase insert)', 'Binary search only', 'Sweep line', 'Greedy by earliest end'],
    answer: 0,
    explanation: 'This is the merge pattern with the sort already done: copy the intervals before, absorb the overlapping ones, copy the intervals after. Binary search can find the boundaries, but the output still costs O(n) to build.',
  },
  hints: [
    'Phase 1: push every interval whose end is `< newInterval[0]`.',
    'Phase 2: while the current interval starts `<= newInterval[1]`, grow the new interval to `[min(starts), max(ends)]`. Push it. Phase 3: push the rest.',
  ],
  approach: `**Brute force:** append the new interval and run the full Merge Intervals algorithm (sort + merge) — O(n log n). Correct, but ignores that the input is already sorted.

**Optimized — three phases, O(n):**
1. **Before:** intervals with \`end < newStart\` cannot touch the new interval → copy them.
2. **Overlap:** intervals with \`start <= newEnd\` (and not in phase 1) overlap it → absorb: \`newStart = min\`, \`newEnd = max\`.
3. **After:** everything left starts after \`newEnd\` → copy.

You cannot beat O(n) because in the worst case the whole output must be written.`,

  functionName: 'insert',
  paramNames: ['intervals', 'newInterval'],
  starterCode: `/**
 * @param {number[][]} intervals
 * @param {number[]} newInterval
 * @return {number[][]}
 */
function insert(intervals, newInterval) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The new interval overlaps one existing interval and merges with it.', args: [[[1, 3], [6, 9]], [2, 5]], expected: [[1, 5], [6, 9]] },
    { scenario: 'Example 2', hint: 'The new interval swallows several consecutive intervals — keep absorbing while `start <= newEnd`.', args: [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], expected: [[1, 2], [3, 10], [12, 16]] },
    { scenario: 'Example 3', hint: 'Empty list: the answer is just the new interval. Do not forget to push it.', args: [[], [5, 7]], expected: [[5, 7]] },
    { scenario: 'Insert at the end', hint: 'No interval overlaps and the new one goes last — it must still be pushed after the loop.', args: [[[1, 5]], [6, 8]], expected: [[1, 5], [6, 8]] },
    { scenario: 'Insert at the start', hint: 'The new interval comes before everything; it must be placed first, not appended.', args: [[[3, 5]], [0, 1]], expected: [[0, 1], [3, 5]] },
    { scenario: 'Insert in a gap', hint: 'No overlap, but the new interval belongs in the middle — phase 3 must copy the rest after it.', args: [[[1, 2], [8, 9]], [4, 5]], expected: [[1, 2], [4, 5], [8, 9]] },
    { scenario: 'New interval already covered', hint: 'The new interval lies inside an existing one; the output equals the input.', args: [[[1, 5]], [2, 3]], expected: [[1, 5]] },
    { scenario: 'New interval covers everything', hint: 'Every existing interval is absorbed; the result is just the widened new interval.', args: [[[2, 3], [5, 6]], [0, 10]], expected: [[0, 10]] },
    { scenario: 'Touches on both sides', hint: 'Endpoints are inclusive: [1,2] ends at 2 and [5,6] starts at 5, so both merge with [2,5]. Phase 1 must use `end < newStart`.', args: [[[1, 2], [5, 6]], [2, 5]], expected: [[1, 6]] },
    { scenario: 'Touches only the left end', hint: 'An interval ending exactly at newStart touches it and must be merged, not copied as-is.', args: [[[1, 3], [7, 9]], [3, 4]], expected: [[1, 4], [7, 9]] },
    { scenario: 'Zero-width intervals', hint: 'Point intervals like [0,0] are valid; [0,0] and new [0,0] must merge into one.', args: [[[0, 0], [2, 2]], [0, 0]], expected: [[0, 0], [2, 2]] },
    { scenario: 'Merge then keep the rest', hint: 'After merging, the remaining intervals must still be copied — do not break out and forget phase 3.', args: [[[1, 2], [3, 4], [6, 7], [9, 10], [12, 13]], [2, 3]], expected: [[1, 4], [6, 7], [9, 10], [12, 13]] },
    { scenario: 'Large input (n = 10^4)', hint: 'The list is already sorted — a single linear pass handles 10^4 intervals easily.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => [10 * i, 10 * i + 4]), [5, 99985]]', expected: [[0, 4], [5, 99985], [99990, 99994]] },
  ],

  solution: {
    code: `function insert(intervals, newInterval) {
  const out = [];
  let [s, e] = newInterval;
  let i = 0;
  const n = intervals.length;

  // 1. entirely before the new interval
  while (i < n && intervals[i][1] < s) out.push(intervals[i++]);

  // 2. overlapping (or touching) — absorb into [s, e]
  while (i < n && intervals[i][0] <= e) {
    s = Math.min(s, intervals[i][0]);
    e = Math.max(e, intervals[i][1]);
    i++;
  }
  out.push([s, e]);

  // 3. entirely after
  while (i < n) out.push(intervals[i++]);
  return out;
}`,
    explanation: 'Phase 2 relies on phase 1: once an interval ends at or after `s`, it overlaps iff it starts at or before `e`.',
  },
  dryRun: {
    columns: ['phase', 'interval', 'test', 'state'],
    rows: [
      ['1', '[1,2]', '2 < 4 ✓ copy', 'out = [[1,2]]'],
      ['1', '[3,5]', '5 < 4 ✗ → phase 2', ''],
      ['2', '[3,5]', '3 <= 8 ✓', 'new = [3,8]'],
      ['2', '[6,7]', '6 <= 8 ✓', 'new = [3,8]'],
      ['2', '[8,10]', '8 <= 8 ✓', 'new = [3,10]'],
      ['2', '[12,16]', '12 <= 10 ✗ → push [3,10]', 'out = [[1,2],[3,10]]'],
      ['3', '[12,16]', 'copy', 'out = [[1,2],[3,10],[12,16]]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each interval is visited once; the output holds up to n + 1 intervals.' },
  alternative: {
    title: 'Append and re-merge',
    md: 'Push the new interval, then run Merge Intervals (sort + merge). Simpler to write if you already have `merge`, but O(n log n).',
    code: `function insert(intervals, newInterval) {
  const all = [...intervals, newInterval].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of all) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Forgetting to push the merged new interval when no interval overlaps it (or when the list is empty).',
    'Using `<=` in phase 1: an interval ending exactly at `s` touches it and must be merged.',
    'Breaking out of the loop after merging and forgetting phase 3.',
  ],
};
