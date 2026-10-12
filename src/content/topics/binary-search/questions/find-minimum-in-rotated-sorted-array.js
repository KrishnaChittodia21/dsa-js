export default {
  id: 'find-minimum-in-rotated-sorted-array',
  title: 'Find Minimum in Rotated Sorted Array',
  difficulty: 'Medium',
  order: 3,
  pattern: 'binary-search-rotated',
  tags: ['array', 'binary search', 'rotated'],
  source: { platform: 'LeetCode', number: 153, url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/' },

  statement: `An array of **distinct** integers was sorted in ascending order and then rotated some number of times (between 1 and n): for example \`[0,1,2,4,5,6,7]\` might become \`[4,5,6,7,0,1,2]\`. Rotating n times gives back the sorted array.

Return the **minimum** element in O(log n).`,
  examples: [
    { input: 'nums = [3,4,5,1,2]', output: '1' },
    { input: 'nums = [4,5,6,7,0,1,2]', output: '0' },
    { input: 'nums = [11,13,15,17]', output: '11', explanation: 'Rotated n times — already sorted.' },
  ],
  constraints: ['1 <= n <= 5000', '-5000 <= nums[i] <= 5000', 'All values are distinct'],

  think: `- The minimum sits right after the "drop". Which elements are ≤ the last element, and which are >?
- Why is \`nums[hi]\` a better comparison partner than \`nums[lo]\`?`,
  patternChallenge: {
    options: ['Linear scan for the drop', 'Binary Search — rotated array (compare mid with hi)', 'Min-heap', 'Two Pointers from both ends'],
    answer: 1,
    explanation: 'Elements of the left run are all > nums[last]; elements of the right run are ≤ nums[last]. "nums[i] <= nums[last]" is F…F,T…T and its first T is the minimum — a boundary search.',
  },
  hints: [
    'Compare `nums[mid]` with `nums[hi]`. If `nums[mid] > nums[hi]`, the drop is somewhere right of mid.',
    'Otherwise `[mid, hi]` is sorted, so the minimum is mid or to its left: `hi = mid`. Loop `while (lo < hi)`.',
  ],
  approach: `**Brute force:** \`Math.min(...nums)\` — O(n).

**Optimized:** half-open boundary search with the rotated-array insight.
- \`nums[mid] > nums[hi]\`: mid is in the left (higher) run, so the minimum is in \`(mid, hi]\` → \`lo = mid + 1\`.
- else: mid is in the right run, and the minimum is at mid or before it → \`hi = mid\`.

Comparing with \`nums[lo]\` fails for an un-rotated array (\`nums[lo] < nums[mid]\` then tells you nothing about where the minimum is).`,

  functionName: 'findMin',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findMin(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: the minimum sits right after the drop from 5 to 1.', args: [[3, 4, 5, 1, 2]], expected: 1 },
    { scenario: 'Example 2', hint: 'The minimum is in the right half; compare nums[mid] with nums[hi] to decide which side to keep.', args: [[4, 5, 6, 7, 0, 1, 2]], expected: 0 },
    { scenario: 'Example 3', hint: 'Rotated n times = not rotated at all. The minimum is nums[0].', args: [[11, 13, 15, 17]], expected: 11 },
    { scenario: 'Single element', hint: 'With one element lo === hi from the start — return it without looping.', args: [[1]], expected: 1 },
    { scenario: 'Two elements, rotated', hint: 'The minimum is the last element; mid = 0 and nums[0] > nums[1] must send lo to 1.', args: [[2, 1]], expected: 1 },
    { scenario: 'Two elements, sorted', hint: 'Not rotated: nums[mid] < nums[hi] must keep mid (hi = mid), not discard it.', args: [[1, 2]], expected: 1 },
    { scenario: 'Minimum at index 1', hint: 'Rotated by one position from the end: the drop is right at the start.', args: [[5, 1, 2, 3, 4]], expected: 1 },
    { scenario: 'Minimum at last index', hint: 'The drop is at the very end — the search must be able to reach index n - 1.', args: [[2, 3, 4, 5, 1]], expected: 1 },
    { scenario: 'Minimum lands on mid', hint: 'Here the first mid IS the minimum. Using `hi = mid - 1` throws it away — use `hi = mid`.', args: [[4, 5, 1, 2, 3]], expected: 1 },
    { scenario: 'Longer sorted array', hint: 'Comparing nums[mid] with nums[lo] cannot tell "not rotated" from "pivot on the right". Compare with nums[hi] instead.', args: [[1, 2, 3, 4, 5, 6, 7]], expected: 1 },
    { scenario: 'Even length, pivot late', hint: 'Even length with the drop near the end: check your mid rounding never skips the pivot.', args: [[3, 4, 5, 6, 7, 8, 1, 2]], expected: 1 },
    { scenario: 'Negative and extreme values', hint: 'Values span the full range -5000..5000; the minimum -5000 is in the middle.', args: [[0, 5000, -5000, -3, -1]], expected: -5000 },
    { scenario: 'Largest input (n = 5000)', hint: 'A 5000-element array rotated at 1234. The loop must end with lo === hi on the minimum.', argsGen: '() => { const a = Array.from({ length: 5000 }, (_, i) => i * 2 - 5000); return [a.slice(1234).concat(a.slice(0, 1234))]; }', expected: -5000 },
  ],

  solution: {
    code: `function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] > nums[hi]) lo = mid + 1; // mid is in the high run → drop is right
    else hi = mid;                          // mid..hi is sorted → min at mid or left
  }
  return nums[lo];
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'nums[mid] vs nums[hi]', 'decision'],
    rows: [
      ['0', '6', '3', '7 > 2', 'lo = 4'],
      ['4', '6', '5', '1 ≤ 2', 'hi = 5'],
      ['4', '5', '4', '0 ≤ 1', 'hi = 4'],
      ['4', '4', '—', '—', 'return nums[4] = 0'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'Boundary search; duplicates would degrade it to O(n) (LeetCode 154).' },
  alternative: {
    title: 'Scan for the drop',
    md: 'Return the first `nums[i]` with `nums[i] < nums[i − 1]`, or `nums[0]` if none. Simple but O(n).',
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Comparing with nums[lo] — breaks on arrays that are not rotated.',
    'Using `hi = mid - 1` in the else branch: mid itself may be the minimum.',
    'Using `lo <= hi` with `hi = mid` → infinite loop at lo === hi.',
  ],
};
