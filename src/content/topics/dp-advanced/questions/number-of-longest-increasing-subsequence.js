export default {
  id: 'number-of-longest-increasing-subsequence',
  title: 'Number of Longest Increasing Subsequence',
  difficulty: 'Medium',
  order: 7,
  pattern: 'dp-adv-lis',
  tags: ['array', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 673, url: 'https://leetcode.com/problems/number-of-longest-increasing-subsequence/' },

  statement: `Given an integer array \`nums\`, return **how many** longest strictly increasing subsequences it has.

Two subsequences are different if they use different index sets (even if the values are the same).`,
  examples: [
    { input: 'nums = [1,3,5,4,7]', output: '2', explanation: '[1,3,4,7] and [1,3,5,7].' },
    { input: 'nums = [2,2,2,2,2]', output: '5', explanation: 'The LIS has length 1 and there are 5 of them.' },
  ],
  constraints: ['1 <= nums.length <= 2000', '-10^6 <= nums[i] <= 10^6', 'The answer fits in a 32-bit integer'],

  think: `- You already know len[i] = LIS length ending at i. What extra number per index lets you count?
- When j extends to i, when do you REPLACE the count and when do you ADD to it?
- At the end, which indices contribute to the answer?`,
  patternChallenge: {
    options: ['Backtracking over all subsequences', 'LIS DP with length + count arrays', 'Sliding window', 'Patience sorting alone (tails array)'],
    answer: 1,
    explanation: 'The count needs, for each index, how many best subsequences end there — a second DP array alongside the length. Plain patience sorting gives the length but loses counts; backtracking is exponential.',
  },
  hints: [
    'len[i] = LIS length ending at i, cnt[i] = number of such subsequences. Initialise both to 1.',
    'For j < i with nums[j] < nums[i]: if len[j] + 1 > len[i], set len[i] = len[j] + 1 and cnt[i] = cnt[j]; if equal, cnt[i] += cnt[j]. Sum cnt[i] over all i with len[i] = max.',
  ],
  approach: `**Brute force:** enumerate all subsequences → O(2^n).

**Length + count DP (O(n²)):**
- \`len[i]\`, \`cnt[i]\` as in the hints.
- A strictly better length resets the count (older, shorter ways are no longer "longest ending at i").
- An equal length adds another family of ways.
- Answer: \`Σ cnt[i]\` for every i with \`len[i] === maxLen\` (the LIS may end at several indices).`,

  functionName: 'findNumberOfLIS',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findNumberOfLIS(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: [1,3,4,7] and [1,3,5,7].', args: [[1,3,5,4,7]], expected: 2 },
    { scenario: 'Example 2', hint: 'All equal: the LIS has length 1 and each of the 5 elements is one.', args: [[2,2,2,2,2]], expected: 5 },
    { scenario: 'Single element', hint: 'One element → one LIS of length 1.', args: [[1]], expected: 1 },
    { scenario: 'Two branches merge', hint: 'Counts from several predecessors with the same length must be added together.', args: [[1,2,4,3,5,4,7,2]], expected: 3 },
    { scenario: 'Strictly decreasing', hint: 'Every single element is an LIS of length 1.', args: [[5,4,3]], expected: 3 },
    { scenario: 'Strictly increasing', hint: 'Exactly one LIS: the whole array.', args: [[1,2,3]], expected: 1 },
    { scenario: 'Equal values not increasing', hint: 'Using ≤ instead of < counts [1,1] as increasing. Strictly increasing → length 2, four ways.', args: [[1,1,2,2]], expected: 4 },
    { scenario: 'LIS ends before last index', hint: 'Returning cnt at the last index only is wrong — the LIS can end anywhere. Sum the counts of all indices with the max length.', args: [[1,2,3,0]], expected: 1 },
    { scenario: 'Longer length resets count', hint: 'Adding counts when a strictly longer length is found overcounts — reset the count instead.', args: [[3,1,2]], expected: 1 },
    { scenario: 'Alternating values', hint: '[1,2,1,2,1,2]: pairs (1 before 2) — 6 of them.', args: [[1,2,1,2,1,2]], expected: 6 },
    { scenario: 'Negative values', hint: 'Values can be negative down to −10^6.', args: [[-1000000,-5,-5,0,1000000,-1000000]], expected: 2 },
    { scenario: 'Large: 20 swaps (n = 2000)', hint: 'An increasing run with 20 swapped neighbour pairs → 2^20 LIS. Enumerating subsequences is exponential; the O(n²) length+count DP is 4·10^6 steps.', argsGen: "() => { const a = Array.from({ length: 2000 }, (_, i) => i); for (let k = 0; k < 20; k++) { const p = 50 + k * 97; [a[p], a[p + 1]] = [a[p + 1], a[p]]; } return [a]; }", expected: 1048576, timeLimitMs: 1000 },
    { scenario: 'Large all equal (n = 2000)', hint: '2000 equal values: 2000 LIS of length 1.', argsGen: "() => [Array(2000).fill(7)]", expected: 2000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findNumberOfLIS(nums) {
  const n = nums.length;
  const len = new Array(n).fill(1);   // LIS length ending at i
  const cnt = new Array(n).fill(1);   // how many of them
  let maxLen = 1;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] >= nums[i]) continue;
      if (len[j] + 1 > len[i]) {        // found a longer way → reset the count
        len[i] = len[j] + 1;
        cnt[i] = cnt[j];
      } else if (len[j] + 1 === len[i]) { // another way of the same best length
        cnt[i] += cnt[j];
      }
    }
    maxLen = Math.max(maxLen, len[i]);
  }

  let total = 0;
  for (let i = 0; i < n; i++) if (len[i] === maxLen) total += cnt[i];
  return total;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'len', 'cnt', 'note'],
    rows: [['0', '1', '1', '1', ''], ['1', '3', '2', '1', 'from 1'], ['2', '5', '3', '1', 'from 3'], ['3', '4', '3', '1', 'from 3'], ['4', '7', '4', '2', 'from 5 (cnt 1) and 4 (cnt 1)']],
  },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'Double loop over pairs; two arrays of length n.' },
  alternative: {
    title: 'O(n log n) with Fenwick/segment trees',
    md: 'Coordinate-compress values; a segment tree over values stores (bestLen, count) and supports "best among values < x" queries. You will meet these structures in the Advanced Structures topic.',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Adding counts when a strictly longer length is found (should reset).',
    'Returning cnt at the last index only.',
    'Using ≤ instead of < (the subsequence must be strictly increasing).',
  ],
};
