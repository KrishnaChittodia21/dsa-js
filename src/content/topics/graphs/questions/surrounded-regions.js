export default {
  id: 'surrounded-regions',
  title: 'Surrounded Regions',
  difficulty: 'Medium',
  order: 7,
  pattern: 'grid-graph-traversal',
  tags: ['grid', 'dfs', 'bfs', 'reverse thinking'],
  source: { platform: 'LeetCode', number: 130, url: 'https://leetcode.com/problems/surrounded-regions/' },

  statement: `You are given an \`m x n\` board of \`'X'\` and \`'O'\`. A **region** is a 4-directionally connected group of \`'O'\` cells. A region is **surrounded** if none of its cells lies on the border of the board.

Capture every surrounded region by flipping all its \`'O'\`s to \`'X'\`. Modify \`board\` **in place** (return nothing).`,
  examples: [
    { input: 'board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]', output: '[["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]', explanation: 'The bottom O touches the border, so it survives.' },
    { input: 'board = [["X"]]', output: '[["X"]]' },
  ],
  constraints: ['1 <= m, n <= 200', "board[i][j] is 'X' or 'O'"],

  think: `- Deciding for each region whether it touches the border means exploring it. Is there a cheaper way to find every **safe** O at once?
- Where do safe regions have to come from?`,
  patternChallenge: {
    options: ['Grid traversal starting from the border (reverse thinking)', 'Sliding Window', 'Backtracking', 'Binary Search'],
    answer: 0,
    explanation: 'A region survives iff it is connected to a border O. So traverse from every border O and mark what you reach; everything unmarked is captured. That is one traversal of the grid instead of one per region.',
  },
  hints: [
    'Every O that is connected to a border O survives. Start a DFS/BFS from each O on the border and mark those cells (e.g. as "S").',
    'Then scan: remaining O → X (captured), S → O (restore).',
  ],
  approach: `**Direct approach:** for each unvisited O region, traverse it and remember whether any cell was on the border; flip the region if not. Correct, O(m·n), but needs bookkeeping.

**Reverse thinking (cleaner):** safe cells are exactly those reachable from a border O. BFS from all border O cells, marking them \`'S'\`. Then one pass: \`'O'\` → \`'X'\`, \`'S'\` → \`'O'\`. O(m·n) time. BFS (not recursion) keeps a 200×200 board safe.`,

  functionName: 'solve',
  paramNames: ['board'],
  io: { mutates: 0 },
  starterCode: `/**
 * @param {character[][]} board
 * @return {void} Do not return anything, modify board in-place instead.
 */
function solve(board) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The inner region is captured; the bottom O touches the border and survives.', args: [[['X', 'X', 'X', 'X'], ['X', 'O', 'O', 'X'], ['X', 'X', 'O', 'X'], ['X', 'O', 'X', 'X']]], expected: [['X', 'X', 'X', 'X'], ['X', 'X', 'X', 'X'], ['X', 'X', 'X', 'X'], ['X', 'O', 'X', 'X']] },
    { scenario: 'Example 2', hint: 'A single X: nothing to capture.', args: [[['X']]], expected: [['X']] },
    { scenario: 'Single O', hint: 'A lone O is on the border, so it survives.', args: [[['O']]], expected: [['O']] },
    { scenario: 'All O on the border', hint: 'In a 2×2 board every cell is a border cell.', args: [[['O', 'O'], ['O', 'O']]], expected: [['O', 'O'], ['O', 'O']] },
    { scenario: 'One surrounded cell', hint: 'The centre O is enclosed: flip it in place (the function returns nothing).', args: [[['X', 'X', 'X'], ['X', 'O', 'X'], ['X', 'X', 'X']]], expected: [['X', 'X', 'X'], ['X', 'X', 'X'], ['X', 'X', 'X']] },
    { scenario: 'Region reaches the border', hint: 'The inner O at (1,2) is not on the border itself, but its region connects to (0,1). Check the whole region, not single cells.', args: [[['X', 'O', 'X', 'X'], ['X', 'O', 'O', 'X'], ['X', 'X', 'X', 'X'], ['X', 'O', 'O', 'X'], ['X', 'X', 'X', 'X']]], expected: [['X', 'O', 'X', 'X'], ['X', 'O', 'O', 'X'], ['X', 'X', 'X', 'X'], ['X', 'X', 'X', 'X'], ['X', 'X', 'X', 'X']] },
    { scenario: 'Diagonal does not connect', hint: 'The centre O touches border Os only diagonally — it is still captured.', args: [[['O', 'X', 'O'], ['X', 'O', 'X'], ['O', 'X', 'O']]], expected: [['O', 'X', 'O'], ['X', 'X', 'X'], ['O', 'X', 'O']] },
    { scenario: 'Single row', hint: 'In one row every cell is on the border: nothing changes.', args: [[['O', 'X', 'O', 'O', 'X']]], expected: [['O', 'X', 'O', 'O', 'X']] },
    { scenario: 'Single column', hint: 'Every cell in a single column is on the border.', args: [[['O'], ['X'], ['O']]], expected: [['O'], ['X'], ['O']] },
    { scenario: 'Long path to border', hint: 'A winding region escapes to the border through a long corridor — all of it survives.', args: [[['X', 'X', 'X', 'X', 'X'], ['X', 'O', 'O', 'O', 'X'], ['X', 'X', 'X', 'O', 'X'], ['X', 'O', 'O', 'O', 'X'], ['X', 'O', 'X', 'X', 'X']]], expected: [['X', 'X', 'X', 'X', 'X'], ['X', 'O', 'O', 'O', 'X'], ['X', 'X', 'X', 'O', 'X'], ['X', 'O', 'O', 'O', 'X'], ['X', 'O', 'X', 'X', 'X']] },
    { scenario: 'Two inner regions', hint: 'Two separate enclosed regions are both captured.', args: [[['X', 'X', 'X', 'X', 'X', 'X'], ['X', 'O', 'X', 'X', 'O', 'X'], ['X', 'O', 'X', 'X', 'O', 'X'], ['X', 'X', 'X', 'X', 'X', 'X']]], expected: [['X', 'X', 'X', 'X', 'X', 'X'], ['X', 'X', 'X', 'X', 'X', 'X'], ['X', 'X', 'X', 'X', 'X', 'X'], ['X', 'X', 'X', 'X', 'X', 'X']] },
    { scenario: 'Large all-O board (100×100)', hint: 'One giant region of 10^4 cells touching the border: recursive DFS overflows the call stack here. Use an explicit queue or stack.', argsGen: '() => [Array.from({ length: 100 }, () => new Array(100).fill("O"))]', expectedGen: "() => Array.from({ length: 100 }, () => new Array(100).fill('O'))", timeLimitMs: 1000 },
  ],

  solution: {
    code: `function solve(board) {
  const R = board.length, C = board[0].length;
  const queue = [];
  const markSafe = (r, c) => {
    if (board[r][c] === 'O') { board[r][c] = 'S'; queue.push([r, c]); }
  };
  // 1. seed with every border O
  for (let r = 0; r < R; r++) { markSafe(r, 0); markSafe(r, C - 1); }
  for (let c = 0; c < C; c++) { markSafe(0, c); markSafe(R - 1, c); }

  // 2. BFS inward: everything reachable from the border is safe
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C) markSafe(nr, nc);
    }
  }

  // 3. capture the rest, restore the safe ones
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      board[r][c] = board[r][c] === 'S' ? 'O' : 'X';
}`,
    explanation: "Step 3 works because after step 2 every cell is 'X', 'S' (safe O) or 'O' (surrounded).",
  },
  dryRun: { columns: ['step', 'board effect'], rows: [['seed border', "(3,1) is a border O → 'S'"], ['BFS', "(3,1) has no O neighbours; nothing more"], ['final pass', "(1,1),(1,2),(2,2) are still 'O' → 'X'; (3,1) 'S' → 'O'"]] },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Each cell is marked at most once; the queue can hold O(m·n) cells.' },
  alternative: { title: 'Per-region DFS with a border flag', md: 'Traverse each O region, collect its cells and whether it touches the border; flip the collected cells if not. Same complexity, more code.', complexity: 'O(m·n) time and space' },
  mistakes: [
    'Returning a new board instead of modifying the given one.',
    'Only checking whether a single O is on the border rather than its whole region.',
    'Recursive DFS on a 200×200 board of O → stack overflow risk.',
  ],
};
