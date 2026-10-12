export default {
  id: 'delete-and-earn',
  title: 'Delete and Earn',
  difficulty: 'Medium',
  order: 7,
  pattern: 'dp-1d-linear-sequence',
  tags: ['array', 'hash map', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 740, url: 'https://leetcode.com/problems/delete-and-earn/' },

  statement: `You are given \`nums\`. In one operation you pick any \`nums[i]\`, earn \`nums[i]\` points, and delete it — and you must also delete **every** element equal to \`nums[i] − 1\` and \`nums[i] + 1\` (earning nothing for those).

Return the **maximum points** you can earn.`,
  examples: [
    { input: 'nums = [3,4,2]', output: '6', explanation: 'Take 4 (deletes 3), then take 2.' },
    { input: 'nums = [2,2,3,3,3,4]', output: '9', explanation: 'Take all three 3s (deletes 2s and 4s).' },
  ],
  constraints: ['1 <= nums.length <= 2 * 10^4', '1 <= nums[i] <= 10^4'],

  think: `- If you take one copy of v, should you take all copies of v?
- Taking v forbids v − 1 and v + 1. Which earlier problem has "taking x forbids its neighbours"?
- How do you turn values into "houses"?`,
  patternChallenge: {
    options: ['Greedy — take the largest value first', 'Sorting + Two Pointers', 'Hash Map (Complement Lookup)', '1D DP — Linear Sequence (reduce to House Robber)'],
    answer: 3,
    explanation: 'Bucket points by value: points[v] = v × count(v). Choosing value v forbids v ± 1 — exactly house robber over the values 0..max.',
  },
  hints: [
    'Once you take one v, the other copies of v are no longer blocked by anything — take them all. So the gain for v is v × count(v).',
    'Build points[v] and run house robber on points[0..max].',
  ],
  approach: `**Brute force:** try every order of picks — exponential.

**Reduction:** all copies of v are taken together (taking one already deletes v ± 1, so the rest are free). Let \`points[v] = v · count(v)\`. Then choosing value v forbids v − 1 and v + 1: house robber on the array \`points\`, where "adjacent houses" are adjacent values.

\`dp[v] = max(dp[v − 1], dp[v − 2] + points[v])\`. O(n + maxValue).`,

  functionName: 'deleteAndEarn',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function deleteAndEarn(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Taking 4 deletes 3; then take 2: 4 + 2 = 6.', args: [[3, 4, 2]], expected: 6 },
    { scenario: 'Example 2', hint: 'Take all three 3s (9); that deletes the 2s and the 4.', args: [[2, 2, 3, 3, 3, 4]], expected: 9 },
    { scenario: 'Single element', hint: 'One number — take it.', args: [[1]], expected: 1 },
    { scenario: 'All copies of one value', hint: 'Taking a value earns every copy: 4 × 5. Treating copies separately loses points.', args: [[5, 5, 5, 5]], expected: 20 },
    { scenario: 'Biggest bucket first fails', hint: 'Value 2 has the largest total (4), but taking it blocks 1 and 3, which together earn 6.', args: [[1, 1, 1, 2, 2, 3]], expected: 6 },
    { scenario: 'No adjacent values', hint: 'Nothing conflicts — take everything.', args: [[1, 3, 5, 7]], expected: 16 },
    { scenario: 'Consecutive run', hint: 'Values 1..5 behave exactly like houses in a row: 1 + 3 + 5.', args: [[1, 2, 3, 4, 5]], expected: 9 },
    { scenario: 'Copies change the choice', hint: 'Weigh each value by v × count: 3 × 3 = 9 beats 4 × 2 = 8.', args: [[3, 3, 3, 4, 4]], expected: 9 },
    { scenario: 'Mixed duplicates and gaps', hint: 'Gaps between values (like 2 → 4) break the adjacency chain.', args: [[1, 1, 1, 2, 4, 5, 5, 5, 6]], expected: 18 },
    { scenario: 'Unsorted input', hint: 'Neighbours are VALUES v ± 1, not array positions — running house robber over the original order is wrong.', args: [[8, 10, 4, 9, 1, 3, 5, 9, 4, 10]], expected: 37 },
    { scenario: 'Multi-digit values', hint: 'If you sort, use a numeric comparator — the default sort puts 10 before 2 and 9, breaking the value order.', args: [[10, 9, 10, 2, 1, 9, 3]], expected: 24 },
    { scenario: 'Maximum value only', hint: 'A single value of 10⁴: the points array must have room for index maxVal.', args: [[10000]], expected: 10000 },
    { scenario: 'Large input (n = 2·10^4)', hint: 'Plain recursion over values without memo is exponential. Bucket points by value, then one O(n + maxVal) pass.', argsGen: '() => [(() => { let s = 13; return Array.from({ length: 20000 }, () => { s = (s * 1664525 + 1013904223) % 4294967296; return Math.floor(s / 256) % 10000 + 1; }); })()]', expected: 60724673, timeLimitMs: 1000 },
    { scenario: 'Long value chain (n = 2·10^4)', hint: 'Values 1..1000, twenty copies each: every value conflicts with its neighbours, so unmemoized take/skip recursion branches 2^1000 ways. One pass over the value buckets is enough.', argsGen: '() => [Array.from({ length: 20000 }, (_, i) => (i % 1000) + 1)]', expected: 5010000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function deleteAndEarn(nums) {
  let maxVal = 0;
  for (const x of nums) if (x > maxVal) maxVal = x;
  const points = new Array(maxVal + 1).fill(0);
  for (const x of nums) points[x] += x;          // taking value x earns all copies
  // House robber over values: neighbours are v - 1 and v + 1.
  let prev2 = 0, prev1 = 0;
  for (let v = 0; v <= maxVal; v++) {
    const cur = Math.max(prev1, prev2 + points[v]);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
  },
  dryRun: {
    columns: ['v', 'points[v]', 'skip', 'take', 'best'],
    rows: [
      ['0', '0', '0', '0', '0'],
      ['1', '0', '0', '0', '0'],
      ['2', '4', '0', '4', '4'],
      ['3', '9', '4', '9', '9'],
      ['4', '4', '9', '8', '9'],
    ],
    note: 'nums = [2,2,3,3,3,4] → 9.',
  },
  complexity: { time: 'O(n + M)', space: 'O(M)', explanation: 'M = max value (≤ 10⁴): one bucket pass, one robber pass.' },
  alternative: {
    title: 'Sorted distinct values (when values are huge)',
    md: 'Sort distinct values; if the current value is exactly previous + 1 apply the robber rule, otherwise there is no conflict and you can always add.',
    code: `function deleteAndEarn(nums) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) ?? 0) + 1);
  const vals = [...count.keys()].sort((a, b) => a - b);
  let prev2 = 0, prev1 = 0, last = -Infinity;
  for (const v of vals) {
    const gain = v * count.get(v);
    const cur = v === last + 1 ? Math.max(prev1, prev2 + gain) : prev1 + gain;
    prev2 = prev1; prev1 = cur; last = v;
  }
  return prev1;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: ['Treating each copy separately instead of summing v × count.', 'Running house robber over the original array order (neighbours are VALUES, not positions).', 'Default sort on numbers in the alternative.'],
};
