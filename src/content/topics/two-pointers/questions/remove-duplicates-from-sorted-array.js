export default {
  id: 'remove-duplicates-from-sorted-array',
  title: 'Remove Duplicates from Sorted Array',
  difficulty: 'Easy',
  order: 3,
  pattern: 'two-pointers-read-write',
  tags: ['array', 'two pointers', 'in place'],
  source: { platform: 'LeetCode', number: 26, url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/' },

  statement: `\`nums\` is sorted in non-decreasing order. Remove the duplicates **in place** so each distinct value appears once, keeping the values in their original order.

Return \`k\`, the number of distinct values. After the call, the first \`k\` elements of \`nums\` must hold the distinct values in order; whatever is left after index \`k - 1\` does not matter.

(The tests call your function and then check \`nums.slice(0, k)\`.)`,
  examples: [
    { input: 'nums = [1,1,2]', output: 'k = 2, nums = [1,2,_]' },
    { input: 'nums = [0,0,1,1,1,2,2,3,3,4]', output: 'k = 5, nums = [0,1,2,3,4,_,_,_,_,_]' },
  ],
  constraints: ['1 <= nums.length <= 3 * 10^4', '-100 <= nums[i] <= 100', 'nums is sorted in non-decreasing order'],

  think: `- Because the array is sorted, where do copies of the same value sit?
- To decide if \`nums[read]\` is new, what should you compare it with — the previous element you read, or the last element you *kept*?
- What is \`k\` in terms of your write pointer?`,
  patternChallenge: {
    options: ['Set, then copy back', 'Binary Search for each value', 'Two Pointers — Opposite Ends', 'Two Pointers — Read / Write'],
    answer: 3,
    explanation: '"In place", "return k", "first k elements" — the read/write compaction signature. A Set would work but uses O(n) memory and ignores sortedness.',
  },
  hints: [
    'The first element is always kept, so start with `write = 1`.',
    'For `read` from 1: if `nums[read] !== nums[write - 1]`, copy it to `nums[write]` and `write++`. Return `write`.',
  ],
  approach: `**With extra memory:** \`[...new Set(nums)]\` and copy back → O(n) space.

**Read/write:** sorted means duplicates are adjacent, so a value is new exactly when it differs from the last value we kept, \`nums[write - 1]\`.
- \`write = 1\`.
- For each \`read\`, if new → \`nums[write++] = nums[read]\`.
- Return \`write\`.

Invariant: \`nums[0..write-1]\` are the distinct values of \`nums[0..read-1]\`, in order.`,

  functionName: 'removeDuplicates',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number} k — the number of unique elements
 */
function removeDuplicates(nums) {
  
}
`,
  harness: `(target, args) => {
  const nums = args[0];
  const k = target(nums);
  return nums.slice(0, k);
}`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: k = 2 and the first two slots hold [1, 2].', args: [[1, 1, 2]], expected: [1, 2] },
    { scenario: 'Example 2', hint: 'Several runs of duplicates: write each new value to the next free slot.', args: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], expected: [0, 1, 2, 3, 4] },
    { scenario: 'Single element', hint: 'The smallest input: k = 1. Returning `write - 1` (an index) gives 0 and an empty slice.', args: [[1]], expected: [1] },
    { scenario: 'All duplicates', hint: 'One distinct value repeated: k must be 1.', args: [[7, 7, 7, 7]], expected: [7] },
    { scenario: 'No duplicates', hint: 'Every value is distinct, so k = n and nothing moves.', args: [[1, 2, 3]], expected: [1, 2, 3] },
    { scenario: 'Two distinct elements', hint: 'Two values at the extremes of the range, -100 and 100.', args: [[-100, 100]], expected: [-100, 100] },
    { scenario: 'Negatives and zeros', hint: 'Duplicates of negative numbers and of 0 are handled the same way.', args: [[-3, -3, -1, 0, 0, 5]], expected: [-3, -1, 0, 5] },
    { scenario: 'Duplicates at the end', hint: 'The last run is a duplicate run — the final distinct value must still be written once.', args: [[1, 2, 3, 3, 3]], expected: [1, 2, 3] },
    { scenario: 'Duplicates at the start', hint: 'The first run is long; the write pointer stays at 1 until a new value appears.', args: [[2, 2, 2, 2, 5, 6]], expected: [2, 5, 6] },
    { scenario: 'Count, not index', hint: 'k is a count. Returning the last write index (k - 1) drops the final distinct value.', args: [[1, 1, 2, 2, 3]], expected: [1, 2, 3] },
    { scenario: 'Large, one value (n = 3·10^4)', hint: '30 000 copies of the same value. The largest allowed input: k = 1. Deleting duplicates with `splice` would shift the array each time (O(n²)).', argsGen: '() => [new Array(30000).fill(42)]', expected: [42] },
    { scenario: 'Large, many runs (n = 3·10^4)', hint: 'Values -10..10, each repeated 1 500 times. One read/write pass handles it in O(n).', argsGen: '() => [Array.from({ length: 30000 }, (_, i) => Math.floor(i / 1500) - 10)]', expected: [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  ],

  solution: {
    code: `function removeDuplicates(nums) {
  let write = 1; // nums[0] is always kept
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}`,
  },
  dryRun: {
    columns: ['read', 'nums[read]', 'last kept', 'action', 'write'],
    rows: [
      ['1', '0', '0', 'dup', '1'],
      ['2', '1', '0', 'keep → nums[1]=1', '2'],
      ['3', '1', '1', 'dup', '2'],
      ['4', '1', '1', 'dup', '2'],
      ['5', '2', '1', 'keep → nums[2]=2', '3'],
      ['…', '…', '…', '…', '…'],
      ['9', '4', '3', 'keep → nums[4]=4', '5'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass, only two indices.' },
  alternative: {
    title: 'Generalised: keep at most k copies',
    md: 'Keep `nums[read]` if `write < k || nums[read] !== nums[write - k]`. With k = 1 it is this problem; with k = 2 it is "Remove Duplicates II".',
    code: `function removeDuplicates(nums, k = 1) {
  let write = 0;
  for (const x of nums) {
    if (write < k || x !== nums[write - k]) nums[write++] = x;
  }
  return write;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Returning `write - 1` (an index) instead of `write` (a count).',
    'Comparing with `nums[read - 1]` — it works here, but breaks in the "at most 2 copies" variant where earlier slots have been overwritten.',
    'Using `splice` to delete duplicates — O(n²).',
  ],
};
