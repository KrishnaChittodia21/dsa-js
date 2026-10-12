export default {
  id: 'majority-element',
  title: 'Majority Element',
  difficulty: 'Easy',
  order: 2,
  pattern: 'boyer-moore-voting',
  tags: ['array', 'counting', 'voting'],
  source: { platform: 'LeetCode', number: 169, url: 'https://leetcode.com/problems/majority-element/' },

  statement: `Given an array \`nums\` of length \`n\`, return the element that occurs **more than ⌊n / 2⌋ times**.

You may assume such an element always exists. Follow-up: can you do it in O(n) time and O(1) extra space?`,
  examples: [
    { input: 'nums = [3,2,3]', output: '3' },
    { input: 'nums = [2,2,1,1,1,2,2]', output: '2', explanation: '2 appears 4 times out of 7.' },
  ],
  constraints: ['1 <= n <= 5 * 10^4', '-10^9 <= nums[i] <= 10^9', 'A majority element always exists'],

  think: `- A Map of counts works — but what if you may only keep one or two variables?
- If you pair up two **different** elements and delete both, can the majority element ever disappear completely?`,
  patternChallenge: {
    options: ['Kadane\'s algorithm', 'Boyer–Moore majority voting', 'Cyclic sort', 'Sliding window'],
    answer: 1,
    explanation: '"More than ⌊n/2⌋ times" + O(1) space is the textbook signal for voting. Cyclic sort needs values in 1..n (here values go up to 10^9), and Kadane/window are about contiguous ranges.',
  },
  hints: [
    'Keep a candidate and a counter. Matching element → +1, different element → −1.',
    'When the counter is 0, the current element becomes the new candidate. The majority can never be fully cancelled.',
  ],
  approach: `**Brute force:** count each element with a nested loop → O(n²). A Map of counts → O(n) time, O(n) space. Sorting and taking \`nums[⌊n/2⌋]\` → O(n log n) (the middle of a sorted array must be the majority).

**Boyer–Moore voting (O(n), O(1)):** each "different" vote cancels one candidate vote. Since the majority has more votes than everyone else combined, it is the last one standing. The problem guarantees a majority, so no verification pass is needed.`,

  functionName: 'majorityElement',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function majorityElement(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '3 appears twice out of three.', args: [[3, 2, 3]], expected: 3 },
    { scenario: 'Example 2', hint: '2 appears 4 times out of 7, though 1 leads in the middle.', args: [[2, 2, 1, 1, 1, 2, 2]], expected: 2 },
    { scenario: 'Single element', hint: 'Smallest input: the only element is the majority.', args: [[1]], expected: 1 },
    { scenario: 'Two equal elements', hint: 'Both elements are the majority value.', args: [[5, 5]], expected: 5 },
    { scenario: 'Alternating, majority wins', hint: 'The candidate keeps switching; the final candidate is still the majority.', args: [[1, 2, 1, 2, 1]], expected: 1 },
    { scenario: 'Negative majority', hint: 'Negative values work like any other.', args: [[-1, -1, 7, -1]], expected: -1 },
    { scenario: 'Majority at both ends', hint: 'The final count is not the frequency — just return the candidate.', args: [[4, 4, 4, 1, 2, 3, 4]], expected: 4 },
    { scenario: 'Majority arrives late', hint: 'The candidate is replaced several times before 9 settles.', args: [[1, 9, 9, 1, 9, 1, 9, 9]], expected: 9 },
    { scenario: 'Multi-digit values', hint: 'Values of different digit lengths; compare numbers, not their string forms.', args: [[100, 9, 100, 9, 100]], expected: 100 },
    { scenario: 'Extreme values', hint: 'Values at ±10^9.', args: [[-1000000000, 1000000000, -1000000000]], expected: -1000000000 },
    { scenario: 'Large, majority at end (n = 5·10^4)', hint: 'Counting every element against the whole array is O(n²) ≈ 1.25·10^9 here; Boyer–Moore voting is one pass.', argsGen: '() => [[...Array.from({ length: 24999 }, (_, i) => i + 1), ...new Array(25001).fill(-7)]]', expected: -7, timeLimitMs: 400 },
    { scenario: 'Large interleaved (n = 5·10^4)', hint: 'The majority is spread among many distinct values at full size.', argsGen: '() => [Array.from({ length: 50000 }, (_, i) => (i % 2 === 0 || i % 7 === 0 ? 42 : i))]', expected: 42 },
  ],

  solution: {
    code: `function majorityElement(nums) {
  let candidate = nums[0];
  let count = 0;
  for (const x of nums) {
    if (count === 0) candidate = x;        // nobody standing → adopt x
    count += x === candidate ? 1 : -1;     // vote for / against
  }
  return candidate;                        // guaranteed to be the majority
}`,
  },
  dryRun: {
    columns: ['x', 'candidate', 'count'],
    rows: [
      ['2', '2', '1'],
      ['2', '2', '2'],
      ['1', '2', '1'],
      ['1', '2', '0'],
      ['1', '1', '1'],
      ['2', '1', '0'],
      ['2', '2', '1'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass with two variables.' },
  alternative: {
    title: 'Sort and take the middle',
    md: 'An element occupying more than half the positions must cover index ⌊n/2⌋ after sorting.',
    code: `function majorityElement(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}`,
    complexity: 'O(n log n) time, O(n) space (copy)',
  },
  mistakes: [
    'Using `sort()` without a comparator — JavaScript sorts numbers as strings ([10, 9] stays [10, 9]).',
    'Believing the final count is the frequency of the majority — it is not.',
    'Omitting verification in variants where the majority is not guaranteed.',
  ],
};
