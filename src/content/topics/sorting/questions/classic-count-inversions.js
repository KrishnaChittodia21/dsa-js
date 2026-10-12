export default {
  id: 'classic-count-inversions',
  title: 'Count Inversions',
  difficulty: 'Hard',
  order: 1,
  pattern: 'sorting-merge-sort',
  tags: ['array', 'merge sort', 'divide and conquer'],
  source: { platform: 'Classic', note: 'Standard divide-and-conquer textbook problem (counting inversions with merge sort).' },

  statement: `An **inversion** in an array \`nums\` is a pair of indices \`(i, j)\` with \`i < j\` and \`nums[i] > nums[j]\` — two elements that are in the "wrong" order.

Return the total number of inversions in \`nums\`. (It measures how far the array is from being sorted: 0 for a sorted array, n(n−1)/2 for a strictly decreasing one.)

Do not modify the input array.`,
  examples: [
    { input: 'nums = [2,4,1,3,5]', output: '3', explanation: 'The pairs (2,1), (4,1) and (4,3).' },
    { input: 'nums = [1,2,3]', output: '0' },
    { input: 'nums = [3,2,1]', output: '3' },
  ],
  constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', 'Equal values do NOT form an inversion'],

  think: `- The brute force checks every pair. Where does it waste work?
- Split the array into halves. Which inversions are *inside* a half, and which *cross* the split?
- If both halves were sorted, how quickly could you count the crossing inversions?`,
  patternChallenge: {
    options: ['Two Pointers on the sorted array', 'Merge sort with counting in the merge step', 'Sliding Window', 'Hash Map of counts'],
    answer: 1,
    explanation: '"Count pairs i < j with a[i] > a[j]" is the signature of merge-sort counting: inversions split into left-only, right-only (recursive calls) and cross pairs, and the cross pairs are counted in O(1) per step while merging sorted halves. Sorting alone loses the original order, so two pointers on a sorted array cannot see i < j.',
  },
  hints: [
    'Run merge sort. Every inversion is inside the left half, inside the right half, or has one element on each side.',
    'While merging, when you take the right element `a[j]` because `a[i] > a[j]`, every remaining left element `a[i..mid)` is also greater — add `mid − i`.',
  ],
  approach: `**Brute force:** double loop over all pairs i < j → O(n²): 5·10⁹ steps for n = 10⁵. Too slow.

**Merge sort counting:**
1. \`sort(lo, hi)\` returns the inversions inside \`[lo, hi)\` and leaves that range sorted.
2. \`count = sort(lo, mid) + sort(mid, hi)\` — inversions inside each half.
3. Merge. If \`a[i] <= a[j]\`, take \`a[i]\` (no inversion — note \`<=\` so equal values are not counted). Otherwise \`a[i] > a[j]\` and, because the left half is sorted, all of \`a[i..mid)\` exceed \`a[j]\`; they were all before \`a[j]\` originally → \`count += mid − i\`.

Sorting inside each half does not change *which side* an element is on, so cross pairs are counted exactly once. Work a copy of the input so the caller's array is untouched.

The answer is at most n(n−1)/2 ≈ 5·10⁹ < 2⁵³, so a normal JS number is exact.`,

  functionName: 'countInversions',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function countInversions(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: (2,1), (4,1) and (4,3).', args: [[2,4,1,3,5]], expected: 3 },
    { scenario: 'Example 2', hint: 'An already sorted array has no inversions.', args: [[1,2,3]], expected: 0 },
    { scenario: 'Example 3', hint: 'A strictly decreasing array has n(n−1)/2 inversions.', args: [[3,2,1]], expected: 3 },
    { scenario: 'Empty array', hint: 'n = 0 is allowed — return 0 without touching indices.', args: [[]], expected: 0 },
    { scenario: 'Single element', hint: 'One element cannot form a pair.', args: [[7]], expected: 0 },
    { scenario: 'Two elements inverted', hint: 'The smallest non-trivial inversion.', args: [[2,1]], expected: 1 },
    { scenario: 'All equal', hint: 'Using < in the merge: equal values get counted as inversions. Equal values are never an inversion — take from the left on ties.', args: [[5,5,5]], expected: 0 },
    { scenario: 'Duplicates mixed', hint: 'Each 3 is greater than each later 1, but the two 3s and the two 1s do not count among themselves.', args: [[3,1,3,1]], expected: 3 },
    { scenario: 'Multiple inversions per element', hint: 'Adding 1 instead of mid − i when a right element wins: every remaining left element is larger, so all of them count.', args: [[1,20,6,4,5]], expected: 5 },
    { scenario: 'Extreme values', hint: 'Values span ±10^9 — compare them directly; never subtract into a sentinel.', args: [[-1,-5,1000000000,-1000000000]], expected: 4 },
    { scenario: 'Negatives only', hint: 'Make sure negative values compare numerically.', args: [[-3,-10,-2,-10,0]], expected: 3 },
    { scenario: 'Reverse sorted (n = 60)', hint: 'Strictly decreasing: every pair is an inversion, 60·59/2.', argsGen: '() => [Array.from({ length: 60 }, (_, i) => 60 - i)]', expected: 1770 },
    { scenario: 'Large reverse sorted (n = 10^5)', hint: 'The O(n²) double loop is far too slow for 10^5; count during merge sort. The answer (~5·10^9) also exceeds 32-bit range — do not use | 0 tricks on the count.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => 100000 - i)]', expected: 4999950000, timeLimitMs: 1000 },
    { scenario: 'Large random (n = 10^5)', hint: 'Random values with duplicates at full size — merge-sort counting is O(n log n); a double loop is ~5·10^9 steps.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 100000 }, () => (r() % 2000000001) - 1000000000)]; }', expected: 2499551534, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function countInversions(nums) {
  const a = [...nums];                 // work on a copy
  const buf = new Array(a.length);

  function sort(lo, hi) {              // counts inversions in a[lo..hi) and sorts it
    if (hi - lo <= 1) return 0;
    const mid = (lo + hi) >> 1;
    let count = sort(lo, mid) + sort(mid, hi);
    let i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
      if (a[i] <= a[j]) {
        buf[k++] = a[i++];
      } else {
        count += mid - i;              // a[i..mid) are all > a[j]
        buf[k++] = a[j++];
      }
    }
    while (i < mid) buf[k++] = a[i++];
    while (j < hi) buf[k++] = a[j++];
    for (let t = lo; t < hi; t++) a[t] = buf[t];
    return count;
  }

  return sort(0, a.length);
}`,
  },
  dryRun: {
    columns: ['merge', 'left', 'right', 'cross inversions', 'running total'],
    rows: [
      ['[2] + [4]', '[2]', '[4]', '0', '0'],
      ['right half: [1] + [3,5]', '[1]', '[3,5]', '0', '0'],
      ['[2,4] + [1,3,5]', '[2,4]', '[1,3,5]', 'take 1: +2; take 3: +1', '3'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Plain merge sort plus O(1) extra work per merge step; one copy and one buffer.' },
  alternative: {
    title: 'Fenwick tree over compressed values',
    md: 'Scan right to left; for each value, the number of already-seen smaller values is an inversion count, queried from a Fenwick tree (Binary Indexed Tree) over value ranks. Same O(n log n); you will meet Fenwick trees in Advanced Structures.',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Using `<` in the merge: equal values get counted as inversions.',
    'Adding 1 instead of `mid − i` when the right element wins.',
    'Sorting the input in place and destroying the caller\'s array.',
    'Counting with the O(n²) double loop — fine for n = 1000, far too slow for 10⁵.',
  ],
};
