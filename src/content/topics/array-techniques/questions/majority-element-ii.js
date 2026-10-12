export default {
  id: 'majority-element-ii',
  title: 'Majority Element II',
  difficulty: 'Medium',
  order: 4,
  pattern: 'boyer-moore-voting',
  tags: ['array', 'voting', 'counting'],
  source: { platform: 'LeetCode', number: 229, url: 'https://leetcode.com/problems/majority-element-ii/' },

  statement: `Given an integer array \`nums\` of length \`n\`, return **all** values that appear **more than ⌊n / 3⌋ times**, in any order.

Follow-up: O(n) time and O(1) extra space.`,
  examples: [
    { input: 'nums = [3,2,3]', output: '[3]' },
    { input: 'nums = [1]', output: '[1]' },
    { input: 'nums = [1,2]', output: '[1,2]', explanation: 'n = 2, ⌊2/3⌋ = 0, so both values qualify.' },
  ],
  constraints: ['1 <= n <= 5 * 10^4', '-10^9 <= nums[i] <= 10^9'],

  think: `- How many different values can possibly appear more than n/3 times?
- In the n/2 version one vote cancels one other vote. What cancels here?
- Is a majority guaranteed to exist this time?`,
  patternChallenge: {
    options: ['Hash map of counts (O(n) space)', 'Sorting + binary search', 'Boyer–Moore voting with two candidates', 'Cyclic sort'],
    answer: 2,
    explanation: 'At most two values can exceed n/3, so keep two candidates; a third distinct value cancels one vote of each. The follow-up forbids the O(n)-space Map, and values up to 10^9 rule out cyclic sort.',
  },
  hints: [
    'Keep (c1, n1) and (c2, n2). Check "x equals c1 / c2" first, then "an empty slot exists", otherwise decrement both.',
    'The survivors are only candidates. Count them in a second pass and keep those with count > n/3.',
  ],
  approach: `**Brute force:** a Map of counts → O(n) time and space.

**Two-candidate voting (O(n), O(1)):** three values over n/3 would need more than n elements, so at most two answers exist. Every "decrement both" step removes three distinct values at once; a value with more than n/3 copies cannot be removed completely, so it ends as a candidate. The candidates might be false positives, so verify with a counting pass.`,

  functionName: 'majorityElement',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function majorityElement(nums) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: '3 appears twice, more than ⌊3/3⌋ = 1.', args: [[3, 2, 3]], expected: [3] },
    { scenario: 'Example 2', hint: 'Smallest input: the single value qualifies.', args: [[1]], expected: [1] },
    { scenario: 'Example 3', hint: '⌊2/3⌋ = 0, so both values qualify.', args: [[1, 2]], expected: [1, 2] },
    { scenario: 'No answer', hint: 'Each value appears exactly n/3 times — not more. Candidates must be verified with a second pass.', args: [[1, 2, 3]], expected: [] },
    { scenario: 'One value twice', hint: 'Both slots must not end up holding the same value — match candidates before filling empty slots.', args: [[2, 2]], expected: [2] },
    { scenario: 'Two answers', hint: 'Both 1 and 2 appear 3 times out of 8 (> 2).', args: [[1, 1, 1, 3, 3, 2, 2, 2]], expected: [1, 2] },
    { scenario: 'Exactly n/3 is not enough', hint: 'With >= instead of > the threshold, values at exactly ⌊n/3⌋ sneak in.', args: [[1, 1, 2, 2, 3, 3, 4, 4, 4]], expected: [] },
    { scenario: 'One clear winner', hint: '4 appears 4 times out of 10; others fall short.', args: [[4, 1, 2, 3, 4, 4, 3, 2, 1, 4]], expected: [4] },
    { scenario: 'All zeros', hint: 'Value 0 — do not use 0 as an "empty slot" marker.', args: [[0, 0, 0]], expected: [0] },
    { scenario: 'Winner arrives late', hint: 'Candidate slots get replaced several times before 1 settles.', args: [[1, 2, 3, 4, 5, 6, 1, 1, 1]], expected: [1] },
    { scenario: 'Negative and extreme values', hint: 'Values at ±10^9.', args: [[-1000000000, 1000000000, -1000000000, 1000000000, 5]], expected: [-1000000000, 1000000000] },
    { scenario: 'Large, two winners at end (n = 5·10^4)', hint: 'Counting each distinct value against the whole array is O(n²) here; two-candidate voting is O(n).', argsGen: '() => [[...Array.from({ length: 16000 }, (_, i) => i + 10), ...new Array(17000).fill(-3), ...new Array(17000).fill(5)]]', expected: [-3, 5], timeLimitMs: 400 },
    { scenario: 'Large, no winner (n = 5·10^4)', hint: 'All distinct values — nothing qualifies, and every candidate must fail verification.', argsGen: '() => [Array.from({ length: 50000 }, (_, i) => i * 3 - 70000)]', expected: [], timeLimitMs: 400 },
  ],
  solution: {
    code: `function majorityElement(nums) {
  let c1 = null, n1 = 0, c2 = null, n2 = 0;
  for (const x of nums) {
    if (x === c1) n1++;
    else if (x === c2) n2++;
    else if (n1 === 0) { c1 = x; n1 = 1; }
    else if (n2 === 0) { c2 = x; n2 = 1; }
    else { n1--; n2--; }            // x, c1 and c2 are three distinct votes → cancel
  }
  // Verify: voting only produces candidates.
  let k1 = 0, k2 = 0;
  for (const x of nums) {
    if (x === c1) k1++;
    else if (x === c2) k2++;
  }
  const res = [];
  const limit = nums.length / 3;
  if (k1 > limit) res.push(c1);
  if (k2 > limit) res.push(c2);
  return res;
}`,
  },
  dryRun: {
    columns: ['x', 'c1:n1', 'c2:n2', 'action'],
    rows: [
      ['1', '1:1', '—:0', 'fill slot 1'],
      ['1', '1:2', '—:0', 'match c1'],
      ['1', '1:3', '—:0', 'match c1'],
      ['3', '1:3', '3:1', 'fill slot 2'],
      ['3', '1:3', '3:2', 'match c2'],
      ['2', '1:2', '3:1', 'decrement both'],
      ['2', '1:1', '3:0', 'decrement both'],
      ['2', '1:1', '2:1', 'fill slot 2'],
      ['verify', '1 → 3', '2 → 3', 'n = 8, limit 2.67 → [1, 2]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Two passes with four variables.' },
  alternative: {
    title: 'Map of counts',
    md: 'Count everything in a Map and filter counts > n/3. Simplest to write; O(n) space.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Checking empty slots before matching candidates — the same value can end up in both slots.',
    'Skipping verification — [1, 2, 3] would wrongly return candidates.',
    'Using >= instead of > for the threshold.',
  ],
};
