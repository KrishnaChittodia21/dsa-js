export default {
  id: 'partition-to-k-equal-sum-subsets',
  title: 'Partition to K Equal Sum Subsets',
  difficulty: 'Medium',
  order: 8,
  pattern: 'dp-adv-bitmask',
  tags: ['array', 'bitmask', 'dynamic programming', 'backtracking'],
  source: { platform: 'LeetCode', number: 698, url: 'https://leetcode.com/problems/partition-to-k-equal-sum-subsets/' },

  statement: `Given an integer array \`nums\` and an integer \`k\`, decide whether \`nums\` can be split into \`k\` non-empty groups whose sums are all equal. Every element must be used exactly once.`,
  examples: [
    { input: 'nums = [4,3,2,3,5,2,1], k = 4', output: 'true', explanation: '(5), (1,4), (2,3), (2,3).' },
    { input: 'nums = [1,2,3,4], k = 3', output: 'false', explanation: 'Sum 10 is not divisible by 3.' },
  ],
  constraints: ['1 <= k <= nums.length <= 16', '1 <= nums[i] <= 10^4', 'Each value appears at most 4 times'],

  think: `- n ≤ 16 is a strong hint. How many subsets of 16 items are there?
- If you fill buckets one after another, what is the only thing you need to know about the current bucket?
- Given the set of used items, is the current bucket's fill level already determined?`,
  patternChallenge: {
    options: ['Greedy: sort descending and put each number in the emptiest bucket', 'Bitmask DP over used items', 'Sliding window', 'Two pointers after sorting'],
    answer: 1,
    explanation: 'n ≤ 16 → 2^16 = 65,536 masks. The fill level of the current bucket equals sum(mask) % target, so dp[mask] is a single value. The greedy "emptiest bucket" heuristic fails: for [3,3,2,2,2], k = 2 (target 6) it puts the 3s in different buckets and gets stuck, although {3,3} and {2,2,2} works. Windows and two pointers need contiguity/sortedness that a partition does not have.',
  },
  hints: [
    'Return false early if total % k !== 0 or any number > target.',
    'dp[mask] = fill of the current bucket after using the items in mask, or −1 if unreachable. From a reachable mask, add item i if dp[mask] + nums[i] ≤ target; new fill = (dp[mask] + nums[i]) % target. Answer: dp[full] === 0.',
  ],
  approach: `**Backtracking:** place each number into one of k buckets → O(k^n), with pruning often fine but worst-case slow.

**Bitmask DP (O(n · 2^n)):**
1. \`target = total / k\` (must be an integer, and max(nums) ≤ target).
2. \`dp[0] = 0\`, others −1.
3. For masks in increasing order (adding a bit always makes the mask larger), try every unused i that fits in the current bucket.
4. \`dp[full] === 0\` ⇔ all buckets were filled exactly.

Why one number per mask suffices: buckets are filled in order, so all previous buckets are exactly full — the current level is forced to be sum(mask) mod target.`,

  functionName: 'canPartitionKSubsets',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {boolean}
 */
function canPartitionKSubsets(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: (5), (1,4), (2,3), (2,3).', args: [[4,3,2,3,5,2,1],4], expected: true },
    { scenario: 'Example 2', hint: 'Sum 10 is not divisible by 3 — check total % k first.', args: [[1,2,3,4],3], expected: false },
    { scenario: 'Single element, k = 1', hint: 'k = 1: the whole array is one group.', args: [[5],1], expected: true },
    { scenario: 'k equals n', hint: 'Each element is its own group, so all values must be equal.', args: [[1,1,1,1],4], expected: true },
    { scenario: 'k = n, unequal values', hint: 'With k = n each group is one element; different values make it impossible (here even the sum fails).', args: [[1,1,2,2],4], expected: false },
    { scenario: 'Element exceeds target', hint: 'Forgetting the max > target check: 5 alone exceeds the target 4 (sum 16 / 4).', args: [[2,2,2,2,3,4,5],4], expected: false },
    { scenario: 'Divisible but impossible', hint: 'Sum 16 / 2 = 8 and every value fits, yet no group of 5s and a 1 makes 8: divisibility is necessary, not sufficient.', args: [[5,5,5,1],2], expected: false },
    { scenario: 'Mixed group sizes', hint: '(3, 3) and (2, 2, 2): groups do not need the same number of elements.', args: [[3,3,2,2,2],2], expected: true },
    { scenario: 'Leftover cannot fit', hint: 'Target 8: each 6 needs a 2, but only 4s remain. A greedy fill fails; the search must prove no combination works.', args: [[6,6,6,6,4,4],4], expected: false },
    { scenario: 'Duplicates pair up', hint: 'Four groups of (1, 2).', args: [[1,1,1,1,2,2,2,2],4], expected: true },
    { scenario: 'Bigger values', hint: 'Three groups of 31 from repeated 10s, 7s and 6s.', args: [[10,10,10,7,7,7,7,7,7,6,6,6],3], expected: true },
    { scenario: 'Max values 10^4', hint: 'Large values do not matter for a bitmask DP — only n does.', args: [[10000,10000,10000,10000,9999,9999,9999,9999,1,1,1,1],4], expected: true },
    { scenario: 'n = 16, possible', hint: '1..16 into four groups of 34.', args: [[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],4], expected: true, timeLimitMs: 1000 },
    { scenario: 'n = 16, hard "false"', hint: 'Sum divides by 6 but no partition exists. Plain bucket backtracking tries ~6^16 assignments; memoise on the used-mask (2^16 states).', args: [[3,3,10,2,6,5,10,6,8,3,2,1,6,10,7,2],6], expected: false, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function canPartitionKSubsets(nums, k) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % k !== 0) return false;
  const target = total / k;
  if (Math.max(...nums) > target) return false;

  const n = nums.length;
  const FULL = (1 << n) - 1;
  const dp = new Int32Array(1 << n).fill(-1);   // fill level of the current bucket
  dp[0] = 0;

  for (let mask = 0; mask <= FULL; mask++) {
    if (dp[mask] === -1) continue;
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) continue;    // item already used
      const next = mask | (1 << i);
      if (dp[next] !== -1) continue;            // already reached another way
      if (dp[mask] + nums[i] <= target) {
        dp[next] = (dp[mask] + nums[i]) % target; // a full bucket resets to 0
      }
    }
  }
  return dp[FULL] === 0;
}`,
    explanation: 'Int32Array is compact and fast for 65,536 entries. Parentheses around `mask & (1 << i)` are essential — `===`/`!==` bind tighter than `&`.',
  },
  dryRun: {
    columns: ['mask (used)', 'dp', 'meaning'],
    rows: [['{}', '0', 'empty bucket'], ['{5}', '0', '5 = target → bucket closed'], ['{5,4}', '4', 'current bucket holds 4'], ['{5,4,1}', '0', 'closed again'], ['… full', '0', 'true']],
  },
  complexity: { time: 'O(n · 2^n)', space: 'O(2^n)', explanation: '65,536 masks × 16 items ≈ 10^6 steps.' },
  alternative: {
    title: 'Backtracking with pruning',
    md: 'Sort descending, fill one bucket at a time, skip duplicates of a value that just failed, and stop when a bucket fails while empty. Fast in practice.',
    code: `function canPartitionKSubsets(nums, k) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % k) return false;
  const target = total / k;
  nums = [...nums].sort((a, b) => b - a);
  if (nums[0] > target) return false;
  const used = new Array(nums.length).fill(false);
  function fill(bucketsLeft, start, cur) {
    if (bucketsLeft === 0) return true;
    if (cur === target) return fill(bucketsLeft - 1, 0, 0);
    for (let i = start; i < nums.length; i++) {
      if (used[i] || cur + nums[i] > target) continue;
      if (i > 0 && !used[i - 1] && nums[i] === nums[i - 1]) continue; // same value just failed
      used[i] = true;
      if (fill(bucketsLeft, i + 1, cur + nums[i])) return true;
      used[i] = false;
      if (cur === 0) return false;   // could not even start this bucket
    }
    return false;
  }
  return fill(k, 0, 0);
}`,
    complexity: 'O(k · 2^n) worst case, usually far less',
  },
  mistakes: [
    'Forgetting the total % k and max > target checks.',
    'Writing `mask & 1 << i === 0` (precedence bug).',
    'Storing full bucket lists in the state instead of just the current level.',
  ],
};
