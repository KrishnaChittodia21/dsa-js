export default {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  difficulty: 'Medium',
  order: 1,
  pattern: 'intervals-merge',
  tags: ['array', 'sorting', 'intervals'],
  source: { platform: 'LeetCode', number: 56, url: 'https://leetcode.com/problems/merge-intervals/' },

  statement: `You are given an array of closed intervals \`intervals[i] = [start_i, end_i]\` in no particular order. Combine every group of overlapping intervals into a single interval and return the resulting list of **disjoint** intervals, **sorted by start**.

Intervals that merely touch (like \`[1,4]\` and \`[4,5]\`) count as overlapping.`,
  examples: [
    { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: '[1,3] and [2,6] overlap and become [1,6].' },
    { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'They touch at 4.' },
    { input: 'intervals = [[4,7],[1,4]]', output: '[[1,7]]' },
  ],
  constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= start_i <= end_i <= 10^4'],

  think: `- If the intervals were sorted by start, which previously seen interval could the next one overlap?
- When the next interval overlaps the current block, what is the new end — the new interval's end, or something else?
- How do you sort pairs correctly in JavaScript?`,
  patternChallenge: {
    options: ['Sweep line counting overlaps', 'Greedy by earliest end', 'Sort by start & merge', 'Two-pointer intersection'],
    answer: 2,
    explanation: 'We need the union of the intervals themselves. Sorting by start makes every overlap happen with the current block, so one pass merges everything. Greedy-by-end is for *choosing* intervals; a sweep counts overlaps but does not build merged ranges as directly.',
  },
  hints: [
    'Sort by start with `(a, b) => a[0] - b[0]` — never the default sort.',
    'Compare each interval with the **last interval in the output**. Overlap if `start <= last[1]`; then `last[1] = Math.max(last[1], end)`.',
  ],
  approach: `**Brute force:** repeatedly find any pair that overlaps and replace it with its union until no pair overlaps — O(n²) per round, up to n rounds → O(n³).

**Optimized:** sort by start (O(n log n)). Walk the sorted list keeping the output's last interval as the "current block":
- \`start <= last.end\` → overlap → extend \`last.end = max(last.end, end)\` (max, because a later interval may be contained in the block);
- otherwise → gap → push a copy of the interval as a new block.

Correctness: after sorting, if the next interval starts after the block's end, every later interval also starts after it, so the block is final.`,

  functionName: 'merge',
  paramNames: ['intervals'],
  starterCode: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: one overlapping pair, two isolated intervals.', args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
    { scenario: 'Example 2', hint: 'Intervals that only touch at an endpoint ([1,4] and [4,5]) still overlap — compare with `<=`, not `<`.', args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
    { scenario: 'Example 3', hint: 'The input is not sorted. Sort by start before merging.', args: [[[4, 7], [1, 4]]], expected: [[1, 7]] },
    { scenario: 'Single point interval', hint: 'One interval with start = end must be returned unchanged as [[5,5]].', args: [[[5, 5]]], expected: [[5, 5]] },
    { scenario: 'Duplicate zero intervals', hint: 'Identical intervals (here at 0) collapse into one; make sure 0 is not treated as "no interval".', args: [[[0, 0], [0, 0]]], expected: [[0, 0]] },
    { scenario: 'Contained intervals', hint: 'Setting `last[1] = end` instead of `Math.max(last[1], end)` shrinks [1,10] when a smaller interval like [2,3] follows.', args: [[[1, 10], [2, 3], [4, 5], [6, 7]]], expected: [[1, 10]] },
    { scenario: 'Multi-digit unsorted starts', hint: 'Default `sort()` compares as strings and puts "10,12" before "9,11" — pass a numeric comparator.', args: [[[10, 12], [9, 11], [1, 2]]], expected: [[1, 2], [9, 12]] },
    { scenario: 'No overlaps', hint: 'Disjoint intervals with gaps of 1 ([1,2] and [3,4]) do not touch, so nothing merges.', args: [[[1, 2], [3, 4], [5, 6]]], expected: [[1, 2], [3, 4], [5, 6]] },
    { scenario: 'Reverse sorted input', hint: 'Disjoint intervals given in descending order must come out sorted by start.', args: [[[7, 8], [4, 5], [1, 2]]], expected: [[1, 2], [4, 5], [7, 8]] },
    { scenario: 'Touching chain merges fully', hint: 'Each interval touches the next — the running block must keep stretching until the end.', args: [[[3, 4], [1, 2], [2, 3], [4, 5]]], expected: [[1, 5]] },
    { scenario: 'Duplicates and nesting mixed', hint: 'Repeated, nested and point intervals together — compare with `<=` and extend with Math.max.', args: [[[2, 3], [2, 2], [3, 3], [1, 3], [5, 7], [2, 2], [4, 6]]], expected: [[1, 3], [4, 7]] },
    { scenario: 'Everything merges into one', hint: 'A single wide interval appears last; after sorting it must absorb everything.', args: [[[3, 5], [7, 9], [11, 13], [0, 10000]]], expected: [[0, 10000]] },
    { scenario: 'Large shuffled input (n ≈ 10^4)', hint: 'Repeatedly merging any overlapping pair is O(n²)–O(n³). Sort once by start and merge in a single pass: O(n log n).', argsGen: '() => { let s = 7; const r = (m) => (s = (s * 48271) % 2147483647) % m; const a = []; for (let i = 0; i < 10000; i++) if (i !== 4999 && i !== 5000) a.push([i, i + 1]); for (let i = a.length - 1; i > 0; i--) { const j = r(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return [a]; }', expected: [[0, 4999], [5001, 10000]], timeLimitMs: 1000 },
  ],

  solution: {
    code: `function merge(intervals) {
  const sorted = intervals.toSorted((a, b) => a[0] - b[0]);
  const out = [];
  for (const [start, end] of sorted) {
    const last = out[out.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end); // overlap: stretch the current block
    } else {
      out.push([start, end]);            // gap: push a COPY as a new block
    }
  }
  return out;
}`,
    explanation: 'Pushing `[start, end]` (a new array) means mutating `last[1]` later never changes the caller\'s input.',
  },
  dryRun: {
    columns: ['interval', 'last block', 'start <= last[1]?', 'output'],
    rows: [
      ['[1,3]', '—', '—', '[[1,3]]'],
      ['[2,6]', '[1,3]', '2 <= 3 ✓ → end 6', '[[1,6]]'],
      ['[8,10]', '[1,6]', '8 <= 6 ✗', '[[1,6],[8,10]]'],
      ['[15,18]', '[8,10]', '15 <= 10 ✗', '[[1,6],[8,10],[15,18]]'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting dominates; the merge pass is O(n). The sorted copy and output are O(n).' },
  alternative: {
    title: 'Sweep over events',
    md: 'Create events `[start, +1]` and `[end, -1]`, sort with starts before ends at equal times (closed intervals), and emit a merged interval whenever the active count goes from 0 to 1 (open) and back to 0 (close). Same O(n log n), more moving parts.',
    code: `function merge(intervals) {
  const ev = [];
  for (const [s, e] of intervals) ev.push([s, -1], [e, 1]); // -1 = start sorts first on ties
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = [];
  let active = 0, open = 0;
  for (const [t, kind] of ev) {
    if (kind === -1) { if (active++ === 0) open = t; }
    else if (--active === 0) out.push([open, t]);
  }
  return out;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Using `intervals.sort()` without a comparator — sorts "10,12" before "9,11".',
    '`last[1] = end` instead of `Math.max(last[1], end)` — breaks on contained intervals like [1,10], [2,3].',
    'Using `<` — touching intervals [1,4],[4,5] must merge.',
    'Pushing the original interval objects and then mutating them (changes the input).',
  ],
};
