export default {
  id: 'remove-covered-intervals',
  title: 'Remove Covered Intervals',
  difficulty: 'Medium',
  order: 3,
  pattern: 'intervals-merge',
  tags: ['array', 'sorting', 'intervals'],
  source: { platform: 'LeetCode', number: 1288, url: 'https://leetcode.com/problems/remove-covered-intervals/' },

  statement: `Given a list of intervals \`[l, r)\`, delete every interval that is **covered** by another interval in the list. Interval \`[a, b)\` is covered by \`[c, d)\` when \`c <= a\` and \`b <= d\`.

Return how many intervals remain. All intervals are distinct.`,
  examples: [
    { input: 'intervals = [[1,4],[3,6],[2,8]]', output: '2', explanation: '[3,6] is covered by [2,8].' },
    { input: 'intervals = [[1,4],[2,3]]', output: '1' },
  ],
  constraints: ['1 <= intervals.length <= 1000', '0 <= l_i < r_i <= 10^5', 'All intervals are unique'],

  think: `- If you sort by start, a covering interval must come **before** the interval it covers. What if two intervals have the same start?
- While scanning, what single number tells you whether the current interval is covered by some earlier one?`,
  patternChallenge: {
    options: ['Greedy by earliest end', 'Sort by start (end descending) and track the max end', 'Binary search for each interval', 'Two-pointer intersection'],
    answer: 1,
    explanation: 'A sort-by-start scan — like merging — but the state is the maximum end seen so far. The tie-break (end descending) guarantees that among equal starts the longest comes first and covers the rest.',
  },
  hints: [
    'Sort by `a[0] - b[0] || b[1] - a[1]`.',
    'An interval is covered iff its end is `<=` the maximum end of all earlier intervals. Otherwise count it and update the max.',
  ],
  approach: `**Brute force:** for every interval, check every other interval for coverage — O(n²). Fine for n = 1000, but not the intended idea.

**Optimized:** sort by start ascending, and for equal starts by end **descending**. Scan with \`maxEnd\`:
- every earlier interval has start \`<=\` the current start;
- so the current interval is covered iff some earlier one has end \`>=\` its end, i.e. \`end <= maxEnd\`.

Without the tie-break, \`[1,2]\` could come before \`[1,4]\` and would not be recognised as covered.`,

  functionName: 'removeCoveredIntervals',
  paramNames: ['intervals'],
  starterCode: `/**
 * @param {number[][]} intervals
 * @return {number}
 */
function removeCoveredIntervals(intervals) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[3,6] lies inside [2,8], so 2 intervals remain.', args: [[[1, 4], [3, 6], [2, 8]]], expected: 2 },
    { scenario: 'Example 2', hint: '[2,3] is covered by [1,4].', args: [[[1, 4], [2, 3]]], expected: 1 },
    { scenario: 'Single interval', hint: 'A lone interval is never covered — answer 1.', args: [[[1, 2]]], expected: 1 },
    { scenario: 'Equal starts', hint: 'Without the end-descending tie-break, [1,2] is processed before [1,4] and is not detected as covered.', args: [[[1, 2], [1, 4], [3, 4]]], expected: 1 },
    { scenario: 'Equal ends', hint: 'An interval with the same end and a later start is covered — count only when `end > maxEnd`, not `>=`.', args: [[[3, 10], [4, 10], [5, 11]]], expected: 2 },
    { scenario: 'No coverage at all', hint: 'Disjoint intervals: nothing is removed.', args: [[[1, 2], [3, 4], [5, 6]]], expected: 3 },
    { scenario: 'Partial overlap is not cover', hint: '[0,10] and [5,12] overlap, but neither contains the other — both stay.', args: [[[0, 10], [5, 12]]], expected: 2 },
    { scenario: 'One covers all', hint: 'A wide interval swallows every other one; only it remains.', args: [[[2, 3], [4, 5], [0, 100], [6, 99]]], expected: 1 },
    { scenario: 'Nested chain', hint: 'Each interval sits inside the previous; only the outermost survives.', args: [[[3, 6], [1, 8], [2, 7], [0, 9]]], expected: 1 },
    { scenario: 'Unsorted mixed input', hint: 'Sort by start (ascending) then end (descending) before scanning.', args: [[[1, 100], [2, 3], [4, 5], [6, 99], [0, 1]]], expected: 2 },
    { scenario: 'Touching but not covering', hint: 'Sharing an endpoint ([1,3] and [3,5]) is not coverage.', args: [[[1, 3], [3, 5], [5, 7]]], expected: 3 },
    { scenario: 'Zero and maximum bounds', hint: 'Endpoints at 0 and 10^5: both short intervals sit inside [0,100000], including the one sharing its start.', args: [[[0, 100000], [0, 1], [99999, 100000]]], expected: 1 },
    { scenario: 'Large input (n = 1000)', hint: 'Staggered intervals where every second one is covered — sort + one scan handles it.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => (i % 2 ? [50 * i + 1, 50 * i + 20] : [50 * i, 50 * i + 60]))]', expected: 1000 },
  ],

  solution: {
    code: `function removeCoveredIntervals(intervals) {
  // start ascending; on equal start, the LONGER interval first (it covers the others)
  const sorted = intervals.toSorted((a, b) => a[0] - b[0] || b[1] - a[1]);
  let remaining = 0;
  let maxEnd = -Infinity;
  for (const [, end] of sorted) {
    if (end > maxEnd) {   // not covered by anything earlier
      remaining++;
      maxEnd = end;
    }                     // else: covered — earlier start <= ours and earlier end >= ours
  }
  return remaining;
}`,
  },
  dryRun: {
    columns: ['sorted interval', 'maxEnd before', 'covered?', 'remaining'],
    rows: [
      ['[1,4]', '-∞', 'no', '1 (maxEnd 4)'],
      ['[2,8]', '4', 'no', '2 (maxEnd 8)'],
      ['[3,6]', '8', '6 <= 8 → yes', '2'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting dominates; `toSorted` makes an O(n) copy.' },
  alternative: {
    title: 'Pairwise check',
    md: 'For each interval, look for another that covers it. O(n²) — acceptable for n ≤ 1000 and a good first answer to state.',
    code: `function removeCoveredIntervals(intervals) {
  let remaining = 0;
  for (let i = 0; i < intervals.length; i++) {
    const covered = intervals.some((o, j) => j !== i && o[0] <= intervals[i][0] && intervals[i][1] <= o[1]);
    if (!covered) remaining++;
  }
  return remaining;
}`,
    complexity: 'O(n²) time, O(1) space',
  },
  mistakes: [
    'Missing the end-descending tie-break — [1,2] then [1,4] fails to detect that [1,2] is covered.',
    'Using `end >= maxEnd` to count: an interval with the same end and a later start is covered.',
  ],
};
