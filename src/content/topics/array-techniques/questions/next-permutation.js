export default {
  id: 'next-permutation',
  title: 'Next Permutation',
  difficulty: 'Medium',
  order: 6,
  pattern: 'next-permutation',
  tags: ['array', 'two pointers', 'permutation'],
  source: { platform: 'LeetCode', number: 31, url: 'https://leetcode.com/problems/next-permutation/' },

  statement: `Rearrange the integer array \`nums\` **in place** into the next arrangement in lexicographic (dictionary) order — the smallest arrangement that is strictly greater than the current one.

If \`nums\` is already the greatest arrangement (fully non-increasing), rearrange it into the smallest one (ascending order). Use only O(1) extra memory. The function returns nothing; \`nums\` itself is checked.`,
  examples: [
    { input: 'nums = [1,2,3]', output: '[1,3,2]' },
    { input: 'nums = [3,2,1]', output: '[1,2,3]', explanation: 'Already the last permutation → wrap to the first.' },
    { input: 'nums = [1,1,5]', output: '[1,5,1]' },
  ],
  constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 100'],

  think: `- To make a number just a little bigger, would you change a digit on the left or on the right?
- Look at the longest non-increasing suffix. Can rearranging only that suffix ever produce something bigger?
- After you increase one position, how should everything to its right be ordered to stay as small as possible?`,
  patternChallenge: {
    options: ['Backtracking over all permutations', 'Next permutation: pivot, swap, reverse suffix', 'Sort the array', 'Boyer–Moore voting'],
    answer: 1,
    explanation: 'Only the next arrangement is needed, in place, O(1) memory: the pivot/swap/reverse algorithm. Generating all permutations is O(n!) and uses lots of memory; sorting gives the first permutation, not the next.',
  },
  hints: [
    'From the right, find the first index i with nums[i] < nums[i + 1] (the pivot). Everything right of i is non-increasing.',
    'If a pivot exists, swap it with the rightmost element greater than it. Then reverse nums[i+1..end]. With no pivot, reverse the whole array.',
  ],
  approach: `**Brute force:** generate all permutations in sorted order, find the current one, return the next → O(n! · n).

**Optimized (O(n), O(1)):**
1. **Pivot:** the rightmost i with \`nums[i] < nums[i+1]\`. The suffix after it is non-increasing — its maximum arrangement — so i is the least significant position that can grow.
2. **Swap** \`nums[i]\` with the smallest value in the suffix that is larger than it — scanning from the right, the first value \`> nums[i]\`.
3. **Reverse** the suffix. It is still non-increasing after the swap, so reversing makes it ascending, i.e. the smallest possible tail.
4. No pivot → the array is the last permutation → reverse it all.`,

  functionName: 'nextPermutation',
  paramNames: ['nums'],
  io: { mutates: 0 },
  starterCode: `/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in place.
 */
function nextPermutation(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Swap the last two: [1,3,2].', args: [[1, 2, 3]], expected: [1, 3, 2] },
    { scenario: 'Example 2', hint: 'Fully non-increasing — wrap around to ascending order.', args: [[3, 2, 1]], expected: [1, 2, 3] },
    { scenario: 'Example 3', hint: 'Duplicates: the pivot is the first 1 from the right that is smaller than its right neighbour.', args: [[1, 1, 5]], expected: [1, 5, 1] },
    { scenario: 'Single element', hint: 'Smallest input: nothing to rearrange.', args: [[1]], expected: [1] },
    { scenario: 'Two elements ascending', hint: 'Swap them.', args: [[4, 9]], expected: [9, 4] },
    { scenario: 'Pivot at index 0', hint: 'The whole tail is descending; the pivot is the first element.', args: [[1, 3, 2]], expected: [2, 1, 3] },
    { scenario: 'Swap with rightmost larger', hint: 'Swap the pivot with the rightmost larger value (4, not 5) so the suffix stays descending, then reverse it.', args: [[1, 3, 5, 4, 2]], expected: [1, 4, 2, 3, 5] },
    { scenario: 'Duplicate pivot scan', hint: 'With > instead of >= in the pivot scan, equal neighbours are mistaken for a valid pivot.', args: [[1, 5, 1]], expected: [5, 1, 1] },
    { scenario: 'All equal', hint: 'Only one arrangement exists — it stays the same.', args: [[2, 2, 2]], expected: [2, 2, 2] },
    { scenario: 'Duplicates in suffix', hint: 'Pick the rightmost value larger than the pivot among duplicates.', args: [[2, 3, 1, 3, 3]], expected: [2, 3, 3, 1, 3] },
    { scenario: 'Descending with duplicates', hint: 'Last arrangement with repeats wraps to sorted order.', args: [[5, 5, 3, 3, 0]], expected: [0, 3, 3, 5, 5] },
    { scenario: 'Zeros and max value', hint: 'Values 0 and 100.', args: [[0, 100, 100, 0]], expected: [100, 0, 0, 100] },
    { scenario: 'Max size, descending (n = 100)', hint: 'The greatest arrangement of 100 values wraps to ascending.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => 100 - i)]', expected: Array.from({ length: 100 }, (_, i) => i + 1) },
    { scenario: 'Max size, long descending tail', hint: 'The pivot is at index 0 and the reversed suffix is 99 elements long.', argsGen: '() => [[50, ...Array.from({ length: 99 }, (_, i) => 100 - i)]]', expected: [51, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] },
  ],
  solution: {
    code: `function nextPermutation(nums) {
  const n = nums.length;
  let i = n - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;   // 1. pivot
  if (i >= 0) {
    let j = n - 1;
    while (nums[j] <= nums[i]) j--;                // 2. rightmost value > pivot
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  // 3. reverse the (non-increasing) suffix to make it ascending
  for (let l = i + 1, r = n - 1; l < r; l++, r--) {
    [nums[l], nums[r]] = [nums[r], nums[l]];
  }
}`,
  },
  dryRun: {
    columns: ['step', 'array', 'note'],
    rows: [
      ['pivot', '[1,3,5,4,2]', 'i = 1 (3 < 5)'],
      ['find j', '[1,3,5,4,2]', 'j = 3 (4 > 3)'],
      ['swap', '[1,4,5,3,2]', ''],
      ['reverse 2..4', '[1,4,2,3,5]', 'done'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each of the three phases scans at most n elements.' },
  alternative: {
    title: 'Sort the suffix',
    md: 'After the swap, `nums.splice(i + 1, n, ...nums.slice(i + 1).sort((a, b) => a - b))` also works. Correct, but O(n log n) and allocates — the reverse is both faster and in place.',
    complexity: 'O(n log n) time',
  },
  mistakes: [
    'Using > instead of >= in the pivot scan (duplicates such as [1,5,1] break).',
    'Swapping with the leftmost larger value instead of the rightmost (breaks the descending suffix).',
    'Returning a new array instead of modifying nums.',
  ],
};
