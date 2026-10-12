export default {
  id: 'find-all-duplicates-in-an-array',
  title: 'Find All Duplicates in an Array',
  difficulty: 'Medium',
  order: 3,
  pattern: 'index-marking-negation',
  tags: ['array', 'index marking'],
  source: { platform: 'LeetCode', number: 442, url: 'https://leetcode.com/problems/find-all-duplicates-in-an-array/' },

  statement: `\`nums\` has length \`n\`, all values are in \`1..n\`, and each value appears **once or twice**.

Return all values that appear twice (any order). Use O(n) time and only constant extra space (the output list does not count).`,
  examples: [
    { input: 'nums = [4,3,2,7,8,2,3,1]', output: '[2,3]' },
    { input: 'nums = [1,1,2]', output: '[1]' },
    { input: 'nums = [1]', output: '[]' },
  ],
  constraints: ['1 <= n <= 10^5', '1 <= nums[i] <= n', 'Each value appears once or twice'],

  think: `- You need a "seen" flag per value but no extra array. What free bit does every cell have?
- When you visit value v for the second time, what will you find at index v − 1?`,
  patternChallenge: {
    options: ['Sort + scan neighbours', 'Index marking with negation', 'Sliding window', 'Binary search'],
    answer: 1,
    explanation: 'Values 1..n and constant space: the sign of nums[v − 1] can flag "v seen". Seeing an already-negative mark means v is a duplicate. Sorting works but costs O(n log n).',
  },
  hints: [
    'For each i, let v = Math.abs(nums[i]). Look at nums[v − 1].',
    'If it is negative, v was seen before → push v. Otherwise negate it.',
  ],
  approach: `**Brute force:** a Set / Map → O(n) space; or sort and compare neighbours → O(n log n).

**Index marking (O(n), O(1)):** the sign of \`nums[v − 1]\` is a "seen v" bit. On each visit: if already negative, v is a duplicate; otherwise negate it. Because each value appears at most twice, each duplicate is reported exactly once.`,

  functionName: 'findDuplicates',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function findDuplicates(nums) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: '2 and 3 each appear twice; every other value once.', args: [[4, 3, 2, 7, 8, 2, 3, 1]], expected: [2, 3] },
    { scenario: 'Example 2', hint: 'The duplicate is 1 — the mark lands on index 0.', args: [[1, 1, 2]], expected: [1] },
    { scenario: 'Example 3', hint: 'Smallest input: one value, no duplicates — return [].', args: [[1]], expected: [] },
    { scenario: 'Permutation, no duplicates', hint: 'Every value appears once — the answer is empty.', args: [[1, 2, 3]], expected: [] },
    { scenario: 'Two values twice', hint: 'Read values with Math.abs — earlier marks have made some entries negative.', args: [[2, 2, 1, 1]], expected: [1, 2] },
    { scenario: 'Every value twice', hint: 'Half the values are duplicates; each must be reported exactly once.', args: [[3, 3, 1, 1, 2, 2]], expected: [1, 2, 3] },
    { scenario: 'Duplicate of n', hint: 'The largest value n maps to the last index.', args: [[4, 1, 4, 2]], expected: [4] },
    { scenario: 'Second visit must not unflip', hint: 'An unconditional nums[v−1] *= −1 flips the mark back on the second visit — check the sign first.', args: [[5, 4, 6, 7, 9, 3, 10, 9, 5, 6]], expected: [5, 6, 9] },
    { scenario: 'Two elements, same value', hint: 'n = 2 with both values equal.', args: [[2, 2]], expected: [2] },
    { scenario: 'Reverse sorted with duplicate', hint: 'Order does not matter; marks are by value.', args: [[5, 4, 3, 3, 1]], expected: [3] },
    { scenario: 'Large, two duplicates (n = 10^5)', hint: 'An indexOf/includes scan per element is O(n²) ≈ 10^10 here; mark visited values by sign in O(n).', argsGen: '() => { const a = Array.from({ length: 99998 }, (_, i) => i + 1); a.push(77, 50000); return [a]; }', expected: [77, 50000], timeLimitMs: 1000 },
    { scenario: 'Large, every value twice (n = 10^5)', hint: '50000 values each appear twice at full size.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => 50000 - (i >> 1))]', expected: Array.from({ length: 50000 }, (_, i) => i + 1), timeLimitMs: 1000 },
  ],
  solution: {
    code: `function findDuplicates(nums) {
  const dup = [];
  for (let i = 0; i < nums.length; i++) {
    const v = Math.abs(nums[i]);
    if (nums[v - 1] < 0) dup.push(v);      // second time we see v
    else nums[v - 1] = -nums[v - 1];       // first time: mark it
  }
  return dup;
}`,
  },
  dryRun: {
    columns: ['i', 'v', 'nums[v-1] before', 'action'],
    rows: [
      ['0', '4', '7', 'mark'],
      ['1', '3', '2', 'mark'],
      ['2', '2', '3', 'mark'],
      ['3', '7', '3', 'mark'],
      ['4', '8', '1', 'mark'],
      ['5', '2', '-3', 'duplicate 2'],
      ['6', '3', '-2', 'duplicate 3'],
      ['7', '1', '4', 'mark'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1) extra', explanation: 'One pass; the marks live in the input.' },
  alternative: {
    title: 'Cyclic sort',
    md: 'Place each value at index v − 1; afterwards every index j with nums[j] !== j + 1 holds a duplicate value nums[j].',
    code: `function findDuplicates(nums) {
  let i = 0;
  while (i < nums.length) {
    const h = nums[i] - 1;
    if (nums[h] !== nums[i]) [nums[i], nums[h]] = [nums[h], nums[i]];
    else i++;
  }
  const res = [];
  for (let j = 0; j < nums.length; j++) if (nums[j] !== j + 1) res.push(nums[j]);
  return res;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Forgetting Math.abs when reading v.',
    'Unconditional `nums[v-1] *= -1` — the second visit flips the mark back.',
    'Using this trick when values may be 0 (0 has no sign to flip).',
  ],
};
