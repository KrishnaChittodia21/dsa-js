export default {
  id: 'sudoku-solver',
  title: 'Sudoku Solver',
  difficulty: 'Hard',
  order: 2,
  pattern: 'backtracking-constraint',
  tags: ['backtracking', 'matrix', 'hash set', 'constraint satisfaction'],
  source: { platform: 'LeetCode', number: 37, url: 'https://leetcode.com/problems/sudoku-solver/' },

  statement: `Fill in a 9 × 9 Sudoku \`board\` **in place**. Empty cells contain \`'.'\`; filled cells contain \`'1'\`–\`'9'\` (as strings).

A solved board satisfies:
1. every **row** contains each digit 1–9 exactly once;
2. every **column** contains each digit 1–9 exactly once;
3. each of the nine **3 × 3 boxes** contains each digit 1–9 exactly once.

The given puzzle is guaranteed to have exactly one solution. The function returns nothing — the board itself is checked.`,
  examples: [
    {
      input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]',
      output: '[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]',
    },
  ],
  constraints: ['board.length === 9 and board[i].length === 9', "board[i][j] is a digit '1'-'9' or '.'", 'The puzzle has exactly one solution'],

  think: `- What does one level of the recursion decide? How many choices does it have?
- How can "is digit d allowed at (r, c)?" be answered in O(1) instead of scanning a row, a column and a box?
- Once the last empty cell is filled, how do you make sure the digits are **not** undone on the way back?`,
  patternChallenge: {
    options: ['Backtracking — Constraint satisfaction (row/column/box Sets, stop at first solution)', 'Greedy: fill each cell with the smallest allowed digit', 'Grid BFS', 'Dynamic Programming'],
    answer: 0,
    explanation: 'Fill slots one at a time, check three constraints in O(1), undo on dead ends, and stop at the first full board. Greedy fails because an early "allowed" digit can make a later cell impossible — that is exactly why we need to backtrack.',
  },
  hints: [
    'Pre-scan: build `rows[r]`, `cols[c]`, `boxes[b]` as Sets of used digits (b = `Math.floor(r/3)*3 + Math.floor(c/3)`) and collect the list of empty cells.',
    '`fill(k)` handles the k-th empty cell: try digits 1–9 that no Set contains; place (update board + 3 Sets), and `if (fill(k + 1)) return true`; otherwise undo. `fill(empty.length)` returns true.',
  ],
  approach: `**Brute force:** try every digit in every empty cell and check the full board at the end — 9^(empty) boards, impossibly many.

**Constraint backtracking:**
1. Collect the empty cells once; keep Sets for rows, columns and boxes so each validity check is O(1).
2. \`fill(k)\`: if \`k === empty.length\` → solved, return \`true\`.
3. For the k-th empty cell try each digit not in its row/column/box Set. Place it, recurse; **if the recursion returns true, return true immediately** (no undo → the solution stays on the board). Otherwise undo and try the next digit.
4. If no digit works, return \`false\` so the previous cell tries its next digit.

**Better pruning (optional):** always fill the empty cell with the **fewest** candidates next ("most constrained variable" heuristic). This dramatically reduces branching on hard puzzles.`,

  functionName: 'solveSudoku',
  paramNames: ['board'],
  starterCode: `/**
 * @param {character[][]} board
 * @return {void} Do not return anything, modify board in-place instead.
 */
function solveSudoku(board) {
  
}
`,
  io: { mutates: 0 },
  // Accept any completed board that keeps the givens and satisfies all Sudoku rules.
  checker: `(output, args) => {
    const given = args[0];
    if (!Array.isArray(output) || output.length !== 9) return false;
    for (let r = 0; r < 9; r++) {
      if (!Array.isArray(output[r]) || output[r].length !== 9) return false;
      for (let c = 0; c < 9; c++) {
        const v = output[r][c];
        if (typeof v !== 'string' || !/^[1-9]$/.test(v)) return false;
        if (given[r][c] !== '.' && given[r][c] !== v) return false;
      }
    }
    for (let i = 0; i < 9; i++) {
      const row = new Set(), col = new Set(), box = new Set();
      for (let j = 0; j < 9; j++) {
        row.add(output[i][j]);
        col.add(output[j][i]);
        box.add(output[Math.floor(i / 3) * 3 + Math.floor(j / 3)][(i % 3) * 3 + (j % 3)]);
      }
      if (row.size !== 9 || col.size !== 9 || box.size !== 9) return false;
    }
    return true;
  }`,
  tests: [
    { scenario: 'Example 1', hint: 'The standard puzzle. Fill the board in place — the original array is what gets checked.', args: [[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]], expected: [["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]] },
    { scenario: 'One empty cell', hint: 'Only one cell to fill. Do not undo the placement after the recursive call succeeds.', args: [[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6",".","7","9"]]], expected: [["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]] },
    { scenario: 'Already solved', hint: 'No empty cells: your search must stop immediately and leave the board unchanged.', args: [[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]], expected: [["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]] },
    { scenario: 'First cell empty', hint: 'The very first cell (0,0) and its neighbours are blank — make sure your scan starts at row 0, column 0.', args: [[[".",".",".","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]], expected: [["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]] },
    { scenario: 'Last cell empty', hint: 'The bottom-right cell is blank — make sure your loops reach index 8 in both directions.', args: [[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","."],["3","4","5","2","8","6",".",".","."]]], expected: [["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]] },
    { scenario: 'Whole row empty', hint: 'A full row of blanks: each value is forced by its column and box. Write strings ("5"), not numbers.', args: [[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],[".",".",".",".",".",".",".",".","."],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]], expected: [["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]] },
    { scenario: 'Whole column empty', hint: 'A full blank column — the column check must look at all 9 rows.', args: [[[".","3","4","6","7","8","9","1","2"],[".","7","2","1","9","5","3","4","8"],[".","9","8","3","4","2","5","6","7"],[".","5","9","7","6","1","4","2","3"],[".","2","6","8","5","3","7","9","1"],[".","1","3","9","2","4","8","5","6"],[".","6","1","5","3","7","2","8","4"],[".","8","7","4","1","9","6","3","5"],[".","4","5","2","8","6","1","7","9"]]], expected: [["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]] },
    { scenario: 'Whole box empty', hint: 'The middle 3×3 box is blank. A wrong box index (forgetting Math.floor) checks the wrong cells.', args: [[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9",".",".",".","4","2","3"],["4","2","6",".",".",".","7","9","1"],["7","1","3",".",".",".","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]], expected: [["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]] },
    { scenario: 'Typical puzzle', hint: 'A normal puzzle with 49 blanks — backtrack when a cell has no legal digit.', args: [[[".",".","3",".","2",".","6",".","."],["9",".",".","3",".","5",".",".","1"],[".",".","1","8",".","6","4",".","."],[".",".","8","1",".","2","9",".","."],["7",".",".",".",".",".",".",".","8"],[".",".","6","7",".","8","2",".","."],[".",".","2","6",".","9","5",".","."],["8",".",".","2",".","3",".",".","9"],[".",".","5",".","1",".","3",".","."]]], expected: [["4","8","3","9","2","1","6","5","7"],["9","6","7","3","4","5","8","2","1"],["2","5","1","8","7","6","4","9","3"],["5","4","8","1","3","2","9","7","6"],["7","2","9","5","6","4","1","3","8"],["1","3","6","7","9","8","2","4","5"],["3","7","2","6","8","9","5","1","4"],["8","1","4","2","5","3","7","6","9"],["6","9","5","4","1","7","3","8","2"]] },
    { scenario: 'Sparse puzzle', hint: '54 blanks: undo every placement on the way back from a dead end.', args: [[[".",".","9","7","4","8",".",".","."],["7",".",".",".",".",".",".",".","."],[".","2",".","1",".","9",".",".","."],[".",".","7",".",".",".","2","4","."],[".","6","4",".","1",".","5","9","."],[".","9","8",".",".",".","3",".","."],[".",".",".","8",".","3",".","2","."],[".",".",".",".",".",".",".",".","6"],[".",".",".","2","7","5","9",".","."]]], expected: [["5","1","9","7","4","8","6","3","2"],["7","8","3","6","5","2","4","1","9"],["4","2","6","1","3","9","8","7","5"],["3","5","7","9","8","6","2","4","1"],["2","6","4","3","1","7","5","9","8"],["1","9","8","5","2","4","3","6","7"],["9","7","5","8","6","3","1","2","4"],["8","3","2","4","9","1","7","5","6"],["6","4","1","2","7","5","9","8","3"]] },
    { scenario: 'Hard puzzle (60 blanks)', hint: 'A famously hard puzzle that needs deep backtracking. Fast O(1) row/column/box checks help.', args: [[["8",".",".",".",".",".",".",".","."],[".",".","3","6",".",".",".",".","."],[".","7",".",".","9",".","2",".","."],[".","5",".",".",".","7",".",".","."],[".",".",".",".","4","5","7",".","."],[".",".",".","1",".",".",".","3","."],[".",".","1",".",".",".",".","6","8"],[".",".","8","5",".",".",".","1","."],[".","9",".",".",".",".","4",".","."]]], expected: [["8","1","2","7","5","3","6","4","9"],["9","4","3","6","8","2","1","7","5"],["6","7","5","4","9","1","2","8","3"],["1","5","4","2","3","7","8","9","6"],["3","6","9","8","4","5","7","2","1"],["2","8","7","1","6","9","5","3","4"],["5","2","1","9","7","4","3","6","8"],["4","3","8","5","2","6","9","1","7"],["7","9","6","3","1","8","4","5","2"]] },
  ],

  solution: {
    code: `function solveSudoku(board) {
  const rows = Array.from({ length: 9 }, () => new Set());
  const cols = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());
  const boxOf = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
  const empty = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v === '.') empty.push([r, c]);
      else { rows[r].add(v); cols[c].add(v); boxes[boxOf(r, c)].add(v); }
    }
  }

  function fill(k) {
    if (k === empty.length) return true;            // every cell filled
    const [r, c] = empty[k];
    const b = boxOf(r, c);
    for (let d = 1; d <= 9; d++) {
      const ch = String(d);
      if (rows[r].has(ch) || cols[c].has(ch) || boxes[b].has(ch)) continue;
      board[r][c] = ch; rows[r].add(ch); cols[c].add(ch); boxes[b].add(ch);        // choose
      if (fill(k + 1)) return true;                                                 // solved: keep it
      board[r][c] = '.'; rows[r].delete(ch); cols[c].delete(ch); boxes[b].delete(ch); // undo
    }
    return false;                                   // no digit fits → previous cell must change
  }

  fill(0);
}`,
  },
  dryRun: `For the example board the first empty cell is (0,2). Its row has {5,3,7}, its column {8,9} and its box {5,3,6,9,8}:

| step | cell | candidates | action |
|---|---|---|---|
| 1 | (0,2) | 1, 2, 4 | try 1 → recurse |
| 2 | (0,3) | 2, 6 | try 2 → recurse … |
| … | … | none left | return false → undo 2, try 6 … |
| n | last cell | 1 candidate | place → fill(k+1) = true → true bubbles up, nothing is undone |

The final board is the unique solution shown in the example.`,
  complexity: { time: 'O(9^m) worst case, m = empty cells', space: 'O(m)', explanation: 'Each empty cell has at most 9 options. The board size is fixed (81), so in practice this is bounded; the Sets make each check O(1). Recursion depth equals the number of empty cells.' },
  alternative: {
    title: 'Most-constrained cell first + bitmasks',
    md: 'Keep 9-bit masks per row/column/box. At each step scan the empty cells, pick the one with the fewest free bits (popcount), and try only those digits. Near-instant even on the hardest published puzzles.',
    complexity: 'Same worst case, far smaller in practice',
  },
  mistakes: [
    'Undoing after a successful recursive call — the board ends up back at the puzzle.',
    'Wrong box index (e.g. `r / 3 * 3 + c / 3` without `Math.floor`).',
    'Storing numbers instead of strings on the board ("5" vs 5).',
    'Returning the board instead of mutating it (the caller checks the original array).',
  ],
};
