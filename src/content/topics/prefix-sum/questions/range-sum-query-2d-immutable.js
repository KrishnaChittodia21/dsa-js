// 200×200 pseudo-random matrix and 10^4 near-full regions; expected sums come from per-row prefix sums (O(m) per query).
const bigRegionOps = () => {
  let s = 4; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const m = 200, n = 200;
  const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => rnd(20001) - 10000));
  const row = matrix.map((r) => { const p = [0]; for (const x of r) p.push(p[p.length - 1] + x); return p; });
  const ops = ['NumMatrix'], args = [[matrix]], expected = [null];
  for (let i = 0; i < 10000; i++) {
    const r1 = rnd(4), c1 = rnd(4), r2 = m - 1 - rnd(4), c2 = n - 1 - rnd(4);
    let s = 0;
    for (let r = r1; r <= r2; r++) s += row[r][c2 + 1] - row[r][c1];
    ops.push('sumRegion'); args.push([r1, c1, r2, c2]); expected.push(s);
  }
  return { ops, args, expected };
};

export default {
  id: 'range-sum-query-2d-immutable',
  title: 'Range Sum Query 2D - Immutable',
  difficulty: 'Medium',
  order: 5,
  pattern: 'prefix-sum-2d',
  tags: ['matrix', 'prefix sum', 'design'],
  source: { platform: 'LeetCode', number: 304, url: 'https://leetcode.com/problems/range-sum-query-2d-immutable/' },
  kind: 'design',

  statement: `Design a class \`NumMatrix\`:

- \`new NumMatrix(matrix)\` stores a 2D integer matrix (it never changes).
- \`sumRegion(row1, col1, row2, col2)\` returns the sum of all cells inside the rectangle whose top-left corner is \`(row1, col1)\` and bottom-right corner is \`(row2, col2)\` (inclusive).

Each \`sumRegion\` call must run in **O(1)** time.`,
  examples: [
    {
      input: 'matrix = [[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]; sumRegion(2,1,4,3); sumRegion(1,1,2,2); sumRegion(1,2,2,4)',
      output: '[null, 8, 11, 12]',
    },
  ],
  constraints: ['1 <= m, n <= 200', '-10^4 <= matrix[i][j] <= 10^4', '0 <= row1 <= row2 < m', '0 <= col1 <= col2 < n', 'At most 10^4 calls to sumRegion'],

  think: `- In 1D, a range sum is a difference of two prefix sums. What is the 2D version of "sum of everything before this point"?
- Draw the query rectangle inside the big rectangle from (0, 0). Which pieces must you remove? Is anything removed twice?
- How do you build the table itself in O(m·n) using already-computed neighbours?`,
  patternChallenge: {
    options: ['Row-by-row loops per query', 'Sliding Window over rows', 'Segment Tree', 'Prefix Sum — 2D (inclusion–exclusion)'],
    answer: 3,
    explanation: 'An unchanging matrix with many rectangle queries → 2D prefix sums. Each query is four lookups. Looping over rows per query is O(m·n) or O(m); a segment tree is unnecessary without updates.',
  },
  hints: [
    'Let `P[r][c]` = sum of `matrix[0..r-1][0..c-1]`, with an extra zero row and column. Build: `P[r+1][c+1] = matrix[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]`.',
    'Query: `P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]`.',
  ],
  approach: `**Naive:** loop over the rectangle per query → O(m·n) per query.

**Row prefix sums:** a 1D prefix per row → O(m) per query.

**2D prefix sums (O(1) per query):**
- \`P[r][c]\` = sum of the rectangle \`(0,0)\`–\`(r−1, c−1)\`. The extra zero row/column removes all edge cases.
- **Build** with inclusion–exclusion: the cell, plus the rectangle above, plus the rectangle to the left, minus their overlap.
- **Query** \`(r1,c1)\`–\`(r2,c2)\`: the big rectangle, minus the strip above (rows < r1), minus the strip to the left (cols < c1), plus the top-left corner that was subtracted twice.`,

  className: 'NumMatrix',
  starterCode: `class NumMatrix {
  /**
   * @param {number[][]} matrix
   */
  constructor(matrix) {
    
  }

  /**
   * @param {number} row1
   * @param {number} col1
   * @param {number} row2
   * @param {number} col2
   * @return {number}
   */
  sumRegion(row1, col1, row2, col2) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Three regions of the 5×5 example; each is P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1].', ops: ['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], args: [[[[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]]], [2, 1, 4, 3], [1, 1, 2, 2], [1, 2, 2, 4]], expected: [null, 8, 11, 12] },
    { scenario: 'Single cell matrix', hint: 'Smallest input: the region is the one cell.', ops: ['NumMatrix', 'sumRegion'], args: [[[[5]]], [0, 0, 0, 0]], expected: [null, 5] },
    { scenario: 'Single row', hint: 'A 1×n matrix — regions are row ranges.', ops: ['NumMatrix', 'sumRegion', 'sumRegion'], args: [[[[1, 2, 3]]], [0, 0, 0, 2], [0, 1, 0, 1]], expected: [null, 6, 2] },
    { scenario: 'Single column', hint: 'An m×1 matrix — regions are column ranges.', ops: ['NumMatrix', 'sumRegion', 'sumRegion'], args: [[[[1], [2], [3]]], [0, 0, 2, 0], [1, 0, 2, 0]], expected: [null, 6, 5] },
    { scenario: 'Negative values', hint: 'All-negative cells; the inclusion–exclusion signs must be right.', ops: ['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], args: [[[[-1, -2], [-3, -4]]], [0, 0, 1, 1], [1, 1, 1, 1], [0, 1, 1, 1]], expected: [null, -10, -4, -6] },
    { scenario: 'Whole matrix and last cell', hint: 'Using P[r2][c2] instead of P[r2+1][c2+1] drops the last row and column.', ops: ['NumMatrix', 'sumRegion', 'sumRegion'], args: [[[[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]]], [0, 0, 4, 4], [4, 4, 4, 4]], expected: [null, 58, 5] },
    { scenario: 'Region not at origin', hint: 'Forgetting to add back P[r1][c1] subtracts the top-left block twice.', ops: ['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], args: [[[[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]]], [1, 1, 3, 3], [2, 2, 4, 4], [3, 1, 4, 2]], expected: [null, 16, 22, 4] },
    { scenario: 'Shared row arrays bug', hint: 'fill(new Array(...)) makes every prefix row the same object — every row then holds the last row\'s values.', ops: ['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], args: [[[[1, 2], [3, 4], [5, 6]]], [0, 0, 0, 1], [1, 0, 2, 1], [0, 1, 2, 1]], expected: [null, 3, 18, 12] },
    { scenario: 'First row and column', hint: 'Regions touching row 0 or column 0 use the zero padding.', ops: ['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], args: [[[[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]]], [0, 0, 0, 0], [0, 0, 4, 0], [0, 0, 0, 4]], expected: [null, 3, 14, 10] },
    { scenario: 'Zeros cancel', hint: 'Positive and negative values cancel to 0.', ops: ['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], args: [[[[10000, -10000], [-10000, 10000]]], [0, 0, 1, 1], [0, 0, 0, 1], [0, 0, 1, 0]], expected: [null, 0, 0, 0] },
    { scenario: 'Random 8×9, many queries', hint: 'Random values at the ±10^4 bounds and 30 random regions.', ops: ['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion', 'sumRegion'], args: [[[[3434, -3974, -8489, -1957, 2084, 45, -985, 573, 3682], [-4058, 9763, 1887, 6374, -6818, -1368, -9890, 7276, -4268], [1764, 3245, -2796, 2220, -7942, -3562, -593, -3628, 5928], [-19, 1470, -4408, -6480, -9485, 1722, 7134, 3331, 4355], [-7409, -1652, 8163, 702, 8629, 3509, -1794, 5555, 5781], [3137, 4665, -1733, -3511, -8219, -6733, 8540, 120, -5932], [-3987, 6805, 6085, -1791, -6410, -8908, -2324, -9914, -1663], [-1524, -4252, -6443, 6049, -4396, 2992, 5959, 9083, -9736]]], [0, 1, 0, 6], [0, 0, 0, 8], [0, 1, 1, 8], [0, 1, 0, 3], [0, 3, 0, 8], [0, 1, 0, 6], [0, 0, 0, 4], [0, 1, 0, 8], [0, 1, 0, 1], [0, 3, 0, 6], [0, 5, 0, 6], [0, 2, 0, 6], [0, 0, 0, 6], [0, 4, 0, 7], [0, 1, 0, 2], [0, 2, 0, 8], [0, 0, 0, 3], [0, 3, 0, 6], [0, 0, 0, 4], [0, 1, 0, 2], [0, 1, 0, 4], [0, 2, 0, 5], [0, 1, 0, 3], [0, 0, 0, 2], [0, 2, 0, 5], [0, 3, 0, 3], [0, 0, 0, 2], [0, 2, 0, 4], [0, 3, 0, 8], [0, 5, 0, 8]], expected: [null, -13276, -5587, -6065, -14420, 3442, -13276, -8902, -9021, -3974, -813, -940, -9302, -9842, 1717, -12463, -5047, -10986, -813, -8902, -12463, -12336, -8317, -14420, -9029, -8317, -1957, -9029, -8362, 3442, 3315] },
    { scenario: 'Large (200×200, 10^4 queries)', hint: 'Summing every cell of a ~200×200 region per call is ~4·10^8 additions in total. Build the 2D prefix table once so each sumRegion is O(1).', opsGen: String(bigRegionOps), timeLimitMs: 150 },
  ],

  solution: {
    code: `class NumMatrix {
  constructor(matrix) {
    const m = matrix.length, n = matrix[0].length;
    // P[r][c] = sum of matrix[0..r-1][0..c-1]; row 0 and column 0 are zeros.
    // Array.from gives each row its OWN array (fill(new Array()) would share one).
    this.P = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        this.P[r + 1][c + 1] = matrix[r][c] + this.P[r][c + 1] + this.P[r + 1][c] - this.P[r][c];
      }
    }
  }

  sumRegion(row1, col1, row2, col2) {
    const P = this.P;
    return P[row2 + 1][col2 + 1] - P[row1][col2 + 1] - P[row2 + 1][col1] + P[row1][col1];
  }
}`,
  },
  dryRun: `Query \`(1,1)\`–\`(2,2)\` on the example:

| term | value | meaning |
|---|---|---|
| P[3][3] | 3+0+1 + 5+6+3 + 1+2+0 = 21 | rows 0..2, cols 0..2 |
| − P[1][3] | 3+0+1 = 4 | row 0 strip |
| − P[3][1] | 3+5+1 = 9 | column 0 strip |
| + P[1][1] | 3 | corner removed twice |

21 − 4 − 9 + 3 = **11** (= 6 + 3 + 2 + 0).`,
  complexity: { time: 'O(m·n) build, O(1) per query', space: 'O(m·n)', explanation: 'One pass over the matrix to build P; each query reads four entries.' },
  alternative: {
    title: 'Per-row prefix sums',
    md: 'Keep a 1D prefix array for each row; a query sums `rowPrefix[r][c2+1] − rowPrefix[r][c1]` over rows r1..r2. O(m) per query — simpler, and a good stepping stone to the 2D version.',
    complexity: 'O(m·n) build, O(m) per query',
  },
  mistakes: [
    'Forgetting to add back `P[r1][c1]`.',
    '`new Array(m + 1).fill(new Array(n + 1).fill(0))` — every row is the same array object.',
    'Using `P[r2][c2]` instead of `P[r2 + 1][c2 + 1]` with the padded convention.',
  ],
};
