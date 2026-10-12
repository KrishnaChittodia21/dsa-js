export default {
  id: 'non-overlapping-intervals',
  title: 'Non-overlapping Intervals',
  difficulty: 'Medium',
  order: 4,
  pattern: 'intervals-greedy-end',
  tags: ['array', 'greedy', 'sorting', 'intervals'],
  source: { platform: 'LeetCode', number: 435, url: 'https://leetcode.com/problems/non-overlapping-intervals/' },

  statement: `Given an array of intervals \`intervals[i] = [start_i, end_i]\`, return the **minimum number of intervals you must remove** so that the remaining intervals do not overlap.

Intervals that only touch, such as \`[1,2]\` and \`[2,3]\`, are **not** overlapping.`,
  examples: [
    { input: 'intervals = [[1,2],[2,3],[3,4],[1,3]]', output: '1', explanation: 'Remove [1,3]; the rest only touch.' },
    { input: 'intervals = [[1,2],[1,2],[1,2]]', output: '2' },
    { input: 'intervals = [[1,2],[2,3]]', output: '0' },
  ],
  constraints: ['1 <= intervals.length <= 10^5', '-5·10^4 <= start_i < end_i <= 5·10^4'],

  think: `- Minimising removals is the same as **maximising** the number of intervals you keep. Why?
- If you had to keep exactly one interval first, which one leaves the most room for the others?
- Why does "keep the one that starts first" fail on \`[[1,100],[2,3],[4,5]]\`?`,
  patternChallenge: {
    options: ['Sort by start & merge', 'Greedy by earliest end', 'Sweep line counting max overlap', 'Dynamic programming over all subsets'],
    answer: 1,
    explanation: 'We choose a maximum set of non-overlapping intervals — activity selection. Keeping the earliest-ending interval is provably safe (exchange argument), so a single greedy pass suffices. Merging would destroy the information about which to keep, and DP over subsets is exponential.',
  },
  hints: [
    'Answer = n − (maximum number of non-overlapping intervals you can keep).',
    'Sort by end. Keep an interval if its start is `>= lastEnd` (touching is allowed), then set `lastEnd` to its end.',
  ],
  approach: `**Brute force:** try every subset and keep the largest non-overlapping one — O(2ⁿ · n). A DP (sort by start, LIS-style) is O(n²).

**Optimized — greedy by earliest end:**
1. Sort by end.
2. \`lastEnd = -Infinity\`, \`kept = 0\`. For each \`[s, e]\`: if \`s >= lastEnd\` keep it (\`kept++\`, \`lastEnd = e\`); otherwise it must be removed.
3. Return \`n − kept\`.

**Why it is optimal:** the earliest-ending interval \`g\` can replace the first interval \`f\` of any optimal solution — it ends no later, so everything that fit after \`f\` fits after \`g\`. So some optimal solution keeps \`g\`; recurse on what remains.`,

  functionName: 'eraseOverlapIntervals',
  paramNames: ['intervals'],
  starterCode: `/**
 * @param {number[][]} intervals
 * @return {number}
 */
function eraseOverlapIntervals(intervals) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Removing [1,3] leaves intervals that only touch — 1 removal.', args: [[[1, 2], [2, 3], [3, 4], [1, 3]]], expected: 1 },
    { scenario: 'Example 2', hint: 'Identical intervals all overlap; keep one, remove the rest.', args: [[[1, 2], [1, 2], [1, 2]]], expected: 2 },
    { scenario: 'Example 3', hint: 'Touching intervals do not overlap here — compare with `s >= lastEnd`.', args: [[[1, 2], [2, 3]]], expected: 0 },
    { scenario: 'Single interval', hint: 'Nothing can overlap a lone interval — remove 0.', args: [[[0, 1]]], expected: 0 },
    { scenario: 'Long interval first', hint: 'Sorting by start and keeping the earlier interval keeps [1,100] and removes 2. Keep the earliest END instead.', args: [[[1, 100], [2, 3], [4, 5]]], expected: 1 },
    { scenario: 'Return removed, not kept', hint: 'Here 3 intervals are kept and 1 removed — return the number removed.', args: [[[1, 2], [2, 4], [1, 3], [3, 5]]], expected: 2 },
    { scenario: 'Fully nested intervals', hint: 'Every interval contains the next one; only one can survive.', args: [[[1, 10], [2, 9], [3, 8], [4, 7]]], expected: 3 },
    { scenario: 'Already non-overlapping', hint: 'Sorted, disjoint input needs no removals.', args: [[[1, 2], [3, 4], [5, 6], [7, 8]]], expected: 0 },
    { scenario: 'Chain of overlaps', hint: 'Each interval overlaps its neighbours; keeping every other one is optimal.', args: [[[1, 3], [2, 4], [3, 5], [4, 6], [5, 7]]], expected: 2 },
    { scenario: 'Negative and boundary values', hint: 'Starts can be negative down to -5·10^4; do not initialise lastEnd to 0.', args: [[[-50000, 50000], [-3, -1], [-1, 0], [0, 2]]], expected: 1 },
    { scenario: 'All negative intervals', hint: 'With lastEnd initialised to 0, every negative interval looks like it overlaps.', args: [[[-10, -8], [-8, -5], [-6, -2]]], expected: 1 },
    { scenario: 'Same end, different starts', hint: 'Ties on end: either one can be kept, but only one of them.', args: [[[1, 5], [3, 5], [5, 6], [0, 5]]], expected: 2 },
    { scenario: 'Large input (n = 10^5)', hint: 'The O(n²) LIS-style DP is too slow here. Greedy by earliest end is O(n log n).', argsGen: '() => { let s = 3; const r = (m) => (s = (s * 48271) % 2147483647) % m; return [Array.from({ length: 100000 }, () => { const a = r(100000) - 50000; return [a, Math.min(50000, a + 1 + r(50))]; }).filter((x) => x[0] < x[1])]; }', expected: 88741, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function eraseOverlapIntervals(intervals) {
  const sorted = intervals.toSorted((a, b) => a[1] - b[1]); // earliest end first
  let kept = 0;
  let lastEnd = -Infinity;
  for (const [s, e] of sorted) {
    if (s >= lastEnd) {   // touching is fine
      kept++;
      lastEnd = e;
    }
  }
  return intervals.length - kept;
}`,
  },
  dryRun: {
    columns: ['sorted by end', 'lastEnd', 's >= lastEnd?', 'kept'],
    rows: [
      ['[1,2]', '-∞', '✓', '1'],
      ['[2,3]', '2', '2 >= 2 ✓', '2'],
      ['[1,3]', '3', '1 >= 3 ✗ remove', '2'],
      ['[3,4]', '3', '3 >= 3 ✓', '3'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sort plus one pass; `toSorted` copies the array (use `sort` in place for O(1) extra if mutation is allowed).' },
  alternative: {
    title: 'Sort by start, drop the longer-ending one on conflict',
    md: 'Sort by start; keep `prevEnd`. On overlap (`s < prevEnd`), count a removal and keep the smaller end: `prevEnd = Math.min(prevEnd, e)`. It is the same greedy — always keep whichever ends first.',
    code: `function eraseOverlapIntervals(intervals) {
  const sorted = intervals.toSorted((a, b) => a[0] - b[0]);
  let removed = 0, prevEnd = -Infinity;
  for (const [s, e] of sorted) {
    if (s < prevEnd) { removed++; prevEnd = Math.min(prevEnd, e); }
    else prevEnd = e;
  }
  return removed;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Sorting by start and always keeping the earlier interval — [1,100] blocks everything.',
    'Using `s > lastEnd`: touching intervals are allowed here.',
    'Returning the number kept instead of the number removed.',
  ],
};
