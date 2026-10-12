export default {
  id: 'move-zeroes',
  title: 'Move Zeroes',
  difficulty: 'Easy',
  order: 2,
  pattern: 'two-pointers-read-write',
  tags: ['array', 'two pointers', 'in place'],
  source: { platform: 'LeetCode', number: 283, url: 'https://leetcode.com/problems/move-zeroes/' },

  statement: `Given an integer array \`nums\`, move every \`0\` to the **end** of the array while keeping the **relative order** of the non-zero elements.

You must do this **in place** (modify \`nums\` directly, without making a copy of the array). The function returns nothing.`,
  examples: [
    { input: 'nums = [0,1,0,3,12]', output: '[1,3,12,0,0]' },
    { input: 'nums = [0]', output: '[0]' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '-2^31 <= nums[i] <= 2^31 - 1'],

  think: `- Where should the first non-zero element end up? The second?
- If one pointer reads every element and another marks "the next place a non-zero should go", what happens to the zeros?
- Can you avoid a second pass that fills zeros at the end?`,
  patternChallenge: {
    options: ['Sort with a custom comparator', 'Two Pointers — Opposite Ends', 'Two Pointers — Read / Write', 'Hash Map'],
    answer: 2,
    explanation: '"In place" + "keep the relative order" is the read/write signature. Opposite-end swapping would move zeros to the end but scramble the order of non-zeros. Sorting is O(n log n) and `sort` is not required to handle this correctly with a trick comparator.',
  },
  hints: [
    'Keep `write = 0`: everything before `write` is the non-zero prefix in its original order.',
    'Scan with `read`. When `nums[read] !== 0`, swap `nums[read]` with `nums[write]` and `write++`. The swap pushes zeros backwards automatically.',
  ],
  approach: `**Naive:** build a new array of non-zeros, then pad with zeros and copy back → O(n) time but O(n) extra memory (not "in place").

**Two passes, O(1) space:** copy every non-zero to \`nums[write++]\`, then fill \`nums[write..]\` with zeros.

**One pass with swaps:** invariant — \`nums[0..write-1]\` are the non-zeros seen so far (in order) and \`nums[write..read-1]\` are all zeros. When \`read\` finds a non-zero, swap it with \`nums[write]\` (a zero, or itself) and advance \`write\`.`,

  functionName: 'moveZeroes',
  paramNames: ['nums'],
  starterCode: `/**
 * Do not return anything, modify nums in place instead.
 * @param {number[]} nums
 * @return {void}
 */
function moveZeroes(nums) {
  
}
`,
  io: { mutates: 0 },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: non-zeros keep their order (1, 3, 12), zeros go to the end.', args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
    { scenario: 'Example 2', hint: 'A single zero: nothing to move.', args: [[0]], expected: [0] },
    { scenario: 'No zeros', hint: 'Nothing changes. Make sure you still leave nums intact — the tests read nums itself, not a return value.', args: [[1, 2, 3]], expected: [1, 2, 3] },
    { scenario: 'Single non-zero', hint: 'Smallest non-zero input: [5] stays [5].', args: [[5]], expected: [5] },
    { scenario: 'Consecutive zeros first', hint: 'Two zeros in a row. Splicing while iterating forward skips the second zero because the indices shift.', args: [[0, 0, 1]], expected: [1, 0, 0] },
    { scenario: 'Zeros in the middle', hint: 'The zeros between 4 and 5 must all end up after 5.', args: [[4, 0, 0, 0, 5]], expected: [4, 5, 0, 0, 0] },
    { scenario: 'Negative numbers', hint: 'Negative values are non-zero too — only exactly 0 moves.', args: [[-1, 0, -2, 0]], expected: [-1, -2, 0, 0] },
    { scenario: 'All zeros', hint: 'Everything is zero: the array is unchanged.', args: [[0, 0, 0]], expected: [0, 0, 0] },
    { scenario: 'Order must be kept', hint: 'Swapping zeros with elements from the far end reorders the non-zeros (3 would jump ahead of 1 and 2).', args: [[0, 1, 2, 0, 3]], expected: [1, 2, 3, 0, 0] },
    { scenario: 'Zero already at end', hint: 'The only zero is already last — a correct solution leaves the array as it is.', args: [[7, 8, 0]], expected: [7, 8, 0] },
    { scenario: 'Extreme 32-bit values', hint: 'Values at -2^31 and 2^31 - 1 are ordinary non-zero numbers.', args: [[0, -2147483648, 0, 2147483647]], expected: [-2147483648, 2147483647, 0, 0] },
    { scenario: 'Alternating zeros', hint: 'Zero, value, zero, value…: each non-zero is written to the next free slot in order.', args: [[0, 1, 0, 2, 0, 3, 0, 4, 0, 5]], expected: [1, 2, 3, 4, 5, 0, 0, 0, 0, 0] },
  ],

  solution: {
    code: `function moveZeroes(nums) {
  let write = 0; // next position for a non-zero
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
}`,
    explanation: 'When `write === read` the swap is a no-op, so arrays without zeros are left untouched. Once a zero has been seen, `nums[write]` is always a zero and the swap moves it behind the non-zero.',
  },
  dryRun: {
    columns: ['read', 'nums[read]', 'action', 'nums', 'write'],
    rows: [
      ['0', '0', 'skip', '[0,1,0,3,12]', '0'],
      ['1', '1', 'swap 0↔1', '[1,0,0,3,12]', '1'],
      ['2', '0', 'skip', '[1,0,0,3,12]', '1'],
      ['3', '3', 'swap 1↔3', '[1,3,0,0,12]', '2'],
      ['4', '12', 'swap 2↔4', '[1,3,12,0,0]', '3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass; swaps are O(1).' },
  alternative: {
    title: 'Copy then fill',
    md: 'Copy non-zeros forward, then overwrite the tail with zeros. Same complexity; does fewer writes when there are few zeros.',
    code: `function moveZeroes(nums) {
  let write = 0;
  for (const x of nums) if (x !== 0) nums[write++] = x;
  while (write < nums.length) nums[write++] = 0;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Returning a new array — the tests inspect `nums` itself.',
    'Using opposite-end swaps, which breaks the relative order of the non-zeros.',
    'Using `splice` + `push` in a loop: O(n²) and it shifts indices while you iterate.',
  ],
};
