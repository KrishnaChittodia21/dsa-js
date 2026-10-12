export default {
  id: 'maximum-sum-of-3-non-overlapping-subarrays',
  title: 'Maximum Sum of 3 Non-Overlapping Subarrays',
  difficulty: 'Hard',
  order: 2,
  pattern: 'prefix-sum-1d',
  tags: ['array', 'prefix sum', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 689, url: 'https://leetcode.com/problems/maximum-sum-of-3-non-overlapping-subarrays/' },

  statement: `Given an array of positive integers \`nums\` and an integer \`k\`, choose **three non-overlapping subarrays**, each of length exactly \`k\`, so that their total sum is as large as possible.

Return the three **starting indices** in increasing order. If several answers have the same maximum sum, return the **lexicographically smallest** list of indices.`,
  examples: [
    { input: 'nums = [1,2,1,2,6,7,5,1], k = 2', output: '[0,3,5]', explanation: 'Blocks [1,2], [2,6], [7,5] sum to 23. [1,3,5] also gives 23 but [0,3,5] is lexicographically smaller.' },
    { input: 'nums = [1,2,1,2,1,2,1,2,1], k = 2', output: '[0,2,4]' },
  ],
  constraints: ['1 <= nums.length <= 2 * 10^4', '1 <= nums[i] < 2^16', '1 <= k <= floor(nums.length / 3)'],

  think: `- How can you get the sum of the length-k block starting at any index \`i\` in O(1)?
- Suppose you fix the **middle** block at index \`j\`. What do you need to know about the left part \`[0, j − k]\` and the right part \`[j + k, …]\`?
- Can you precompute "best block start at or before i" and "best block start at or after i" in one pass each? Which way should ties break to get the lexicographically smallest answer?`,
  patternChallenge: {
    options: ['Prefix sums of block sums + best-left / best-right arrays', 'Greedy: take the three largest blocks', 'Sliding Window — Variable Size', 'Backtracking over all triples'],
    answer: 0,
    explanation: 'Block sums come from a prefix array in O(1). Fixing the middle block and combining the best block on the left with the best on the right is O(n) with two precomputed arrays. Greedy fails because the three largest blocks may overlap; triples are O(n³).',
  },
  hints: [
    'Compute `w[i]` = sum of `nums[i .. i+k-1]` for every valid i, using prefix sums (or a fixed sliding window).',
    'Build `left[i]` = index of the best `w` in `[0, i]` (update only on strictly greater, so earlier indices win ties) and `right[i]` = index of the best `w` in `[i, end]` (update on greater-or-equal while scanning backwards, so earlier indices win ties). Then try every middle `j` from `k` to `len − 2k`.',
  ],
  approach: `**Brute force:** all triples of block starts → O(n³).

**Prefix sums + best-left/right (O(n)):**
1. \`prefix\` of nums; \`w[i] = prefix[i + k] − prefix[i]\` for \`i = 0 … n − k\` (the block starting at i).
2. \`left[i]\` = start of the best block within \`w[0..i]\`. Scan forwards; replace only when \`w[i] > w[best]\` — ties keep the **earlier** index.
3. \`right[i]\` = start of the best block within \`w[i..]\`. Scan backwards; replace when \`w[i] >= w[best]\` — ties move to the **earlier** index.
4. For every middle start \`j\` in \`[k, n − 2k]\`: \`a = left[j − k]\`, \`c = right[j + k]\`; total = \`w[a] + w[j] + w[c]\`. Keep the first strictly better total (scanning j ascending keeps the lexicographically smallest).

The middle-block framing guarantees non-overlap: the left block ends before \`j\`, the right block starts at or after \`j + k\`.`,

  functionName: 'maxSumOfThreeSubarrays',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function maxSumOfThreeSubarrays(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[1,3,5] also sums to 23, but [0,3,5] is lexicographically smaller.', args: [[1, 2, 1, 2, 6, 7, 5, 1], 2], expected: [0, 3, 5] },
    { scenario: 'Example 2', hint: 'Many equal-sum choices — return the earliest starts.', args: [[1, 2, 1, 2, 1, 2, 1, 2, 1], 2], expected: [0, 2, 4] },
    { scenario: 'Minimum size, k = 1', hint: 'n = 3k exactly: the only choice is [0,1,2].', args: [[1, 1, 1], 1], expected: [0, 1, 2] },
    { scenario: 'n = 3k with k > 1', hint: 'Blocks must tile the array exactly: the middle block can only start at k.', args: [[5, 1, 2, 9, 3, 3], 2], expected: [0, 2, 4] },
    { scenario: 'All equal values', hint: 'Every triple ties; ties must resolve to the smallest indices.', args: [[1, 1, 1, 1, 1, 1], 2], expected: [0, 2, 4] },
    { scenario: 'Largest block not in the answer', hint: 'Greedily taking the single largest block (9+9 at 2) blocks better neighbours.', args: [[8, 8, 9, 9, 8, 8, 1, 1], 2], expected: [0, 2, 4] },
    { scenario: 'Decreasing values', hint: 'The best blocks are at the start.', args: [[9, 8, 7, 6, 5, 4, 3], 2], expected: [0, 2, 4] },
    { scenario: 'Increasing values', hint: 'The best blocks are the last three — answer at the end.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9], 1], expected: [6, 7, 8] },
    { scenario: 'Tie on the right block', hint: 'Two right blocks tie; the backward scan must keep the earliest (use >= when scanning right-to-left).', args: [[3, 3, 3, 1, 5, 5, 1], 1], expected: [0, 4, 5] },
    { scenario: 'Tie on the left block', hint: 'Two left blocks tie; the forward scan must use > so the earlier start wins.', args: [[4, 5, 10, 6, 11, 17, 4, 11, 1, 3], 1], expected: [4, 5, 7] },
    { scenario: 'Larger k', hint: 'Blocks of length 3 placed around a dip.', args: [[7, 13, 20, 19, 19, 2, 10, 1, 1, 19], 3], expected: [1, 4, 7] },
    { scenario: 'Middle block bounds', hint: 'The middle block must start between k and n - 2k, or the side blocks overlap or fall off the array.', args: [[1, 1, 9, 9, 1, 1, 9, 9], 2], expected: [0, 2, 6] },
    { scenario: 'Large random input (n = 2·10^4)', hint: 'Trying every triple of block starts is O(n³); prefix sums with best-left / best-right arrays are O(n).', argsGen: '() => { let s = 23; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 20000 }, () => 1 + (r() % 65535)), 50]; }', expected: [1181, 3148, 15770], timeLimitMs: 300 },
    { scenario: 'Large periodic input, many ties', hint: 'Lots of equal block sums — the lexicographic tie-breaking must hold at scale.', argsGen: '() => [Array.from({ length: 20000 }, (_, i) => 1 + (i % 7)), 1000]', expected: [1, 1002, 2003], timeLimitMs: 300 },
  ],

  solution: {
    code: `function maxSumOfThreeSubarrays(nums, k) {
  const n = nums.length;
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];

  const m = n - k + 1;                    // number of possible block starts
  const w = new Array(m);
  for (let i = 0; i < m; i++) w[i] = prefix[i + k] - prefix[i];

  // left[i]: start of the best block in w[0..i] (earliest on ties)
  const left = new Array(m);
  let best = 0;
  for (let i = 0; i < m; i++) {
    if (w[i] > w[best]) best = i;
    left[i] = best;
  }
  // right[i]: start of the best block in w[i..m-1] (earliest on ties)
  const right = new Array(m);
  best = m - 1;
  for (let i = m - 1; i >= 0; i--) {
    if (w[i] >= w[best]) best = i;
    right[i] = best;
  }

  let answer = null, bestTotal = -Infinity;
  for (let j = k; j + k < m; j++) {       // middle block start
    const a = left[j - k], c = right[j + k];
    const total = w[a] + w[j] + w[c];
    if (total > bestTotal) {              // strictly better only → keeps smallest indices
      bestTotal = total;
      answer = [a, j, c];
    }
  }
  return answer;
}`,
    explanation: 'The tie rules are the whole difficulty: forward scan uses `>` and backward scan uses `>=` so that both helper arrays prefer earlier indices, and the outer loop only replaces on a strictly larger total.',
  },
  dryRun: {
    columns: ['i', 'w[i] (k = 2)', 'left[i]', 'right[i]'],
    rows: [
      ['0', '3', '0', '4'],
      ['1', '3', '0', '4'],
      ['2', '3', '0', '4'],
      ['3', '8', '3', '4'],
      ['4', '13', '4', '4'],
      ['5', '12', '4', '5'],
      ['6', '6', '4', '6'],
    ],
    note: 'nums = [1,2,1,2,6,7,5,1]. Middle j = 3: left[1] = 0, right[5] = 5 → 3 + 8 + 12 = 23 → [0,3,5]. j = 4 would need right[6] = 6 → 3 + 13 + 6 = 22.',
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'A constant number of linear passes; the prefix, w, left and right arrays are O(n).' },
  alternative: {
    title: 'DP over "number of blocks used"',
    md: '`dp[t][i]` = best sum using t blocks within the first i elements; transition: skip index i−1, or end a block at i−1 (`dp[t−1][i−k] + w[i−k]`). Reconstruct indices backwards with careful tie-breaking. Generalises to m blocks: O(m · n).',
    complexity: 'O(3 · n) time, O(3 · n) space',
  },
  mistakes: [
    'Greedily picking the largest block first — the best three may not include it.',
    'Wrong tie-breaking (using `>=` in the forward scan picks later indices and breaks the lexicographic rule).',
    'Letting the middle block start before `k` or after `n − 2k`, so the side blocks overlap or fall off the array.',
  ],
};
