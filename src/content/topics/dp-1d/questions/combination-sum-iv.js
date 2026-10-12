export default {
  id: 'combination-sum-iv',
  title: 'Combination Sum IV',
  difficulty: 'Medium',
  order: 8,
  pattern: 'dp-1d-unbounded-choice',
  tags: ['array', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 377, url: 'https://leetcode.com/problems/combination-sum-iv/' },

  statement: `Given an array of **distinct** positive integers \`nums\` and a \`target\`, return the number of **ordered sequences** of elements from \`nums\` (each element may be used any number of times) whose sum is \`target\`.

Different orders count as different sequences: \`(1, 2)\` and \`(2, 1)\` are both counted. The answer fits in a 32-bit integer.`,
  examples: [
    { input: 'nums = [1,2,3], target = 4', output: '7', explanation: '(1,1,1,1) (1,1,2) (1,2,1) (1,3) (2,1,1) (2,2) (3,1).' },
    { input: 'nums = [9], target = 3', output: '0' },
  ],
  constraints: ['1 <= nums.length <= 200', '1 <= nums[i] <= 1000', 'all nums distinct', '1 <= target <= 1000'],

  think: `- For a sequence summing to x, what could its LAST element be?
- Does the last-element split count (1,2) and (2,1) separately? Why?
- What happens if you put the loop over nums OUTSIDE the loop over amounts?`,
  patternChallenge: {
    options: ['Backtracking (Combination Sum)', '1D DP — Unbounded Choices', 'Two Pointers', 'Greedy'],
    answer: 1,
    explanation: 'Counting (not listing) sequences → DP. dp[x] = Σ dp[x − n] over the last element n. Backtracking lists every sequence — far too many.',
  },
  hints: [
    'dp[0] = 1 (the empty sequence).',
    'for x = 1..target: for each n in nums: if n ≤ x, dp[x] += dp[x − n]. Amount loop OUTSIDE — that is what makes order matter.',
  ],
  approach: `**Brute force:** backtracking over sequences — the count grows exponentially with target.

**DP:** \`dp[x]\` = number of ordered sequences summing to x. Split by the last element n: the prefix is any sequence summing to x − n → \`dp[x] = Σ_n dp[x − n]\`. Sequences with different last elements are different, and within a group the prefixes are different — so every ordered sequence is counted exactly once.

**Order matters vs not:** with amounts outside, each dp[x] considers all nums as "last", so (1,2) and (2,1) are separate. Putting nums outside instead forces elements to appear in a fixed order (coin change II — unordered combinations, DP 2D topic).

**JS precision note:** the final answer fits in 32 bits, but some intermediate dp[x] values can be larger. JavaScript numbers stay exact up to 2⁵³, which is plenty for these constraints; in languages with 32-bit ints you would need to guard against overflow.`,

  functionName: 'combinationSum4',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function combinationSum4(nums, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'All 7 ordered sequences: (1,1,1,1), (1,1,2), (1,2,1), (2,1,1), (2,2), (1,3), (3,1).', args: [[1, 2, 3], 4], expected: 7 },
    { scenario: 'Example 2', hint: '9 is bigger than 3, so nothing can be formed — answer 0.', args: [[9], 3], expected: 0 },
    { scenario: 'Order matters', hint: '(1,2) and (2,1) both count, so the answer is 3, not 2. Looping nums OUTSIDE the amount loop counts unordered combinations instead.', args: [[1, 2], 3], expected: 3 },
    { scenario: 'Single number equals target', hint: 'Exactly one sequence: (1). dp[0] must be 1 (the empty sequence) or everything stays 0.', args: [[1], 1], expected: 1 },
    { scenario: 'Unreachable middle amounts', hint: 'Amount 1 is unreachable with {2,3}; its dp value stays 0 and must not break later sums.', args: [[2, 3], 7], expected: 3 },
    { scenario: 'Element larger than target', hint: 'Skip any number bigger than the remaining amount.', args: [[1, 50], 3], expected: 1 },
    { scenario: 'Several numbers, no 1', hint: 'Sequences like (4,6), (6,4), (5,5), (3,3,4)…', args: [[3, 4, 5, 6], 10], expected: 6 },
    { scenario: 'Unsorted input', hint: 'The order of nums does not matter for the count — only which number comes last in each sequence.', args: [[4, 2, 1], 32], expected: 39882198 },
    { scenario: 'Target not reachable', hint: 'Only multiples of 5 are reachable — 0 sequences.', args: [[5, 10, 25], 999], expected: 0 },
    { scenario: 'Small numbers, large count', hint: 'Over two billion sequences. Plain recursion visits every one of them; the O(target · n) DP counts them without listing.', args: [[1, 2, 3], 36], expected: 2082876103, timeLimitMs: 1000 },
    { scenario: 'Max size (200 nums, target 1000)', hint: '200 candidates per step: unmemoized recursion branches 200 ways at every level. Cache dp[x] for each amount x.', argsGen: '() => [Array.from({ length: 200 }, (_, i) => 200 + i), 1000]', expected: 1393399, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function combinationSum4(nums, target) {
  const dp = new Array(target + 1).fill(0);
  dp[0] = 1;                                 // one way to make 0: the empty sequence
  for (let x = 1; x <= target; x++) {        // amount OUTSIDE → order matters
    for (const n of nums) {                  // n = last element of the sequence
      if (n <= x) dp[x] += dp[x - n];
    }
  }
  return dp[target];
}`,
  },
  dryRun: {
    columns: ['x', 'last = 1', 'last = 2', 'last = 3', 'dp[x]'],
    rows: [
      ['1', 'dp[0] = 1', '—', '—', '1'],
      ['2', 'dp[1] = 1', 'dp[0] = 1', '—', '2'],
      ['3', 'dp[2] = 2', 'dp[1] = 1', 'dp[0] = 1', '4'],
      ['4', 'dp[3] = 4', 'dp[2] = 2', 'dp[1] = 1', '7'],
    ],
  },
  complexity: { time: 'O(target · k)', space: 'O(target)', explanation: 'target states × k numbers.' },
  alternative: {
    title: 'Memoized recursion',
    md: '`count(x)` = Σ count(x − n). Same recurrence top-down.',
    code: `function combinationSum4(nums, target) {
  const memo = new Map([[0, 1]]);
  const count = (x) => {
    if (x < 0) return 0;
    if (memo.has(x)) return memo.get(x);
    let total = 0;
    for (const n of nums) total += count(x - n);
    memo.set(x, total);
    return total;
  };
  return count(target);
}`,
    complexity: 'O(target · k) time, O(target) space',
  },
  mistakes: [
    'Looping nums outside — that counts unordered combinations (a different problem).',
    'dp[0] = 0 — then everything is 0.',
    'Unreachable intermediate amounts can hold huge counts on adversarial inputs (e.g. nums containing 1 with a large target); if the problem asked for a modulo you would apply it at every addition.',
  ],
};
