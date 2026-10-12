export default {
  id: 'triangle',
  title: 'Triangle',
  difficulty: 'Medium',
  order: 4,
  pattern: 'dp-2d-grid',
  tags: ['array', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 120, url: 'https://leetcode.com/problems/triangle/' },

  statement: `You are given a triangle of numbers as an array of rows, where row \`i\` has \`i + 1\` numbers.

Start at the top and move down one row at a time. From index \`j\` in one row you may step to index \`j\` or \`j + 1\` in the next row. Return the minimum possible sum of a top-to-bottom path.`,
  examples: [
    { input: 'triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]', output: '11', explanation: '2 + 3 + 5 + 1 = 11.' },
    { input: 'triangle = [[-10]]', output: '-10' },
  ],
  constraints: ['1 <= triangle.length <= 200', 'triangle[i].length === i + 1', '-10^4 <= triangle[i][j] <= 10^4', 'Follow-up: O(n) extra space, n = number of rows'],

  think: `- Top-down, the edge cells of each row have only ONE parent. Is there a direction without edge cases?
- If you knew the best path from each cell of the row below to the bottom, how would you get it for the current row?
- Where does the answer end up?`,
  patternChallenge: {
    options: ['Greedy smallest child', 'Grid DP filled bottom-up', 'Binary search', 'Backtracking'],
    answer: 1,
    explanation: 'Each cell depends only on its two children — an acyclic grid dependency. Bottom-up makes every cell have exactly two children and puts the answer at the apex. Greedy fails when a small number hides a big one below.',
  },
  hints: [
    'Let dp[j] = best path sum from cell (i, j) down to the bottom. Start with dp = last row.',
    'Go up: dp[j] = triangle[i][j] + min(dp[j], dp[j + 1]) for j = 0..i. Left to right is safe because dp[j + 1] is still the row below.',
  ],
  approach: `**Brute force:** every path makes a left/right choice per row → 2^(n−1) paths.

**Top-down DP:** \`best[i][j] = tri[i][j] + min(best[i−1][j−1], best[i−1][j])\` with care at j = 0 and j = i, answer = min of the last row.

**Bottom-up DP (cleaner):** \`dp[j]\` = best from (i, j) to the bottom. Initialise with the last row; for i from n−2 down to 0, \`dp[j] = tri[i][j] + min(dp[j], dp[j+1])\`. Every cell has two children, no boundary cases, and \`dp[0]\` is the answer. Updating left to right in place is safe: \`dp[j]\` reads \`dp[j]\` and \`dp[j+1]\`, and \`dp[j+1]\` has not been overwritten yet in this pass, so both still hold the row below.`,

  functionName: 'minimumTotal',
  paramNames: ['triangle'],
  starterCode: `/**
 * @param {number[][]} triangle
 * @return {number}
 */
function minimumTotal(triangle) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: 2 + 3 + 5 + 1.', args: [[[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]]], expected: 11 },
    { scenario: 'Example 2', hint: 'A single row: the answer is that value, even when negative.', args: [[[-10]]], expected: -10 },
    { scenario: 'Two rows', hint: 'Pick the smaller of the two children.', args: [[[1], [2, 3]]], expected: 3 },
    { scenario: 'Greedy smaller child fails', hint: 'Greedy takes 2 then −1 (total 0); the best path goes through 3 to −3 (total −1).', args: [[[-1], [2, 3], [1, -1, -3]]], expected: -1 },
    { scenario: 'Negative values', hint: 'Negative numbers deeper down can outweigh an early cost.', args: [[[1], [-5, -2], [3, 6, 1], [-1, 2, 4, -3]]], expected: -3 },
    { scenario: 'All zeros', hint: 'Every path sums to 0.', args: [[[0], [0, 0], [0, 0, 0]]], expected: 0 },
    { scenario: 'Path along the right edge', hint: 'The best path hugs the right edge — top-down code must handle j = i (no upper-right parent).', args: [[[1], [9, 1], [9, 9, 1], [9, 9, 9, 1]]], expected: 4 },
    { scenario: 'Path along the left edge', hint: 'The best path hugs the left edge — j = 0 has only one parent.', args: [[[1], [1, 9], [1, 9, 9], [1, 9, 9, 9]]], expected: 4 },
    { scenario: 'Diagonal zig-zag', hint: 'Cheap cells alternate sides — a greedy choice gets trapped.', args: [[[1], [1, 100], [100, 1, 100], [100, 100, 1, 100]]], expected: 4 },
    { scenario: 'Minimum values (200 rows)', hint: 'Every cell is −10^4: the answer is −2 000 000.', argsGen: '() => [Array.from({ length: 200 }, (_, i) => new Array(i + 1).fill(-10000))]', expected: -2000000 },
    { scenario: 'Large input (200 rows)', hint: 'Exploring every path is 2^199 work; bottom-up rows are O(n²).', argsGen: '() => { let x = 13; const r = () => (x = x * 48271 % 2147483647); return [Array.from({ length: 200 }, (_, i) => Array.from({ length: i + 1 }, () => r() % 20001 - 10000))]; }', expected: -981430, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minimumTotal(triangle) {
  const n = triangle.length;
  const dp = triangle[n - 1].slice();          // best from the bottom row = the row itself
  for (let i = n - 2; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
    }
  }
  return dp[0];
}`,
    explanation: '`slice()` copies the last row so the input is not mutated.',
  },
  dryRun: {
    columns: ['row i', 'dp after row'],
    rows: [
      ['3 (start)', '[4, 1, 8, 3]'],
      ['2', '[7, 6, 10]  (6+1, 5+1, 7+3)'],
      ['1', '[9, 10]  (3+6, 4+6)'],
      ['0', '[11]  (2+9)'],
    ],
  },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'There are n(n+1)/2 cells, each O(1). One array of length n.' },
  alternative: {
    title: 'Top-down with boundaries',
    md: 'Fill from the apex, handle j = 0 (only parent j) and j = i (only parent j−1), then take Math.min(...lastRow). Same complexity, more edge cases — a good reason to prefer bottom-up.',
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Greedy — choosing the smaller child at each step.',
    'Top-down without handling the two edges of each row.',
    'Mutating the input triangle (copy the last row).',
  ],
};
