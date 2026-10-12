export default {
  id: 'sort-an-array',
  title: 'Sort an Array',
  difficulty: 'Medium',
  order: 1,
  pattern: 'sorting-merge-sort',
  tags: ['array', 'merge sort', 'divide and conquer'],
  source: { platform: 'LeetCode', number: 912, url: 'https://leetcode.com/problems/sort-an-array/' },

  statement: `Sort an integer array \`nums\` in ascending order and return it.

The catch: **do not use any built-in sort function**. Your algorithm must run in O(n log n) time and use as little extra memory as reasonably possible.`,
  examples: [
    { input: 'nums = [5,2,3,1]', output: '[1,2,3,5]' },
    { input: 'nums = [5,1,1,2,0,0]', output: '[0,0,1,1,2,5]', explanation: 'Duplicates are allowed.' },
  ],
  constraints: ['1 <= nums.length <= 5 * 10^4', '-5 * 10^4 <= nums[i] <= 5 * 10^4'],

  think: `- Which sorts guarantee O(n log n) even in the worst case?
- Quick sort is O(n log n) on average — what input would a fixed-pivot quicksort hate? (The judge includes such inputs.)
- Values lie in [−50000, 50000]. Is there a linear-time option too?`,
  patternChallenge: {
    options: ['Insertion sort', 'Merge sort', 'Quick sort with the first element as pivot', 'Binary search'],
    answer: 1,
    explanation: 'Merge sort is O(n log n) for every input and is easy to write correctly. Insertion sort is O(n²); a fixed-pivot quicksort degrades to O(n²) on sorted or all-equal inputs; binary search does not sort.',
  },
  hints: [
    'Split into halves recursively until pieces have length ≤ 1, then merge sorted halves with two pointers.',
    'Allocate one buffer of length n up front and merge the index ranges [lo, mid) and [mid, hi) through it to avoid creating arrays at every level.',
  ],
  approach: `**Brute force:** insertion or selection sort — O(n²), about 1.25·10⁹ steps for n = 5·10⁴: too slow.

**Optimized — merge sort:**
1. \`sort(lo, hi)\` sorts the half-open range \`[lo, hi)\`. Base case: length ≤ 1.
2. Recurse on \`[lo, mid)\` and \`[mid, hi)\`.
3. Merge: two pointers \`i\`, \`j\`, write the smaller (ties → left, for stability) into \`buf\`, then copy back.

log₂ n levels × O(n) merging per level = O(n log n) always. Recursion depth is only ~16 here.

**Also fine:** randomised quicksort with 3-way partition (in place, O(n log n) expected), or counting sort with an offset of 50000 (O(n + 10⁵)).`,

  functionName: 'sortArray',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function sortArray(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement.', args: [[5,2,3,1]], expected: [1,2,3,5] },
    { scenario: 'Example 2', hint: 'Duplicates are allowed and must all be kept.', args: [[5,1,1,2,0,0]], expected: [0,0,1,1,2,5] },
    { scenario: 'Single element', hint: 'The smallest input — already sorted.', args: [[1]], expected: [1] },
    { scenario: 'Two elements', hint: 'The smallest case that needs a swap.', args: [[2,1]], expected: [1,2] },
    { scenario: 'Extreme values', hint: 'Values reach ±5·10^4 — compare numerically.', args: [[-3,10,-50000,50000,0,9]], expected: [-50000,-3,0,9,10,50000] },
    { scenario: 'All equal', hint: 'All-equal input: a 2-way quicksort partition degrades to O(n²) here.', args: [[7,7,7,7,7]], expected: [7,7,7,7,7] },
    { scenario: 'Reverse sorted', hint: 'Worst case for naive pivots and insertion sort.', args: [[10,9,8,7,6,5,4,3,2,1,0]], expected: [0,1,2,3,4,5,6,7,8,9,10] },
    { scenario: 'Multi-digit values', hint: 'nums.sort() without a comparator sorts as strings (1, 100, 1000, 25, 5) — and built-ins are not allowed anyway.', args: [[100,25,5,1,1000]], expected: [1,5,25,100,1000] },
    { scenario: 'Negatives only', hint: 'String order would put −1 before −10; numeric order is −10, −2, −1.', args: [[-1,-10,-2]], expected: [-10,-2,-1] },
    { scenario: 'Leftover elements after merge', hint: 'Forgetting to copy the leftovers of one half after the main merge loop drops elements.', args: [[1,2,3,10,0,4]], expected: [0,1,2,3,4,10] },
    { scenario: 'Odd length with duplicates', hint: 'Uneven halves: mixing closed [lo, hi] and half-open [lo, hi) ranges causes infinite recursion when mid = hi.', args: [[3,-1,3,0,-1,2,3]], expected: [-1,-1,0,2,3,3,3] },
    { scenario: 'Large sorted input (n = 5·10^4)', hint: 'Quicksort with a fixed first/last pivot is O(n²) — and recurses 5·10^4 deep — on sorted input. Use merge sort or a random pivot.', argsGen: '() => [Array.from({ length: 50000 }, (_, i) => i - 25000)]', expected: Array.from({ length: 50000 }, (_, i) => i - 25000), timeLimitMs: 1000 },
    { scenario: 'Large random input (n = 5·10^4)', hint: 'O(n²) sorts (bubble, insertion, selection) are too slow at this size; you need O(n log n).', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); const a = Array.from({ length: 50000 }, (_, i) => i - 25000); for (let i = a.length - 1; i > 0; i--) { const j = r() % (i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; } return [a]; }', expected: Array.from({ length: 50000 }, (_, i) => i - 25000), timeLimitMs: 500 },
    { scenario: 'Large reverse sorted input', hint: 'Reverse order is the worst case for insertion/bubble sort (~1.25·10^9 moves) and for fixed-pivot quicksort.', argsGen: '() => [Array.from({ length: 50000 }, (_, i) => 25000 - i)]', expected: Array.from({ length: 50000 }, (_, i) => i - 24999), timeLimitMs: 1000 },
    { scenario: 'Large all-equal input', hint: 'A 2-way partition puts every equal element on one side — O(n²). Use merge sort or a 3-way partition.', argsGen: '() => [new Array(50000).fill(42)]', expected: new Array(50000).fill(42), timeLimitMs: 1000 },
  ],

  solution: {
    code: `function sortArray(nums) {
  const buf = new Array(nums.length);

  function sort(lo, hi) {              // sorts nums[lo..hi)
    if (hi - lo <= 1) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid, hi);
    let i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
      buf[k++] = nums[i] <= nums[j] ? nums[i++] : nums[j++];  // <= → stable
    }
    while (i < mid) buf[k++] = nums[i++];
    while (j < hi) buf[k++] = nums[j++];
    for (let t = lo; t < hi; t++) nums[t] = buf[t];
  }

  sort(0, nums.length);
  return nums;
}`,
    explanation: 'One shared buffer instead of slicing: O(n) extra memory total instead of O(n log n) allocations.',
  },
  dryRun: {
    columns: ['call', 'range', 'after merge'],
    rows: [
      ['sort(0,1), sort(1,2)', '[5] [2]', '[2,5]'],
      ['sort(2,3), sort(3,4)', '[3] [1]', '[1,3]'],
      ['merge [2,5] + [1,3]', '0..4', '1 (right), 2 (left), 3 (right), 5 (left) → [1,2,3,5]'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'log n levels, each merging n elements in total; one buffer of n plus O(log n) recursion stack.' },
  alternative: {
    title: 'Randomised quicksort with 3-way partition',
    md: 'In place (O(log n) expected stack). The random pivot avoids the sorted-input worst case and the 3-way split handles all-equal arrays.',
    code: `function sortArray(nums) {
  function qs(lo, hi) {
    if (lo >= hi) return;
    const pivot = nums[lo + Math.floor(Math.random() * (hi - lo + 1))];
    let lt = lo, i = lo, gt = hi;
    while (i <= gt) {
      if (nums[i] < pivot) { [nums[lt], nums[i]] = [nums[i], nums[lt]]; lt++; i++; }
      else if (nums[i] > pivot) { [nums[i], nums[gt]] = [nums[gt], nums[i]]; gt--; }
      else i++;
    }
    qs(lo, lt - 1);
    qs(gt + 1, hi);
  }
  qs(0, nums.length - 1);
  return nums;
}`,
    complexity: 'O(n log n) expected time, O(n²) worst (vanishingly unlikely); O(log n) expected space',
  },
  mistakes: [
    'Quicksort with a fixed first/last pivot — O(n²) and deep recursion on sorted or all-equal inputs.',
    'Forgetting to copy the leftover elements of one half after the main merge loop.',
    'Mixing up closed [lo, hi] and half-open [lo, hi) ranges → infinite recursion when mid = hi.',
    'Calling nums.sort() "just to check" — the problem forbids built-ins, and without a comparator it would sort as strings anyway.',
  ],
};
