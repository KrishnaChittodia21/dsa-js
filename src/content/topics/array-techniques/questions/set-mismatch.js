export default {
  id: 'set-mismatch',
  title: 'Set Mismatch',
  difficulty: 'Easy',
  order: 4,
  pattern: 'cyclic-sort',
  tags: ['array', 'cyclic sort', 'index marking'],
  source: { platform: 'LeetCode', number: 645, url: 'https://leetcode.com/problems/set-mismatch/' },

  statement: `A set originally contained every integer from \`1\` to \`n\` exactly once. Because of an error, one number got overwritten by a copy of another number, so one value now appears **twice** and one value is **missing**.

Given the corrupted array \`nums\` (in any order), return \`[duplicate, missing]\`.`,
  examples: [
    { input: 'nums = [1,2,2,4]', output: '[2,3]' },
    { input: 'nums = [1,1]', output: '[1,2]' },
  ],
  constraints: ['2 <= nums.length <= 10^4', '1 <= nums[i] <= 10^4', 'Exactly one duplicate and one missing value'],

  think: `- Values are 1..n in n cells. After placing every value at its home, what does the one "wrong" cell look like?
- Which value sits there, and which value should have been there?`,
  patternChallenge: {
    options: ['Cyclic sort', 'Boyer–Moore voting', 'Two pointers', 'Prefix sums'],
    answer: 0,
    explanation: 'Values in 1..n with one duplicate and one missing: cyclic sort puts everything home, and the single mismatched index gives both answers at once. Voting is about majorities; two pointers and prefix sums do not use the value-to-index link.',
  },
  hints: [
    'Cyclic-sort the array: swap nums[i] to index nums[i] − 1 unless that home already holds the same value.',
    'Afterwards exactly one index j has nums[j] !== j + 1. Then nums[j] is the duplicate and j + 1 is the missing value.',
  ],
  approach: `**Brute force:** count occurrences with a Map (O(n) space) and scan 1..n.

**Cyclic sort (O(n), O(1)):** place every value home. The duplicate cannot go home (its home is taken by its twin), so it stays in the slot of the missing number. The single mismatched index j gives \`[nums[j], j + 1]\`.

**Index marking** works too: the value whose mark is already negative is the duplicate; the index still positive afterwards is the missing value.`,

  functionName: 'findErrorNums',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function findErrorNums(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '2 appears twice and 3 is missing — return [duplicate, missing].', args: [[1, 2, 2, 4]], expected: [2, 3] },
    { scenario: 'Example 2', hint: 'Smallest input: 1 duplicated, 2 missing.', args: [[1, 1]], expected: [1, 2] },
    { scenario: 'Missing 1', hint: 'n = 2 with 1 missing — order still [duplicate, missing].', args: [[2, 2]], expected: [2, 1] },
    { scenario: 'Unsorted input', hint: 'Do not assume sorted order — neighbours do not reveal the duplicate.', args: [[3, 2, 3, 4, 6, 5]], expected: [3, 1] },
    { scenario: 'Missing n', hint: 'The missing value is n itself.', args: [[1, 5, 3, 2, 2, 7, 6, 4, 8, 9]], expected: [2, 10] },
    { scenario: 'Duplicate adjacent to missing', hint: 'The duplicate and missing values are neighbours.', args: [[3, 2, 2]], expected: [2, 1] },
    { scenario: 'Duplicate is n − 1', hint: 'Duplicate near the end, n missing.', args: [[1, 2, 3, 4, 4]], expected: [4, 5] },
    { scenario: 'Order matters', hint: 'Returning [missing, duplicate] fails here: duplicate 5, missing 1.', args: [[5, 3, 2, 4, 5]], expected: [5, 1] },
    { scenario: 'Duplicates on swap', hint: 'A cyclic-sort swap guarded by nums[i] !== i + 1 loops forever on the duplicate — compare with the target slot.', args: [[2, 3, 3, 1, 6, 5]], expected: [3, 4] },
    { scenario: 'Reverse order', hint: 'Values arrive in descending order.', args: [[6, 5, 4, 3, 1, 1]], expected: [1, 2] },
    { scenario: 'Max size (n = 10^4)', hint: 'A scrambled 1..10^4 with one value overwritten.', argsGen: '() => { const a = Array.from({ length: 10000 }, (_, i) => ((i * 7919) % 10000) + 1); a[a.indexOf(1234)] = 9876; return [a]; }', expected: [9876, 1234] },
    { scenario: 'Max size, missing 1', hint: '10^4 values where 1 is replaced by a second 10^4.', argsGen: '() => { const a = Array.from({ length: 10000 }, (_, i) => 10000 - i); a[9999] = 10000; return [a]; }', expected: [10000, 1] },
  ],

  solution: {
    code: `function findErrorNums(nums) {
  let i = 0;
  while (i < nums.length) {
    const h = nums[i] - 1;
    if (nums[h] !== nums[i]) {
      [nums[i], nums[h]] = [nums[h], nums[i]];   // send nums[i] home
    } else {
      i++;                                        // home, or duplicate
    }
  }
  for (let j = 0; j < nums.length; j++) {
    if (nums[j] !== j + 1) return [nums[j], j + 1];
  }
  return [];
}`,
  },
  dryRun: {
    columns: ['i', 'array', 'action'],
    rows: [
      ['0', '[3,2,3,4,6,5]', '3 → index 2 holds 3 already → i++'],
      ['1', '[3,2,3,4,6,5]', '2 is home → i++'],
      ['2', '[3,2,3,4,6,5]', 'home → i++'],
      ['3', '[3,2,3,4,6,5]', 'home → i++'],
      ['4', '[3,2,3,4,6,5]', '6 → swap with index 5'],
      ['4', '[3,2,3,4,5,6]', 'home → i++ (twice)'],
      ['scan', '[3,2,3,4,5,6]', 'index 0 holds 3 → [3, 1]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'At most n swaps, n increments and one scan.' },
  alternative: {
    title: 'Math with sum and sum of squares',
    md: 'Let d = duplicate, m = missing. sum(nums) − expectedSum = d − m, and sumSquares(nums) − expectedSquares = d² − m² = (d − m)(d + m). Solve the two equations. O(n), does not modify the input.',
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Returning [missing, duplicate] — order matters.',
    'Assuming the array is sorted (it may be in any order).',
    'Infinite loop from the swap condition nums[i] !== i + 1.',
  ],
};
