export default {
  id: 'search-in-rotated-sorted-array',
  title: 'Search in Rotated Sorted Array',
  difficulty: 'Medium',
  order: 4,
  pattern: 'binary-search-rotated',
  tags: ['array', 'binary search', 'rotated'],
  source: { platform: 'LeetCode', number: 33, url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },

  statement: `A sorted array of **distinct** integers has been rotated at an unknown pivot (e.g. \`[0,1,2,4,5,6,7]\` → \`[4,5,6,7,0,1,2]\`). Given the rotated array \`nums\` and a \`target\`, return the index of \`target\`, or \`-1\` if it is absent.

Required: **O(log n)**.`,
  examples: [
    { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4' },
    { input: 'nums = [4,5,6,7,0,1,2], target = 3', output: '-1' },
    { input: 'nums = [1], target = 0', output: '-1' },
  ],
  constraints: ['1 <= nums.length <= 5000', '-10^4 <= nums[i], target <= 10^4', 'All values are distinct'],

  think: `- Cut the array at mid. Can both halves contain the "drop"?
- How can you tell with one comparison which half is sorted?
- On the sorted half, how do you check whether the target can be there?`,
  patternChallenge: {
    options: ['Find the pivot with a scan, then binary search', 'Binary Search — rotated array (one half is always sorted)', 'Hash Map value → index', 'Two Pointers'],
    answer: 1,
    explanation: 'At any mid, the half not containing the drop is sorted; a range check on it decides where to go. Scanning for the pivot is O(n); a hash map is O(n) to build.',
  },
  hints: [
    'If `nums[lo] <= nums[mid]`, the left half `[lo, mid]` is sorted. Otherwise the right half `[mid, hi]` is.',
    'If the target lies inside the sorted half\'s value range, search there; otherwise search the other half.',
  ],
  approach: `**Brute force:** \`indexOf\` — O(n).

**Two-pass:** find the minimum's index (previous problem), then binary search the correct run — O(log n), two searches.

**One pass:**
1. Closed search \`lo <= hi\`; return if \`nums[mid] === target\`.
2. If \`nums[lo] <= nums[mid]\` (left sorted): target in \`[nums[lo], nums[mid])\` → \`hi = mid − 1\`, else \`lo = mid + 1\`.
3. Else (right sorted): target in \`(nums[mid], nums[hi]]\` → \`lo = mid + 1\`, else \`hi = mid − 1\`.`,

  functionName: 'search',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: the target is in the right (rotated) half.', args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
    { scenario: 'Example 2', hint: 'The target is absent — return -1.', args: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
    { scenario: 'Example 3', hint: 'A single element that is not the target.', args: [[1], 0], expected: -1 },
    { scenario: 'Single element, found', hint: 'One element equal to the target: a `lo <= hi` loop must check it.', args: [[1], 1], expected: 0 },
    { scenario: 'Two elements, lo equals mid', hint: 'Here lo === mid. With a strict `nums[lo] < nums[mid]` the left half looks unsorted and you search the wrong side. Use `<=`.', args: [[3, 1], 1], expected: 1 },
    { scenario: 'Two elements, not rotated', hint: 'A plain sorted pair: the target is the second element.', args: [[1, 3], 3], expected: 1 },
    { scenario: 'Target at index 0', hint: 'The left half [5] is sorted and contains the target — range-check only the sorted half.', args: [[5, 1, 3], 5], expected: 0 },
    { scenario: 'Target at the maximum', hint: 'The target is the largest value, right before the drop. The sorted-left check is nums[lo] <= target < nums[mid].', args: [[4, 5, 6, 7, 8, 1, 2, 3], 8], expected: 4 },
    { scenario: 'Target at the minimum', hint: 'The target sits exactly at the rotation point.', args: [[6, 7, 8, 1, 2, 3, 4, 5], 1], expected: 3 },
    { scenario: 'Not rotated at all', hint: 'A fully sorted array is a valid input: both halves are sorted, the search must still work.', args: [[1, 2, 3, 4, 5, 6], 4], expected: 3 },
    { scenario: 'Missing, within value range', hint: 'The target lies between existing values on the unsorted side — range-checking the unsorted half sends you the wrong way.', args: [[7, 9, 11, 1, 3, 5], 4], expected: -1 },
    { scenario: 'Negative values', hint: 'Rotated array with negatives; comparisons work the same.', args: [[-2, 0, 3, -10, -7, -5], -7], expected: 4 },
    { scenario: 'Last index', hint: 'The target is the final element of the rotated array.', args: [[30, 40, 50, 10, 20], 20], expected: 4 },
    { scenario: 'Largest input, found', hint: 'n = 5000 rotated at index 3210 — the target is in the left (high-value) part.', argsGen: '() => { const a = Array.from({ length: 5000 }, (_, i) => 4 * i - 9999); return [a.slice(3210).concat(a.slice(0, 3210)), 9981]; }', expected: 1785 },
    { scenario: 'Largest input, missing', hint: 'n = 5000 rotated; the target lies in a gap between values and must return -1.', argsGen: '() => { const a = Array.from({ length: 5000 }, (_, i) => 4 * i - 9999); return [a.slice(3210).concat(a.slice(0, 3210)), 0]; }', expected: -1 },
  ],

  solution: {
    code: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;

    if (nums[lo] <= nums[mid]) {
      // left half [lo, mid] is sorted
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      // right half [mid, hi] is sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
    explanation: '`<=` in `nums[lo] <= nums[mid]` matters: when lo === mid the "left half" is the single element mid, which is trivially sorted.',
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'sorted half', 'target inside?', 'decision'],
    rows: [
      ['0', '6', '3 (7)', 'left [4..7]', '0 ∉ [4,7)', 'lo = 4'],
      ['4', '6', '5 (1)', 'left [0..1]', '0 ∈ [0,1)', 'hi = 4'],
      ['4', '4', '4 (0)', '—', '—', 'found → 4'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'Each step discards half of the range.' },
  alternative: {
    title: 'Find pivot, then normal binary search',
    md: 'Find the index of the minimum `p` (Find Minimum in Rotated Sorted Array). The array is `nums[p..n-1]` followed by `nums[0..p-1]`; search the part whose range contains target, or search with a shifted index `(i + p) % n`.',
    complexity: 'O(log n) time, O(1) space',
  },
  mistakes: [
    '`nums[lo] < nums[mid]` (strict) — fails when lo === mid.',
    'Using half-open comparisons on the wrong side: the sorted-left check is `nums[lo] <= target < nums[mid]` (mid already checked).',
    'Range-checking the unsorted half.',
  ],
};
