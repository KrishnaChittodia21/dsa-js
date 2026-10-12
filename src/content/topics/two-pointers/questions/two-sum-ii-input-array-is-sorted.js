export default {
  id: 'two-sum-ii-input-array-is-sorted',
  title: 'Two Sum II - Input Array Is Sorted',
  difficulty: 'Medium',
  order: 1,
  pattern: 'two-pointers-opposite',
  tags: ['array', 'two pointers', 'sorted'],
  source: { platform: 'LeetCode', number: 167, url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/' },

  statement: `\`numbers\` is a **1-indexed** array sorted in non-decreasing order. Find two numbers that add up to \`target\` and return their indices \`[index1, index2]\` (1-based) with \`index1 < index2\`.

Exactly one solution exists, and you may not use the same element twice. Use only **O(1)** extra space.`,
  examples: [
    { input: 'numbers = [2,7,11,15], target = 9', output: '[1,2]', explanation: '2 + 7 = 9.' },
    { input: 'numbers = [2,3,4], target = 6', output: '[1,3]' },
    { input: 'numbers = [-1,0], target = -1', output: '[1,2]' },
  ],
  constraints: ['2 <= numbers.length <= 3 * 10^4', '-1000 <= numbers[i] <= 1000', 'numbers is sorted in non-decreasing order', 'Exactly one solution exists'],

  think: `- The original Two Sum used a hash map. What does the O(1) space requirement rule out?
- Take the smallest and the largest number. If their sum is too big, which of the two can never be in the answer?
- Why can you never skip the answer by moving a pointer?`,
  patternChallenge: {
    options: ['Hash Map (Complement Lookup)', 'Binary Search for each element', 'Two Pointers — Opposite Ends', 'Sliding Window'],
    answer: 2,
    explanation: 'Sorted + a pair with a target sum + O(1) space → opposite ends. The hash map is O(n) space. Binary search per element is O(n log n) — valid but slower.',
  },
  hints: [
    'Start with `l = 0`, `r = n - 1` and look at `numbers[l] + numbers[r]`.',
    'Too small → `l++` (numbers[l] is too small for every remaining partner). Too big → `r--`. Remember the answer is 1-based.',
  ],
  approach: `**Brute force:** all pairs, O(n²).

**Binary search:** for each \`i\`, binary search \`target - numbers[i]\` in the rest → O(n log n), O(1) space.

**Opposite ends (O(n), O(1)):**
- \`sum < target\` → \`numbers[l]\` plus the *largest* remaining value is still too small, so \`numbers[l]\` can't be used: \`l++\`.
- \`sum > target\` → \`numbers[r]\` plus the *smallest* remaining value is too big: \`r--\`.
- Equal → return \`[l + 1, r + 1]\`.

**Why we never skip the answer \`(a, b)\`:** pointers start outside it (\`l ≤ a\`, \`r ≥ b\`). Suppose \`l\` reaches \`a\` first. From then on, while \`r > b\`, the sum is \`numbers[a] + numbers[r] ≥ numbers[a] + numbers[b] = target\`, and it is strictly bigger unless we already found a valid pair — so only \`r\` moves, until it reaches \`b\`. The same argument works if \`r\` reaches \`b\` first. Neither pointer can ever step over its answer index.`,

  functionName: 'twoSum',
  paramNames: ['numbers', 'target'],
  starterCode: `/**
 * @param {number[]} numbers
 * @param {number} target
 * @return {number[]}
 */
function twoSum(numbers, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 2 + 7 = 9. Indices are 1-based, so the answer is [1, 2], not [0, 1].', args: [[2, 7, 11, 15], 9], expected: [1, 2] },
    { scenario: 'Example 2', hint: 'The pair uses both ends of the array.', args: [[2, 3, 4], 6], expected: [1, 3] },
    { scenario: 'Example 3', hint: 'Negative target with the smallest allowed length (2).', args: [[-1, 0], -1], expected: [1, 2] },
    { scenario: 'Same element twice not allowed', hint: '3 + 3 = 6 would use index 2 twice. Loop with `l < r`, never `l <= r`.', args: [[1, 3, 4, 5], 6], expected: [1, 4] },
    { scenario: 'Duplicate values pair', hint: 'Two equal values at different indices form the answer.', args: [[1, 2, 2, 9], 4], expected: [2, 3] },
    { scenario: 'Pair in the middle', hint: 'Both pointers have to move inward several times before meeting the pair.', args: [[1, 2, 3, 4, 4, 9, 56, 90], 8], expected: [4, 5] },
    { scenario: 'All negative', hint: 'Negative numbers work the same way: the sum is too small → move l right.', args: [[-10, -8, -5, -3, -1], -4], expected: [4, 5] },
    { scenario: 'Zero target', hint: 'A pair of opposite numbers sums to 0.', args: [[-3, -1, 0, 2, 3], 0], expected: [1, 5] },
    { scenario: 'Extreme values', hint: 'The largest magnitudes: -1000 + 1000 = 0.', args: [[-1000, -999, 998, 1000], 0], expected: [1, 4] },
    { scenario: 'Answer at the last two', hint: 'The pair is the two largest values; make sure r starts at the last index.', args: [[1, 2, 3, 50, 60], 110], expected: [4, 5] },
    { scenario: 'Large input, pair at end', hint: 'Trying every pair is O(n²) ≈ 4.5·10^8 checks. Two pointers find it in O(n) with O(1) extra space.', argsGen: '() => { const a = new Array(30000).fill(-1000); a[29998] = 999; a[29999] = 1000; return [a, 1999]; }', expected: [29999, 30000], timeLimitMs: 250 },
    { scenario: 'Large input, pair at both ends', hint: 'The answer is [1, n]: the outermost pair. Remember to return 1-based indices.', argsGen: '() => { const a = new Array(30000).fill(1); a[0] = -1000; a[29999] = 1000; return [a, 0]; }', expected: [1, 30000] },
  ],

  solution: {
    code: `function twoSum(numbers, target) {
  let l = 0, r = numbers.length - 1;
  while (l < r) {
    const sum = numbers[l] + numbers[r];
    if (sum === target) return [l + 1, r + 1]; // 1-based
    if (sum < target) l++;                     // need a bigger sum
    else r--;                                  // need a smaller sum
  }
  return [-1, -1]; // unreachable: a solution is guaranteed
}`,
  },
  dryRun: {
    columns: ['l', 'r', 'numbers[l] + numbers[r]', 'move'],
    rows: [
      ['0', '7', '1 + 90 = 91', 'too big → r--'],
      ['0', '6', '1 + 56 = 57', 'r--'],
      ['0', '5', '1 + 9 = 10', 'r--'],
      ['0', '4', '1 + 4 = 5', 'too small → l++'],
      ['1', '4', '2 + 4 = 6', 'l++'],
      ['2', '4', '3 + 4 = 7', 'l++'],
      ['3', '4', '4 + 4 = 8', 'found → [4, 5]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each step moves one pointer inward; they meet after at most n − 1 steps.' },
  alternative: {
    title: 'Binary search for the complement',
    md: 'For each `i`, binary search `target − numbers[i]` in `numbers[i+1..]`. O(n log n) time, O(1) space — a good stepping stone if the two-pointer proof does not come to mind.',
    complexity: 'O(n log n) time, O(1) space',
  },
  mistakes: [
    'Returning 0-based indices.',
    'Using a hash map — correct, but violates the O(1) space requirement.',
    '`l <= r` would allow using the same element twice.',
  ],
};
