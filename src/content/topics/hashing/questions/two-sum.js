export default {
  id: 'two-sum',
  title: 'Two Sum',
  difficulty: 'Easy',
  order: 1,
  pattern: 'hash-complement-lookup',
  tags: ['array', 'hash map'],
  source: { platform: 'LeetCode', number: 1, url: 'https://leetcode.com/problems/two-sum/' },

  statement: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.

Exactly one valid pair exists, and you may not use the same element twice. Return the two indices in increasing order.`,
  examples: [
    { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9.' },
    { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    { input: 'nums = [3,3], target = 6', output: '[0,1]' },
  ],
  constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i], target <= 10^9', 'Exactly one valid answer exists'],

  think: `- For the current number x, which exact value would complete the pair?
- What do you need to remember about the numbers you have already passed?
- How do you stop a number from pairing with itself?`,
  patternChallenge: {
    options: ['Sliding Window', 'Binary Search', 'Hash Map (Complement Lookup)', 'Prefix Sum'],
    answer: 2,
    explanation: 'The partner of x is fully determined (target − x), and the array is unsorted: store earlier values in a Map and look the partner up in O(1). Binary search / two pointers would need sorting and would lose the original indices.',
  },
  hints: ['The partner of nums[i] is target − nums[i].', 'Keep a Map value → index of elements seen so far; check it before inserting nums[i].'],
  approach: `**Brute force:** check every pair (i, j) → O(n²).

**Sort + two pointers:** O(n log n), but sorting scrambles indices (you would need to sort index pairs).

**Optimized:** one pass with \`Map\` value → index. For each i: if \`target − nums[i]\` is in the map, return \`[map.get(...), i]\`; otherwise store \`nums[i] → i\`. Checking before storing prevents self-pairing, and handles duplicates like \`[3, 3]\`.`,

  functionName: 'twoSum',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 2 + 7 = 9 at indices 0 and 1.', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { scenario: 'Example 2', hint: 'target = 2·3, but 3 cannot pair with itself. Insert nums[i] into the Map only after checking, or you return [0, 0].', args: [[3, 2, 4], 6], expected: [1, 2] },
    { scenario: 'Example 3', hint: 'Two equal values form the pair: [0, 1].', args: [[3, 3], 6], expected: [0, 1] },
    { scenario: 'Pair at the ends', hint: 'The pair is the first and last element.', args: [[1, 5, 6, 9], 10], expected: [0, 3] },
    { scenario: 'Negative numbers', hint: 'Complements can be negative: -3 + -5 = -8.', args: [[-1, -3, 4, -5], -8], expected: [1, 3] },
    { scenario: 'Zero target', hint: 'Opposite numbers sum to 0; 0 itself is a valid complement key.', args: [[5, 0, -5, 7], 0], expected: [0, 2] },
    { scenario: 'Zero values', hint: 'Two zeros sum to 0 — check the Map with `has`, not truthiness, since index 0 is falsy.', args: [[0, 4, 0], 0], expected: [0, 2] },
    { scenario: 'Unsorted input', hint: 'Indices refer to the original array. Sorting and returning sorted positions gives wrong indices.', args: [[15, 11, 7, 2], 9], expected: [2, 3] },
    { scenario: 'Extreme values', hint: '10^9 + (-10^9) = 0: large magnitudes are exact in JS.', args: [[1000000000, 3, -1000000000], 0], expected: [0, 2] },
    { scenario: 'Pair in the middle', hint: 'Neither element is at an end; the complement is found when the second one is reached.', args: [[8, 1, 6, 3, 20], 7], expected: [1, 2] },
    { scenario: 'Duplicate non-answers', hint: 'Repeated values that are not part of the answer must not confuse the Map.', args: [[4, 4, 1, 6], 7], expected: [2, 3] },
    { scenario: 'Largest n (10^4)', hint: 'The pair is the last two elements of the largest allowed input. One pass with a Map is O(n); a double loop does ~5·10^7 checks.', argsGen: '() => { const a = Array.from({ length: 10000 }, (_, i) => i * 2 + 10); a[9998] = 1; a[9999] = 3; return [a, 4]; }', expected: [9998, 9999] },
  ],

  solution: {
    code: `function twoSum(nums, target) {
  const indexOf = new Map();            // value → index of an EARLIER element
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (indexOf.has(need)) return [indexOf.get(need), i];
    indexOf.set(nums[i], i);            // store after checking
  }
  return [];
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'need', 'map before', 'action'],
    rows: [['0', '3', '3', '{}', 'store 3→0'], ['1', '2', '4', '{3→0}', 'store 2→1'], ['2', '4', '2', '{3→0, 2→1}', 'found → [1, 2]']],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One pass; each Map operation is O(1) average; the map can hold up to n entries.' },
  alternative: {
    title: 'Sort indices + two pointers',
    md: 'Sort the indices by value, then move two pointers inward. O(n log n) time; useful when the input is already sorted (Two Sum II, next topic).',
    code: `function twoSum(nums, target) {
  const idx = nums.map((_, i) => i).sort((a, b) => nums[a] - nums[b]);
  let lo = 0, hi = idx.length - 1;
  while (lo < hi) {
    const s = nums[idx[lo]] + nums[idx[hi]];
    if (s === target) return [idx[lo], idx[hi]].sort((a, b) => a - b);
    if (s < target) lo++; else hi--;
  }
  return [];
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: ['Inserting nums[i] before checking (returns [i, i] when target = 2·nums[i])', 'Using indexOf inside the loop (still O(n²))', 'Sorting the array and returning indices of the sorted copy'],
};
