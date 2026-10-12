export default {
  id: 'merge-sorted-array',
  title: 'Merge Sorted Array',
  difficulty: 'Easy',
  order: 4,
  pattern: 'two-pointers-merge',
  tags: ['array', 'two pointers', 'in place', 'sorting'],
  source: { platform: 'LeetCode', number: 88, url: 'https://leetcode.com/problems/merge-sorted-array/' },

  statement: `You get two arrays sorted in non-decreasing order, \`nums1\` and \`nums2\`, and two integers \`m\` and \`n\`: the number of real elements in \`nums1\` and in \`nums2\`.

\`nums1\` has length \`m + n\`: its first \`m\` slots hold its elements and the last \`n\` slots are \`0\` placeholders.

Merge \`nums2\` into \`nums1\` **in place** so that \`nums1\` becomes one sorted array of length \`m + n\`. Return nothing.`,
  examples: [
    { input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3', output: '[1,2,2,3,5,6]' },
    { input: 'nums1 = [1], m = 1, nums2 = [], n = 0', output: '[1]' },
    { input: 'nums1 = [0], m = 0, nums2 = [1], n = 1', output: '[1]' },
  ],
  constraints: ['nums1.length === m + n', 'nums2.length === n', '0 <= m, n <= 200', '-10^9 <= nums1[i], nums2[j] <= 10^9'],

  think: `- Where is the free space in \`nums1\`?
- If you fill \`nums1\` from the front, what happens to its own elements that you have not read yet?
- Which element belongs in the very last slot?`,
  patternChallenge: {
    options: ['Two Pointers — Merge from the back', 'Concatenate and sort', 'Binary Search insertion for each element', 'Read / Write compaction'],
    answer: 0,
    explanation: 'Two sorted inputs → merge with one pointer each. The free space is at the back, so write the largest remaining element at the last free slot. Concatenate + sort is O((m+n) log(m+n)); binary insertion shifts elements → O(m·n).',
  },
  hints: [
    'Use three indices: `i = m - 1` (last real nums1 value), `j = n - 1` (last nums2 value), `k = m + n - 1` (write position).',
    'While `j >= 0`: put the larger of `nums1[i]` and `nums2[j]` at `nums1[k]` and move those pointers left. When nums2 runs out, the rest of nums1 is already in place.',
  ],
  approach: `**Easy but slower:** copy nums2 into the tail of nums1 and sort → O((m+n) log(m+n)).

**Merge from the back:** the largest remaining element overall is \`max(nums1[i], nums2[j])\`. It belongs at \`nums1[k]\`.
- \`k = i + j + 1\` at every step, so \`k ≥ i\`: we never overwrite a nums1 element we still need.
- Loop while \`j >= 0\`. If nums1 runs out first (\`i < 0\`), keep copying nums2. If nums2 runs out first, nums1's remaining prefix is already sorted and in place — stop.`,

  functionName: 'merge',
  paramNames: ['nums1', 'm', 'nums2', 'n'],
  starterCode: `/**
 * Do not return anything, modify nums1 in place instead.
 * @param {number[]} nums1
 * @param {number} m
 * @param {number[]} nums2
 * @param {number} n
 * @return {void}
 */
function merge(nums1, m, nums2, n) {
  
}
`,
  io: { mutates: 0 },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: interleave both arrays into nums1.', args: [[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3], expected: [1, 2, 2, 3, 5, 6] },
    { scenario: 'Example 2', hint: 'nums2 is empty (n = 0): nums1 is already the answer.', args: [[1], 1, [], 0], expected: [1] },
    { scenario: 'Example 3', hint: 'nums1 has no real elements (m = 0): copy all of nums2 in. Starting i at m - 1 = -1 must not break anything.', args: [[0], 0, [1], 1], expected: [1] },
    { scenario: 'nums2 all smaller', hint: 'Every nums2 value goes before every nums1 value. Merging from the front would overwrite 4, 5, 6 before reading them.', args: [[4, 5, 6, 0, 0, 0], 3, [1, 2, 3], 3], expected: [1, 2, 3, 4, 5, 6] },
    { scenario: 'nums2 all larger', hint: 'nums2 simply fills the placeholders at the end; nums1 values stay put.', args: [[1, 2, 3, 0, 0, 0], 3, [4, 5, 6], 3], expected: [1, 2, 3, 4, 5, 6] },
    { scenario: 'Leftover nums2 elements', hint: 'After nums1 runs out, nums2 still has 1 left. A loop `while (i >= 0 && j >= 0)` with no clean-up never copies it.', args: [[2, 0], 1, [1], 1], expected: [1, 2] },
    { scenario: 'Real zeros vs placeholders', hint: 'nums1 contains genuine 0s besides the placeholder 0s — use m, not the value 0, to know where real data ends.', args: [[-1, 0, 0, 3, 0, 0], 4, [0, 0], 2], expected: [-1, 0, 0, 0, 0, 3] },
    { scenario: 'Only nums2, with negatives', hint: 'm = 0 and nums2 has negatives: the result is exactly nums2.', args: [[0, 0, 0], 0, [-5, -2, 7], 3], expected: [-5, -2, 7] },
    { scenario: 'Default sort trap', hint: 'If you copy and call `sort()` without a comparator, -10 sorts before -9 but 10 before 9 as strings — the order is wrong.', args: [[-10, 9, 100, 0, 0], 3, [-9, 10], 2], expected: [-10, -9, 9, 10, 100] },
    { scenario: 'Equal values in both', hint: 'Ties between nums1 and nums2 are fine either way — just make sure no value is lost or duplicated.', args: [[2, 2, 2, 0, 0, 0], 3, [2, 2, 2], 3], expected: [2, 2, 2, 2, 2, 2] },
    { scenario: 'Extreme values', hint: 'Values at ±10^9 compare like any others.', args: [[-1000000000, 1000000000, 0, 0], 2, [-1000000000, 1000000000], 2], expected: [-1000000000, -1000000000, 1000000000, 1000000000] },
    { scenario: 'Interleaved longer arrays', hint: 'Alternating values from both arrays: each write takes the larger of the two current tails.', args: [[1, 3, 5, 7, 9, 11, 0, 0, 0, 0, 0, 0], 6, [2, 4, 6, 8, 10, 12], 6], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  ],

  solution: {
    code: `function merge(nums1, m, nums2, n) {
  let i = m - 1;       // last real element of nums1
  let j = n - 1;       // last element of nums2
  let k = m + n - 1;   // next slot to fill (from the back)
  while (j >= 0) {
    if (i >= 0 && nums1[i] > nums2[j]) {
      nums1[k--] = nums1[i--];
    } else {
      nums1[k--] = nums2[j--];
    }
  }
}`,
    explanation: 'The loop only needs to run while nums2 has elements. If nums2 empties first, the untouched nums1 prefix is already sorted in its final position.',
  },
  dryRun: {
    columns: ['i', 'j', 'k', 'compare', 'nums1'],
    rows: [
      ['2', '2', '5', '3 vs 6 → 6', '[1,2,3,0,0,6]'],
      ['2', '1', '4', '3 vs 5 → 5', '[1,2,3,0,5,6]'],
      ['2', '0', '3', '3 vs 2 → 3', '[1,2,3,3,5,6]'],
      ['1', '0', '2', '2 vs 2 → nums2 (not >)', '[1,2,2,3,5,6]'],
      ['1', '-1', '1', 'done', '[1,2,2,3,5,6]'],
    ],
  },
  complexity: { time: 'O(m + n)', space: 'O(1)', explanation: 'Each element is written exactly once.' },
  alternative: {
    title: 'Copy and sort',
    md: 'Easy to write and fine for tiny inputs, but ignores sortedness.',
    code: `function merge(nums1, m, nums2, n) {
  for (let j = 0; j < n; j++) nums1[m + j] = nums2[j];
  nums1.sort((a, b) => a - b);
}`,
    complexity: 'O((m + n) log(m + n)) time',
  },
  mistakes: [
    'Merging from the front and overwriting unread nums1 values.',
    'Looping `while (i >= 0 && j >= 0)` and forgetting to copy leftover nums2 elements.',
    '`nums1.sort()` without a comparator — negative and multi-digit numbers sort wrongly.',
  ],
};
