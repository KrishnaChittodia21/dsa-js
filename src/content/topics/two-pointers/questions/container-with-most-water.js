export default {
  id: 'container-with-most-water',
  title: 'Container With Most Water',
  difficulty: 'Medium',
  order: 3,
  pattern: 'two-pointers-bottleneck',
  tags: ['array', 'two pointers', 'greedy'],
  source: { platform: 'LeetCode', number: 11, url: 'https://leetcode.com/problems/container-with-most-water/' },

  statement: `You are given \`height\`, where \`height[i]\` is the height of a vertical line standing at \`x = i\`.

Pick two lines. Together with the x-axis they form a container; the water it holds has area \`min(height[i], height[j]) × (j − i)\`.

Return the **maximum** amount of water a container can hold. (You may not tilt the container.)`,
  examples: [
    { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Lines at index 1 (8) and 8 (7): min(8, 7) × 7 = 49.' },
    { input: 'height = [1,1]', output: '1' },
  ],
  constraints: ['2 <= height.length <= 10^5', '0 <= height[i] <= 10^4'],

  think: `- Start with the widest container (both ends). To find a bigger one, width must shrink — so what must grow?
- If the left line is shorter than the right line, can any container that keeps the left line beat the current one?
- What should you do when both lines are equal?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'Monotonic Stack', 'Two Pointers — move the shorter side', 'Dynamic Programming'],
    answer: 2,
    explanation: 'The area is limited by the shorter line (the bottleneck). Keeping the shorter line while shrinking the width can only lose, so we discard it. This is not a window: the answer is a *pair* of lines, not a range whose contents matter.',
  },
  hints: [
    'Start with `l = 0`, `r = n - 1` and compute the area.',
    'Move the pointer at the **shorter** line inward. Any container that keeps the shorter line is narrower and no taller, so it cannot win.',
  ],
  approach: `**Brute force:** all pairs → O(n²), 5·10^9 pairs for n = 10^5.

**Two pointers:** start widest. Say \`height[l] < height[r]\`. Every other container using line \`l\` has right end \`r' < r\`:
- width \`r' − l < r − l\`,
- height \`min(height[l], height[r']) ≤ height[l]\`.

So its area is **smaller** than the current one. Line \`l\` has nothing more to offer → \`l++\`. Symmetrically for \`r\`. With equal heights either can be discarded (both are capped at that height for every narrower width). Each step discards one line → O(n).`,

  functionName: 'maxArea',
  paramNames: ['height'],
  starterCode: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: lines 8 and 7 at distance 7 give 49.', args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
    { scenario: 'Example 2', hint: 'Only two lines: the answer is min(1, 1) × 1.', args: [[1, 1]], expected: 1 },
    { scenario: 'Equal ends win', hint: 'The outermost pair (4 and 4, width 4) is best; lines in between do not matter at all.', args: [[4, 3, 2, 1, 4]], expected: 16 },
    { scenario: 'All zeros', hint: 'Zero-height lines hold nothing — the answer is 0, not negative or undefined.', args: [[0, 0]], expected: 0 },
    { scenario: 'Width is r - l', hint: 'Lines at x = 0 and x = 2 are 2 apart. Using `r - l + 1` gives 3 instead of 2.', args: [[1, 2, 1]], expected: 2 },
    { scenario: 'Move the shorter line', hint: 'Moving the taller line instead of the shorter one skips the best pair (2 and 3, two apart: area 4).', args: [[1, 2, 4, 3]], expected: 4 },
    { scenario: 'Best pair in the middle', hint: 'The best container does not use either end: keep moving the shorter side and track the max.', args: [[1, 3, 2, 5, 25, 24, 5]], expected: 24 },
    { scenario: 'Tall walls, low middle', hint: 'Not Trapping Rain Water: the short lines in between do not reduce the area. 10 × 6 = 60.', args: [[10, 1, 1, 1, 1, 1, 10]], expected: 60 },
    { scenario: 'Strictly increasing', hint: 'Heights 1..6: the best is min(3, 6) × 3 = 9, not the outermost pair (1 × 5).', args: [[1, 2, 3, 4, 5, 6]], expected: 9 },
    { scenario: 'Strictly decreasing', hint: 'Mirror of the increasing case: the right pointer must move inward instead.', args: [[6, 5, 4, 3, 2, 1]], expected: 9 },
    { scenario: 'Max heights', hint: 'Heights of 10^4 at both ends of a wide array: 10^4 × 4 = 40 000.', args: [[10000, 0, 0, 0, 10000]], expected: 40000 },
    { scenario: 'Large input (n = 10^5)', hint: 'Checking every pair is O(n²) ≈ 5·10^9 steps. Two pointers from both ends is O(n).', argsGen: '() => { let s = 23; return [Array.from({ length: 100000 }, () => { s = (s * 48271) % 2147483647; return s % 10001; })]; }', expected: 994606480, timeLimitMs: 1000 },
    { scenario: 'Large, all equal', hint: 'All heights equal: the widest container is best. Ties must still move a pointer, or the loop never ends.', argsGen: '() => [new Array(100000).fill(10000)]', expected: 999990000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    const h = Math.min(height[l], height[r]);
    best = Math.max(best, h * (r - l));
    // The shorter line is the bottleneck: no narrower container can use it better.
    if (height[l] < height[r]) l++;
    else r--;
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['l', 'r', 'h[l]', 'h[r]', 'area', 'best', 'move'],
    rows: [
      ['0', '8', '1', '7', '8', '8', 'l++'],
      ['1', '8', '8', '7', '49', '49', 'r--'],
      ['1', '7', '8', '3', '18', '49', 'r--'],
      ['1', '6', '8', '8', '40', '49', 'r--'],
      ['1', '5', '8', '4', '16', '49', 'r--'],
      ['…', '…', '…', '…', '…', '49', 'until l = r'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each iteration discards one line; at most n − 1 iterations.' },
  alternative: {
    title: 'Skip lines that cannot help',
    md: 'After moving `l`, keep moving it while `height[l]` is not taller than the line you just left — those lines are shorter *and* narrower. Same worst case, fewer iterations in practice.',
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Moving the taller line — the height is still capped by the shorter one while the width shrinks.',
    'Computing width as `r - l + 1` (the distance between x = l and x = r is `r - l`).',
    'Confusing this with Trapping Rain Water: here the lines in between do not matter at all.',
  ],
};
