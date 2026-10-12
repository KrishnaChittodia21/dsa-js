export default {
  id: 'spiral-matrix',
  title: 'Spiral Matrix',
  difficulty: 'Medium',
  order: 2,
  pattern: 'matrix-traversal-layers',
  tags: ['matrix', 'simulation'],
  source: { platform: 'LeetCode', number: 54, url: 'https://leetcode.com/problems/spiral-matrix/' },

  statement: `Given an \`m x n\` matrix, return all of its elements in **spiral order**: start at the top-left corner, go right along the top row, down the right column, left along the bottom row, up the left column, and continue inward until every element has been visited.`,
  examples: [
    { input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[1,2,3,6,9,8,7,4,5]' },
    { input: 'matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]', output: '[1,2,3,4,8,12,11,10,9,5,6,7]' },
  ],
  constraints: ['m == matrix.length', 'n == matrix[i].length', '1 <= m, n <= 10', '-100 <= matrix[i][j] <= 100'],

  think: `- After walking the top row, which row will never be visited again?
- How can four variables describe the part of the matrix that is still unvisited?
- What goes wrong when only one row or one column remains?`,
  patternChallenge: {
    options: ['Graph BFS', 'Matrix Traversal with shrinking boundaries', 'Sorting', 'Prefix Sum'],
    answer: 1,
    explanation: 'Spiral order is a pure position walk: four boundaries (top, bottom, left, right) shrink after each side. No connectivity or search is involved.',
  },
  hints: ['Keep top, bottom, left, right. Walk a side, then move that boundary inward.', 'Before walking the bottom row and the left column, re-check top <= bottom and left <= right.'],
  approach: `**Direction simulation:** walk with a direction vector, turning when you hit the edge or a visited cell (needs a visited matrix → O(m·n) extra space).

**Boundaries (preferred):** keep the unvisited rectangle [top..bottom] × [left..right]. Each loop peels one layer in four sides. The re-checks prevent double-visiting a single remaining row or column in rectangular matrices.`,

  functionName: 'spiralOrder',
  paramNames: ['matrix'],
  starterCode: `/**
 * @param {number[][]} matrix
 * @return {number[]}
 */
function spiralOrder(matrix) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: a 3 × 3 square ends in the centre.', args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [1, 2, 3, 6, 9, 8, 7, 4, 5] },
    { scenario: 'Example 2', hint: 'A wide 3 × 4 rectangle — the last layer is a single row.', args: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], expected: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7] },
    { scenario: 'Single cell', hint: 'A 1 × 1 matrix returns its only value.', args: [[[7]]], expected: [7] },
    { scenario: 'Single row', hint: 'Without the top <= bottom re-check, the row is walked back again and values are duplicated.', args: [[[1, 2, 3, 4]]], expected: [1, 2, 3, 4] },
    { scenario: 'Single column', hint: 'Without the left <= right re-check, the column is walked back up and duplicated.', args: [[[1], [2], [3]]], expected: [1, 2, 3] },
    { scenario: 'Two by two', hint: 'Smallest square with a full lap.', args: [[[1, 2], [3, 4]]], expected: [1, 2, 4, 3] },
    { scenario: 'Tall rectangle', hint: 'Only testing square matrices hides bugs — the inner layer here is a single column.', args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]], expected: [1, 2, 3, 6, 9, 12, 11, 10, 7, 4, 5, 8] },
    { scenario: 'Narrow tall rectangle', hint: 'Two columns, three rows: check the boundaries are updated after finishing each side.', args: [[[1, 2], [3, 4], [5, 6]]], expected: [1, 2, 4, 6, 5, 3] },
    { scenario: 'Wide two-row rectangle', hint: 'Two rows: after the bottom row, no left column remains to walk up.', args: [[[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]]], expected: [1, 2, 3, 4, 5, 10, 9, 8, 7, 6] },
    { scenario: 'Negative values', hint: 'Values may be negative or zero; use boundaries, not sentinel values, to stop.', args: [[[-1, -2, 0], [100, -100, 5]]], expected: [-1, -2, 0, 5, -100, 100] },
    { scenario: 'Four by four', hint: 'Two complete layers; updating a boundary before finishing the side that uses it skips cells.', args: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]], expected: [1, 2, 3, 4, 8, 12, 16, 15, 14, 13, 9, 5, 6, 7, 11, 10] },
    { scenario: 'Maximum size (10 × 10)', hint: 'The largest allowed square; five full layers.', argsGen: '() => [Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => r * 10 + c - 50))]', expected: [-50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -31, -21, -11, -1, 9, 19, 29, 39, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 30, 20, 10, 0, -10, -20, -30, -40, -39, -38, -37, -36, -35, -34, -33, -32, -22, -12, -2, 8, 18, 28, 38, 37, 36, 35, 34, 33, 32, 31, 21, 11, 1, -9, -19, -29, -28, -27, -26, -25, -24, -23, -13, -3, 7, 17, 27, 26, 25, 24, 23, 22, 12, 2, -8, -18, -17, -16, -15, -14, -4, 6, 16, 15, 14, 13, 3, -7, -6, -5, 5, 4] },
    { scenario: 'Maximum single row (1 × 10)', hint: 'A full-width single row must appear once, left to right.', args: [[[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { scenario: 'Maximum single column (10 × 1)', hint: 'A full-height single column must appear once, top to bottom.', args: [[[1], [2], [3], [4], [5], [6], [7], [8], [9], [10]]], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  ],

  solution: {
    code: `function spiralOrder(matrix) {
  const out = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);    // → top row
    top++;
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);  // ↓ right column
    right--;
    if (top <= bottom) {                                             // a bottom row still exists
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]); // ← bottom row
      bottom--;
    }
    if (left <= right) {                                             // a left column still exists
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);   // ↑ left column
      left++;
    }
  }
  return out;
}`,
  },
  dryRun: {
    columns: ['side', 'cells', 'boundaries after'],
    rows: [
      ['→ top', '1 2 3 4', 'top = 1'],
      ['↓ right', '8 12', 'right = 2'],
      ['← bottom', '11 10 9', 'bottom = 1'],
      ['↑ left', '5', 'left = 1'],
      ['→ top', '6 7', 'top = 2'],
      ['↓ right', '(none, top > bottom)', 'right = 1'],
      ['checks fail', 'stop', '—'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(1) extra', explanation: 'Every cell is pushed exactly once; the output array is not counted.' },
  alternative: {
    title: 'Direction vectors + visited matrix',
    md: 'Move with (dr, dc) and turn clockwise when the next cell is out of bounds or already visited. Easier to generalise, but uses O(m·n) extra memory.',
    code: `function spiralOrder(matrix) {
  const m = matrix.length, n = matrix[0].length;
  const seen = Array.from({ length: m }, () => new Array(n).fill(false));
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const out = [];
  let r = 0, c = 0, d = 0;
  for (let k = 0; k < m * n; k++) {
    out.push(matrix[r][c]);
    seen[r][c] = true;
    let nr = r + dirs[d][0], nc = c + dirs[d][1];
    if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) {
      d = (d + 1) % 4;
      nr = r + dirs[d][0]; nc = c + dirs[d][1];
    }
    r = nr; c = nc;
  }
  return out;
}`,
    complexity: 'O(m·n) time, O(m·n) space',
  },
  mistakes: ['Missing the top <= bottom / left <= right re-checks (duplicates on rectangles)', 'Only testing square matrices', 'Updating a boundary before finishing the side that uses it'],
};
