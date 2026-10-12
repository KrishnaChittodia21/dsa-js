export default {
  id: 'top-k-frequent-elements',
  title: 'Top K Frequent Elements',
  difficulty: 'Medium',
  order: 2,
  pattern: 'heap-top-k',
  tags: ['heap', 'hash map', 'bucket sort'],
  source: { platform: 'LeetCode', number: 347, url: 'https://leetcode.com/problems/top-k-frequent-elements/' },

  statement: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\` values that occur **most often**. The answer is guaranteed to be unique; you may return it in any order.

Aim for better than O(n log n).`,
  examples: [
    { input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' },
    { input: 'nums = [1], k = 1', output: '[1]' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', 'k is between 1 and the number of distinct values', 'The answer is unique'],

  think: `- First, how do you know each value's frequency?
- Then it is a "top k by frequency" question. Which heap, and of what size?
- Frequencies are between 1 and n. Could you avoid comparisons altogether?`,
  patternChallenge: {
    options: ['Sliding Window', 'Heap — Two Heaps', 'Heap — Top K / Kth Element (on counts)', 'Heap — K-way Merge'],
    answer: 2,
    explanation: 'Count with a Map, then select the k entries with the largest count — a size-k min-heap keyed by count (or bucket sort). There are no windows, medians or sorted sources to merge.',
  },
  hints: [
    'Build a Map value → count.',
    'Push [value, count] into a min-heap keyed by count; pop when size > k. The remaining values are the answer.',
  ],
  approach: `**Brute force:** count, then sort the distinct values by count descending → O(n + d log d), d = distinct values.

**Heap (O(n + d log k)):** count with a Map; keep a size-k min-heap keyed by count, so the least frequent of the current top-k is evicted.

**Bucket sort (O(n)):** \`buckets[c]\` = list of values with count c (c ≤ n). Walk c from n down to 1 collecting values until you have k.`,

  functionName: 'topKFrequent',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function topKFrequent(nums, k) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: 1 appears 3 times, 2 twice.', args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
    { scenario: 'Example 2', hint: 'A single element is its own top-1.', args: [[1], 1], expected: [1] },
    { scenario: 'Negative values', hint: 'Negative numbers must stay numbers; object keys would turn them into strings.', args: [[4, 1, -1, 2, -1, 2, 3], 2], expected: [-1, 2] },
    { scenario: 'k equals distinct count', hint: 'Return every distinct value.', args: [[1, 2], 2], expected: [1, 2] },
    { scenario: 'k = 1', hint: 'Only the most frequent value.', args: [[5, 5, 5, 6, 6, 7, 7, 7, 7], 1], expected: [7] },
    { scenario: 'Zero as a value', hint: '0 is a valid value — a falsy check on the key would drop it.', args: [[3, 0, 1, 0], 1], expected: [0] },
    { scenario: 'Return values, not counts', hint: 'Push [value, count] pairs; returning counts gives [3, 2] instead of the values.', args: [[7, 7, 7, 9, 9, 4], 2], expected: [7, 9] },
    { scenario: 'Extreme values', hint: 'Values at -10^4 and 10^4.', args: [[-10000, 10000, 10000, -10000, -10000, 0], 2], expected: [-10000, 10000] },
    { scenario: 'Most frequent at the end', hint: 'The answer is the last value of the array.', args: [[1, 2, 3, 4, 4, 4, 4], 1], expected: [4] },
    { scenario: 'Large k on small array', hint: 'k = 3 of 3 distinct values with different counts.', args: [[5, 5, 5, 6, 6, 7, 7, 7, 7], 3], expected: [5, 6, 7] },
    { scenario: 'Large input (n = 10^5)', hint: '10^5 numbers over ~20000 distinct values: a size-k heap or bucket sort avoids sorting more than needed.', argsGen: '() => { const a = []; for (let v = -10000; v <= 10000 && a.length < 100000; v++) { const c = v % 1000 === 0 ? 50 + (v + 10000) / 1000 : 4 + (Math.abs(v) % 3); for (let j = 0; j < c && a.length < 100000; j++) a.push(v); } return [a, 10]; }', expected: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000] },
  ],

  solution: {
    code: `function topKFrequent(nums, k) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) ?? 0) + 1);

  const heap = new MinHeap((e) => e[1]);   // [value, count], least frequent on top
  for (const entry of count) {
    heap.push(entry);
    if (heap.size() > k) heap.pop();
  }
  return heap.toArray().map((e) => e[0]);
}`,
    explanation: 'Iterating a Map yields [key, value] pairs, which are exactly the entries we push.',
  },
  dryRun: {
    columns: ['entry', 'heap after (k = 2)'],
    rows: [['[1, 3]', '{[1,3]}'], ['[2, 2]', '{[2,2], [1,3]}'], ['[3, 1]', '{[2,2], [1,3]} ([3,1] evicted)']],
  },
  complexity: { time: 'O(n + d log k)', space: 'O(d)', explanation: 'Counting is O(n); d distinct entries pass through a heap of size ≤ k + 1. The Map holds d entries.' },
  alternative: {
    title: 'Bucket sort by frequency — O(n)',
    code: `function topKFrequent(nums, k) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) ?? 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [v, c] of count) buckets[c].push(v);
  const out = [];
  for (let c = nums.length; c > 0 && out.length < k; c--) out.push(...buckets[c]);
  return out.slice(0, k);
}`,
    md: 'Works because a frequency can never exceed n.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Using a max-heap of all entries and popping k times — fine, but O(d log d) worst case.',
    'Pushing raw values into the heap instead of [value, count] pairs.',
    'Object keys turn numbers into strings — use a Map.',
  ],
};
