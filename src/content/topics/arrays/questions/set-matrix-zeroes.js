export default {
  id: 'set-matrix-zeroes',
  title: 'Set Matrix Zeroes',
  difficulty: 'Medium',
  order: 4,
  pattern: 'matrix-traversal-layers',
  tags: ['matrix', 'in-place', 'markers'],
  source: { platform: 'LeetCode', number: 73, url: 'https://leetcode.com/problems/set-matrix-zeroes/' },

  statement: `Given an \`m x n\` integer matrix, whenever an element is \`0\`, set its **entire row and entire column** to \`0\`.

Do it **in place**. Follow-up: can you use only O(1) extra space?`,
  examples: [
    { input: 'matrix = [[1,1,1],[1,0,1],[1,1,1]]', output: '[[1,0,1],[0,0,0],[1,0,1]]' },
    { input: 'matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]', output: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' },
  ],
  constraints: ['1 <= m, n <= 200', '-2^31 <= matrix[i][j] <= 2^31 - 1'],

  think: `- If you zero a row immediately, what happens when your scan later reaches the new zeros?
- What is the minimum information you need to remember before writing anything?
- Is there unused space inside the matrix that could store that information?`,
  patternChallenge: {
    options: ['Graph BFS from every zero', 'Matrix Traversal with in-place markers', 'Binary Search per row', 'Sort each column'],
    answer: 1,
    explanation: 'We only need "which rows" and "which columns" contain a zero — that fits in the first row and first column of the matrix itself.',
  },
  hints: ['First pass: record which rows and columns contain a zero (two boolean arrays → O(m + n) space). Second pass: zero them.', 'For O(1) space, use row 0 and column 0 as those arrays, with one extra flag for whether column 0 itself must be zeroed.'],
  approach: `**Naive trap:** zeroing while scanning spreads fake zeros across the whole matrix.

**O(m + n) space:** \`rows[r] = true\` / \`cols[c] = true\` for each zero; then set \`matrix[r][c] = 0\` if \`rows[r] || cols[c]\`.

**O(1) space:** store the markers in the matrix: \`matrix[r][0] = 0\` marks row r, \`matrix[0][c] = 0\` marks column c. Cell (0, 0) would be shared by row 0 and column 0, so keep a separate flag \`firstColZero\`. Fill the interior from the markers, then row 0 (if \`matrix[0][0] === 0\`), then column 0 (if the flag is set) — in that order so markers are read before being overwritten.`,

  functionName: 'setZeroes',
  paramNames: ['matrix'],
  starterCode: `/**
 * Do not return anything, modify matrix in place.
 * @param {number[][]} matrix
 * @return {void}
 */
function setZeroes(matrix) {
  
}
`,
  io: { mutates: 0 },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: one interior zero clears its row and column.', args: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], expected: [[1, 0, 1], [0, 0, 0], [1, 0, 1]] },
    { scenario: 'Example 2', hint: 'Zeros in row 0 — their column markers live in the marker row itself.', args: [[[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]], expected: [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]] },
    { scenario: 'Single non-zero cell', hint: 'Nothing to clear: a 1 × 1 matrix without zeros stays the same.', args: [[[1]]], expected: [[1]] },
    { scenario: 'Single zero cell', hint: 'A 1 × 1 zero stays zero.', args: [[[0]]], expected: [[0]] },
    { scenario: 'No zeros', hint: 'Without any zero the matrix must not change at all.', args: [[[1, 2, 3], [4, 5, 6]]], expected: [[1, 2, 3], [4, 5, 6]] },
    { scenario: 'Single row', hint: 'One row: a zero clears the whole row.', args: [[[1, 0, 3]]], expected: [[0, 0, 0]] },
    { scenario: 'Single column', hint: 'One column: a zero clears the whole column.', args: [[[1], [0], [3]]], expected: [[0], [0], [0]] },
    { scenario: 'Fake zeros spread', hint: 'Zeroing during the first scan creates new zeros that clear extra rows and columns; only original zeros count.', args: [[[0, 1], [1, 1]]], expected: [[0, 0], [0, 1]] },
    { scenario: 'Zero in row 0 only', hint: 'Using matrix[0][0] for both row 0 and column 0 wrongly clears column 0 here.', args: [[[1, 0], [1, 1]]], expected: [[0, 0], [1, 0]] },
    { scenario: 'Zero in column 0 only', hint: 'Using matrix[0][0] for both row 0 and column 0 wrongly clears row 0 here.', args: [[[1, 1], [0, 1]]], expected: [[0, 1], [0, 0]] },
    { scenario: 'Markers overwritten early', hint: 'Processing row 0 / column 0 before the interior destroys the markers and clears too much.', args: [[[1, 0, 3], [4, 5, 6]]], expected: [[0, 0, 0], [4, 0, 6]] },
    { scenario: 'Several zeros', hint: 'Zeros in many rows and columns, including the corner area.', args: [[[1, 2, 3, 4], [5, 0, 7, 8], [0, 10, 11, 12], [13, 14, 15, 0]]], expected: [[0, 0, 3, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] },
    { scenario: 'Extreme 32-bit values', hint: 'Large values are not zeros; compare with === 0, not with falsy checks on other markers.', args: [[[-2147483648, 2147483647], [0, 5]]], expected: [[0, 2147483647], [0, 0]] },
    { scenario: 'Maximum rows (200 × 3)', hint: 'A tall matrix at the row limit; the zero in the last row must clear its column all the way up.', argsGen: '() => [Array.from({ length: 200 }, (_, r) => [r === 199 ? 0 : r + 1, 1, r === 100 ? 0 : 2])]', expected: [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 0, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 0, 0]] },
    { scenario: 'Maximum columns (3 × 200)', hint: 'A wide matrix at the column limit.', argsGen: '() => [Array.from({ length: 3 }, (_, r) => Array.from({ length: 200 }, (_, c) => (r === 2 && c === 150 ? 0 : 1)))]', expected: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]] },
  ],

  solution: {
    code: `function setZeroes(matrix) {
  const m = matrix.length, n = matrix[0].length;
  let firstColZero = false;

  // 1. record markers in row 0 / column 0
  for (let r = 0; r < m; r++) {
    if (matrix[r][0] === 0) firstColZero = true;
    for (let c = 1; c < n; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;   // row r must be zeroed
        matrix[0][c] = 0;   // column c must be zeroed
      }
    }
  }
  // 2. interior cells from the markers
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;
    }
  }
  // 3. row 0 (its marker lives in matrix[0][0])
  if (matrix[0][0] === 0) for (let c = 0; c < n; c++) matrix[0][c] = 0;
  // 4. column 0 (its marker is the separate flag)
  if (firstColZero) for (let r = 0; r < m; r++) matrix[r][0] = 0;
}`,
  },
  dryRun: {
    columns: ['phase', 'matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]'],
    rows: [
      ['markers', 'firstColZero = true; matrix[0][3] = 0 (already); row 0 marked by matrix[0][0] = 0'],
      ['interior', 'column 3 is marked → rows 1,2 get 0 in column 3'],
      ['row 0', 'matrix[0][0] === 0 → row 0 all zeros'],
      ['col 0', 'flag → column 0 all zeros → [[0,0,0,0],[0,4,5,0],[0,3,1,0]]'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(1)', explanation: 'Two passes over the matrix; the markers live inside the input.' },
  alternative: {
    title: 'Row/column boolean arrays',
    md: 'Much easier to get right; mention it first, then offer the O(1) version.',
    code: `function setZeroes(matrix) {
  const m = matrix.length, n = matrix[0].length;
  const rows = new Array(m).fill(false), cols = new Array(n).fill(false);
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (matrix[r][c] === 0) rows[r] = cols[c] = true;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (rows[r] || cols[c]) matrix[r][c] = 0;
}`,
    complexity: 'O(m·n) time, O(m + n) space',
  },
  mistakes: ['Zeroing during the first scan (fake zeros spread)', 'Using matrix[0][0] for both row 0 and column 0', 'Processing row 0 / column 0 before the interior (destroys the markers)'],
};
