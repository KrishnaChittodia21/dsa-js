export default {
  id: 'maximal-rectangle',
  title: 'Maximal Rectangle',
  difficulty: 'Hard',
  order: 2,
  pattern: 'monotonic-stack-previous-smaller',
  tags: ['matrix', 'monotonic stack', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 85, url: 'https://leetcode.com/problems/maximal-rectangle/' },

  statement: `\`matrix\` is a grid of characters \`"0"\` and \`"1"\`. Return the area of the largest axis-aligned rectangle that contains **only** \`"1"\`s.`,
  examples: [
    { input: 'matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]', output: '6' },
    { input: 'matrix = [["0"]]', output: '0' },
    { input: 'matrix = [["1"]]', output: '1' },
  ],
  constraints: ['1 <= rows, cols <= 200', 'matrix[i][j] is "0" or "1"'],

  think: `- Fix the **bottom row** of the rectangle. For each column, how many consecutive 1s stand on top of that row (including it)?
- Those counts form a histogram. Which problem does that reduce to?
- How do you update the counts when you move down one row?`,
  patternChallenge: {
    options: ['BFS over the grid', 'Histogram per row + monotonic stack', '2-D prefix sums over all rectangles', 'Union-Find'],
    answer: 1,
    explanation: 'For each row as the base, column heights of consecutive 1s form a histogram; the largest all-1 rectangle on that base is the largest histogram rectangle. 2-D prefix sums can test a rectangle in O(1) but there are O(R²C²) rectangles.',
  },
  hints: [
    'heights[c] = (matrix[r][c] === "1") ? heights[c] + 1 : 0, updated row by row.',
    'After updating each row, run the Largest Rectangle in Histogram routine on heights and keep the maximum.',
  ],
  approach: `**Brute force:** try every rectangle and check it → O(R²C²) with 2-D prefix sums, worse without.

**Histogram per row (O(R · C)):** keep \`heights[c]\` = number of consecutive "1"s ending at the current row in column c (reset to 0 on a "0"). Every all-1 rectangle has some bottom row, and on that row it is a rectangle under the histogram. Run the monotonic-stack histogram algorithm (O(C)) for each row.`,

  functionName: 'maximalRectangle',
  paramNames: ['matrix'],
  starterCode: `/**
 * @param {character[][]} matrix
 * @return {number}
 */
function maximalRectangle(matrix) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The 2 × 3 block of 1s in rows 1–2 is the answer; treat each row as the base of a histogram.', args: [[['1', '0', '1', '0', '0'], ['1', '0', '1', '1', '1'], ['1', '1', '1', '1', '1'], ['1', '0', '0', '1', '0']]], expected: 6 },
    { scenario: 'Example 2', hint: 'A single "0" cell — no rectangle of 1s.', args: [[['0']]], expected: 0 },
    { scenario: 'Example 3', hint: 'A single "1" cell has area 1. Cells are strings — comparing with the number 1 fails.', args: [[['1']]], expected: 1 },
    { scenario: 'All ones 2 × 2', hint: 'The whole matrix is the rectangle.', args: [[['1', '1'], ['1', '1']]], expected: 4 },
    { scenario: 'Diagonal ones', hint: 'No two 1s are adjacent, so the best is a single cell.', args: [[['0', '1'], ['1', '0']]], expected: 1 },
    { scenario: 'Single row', hint: 'One row is just a histogram of heights 0/1 — the longest run of 1s.', args: [[['1', '1', '0', '1', '1', '1', '1']]], expected: 4 },
    { scenario: 'Single column', hint: 'A "0" must reset the column height to 0; otherwise the column looks taller than it is.', args: [[['1'], ['1'], ['0'], ['1']]], expected: 2 },
    { scenario: 'Height reset on zero', hint: 'The zero in row 2 breaks column 1; carrying its height through gives a too-large area.', args: [[['1', '1', '1'], ['1', '0', '1'], ['1', '1', '1']]], expected: 3 },
    { scenario: 'Best at the right edge', hint: 'The rectangle touches the last column — the histogram routine needs its sentinel/flush to measure it.', args: [[['0', '0', '1', '1'], ['0', '1', '1', '1'], ['0', '1', '1', '1']]], expected: 6 },
    { scenario: 'All zeros', hint: 'No 1s at all — answer 0.', args: [[['0', '0', '0'], ['0', '0', '0']]], expected: 0 },
    { scenario: 'Mixed 6 × 5', hint: 'Best is a 3 × 3 block that is neither at the top nor at the left.', args: [[['0', '1', '1', '0', '1'], ['1', '1', '0', '1', '0'], ['0', '1', '1', '1', '0'], ['1', '1', '1', '1', '0'], ['1', '1', '1', '1', '1'], ['0', '0', '0', '0', '0']]], expected: 9 },
    { scenario: 'All ones 200 × 200', hint: 'Area 40000 at the maximum size — heights must keep growing row after row up to 200.', argsGen: '() => [Array.from({ length: 200 }, () => new Array(200).fill(\'1\'))]', expected: 40000 },
    { scenario: 'Large random 200 × 200', hint: 'Dense random grid at the maximum size — O(R·C) with a stack per row.', argsGen: '() => { let s = 77; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 200 }, () => Array.from({ length: 200 }, () => (r() % 10 < 9 ? \'1\' : \'0\')))]; }', expected: 5016 },
  ],
  solution: {
    code: `function maximalRectangle(matrix) {
  const cols = matrix[0].length;
  const heights = new Array(cols).fill(0);
  let best = 0;

  const largestInHistogram = () => {
    const st = [];
    let area = 0;
    for (let i = 0; i <= cols; i++) {
      const h = i === cols ? 0 : heights[i];
      while (st.length && heights[st[st.length - 1]] >= h) {
        const height = heights[st.pop()];
        const left = st.length ? st[st.length - 1] : -1;
        area = Math.max(area, height * (i - left - 1));
      }
      st.push(i);
    }
    return area;
  };

  for (const row of matrix) {
    for (let c = 0; c < cols; c++) {
      heights[c] = row[c] === '1' ? heights[c] + 1 : 0;   // consecutive 1s ending here
    }
    best = Math.max(best, largestInHistogram());
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['row', 'heights', 'largest in histogram', 'best'],
    rows: [
      ['0', '[1,0,1,0,0]', '1', '1'],
      ['1', '[2,0,2,1,1]', '3', '3'],
      ['2', '[3,1,3,2,2]', '6', '6'],
      ['3', '[4,0,0,3,0]', '4', '6'],
    ],
  },
  complexity: { time: 'O(R · C)', space: 'O(C)', explanation: 'Each row updates C heights and runs an O(C) stack pass.' },
  alternative: {
    title: 'Left/right/height DP',
    md: 'Maintain for each column the height and the left/right limits of the widest rectangle of that height, updated row by row. Also O(R·C), with no stack.',
    complexity: 'O(R · C) time, O(C) space',
  },
  mistakes: [
    'Comparing with the number 1 instead of the string "1".',
    'Not resetting the height to 0 on a "0" cell.',
    'Forgetting the sentinel inside the histogram routine.',
  ],
};
