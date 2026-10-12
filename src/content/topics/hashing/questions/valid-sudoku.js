const VALID = [
  ['5', '3', '.', '.', '7', '.', '.', '.', '.'],
  ['6', '.', '.', '1', '9', '5', '.', '.', '.'],
  ['.', '9', '8', '.', '.', '.', '.', '6', '.'],
  ['8', '.', '.', '.', '6', '.', '.', '.', '3'],
  ['4', '.', '.', '8', '.', '3', '.', '.', '1'],
  ['7', '.', '.', '.', '2', '.', '.', '.', '6'],
  ['.', '6', '.', '.', '.', '.', '2', '8', '.'],
  ['.', '.', '.', '4', '1', '9', '.', '.', '5'],
  ['.', '.', '.', '.', '8', '.', '.', '7', '9'],
];
const SOLVED = ['534678912', '672195348', '198342567', '859761423', '426853791', '713924856', '961537284', '287419635', '345286179'].map((r) => r.split(''));
const EMPTY = Array.from({ length: 9 }, () => Array(9).fill('.'));
// copy of `base` with the given [row, col, value] cells overwritten
const withCells = (cells, base = VALID) => base.map((row, i) => row.map((x, j) => (cells.find(([r, c]) => r === i && c === j) || [0, 0, x])[2]));

export default {
  id: 'valid-sudoku',
  title: 'Valid Sudoku',
  difficulty: 'Medium',
  order: 4,
  pattern: 'hash-canonical-key',
  tags: ['matrix', 'hash set', 'composite key'],
  source: { platform: 'LeetCode', number: 36, url: 'https://leetcode.com/problems/valid-sudoku/' },

  statement: `A partially filled 9 × 9 Sudoku board is given as a grid of characters: digits \`'1'\`–\`'9'\` or \`'.'\` for an empty cell.

Return \`true\` if the **filled cells** break none of these rules:
1. Each row contains each digit at most once.
2. Each column contains each digit at most once.
3. Each of the nine 3 × 3 boxes contains each digit at most once.

You do **not** need to check whether the puzzle is solvable.`,
  examples: [
    { input: 'board = (the classic example puzzle)', output: 'true' },
    { input: 'board = same puzzle with the top-left 5 changed to 8', output: 'false', explanation: 'Two 8s in the first column (and in the top-left box).' },
  ],
  constraints: ['board.length == 9', 'board[i].length == 9', "board[i][j] is a digit '1'-'9' or '.'"],

  think: `- How do you compute which 3 × 3 box a cell (r, c) belongs to?
- Could a single Set hold all three kinds of facts ("5 is in row 2", "5 is in column 7", "5 is in box 1") without mixing them up?`,
  patternChallenge: {
    options: ['Backtracking', 'Canonical / composite keys in a Set', 'Graph BFS', 'Sort each row'],
    answer: 1,
    explanation: 'We only need to detect duplicates within groups. Encode each fact as a string key ("r2:5", "c7:5", "b1:5") and use a single Set. Backtracking would be for SOLVING the puzzle.',
  },
  hints: ['Box index = Math.floor(r / 3) * 3 + Math.floor(c / 3).', 'For each filled cell build three keys; if any is already in the Set, the board is invalid.'],
  approach: `Scan every cell once. For a digit d at (r, c), with \`b = Math.floor(r/3)*3 + Math.floor(c/3)\`, check and add the keys \`r{r}:{d}\`, \`c{c}:{d}\`, \`b{b}:{d}\`. Any repeat → false.

Alternative: 27 Sets (9 rows, 9 cols, 9 boxes), or 27 bitmasks. All are O(81) = O(1) for a fixed board size.`,

  functionName: 'isValidSudoku',
  paramNames: ['board'],
  starterCode: `/**
 * @param {character[][]} board
 * @return {boolean}
 */
function isValidSudoku(board) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The classic example puzzle: no row, column or box repeats a digit.', args: [VALID], expected: true },
    { scenario: 'Example 2', hint: 'The top-left 5 became 8: two 8s in column 0 and in the top-left box.', args: [withCells([[0, 0, '8']])], expected: false },
    { scenario: 'Empty board', hint: 'No filled cells, so no rule can be broken: true.', args: [EMPTY], expected: true },
    { scenario: 'Single digit on diagonal', hint: 'One 5 at (4, 4). If row and column facts share a key like "4:5", the cell clashes with itself.', args: [withCells([[4, 4, '5']], EMPTY)], expected: true },
    { scenario: 'Row duplicate only', hint: 'A second 7 in row 0, in a different column and box — only the row rule catches it.', args: [withCells([[0, 8, '7']])], expected: false },
    { scenario: 'Column duplicate only', hint: 'A second 5 in column 0, in a different row and box.', args: [withCells([[8, 0, '5']])], expected: false },
    { scenario: 'Box duplicate only', hint: 'A second 8 in the top-left box, in a different row and column. Index boxes with Math.floor(r / 3) * 3 + Math.floor(c / 3).', args: [withCells([[1, 1, '8']])], expected: false },
    { scenario: 'Box formula collision', hint: 'Two 2s in different boxes (top-middle and middle-left). A box index like floor(r/3) + floor(c/3) gives both the same box.', args: [withCells([[0, 5, '2'], [3, 2, '2']])], expected: true },
    { scenario: 'Valid digit added', hint: 'Adding a 4 at (0, 2) breaks no rule — still true.', args: [withCells([[0, 2, '4']])], expected: true },
    { scenario: 'Bottom-right box duplicate', hint: 'A second 5 in the last box: make sure your loops reach row 8 and column 8.', args: [withCells([[8, 6, '5']])], expected: false },
    { scenario: 'Fully solved board', hint: 'A complete, correct grid: every row, column and box holds 1–9 exactly once.', args: [SOLVED], expected: true },
    { scenario: 'Solved board, one change', hint: 'One cell of the solved grid changed from 5 to 3: duplicates appear in its row, column and box.', args: [withCells([[0, 1, '5'], [0, 0, '3']], SOLVED)], expected: false },
    { scenario: 'Valid but unsolvable', hint: 'Cell (0, 8) can hold nothing (1–8 are in its row, 9 in its column), yet no rule is broken. Do not try to solve — answer true.', args: [withCells([[0, 0, '1'], [0, 1, '2'], [0, 2, '3'], [0, 3, '4'], [0, 4, '5'], [0, 5, '6'], [0, 6, '7'], [0, 7, '8'], [4, 8, '9']], EMPTY)], expected: true },
  ],

  solution: {
    code: `function isValidSudoku(board) {
  const seen = new Set();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const d = board[r][c];
      if (d === '.') continue;
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      const keys = ['r' + r + ':' + d, 'c' + c + ':' + d, 'b' + b + ':' + d];
      for (const k of keys) {
        if (seen.has(k)) return false;   // same digit twice in a row/col/box
        seen.add(k);
      }
    }
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['cell', 'digit', 'keys', 'result'],
    rows: [['(0,0)', '8', 'r0:8, c0:8, b0:8', 'added'], ['…', '', '', ''], ['(3,0)', '8', 'r3:8, c0:8 ← already seen', 'false']],
  },
  complexity: { time: 'O(1) (81 cells)', space: 'O(1) (at most 243 keys)', explanation: 'Fixed-size board; for an n × n generalisation it is O(n²).' },
  alternative: {
    title: 'Bitmasks per row / column / box',
    md: 'Keep 27 integers; bit d marks that digit d was seen. Fast and compact.',
    code: `function isValidSudoku(board) {
  const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (board[r][c] === '.') continue;
    const bit = 1 << Number(board[r][c]);
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    if ((rows[r] | cols[c] | boxes[b]) & bit) return false;
    rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
  }
  return true;
}`,
    complexity: 'O(1) time and space',
  },
  mistakes: ['Wrong box formula (e.g. r / 3 + c / 3 without floor and ×3)', 'Mixing row and column facts under the same key ("2:5" for both)', 'Trying to solve the Sudoku'],
};
