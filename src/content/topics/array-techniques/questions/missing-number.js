export default {
  id: 'missing-number',
  title: 'Missing Number',
  difficulty: 'Easy',
  order: 1,
  pattern: 'cyclic-sort',
  tags: ['array', 'math', 'bit manipulation', 'cyclic sort'],
  source: { platform: 'LeetCode', number: 268, url: 'https://leetcode.com/problems/missing-number/' },

  statement: `You are given an array \`nums\` of \`n\` **distinct** integers, each taken from the range \`0..n\` (inclusive). Exactly one number from that range is absent.

Return the absent number.`,
  examples: [
    { input: 'nums = [3,0,1]', output: '2', explanation: 'n = 3, the range is 0..3 and 2 is not in the array.' },
    { input: 'nums = [0,1]', output: '2', explanation: 'n = 2, so the range is 0..2; 2 is missing.' },
    { input: 'nums = [9,6,4,2,3,5,7,0,1]', output: '8' },
  ],
  constraints: ['n == nums.length', '1 <= n <= 10^4', '0 <= nums[i] <= n', 'All values are distinct'],

  think: `- The values fit the indices almost perfectly (n cells, n + 1 possible values). What would a "home" for each value be?
- Can you solve it in O(1) extra space without moving anything? What do you know about the **sum** of 0..n?`,
  patternChallenge: {
    options: ['Sliding Window', 'Binary Search', 'Cyclic Sort / value-to-index math', 'Two Pointers on a sorted array'],
    answer: 2,
    explanation: 'Values lie in 0..n with n cells — every value can be linked to an index. Cyclic sort (value v at index v) or the equivalent sum/XOR math finds the gap in O(n) time and O(1) space. Nothing is sorted, so binary search/two pointers would need an O(n log n) sort first.',
  },
  hints: [
    'The sum 0 + 1 + … + n equals n(n + 1)/2. Compare it with the actual sum.',
    'Alternatively, cyclic-sort: put value v at index v (skip v = n, it has no slot). The first index i with nums[i] !== i is the answer; if none, the answer is n.',
  ],
  approach: `**Brute force:** for each candidate 0..n, scan the array to see if it exists → O(n²). A Set brings it to O(n) time but O(n) space.

**Cyclic sort (O(n), O(1) space):** value v belongs at index v. Swap each value home, skipping v = n. Afterwards the first index i where \`nums[i] !== i\` is missing; if all match, n is missing.

**Math shortcut:** expected sum \`n(n+1)/2\` minus actual sum. (XOR works too and avoids large sums: XOR all indices 0..n and all values; pairs cancel and the missing number remains.) Both are O(n) / O(1) and do not modify the input.`,

  functionName: 'missingNumber',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function missingNumber(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'n = 3, range 0..3, and 2 is absent.', args: [[3, 0, 1]], expected: 2 },
    { scenario: 'Example 2', hint: 'The missing number is n itself — no index mismatch reveals it.', args: [[0, 1]], expected: 2 },
    { scenario: 'Example 3', hint: 'Unsorted input with n = 9; 8 is absent.', args: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8 },
    { scenario: 'Single zero', hint: 'Smallest input: [0] → the missing one is 1 (= n).', args: [[0]], expected: 1 },
    { scenario: 'Single one', hint: 'Smallest input where 0 is missing.', args: [[1]], expected: 0 },
    { scenario: 'Zero missing', hint: 'Every value 1..n is present, so 0 is the answer.', args: [[1, 2, 3, 4]], expected: 0 },
    { scenario: 'Middle missing', hint: 'A gap between present values.', args: [[0, 2]], expected: 1 },
    { scenario: 'Value n present', hint: 'n has no index n to go to — skip it when cyclic sorting (or use the sum formula).', args: [[2, 0, 3]], expected: 1 },
    { scenario: 'Reverse sorted', hint: 'Order does not matter.', args: [[5, 4, 3, 2, 1]], expected: 0 },
    { scenario: 'Max size, n missing', hint: '0..n−1 present at n = 10^4 — the answer is n.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => i)]', expected: 10000 },
    { scenario: 'Max size, shuffled', hint: 'A scrambled 0..10^4 with one value removed.', argsGen: '() => { const a = []; for (let i = 0; i < 10001; i++) { const v = (i * 7919) % 10001; if (v !== 4321) a.push(v); } return [a]; }', expected: 4321 },
    { scenario: 'Max size, reversed, 0 missing', hint: 'Values n down to 1 — the answer is 0.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => 10000 - i)]', expected: 0 },
  ],

  solution: {
    code: `function missingNumber(nums) {
  const n = nums.length;
  // Cyclic sort: value v belongs at index v (value n has no slot).
  let i = 0;
  while (i < n) {
    const v = nums[i];
    if (v < n && nums[v] !== v) {
      [nums[i], nums[v]] = [nums[v], nums[i]];
    } else {
      i++;
    }
  }
  for (let j = 0; j < n; j++) {
    if (nums[j] !== j) return j;
  }
  return n;
}`,
    explanation: 'Every swap puts one value into its final index, so there are at most n swaps. The value n (if present) just stays wherever it lands; the slot it occupies is exactly the missing index.',
  },
  dryRun: {
    columns: ['i', 'array', 'action'],
    rows: [
      ['0', '[3,0,1]', '3 = n has no home → i++'],
      ['1', '[3,0,1]', '0 belongs at 0 → swap'],
      ['1', '[0,3,1]', '3 = n → i++'],
      ['2', '[0,3,1]', '1 belongs at 1 → swap'],
      ['2', '[0,1,3]', '3 = n → i++'],
      ['scan', '[0,1,3]', 'index 2 holds 3 ≠ 2 → answer 2'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'At most n swaps plus n increments, then one scan. Only a few variables.' },
  alternative: {
    title: 'Sum (or XOR) formula',
    md: 'Expected sum minus actual sum. Does not modify the input. XOR is safe from overflow in fixed-width languages; in JavaScript n ≤ 10^4 keeps the sum far below 2^53, so either works.',
    code: `function missingNumber(nums) {
  const n = nums.length;
  let sum = 0;
  for (const x of nums) sum += x;
  return (n * (n + 1)) / 2 - sum;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Trying to put value n at index n — that index does not exist (out of bounds).',
    'Forgetting that the answer can be n itself (no index mismatches after sorting).',
    'Sorting first (O(n log n)) when O(n) is easy.',
  ],
};
