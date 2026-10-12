export default {
  id: 'longest-increasing-subsequence',
  title: 'Longest Increasing Subsequence',
  difficulty: 'Medium',
  order: 1,
  pattern: 'dp-adv-lis',
  tags: ['array', 'dynamic programming', 'binary search'],
  source: { platform: 'LeetCode', number: 300, url: 'https://leetcode.com/problems/longest-increasing-subsequence/' },

  statement: `Given an integer array \`nums\`, return the length of the longest **strictly increasing subsequence**.

A subsequence keeps some elements in their original order and may skip any others (they do not have to be neighbours).`,
  examples: [
    { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: 'One answer is [2,3,7,101].' },
    { input: 'nums = [0,1,0,3,2,3]', output: '4', explanation: '[0,1,2,3].' },
    { input: 'nums = [7,7,7,7]', output: '1', explanation: 'Strictly increasing — equal values do not count.' },
  ],
  constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4', 'Follow-up: O(n log n)'],

  think: `- To decide whether nums[i] can extend a subsequence, what do you need to know about that subsequence?
- Define dp[i] carefully: "best subsequence in nums[0..i]" or "best subsequence that ENDS at i"? Which one gives an easy transition?
- Among all increasing subsequences of the same length, which one is the most useful to keep?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'LIS DP / patience sorting with binary search', 'Kadane', 'Monotonic stack'],
    answer: 1,
    explanation: '"Subsequence" means gaps are allowed, so windows and Kadane (both contiguous) do not apply. A monotonic stack answers next-greater questions, not longest chains. The ends-at-i DP or the tails array is the standard LIS technique.',
  },
  hints: [
    'dp[i] = 1 + max(dp[j]) over j < i with nums[j] < nums[i]. That is O(n²) and already accepted.',
    'For O(n log n): keep tails[k] = smallest tail of any increasing subsequence of length k+1. For each x, binary-search the first tail ≥ x and replace it (or append).',
  ],
  approach: `**Brute force:** try including/excluding every element → O(2^n).

**DP O(n²):** \`dp[i]\` = LIS ending at i. For every j < i with \`nums[j] < nums[i]\`: \`dp[i] = max(dp[i], dp[j] + 1)\`. Answer = max(dp).

**Patience sorting O(n log n):** \`tails\` is sorted (a longer subsequence's tail is bigger than the best tail one step shorter). For each x, lower-bound it in \`tails\`: if it lands at the end, the LIS grows; otherwise replacing makes that length's tail smaller, which never hurts future extensions. Answer = \`tails.length\`.`,

  functionName: 'lengthOfLIS',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function lengthOfLIS(nums) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "One LIS is [2, 3, 7, 101] (length 4).", args: [[10,9,2,5,3,7,101,18]], expected: 4 },
    { scenario: "Example 2", hint: "[0, 1, 2, 3] — the duplicate 0 and 3 do not extend it.", args: [[0,1,0,3,2,3]], expected: 4 },
    { scenario: "Example 3", hint: "All equal: strictly increasing means length 1.", args: [[7,7,7,7]], expected: 1 },
    { scenario: "Single element", hint: "A single number is an increasing subsequence of length 1.", args: [[1]], expected: 1 },
    { scenario: "Strictly decreasing", hint: "No two elements increase — answer 1.", args: [[5,4,3,2,1]], expected: 1 },
    { scenario: "Already sorted", hint: "The whole array is the LIS.", args: [[1,2,3,4,5]], expected: 5 },
    { scenario: "Negative values", hint: "Values can be negative down to −10^4; do not initialise \"previous\" to 0 or −1.", args: [[-10000,-5,-7,-3,-10000,10000]], expected: 4 },
    { scenario: "LIS not at the end", hint: "The longest run ends at 4, not at the last element. Returning dp[n−1] instead of max(dp) gives 1.", args: [[1,2,3,4,0]], expected: 4 },
    { scenario: "Duplicates must not chain", hint: "Using upper bound (first > x) lets equal values extend the sequence — that is the non-decreasing length (6), not 3.", args: [[2,2,2,3,3,4]], expected: 3 },
    { scenario: "Tails are not the sequence", hint: "tails ends as [1, 3, 7] — but 1 comes after 7 in the input, so tails is not a real subsequence. Only its length (3) is the answer.", args: [[2,5,3,7,1]], expected: 3 },
    { scenario: "Long mixed sequence", hint: "A small replacement inside tails later enables a longer chain.", args: [[3,5,6,2,5,4,19,5,6,7,12]], expected: 6 },
    { scenario: "Large random (n = 2500)", hint: "Trying every subsequence is exponential. O(n²) DP is fine at this size; O(n log n) patience sorting is even faster.", argsGen: "() => { let s = 17; const a = []; for (let i = 0; i < 2500; i++) { s = (s * 16807) % 2147483647; a.push((s % 20001) - 10000); } return [a]; }", expected: 92, timeLimitMs: 1000 },
    { scenario: "Large sawtooth (n = 2500)", hint: "Fifty increasing runs that each restart lower — the answer is long, so exhaustive search explodes.", argsGen: "() => [Array.from({ length: 2500 }, (_, i) => (i % 50) * 200 - Math.floor(i / 50) * 3)]", expected: 50, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function lengthOfLIS(nums) {
  const tails = [];                 // tails[k] = smallest tail of an increasing subsequence of length k + 1
  for (const x of nums) {
    let lo = 0, hi = tails.length;  // first index with tails[idx] >= x
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = x;                  // lo === tails.length → extend; else improve a tail
  }
  return tails.length;
}`,
    explanation: 'Lower bound (first ≥ x) makes it strictly increasing: an equal value replaces rather than extends.',
  },
  dryRun: {
    columns: ['x', 'lower bound', 'tails'],
    rows: [['10', '0', '[10]'], ['9', '0', '[9]'], ['2', '0', '[2]'], ['5', '1', '[2,5]'], ['3', '1', '[2,3]'], ['7', '2', '[2,3,7]'], ['101', '3', '[2,3,7,101]'], ['18', '3', '[2,3,7,18]']],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'One binary search over tails (length ≤ n) per element.' },
  alternative: {
    title: 'O(n²) DP — ends at i',
    md: 'Simpler to derive and enough for n ≤ 2500.',
    code: `function lengthOfLIS(nums) {
  const dp = new Array(nums.length).fill(1);
  let best = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < i; j++) if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    best = Math.max(best, dp[i]);
  }
  return best;
}`,
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Returning dp[n−1] instead of max(dp) — the LIS need not end at the last element.',
    'Using upper bound (first > x) — that computes the longest NON-decreasing subsequence.',
    'Treating tails as the actual subsequence.',
  ],
};
