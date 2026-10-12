export default {
  id: 'find-all-numbers-disappeared-in-an-array',
  title: 'Find All Numbers Disappeared in an Array',
  difficulty: 'Easy',
  order: 3,
  pattern: 'index-marking-negation',
  tags: ['array', 'index marking', 'cyclic sort'],
  source: { platform: 'LeetCode', number: 448, url: 'https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/' },

  statement: `\`nums\` has length \`n\` and every value lies in the range \`1..n\`. Some values appear twice and others not at all.

Return every value in \`1..n\` that does **not** appear in \`nums\`, in increasing order. Try to use no extra space besides the returned list, in O(n) time.`,
  examples: [
    { input: 'nums = [4,3,2,7,8,2,3,1]', output: '[5,6]' },
    { input: 'nums = [1,1]', output: '[2]' },
  ],
  constraints: ['n == nums.length', '1 <= n <= 10^5', '1 <= nums[i] <= n'],

  think: `- A Set of seen values would work. Where else could you store "I have seen value v" for every v?
- Every value is positive. Which bit of each number are you not using?`,
  patternChallenge: {
    options: ['Hash map of counts (the O(n)-space baseline)', 'Binary search', 'Kadane\'s algorithm', 'Index marking with negation'],
    answer: 3,
    explanation: 'Values in 1..n + "no extra space" → the array is its own hash set. Negating nums[v − 1] records "v seen". A hash map is correct but uses O(n) extra memory, which the follow-up forbids.',
  },
  hints: [
    'For each value v (use Math.abs, it may already be negative), make nums[v − 1] negative.',
    'At the end, index j is still positive exactly when value j + 1 never appeared.',
  ],
  approach: `**Brute force:** for each v in 1..n check \`nums.includes(v)\` → O(n²). A Set → O(n) time, O(n) space.

**Index marking (O(n), O(1)):**
1. For each i: \`v = Math.abs(nums[i])\`; set \`nums[v − 1] = -Math.abs(nums[v − 1])\` (idempotent — marking twice is harmless).
2. Collect every j with \`nums[j] > 0\` → value j + 1 is missing.

**Cyclic sort** also works: place each value at index v − 1, then report indices j where \`nums[j] !== j + 1\`.`,

  functionName: 'findDisappearedNumbers',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function findDisappearedNumbers(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '5 and 6 never appear; 2 and 3 appear twice.', args: [[4, 3, 2, 7, 8, 2, 3, 1]], expected: [5, 6] },
    { scenario: 'Example 2', hint: 'Missing value is n itself — return values (j + 1), not indices.', args: [[1, 1]], expected: [2] },
    { scenario: 'Single element', hint: 'Smallest input: [1] is complete — return [].', args: [[1]], expected: [] },
    { scenario: 'Missing 1', hint: 'Index 0 is never marked, so 1 is missing.', args: [[2, 2]], expected: [1] },
    { scenario: 'Nothing missing', hint: 'A full permutation — the answer is empty.', args: [[1, 2, 3, 4, 5]], expected: [] },
    { scenario: 'All the same value', hint: 'Every value but one is missing.', args: [[5, 5, 5, 5, 5]], expected: [1, 2, 3, 4] },
    { scenario: 'Second occurrence must not unmark', hint: '`nums[v − 1] *= −1` flips a mark back on a repeated value — set it negative with −Math.abs instead.', args: [[2, 1, 2, 1]], expected: [3, 4] },
    { scenario: 'Read values with abs', hint: 'After marking, entries may be negative — using nums[i] directly as an index reads nums[−3].', args: [[3, 3, 3]], expected: [1, 2] },
    { scenario: 'Reverse order', hint: 'Order of the input does not matter; output must be increasing.', args: [[4, 4, 2, 1]], expected: [3] },
    { scenario: 'Missing at both ends', hint: 'Both 1 and n are absent.', args: [[3, 2, 2, 3]], expected: [1, 4] },
    { scenario: 'Large, two missing (n = 10^5)', hint: 'Calling includes for every value is O(n²) ≈ 10^10 here; mark seen values by sign in O(n).', argsGen: '() => { const a = Array.from({ length: 100000 }, (_, i) => i + 1); a[123] = 7; a[99999] = 8; return [a]; }', expected: [124, 100000], timeLimitMs: 1000 },
    { scenario: 'Large, half missing (n = 10^5)', hint: 'Only even values appear (each twice) — every odd value is missing.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => 2 * ((i >> 1) + 1))]', expected: Array.from({ length: 50000 }, (_, i) => 2 * i + 1), timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findDisappearedNumbers(nums) {
  for (let i = 0; i < nums.length; i++) {
    const v = Math.abs(nums[i]);             // original value (cell may be marked)
    nums[v - 1] = -Math.abs(nums[v - 1]);    // mark "v seen" (safe to repeat)
  }
  const missing = [];
  for (let j = 0; j < nums.length; j++) {
    if (nums[j] > 0) missing.push(j + 1);   // never marked → j + 1 missing
  }
  return missing;
}`,
  },
  dryRun: {
    columns: ['i', 'v', 'mark index', 'array after'],
    rows: [
      ['0', '4', '3', '[4,3,2,-7,8,2,3,1]'],
      ['1', '3', '2', '[4,3,-2,-7,8,2,3,1]'],
      ['2', '2', '1', '[4,-3,-2,-7,8,2,3,1]'],
      ['3', '7', '6', '[4,-3,-2,-7,8,2,-3,1]'],
      ['4', '8', '7', '[4,-3,-2,-7,8,2,-3,-1]'],
      ['5', '2', '1', 'already negative'],
      ['6', '3', '2', 'already negative'],
      ['7', '1', '0', '[-4,-3,-2,-7,8,2,-3,-1]'],
      ['scan', '', '', 'indices 4 and 5 positive → [5, 6]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1) extra', explanation: 'Two passes. The output list is not counted as extra space.' },
  alternative: {
    title: 'Cyclic sort',
    md: 'Swap each value to index v − 1 (skip when the home already holds v), then list the indices that disagree.',
    code: `function findDisappearedNumbers(nums) {
  let i = 0;
  while (i < nums.length) {
    const h = nums[i] - 1;
    if (nums[h] !== nums[i]) [nums[i], nums[h]] = [nums[h], nums[i]];
    else i++;
  }
  const res = [];
  for (let j = 0; j < nums.length; j++) if (nums[j] !== j + 1) res.push(j + 1);
  return res;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Writing `nums[v - 1] *= -1` — a second occurrence flips the mark back to positive.',
    'Using nums[i] directly as an index after it was negated → nums[-3] is undefined.',
    'Returning j instead of j + 1 (values are 1-based, indices 0-based).',
  ],
};
