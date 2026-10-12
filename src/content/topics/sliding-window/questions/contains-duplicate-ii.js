export default {
  id: 'contains-duplicate-ii',
  title: 'Contains Duplicate II',
  difficulty: 'Easy',
  order: 2,
  pattern: 'fixed-window',
  tags: ['array', 'hash set', 'sliding window'],
  source: { platform: 'LeetCode', number: 219, url: 'https://leetcode.com/problems/contains-duplicate-ii/' },

  statement: `You are given an integer array \`nums\` and an integer \`k\`.

Return \`true\` if there are two **different** indices \`i\` and \`j\` such that \`nums[i] === nums[j]\` and \`|i - j| <= k\`. Otherwise return \`false\`.

In other words: do two equal values ever sit **at most \`k\` positions apart**?`,
  examples: [
    { input: 'nums = [1,2,3,1], k = 3', output: 'true', explanation: 'nums[0] = nums[3] = 1 and 3 - 0 = 3 <= 3.' },
    { input: 'nums = [1,0,1,1], k = 1', output: 'true', explanation: 'nums[2] = nums[3] and they are 1 apart.' },
    { input: 'nums = [1,2,3,1,2,3], k = 2', output: 'false', explanation: 'Every pair of equal values is 3 apart.' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', '0 <= k <= 10^5'],

  think: `- For a fixed index \`j\`, which earlier indices \`i\` are "close enough"? How many of them are there at most?
- Those candidate indices form a range that moves one step every time \`j\` moves. What structure answers "is this value inside the range?" in O(1)?
- What should happen when \`k = 0\`?`,
  patternChallenge: {
    options: ['Sorting + Two Pointers', 'Sliding Window — Fixed Size (with a Set)', 'Prefix Sum', 'Binary Search'],
    answer: 1,
    explanation: '"At most k apart" means: when we stand at `j`, only the previous `k` elements matter. That is a window of size k that slides with `j`; a Set tells us in O(1) whether `nums[j]` is inside it. Sorting would destroy the index distances the problem is about.',
  },
  hints: [
    'Keep a Set containing only the last `k` values you have seen (the window behind the current index).',
    'At index `i`: if `nums[i]` is already in the Set → true. Otherwise add it, and if the Set now holds more than `k` values, delete `nums[i - k]` (the value that just fell out of range).',
  ],
  approach: `**Brute force:** for every \`i\`, compare with the next \`k\` elements → O(n·k), which is 10^10 in the worst case.

**Optimized (fixed window + Set):** the only indices that can pair with \`i\` are \`i-k … i-1\`. Keep exactly those values in a Set.
1. If \`nums[i]\` is in the Set, we found two equal values at most \`k\` apart → return \`true\`.
2. Add \`nums[i]\`.
3. If \`i >= k\`, remove \`nums[i - k]\` — it is now too far from any future index.

Why can a Set hold values (not counts)? If the window ever contained a duplicate, we would already have returned \`true\` — so values inside the window are always distinct.`,

  functionName: 'containsNearbyDuplicate',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {boolean}
 */
function containsNearbyDuplicate(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The two 1s are exactly k = 3 apart — "at most k" includes k itself.', args: [[1, 2, 3, 1], 3], expected: true },
    { scenario: 'Example 2', hint: 'Adjacent equal values (distance 1) with k = 1.', args: [[1, 0, 1, 1], 1], expected: true },
    { scenario: 'Example 3', hint: 'Every pair of equal values is 3 apart, one more than k = 2.', args: [[1, 2, 3, 1, 2, 3], 2], expected: false },
    { scenario: 'Single element', hint: 'One index cannot form a pair: false.', args: [[1], 5], expected: false },
    { scenario: 'k = 0', hint: 'Distance 0 means the same index, which is not allowed — always false.', args: [[1, 1, 1], 0], expected: false },
    { scenario: 'Distance exactly k + 1', hint: 'The 7s are k + 1 apart. Deleting `nums[i - k + 1]` or keeping one too many values lets them match.', args: [[7, 1, 2, 7], 2], expected: false },
    { scenario: 'Distance exactly k', hint: 'The 7s are exactly k apart. Deleting `nums[i - k]` too early misses this pair.', args: [[7, 1, 7], 2], expected: true },
    { scenario: 'Sorting destroys indices', hint: 'After sorting, the 5s would be adjacent — but in the original array they are 4 apart, more than k = 1.', args: [[5, 1, 2, 3, 5], 1], expected: false },
    { scenario: 'k larger than array', hint: 'k can exceed n; then any duplicate at all counts.', args: [[4, 9, 4], 100000], expected: true },
    { scenario: 'Negative and extreme values', hint: 'Values at ±10^9: a Set compares them exactly.', args: [[-1000000000, 1000000000, -1000000000], 2], expected: true },
    { scenario: 'No duplicates at all', hint: 'All values distinct: false whatever k is.', args: [[1, 2, 3, 4, 5], 4], expected: false },
    { scenario: 'Large, all distinct (n = 10^5)', hint: 'k = 10^5 and no duplicates: checking the next k values for each index is O(n·k) ≈ 5·10^9 steps. A sliding Set of the last k values is O(n).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i * 3 - 150000), 100000]', expected: false, timeLimitMs: 1000 },
    { scenario: 'Large, duplicates too far', hint: 'Every value repeats exactly k + 1 positions later — the window must evict values on time.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i % 1001), 1000]', expected: false },
  ],

  solution: {
    code: `function containsNearbyDuplicate(nums, k) {
  const window = new Set(); // values at indices i-k .. i-1
  for (let i = 0; i < nums.length; i++) {
    if (window.has(nums[i])) return true;
    window.add(nums[i]);
    if (i >= k) window.delete(nums[i - k]); // keep at most k values
  }
  return false;
}`,
    explanation: 'The deletion happens after adding, so when `k = 0` we add and immediately remove — the window stays empty and nothing can ever match, which is correct because `i` and `j` must differ.',
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'in window?', 'window after'],
    rows: [
      ['0', '1', 'no', '{1} (i < k, nothing leaves)'],
      ['1', '0', 'no', '{1, 0} (k=1 → delete nums[0]=1) → {0}'],
      ['2', '1', 'no', '{0, 1} → delete nums[1]=0 → {1}'],
      ['3', '1', 'yes → return true', '—'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(min(n, k))', explanation: 'Each index is added once and deleted once; the Set never holds more than k + 1 values.' },
  alternative: {
    title: 'Map of last index',
    md: 'Store `value → last index seen`. At `i`, if `lastIndex.get(nums[i])` exists and `i - last <= k`, return true; then overwrite with `i`. Same O(n) time, but the Map can grow to O(n) entries because nothing is ever removed.',
    code: `function containsNearbyDuplicate(nums, k) {
  const last = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (last.has(nums[i]) && i - last.get(nums[i]) <= k) return true;
    last.set(nums[i], i);
  }
  return false;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Deleting `nums[i - k - 1]` or `nums[i - k + 1]` — off-by-one lets pairs that are k + 1 apart match (or misses pairs exactly k apart).',
    'Sorting the array first — sorting destroys the indices the distance condition is about.',
    'Using a plain object as a set: keys become strings, which is fine for integers but slower and easy to misuse; prefer `Set`.',
  ],
};
