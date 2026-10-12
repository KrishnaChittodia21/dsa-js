export default {
  id: 'subarray-sum-equals-k',
  title: 'Subarray Sum Equals K',
  difficulty: 'Medium',
  order: 1,
  pattern: 'prefix-sum-hashmap',
  tags: ['array', 'hash map', 'prefix sum'],
  source: { platform: 'LeetCode', number: 560, url: 'https://leetcode.com/problems/subarray-sum-equals-k/' },

  statement: `Given an integer array \`nums\` (values may be **negative**) and an integer \`k\`, return the **number of contiguous, non-empty subarrays** whose sum equals \`k\`.`,
  examples: [
    { input: 'nums = [1,1,1], k = 2', output: '2', explanation: '[1,1] at indices 0-1 and 1-2.' },
    { input: 'nums = [1,2,3], k = 3', output: '2', explanation: '[1,2] and [3].' },
  ],
  constraints: ['1 <= nums.length <= 2 * 10^4', '-1000 <= nums[i] <= 1000', '-10^7 <= k <= 10^7'],

  think: `- Write the sum of \`nums[i..j]\` using prefix sums. What equation must hold?
- Standing at \`j\`, what value are you looking for among earlier prefixes? Does that remind you of Two Sum?
- Why is a sliding window unsafe here?
- Why might the same prefix value appear several times, and what does each occurrence mean?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'Two Pointers after sorting', 'Prefix Sum + HashMap (counts)', 'Binary Search'],
    answer: 2,
    explanation: 'Negatives break window monotonicity, and sorting destroys contiguity. `sum(i..j) = P[j] − P[i−1] = k` turns the problem into counting earlier prefixes equal to `P[j] − k` — a hash map of prefix counts.',
  },
  hints: [
    'Keep a running prefix `cur` and a Map from prefix value → how many times it has appeared. Seed it with `{0: 1}` for the empty prefix.',
    'At each element: `count += map.get(cur - k) ?? 0`, THEN increment `map[cur]`.',
  ],
  approach: `**Brute force:** fix a start, extend the end with a running sum → O(n²). With n = 2·10^4 that is 2·10^8 steps — borderline.

**Why not a sliding window?** With negatives, extending can lower the sum and shrinking can raise it, so there is no rule for which pointer to move.

**Prefix sum + hash map (O(n)):** subarray \`(i, j]\` has sum \`k\` ⇔ \`P_j − P_i = k\` ⇔ \`P_i = P_j − k\`. While scanning, a Map holds **how many times** each prefix value has occurred so far.
- **Counts, not a Set:** each earlier occurrence of \`P_j − k\` is a distinct start position.
- **\`map.set(0, 1)\`:** the empty prefix, so subarrays that start at index 0 are counted.
- **Look up before inserting:** otherwise, with \`k = 0\`, the current prefix would pair with itself (an empty subarray).`,

  functionName: 'subarraySum',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function subarraySum(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: two overlapping [1,1] windows.', args: [[1, 1, 1], 2], expected: 2 },
    { scenario: 'Example 2', hint: 'Counts both [1,2] and the single element [3].', args: [[1, 2, 3], 3], expected: 2 },
    { scenario: 'Single element, no match', hint: 'Smallest input with no valid subarray — the answer is 0, and an empty subarray must not count even though k = 0.', args: [[1], 0], expected: 0 },
    { scenario: 'Single element equals k', hint: 'If you forget to seed the map with prefix 0 → 1, subarrays starting at index 0 (like [5]) are missed.', args: [[5], 5], expected: 1 },
    { scenario: 'All zeros, k = 0', hint: 'Every one of the 6 subarrays sums to 0. A Set instead of a count map undercounts repeated prefixes.', args: [[0, 0, 0], 0], expected: 6 },
    { scenario: 'Zero target with cancellation', hint: 'Updating the map before the lookup pairs the current prefix with itself and overcounts when k = 0.', args: [[1, -1, 0], 0], expected: 3 },
    { scenario: 'Negative numbers', hint: 'Negatives break sliding-window logic — the window cannot decide whether to grow or shrink.', args: [[-1, -1, 1], 0], expected: 1 },
    { scenario: 'Negative target', hint: 'k can be negative; the prefix lookup works the same way.', args: [[-2, -1, 3, -3], -3], expected: 3 },
    { scenario: 'Repeated prefix values', hint: 'The same prefix appears many times; each occurrence is a different start position.', args: [[1, -1, 1, -1], 0], expected: 4 },
    { scenario: 'Whole array is the answer', hint: 'Only the full array sums to k — make sure your scan reaches the last index.', args: [[2, 3, 4], 9], expected: 1 },
    { scenario: 'No subarray matches', hint: 'Return 0 when no subarray works.', args: [[1, 2, 3], 7], expected: 0 },
    { scenario: 'Mixed signs, several matches', hint: 'Several overlapping subarrays hit k, some through negative values.', args: [[3, 4, 7, 2, -3, 1, 4, 2], 7], expected: 4 },
    { scenario: 'Large input (n = 2·10^4)', hint: 'An O(n²) double loop does ~2·10^8 steps here; the prefix-sum + hash map approach is O(n).', argsGen: '() => { let s = 7; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 20000 }, () => (r() % 2001) - 1000), 0]; }', expected: 3050, timeLimitMs: 100 },
  ],

  solution: {
    code: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]); // prefix value -> how many times seen; empty prefix once
  let cur = 0, count = 0;
  for (const x of nums) {
    cur += x;
    count += seen.get(cur - k) ?? 0;          // starts that make a sum-k subarray ending here
    seen.set(cur, (seen.get(cur) ?? 0) + 1);  // record AFTER the lookup
  }
  return count;
}`,
  },
  dryRun: {
    columns: ['x', 'cur', 'need cur − k', 'found', 'count', 'seen'],
    rows: [
      ['—', '0', '—', '—', '0', '{0:1}'],
      ['1', '1', '-1', '0', '0', '{0:1, 1:1}'],
      ['1', '2', '0', '1', '1', '{0:1, 1:1, 2:1}'],
      ['1', '3', '1', '1', '2', '{0:1, 1:1, 2:1, 3:1}'],
    ],
    note: 'nums = [1,1,1], k = 2.',
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One pass; each Map operation is O(1) on average. The Map can hold up to n + 1 distinct prefixes.' },
  alternative: {
    title: 'Brute force with running sums',
    md: 'For each start i, extend j and keep a running sum; count when it equals k. O(n²) time, O(1) space — say it first, then optimise.',
    code: `function subarraySum(nums, k) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      s += nums[j];
      if (s === k) count++;
    }
  }
  return count;
}`,
    complexity: 'O(n²) time, O(1) space',
  },
  mistakes: [
    'Forgetting `seen.set(0, 1)` → misses every subarray that starts at index 0 (e.g. [5], k = 5 returns 0).',
    'Updating the map before the lookup → overcounts when k = 0.',
    'Using a Set → undercounts when a prefix repeats ([0,0,0], k = 0 must be 6).',
    'Using a sliding window despite negative numbers.',
  ],
};
