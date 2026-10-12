export default {
  id: 'squares-of-a-sorted-array',
  title: 'Squares of a Sorted Array',
  difficulty: 'Easy',
  order: 5,
  pattern: 'two-pointers-merge',
  tags: ['array', 'two pointers', 'sorting'],
  source: { platform: 'LeetCode', number: 977, url: 'https://leetcode.com/problems/squares-of-a-sorted-array/' },

  statement: `Given an integer array \`nums\` sorted in non-decreasing order (it may contain negative numbers), return a new array of the **squares** of each number, also sorted in non-decreasing order.

Can you do it in O(n) instead of squaring and sorting?`,
  examples: [
    { input: 'nums = [-4,-1,0,3,10]', output: '[0,1,9,16,100]' },
    { input: 'nums = [-7,-3,2,3,11]', output: '[4,9,9,49,121]' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '-10^4 <= nums[i] <= 10^4', 'nums is sorted in non-decreasing order'],

  think: `- Squaring reverses the order of the negative part. So the array is really *two* sorted sequences — which ones?
- Where is the largest square? The second largest?
- Which end of the output should you fill first?`,
  patternChallenge: {
    options: ['Square and sort', 'Binary Search for zero, then expand', 'Hash Map', 'Two Pointers — merge the two ends, filling from the back'],
    answer: 3,
    explanation: 'The negatives (read right-to-left) and the non-negatives (left-to-right) are two sorted sequences of absolute values. The largest square is at one of the two ends, so merge from the outside in, writing the output from the back. "Find zero and expand outward" also works (merge from the inside) but needs a binary search and more edge cases.',
  },
  hints: [
    'Put `l = 0`, `r = n - 1`, and a write index `w = n - 1` for the output.',
    'Compare `|nums[l]|` and `|nums[r]|`; write the bigger square to `out[w--]` and move that pointer inward.',
  ],
  approach: `**Square + sort:** O(n log n). Correct, but ignores that the input is sorted.

**Two pointers:** the largest absolute value is always at an end (most negative on the left, most positive on the right). So:
- \`out = new Array(n)\`, \`w = n - 1\`.
- While \`l <= r\`: take the end with the larger absolute value, write its square at \`out[w--]\`, move that pointer inward.

This is a merge of two sorted sequences, done from the largest element down.`,

  functionName: 'sortedSquares',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function sortedSquares(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: negatives and positives mixed, smallest square (0) in the middle.', args: [[-4, -1, 0, 3, 10]], expected: [0, 1, 9, 16, 100] },
    { scenario: 'Example 2', hint: 'Two equal squares (9 from -3 and 3) must both appear.', args: [[-7, -3, 2, 3, 11]], expected: [4, 9, 9, 49, 121] },
    { scenario: 'Single element', hint: 'The smallest input. With `while (l < r)` the only element is never written.', args: [[5]], expected: [25] },
    { scenario: 'Single negative', hint: 'One negative value: its square is the whole answer.', args: [[-3]], expected: [9] },
    { scenario: 'All negative', hint: 'Squaring reverses the order: the largest square comes from the leftmost value.', args: [[-5, -4, -3]], expected: [9, 16, 25] },
    { scenario: 'All positive', hint: 'Already in order after squaring; the right pointer supplies every value.', args: [[1, 2, 3]], expected: [1, 4, 9] },
    { scenario: 'Smallest square in middle', hint: 'Filling the output from the front fails: the smallest square (0) is in the middle, not at an end. Fill from the back.', args: [[-3, -2, 0, 2, 3]], expected: [0, 4, 4, 9, 9] },
    { scenario: 'Duplicates of equal size', hint: 'Equal absolute values on both sides: either pointer may move first, but all four 4s must appear.', args: [[-2, -2, 2, 2]], expected: [4, 4, 4, 4] },
    { scenario: 'All zeros', hint: 'Zeros square to zero; the pointers must still stop correctly.', args: [[0, 0]], expected: [0, 0] },
    { scenario: 'Default sort trap', hint: 'Squares 100 and 9: `[100, 9].sort()` stays [100, 9] because it compares strings. Use a comparator or the two-pointer merge.', args: [[-10, -3, 0]], expected: [0, 9, 100] },
    { scenario: 'Extreme values', hint: 'Squares of ±10^4 are 10^8 — well inside JS number range.', args: [[-10000, 10000]], expected: [100000000, 100000000] },
    { scenario: 'Lopsided negatives', hint: 'Many small positives and one huge negative: the biggest square comes from the left end.', args: [[-100, 1, 2, 3, 4]], expected: [1, 4, 9, 16, 10000] },
  ],

  solution: {
    code: `function sortedSquares(nums) {
  const n = nums.length;
  const out = new Array(n);
  let l = 0, r = n - 1;
  for (let w = n - 1; w >= 0; w--) {       // fill from the largest square down
    if (Math.abs(nums[l]) > Math.abs(nums[r])) {
      out[w] = nums[l] * nums[l];
      l++;
    } else {
      out[w] = nums[r] * nums[r];
      r--;
    }
  }
  return out;
}`,
  },
  dryRun: {
    columns: ['w', 'l', 'r', '|nums[l]| vs |nums[r]|', 'out'],
    rows: [
      ['4', '0', '4', '4 vs 10 → right', '[_,_,_,_,100]'],
      ['3', '0', '3', '4 vs 3 → left', '[_,_,_,16,100]'],
      ['2', '1', '3', '1 vs 3 → right', '[_,_,9,16,100]'],
      ['1', '1', '2', '1 vs 0 → left', '[_,1,9,16,100]'],
      ['0', '2', '2', '0 vs 0 → right', '[0,1,9,16,100]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One pass; the output array is required by the problem (O(1) extra otherwise).' },
  alternative: {
    title: 'Square and sort',
    md: 'One line, O(n log n). Mention it first, then optimise.',
    code: `function sortedSquares(nums) {
  return nums.map((x) => x * x).sort((a, b) => a - b);
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Filling the output from the front — the smallest square is somewhere in the middle, not at an end.',
    'Sorting without a comparator: `[100, 9].sort()` stays `[100, 9]`.',
    'Using `l < r` in a while loop and forgetting the last element.',
  ],
};
