export default {
  id: 'word-search',
  title: 'Word Search',
  difficulty: 'Medium',
  order: 9,
  pattern: 'backtracking-grid-path',
  tags: ['backtracking', 'matrix', 'dfs'],
  source: { platform: 'LeetCode', number: 79, url: 'https://leetcode.com/problems/word-search/' },

  statement: `You are given an \`m × n\` grid of letters \`board\` and a string \`word\`. Return \`true\` if \`word\` can be traced in the grid, otherwise \`false\`.

The word is traced by starting at any cell and moving step by step to a **horizontally or vertically adjacent** cell, reading one letter per cell. **A cell may not be used twice within the same word.**`,
  examples: [
    { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true' },
    { input: 'same board, word = "SEE"', output: 'true' },
    { input: 'same board, word = "ABCB"', output: 'false', explanation: 'The only B next to C is the one already used.' },
  ],
  constraints: ['1 <= m, n <= 6', '1 <= word.length <= 15', 'board and word consist of English letters'],

  think: `- What does one level of the recursion decide? What are its choices?
- How do you stop the path from stepping back onto a cell it already uses?
- After a failed attempt, why must that cell become usable again?`,
  patternChallenge: {
    options: ['Grid BFS (shortest path)', 'Backtracking — Grid path with mark and restore', 'Sliding Window', 'Union-Find'],
    answer: 1,
    explanation: 'We need a *simple path* matching the word; whether a cell is usable depends on the current path. That calls for DFS that marks a cell and unmarks it on the way back. BFS/flood fill mark cells permanently, which is wrong here.',
  },
  hints: [
    'Try every cell as a start. `dfs(r, c, k)` checks whether `word[k..]` can be traced starting at (r, c).',
    'In dfs: fail if out of bounds or `board[r][c] !== word[k]`. Otherwise temporarily set `board[r][c] = "#"`, try the 4 neighbours with `k + 1`, then restore the letter.',
  ],
  approach: `**Brute force idea:** enumerate every path of length L from every cell and compare — that is exactly what DFS does, but the key is to **stop as soon as a letter mismatches**.

**Backtracking:**
1. \`dfs(r, c, k)\`: if \`k === word.length\` → true.
2. If (r, c) is outside the grid or its letter ≠ \`word[k]\` → false (prune).
3. Mark the cell (overwrite with '#'), recurse into the 4 neighbours with \`k + 1\`, restore the letter, return whether any neighbour succeeded.

Optional pruning: if the board does not contain enough of some letter of the word, return false immediately; if the last letter of the word is rarer than the first, search the reversed word.`,

  functionName: 'exist',
  paramNames: ['board', 'word'],
  starterCode: `/**
 * @param {character[][]} board
 * @param {string} word
 * @return {boolean}
 */
function exist(board, word) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A path that turns corners: A→B→C→C→E→D.', args: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"ABCCED"], expected: true },
    { scenario: 'Example 2', hint: 'The word can start anywhere, not just at (0,0).', args: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"SEE"], expected: true },
    { scenario: 'Example 3', hint: 'The only B next to the second C is already used — a cell cannot be reused within one path.', args: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"ABCB"], expected: false },
    { scenario: 'Single cell match', hint: 'Smallest grid and word: 1×1 board, 1-letter word.', args: [[["a"]],"a"], expected: true },
    { scenario: 'Single cell reused', hint: '"aa" would need the same cell twice — return false.', args: [[["a"]],"aa"], expected: false },
    { scenario: 'Word ends at grid edge', hint: 'If you check bounds before checking "all letters matched", a word ending on the border is wrongly rejected.', args: [[["A","B"]],"AB"], expected: true },
    { scenario: 'Letter not on board', hint: 'A missing letter means false — make sure you do not index past the word.', args: [[["A","B"],["C","D"]],"ABE"], expected: false },
    { scenario: 'Case sensitive', hint: '"a" and "A" are different letters.', args: [[["a","A"]],"Aa"], expected: true },
    { scenario: 'Word longer than grid', hint: 'A 5-letter word cannot fit in 4 cells without reuse.', args: [[["a","b"],["c","d"]],"abdca"], expected: false },
    { scenario: 'Square path', hint: 'Moves are horizontal/vertical only; a→b→d→c goes around the square.', args: [[["a","b"],["c","d"]],"abdc"], expected: true },
    { scenario: 'No diagonal moves', hint: 'a→d is diagonal and not allowed.', args: [[["a","b"],["c","d"]],"ad"], expected: false },
    { scenario: 'Restore after dead end', hint: 'The first A tried leads nowhere; if you do not restore cells on the way back (or mark visited forever), later starts fail.', args: [[["C","A","A"],["A","A","A"],["B","C","D"]],"AAB"], expected: true },
    { scenario: 'Long winding path', hint: 'The path doubles back near earlier cells — restore each cell before returning, even on success paths.', args: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"ABCESEEEFS"], expected: false },
    { scenario: 'Max grid, worst case', hint: '6×6 of "A" and a 15-letter word ending in "B" that does not exist: prune on mismatch immediately and restore cells.', args: [[["A","A","A","A","A","A"],["A","A","A","A","A","A"],["A","A","A","A","A","A"],["A","A","A","A","A","A"],["A","A","A","A","A","A"],["A","A","A","A","A","A"]],"AAAAAAAAAAAAAAB"], expected: false },
  ],

  solution: {
    code: `function exist(board, word) {
  const rows = board.length, cols = board[0].length;

  // Cheap pruning: the board must contain enough of every letter.
  const count = new Map();
  for (const row of board) for (const ch of row) count.set(ch, (count.get(ch) ?? 0) + 1);
  const need = new Map();
  for (const ch of word) need.set(ch, (need.get(ch) ?? 0) + 1);
  for (const [ch, k] of need) if ((count.get(ch) ?? 0) < k) return false;

  // Start from the rarer end of the word (fewer starting points → less branching).
  if ((count.get(word[0]) ?? 0) > (count.get(word[word.length - 1]) ?? 0)) {
    word = [...word].reverse().join('');
  }

  function dfs(r, c, k) {
    if (k === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[k]) return false;
    const saved = board[r][c];
    board[r][c] = '#';                          // mark: on the current path
    const found = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) ||
                  dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    board[r][c] = saved;                        // restore for other paths
    return found;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }
  return false;
}`,
    explanation: 'The two pruning steps are optional but turn adversarial boards (all "A" with a missing "B") from exponential into instant.',
  },
  dryRun: {
    columns: ['cell', 'k', 'letter vs word[k]', 'action'],
    rows: [
      ['(0,0)', '0', 'A = A', 'mark, go right'],
      ['(0,1)', '1', 'B = B', 'mark, go right'],
      ['(0,2)', '2', 'C = C', 'mark, go down'],
      ['(1,2)', '3', 'C = C', 'mark, go down'],
      ['(2,2)', '4', 'E = E', 'mark, go left'],
      ['(2,1)', '5', 'D = D', 'k becomes 6 = length → true (all cells restored on the way back)'],
    ],
  },
  complexity: { time: 'O(m · n · 3^L)', space: 'O(L) recursion depth', explanation: 'Each of the m·n starts can branch into 4 neighbours first and at most 3 afterwards (it cannot go back), for L = word length levels.' },
  alternative: {
    title: 'Separate visited matrix',
    md: 'Instead of overwriting the board, keep `visited[r][c]` booleans and set/unset them. Clearer if you must not modify the input; same complexity, O(m·n) extra space.',
    complexity: 'O(m · n · 3^L) time, O(m · n) space',
  },
  mistakes: [
    'Not restoring the cell → later searches see "#" and fail.',
    'Marking visited forever (flood-fill style) — blocks valid alternative paths.',
    'Checking `k === word.length` after the bounds check (fails when the word ends at the grid edge).',
    'Returning early from inside the loop *before* restoring the cell (always restore, then return).',
  ],
};
