export default {
  id: 'search-a-2d-matrix',
  title: 'Search a 2D Matrix',
  difficulty: 'Medium',
  order: 2,
  pattern: 'binary-search-exact',
  tags: ['matrix', 'binary search'],
  source: { platform: 'LeetCode', number: 74, url: 'https://leetcode.com/problems/search-a-2d-matrix/' },

  statement: `You are given an \`m × n\` integer matrix where:
- each row is sorted in non-decreasing order, and
- the first value of each row is greater than the last value of the previous row.

Return \`true\` if \`target\` is in the matrix. Aim for **O(log(m · n))**.`,
  examples: [
    { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3', output: 'true' },
    { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13', output: 'false' },
  ],
  constraints: ['1 <= m, n <= 100', '-10^4 <= matrix[i][j], target <= 10^4'],

  think: `- If you read the rows one after another, what does the sequence look like?
- How do you turn a position k in that long sequence back into (row, col)?`,
  patternChallenge: {
    options: ['BFS over the grid', 'Staircase search from the top-right corner', 'Binary Search — exact match over a flattened index', 'Union-Find'],
    answer: 2,
    explanation: 'The two properties mean the matrix read row by row is one sorted array of length m·n. Binary search the virtual index k with row = floor(k / n), col = k % n. The staircase walk is O(m + n) — optimal for the *other* sorted-matrix problem (Search a 2D Matrix II), not this one.',
  },
  hints: [
    'Pretend the matrix is a 1D sorted array of length m·n — you never need to build it.',
    'Index k maps to `matrix[Math.floor(k / n)][k % n]`.',
  ],
  approach: `**Brute force:** scan all m·n cells — O(mn).

**Better:** binary search each row, or binary search the first column to pick the row then the row → O(log m + log n).

**Optimized (one search):** virtual index \`k ∈ [0, m·n − 1]\`, value \`matrix[floor(k/n)][k % n]\`; run the closed exact-match search. O(log(mn)) = O(log m + log n).`,

  functionName: 'searchMatrix',
  paramNames: ['matrix', 'target'],
  starterCode: `/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
function searchMatrix(matrix, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: the target is in the first row.', args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], expected: true },
    { scenario: 'Example 2', hint: 'The target falls between values in the middle row — return false.', args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], expected: false },
    { scenario: 'Single cell, found', hint: 'A 1×1 matrix: index 0 maps to (0, 0).', args: [[[1]], 1], expected: true },
    { scenario: 'Single cell, missing', hint: 'A 1×1 matrix without the target — the loop must end and return false.', args: [[[1]], 2], expected: false },
    { scenario: 'Single row', hint: 'm = 1: every index i maps to (0, i). Row = floor(i / n), column = i % n.', args: [[[1, 3, 5, 7, 9]], 9], expected: true },
    { scenario: 'Single column', hint: 'n = 1: every index i maps to (i, 0). Dividing by the wrong dimension breaks here.', args: [[[1], [3], [5]], 5], expected: true },
    { scenario: 'Wide matrix (2 × 5)', hint: 'Map index i to matrix[Math.floor(i / n)][i % n] with n = number of columns. Dividing by m (rows) reads the wrong cell.', args: [[[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]], 9], expected: true },
    { scenario: 'Tall matrix (4 × 2)', hint: 'More rows than columns: the virtual array has m·n = 8 cells — hi must start at m·n - 1.', args: [[[1, 2], [4, 6], [8, 9], [12, 15]], 12], expected: true },
    { scenario: 'Target is last cell', hint: 'The bottom-right cell is the last virtual index m·n - 1 — check your bounds reach it.', args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 60], expected: true },
    { scenario: 'Target is first cell', hint: 'The top-left cell is virtual index 0.', args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 1], expected: true },
    { scenario: 'Target below all values', hint: 'Smaller than matrix[0][0]: return false without going out of range.', args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 0], expected: false },
    { scenario: 'Target above all values', hint: 'Larger than the last cell: return false without reading past the last row.', args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 61], expected: false },
    { scenario: 'Between two rows', hint: 'The target is greater than a row\'s last value but smaller than the next row\'s first value.', args: [[[1, 3], [5, 7]], 4], expected: false },
    { scenario: 'Largest matrix, found', hint: 'A 100 × 100 matrix with negative values: one O(log(m·n)) search over all 10^4 cells.', argsGen: '() => [Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => 2 * (r * 100 + c) - 9999)), 7777]', expected: true },
    { scenario: 'Largest matrix, missing', hint: 'An even target in a matrix of odd values — every comparison misses and the answer is false.', argsGen: '() => [Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => 2 * (r * 100 + c) - 9999)), 42]', expected: false },
  ],

  solution: {
    code: `function searchMatrix(matrix, target) {
  const m = matrix.length, n = matrix[0].length;
  let lo = 0, hi = m * n - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    const v = matrix[Math.floor(mid / n)][mid % n];  // virtual 1D index → cell
    if (v === target) return true;
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', '(row, col)', 'value', 'decision'],
    rows: [
      ['0', '11', '5', '(1, 1)', '11', '> 3 → hi = 4'],
      ['0', '4', '2', '(0, 2)', '5', '> 3 → hi = 1'],
      ['0', '1', '0', '(0, 0)', '1', '< 3 → lo = 1'],
      ['1', '1', '1', '(0, 1)', '3', 'found'],
    ],
  },
  complexity: { time: 'O(log(m·n))', space: 'O(1)', explanation: 'One binary search over m·n virtual positions.' },
  alternative: {
    title: 'Two searches (row, then column)',
    md: 'Find the last row whose first element ≤ target, then binary search inside that row.',
    complexity: 'O(log m + log n) time, O(1) space',
  },
  mistakes: [
    'Dividing by m (rows) instead of n (columns) when mapping the index.',
    'Using the staircase walk — correct but O(m + n), not logarithmic.',
    'Flattening with `matrix.flat()` — O(mn) time and memory before you even search.',
  ],
};
