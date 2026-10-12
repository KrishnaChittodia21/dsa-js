export default {
  id: 'pascals-triangle',
  title: "Pascal's Triangle",
  difficulty: 'Easy',
  order: 1,
  pattern: 'dp-2d-grid',
  tags: ['array', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 118, url: 'https://leetcode.com/problems/pascals-triangle/' },

  statement: `Build the first \`numRows\` rows of **Pascal's triangle** and return them as an array of arrays.

Row 0 is \`[1]\`. Every following row starts and ends with \`1\`, and every inner number is the sum of the two numbers directly above it (the one above-left and the one above-right).`,
  examples: [
    { input: 'numRows = 5', output: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]', explanation: '6 in the last row = 3 + 3 from the row above.' },
    { input: 'numRows = 1', output: '[[1]]' },
  ],
  constraints: ['1 <= numRows <= 30'],

  think: `- Which previous values does \`row[i][j]\` need?
- Which cells have no "two parents" and need a base value?
- Does row i need anything except row i − 1?`,
  patternChallenge: {
    options: ['Backtracking', 'Grid DP — each cell from the cells above it', 'Two pointers', 'Binary search'],
    answer: 1,
    explanation: 'Each value is defined from already-computed values in the previous row: a textbook table fill. Nothing is being searched or enumerated.',
  },
  hints: [
    'Start each row with 1; for inner positions j add prev[j − 1] + prev[j]; end with 1.',
    'Loop i from 1 to numRows − 1, using the last row pushed as prev.',
  ],
  approach: `**Brute force:** compute each entry as the binomial coefficient C(i, j) with factorials — works for small rows but factorials overflow quickly and it hides the structure.

**DP:** \`row[i][j] = row[i−1][j−1] + row[i−1][j]\` with \`row[i][0] = row[i][i] = 1\`. Fill row by row — each row only depends on the previous one, so the order is simply top to bottom. This is the smallest possible 2D DP: state (row, position), transition from the two cells above.`,

  functionName: 'generate',
  paramNames: ['numRows'],
  starterCode: `/**
 * @param {number} numRows
 * @return {number[][]}
 */
function generate(numRows) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: five rows.', args: [5], expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]] },
    { scenario: 'Example 2', hint: 'One row is just [[1]] — do not add a right-edge 1 to row 0.', args: [1], expected: [[1]] },
    { scenario: 'Two rows', hint: 'Row 1 is [1,1]: both edges are 1 and there is no interior.', args: [2], expected: [[1], [1, 1]] },
    { scenario: 'Three rows', hint: 'The first interior value: 1 + 1 = 2.', args: [3], expected: [[1], [1, 1], [1, 2, 1]] },
    { scenario: 'Four rows', hint: 'Return every row, not just the last one.', args: [4], expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]] },
    { scenario: 'Six rows', hint: 'Interior values come from the previous row — updating it in place reads already-changed values.', args: [6], expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1]] },
    { scenario: 'Seven rows', hint: 'The middle value 20 = 10 + 10.', args: [7], expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1], [1, 6, 15, 20, 15, 6, 1]] },
    { scenario: 'Ten rows', hint: 'Row 9 peaks at 126.', args: [10], expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1], [1, 6, 15, 20, 15, 6, 1], [1, 7, 21, 35, 35, 21, 7, 1], [1, 8, 28, 56, 70, 56, 28, 8, 1], [1, 9, 36, 84, 126, 126, 84, 36, 9, 1]] },
    { scenario: 'Thirteen rows', hint: 'Values reach the hundreds — still exact integers.', args: [13], expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1], [1, 6, 15, 20, 15, 6, 1], [1, 7, 21, 35, 35, 21, 7, 1], [1, 8, 28, 56, 70, 56, 28, 8, 1], [1, 9, 36, 84, 126, 126, 84, 36, 9, 1], [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1], [1, 11, 55, 165, 330, 462, 462, 330, 165, 55, 11, 1], [1, 12, 66, 220, 495, 792, 924, 792, 495, 220, 66, 12, 1]] },
    { scenario: 'Twenty rows', hint: 'The middle of row 19 is 92 378.', args: [20], expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1], [1, 6, 15, 20, 15, 6, 1], [1, 7, 21, 35, 35, 21, 7, 1], [1, 8, 28, 56, 70, 56, 28, 8, 1], [1, 9, 36, 84, 126, 126, 84, 36, 9, 1], [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1], [1, 11, 55, 165, 330, 462, 462, 330, 165, 55, 11, 1], [1, 12, 66, 220, 495, 792, 924, 792, 495, 220, 66, 12, 1], [1, 13, 78, 286, 715, 1287, 1716, 1716, 1287, 715, 286, 78, 13, 1], [1, 14, 91, 364, 1001, 2002, 3003, 3432, 3003, 2002, 1001, 364, 91, 14, 1], [1, 15, 105, 455, 1365, 3003, 5005, 6435, 6435, 5005, 3003, 1365, 455, 105, 15, 1], [1, 16, 120, 560, 1820, 4368, 8008, 11440, 12870, 11440, 8008, 4368, 1820, 560, 120, 16, 1], [1, 17, 136, 680, 2380, 6188, 12376, 19448, 24310, 24310, 19448, 12376, 6188, 2380, 680, 136, 17, 1], [1, 18, 153, 816, 3060, 8568, 18564, 31824, 43758, 48620, 43758, 31824, 18564, 8568, 3060, 816, 153, 18, 1], [1, 19, 171, 969, 3876, 11628, 27132, 50388, 75582, 92378, 92378, 75582, 50388, 27132, 11628, 3876, 969, 171, 19, 1]] },
    { scenario: 'Maximum rows (30)', hint: 'Largest input: the middle of row 29 is 77 558 760 — still a safe integer.', args: [30], expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1], [1, 6, 15, 20, 15, 6, 1], [1, 7, 21, 35, 35, 21, 7, 1], [1, 8, 28, 56, 70, 56, 28, 8, 1], [1, 9, 36, 84, 126, 126, 84, 36, 9, 1], [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1], [1, 11, 55, 165, 330, 462, 462, 330, 165, 55, 11, 1], [1, 12, 66, 220, 495, 792, 924, 792, 495, 220, 66, 12, 1], [1, 13, 78, 286, 715, 1287, 1716, 1716, 1287, 715, 286, 78, 13, 1], [1, 14, 91, 364, 1001, 2002, 3003, 3432, 3003, 2002, 1001, 364, 91, 14, 1], [1, 15, 105, 455, 1365, 3003, 5005, 6435, 6435, 5005, 3003, 1365, 455, 105, 15, 1], [1, 16, 120, 560, 1820, 4368, 8008, 11440, 12870, 11440, 8008, 4368, 1820, 560, 120, 16, 1], [1, 17, 136, 680, 2380, 6188, 12376, 19448, 24310, 24310, 19448, 12376, 6188, 2380, 680, 136, 17, 1], [1, 18, 153, 816, 3060, 8568, 18564, 31824, 43758, 48620, 43758, 31824, 18564, 8568, 3060, 816, 153, 18, 1], [1, 19, 171, 969, 3876, 11628, 27132, 50388, 75582, 92378, 92378, 75582, 50388, 27132, 11628, 3876, 969, 171, 19, 1], [1, 20, 190, 1140, 4845, 15504, 38760, 77520, 125970, 167960, 184756, 167960, 125970, 77520, 38760, 15504, 4845, 1140, 190, 20, 1], [1, 21, 210, 1330, 5985, 20349, 54264, 116280, 203490, 293930, 352716, 352716, 293930, 203490, 116280, 54264, 20349, 5985, 1330, 210, 21, 1], [1, 22, 231, 1540, 7315, 26334, 74613, 170544, 319770, 497420, 646646, 705432, 646646, 497420, 319770, 170544, 74613, 26334, 7315, 1540, 231, 22, 1], [1, 23, 253, 1771, 8855, 33649, 100947, 245157, 490314, 817190, 1144066, 1352078, 1352078, 1144066, 817190, 490314, 245157, 100947, 33649, 8855, 1771, 253, 23, 1], [1, 24, 276, 2024, 10626, 42504, 134596, 346104, 735471, 1307504, 1961256, 2496144, 2704156, 2496144, 1961256, 1307504, 735471, 346104, 134596, 42504, 10626, 2024, 276, 24, 1], [1, 25, 300, 2300, 12650, 53130, 177100, 480700, 1081575, 2042975, 3268760, 4457400, 5200300, 5200300, 4457400, 3268760, 2042975, 1081575, 480700, 177100, 53130, 12650, 2300, 300, 25, 1], [1, 26, 325, 2600, 14950, 65780, 230230, 657800, 1562275, 3124550, 5311735, 7726160, 9657700, 10400600, 9657700, 7726160, 5311735, 3124550, 1562275, 657800, 230230, 65780, 14950, 2600, 325, 26, 1], [1, 27, 351, 2925, 17550, 80730, 296010, 888030, 2220075, 4686825, 8436285, 13037895, 17383860, 20058300, 20058300, 17383860, 13037895, 8436285, 4686825, 2220075, 888030, 296010, 80730, 17550, 2925, 351, 27, 1], [1, 28, 378, 3276, 20475, 98280, 376740, 1184040, 3108105, 6906900, 13123110, 21474180, 30421755, 37442160, 40116600, 37442160, 30421755, 21474180, 13123110, 6906900, 3108105, 1184040, 376740, 98280, 20475, 3276, 378, 28, 1], [1, 29, 406, 3654, 23751, 118755, 475020, 1560780, 4292145, 10015005, 20030010, 34597290, 51895935, 67863915, 77558760, 77558760, 67863915, 51895935, 34597290, 20030010, 10015005, 4292145, 1560780, 475020, 118755, 23751, 3654, 406, 29, 1]] },
  ],

  solution: {
    code: `function generate(numRows) {
  const rows = [[1]];
  for (let i = 1; i < numRows; i++) {
    const prev = rows[i - 1];
    const row = [1];                         // left edge
    for (let j = 1; j < i; j++) row.push(prev[j - 1] + prev[j]);
    row.push(1);                             // right edge
    rows.push(row);
  }
  return rows;
}`,
  },
  dryRun: {
    columns: ['i', 'prev', 'inner sums', 'row'],
    rows: [
      ['1', '[1]', '—', '[1, 1]'],
      ['2', '[1, 1]', '1+1', '[1, 2, 1]'],
      ['3', '[1, 2, 1]', '1+2, 2+1', '[1, 3, 3, 1]'],
      ['4', '[1, 3, 3, 1]', '1+3, 3+3, 3+1', '[1, 4, 6, 4, 1]'],
    ],
  },
  complexity: { time: 'O(numRows²)', space: 'O(numRows²) for the output', explanation: 'Row i has i + 1 entries, each O(1); the total is 1 + 2 + … + n. The output itself is that big, so no extra space beyond it.' },
  alternative: {
    title: 'Binomial coefficients, row by row',
    md: 'Row i is C(i,0), C(i,1), …; compute each from the previous one with C(i,j) = C(i,j−1) · (i − j + 1) / j. Same complexity, no dependency on the previous row — handy for "Pascal\'s Triangle II" (only one row, O(k) space).',
    code: `function getRow(i) {
  const row = [1];
  for (let j = 1; j <= i; j++) row.push(row[j - 1] * (i - j + 1) / j);
  return row;
}`,
    complexity: 'O(k) per row',
  },
  mistakes: [
    'Pushing the right edge 1 for row 0, producing [1, 1] as the first row.',
    'Mutating prev while computing the new row in place (read old values after they changed).',
    'Returning only the last row instead of all rows.',
  ],
};
