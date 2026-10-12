export default {
  id: 'median-of-two-sorted-arrays',
  title: 'Median of Two Sorted Arrays',
  difficulty: 'Hard',
  order: 3,
  pattern: 'binary-search-partition',
  tags: ['array', 'binary search', 'divide and conquer'],
  source: { platform: 'LeetCode', number: 4, url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/' },

  statement: `Given two sorted arrays \`nums1\` (size m) and \`nums2\` (size n), return the **median** of all m + n numbers together.

The median is the middle value of the merged sorted list, or the average of the two middle values when the total is even. The intended solution runs in **O(log (m + n))**.`,
  examples: [
    { input: 'nums1 = [1,3], nums2 = [2]', output: '2', explanation: 'merged = [1,2,3]' },
    { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5', explanation: 'merged = [1,2,3,4] → (2 + 3) / 2' },
  ],
  constraints: ['0 <= m, n <= 1000', '1 <= m + n <= 2000', '-10^6 <= values <= 10^6'],

  think: `- The median splits the merged list into a left half and a right half. If you take i elements from nums1 for the left half, how many must come from nums2?
- What four numbers decide whether a cut is correct?
- If the cut is wrong, how do you know which way to move it?`,
  patternChallenge: {
    options: ['Merge with two pointers (O(m + n))', 'Binary Search — partition the shorter array', 'Two heaps (running median)', 'Sort the concatenation'],
    answer: 1,
    explanation: 'Merging is correct but linear. The logarithmic solution binary searches how many elements of the shorter array belong to the left half; the cut in the other array is then forced, and the validity test tells you which direction to move. Heaps are for streaming medians.',
  },
  hints: [
    'Let A be the shorter array, half = floor((m + n + 1) / 2). Choose i from A (0..m) → j = half − i from B. Use −∞/+∞ when a side of a cut is empty.',
    'Valid when A[i−1] ≤ B[j] and B[j−1] ≤ A[i]. If A[i−1] > B[j], i is too big (hi = i − 1); else if B[j−1] > A[i], i is too small (lo = i + 1).',
  ],
  approach: `**Brute force:** concatenate and sort — O((m + n) log(m + n)). **Merge:** two pointers until the middle — O(m + n).

**Optimized (partition):**
- Make \`A\` the shorter array (length m) and \`B\` the other (length n). \`half = (m + n + 1) >> 1\` (left half gets the extra element when the total is odd).
- Binary search \`i ∈ [0, m]\` (elements of A in the left half); \`j = half − i\`.
- Let \`Aleft = A[i−1]\`, \`Aright = A[i]\`, \`Bleft = B[j−1]\`, \`Bright = B[j]\` (±Infinity beyond the ends).
- **Valid** iff \`Aleft <= Bright && Bleft <= Aright\` — then all left elements ≤ all right elements (each array is sorted internally, so only the cross pairs need checking).
- \`Aleft > Bright\` → too many from A → \`hi = i − 1\`. Otherwise \`lo = i + 1\`.
- Median: odd total → \`max(Aleft, Bleft)\`; even → \`(max(Aleft, Bleft) + min(Aright, Bright)) / 2\`.

Searching the shorter array guarantees \`0 ≤ j ≤ n\` and gives O(log min(m, n)).`,

  functionName: 'findMedianSortedArrays',
  paramNames: ['nums1', 'nums2'],
  starterCode: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
function findMedianSortedArrays(nums1, nums2) {
  
}
`,
  compare: 'float',
  tests: [
    { scenario: 'Example 1', hint: 'Odd total length: the median is the single middle element of the merged array.', args: [[1, 3], [2]], expected: 2 },
    { scenario: 'Example 2', hint: 'Even total length: average the two middle elements (2 and 3).', args: [[1, 2], [3, 4]], expected: 2.5 },
    { scenario: 'First array empty', hint: 'A cut in an empty array is always at 0. Use ±Infinity sentinels when a side has no elements.', args: [[], [1]], expected: 1 },
    { scenario: 'Second array empty', hint: 'If you always binary search nums1, the other array being empty must still work — swap so you search the shorter one.', args: [[2], []], expected: 2 },
    { scenario: 'One element each', hint: 'Total length 2: the median is the average of both values, 1.5.', args: [[1], [2]], expected: 1.5 },
    { scenario: 'Even total, not floored', hint: '(3 + 4) / 2 = 3.5. JS `/` already returns a float — do not Math.floor the average.', args: [[1, 4], [2, 3, 6, 7]], expected: 3.5 },
    { scenario: 'All zeros', hint: 'Every value equal: any valid partition gives 0.', args: [[0, 0], [0, 0]], expected: 0 },
    { scenario: 'nums1 entirely smaller', hint: 'The partition puts all of nums1 on the left; the cut in nums1 is at its very end (right side = +∞).', args: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]], expected: 5.5 },
    { scenario: 'nums1 entirely larger', hint: 'The cut in nums1 is at 0, so its left side is empty (-∞).', args: [[6, 7, 8], [1, 2, 3]], expected: 4.5 },
    { scenario: 'Interleaved arrays', hint: 'Values alternate between arrays; the correct cut balances maxLeft <= minRight on both sides.', args: [[1, 3, 8, 9, 15], [7, 11, 18, 19, 21, 25]], expected: 11 },
    { scenario: 'Negative values', hint: 'Medians can be negative; nothing in the partition logic should assume positive numbers.', args: [[-5, -3], [-4, 100, 200]], expected: -3 },
    { scenario: 'Many duplicates', hint: 'Equal values across the cut: compare with <=, not <, or no partition looks valid.', args: [[1, 1, 1], [1, 1, 1, 2]], expected: 1 },
    { scenario: 'First array much longer', hint: 'Binary searching the longer array makes j = half - i go negative. Always search the shorter array.', args: [[1, 2, 3, 4, 5, 6, 7, 8], [9]], expected: 5 },
    { scenario: 'Extreme values', hint: 'Values at ±10^6: the average is exactly 0. Sentinels must lie outside this range (use ±Infinity).', args: [[-1000000, -1000000], [1000000, 1000000]], expected: 0 },
    { scenario: 'Largest input (m = n = 1000)', hint: 'Two 1000-element interleaved arrays — the partition search must still land on the exact middle pair.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => 2 * i - 999), Array.from({ length: 1000 }, (_, i) => 2 * i * 3 - 2500)]', expected: 124 },
  ],

  solution: {
    code: `function findMedianSortedArrays(nums1, nums2) {
  // binary search the SHORTER array so j = half - i stays in range
  if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
  const A = nums1, B = nums2, m = A.length, n = B.length;
  const half = (m + n + 1) >> 1;             // size of the left half

  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = lo + ((hi - lo) >> 1);         // elements taken from A
    const j = half - i;                      // elements taken from B
    const Aleft = i > 0 ? A[i - 1] : -Infinity;
    const Aright = i < m ? A[i] : Infinity;
    const Bleft = j > 0 ? B[j - 1] : -Infinity;
    const Bright = j < n ? B[j] : Infinity;

    if (Aleft <= Bright && Bleft <= Aright) {
      const leftMax = Math.max(Aleft, Bleft);
      if ((m + n) % 2 === 1) return leftMax;
      return (leftMax + Math.min(Aright, Bright)) / 2;
    }
    if (Aleft > Bright) hi = i - 1;          // took too many from A
    else lo = i + 1;                         // took too few from A
  }
  throw new Error('inputs are not sorted');
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'i', 'j', 'Aleft | Aright', 'Bleft | Bright', 'decision'],
    rows: [
      ['0', '5', '2', '4', '3 | 8', '19 | 21', 'Bleft 19 > Aright 8 → lo = 3'],
      ['3', '5', '4', '2', '9 | 15', '11 | 18', 'Bleft 11 > Aright 15? no; Aleft 9 ≤ 18 ✓ valid'],
      ['—', '—', '—', '—', '—', '—', 'total 11 odd → max(9, 11) = 11'],
    ],
  },
  complexity: { time: 'O(log min(m, n))', space: 'O(1)', explanation: 'Binary search over the cut positions 0..m of the shorter array.' },
  alternative: {
    title: 'Two-pointer merge to the middle',
    md: 'Walk both arrays like the merge step of merge sort, stopping at index (m + n) / 2. Easy to get right, O(m + n) — a good first answer in an interview before the partition idea.',
    code: `function findMedianSortedArrays(a, b) {
  const total = a.length + b.length;
  let i = 0, j = 0, prev = 0, cur = 0;
  for (let k = 0; k <= total >> 1; k++) {
    prev = cur;
    if (j >= b.length || (i < a.length && a[i] <= b[j])) cur = a[i++];
    else cur = b[j++];
  }
  return total % 2 ? cur : (prev + cur) / 2;
}`,
    complexity: 'O(m + n) time, O(1) space',
  },
  mistakes: [
    'Binary searching the longer array → j can go negative or beyond n.',
    'Forgetting ±Infinity sentinels when a cut is at the very start or end.',
    'Using half = (m + n) / 2 without deciding which half owns the extra element for odd totals.',
    'Integer-dividing the even-case average — JS `/` already returns a float, don\'t floor it.',
  ],
};
