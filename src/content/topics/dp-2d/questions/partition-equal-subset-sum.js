export default {
  id: 'partition-equal-subset-sum',
  title: 'Partition Equal Subset Sum',
  difficulty: 'Medium',
  order: 7,
  pattern: 'dp-2d-knapsack-01',
  tags: ['array', 'dynamic programming', 'knapsack'],
  source: { platform: 'LeetCode', number: 416, url: 'https://leetcode.com/problems/partition-equal-subset-sum/' },

  statement: `Given an array \`nums\` of positive integers, decide whether it can be split into **two groups with the same sum**. Every element goes into exactly one group. Return \`true\` or \`false\`.`,
  examples: [
    { input: 'nums = [1,5,11,5]', output: 'true', explanation: '[1, 5, 5] and [11].' },
    { input: 'nums = [1,2,3,5]', output: 'false', explanation: 'Total 11 is odd.' },
  ],
  constraints: ['1 <= nums.length <= 200', '1 <= nums[i] <= 100'],

  think: `- If the two halves are equal, what must each one sum to?
- So the question is "is there a subset with sum X?" — each element used how many times?
- What is the largest X can be? Is an O(n·X) table affordable?`,
  patternChallenge: {
    options: ['Greedy: put the next largest into the smaller group', '0/1 knapsack (subset sum)', 'Sort + two pointers', 'Unbounded knapsack'],
    answer: 1,
    explanation: 'Equal halves ⇔ a subset summing to total / 2, each element used at most once → 0/1 subset sum. Greedy fails on [3,3,2,2,2]; unbounded would reuse elements.',
  },
  hints: [
    'If the total is odd, return false. Otherwise target = total / 2.',
    'dp[s] = "some subset of the elements seen so far sums to s". For each x, for s from target DOWN to x: dp[s] ||= dp[s − x].',
  ],
  approach: `**Brute force:** try all 2^n subsets.

**Reduce:** two equal halves each sum to \`total / 2\`, so find one subset with that sum (the rest is automatically the other half). Odd total → impossible.

**0/1 knapsack (boolean):** \`dp[s]\` = reachable. \`dp[0] = true\`. For each number \`x\`, iterate \`s\` **backwards** from \`target\` to \`x\` and set \`dp[s] = dp[s] || dp[s − x]\`. Backwards ensures \`dp[s − x]\` still reflects the state *before* \`x\` was considered, so \`x\` is used at most once.

Largest target = 200 · 100 / 2 = 10,000 → at most 2 million cell updates.`,

  functionName: 'canPartition',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function canPartition(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: [1,5,5] and [11].', args: [[1, 5, 11, 5]], expected: true },
    { scenario: 'Example 2', hint: 'Total 11 is odd — no equal split.', args: [[1, 2, 3, 5]], expected: false },
    { scenario: 'Single element', hint: 'One number cannot be split into two non-empty equal halves.', args: [[1]], expected: false },
    { scenario: 'Two equal elements', hint: 'The smallest true case.', args: [[2, 2]], expected: true },
    { scenario: 'Two different elements', hint: 'Even total is not enough when the pieces differ.', args: [[1, 3]], expected: false },
    { scenario: 'Odd total', hint: 'Sum 7 is odd → false immediately. Forgetting the parity check can make target 3.5 behave oddly.', args: [[1, 2, 4]], expected: false },
    { scenario: 'Element equals half alone', hint: 'Target is 4 and no subset sums to 4. Iterating sums forwards lets the 2 be used twice (2+2) and returns true.', args: [[1, 2, 5]], expected: false },
    { scenario: 'Greedy to lighter group fails', hint: 'Assigning largest-first to the lighter side gives 8 vs 10, but 4+5 = 3+3+3.', args: [[3, 3, 3, 4, 5]], expected: true },
    { scenario: 'Even total, no split', hint: 'Sum 12 is even, but no subset reaches 6.', args: [[2, 2, 3, 5]], expected: false },
    { scenario: 'Large element dominates', hint: 'One element larger than half the total → false.', args: [[100, 1, 2, 3]], expected: false },
    { scenario: 'Many ones and two 100s', hint: '98 ones + 100 + 100: put one 100 and 49 ones on each side.', argsGen: '() => [[...new Array(98).fill(1), 100, 100]]', expected: true },
    { scenario: 'Large input, impossible (n = 200)', hint: 'All numbers are even but half the total is odd. Plain include/exclude recursion explores 2^200 subsets; the reachable-sums table is O(n · sum).', argsGen: '() => [[...new Array(199).fill(100), 2]]', expected: false, timeLimitMs: 1000 },
    { scenario: 'Large input, possible (n = 200)', hint: 'Max size: 200 values in 1..100 with an even total — the table of reachable sums is at most 200 × 10 000.', argsGen: '() => { let x = 21; const r = () => (x = x * 48271 % 2147483647); const a = Array.from({ length: 200 }, () => 1 + r() % 100); if (a.reduce((s, v) => s + v, 0) % 2) a[0] = a[0] === 100 ? 99 : a[0] + 1; return [a]; }', expected: true },
  ],

  solution: {
    code: `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 !== 0) return false;
  const target = total / 2;
  const dp = new Uint8Array(target + 1);      // dp[s] = 1 if some subset sums to s
  dp[0] = 1;
  for (const x of nums) {
    for (let s = target; s >= x; s--) {       // backwards: x used at most once
      if (dp[s - x]) dp[s] = 1;
    }
    if (dp[target]) return true;
  }
  return false;
}`,
  },
  dryRun: {
    columns: ['x', 'reachable sums (≤ 11)'],
    rows: [
      ['start', '{0}'],
      ['1', '{0, 1}'],
      ['5', '{0, 1, 5, 6}'],
      ['11', '{0, 1, 5, 6, 11} → dp[11] true, return'],
    ],
  },
  complexity: { time: 'O(n · total)', space: 'O(total)', explanation: 'n items × target / 2 capacities; one array. Pseudo-polynomial.' },
  alternative: {
    title: 'Bitset of reachable sums',
    md: 'Keep reachable sums as bits of a BigInt: bits |= bits << BigInt(x). Each item is one shift+OR over the whole bitset — very fast in languages with native bitsets; in JS, BigInt shifts are O(total/64) each, so it is still O(n·total/64).',
    code: `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  let bits = 1n;
  for (const x of nums) bits |= bits << BigInt(x);
  return ((bits >> BigInt(total / 2)) & 1n) === 1n;
}`,
    complexity: 'O(n · total / word size)',
  },
  mistakes: [
    'Iterating s forwards — lets one element fill the target alone (e.g. [2] with target 4 would pass).',
    'Forgetting the odd-total check.',
    'Greedy assignment to the lighter group.',
  ],
};
