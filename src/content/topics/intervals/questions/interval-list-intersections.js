export default {
  id: 'interval-list-intersections',
  title: 'Interval List Intersections',
  difficulty: 'Medium',
  order: 6,
  pattern: 'intervals-two-pointer-intersection',
  tags: ['array', 'two pointers', 'intervals'],
  source: { platform: 'LeetCode', number: 986, url: 'https://leetcode.com/problems/interval-list-intersections/' },

  statement: `You are given two lists of closed intervals, \`firstList\` and \`secondList\`. Each list is sorted and its intervals are pairwise disjoint.

Return every intersection of an interval from the first list with an interval from the second list, in sorted order. The intersection of two closed intervals is either empty or a closed interval (possibly a single point such as \`[5,5]\`).`,
  examples: [
    { input: 'firstList = [[0,2],[5,10],[13,23],[24,25]], secondList = [[1,5],[8,12],[15,24],[25,26]]', output: '[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]' },
    { input: 'firstList = [[1,3],[5,9]], secondList = []', output: '[]' },
  ],
  constraints: ['0 <= firstList.length, secondList.length <= 1000', '0 <= start_i < end_i <= 10^9', 'Each list is sorted and pairwise disjoint'],

  think: `- For one interval from each list, how do you compute their intersection in O(1)?
- After handling the current pair, which interval can never intersect anything else? Why?
- Can one interval from the first list intersect several from the second?`,
  patternChallenge: {
    options: ['Merge both lists together and look for overlaps', 'Two-pointer intersection', 'Sweep line with a heap', 'Binary search each interval in the other list'],
    answer: 1,
    explanation: 'Two sorted, disjoint lists → walk both with two pointers, discarding the interval that ends first. Binary search per interval works (O(n log m) plus output) but is more complex; merging loses which list each interval came from.',
  },
  hints: [
    'Intersection of `a` and `b` is `[max(a0, b0), min(a1, b1)]`, non-empty when `lo <= hi`.',
    'Advance the pointer of the interval with the smaller end — it is finished.',
  ],
  approach: `**Brute force:** compare every pair — O(n · m). With 1000 × 1000 this passes, but ignores sortedness.

**Optimized — two pointers, O(n + m):**
- \`lo = max(A[i][0], B[j][0])\`, \`hi = min(A[i][1], B[j][1])\`; if \`lo <= hi\`, record \`[lo, hi]\`.
- If \`A[i][1] < B[j][1]\`, then \`A[i]\` cannot meet \`B[j + 1]\` (which starts after \`B[j]\` ends > \`A[i]\` ends), so \`i++\`; otherwise \`j++\`.

Each step discards one interval, so there are at most \`n + m\` steps. Results come out sorted because both pointers only move forward.`,

  functionName: 'intervalIntersection',
  paramNames: ['firstList', 'secondList'],
  starterCode: `/**
 * @param {number[][]} firstList
 * @param {number[][]} secondList
 * @return {number[][]}
 */
function intervalIntersection(firstList, secondList) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: several overlaps including single-point ones like [5,5] and [24,24].', args: [[[0, 2], [5, 10], [13, 23], [24, 25]], [[1, 5], [8, 12], [15, 24], [25, 26]]], expected: [[1, 2], [5, 5], [8, 10], [15, 23], [24, 24], [25, 25]] },
    { scenario: 'Example 2', hint: 'One list is empty, so there are no intersections — return [].', args: [[[1, 3], [5, 9]], []], expected: [] },
    { scenario: 'First list empty', hint: 'Your loop must stop immediately when the first list is empty.', args: [[], [[4, 8]]], expected: [] },
    { scenario: 'Both lists empty', hint: 'Nothing to intersect — return an empty array without indexing into either list.', args: [[], []], expected: [] },
    { scenario: 'Single partial overlap', hint: 'The intersection is [max(starts), min(ends)].', args: [[[1, 7]], [[3, 10]]], expected: [[3, 7]] },
    { scenario: 'One interval spans many', hint: 'Advance the pointer of the interval that ends first — [0,100] must stay while the other list moves on.', args: [[[0, 100]], [[1, 2], [5, 6], [99, 200]]], expected: [[1, 2], [5, 6], [99, 100]] },
    { scenario: 'Single-point intersections', hint: 'Closed intervals sharing only an endpoint intersect in a point like [2,2]; using `lo < hi` drops them.', args: [[[1, 2], [4, 5]], [[2, 4]]], expected: [[2, 2], [4, 4]] },
    { scenario: 'No overlap at all', hint: 'Intervals never meet — every candidate has lo > hi, so the result is [].', args: [[[1, 2], [6, 7]], [[3, 4], [8, 9]]], expected: [] },
    { scenario: 'Identical lists', hint: 'Equal intervals: after recording, advancing only one pointer is fine — but do not record the same pair twice.', args: [[[1, 3], [5, 7]], [[1, 3], [5, 7]]], expected: [[1, 3], [5, 7]] },
    { scenario: 'Advance the earlier end', hint: 'Advancing the interval that starts first (instead of the one that ends first) skips [11,12] and [14,15].', args: [[[3, 5], [9, 20]], [[4, 5], [7, 10], [11, 12], [14, 15], [16, 20]]], expected: [[4, 5], [9, 10], [11, 12], [14, 15], [16, 20]] },
    { scenario: 'Do not advance both', hint: 'After [1,4]∩[2,3], [1,4] can still meet [4,6]. Advancing both pointers misses [4,4].', args: [[[1, 4]], [[2, 3], [4, 6]]], expected: [[2, 3], [4, 4]] },
    { scenario: 'Large coordinates', hint: 'Endpoints up to 10^9 — no special handling needed, but avoid building arrays indexed by coordinate.', args: [[[0, 1000000000]], [[999999999, 1000000000]]], expected: [[999999999, 1000000000]] },
    { scenario: 'Large lists (1000 each)', hint: 'Interleaved lists that only meet at the very end — two pointers must walk both lists without skipping the final overlap.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => [2000 * i, 2000 * i + 500]), Array.from({ length: 1000 }, (_, i) => (i === 999 ? [1998400, 1999500] : [2000 * i + 1000, 2000 * i + 1500]))]', expected: [[1998400, 1998500]] },
  ],

  solution: {
    code: `function intervalIntersection(firstList, secondList) {
  const out = [];
  let i = 0, j = 0;
  while (i < firstList.length && j < secondList.length) {
    const [a0, a1] = firstList[i];
    const [b0, b1] = secondList[j];
    const lo = Math.max(a0, b0);
    const hi = Math.min(a1, b1);
    if (lo <= hi) out.push([lo, hi]);   // closed: a single point counts
    if (a1 < b1) i++;                   // the earlier-ending interval is done
    else j++;
  }
  return out;
}`,
  },
  dryRun: {
    columns: ['A[i]', 'B[j]', '[lo, hi]', 'record?', 'advance'],
    rows: [
      ['[0,2]', '[1,5]', '[1,2]', '✓', 'i (2 < 5)'],
      ['[5,10]', '[1,5]', '[5,5]', '✓', 'j (10 > 5)'],
      ['[5,10]', '[8,12]', '[8,10]', '✓', 'i'],
      ['[13,23]', '[8,12]', '[13,12]', '✗', 'j'],
      ['[13,23]', '[15,24]', '[15,23]', '✓', 'i'],
      ['[24,25]', '[15,24]', '[24,24]', '✓', 'j'],
      ['[24,25]', '[25,26]', '[25,25]', '✓', 'i → done'],
    ],
  },
  complexity: { time: 'O(n + m)', space: 'O(1) extra', explanation: 'Each iteration advances one pointer; the output list is not counted.' },
  alternative: {
    title: 'All pairs',
    md: 'Double loop over both lists, recording every non-empty `[max, min]`. O(n · m), but results are still produced in sorted order because both lists are sorted and disjoint.',
    code: `function intervalIntersection(A, B) {
  const out = [];
  for (const [a0, a1] of A)
    for (const [b0, b1] of B) {
      const lo = Math.max(a0, b0), hi = Math.min(a1, b1);
      if (lo <= hi) out.push([lo, hi]);
    }
  return out;
}`,
    complexity: 'O(n · m) time, O(1) extra space',
  },
  mistakes: [
    'Using `lo < hi` — single-point intersections like [5,5] are valid for closed intervals.',
    'Advancing both pointers after recording an intersection.',
    'Advancing the pointer of the interval that starts first instead of the one that ends first.',
  ],
};
