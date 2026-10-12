export default {
  id: 'n-queens',
  title: 'N-Queens',
  difficulty: 'Hard',
  order: 1,
  pattern: 'backtracking-constraint',
  tags: ['backtracking', 'constraint satisfaction', 'hash set'],
  source: { platform: 'LeetCode', number: 51, url: 'https://leetcode.com/problems/n-queens/' },

  statement: `Place \`n\` chess queens on an \`n × n\` board so that **no two queens attack each other** — no two share a row, a column, or a diagonal.

Return **all distinct solutions**, in any order. Each solution is a list of \`n\` strings, one per row, where \`'Q'\` marks a queen and \`'.'\` an empty square.`,
  examples: [
    { input: 'n = 4', output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]', explanation: 'The two ways to place 4 non-attacking queens.' },
    { input: 'n = 1', output: '[["Q"]]' },
  ],
  constraints: ['1 <= n <= 9'],

  think: `- Two queens in the same row always attack. What does that tell you about how many queens each row holds — and what one level of the recursion should decide?
- How can you tell in O(1) that a square is on an occupied diagonal? What is constant along a "\\\\" diagonal? Along a "/" one?
- What must be undone when you remove a queen?`,
  patternChallenge: {
    options: ['Backtracking — Permutations only', 'Greedy placement', 'Backtracking — Constraint satisfaction with column/diagonal Sets', 'Dynamic Programming on rows'],
    answer: 2,
    explanation: 'List all placements satisfying pairwise rules → constraint backtracking. One queen per row; for each row try each column that passes three O(1) Set checks. It *is* a permutation of columns, but plain permutations would generate all n! and filter afterwards instead of pruning diagonals early. Greedy fails because early choices can make later rows impossible.',
  },
  hints: [
    'Recurse row by row: `place(row)` tries every column `c`. Keep Sets `cols`, `diag` (row − c) and `anti` (row + c).',
    'A square is safe if none of the three Sets contain its key. Add all three keys + record the column, recurse on `row + 1`, then delete all three and pop. Build the strings only when `row === n`.',
  ],
  approach: `**Brute force:** try all C(n², n) ways to put n queens on the board, or all nⁿ "one per row" placements, and test each — hopeless beyond n = 6.

**Constraint backtracking:**
1. One queen per row → level = row, choice = column.
2. Squares on the same "\\\\" diagonal share \`row − col\`; on the same "/" diagonal they share \`row + col\`. Keep a Set for columns and one for each diagonal type.
3. For each column: skip if any Set has its key; otherwise place (add keys, push column), recurse, and remove (delete keys, pop).
4. At \`row === n\`, convert the column list to strings: \`'.'.repeat(c) + 'Q' + '.'.repeat(n − c − 1)\`.`,

  functionName: 'solveNQueens',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {string[][]}
 */
function solveNQueens(n) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'Exactly two boards for n = 4; each row is a string with one "Q".', args: [4], expected: [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]] },
    { scenario: 'Example 2', hint: 'Smallest board: one queen on a 1×1 board.', args: [1], expected: [["Q"]] },
    { scenario: 'No solution (n = 2)', hint: 'Two queens always attack each other — return [].', args: [2], expected: [] },
    { scenario: 'No solution (n = 3)', hint: 'Also impossible. Make sure you only record a board when every row has a queen.', args: [3], expected: [] },
    { scenario: 'Five queens', hint: '10 boards. Keying diagonals by Math.abs(row − col) merges different diagonals and loses solutions.', args: [5], expected: [["Q....","..Q..","....Q",".Q...","...Q."],["Q....","...Q.",".Q...","....Q","..Q.."],[".Q...","...Q.","Q....","..Q..","....Q"],[".Q...","....Q","..Q..","Q....","...Q."],["..Q..","Q....","...Q.",".Q...","....Q"],["..Q..","....Q",".Q...","...Q.","Q...."],["...Q.","Q....","..Q..","....Q",".Q..."],["...Q.",".Q...","....Q","..Q..","Q...."],["....Q",".Q...","...Q.","Q....","..Q.."],["....Q","..Q..","Q....","...Q.",".Q..."]] },
    { scenario: 'Six queens', hint: 'Only 4 boards. Forgetting to remove a column/diagonal on undo blocks later placements.', args: [6], expected: [[".Q....","...Q..",".....Q","Q.....","..Q...","....Q."],["..Q...",".....Q",".Q....","....Q.","Q.....","...Q.."],["...Q..","Q.....","....Q.",".Q....",".....Q","..Q..."],["....Q.","..Q...","Q.....",".....Q","...Q..",".Q...."]] },
    { scenario: 'Seven queens (count)', hint: '40 boards. Check both diagonal directions: row − col and row + col.', args: [7], expected: 40 },
    { scenario: 'Seven queens (full list)', hint: 'Every one of the 40 boards must be distinct and valid.', args: [7], expected: [["Q......","..Q....","....Q..","......Q",".Q.....","...Q...",".....Q."],["Q......","...Q...","......Q","..Q....",".....Q.",".Q.....","....Q.."],["Q......","....Q..",".Q.....",".....Q.","..Q....","......Q","...Q..."],["Q......",".....Q.","...Q...",".Q.....","......Q","....Q..","..Q...."],[".Q.....","...Q...","Q......","......Q","....Q..","..Q....",".....Q."],[".Q.....","...Q...",".....Q.","Q......","..Q....","....Q..","......Q"],[".Q.....","....Q..","Q......","...Q...","......Q","..Q....",".....Q."],[".Q.....","....Q..","..Q....","Q......","......Q","...Q...",".....Q."],[".Q.....","....Q..","......Q","...Q...","Q......","..Q....",".....Q."],[".Q.....",".....Q.","..Q....","......Q","...Q...","Q......","....Q.."],[".Q.....","......Q","....Q..","..Q....","Q......",".....Q.","...Q..."],["..Q....","Q......",".....Q.",".Q.....","....Q..","......Q","...Q..."],["..Q....","Q......",".....Q.","...Q...",".Q.....","......Q","....Q.."],["..Q....","....Q..","......Q",".Q.....","...Q...",".....Q.","Q......"],["..Q....",".....Q.",".Q.....","....Q..","Q......","...Q...","......Q"],["..Q....","......Q",".Q.....","...Q...",".....Q.","Q......","....Q.."],["..Q....","......Q","...Q...","Q......","....Q..",".Q.....",".....Q."],["...Q...","Q......","..Q....",".....Q.",".Q.....","......Q","....Q.."],["...Q...","Q......","....Q..",".Q.....",".....Q.","..Q....","......Q"],["...Q...",".Q.....","......Q","....Q..","..Q....","Q......",".....Q."],["...Q...",".....Q.","Q......","..Q....","....Q..","......Q",".Q....."],["...Q...","......Q","..Q....",".....Q.",".Q.....","....Q..","Q......"],["...Q...","......Q","....Q..",".Q.....",".....Q.","Q......","..Q...."],["....Q..","Q......","...Q...","......Q","..Q....",".....Q.",".Q....."],["....Q..","Q......",".....Q.","...Q...",".Q.....","......Q","..Q...."],["....Q..",".Q.....",".....Q.","..Q....","......Q","...Q...","Q......"],["....Q..","..Q....","Q......",".....Q.","...Q...",".Q.....","......Q"],["....Q..","......Q",".Q.....","...Q...",".....Q.","Q......","..Q...."],["....Q..","......Q",".Q.....",".....Q.","..Q....","Q......","...Q..."],[".....Q.","Q......","..Q....","....Q..","......Q",".Q.....","...Q..."],[".....Q.",".Q.....","....Q..","Q......","...Q...","......Q","..Q...."],[".....Q.","..Q....","Q......","...Q...","......Q","....Q..",".Q....."],[".....Q.","..Q....","....Q..","......Q","Q......","...Q...",".Q....."],[".....Q.","..Q....","......Q","...Q...","Q......","....Q..",".Q....."],[".....Q.","...Q...",".Q.....","......Q","....Q..","..Q....","Q......"],[".....Q.","...Q...","......Q","Q......","..Q....","....Q..",".Q....."],["......Q",".Q.....","...Q...",".....Q.","Q......","..Q....","....Q.."],["......Q","..Q....",".....Q.",".Q.....","....Q..","Q......","...Q..."],["......Q","...Q...","Q......","....Q..",".Q.....",".....Q.","..Q...."],["......Q","....Q..","..Q....","Q......",".....Q.","...Q...",".Q....."]] },
    { scenario: 'Eight queens', hint: 'The classic: 92 boards. Build board strings only at the leaf, not at every step.', args: [8], expected: 92 },
    { scenario: 'Max n (9)', hint: '352 boards. O(1) conflict checks with Sets keep this fast; scanning all previous queens works but is slower.', args: [9], expected: 352 },
  ],
  // Small n: exact comparison of the (unordered) list of boards.
  // n = 8, 9: the expected value is the number of solutions; every board is also validated.
  checker: `(output, args, expected) => {
    if (!Array.isArray(output)) return false;
    const n = args[0];
    const key = (b) => JSON.stringify(b);
    const valid = (b) => {
      if (!Array.isArray(b) || b.length !== n) return false;
      const cs = new Set(), d1 = new Set(), d2 = new Set();
      for (let r = 0; r < n; r++) {
        const row = b[r];
        if (typeof row !== 'string' || row.length !== n) return false;
        const c = row.indexOf('Q');
        if (c === -1 || row.lastIndexOf('Q') !== c || row.replace('Q', '').replace(/\\./g, '') !== '') return false;
        if (cs.has(c) || d1.has(r - c) || d2.has(r + c)) return false;
        cs.add(c); d1.add(r - c); d2.add(r + c);
      }
      return true;
    };
    if (!output.every(valid) || new Set(output.map(key)).size !== output.length) return false;
    if (typeof expected === 'number') return output.length === expected;
    return JSON.stringify(output.map(key).sort()) === JSON.stringify(expected.map(key).sort());
  }`,

  solution: {
    code: `function solveNQueens(n) {
  const cols = new Set();
  const diag = new Set();   // row - col is constant on each top-left → bottom-right diagonal
  const anti = new Set();   // row + col is constant on each top-right → bottom-left diagonal
  const queenCol = [];      // queenCol[row] = column of the queen in that row
  const result = [];

  function place(row) {
    if (row === n) {
      result.push(queenCol.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag.has(row - c) || anti.has(row + c)) continue; // attacked
      cols.add(c); diag.add(row - c); anti.add(row + c); queenCol.push(c);   // choose
      place(row + 1);                                                          // explore
      cols.delete(c); diag.delete(row - c); anti.delete(row + c); queenCol.pop(); // undo
    }
  }

  place(0);
  return result;
}`,
  },
  dryRun: {
    columns: ['row', 'queens so far (cols)', 'try col', 'result'],
    rows: [
      ['0', '[]', '0', 'safe → place'],
      ['1', '[0]', '0 ✗ col, 1 ✗ diag, 2', 'safe → place'],
      ['2', '[0,2]', '0 ✗,1 ✗,2 ✗,3 ✗', 'dead end → undo col 2'],
      ['1', '[0]', '3', 'safe → place'],
      ['2', '[0,3]', '1', 'safe → place'],
      ['3', '[0,3,1]', '0..3 all attacked', 'dead end → backtrack to row 0'],
      ['0', '[]', '1', '… leads to [1,3,0,2] = ".Q..","...Q","Q...","..Q."'],
    ],
  },
  complexity: { time: 'O(n!)', space: 'O(n)', explanation: 'Row 0 has n choices, row 1 at most n − 1 safe columns, and so on → at most n! leaves; building each solution costs O(n²) but solutions are few. Sets and recursion are O(n).' },
  alternative: {
    title: 'Bitmasks',
    md: 'Represent columns, diagonals and anti-diagonals as integers. Available squares in the current row: `~(cols | d1 | d2) & ((1 << n) − 1)`. Take the lowest set bit with `x & -x`, recurse with `d1` shifted left and `d2` shifted right. Same complexity, much faster constants.',
    complexity: 'O(n!) time, O(n) space',
  },
  mistakes: [
    'Using `Math.abs(row - col)` as the diagonal key — (0,1) and (1,0) would collide although they are on different diagonals.',
    'Forgetting to delete from one of the three Sets on undo.',
    'Building board strings at every step instead of only at the leaf.',
    'Checking conflicts by scanning all previous queens (O(n) per check) — correct but slower.',
  ],
};
