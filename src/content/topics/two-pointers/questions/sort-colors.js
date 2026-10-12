export default {
  id: 'sort-colors',
  title: 'Sort Colors',
  difficulty: 'Medium',
  order: 2,
  pattern: 'dutch-national-flag',
  tags: ['array', 'two pointers', 'in place', 'partitioning'],
  source: { platform: 'LeetCode', number: 75, url: 'https://leetcode.com/problems/sort-colors/' },

  statement: `\`nums\` contains only the values \`0\` (red), \`1\` (white) and \`2\` (blue). Sort it **in place** so all 0s come first, then all 1s, then all 2s.

Do not use the library sort. Can you do it in **one pass** with O(1) extra space?`,
  examples: [
    { input: 'nums = [2,0,2,1,1,0]', output: '[0,0,1,1,2,2]' },
    { input: 'nums = [2,0,1]', output: '[0,1,2]' },
  ],
  constraints: ['1 <= nums.length <= 300', 'nums[i] is 0, 1 or 2'],

  think: `- A two-pass answer counts the 0s, 1s and 2s and rewrites the array. How could you avoid the second pass?
- Imagine the array split into four regions: finished 0s, finished 1s, unknown, finished 2s. Which pointers mark the borders?
- After you swap an element in from the right end, have you already looked at it?`,
  patternChallenge: {
    options: ['Counting sort (two passes)', 'Two Pointers — Opposite Ends pair sum', 'Merge sort', 'Dutch National Flag (three pointers)'],
    answer: 3,
    explanation: 'Three categories, in place, one pass → Dutch National Flag. Counting sort is correct but needs two passes; merge sort is O(n log n) and not in place.',
  },
  hints: [
    'Keep `low = 0`, `mid = 0`, `high = n - 1`. `[0, low)` = 0s, `[low, mid)` = 1s, `(high, n-1]` = 2s, `[mid, high]` = unknown.',
    '0 → swap with low, `low++`, `mid++`. 1 → `mid++`. 2 → swap with high, `high--` only (the swapped-in value is still unknown). Loop while `mid <= high`.',
  ],
  approach: `**Counting (two passes):** count each colour, then overwrite. O(n) time, O(1) space — a perfectly fine first answer.

**Dutch National Flag (one pass):** maintain the four regions. Each iteration classifies \`nums[mid]\`, shrinking the unknown region \`[mid, high]\` by exactly one:
- **0** → belongs at the end of the 0s region: swap with \`nums[low]\` (a 1, or mid itself), then \`low++\`, \`mid++\`.
- **1** → already at the end of the 1s region: \`mid++\`.
- **2** → belongs at the front of the 2s region: swap with \`nums[high]\`, \`high--\`. **Do not** advance \`mid\`: the value we just received has not been classified.

When \`mid > high\` there are no unknowns left.`,

  functionName: 'sortColors',
  paramNames: ['nums'],
  starterCode: `/**
 * Do not return anything, modify nums in place instead.
 * @param {number[]} nums
 * @return {void}
 */
function sortColors(nums) {
  
}
`,
  io: { mutates: 0 },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: two of each colour, all mixed up.', args: [[2, 0, 2, 1, 1, 0]], expected: [0, 0, 1, 1, 2, 2] },
    { scenario: 'Example 2', hint: 'One of each colour in a scrambled order.', args: [[2, 0, 1]], expected: [0, 1, 2] },
    { scenario: 'Single element', hint: 'The smallest input: one value is already sorted.', args: [[0]], expected: [0] },
    { scenario: 'Two elements', hint: 'Reversed pair: the 0 must move in front of the 1.', args: [[1, 0]], expected: [0, 1] },
    { scenario: 'All the same colour', hint: 'Only 2s: every element is swapped to the high end without disturbing anything.', args: [[2, 2, 2]], expected: [2, 2, 2] },
    { scenario: 'Reverse sorted', hint: 'Fully reversed: the 2 swaps with the 0 at high. Re-check the value that arrives at mid before moving on.', args: [[2, 1, 0]], expected: [0, 1, 2] },
    { scenario: 'Already sorted', hint: 'Nothing should change; a correct pass leaves the order intact.', args: [[0, 0, 1, 1, 2, 2]], expected: [0, 0, 1, 1, 2, 2] },
    { scenario: 'Swapped-in 0 from high', hint: 'Swapping a 2 with high brings back a 0. If you advance mid after that swap, the 0 is left in the middle.', args: [[2, 1, 2, 0, 0]], expected: [0, 0, 1, 2, 2] },
    { scenario: 'Last unknown element', hint: 'With `while (mid < high)` the element where mid meets high is never classified — here that is a 0.', args: [[1, 2, 0]], expected: [0, 1, 2] },
    { scenario: 'No 1s', hint: 'Only 0s and 2s: the middle region stays empty.', args: [[2, 0, 2, 0, 2, 0]], expected: [0, 0, 0, 2, 2, 2] },
    { scenario: 'Mixed longer array', hint: 'A longer mix of all three colours: one pass with low / mid / high pointers.', args: [[1, 2, 0, 0, 2, 1, 1]], expected: [0, 0, 1, 1, 1, 2, 2] },
    { scenario: 'Zero at the very end', hint: 'The 0 at the last index has to travel all the way to the front past the 1s.', args: [[1, 1, 1, 1, 0]], expected: [0, 1, 1, 1, 1] },
  ],

  solution: {
    code: `function sortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  // [0, low) = 0s | [low, mid) = 1s | [mid, high] unknown | (high, end] = 2s
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;                 // mid stays: the new nums[mid] is unclassified
    }
  }
}`,
  },
  dryRun: {
    columns: ['low', 'mid', 'high', 'nums[mid]', 'action', 'nums'],
    rows: [
      ['0', '0', '5', '2', 'swap mid↔high, high--', '[0,0,2,1,1,2]'],
      ['0', '0', '4', '0', 'swap low↔mid, low++, mid++', '[0,0,2,1,1,2]'],
      ['1', '1', '4', '0', 'swap, low++, mid++', '[0,0,2,1,1,2]'],
      ['2', '2', '4', '2', 'swap mid↔high, high--', '[0,0,1,1,2,2]'],
      ['2', '2', '3', '1', 'mid++', '[0,0,1,1,2,2]'],
      ['2', '3', '3', '1', 'mid++ → mid > high, stop', '[0,0,1,1,2,2]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each iteration shrinks the unknown region by one, so there are exactly n iterations.' },
  alternative: {
    title: 'Counting sort',
    md: 'Count 0s, 1s and 2s, then overwrite the array. Two passes, but very hard to get wrong.',
    code: `function sortColors(nums) {
  const count = [0, 0, 0];
  for (const x of nums) count[x]++;
  let i = 0;
  for (let c = 0; c < 3; c++) while (count[c]-- > 0) nums[i++] = c;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Advancing `mid` after swapping with `high` — the value from `high` may be a 0 that then stays in the middle.',
    '`while (mid < high)` — the last unknown element is never classified.',
    'Returning a new sorted array instead of mutating `nums`.',
  ],
};
