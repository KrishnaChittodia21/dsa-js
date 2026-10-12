export default {
  id: 'number-of-submatrices-that-sum-to-target',
  title: 'Number of Submatrices That Sum to Target',
  difficulty: 'Hard',
  order: 1,
  pattern: 'prefix-sum-2d',
  tags: ['matrix', 'hash map', 'prefix sum'],
  source: { platform: 'LeetCode', number: 1074, url: 'https://leetcode.com/problems/number-of-submatrices-that-sum-to-target/' },

  statement: `Given a matrix of integers (values may be negative) and an integer \`target\`, return the number of **non-empty submatrices** whose elements sum to \`target\`.

A submatrix is any rectangle \`(x1, y1)\`–\`(x2, y2)\` with \`x1 <= x2\` and \`y1 <= y2\`. Two submatrices are different if any of their corner coordinates differ.`,
  examples: [
    { input: 'matrix = [[0,1,0],[1,1,1],[0,1,0]], target = 0', output: '4', explanation: 'The four 1×1 cells containing 0.' },
    { input: 'matrix = [[1,-1],[-1,1]], target = 0', output: '5', explanation: 'Two 1×2, two 2×1 and one 2×2 submatrix.' },
    { input: 'matrix = [[904]], target = 0', output: '0' },
  ],
  constraints: ['1 <= rows, cols <= 100', '-1000 <= matrix[i][j] <= 1000', '-10^8 <= target <= 10^8'],

  think: `- There are O(m²·n²) rectangles. Even with O(1) sums from a 2D prefix table, is that fast enough for 100×100?
- Fix a top row and a bottom row. What does every rectangle between them look like if you "squash" the rows into one?
- After squashing, you have a 1D array and need the number of subarrays with sum \`target\`. Which technique is that?`,
  patternChallenge: {
    options: ['2D prefix sum + check every rectangle', 'Sliding window over columns', 'Fix two rows, collapse to 1D, then Prefix Sum + HashMap', 'Dynamic Programming on cells'],
    answer: 2,
    explanation: 'Checking every rectangle is O(m²n²) = 10^8 with 2D prefix sums — too slow in practice. Fixing a pair of rows reduces the problem to "count subarrays with sum target" on column sums, which the prefix-sum hash map solves in O(n). Negatives rule out a sliding window.',
  },
  hints: [
    'For every pair of rows `top ≤ bottom`, let `colSum[c]` = sum of `matrix[top..bottom][c]`. Update it incrementally as `bottom` grows.',
    'On `colSum`, count subarrays with sum `target` using a Map of prefix counts seeded with `{0: 1}` (exactly Subarray Sum Equals K).',
  ],
  approach: `**Brute force:** enumerate all O(m²n²) rectangles and sum each → O(m³n³). With a 2D prefix table each sum is O(1) → O(m²n²) ≈ 10^8 for 100×100: slow.

**Row pairs + 1D prefix hash map (O(m² · n)):**
1. For each \`top\` row, reset \`colSum\` to zeros.
2. For each \`bottom\` from \`top\` down: add row \`bottom\` into \`colSum\`. Now \`colSum[c]\` is the sum of column \`c\` between \`top\` and \`bottom\`.
3. A rectangle with rows \`top..bottom\` and columns \`l..r\` has sum \`colSum[l] + … + colSum[r]\` — a subarray of \`colSum\`. Count subarrays with sum \`target\` using the prefix-sum map (seeded \`{0: 1}\`, look up before insert).

If there are more columns than rows, iterate over column pairs instead to get O(min(m,n)² · max(m,n)).`,

  functionName: 'numSubmatrixSumTarget',
  paramNames: ['matrix', 'target'],
  starterCode: `/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {number}
 */
function numSubmatrixSumTarget(matrix, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Only the four 0 cells sum to 0.', args: [[[0, 1, 0], [1, 1, 1], [0, 1, 0]], 0], expected: 4 },
    { scenario: 'Example 2', hint: 'Negatives cancel: two 1×2, two 2×1 and the whole 2×2 sum to 0.', args: [[[1, -1], [-1, 1]], 0], expected: 5 },
    { scenario: 'Example 3', hint: 'A single non-zero cell never sums to 0.', args: [[[904]], 0], expected: 0 },
    { scenario: 'Single cell match', hint: 'Smallest input where the only submatrix matches.', args: [[[5]], 5], expected: 1 },
    { scenario: 'All ones 2×2', hint: 'The four 1×2 / 2×1 rectangles sum to 2.', args: [[[1, 1], [1, 1]], 2], expected: 4 },
    { scenario: 'All zeros, target 0', hint: 'Every one of the 9 submatrices of a 2×2 zero matrix counts.', args: [[[0, 0], [0, 0]], 0], expected: 9 },
    { scenario: 'Single row', hint: 'Rectangles starting at column 0 need the {0: 1} seed in the hash map.', args: [[[1, 2, 3]], 3], expected: 2 },
    { scenario: 'Single column', hint: 'A one-column matrix: only vertical strips.', args: [[[1], [2], [3]], 5], expected: 1 },
    { scenario: 'Reset map per row pair', hint: 'Reusing the hash map across (top, bottom) pairs counts phantom rectangles.', args: [[[1, 2], [3, -3], [2, 1]], 3], expected: 5 },
    { scenario: 'No match', hint: 'Target is unreachable — answer 0.', args: [[[1, 2], [3, 4]], 100], expected: 0 },
    { scenario: 'Negative target', hint: 'Targets can be negative.', args: [[[-1, -2, 3], [4, -5, -1]], -3], expected: 1 },
    { scenario: 'Value bounds', hint: 'Values at ±1000.', args: [[[1000, -1000, 1000], [-1000, 1000, -1000]], 1000], expected: 4 },
    { scenario: 'Max size, zeros (100×100)', hint: 'Every submatrix of a 100×100 zero matrix sums to 0 — about 2.6·10^7 of them.', argsGen: '() => [Array.from({ length: 100 }, () => new Array(100).fill(0)), 0]', expected: 25502500 },
    { scenario: 'Max size, random (100×100)', hint: 'Random small values at the maximum size; count with prefix sums + hash map per row pair.', argsGen: '() => { let s = 1; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => (r() % 7) - 3)), 2]; }', expected: 305920 },
  ],

  solution: {
    code: `function numSubmatrixSumTarget(matrix, target) {
  const m = matrix.length, n = matrix[0].length;
  let total = 0;
  for (let top = 0; top < m; top++) {
    const colSum = new Array(n).fill(0);
    for (let bottom = top; bottom < m; bottom++) {
      for (let c = 0; c < n; c++) colSum[c] += matrix[bottom][c]; // squash rows top..bottom

      // Count subarrays of colSum with sum === target (Subarray Sum Equals K).
      const seen = new Map([[0, 1]]);
      let cur = 0;
      for (let c = 0; c < n; c++) {
        cur += colSum[c];
        total += seen.get(cur - target) ?? 0;
        seen.set(cur, (seen.get(cur) ?? 0) + 1);
      }
    }
  }
  return total;
}`,
    explanation: '`colSum` is updated incrementally (add one row) rather than recomputed, so each (top, bottom) pair costs O(n).',
  },
  dryRun: `\`matrix = [[1,-1],[-1,1]]\`, target 0

| top..bottom | colSum | prefixes (with 0) | subarrays with sum 0 |
|---|---|---|---|
| 0..0 | [1, -1] | 0, 1, 0 | [1,-1] → 1 |
| 0..1 | [0, 0] | 0, 0, 0 | [0], [0], [0,0] → 3 |
| 1..1 | [-1, 1] | 0, -1, 0 | [-1,1] → 1 |

Total **5**.`,
  complexity: { time: 'O(m² · n)', space: 'O(n)', explanation: 'm(m+1)/2 row pairs, each with an O(n) column update and an O(n) hash-map pass.' },
  alternative: {
    title: '2D prefix sums + every rectangle',
    md: 'Build a 2D prefix table and test all rectangles with four lookups each. O(m² · n²) — about 2.5·10^7 rectangles for 100×100 (each with a few operations). A useful stepping stone, but the row-pair reduction is the intended solution.',
    complexity: 'O(m² · n²) time, O(m · n) space',
  },
  mistakes: [
    'Recomputing column sums from scratch for each (top, bottom) pair → an extra factor of m.',
    'Reusing the same hash map across row pairs — it must be reset for each pair.',
    'Forgetting the `{0: 1}` seed, which misses rectangles starting at column 0.',
  ],
};
