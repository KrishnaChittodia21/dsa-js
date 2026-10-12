export default {
  id: 'largest-rectangle-in-histogram',
  title: 'Largest Rectangle in Histogram',
  difficulty: 'Hard',
  order: 1,
  pattern: 'monotonic-stack-previous-smaller',
  tags: ['array', 'monotonic stack'],
  source: { platform: 'LeetCode', number: 84, url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/' },

  statement: `\`heights[i]\` is the height of bar \`i\` in a histogram; every bar has width 1 and the bars stand side by side. Return the area of the largest rectangle that fits entirely inside the histogram.`,
  examples: [
    { input: 'heights = [2,1,5,6,2,3]', output: '10', explanation: 'Bars 5 and 6 give a 5 × 2 rectangle.' },
    { input: 'heights = [2,4]', output: '4' },
  ],
  constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],

  think: `- Any rectangle is as tall as its **shortest** bar. What if you try every bar as "the shortest bar of the rectangle"?
- For that bar, how far can the rectangle stretch left and right?
- Which structure gives the previous smaller and next smaller bar for every index in one pass?`,
  patternChallenge: {
    options: ['Two pointers from both ends', 'Divide and conquer on the minimum', 'Monotonic stack (previous/next smaller)', 'Kadane'],
    answer: 2,
    explanation: 'The best rectangle with bar i as the minimum spans (prevSmaller, nextSmaller). An increasing stack yields both boundaries at pop time in O(n). Divide and conquer works but is O(n log n) on average and O(n²) on sorted input; two pointers (as in "container with most water") does not apply because the height is a range minimum.',
  },
  hints: [
    'Keep indices on a stack with increasing heights. When the current bar is lower than the top, the top bar cannot extend further right.',
    'Pop j; its right boundary is i, its left boundary is the new top (or −1). Area = heights[j] × (i − left − 1). Add a height-0 sentinel at the end to flush the stack.',
  ],
  approach: `**Brute force:** for every pair (l, r), track the minimum height → O(n²) (10^10 — too slow).

**Monotonic stack (O(n)):** maintain an increasing stack of indices. When \`heights[i] <= heights[top]\`, the top bar has found its next smaller-or-equal bar at i; the element below it on the stack is its previous smaller bar. Compute its area and pop. A sentinel bar of height 0 at position n pops every remaining bar. (Popping on equal heights is fine: the last equal bar computes the full width.)`,

  functionName: 'largestRectangleArea',
  paramNames: ['heights'],
  starterCode: `/**
 * @param {number[]} heights
 * @return {number}
 */
function largestRectangleArea(heights) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Bars 5 and 6 together give 5 × 2 = 10; no single bar does better.', args: [[2, 1, 5, 6, 2, 3]], expected: 10 },
    { scenario: 'Example 2', hint: 'Either the single bar of height 4 or both bars at height 2.', args: [[2, 4]], expected: 4 },
    { scenario: 'Single bar', hint: 'Smallest input: the area is the bar itself.', args: [[5]], expected: 5 },
    { scenario: 'Single zero bar', hint: 'Height 0 bars have no area.', args: [[0]], expected: 0 },
    { scenario: 'All equal', hint: 'The best rectangle spans the whole histogram — width must reach both ends.', args: [[1, 1, 1, 1]], expected: 4 },
    { scenario: 'Increasing heights', hint: 'Nothing is popped during the scan — without a sentinel (or final flush) these bars are never measured.', args: [[1, 2, 3, 4, 5]], expected: 9 },
    { scenario: 'Decreasing heights', hint: 'Every bar pops the previous one; the best uses heights 3 × width 3.', args: [[5, 4, 3, 2, 1]], expected: 9 },
    { scenario: 'Valley in the middle', hint: 'The low bar spans the whole width: width = i − left − 1, not i − popped index.', args: [[2, 1, 2]], expected: 3 },
    { scenario: 'Mixed heights', hint: 'Best is height 4 across bars 2..4 — width must include taller bars to the left of the popped index.', args: [[6, 2, 5, 4, 5, 1, 6]], expected: 12 },
    { scenario: 'Zeros split the histogram', hint: 'A zero bar cuts every rectangle; the answer is in one of the separate blocks.', args: [[3, 3, 0, 2, 2, 2, 0, 4]], expected: 6 },
    { scenario: 'Maximum height bar', hint: 'One tall bar at the 10^4 limit beats the wide low area.', args: [[1, 1, 10000, 1, 1]], expected: 10000 },
    { scenario: 'All zeros', hint: 'No area anywhere — answer 0.', args: [[0, 0, 0]], expected: 0 },
    { scenario: 'All max height (n = 10^5)', hint: 'Area 10^9 spanning everything. An O(n²) expand-from-each-bar loop is ~5·10^9 steps here.', argsGen: '() => [new Array(100000).fill(10000)]', expected: 1000000000, timeLimitMs: 1000 },
    { scenario: 'Large random (n = 10^5)', hint: 'Random heights at full size — a monotonic stack processes each bar once.', argsGen: '() => { let s = 2024; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => r() % 10001)]; }', expected: 94984, timeLimitMs: 1000 },
    { scenario: 'Large sawtooth (n = 10^5)', hint: 'Repeated increasing runs push deep stacks that must be flushed correctly.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i % 10000) + 1)]', expected: 25005000, timeLimitMs: 1000 },
  ],
  solution: {
    code: `function largestRectangleArea(heights) {
  const n = heights.length;
  const st = [];                     // indices, heights increasing
  let best = 0;
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i];          // sentinel flushes the stack
    while (st.length && heights[st[st.length - 1]] >= h) {
      const height = heights[st.pop()];
      const left = st.length ? st[st.length - 1] : -1; // previous smaller bar
      best = Math.max(best, height * (i - left - 1));   // i = next smaller bar
    }
    st.push(i);
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['i', 'h', 'pops → area', 'stack', 'best'],
    rows: [
      ['0', '2', '—', '[0]', '0'],
      ['1', '1', '2×1 = 2', '[1]', '2'],
      ['2', '5', '—', '[1,2]', '2'],
      ['3', '6', '—', '[1,2,3]', '2'],
      ['4', '2', '6×1 = 6, 5×2 = 10', '[1,4]', '10'],
      ['5', '3', '—', '[1,4,5]', '10'],
      ['6', '0', '3×1, 2×4 = 8, 1×6 = 6', '[6]', '10'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Every index is pushed and popped once.' },
  alternative: {
    title: 'Two passes for boundaries',
    md: 'Compute prevSmaller[] (left-to-right stack) and nextSmaller[] (right-to-left stack) separately, then take max of heights[i] × (nextSmaller[i] − prevSmaller[i] − 1). Easier to reason about, same complexity.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Omitting the sentinel so increasing runs at the end are never measured ([1,2,3,4,5]).',
    'Width = i − j instead of i − left − 1 (ignores taller bars on the left).',
    'Pushing heights instead of indices (widths need positions).',
  ],
};
