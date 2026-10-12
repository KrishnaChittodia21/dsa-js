export default {
  id: 'max-consecutive-ones-iii',
  title: 'Max Consecutive Ones III',
  difficulty: 'Medium',
  order: 2,
  pattern: 'variable-window',
  tags: ['array', 'binary array', 'sliding window'],
  source: { platform: 'LeetCode', number: 1004, url: 'https://leetcode.com/problems/max-consecutive-ones-iii/' },

  statement: `You are given a binary array \`nums\` (only 0s and 1s) and an integer \`k\`.

You may flip **at most \`k\`** zeros into ones. Return the length of the **longest block of consecutive 1s** you can end up with.`,
  examples: [
    { input: 'nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2', output: '6', explanation: 'Flip the zeros at indices 5 and 10 → [1,1,1,0,0,1,1,1,1,1,1]; the last six are all 1s.' },
    { input: 'nums = [0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1], k = 3', output: '10', explanation: 'Flip indices 4, 5 and 9 → indices 2..11 are all 1s.' },
  ],
  constraints: ['1 <= nums.length <= 10^5', 'nums[i] is 0 or 1', '0 <= k <= nums.length'],

  think: `- Rephrase the question without the word "flip": which subarrays could become all 1s?
- If a subarray has at most k zeros, does every smaller subarray inside it also have at most k zeros? What does that monotonicity buy you?
- What single number describes the window state?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size (longest valid)', 'Sliding Window — Fixed Size k', 'Dynamic Programming', 'Greedy: flip the first k zeros'],
    answer: 0,
    explanation: 'Rephrased: "longest subarray containing at most k zeros". Contiguous + longest + a monotonic counter rule → variable window. k is the number of flips, not the window size. Flipping the first k zeros greedily fails on inputs where the best block is later.',
  },
  hints: [
    'Forget flipping: you want the longest window that contains at most `k` zeros.',
    'Track `zeros` inside the window. Expand right; while `zeros > k`, move left forward (decrementing `zeros` when a 0 leaves). Record `right - left + 1`.',
  ],
  approach: `**Brute force:** for every start, extend while the zero count is ≤ k → O(n²).

**Optimized (longest valid window):** the rule "zeros in window ≤ k" is monotonic — shrinking never adds zeros. So:
1. Expand \`right\`; if \`nums[right] === 0\`, \`zeros++\`.
2. While \`zeros > k\`: if \`nums[left] === 0\`, \`zeros--\`; \`left++\`.
3. The window is valid → \`best = max(best, right - left + 1)\`.

Each index enters and leaves at most once → O(n), O(1) space.`,

  functionName: 'longestOnes',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function longestOnes(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: flip two zeros to join the last run of 1s.', args: [[1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2], expected: 6 },
    { scenario: 'Example 2', hint: 'Three flips join several runs in the middle of the array.', args: [[0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], 3], expected: 10 },
    { scenario: 'Single zero, k = 0', hint: 'The smallest input with nothing to flip: answer 0.', args: [[0], 0], expected: 0 },
    { scenario: 'Single zero, k = 1', hint: 'Flip the only element: answer 1.', args: [[0], 1], expected: 1 },
    { scenario: 'k = 0', hint: 'No flips: the answer is the longest existing run of 1s.', args: [[1, 1, 0, 1, 1, 1, 0, 1], 0], expected: 3 },
    { scenario: 'All ones', hint: 'No zeros at all: the whole array.', args: [[1, 1, 1, 1], 2], expected: 4 },
    { scenario: 'All zeros, k < n', hint: 'Only k zeros can be flipped, so the answer is k.', args: [[0, 0, 0, 0, 0], 3], expected: 3 },
    { scenario: 'k = n', hint: 'Everything can be flipped: the whole array.', args: [[0, 1, 0, 0, 1], 5], expected: 5 },
    { scenario: 'k is not the window size', hint: 'k = 1 allows one zero, not a window of length 1: [1, 1, 0, 1, 1] has length 5.', args: [[1, 1, 0, 1, 1, 0, 0], 1], expected: 5 },
    { scenario: 'First zeros are wrong choice', hint: 'Flipping the first k zeros greedily joins short runs; the best window uses later zeros.', args: [[0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1], 2], expected: 9 },
    { scenario: 'Record after repairing', hint: 'Measure the window only after the while loop removes extra zeros, or you count an invalid window.', args: [[1, 0, 0, 1], 1], expected: 2 },
    { scenario: 'Large input (n = 10^5)', hint: 'Restarting from every index is O(n²). A sliding window that tracks the zero count is O(n).', argsGen: '() => { let s = 47; return [Array.from({ length: 100000 }, () => { s = (s * 48271) % 2147483647; return s % 10 === 0 ? 0 : 1; }), 3000]; }', expected: 30571, timeLimitMs: 1000 },
    { scenario: 'Large, all ones', hint: '10^5 ones: every start index extends to the end in an O(n²) solution.', argsGen: '() => [new Array(100000).fill(1), 0]', expected: 100000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function longestOnes(nums, k) {
  let left = 0, zeros = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeros++;          // expand
    while (zeros > k) {                      // too many zeros → repair
      if (nums[left] === 0) zeros--;
      left++;
    }
    best = Math.max(best, right - left + 1); // window has ≤ k zeros
  }
  return best;
}`,
    explanation: 'The window is exactly the stretch we would turn into 1s. `zeros` is its only state — no Map needed.',
  },
  dryRun: {
    columns: ['right', 'nums[right]', 'zeros', 'left', 'best'],
    rows: [
      ['0-2', '1,1,1', '0', '0', '3'],
      ['3', '0', '1', '0', '4'],
      ['4', '0', '2', '0', '5'],
      ['5', '0', '3 → shrink to left=4', '4', '5'],
      ['6-9', '1,1,1,1', '2', '4', '6'],
      ['10', '0', '3 → shrink to left=5', '5', '6'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Both pointers move at most n steps; a single counter describes the window.' },
  alternative: {
    title: 'Non-shrinking window',
    md: 'Replace `while` with `if`: the window never shrinks, it only slides when invalid. Its size therefore only grows when a longer valid window is found, and the answer is `n - left` at the end. Clever, but harder to explain — mention it after the standard version.',
    code: `function longestOnes(nums, k) {
  let left = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) k--;
    if (k < 0) { if (nums[left] === 0) k++; left++; }
  }
  return nums.length - left;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Treating k as the window size (fixed window) — k is the number of zeros allowed.',
    'Greedily flipping the first k zeros you see.',
    'Recording the length before the while loop has repaired the window.',
  ],
};
