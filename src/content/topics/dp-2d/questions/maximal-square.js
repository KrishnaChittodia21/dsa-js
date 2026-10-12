export default {
  id: 'maximal-square',
  title: 'Maximal Square',
  difficulty: 'Medium',
  order: 10,
  pattern: 'dp-2d-grid',
  tags: ['array', 'dynamic programming', 'matrix'],
  source: { platform: 'LeetCode', number: 221, url: 'https://leetcode.com/problems/maximal-square/' },

  statement: `You are given an \`m × n\` binary matrix whose cells are the **strings** \`"0"\` and \`"1"\`. Find the largest square that contains only \`"1"\`s and return its **area**.`,
  examples: [
    { input: 'matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]', output: '4', explanation: 'A 2 × 2 square of 1s (rows 1–2, columns 2–3 or 3–4).' },
    { input: 'matrix = [["0","1"],["1","0"]]', output: '1' },
    { input: 'matrix = [["0"]]', output: '0' },
  ],
  constraints: ['1 <= m, n <= 300', 'matrix[r][c] is "0" or "1"'],

  think: `- Instead of "largest square anywhere", ask "largest square whose bottom-right corner is exactly here". Why is that easier?
- If a 3 × 3 square ends at (r, c), what squares must end at its top, left and top-left neighbours?
- The answer is the side squared — where is the largest side?`,
  patternChallenge: {
    options: ['Grid DP — side of the largest square ending at each cell', 'Prefix sums over every square', 'DFS flood fill', 'Monotonic stack only'],
    answer: 0,
    explanation: 'Anchoring the square at its bottom-right corner gives a local recurrence from three neighbours. Prefix sums can test a square in O(1) but must still try O(mn·min(m,n)) squares; flood fill finds regions, not squares.',
  },
  hints: [
    'dp[r][c] = side of the largest all-1 square with bottom-right corner (r, c); 0 if the cell is "0".',
    'For a "1": dp[r][c] = 1 + min(top, left, top-left). Track the maximum side and return side².',
  ],
  approach: `**Brute force:** for each cell as the top-left corner, grow the square while its new row and column are all 1s — up to O((mn)²).

**DP:** a square of side k ending at (r, c) requires squares of side k−1 ending at (r−1, c), (r, c−1) and (r−1, c−1) — together they cover everything except the corner itself. Conversely, if all three support k−1, the corner completes a k-square. So \`dp[r][c] = 1 + min(top, left, topLeft)\`.

**Space:** one row plus a saved \`prevDiag\` (the old dp[c−1]) — exactly like edit distance.`,

  functionName: 'maximalSquare',
  paramNames: ['matrix'],
  starterCode: `/**
 * @param {character[][]} matrix
 * @return {number}
 */
function maximalSquare(matrix) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: a 2×2 square of 1s → area 4.', args: [[["1", "0", "1", "0", "0"], ["1", "0", "1", "1", "1"], ["1", "1", "1", "1", "1"], ["1", "0", "0", "1", "0"]]], expected: 4 },
    { scenario: 'Example 2', hint: 'No 2×2 block — the largest square is a single 1.', args: [[["0", "1"], ["1", "0"]]], expected: 1 },
    { scenario: 'Example 3', hint: 'No 1 at all → 0.', args: [[["0"]]], expected: 0 },
    { scenario: 'Single one', hint: 'Cells are the strings "0"/"1" — comparing with the number 1 never matches.', args: [[["1"]]], expected: 1 },
    { scenario: 'Whole 2×2 grid', hint: 'The full grid is the square.', args: [[["1", "1"], ["1", "1"]]], expected: 4 },
    { scenario: 'Single row of ones', hint: 'A 1×4 strip only fits 1×1 squares.', args: [[["1", "1", "1", "1"]]], expected: 1 },
    { scenario: 'Single column', hint: 'A column strip only fits 1×1 squares.', args: [[["1"], ["1"], ["0"], ["1"]]], expected: 1 },
    { scenario: 'Area not side', hint: 'A 3×3 square → return 9 (the area), not 3.', args: [[["1", "1", "1"], ["1", "1", "1"], ["1", "1", "1"]]], expected: 9 },
    { scenario: 'Missing corner', hint: 'One neighbour is 0 → min(top, left, diag) keeps it at 1. Taking max gives 4.', args: [[["1", "1"], ["1", "0"]]], expected: 1 },
    { scenario: 'Square at bottom-right', hint: 'The 3×3 square is not anchored at (0,0).', args: [[["1", "1", "0", "1"], ["1", "1", "1", "1"], ["0", "1", "1", "1"], ["1", "1", "1", "1"]]], expected: 9 },
    { scenario: 'All zeros', hint: 'Nothing to find → 0.', args: [[["0", "0"], ["0", "0"]]], expected: 0 },
    { scenario: 'Rectangle of ones', hint: 'A 2×4 block of 1s fits only a 2×2 square.', args: [[["0", "0", "0", "0", "0"], ["0", "1", "1", "1", "1"], ["0", "1", "1", "1", "1"]]], expected: 4 },
    { scenario: 'Large input (300×300, all 1s)', hint: 'Growing a square from every cell and re-checking it is far too slow here; dp = 1 + min(top, left, diag) is O(m·n).', argsGen: '() => [Array.from({ length: 300 }, () => new Array(300).fill(\'1\'))]', expected: 90000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maximalSquare(matrix) {
  const n = matrix[0].length;
  const dp = new Array(n + 1).fill(0);      // dp[c+1] = side ending at (r, c); dp[0] is a 0 sentinel
  let best = 0;
  for (const row of matrix) {
    let prevDiag = 0;                        // old dp[c] = top-left for the next column
    for (let c = 0; c < n; c++) {
      const top = dp[c + 1];                 // still row r-1
      if (row[c] === '1') {
        dp[c + 1] = 1 + Math.min(top, dp[c] /* left */, prevDiag);
        best = Math.max(best, dp[c + 1]);
      } else {
        dp[c + 1] = 0;
      }
      prevDiag = top;
    }
  }
  return best * best;
}`,
    explanation: 'The cells are strings: compare with "1", not 1.',
  },
  dryRun: {
    columns: ['row', 'dp (sides) after row', 'best side'],
    rows: [
      ['0: 1 0 1 0 0', '[1, 0, 1, 0, 0]', '1'],
      ['1: 1 0 1 1 1', '[1, 0, 1, 1, 1]', '1'],
      ['2: 1 1 1 1 1', '[1, 1, 1, 2, 2]', '2'],
      ['3: 1 0 0 1 0', '[1, 0, 0, 1, 0]', '2 → area 4'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(n)', explanation: 'Each cell once; one row plus one saved diagonal.' },
  alternative: {
    title: 'Full 2D table with padding',
    md: 'dp of size (m+1) × (n+1), dp[r+1][c+1] = 1 + min(dp[r][c+1], dp[r+1][c], dp[r][c]) for "1" cells. Clearer, O(m·n) space.',
    complexity: 'O(m·n) time and space',
  },
  mistakes: [
    'Returning the side instead of the area.',
    'Comparing with the number 1 — the cells are strings.',
    'Using max instead of min of the three neighbours.',
    'In the 1D version, losing the top-left value when overwriting.',
  ],
};
