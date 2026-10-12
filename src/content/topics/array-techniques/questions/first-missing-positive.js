export default {
  id: 'first-missing-positive',
  title: 'First Missing Positive',
  difficulty: 'Hard',
  order: 1,
  pattern: 'cyclic-sort',
  tags: ['array', 'cyclic sort', 'index marking'],
  source: { platform: 'LeetCode', number: 41, url: 'https://leetcode.com/problems/first-missing-positive/' },

  statement: `Given an **unsorted** integer array \`nums\`, return the smallest positive integer (1, 2, 3, …) that does not appear in it.

Your algorithm must run in O(n) time and use O(1) auxiliary space.`,
  examples: [
    { input: 'nums = [1,2,0]', output: '3' },
    { input: 'nums = [3,4,-1,1]', output: '2' },
    { input: 'nums = [7,8,9,11,12]', output: '1' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1'],

  think: `- With n numbers, what is the **largest** possible answer? (Hint: it is at most n + 1.)
- So which values actually matter? What can you do with 0, negatives and numbers bigger than n?
- Once only 1..n matter, which technique from this topic applies?`,
  patternChallenge: {
    options: ['Sort and scan', 'Hash set of all values', 'Cyclic sort, ignoring values outside 1..n', 'Kadane\'s algorithm'],
    answer: 2,
    explanation: 'The answer lies in 1..n+1, so only values in 1..n are relevant — each has a home index. Cyclic sort (skipping everything else) meets O(n) time and O(1) space. Sorting is O(n log n); a hash set is O(n) space.',
  },
  hints: [
    'The answer is in 1..n+1: if all of 1..n are present the answer is n + 1, otherwise it is the first gap.',
    'Cyclic-sort only values v with 1 <= v <= n into index v − 1 (skip duplicates whose home is already correct). Then the first index j with nums[j] !== j + 1 gives j + 1.',
  ],
  approach: `**Brute force:** try 1, 2, 3, … and scan the array each time → O(n²). A Set → O(n) space. Sorting → O(n log n).

**Key observation:** n numbers can "cover" at most the values 1..n, so the answer is ≤ n + 1. Values ≤ 0 or > n are irrelevant.

**Cyclic sort (O(n), O(1)):** for each i, while \`nums[i]\` is in 1..n and its home \`nums[nums[i] − 1]\` does not already hold it, swap it home. Then the first index j with \`nums[j] !== j + 1\` answers j + 1; if none, answer n + 1. Each swap fixes one slot permanently → ≤ n swaps.`,

  functionName: 'firstMissingPositive',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function firstMissingPositive(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '1 and 2 are present, so the answer is 3.', args: [[1, 2, 0]], expected: 3 },
    { scenario: 'Example 2', hint: 'Negatives are ignored; 1 is present but 2 is not.', args: [[3, 4, -1, 1]], expected: 2 },
    { scenario: 'Example 3', hint: 'All values exceed n — skip them (writing them to index v − 1 is out of bounds). Answer 1.', args: [[7, 8, 9, 11, 12]], expected: 1 },
    { scenario: 'Single one', hint: 'All of 1..n present → answer n + 1. Do not forget that final case.', args: [[1]], expected: 2 },
    { scenario: 'Single non-one', hint: 'Smallest input where 1 is missing.', args: [[2]], expected: 1 },
    { scenario: 'Duplicates', hint: 'Swapping while nums[i] !== i + 1 loops forever on [1, 1] — compare against the target slot instead.', args: [[1, 1]], expected: 2 },
    { scenario: 'No positives', hint: 'Zero and negatives never count — answer 1.', args: [[-5, -3, 0]], expected: 1 },
    { scenario: 'Shuffled 1..n', hint: 'Every slot gets filled by swapping — answer n + 1.', args: [[2, 1, 4, 3, 6, 5]], expected: 7 },
    { scenario: '32-bit extremes', hint: 'Huge and tiny values must be skipped safely.', args: [[2147483647, -2147483648, 1, 2, 2]], expected: 3 },
    { scenario: 'Gap in the middle', hint: 'The answer is a gap inside the present range.', args: [[5, 3, 1, 2, 6]], expected: 4 },
    { scenario: 'Value equal to n', hint: 'n itself belongs in the last slot.', args: [[4, 3, 1, 4]], expected: 2 },
    { scenario: 'Large reversed 1..n (n = 10^5)', hint: 'Checking 1, 2, 3, … with includes is O(n²) ≈ 5·10^9 here. Place each value at index v − 1 in O(n).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => 100000 - i)]', expected: 100001, timeLimitMs: 1000 },
    { scenario: 'Large with one gap (n = 10^5)', hint: 'Every value but 77777 appears; the missing one is in the middle.', argsGen: '() => { const a = Array.from({ length: 100000 }, (_, i) => ((i * 7919) % 100000) + 1); a[a.indexOf(77777)] = -1; return [a]; }', expected: 77777, timeLimitMs: 1000 },
  ],
  solution: {
    code: `function firstMissingPositive(nums) {
  const n = nums.length;
  let i = 0;
  while (i < n) {
    const v = nums[i];
    // Only 1..n have a home; skip if the home already holds v (handles duplicates).
    if (v >= 1 && v <= n && nums[v - 1] !== v) {
      [nums[i], nums[v - 1]] = [nums[v - 1], nums[i]];
    } else {
      i++;
    }
  }
  for (let j = 0; j < n; j++) {
    if (nums[j] !== j + 1) return j + 1;
  }
  return n + 1;
}`,
  },
  dryRun: {
    columns: ['i', 'array', 'action'],
    rows: [
      ['0', '[3,4,-1,1]', '3 → swap with index 2'],
      ['0', '[-1,4,3,1]', '-1 out of range → i++'],
      ['1', '[-1,4,3,1]', '4 → swap with index 3'],
      ['1', '[-1,1,3,4]', '1 → swap with index 0'],
      ['1', '[1,-1,3,4]', '-1 → i++'],
      ['2..3', '[1,-1,3,4]', 'home → i++'],
      ['scan', '[1,-1,3,4]', 'index 1 holds -1 → answer 2'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Every swap places a value permanently (≤ n swaps) plus ≤ n increments and one scan.' },
  alternative: {
    title: 'Clean up + index marking',
    md: 'Replace every value outside 1..n with n + 1 (now everything is positive). Then for each v = |nums[i]| ≤ n, make nums[v − 1] negative. The first index still positive is the answer.',
    code: `function firstMissingPositive(nums) {
  const n = nums.length;
  for (let i = 0; i < n; i++) if (nums[i] <= 0 || nums[i] > n) nums[i] = n + 1;
  for (let i = 0; i < n; i++) {
    const v = Math.abs(nums[i]);
    if (v <= n) nums[v - 1] = -Math.abs(nums[v - 1]);
  }
  for (let i = 0; i < n; i++) if (nums[i] > 0) return i + 1;
  return n + 1;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Not skipping values > n → writing out of bounds.',
    'Swap condition nums[i] !== i + 1 → infinite loop on duplicates like [1, 1].',
    'Forgetting the n + 1 case when 1..n are all present.',
  ],
};
