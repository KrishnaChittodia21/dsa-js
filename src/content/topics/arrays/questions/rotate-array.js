export default {
  id: 'rotate-array',
  title: 'Rotate Array',
  difficulty: 'Medium',
  order: 1,
  pattern: 'array-in-place-reversal',
  tags: ['array', 'in-place', 'reversal'],
  source: { platform: 'LeetCode', number: 189, url: 'https://leetcode.com/problems/rotate-array/' },

  statement: `Rotate the array \`nums\` to the **right** by \`k\` steps: every element moves k positions to the right, and elements that fall off the end wrap around to the front.

Modify \`nums\` **in place** — do not return anything. Try to use only O(1) extra space.`,
  examples: [
    { input: 'nums = [1,2,3,4,5,6,7], k = 3', output: '[5,6,7,1,2,3,4]' },
    { input: 'nums = [-1,-100,3,99], k = 2', output: '[3,99,-1,-100]' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1', '0 <= k <= 10^5'],

  think: `- Where does the element at index i end up?
- What does rotating by nums.length do? What about by nums.length + 3?
- Which in-place operation is easy to do with swaps?`,
  patternChallenge: {
    options: ['Sliding Window', 'Hash Map', 'In-place Rewrite & Reversal', 'Sort the array'],
    answer: 2,
    explanation: '"In place" + "rotate" is the classic triple-reversal trick: reversing segments with swaps needs O(1) extra space.',
  },
  hints: ['Only k % n matters.', 'Reverse the whole array, then reverse the first k elements, then reverse the rest.'],
  approach: `**Brute force:** rotate by one step k times (pop + unshift) → O(n·k).

**Extra array:** \`copy[i]\` goes to \`(i + k) % n\` → O(n) time, O(n) space.

**Optimized (in place):** rotation turns \`A B\` (A = first n − k, B = last k) into \`B A\`. Reverse all → \`rev(B) rev(A)\`; reverse each block → \`B A\`. Three reversals, each a loop of swaps → O(n) time, O(1) space.`,

  functionName: 'rotate',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * Do not return anything, modify nums in place.
 * @param {number[]} nums
 * @param {number} k
 * @return {void}
 */
function rotate(nums, k) {
  
}
`,
  io: { mutates: 0 },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: the last 3 elements move to the front.', args: [[1, 2, 3, 4, 5, 6, 7], 3], expected: [5, 6, 7, 1, 2, 3, 4] },
    { scenario: 'Example 2', hint: 'Negative values rotate like any other value. Remember to modify nums itself — assigning nums = result does not change the caller\'s array.', args: [[-1, -100, 3, 99], 2], expected: [3, 99, -1, -100] },
    { scenario: 'Rotate by one', hint: 'Rotating right by 1 moves the last element to the front; rotating left instead gives [2,3,4,5,6,1].', args: [[1, 2, 3, 4, 5, 6], 1], expected: [6, 1, 2, 3, 4, 5] },
    { scenario: 'Single element', hint: 'Any rotation of a single element leaves it unchanged; k % n is 0 here.', args: [[1], 5], expected: [1] },
    { scenario: 'k is zero', hint: 'No rotation at all — make sure k = 0 does not break your reverses.', args: [[1, 2], 0], expected: [1, 2] },
    { scenario: 'k equals n', hint: 'A full circle returns the original array.', args: [[1, 2, 3], 3], expected: [1, 2, 3] },
    { scenario: 'k larger than n', hint: 'Forgetting k %= n: rotating 3 elements by 4 is the same as rotating by 1.', args: [[1, 2, 3], 4], expected: [3, 1, 2] },
    { scenario: 'k much larger than n', hint: 'k = 100000 with n = 7: without k %= n your reverse indices go out of range.', args: [[1, 2, 3, 4, 5, 6, 7], 100000], expected: [3, 4, 5, 6, 7, 1, 2] },
    { scenario: 'k is n − 1', hint: 'Right by n − 1 equals left by 1; mixing up the direction gives the wrong array.', args: [[1, 2, 3, 4, 5, 6], 5], expected: [2, 3, 4, 5, 6, 1] },
    { scenario: 'Two elements', hint: 'Rotating two elements by one swaps them.', args: [[1, 2], 1], expected: [2, 1] },
    { scenario: 'Extreme 32-bit values', hint: 'Values at the 32-bit limits must be moved unchanged.', args: [[-2147483648, 0, 2147483647], 2], expected: [0, 2147483647, -2147483648] },
    { scenario: 'Duplicate values', hint: 'Duplicates make wrong rotations harder to spot — check each position.', args: [[1, 1, 2, 2, 3], 2], expected: [2, 3, 1, 1, 2] },
    { scenario: 'Large input (n = 10^5)', hint: 'Rotating one step at a time is O(n·k) — too slow. Use three reversals (or a copy) for O(n).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i % 10), 54321]', expectedGen: "() => { const [a, k] = (() => [Array.from({ length: 100000 }, (_, i) => i % 10), 54321])(); const n = a.length, out = new Array(n); for (let i = 0; i < n; i++) out[(i + k) % n] = a[i]; return out; }", timeLimitMs: 1000 },
  ],

  solution: {
    code: `function rotate(nums, k) {
  const n = nums.length;
  k %= n;                          // rotating by n is a full circle
  const reverse = (lo, hi) => {
    while (lo < hi) {
      const tmp = nums[lo];
      nums[lo] = nums[hi];
      nums[hi] = tmp;
      lo++;
      hi--;
    }
  };
  reverse(0, n - 1);   // [A B] → [rev(B) rev(A)]
  reverse(0, k - 1);   // → [B rev(A)]
  reverse(k, n - 1);   // → [B A]
}`,
  },
  dryRun: {
    columns: ['step', 'array'],
    rows: [['start (k = 3)', '[1,2,3,4,5,6,7]'], ['reverse 0..6', '[7,6,5,4,3,2,1]'], ['reverse 0..2', '[5,6,7,4,3,2,1]'], ['reverse 3..6', '[5,6,7,1,2,3,4]']],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each element is swapped at most twice; no extra array.' },
  alternative: {
    title: 'Copy with modular indexing',
    md: 'Place each element directly at (i + k) % n in a copy, then write back. Simpler to reason about, but O(n) extra space.',
    code: `function rotate(nums, k) {
  const n = nums.length, copy = nums.slice();
  for (let i = 0; i < n; i++) nums[(i + k) % n] = copy[i];
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Forgetting k %= n (k may exceed n)', 'Assigning `nums = result` — rebinding the parameter does not change the caller\'s array', 'Rotating left instead of right (reverse the first n − k instead of the first k)'],
};
